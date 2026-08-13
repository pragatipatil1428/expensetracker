"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Laptop, LogOut, Moon, Sun, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FormField } from "@/components/shared/form-field";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { getMeAction } from "@/actions/dashboard";
import {
  changePasswordAction,
  deleteAccountAction,
  logoutAction,
  updateSettingsAction,
} from "@/actions/auth";
import { changePasswordSchema, type ChangePasswordInput } from "@/schemas/auth";
import { CURRENCIES, THEME_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { UserDTO } from "@/lib/types";

export function SettingsClient() {
  const me = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const result = await getMeAction();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  if (me.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!me.data) return null;

  return <SettingsForm user={me.data} />;
}

function SettingsForm({ user }: { user: UserDTO }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setTheme } = useTheme();

  const [currency, setCurrency] = React.useState(user.currency);
  const [themePref, setThemePref] = React.useState<"light" | "dark" | "system">(user.theme);
  const [prefs, setPrefs] = React.useState(user.notificationPrefs);
  const [savingPrefs, setSavingPrefs] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const savePreferences = async () => {
    setSavingPrefs(true);
    try {
      const result = await updateSettingsAction({
        currency,
        theme: themePref,
        notificationPrefs: prefs,
      });
      if (result.success) {
        toast.success("Preferences saved");
        setTheme(themePref);
        queryClient.invalidateQueries({ queryKey: ["me"] });
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } finally {
      setSavingPrefs(false);
    }
  };

  const onChangePassword = async (values: ChangePasswordInput) => {
    const result = await changePasswordAction(values);
    if (result.success) {
      toast.success("Password changed");
      passwordForm.reset();
    } else {
      toast.error(result.error);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const result = await deleteAccountAction();
      if (result.success) {
        toast.success("Account deleted");
        router.push("/");
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleSignOut = async () => {
    await logoutAction();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your preferences, security and account.
        </p>
      </div>

      <Tabs defaultValue="appearance">
        <TabsList>
          <TabsTrigger value="appearance">
            <Sun className="h-4 w-4" aria-hidden />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="currency">
            <span className="text-sm">₹</span>
            Currency
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <span className="text-sm">🔔</span>
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <KeyRound className="h-4 w-4" aria-hidden />
            Security
          </TabsTrigger>
          <TabsTrigger value="account">
            <UserCog className="h-4 w-4" aria-hidden />
            Account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Choose how FinTrack looks. System follows your device preference.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                {THEME_OPTIONS.map((option) => {
                  const Icon = option.value === "light" ? Sun : option.value === "dark" ? Moon : Laptop;
                  const active = themePref === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setThemePref(option.value)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all",
                        active
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "hover:border-primary/40 hover:bg-muted/40",
                      )}
                      aria-pressed={active}
                    >
                      <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
                      <span className="text-sm font-medium">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="currency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Currency</CardTitle>
              <CardDescription>
                All amounts are formatted in your preferred currency.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {CURRENCIES.map((option) => {
                  const active = currency === option.code;
                  return (
                    <button
                      key={option.code}
                      onClick={() => setCurrency(option.code)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-4 text-left transition-all",
                        active
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "hover:border-primary/40 hover:bg-muted/40",
                      )}
                      aria-pressed={active}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-base font-bold">
                        {option.symbol}
                      </span>
                      <span>
                        <span className="block text-sm font-medium">{option.code}</span>
                        <span className="block text-xs text-muted-foreground">{option.label}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification preferences</CardTitle>
              <CardDescription>
                Choose what FinTrack should notify you about.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {(
                [
                  { key: "budgetAlerts", title: "Budget alerts", text: "Warned at 80% usage and alerted when a budget is exceeded." },
                  { key: "recurringReminders", title: "Recurring reminders", text: "Reminders 3 days before a scheduled payment is due." },
                  { key: "monthlySummary", title: "Monthly summary", text: "A financial summary notification at the start of each month." },
                ] as const
              ).map(({ key, title, text }) => (
                <div key={key} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-xs text-muted-foreground">{text}</p>
                  </div>
                  <Switch
                    checked={prefs[key]}
                    onCheckedChange={(checked) => setPrefs((p) => ({ ...p, [key]: checked }))}
                    aria-label={title}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Change password</CardTitle>
              <CardDescription>
                Use at least 8 characters with uppercase, lowercase and a number.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={passwordForm.handleSubmit(onChangePassword)}
                className="max-w-sm space-y-4"
                noValidate
              >
                <FormField
                  label="Current password"
                  htmlFor="currentPassword"
                  error={passwordForm.formState.errors.currentPassword?.message}
                  required
                >
                  <Input
                    id="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    {...passwordForm.register("currentPassword")}
                  />
                </FormField>
                <FormField
                  label="New password"
                  htmlFor="newPassword"
                  error={passwordForm.formState.errors.newPassword?.message}
                  required
                >
                  <Input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    {...passwordForm.register("newPassword")}
                  />
                </FormField>
                <FormField
                  label="Confirm new password"
                  htmlFor="confirmPassword"
                  error={passwordForm.formState.errors.confirmPassword?.message}
                  required
                >
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    {...passwordForm.register("confirmPassword")}
                  />
                </FormField>
                <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                  {passwordForm.formState.isSubmitting && <Spinner />}
                  Update password
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session</CardTitle>
              <CardDescription>Sign out of FinTrack on this device.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" aria-hidden />
                Sign out
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive">Danger zone</CardTitle>
              <CardDescription>
                Permanently delete your account and all of your data. This cannot be
                undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4" aria-hidden />
                Delete account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator />

      <div className="flex justify-end">
        <Button onClick={savePreferences} disabled={savingPrefs}>
          {savingPrefs && <Spinner />}
          Save preferences
        </Button>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete your account?"
        description={
          <>
            This will permanently delete your account, transactions, budgets and all
            other data. This action cannot be undone.
          </>
        }
        confirmLabel="Delete my account"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}
