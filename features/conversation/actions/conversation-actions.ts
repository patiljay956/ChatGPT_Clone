"use server";

import { requireUser } from "@/features/auth/action/require-user";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { revalidatePath } from "next/cache";

export type ConversationListItem = {
    id: string;
    title: string;
    isPinned: boolean;
    isArchived: boolean;
    lastMessageAt: Date;
    createdAt: Date;
    updatedAt: Date;
    parentConversationId: string | null;
};

export type BranchListItem = {
    id: string;
    title: string;
    parentConversationId: string | null;
    branchFromMessageId: string | null;
    createdAt: Date;
};

async function assertOwnsConversation(conversationId: string, userId: string) {
    const conversation = await prisma.conversation.findFirst({
        where: {
            id: conversationId,
            userId,
        },
    });

    if (!conversation) {
        throw new Error("Conversation not found");
    }

    return conversation;
}

/**
 * Fetches a single conversation owned by the current user.
 *
 * @param conversationId - The conversation to load.
 * @throws {Error} When the conversation is not found.
 */
export async function getConversation(conversationId: string) {
    const user = await requireUser();
    return assertOwnsConversation(conversationId, user.id);
}

export async function listConversations(): Promise<ConversationListItem[]> {
    const user = await requireUser();

    return prisma.conversation.findMany({
        where: { userId: user.id, isArchived: false },
        orderBy: [{ isPinned: "desc" }, { lastMessageAt: "desc" }],
        select: {
            id: true,
            title: true,
            isPinned: true,
            isArchived: true,
            lastMessageAt: true,
            createdAt: true,
            updatedAt: true,
            parentConversationId: true,
        },
    });
}

export async function createConversation(title = "New Chat") {
    const user = await requireUser();

    return prisma.conversation.create({
        data: {
            userId: user.id,
            title: title.trim() || "New Chat",
        },
    });
}

export async function updateConversation(
    conversationId: string,
    data: { title?: string; isPinned?: boolean; isArchived?: boolean }
) {
    const user = await requireUser();
    await assertOwnsConversation(conversationId, user.id);

    const conversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
            ...(data.title !== undefined ? { title: data.title.trim() || "New Chat" } : {}),
            ...(data.isPinned !== undefined ? { isPinned: data.isPinned } : {}),
            ...(data.isArchived !== undefined ? { isArchived: data.isArchived } : {}),
        },
    });

    revalidatePath("/");
    revalidatePath(`/c/${conversationId}`);
    return conversation;
}

export async function deleteConversation(conversationId: string) {
    const user = await requireUser();
    await assertOwnsConversation(conversationId, user.id);

    await prisma.conversation.delete({
        where: { id: conversationId },
    });

    revalidatePath("/");
    return { id: conversationId };
}

/**
 * Creates a new conversation branching off `conversationId` at `messageId`.
 * Copies every message up to and including the branch point, so the new
 * branch shares history up to that point but continues independently.
 *
 * @throws {Error} When the conversation or message is not found.
 */
export async function createBranch(conversationId: string, messageId: string) {
    const user = await requireUser();
    const conversation = await assertOwnsConversation(conversationId, user.id);

    const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
    });

    const splitIndex = messages.findIndex((message) => message.id === messageId);
    if (splitIndex === -1) {
        throw new Error("Message not found in this conversation");
    }

    const messagesToCopy = messages.slice(0, splitIndex + 1);
    const rootConversationId = conversation.rootConversationId ?? conversation.id;

    const branch = await prisma.$transaction(async (tx) => {
        const newConversation = await tx.conversation.create({
            data: {
                userId: user.id,
                title: `${conversation.title} (branch)`,
                model: conversation.model,
                systemPrompt: conversation.systemPrompt,
                rootConversationId,
                parentConversationId: conversationId,
                branchFromMessageId: messageId,
            },
        });

        await tx.message.createMany({
            data: messagesToCopy.map((message) => ({
                conversationId: newConversation.id,
                role: message.role,
                status: message.status,
                content: message.content,
                parts: message.parts as Prisma.InputJsonValue,
                metadata: message.metadata as Prisma.InputJsonValue | undefined,
                createdAt: message.createdAt,
            })),
        });

        return newConversation;
    });

    revalidatePath("/");
    return branch;
}

/**
 * Lists every conversation in the same branch tree as `conversationId`
 * (the root conversation plus all of its branches), oldest first.
 */
export async function listBranches(conversationId: string): Promise<BranchListItem[]> {
    const user = await requireUser();
    const conversation = await assertOwnsConversation(conversationId, user.id);
    const rootConversationId = conversation.rootConversationId ?? conversation.id;

    return prisma.conversation.findMany({
        where: {
            userId: user.id,
            OR: [{ id: rootConversationId }, { rootConversationId }],
        },
        orderBy: { createdAt: "asc" },
        select: {
            id: true,
            title: true,
            parentConversationId: true,
            branchFromMessageId: true,
            createdAt: true,
        },
    });
}
