"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/layout/user-avatar";
import { getMeAction } from "@/actions/dashboard";
import { updateProfileAction } from "@/actions/auth";
import { profileSchema, type ProfileInput } from "@/schemas/auth";
import { formatDate } from "@/lib/format";

export function ProfileForm() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const me = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const result = await getMeAction();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", email: "" },
  });

  React.useEffect(() => {
    if (me.data) reset({ name: me.data.name, email: me.data.email });
  }, [me.data, reset]);

  const onSubmit = async (values: ProfileInput) => {
    const result = await updateProfileAction(values);
    if (result.success) {
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: ["me"] });
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  if (me.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (!me.data) return null;
  const user = me.data;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal information.
        </p>
      </div>

      <div className="flex items-center gap-4 rounded-xl border bg-card p-5">
        <UserAvatar name={user.name} image={user.image} className="h-14 w-14 text-lg" />
        <div>
          <p className="text-base font-semibold">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Member since {formatDate(user.createdAt, "MMMM yyyy")}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-md space-y-4 rounded-xl border bg-card p-5"
        noValidate
      >
        <FormField label="Full name" htmlFor="name" error={errors.name?.message} required>
          <Input id="name" autoComplete="name" {...register("name")} />
        </FormField>
        <FormField label="Email" htmlFor="email" error={errors.email?.message} required>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
        </FormField>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner />}
          <Save className="h-4 w-4" aria-hidden />
          Save changes
        </Button>
      </form>
    </div>
  );
}
