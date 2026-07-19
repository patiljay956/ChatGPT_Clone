import { loadChatMessages } from '@/features/ai/actions/chat-store';
import { getConversation } from '@/features/conversation/actions/conversation-actions';
import { ConversationView } from '@/features/conversation/components/conversation-view';
import { notFound } from 'next/navigation';
import React from 'react'

type ConversationPageProps = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ q?: string }>;
};

/**
 * Conversation page — loads messages and renders the chat UI for a given ID.
 * Reads optional `?q=` param to auto-send the first message (used when navigating from home).
 */
const page = async ({ params, searchParams }: ConversationPageProps) => {
    const { id } = await params;
    const { q } = await searchParams;

    try {
        await getConversation(id)
    } catch (error) {
        notFound()
    }

    const initialMessages = await loadChatMessages(id);

    return (
        <ConversationView
            key={id}
            conversationId={id}
            initialMessages={initialMessages}
            initialInput={q}
        />
    )
}

export default page
