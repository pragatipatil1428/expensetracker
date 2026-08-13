import "server-only";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toUserDTO } from "@/lib/serialize";
import type { UserDTO } from "@/lib/types";

export async function getSession() {
  return auth();
}

export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/** Throws when the user is not authenticated. Use inside server actions. */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be signed in to perform this action.");
  }
  return session.user.id;
}

/** Returns the full user row for the current session (with preferences). */
export async function requireUser(): Promise<{ id: string; userDTO: UserDTO; currency: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be signed in to perform this action.");
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    throw new Error("Account not found.");
  }
  return { id: user.id, userDTO: toUserDTO(user), currency: user.currency };
}

/** Guard used by page layouts: returns the user or null when signed out. */
export async function getViewer() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return null;
  return toUserDTO(user);
}
