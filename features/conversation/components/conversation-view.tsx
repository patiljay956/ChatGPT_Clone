"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useQueryClient } from "@tanstack/react-query";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import React, { useEffect, useMemo, useRef } from "react";
import { useConversations, useCreateBranch } from "../hooks/use-conversation";
import { queryKeys } from "../utils/query-keys";
import { toast } from "sonner";
import { ChatEmpty } from "./chat-empty";
import { ChatMessages } from "./chat-messages";
import { ChatComposer } from "./chat-composer";
import { BranchSwitcher } from "./branch-switcher";
import { ChevronDown, Share2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

type ConversationViewProps = {
    conversationId: string;
    initialMessages: UIMessage[];
    /** When set, auto-sends this text as the first message on mount. */
    initialInput?: string;
    /** Whether web search should be enabled for the auto-sent first message. */
    initialWebSearchEnabled?: boolean;
};

/**
 * Main chat view — header, message list (or empty state), and composer with streaming.
 */
export const ConversationView = ({ conversationId, initialMessages, initialInput, initialWebSearchEnabled }: ConversationViewProps) => {
    const queryClient = useQueryClient();
    const hasSentInitial = useRef(false);
    const { data: conversations } = useConversations();
    const [webSearchEnabled, setWebSearchEnabled] = React.useState(initialWebSearchEnabled ?? false);
    const createBranch = useCreateBranch();

    const transport = useMemo(
        () =>
            new DefaultChatTransport({
                api: "/api/chat",
                prepareSendMessagesRequest: ({ id, messages, body }) => ({
                    body: {
                        id,
                        message: messages.at(-1),
                        webSearchEnabled: (body as { webSearchEnabled?: boolean } | undefined)?.webSearchEnabled,
                    },
                }),
            }),
        []
    );

    const { messages, sendMessage, status } = useChat({
        id: conversationId,
        messages: initialMessages,
        transport,
        onFinish: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.conversations.all,
            });
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    // Auto-send the first message when arriving from the home page composer.
    useEffect(() => {
        if (
            initialInput &&
            !hasSentInitial.current &&
            status === "ready" &&
            messages.length === 0
        ) {
            hasSentInitial.current = true;
            void sendMessage({ text: initialInput }, { body: { webSearchEnabled } });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    const title =
        conversations?.find((item) => item.id === conversationId)?.title ?? "Chat";

    return (
        <div className="flex h-full min-h-0 flex-1 flex-col">
            <header className="flex h-14 shrink-0 items-center justify-between px-4 border-b">
                <div className="flex items-center gap-2">
                    <SidebarTrigger />
                    <Separator orientation="vertical" className="mx-1 h-4" />
                    <Button variant="ghost" size="sm" className="gap-1 font-semibold text-base hover:bg-muted/50 px-2 h-9 rounded-lg">
                        <span>ChatGPT</span>
                        <ChevronDown className="size-4 text-muted-foreground" />
                    </Button>
                    <BranchSwitcher conversationId={conversationId} />
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="gap-1.5 rounded-full px-3 text-sm">
                        <Share2 className="size-4" />
                        <span className="hidden sm:inline">Share</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full size-9">
                        <MoreHorizontal className="size-4" />
                    </Button>
                </div>
            </header>

            {messages.length === 0 ? (
                <ChatEmpty />
            ) : (
                <ChatMessages
                    messages={messages}
                    status={status}
                    onBranch={(messageId) =>
                        createBranch.mutate({ conversationId, messageId })
                    }
                />
            )}

            <ChatComposer
                onSend={(text) => {
                    void sendMessage({ text }, { body: { webSearchEnabled } });
                }}
                isSending={status !== "ready"}
                autoFocus
                webSearchEnabled={webSearchEnabled}
                onWebSearchToggle={setWebSearchEnabled}
            />
        </div>
    );
};
