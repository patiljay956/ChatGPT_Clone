"use client";

import { ModeToggle } from "@/components/ui/mode-toggle";
import { UserButton } from "@clerk/nextjs";
import { useConversations } from "@/features/conversation/hooks/use-conversation";

export default function Home() {
    const { data, isLoading, error } = useConversations();

    if (isLoading) {
        return <h1>Loading...</h1>;
    }

    if (error) {
        return <h1>Something went wrong</h1>;
    }

    return (
        <div>
            <ModeToggle />
            <UserButton />
            {JSON.stringify(data)}
        </div>
    );
}
