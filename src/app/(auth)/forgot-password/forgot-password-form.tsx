"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, KeyRound, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { Spinner } from "@/components/ui/spinner";
import { forgotPasswordAction } from "@/actions/auth";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/schemas/auth";

export function ForgotPasswordForm() {
  const [submitting, setSubmitting] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [devResetUrl, setDevResetUrl] = React.useState<string | undefined>();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordInput) => {
    setSubmitting(true);
    try {
      const result = await forgotPasswordAction(values);
      if (result.success) {
        setSent(true);
        setDevResetUrl(result.data.devResetUrl);
        if (result.data.emailSent) {
          toast.success("Reset link sent to your email");
        }
      } else {
        toast.error(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-6">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            If an account exists for that email, a password reset link is on its way. It
            expires in 1 hour.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border bg-muted/50 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/10">
            <MailCheck className="h-5 w-5 text-success" aria-hidden />
          </span>
          <p className="text-sm">
            Didn&apos;t receive anything? Check spam, or try again in a few minutes.
          </p>
        </div>

        {devResetUrl && (
          <div className="space-y-2 rounded-xl border border-dashed p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Development mode — no email provider configured
            </p>
            <p className="text-xs break-all text-muted-foreground">
              Use this link to reset your password:{" "}
              <Link href={devResetUrl} className="font-medium text-primary hover:underline">
                {devResetUrl}
              </Link>
            </p>
          </div>
        )}

        <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
          <KeyRound className="h-4 w-4" aria-hidden />
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Forgot your password?</h1>
        <p className="text-sm text-muted-foreground">
          Enter your account email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField label="Email" htmlFor="email" error={errors.email?.message} required>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
        </FormField>

        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting ? <Spinner /> : <KeyRound className="h-4 w-4" aria-hidden />}
          {submitting ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <Link
        href="/login"
        className="flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to sign in
      </Link>
    </div>
  );
}
