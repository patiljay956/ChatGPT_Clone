"use client";

import { createConversation } from "@/features/conversation/actions/conversation-actions";
import { ChatComposer } from "./chat-composer";
import { ChatEmpty } from "./chat-empty";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Home page chat UI — shows empty state and composer.
 * Creates a conversation only when the first message is submitted,
 * then navigates to `/c/{id}?q=<message>` for the AI to process.
 */
export function NewChatView() {
    const router = useRouter();
    const [isSending, setIsSending] = useState(false);

    async function handleSend(text: string) {
        setIsSending(true);
        try {
            const conversation = await createConversation();
            router.push(`/c/${conversation.id}?q=${encodeURIComponent(text)}`);
        } finally {
            setIsSending(false);
        }
    }

    return (
        <div className="flex h-full min-h-0 flex-1 flex-col">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
                <SidebarTrigger />
                <Separator orientation="vertical" className="mx-1 h-4" />
                <h1 className="truncate text-sm font-medium">New Chat</h1>
            </header>

            <ChatEmpty />

            <ChatComposer
                onSend={handleSend}
                isSending={isSending}
                autoFocus
            />
        </div>
    );
}
