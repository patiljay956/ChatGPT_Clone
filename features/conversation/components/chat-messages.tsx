"use client";

import { isTextUIPart, type UIMessage } from "ai";
import type { ChatStatus } from "ai";
import type { VideoResult } from "@/features/ai/tools/youtube";
import type { WebSearchResult } from "@/features/ai/tools/web-search";
import { Loader2 } from "lucide-react";

import {
    Conversation,
    ConversationContent,
} from "@/components/ai-elements/conversation";
import {
    Message,
    MessageContent,
    MessageResponse,
} from "@/components/ai-elements/message";
import { Loader } from "@/components/ai-elements/loader";
import { YouTubeResults } from "@/components/ai-elements/youtube-results";
import { WebSearchResults } from "@/components/ai-elements/web-search-results";

/** Extracts plain text from a `UIMessage` by joining all text parts. */
function getMessageText(message: UIMessage) {
    return message.parts
        .filter(isTextUIPart)
        .map((part) => part.text)
        .join("");
}

type ChatMessagesProps = {
    messages: UIMessage[];
    status: ChatStatus;
};

/**
 * Renders the conversation message list.
 * Handles text parts, tool-call "Searching…" states, and tool-result YouTube cards.
 */
export function ChatMessages({ messages, status }: ChatMessagesProps) {
    const lastMessage = messages.at(-1);

    // Show loader when: waiting for first token OR streaming but assistant message
    // hasn't produced any visible content yet (gap between submit and first token).
    const hasVisibleContent = lastMessage?.parts.some(
        (part) =>
            (part.type === "text" && part.text.length > 0) ||
            part.type === "tool-searchYouTube" ||
            part.type === "tool-searchWeb"
    );
    const isWaiting =
        (status === "submitted" && lastMessage?.role === "user") ||
        (status === "streaming" && lastMessage?.role === "assistant" && !hasVisibleContent);

    return (
        <Conversation>
            <ConversationContent className="py-8">
                {messages.map((message) => (
                    <Message key={message.id} from={message.role}>
                        {message.parts.map((part, i) => {
                            // Text part
                            if (part.type === "text") {
                                if (!part.text) return null;
                                return (
                                    <MessageContent key={i}>
                                        <MessageResponse>{part.text}</MessageResponse>
                                    </MessageContent>
                                );
                            }

                            // YouTube tool part
                            if (part.type === "tool-searchYouTube") {
                                // Tool is still being called — show inline spinner
                                if (part.state === "input-streaming" || part.state === "input-available") {
                                    return (
                                        <div key={i} className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
                                            <Loader2 className="size-3 animate-spin" />
                                            Searching YouTube…
                                        </div>
                                    );
                                }

                                // Tool returned results — render video cards
                                if (part.state === "output-available") {
                                    return (
                                        <div key={i} className="w-full">
                                            <p className="text-xs text-muted-foreground mb-2">
                                                YouTube results for <span className="font-medium text-foreground">&ldquo;{(part.input as { query: string }).query}&rdquo;</span>
                                            </p>
                                            <YouTubeResults videos={part.output as VideoResult[]} />
                                        </div>
                                    );
                                }

                                if (part.state === "output-error") {
                                    return (
                                        <p key={i} className="text-xs text-destructive py-1">
                                            YouTube search failed: {part.errorText}
                                        </p>
                                    );
                                }
                            }

                            // Web search tool part
                            if (part.type === "tool-searchWeb") {
                                if (part.state === "input-streaming" || part.state === "input-available") {
                                    return (
                                        <div key={i} className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
                                            <Loader2 className="size-3 animate-spin" />
                                            Searching the web…
                                        </div>
                                    );
                                }

                                if (part.state === "output-available") {
                                    return (
                                        <div key={i} className="w-full max-w-md">
                                            <p className="text-xs text-muted-foreground mb-2">
                                                Web results for <span className="font-medium text-foreground">&ldquo;{(part.input as { query: string }).query}&rdquo;</span>
                                            </p>
                                            <WebSearchResults results={part.output as WebSearchResult[]} />
                                        </div>
                                    );
                                }

                                if (part.state === "output-error") {
                                    return (
                                        <p key={i} className="text-xs text-destructive py-1">
                                            Web search failed: {part.errorText}
                                        </p>
                                    );
                                }
                            }

                            return null;
                        })}
                    </Message>
                ))}

                {isWaiting ? (
                    <Message from="assistant">
                        <MessageContent>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader />
                                Thinking…
                            </div>
                        </MessageContent>
                    </Message>
                ) : null}
            </ConversationContent>
        </Conversation>
    );
}
