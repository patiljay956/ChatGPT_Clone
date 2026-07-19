"use client";

import { createConversation } from "@/features/conversation/actions/conversation-actions";
import { ChatComposer } from "./chat-composer";
import { ChatEmpty } from "./chat-empty";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Home page chat UI — shows empty state and composer.
 * Creates a conversation only when the first message is submitted,
 * then navigates to `/c/{id}?q=<message>` for the AI to process.
 */
export function NewChatView() {
    const router = useRouter();
    const [isSending, setIsSending] = useState(false);
    const [webSearchEnabled, setWebSearchEnabled] = useState(false);

    async function handleSend(text: string) {
        setIsSending(true);
        try {
            const conversation = await createConversation();
            const params = new URLSearchParams({ q: text });
            if (webSearchEnabled) params.set("web", "1");
            router.push(`/c/${conversation.id}?${params.toString()}`);
        } finally {
            setIsSending(false);
        }
    }

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
                </div>
            </header>

            <ChatEmpty />

            <ChatComposer
                onSend={handleSend}
                isSending={isSending}
                autoFocus
                webSearchEnabled={webSearchEnabled}
                onWebSearchToggle={setWebSearchEnabled}
            />
        </div>
    );
}
