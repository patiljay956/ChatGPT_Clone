import { NewChatView } from '@/features/conversation/components/new-chat-view'

/**
 * Home page — renders empty chat UI.
 * Conversation is created only when the first message is sent.
 */
export default function page() {
    return <NewChatView />
}
