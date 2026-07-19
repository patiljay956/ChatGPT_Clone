"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import type { user } from "@/lib/generated/prisma/client";

/**
 * Syncs the signed-in Clerk user into the local Prisma `User` table (upsert).
 *
 * @returns The created or updated Prisma user record.
 * @throws {Error} When no Clerk session is present.
 */
export async function onBoard() {
    const clerkUser = await currentUser();

    if (!clerkUser) {
        throw new Error("Unauthorized")
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress ?? null;

    return prisma.user.upsert({
        where: { clerkUserId: clerkUser.id },
        create: {
            clerkUserId: clerkUser.id,
            email,
            name: clerkUser.fullName,
            avatarUrl: clerkUser.imageUrl
        },
        update: {
            email,
            name: clerkUser.fullName,
            avatarUrl: clerkUser.imageUrl
        }
    })
}