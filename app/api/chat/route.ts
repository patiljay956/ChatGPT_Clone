import { loadChatMessages, saveChatMessages } from "@/features/ai/actions/chat-store";
import { getChatModel } from "@/features/ai/utils/model";
import { searchYouTube } from "@/features/ai/tools/youtube";
import { searchWeb } from "@/features/ai/tools/web-search";
import { requireUser } from "@/features/auth/action/require-user";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import {
    convertToModelMessages,
    createIdGenerator,
    createUIMessageStreamResponse,
    stepCountIs,
    streamText,
    toUIMessageStream,
    type UIMessage,
} from "ai";

/**
 * POST /api/chat — Streams an AI assistant reply for a conversation.
 *
 * Validates auth and ownership, persists the user message, then streams the
 * assistant response via the AI SDK. Final messages are saved when the stream ends.
 */
export async function POST(req: Request) {
    await auth.protect();

    const {
        message,
        id,
        webSearchEnabled,
    }: { message: UIMessage; id: string; webSearchEnabled?: boolean } = await req.json();

    if (!message || !id) {
        return new Response("Missing message or conversation id", { status: 400 });
    }

    const user = await requireUser();

    const conversation = await prisma.conversation.findFirst({
        where: {
            id,
            userId: user.id,
        },
    });

    if (!conversation) {
        return new Response("Conversation not found", { status: 404 });
    }

    const previousMessages = await loadChatMessages(id);

    const alreadySaved = previousMessages.some(
        (storedMessage) => storedMessage.id === message.id
    );

    const messages = alreadySaved ? previousMessages : [...previousMessages, message];

    if (!alreadySaved) {
        await saveChatMessages(id, [message]);
    }

    const result = streamText({
        model: getChatModel(conversation.model),
        system: conversation.systemPrompt ??
            "You are ChaiGPT, a helpful assistant. " +
            "You have access to a YouTube search tool — use it when the user asks to find videos, " +
            "wants recommendations, or mentions watching something on YouTube. " +
            "The tool results are already rendered as video cards in the UI, so in your reply do not " +
            "repeat thumbnails, embed images, or list the video links again — just add brief commentary if useful. " +
            (webSearchEnabled
                ? "You also have a web search tool — use it whenever the question needs current, " +
                  "real-world, or up-to-date information you might not know. Cite sources by name when relevant."
                : ""),
        messages: await convertToModelMessages(messages),
        tools: webSearchEnabled ? { searchYouTube, searchWeb } : { searchYouTube },
        stopWhen: stepCountIs(3),
    });

    result.consumeStream();

    return createUIMessageStreamResponse({
        stream: toUIMessageStream({
            stream: result.stream,
            originalMessages: messages,
            generateMessageId: createIdGenerator({ prefix: "msg", size: 16 }),
            onEnd: async ({ messages: finalMessages }) => {
                try {
                    await saveChatMessages(id, finalMessages, { updateTitle: false });
                } catch (error) {
                    console.error(error);
                }
            },
        }),
    });
}
