"use server";

import { createHash, randomBytes } from "crypto";
import { compare, hash } from "bcryptjs";
import { AuthError } from "next-auth";

import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDefaultCategories } from "@/lib/categories";
import { requireUserId } from "@/lib/auth-helpers";
import { buildResetEmailHtml, sendEmail } from "@/lib/email";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  profileSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/schemas/auth";
import { settingsSchema } from "@/schemas/transaction";
import type { ActionResult } from "@/lib/types";

function firstError(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Invalid input.";
}

// ── Login / Logout ───────────────────────────────────────────────────────

export async function loginAction(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstError(parsed.error) };

  try {
    const result = await signIn("credentials", {
      email: parsed.data.email.toLowerCase().trim(),
      password: parsed.data.password,
      redirect: false,
    });
    if (result && "error" in result && result.error) {
      return { success: false, error: "Invalid email or password." };
    }
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: "Invalid email or password." };
    }
    console.error("Login failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function registerAction(input: unknown): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstError(parsed.error) };

  const name = parsed.data.name.trim();
  const email = parsed.data.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "An account with this email already exists." };
  }

  try {
    const passwordHash = await hash(parsed.data.password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
    });
    await ensureDefaultCategories(user.id);
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "MONTHLY_SUMMARY",
        key: "welcome",
        title: "Welcome to FinTrack 👋",
        message:
          "Track your income and expenses, set budgets and reach your savings goals.",
      },
    });

    const result = await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirect: false,
    });
    if (result && "error" in result && result.error) {
      return { success: false, error: "Account created. Please sign in." };
    }
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Registration failed:", error);
    return { success: false, error: "Could not create your account. Please try again." };
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}

// ── Password reset ───────────────────────────────────────────────────────

export async function forgotPasswordAction(input: unknown): Promise<
  ActionResult<{ devResetUrl?: string; emailSent: boolean }>
> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstError(parsed.error) };

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  // Never reveal whether an account exists.
  if (!user) return { success: true, data: { emailSent: false } };

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  const emailSent = await sendEmail({
    to: user.email,
    subject: "Reset your FinTrack password",
    html: buildResetEmailHtml(resetUrl),
  });

  // Without an email provider configured, surface the link for development.
  const devResetUrl = emailSent ? undefined : resetUrl;
  return { success: true, data: { devResetUrl, emailSent } };
}

export async function resetPasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstError(parsed.error) };

  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record || record.usedAt !== null || record.expiresAt < new Date()) {
    return { success: false, error: "This reset link is invalid or has expired." };
  }

  const passwordHash = await hash(parsed.data.password, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);
  return { success: true, data: undefined };
}

// ── Profile & security ───────────────────────────────────────────────────

export async function updateProfileAction(input: unknown): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstError(parsed.error) };

  const userId = await requireUserId();
  const email = parsed.data.email.toLowerCase().trim();

  const conflict = await prisma.user.findFirst({
    where: { email, NOT: { id: userId } },
    select: { id: true },
  });
  if (conflict) return { success: false, error: "That email is already in use." };

  await prisma.user.update({
    where: { id: userId },
    data: { name: parsed.data.name.trim(), email },
  });
  return { success: true, data: undefined };
}

export async function changePasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstError(parsed.error) };

  const userId = await requireUserId();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user) return { success: false, error: "Account not found." };

  const currentValid = await compare(parsed.data.currentPassword, user.passwordHash);
  if (!currentValid) return { success: false, error: "Current password is incorrect." };

  const passwordHash = await hash(parsed.data.newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  return { success: true, data: undefined };
}

export async function deleteAccountAction(): Promise<ActionResult> {
  const userId = await requireUserId();
  await prisma.user.delete({ where: { id: userId } });
  await signOut({ redirectTo: "/" });
  return { success: true, data: undefined };
}

export async function updateSettingsAction(input: unknown): Promise<ActionResult> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstError(parsed.error) };

  const userId = await requireUserId();
  await prisma.user.update({
    where: { id: userId },
    data: {
      currency: parsed.data.currency,
      theme: parsed.data.theme,
      notificationPrefs: parsed.data.notificationPrefs,
    },
  });
  return { success: true, data: undefined };
}
