"use client";

import Link from "next/link";
import { GitBranchIcon, CheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBranches } from "@/features/conversation/hooks/use-conversation";

/**
 * Header control for viewing and switching between branches of the current
 * conversation tree. Hidden entirely when the conversation has no branches.
 */
export function BranchSwitcher({ conversationId }: { conversationId: string }) {
    const { data: branches } = useBranches(conversationId);

    if (!branches || branches.length <= 1) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button variant="ghost" size="sm" className="gap-1.5 rounded-full px-3 text-sm" />
                }
            >
                <GitBranchIcon className="size-4" />
                <span className="hidden sm:inline">{branches.length} branches</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                <DropdownMenuGroup>
                    <DropdownMenuLabel>Branches</DropdownMenuLabel>
                    {branches.map((branch) => (
                        <DropdownMenuItem
                            key={branch.id}
                            render={<Link href={`/c/${branch.id}`} />}
                            className="justify-between gap-2"
                        >
                            <span className="truncate">{branch.title}</span>
                            {branch.id === conversationId ? (
                                <CheckIcon className="size-4 shrink-0" />
                            ) : null}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
