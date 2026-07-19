# Submission Notes

Explains what was built, how it maps to the requirements, and the reasoning behind key decisions. Written to be lifted directly into a submission writeup.

---

## Phase 1 — AI Tools (Web Search + YouTube)

### Requirement → implementation

| Requirement | How it's met |
|---|---|
| Integrate at least one web search tool | `searchWeb` tool (`features/ai/tools/web-search.ts`), backed by the **Tavily Search API**. A second tool, `searchYouTube` (`features/ai/tools/youtube.ts`, YouTube Data API v3), was added earlier for video search — so the model has two real external tools, not one. |
| Allow the LLM to decide when to call the tool | Tools are passed to `streamText({ tools: {...} })` in `app/api/chat/route.ts`; the model chooses whether/when to invoke them based on the system prompt and the user's message. No client-side "search now" trigger — it's genuine tool-calling, not a hardcoded branch. |
| Stream tool execution and the final response | AI SDK v7's `stopWhen: stepCountIs(3)` lets the model call a tool, receive the result, and continue generating in the same streamed response (multi-step tool loop). The UI (`chat-messages.tsx`) renders each tool part's state live — `input-streaming`/`input-available` → "Searching the web…" spinner, `output-available` → result cards, all before the model's final answer streams in. |
| Store tool calls and tool responses | Nothing tool-specific needed — `UIMessage.parts` (which includes tool-call and tool-result parts, not just text) is persisted verbatim as JSON in `Message.parts` in Postgres (`features/ai/actions/chat-store.ts`). Reloading a conversation replays the exact tool call/result history, not just the final text. |
| Handle loading and error states gracefully | Each tool part renders three states explicitly: loading (spinner + label), success (result cards), and `output-error` (a visible error line with `errorText`) — see the `tool-searchWeb` / `tool-searchYouTube` branches in `chat-messages.tsx`. |

### Notable decisions

- **Web search is opt-in, not always-on.** A toggle in the composer (default off) controls whether `searchWeb` is even included in the `tools` object sent to `streamText`. This mirrors ChatGPT's own UX and means the model literally cannot reach for the tool unless the user turned it on — enforced server-side, not just hidden in the UI.
- **AI SDK version mismatch caught early.** The repo pins `ai@7.0.31`, which changed several APIs since the version the model architecture was trained on (`tool({ parameters })` → `tool({ inputSchema })`, `maxSteps` → `stopWhen: stepCountIs(n)`, and the UI message tool-part shape moved from `tool-invocation` with `state: "call"/"result"` to per-tool `tool-${name}` parts with `input-streaming`/`input-available`/`output-available`/`output-error`). Confirmed directly against the installed package's `.d.ts` rather than assumed from memory, since `AGENTS.md` flags this as a modified Next.js/AI SDK setup.
- **Model was told not to re-render tool output as text.** Early testing showed the model repeating YouTube thumbnails as markdown images in its own reply — since the tool result is already rendered as a card, this caused duplicate content and even a React hydration crash (`<img>`/`<div>` nested inside a markdown `<p>`). Fixed by instructing the system prompt not to restate cards/images, only to add commentary.

---

## Phase 2 — Conversation Branching

### Requirement → implementation

| Requirement | How it's met |
|---|---|
| Create a branch from any message | Every message (user or assistant) has a branch icon. Clicking it calls the `createBranch` server action with `(conversationId, messageId)`. |
| View and switch between branches | Header shows a "N branches" dropdown (`branch-switcher.tsx`) listing every conversation in the same tree, with a checkmark on the active one; clicking navigates via `Link`. |
| Persist branch history | Branching creates a **new `Conversation` row** and copies every `Message` up to and including the branch point into it (same `role`/`content`/`parts`/`status`, new IDs, original `createdAt` preserved for ordering). This happens in a single Prisma transaction so it can't half-complete. |
| Rename/Delete branches | Not reimplemented — branches are ordinary `Conversation` rows, so the existing sidebar rename/pin/delete menu (`app-sidebar.tsx`) already works on them with zero new code. |
| Build a clean UI for branch navigation | Two surfaces: (1) an always-visible branch icon per message, right-aligned under user messages / left-aligned under assistant messages, matching the message's own alignment; (2) a header dropdown for jumping between all branches in the tree. |

### Data model

```
Conversation
├── rootConversationId    -- points to the ultimate ancestor; null if this IS the root
├── parentConversationId  -- direct parent (the conversation this branch forked from)
└── branchFromMessageId   -- the exact message the fork happened at
```

`rootConversationId` is what makes "list all branches in this tree" a single flat query (`WHERE id = root OR rootConversationId = root`) instead of a recursive walk — branch-of-a-branch trees still group under one root.

### Why conversations-as-branches instead of a message tree

The alternative design — a single conversation with a tree of messages (like some ChatGPT clones do for "edit and regenerate") — was rejected because:

1. **Reuse.** Rename, pin, delete, and the sidebar list all already operate on `Conversation`. A message-tree model would need parallel UI and logic for all of those, specifically for branch nodes.
2. **Simplicity of "shared history."** Copying messages up to the fork point is a straightforward `slice()` + `createMany`, versus maintaining parent-pointers on every message and reconstructing the active path through the tree on every render.
3. **The requirements ask for branch-level operations** (view/switch/rename/delete *branches*), which maps directly onto conversation-level operations already built.

Trade-off: history before the branch point is **duplicated** in the database rather than shared by reference. For a chat app at this scale that's an acceptable cost for the simplicity gained; a production system with very long histories might instead store a shared prefix and only fork the tail.

### Bug fixed along the way

`components/ai-elements/message.tsx`'s `MessageAction` wrapped its button in a Base UI `TooltipTrigger` using `<TooltipTrigger>{button}</TooltipTrigger>` instead of `<TooltipTrigger render={button} />`. Base UI's `Trigger` renders its own `<button>` unless told to merge via `render`, so this produced `<button><button/></button>` — invalid HTML, causing a hydration error the moment `MessageAction` was actually used (it wasn't, until the branch button). Fixed as part of this work since it directly blocked the branch UI; also removed the tooltip and hover-reveal entirely per feedback, since the icon should be visible immediately with no hidden affordance.

---

## What's not covered

- No UI to delete/prune an entire branch *tree* at once (only per-conversation delete, which cascades to that conversation's own copied messages, not its children — a branch of a branch keeps its own copy either way).
- No visual tree/graph view of branch relationships — the dropdown is a flat list, not a diagram.
- Web search results are not deduplicated against the model's own knowledge before rendering; the model decides how to weigh them.
