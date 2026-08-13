"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Bell, BellOff, CheckCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { NOTIFICATION_TYPE_LABELS } from "@/lib/constants";
import {
  deleteNotificationAction,
  getNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/actions/notifications";
import { cn } from "@/lib/utils";

const NOTIFICATION_DOT: Record<string, string> = {
  BUDGET_EXCEEDED: "bg-rose-500",
  BUDGET_APPROACHING: "bg-amber-500",
  RECURRING_UPCOMING: "bg-sky-500",
  MONTHLY_SUMMARY: "bg-emerald-500",
};

export function NotificationsDropdown() {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const result = await getNotificationsAction();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: open,
    refetchInterval: 60_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });

  const markRead = async (id: string) => {
    await markNotificationReadAction(id);
    invalidate();
  };

  const markAllRead = async () => {
    await markAllNotificationsReadAction();
    invalidate();
    toast.success("All notifications marked as read");
  };

  const remove = async (id: string) => {
    await deleteNotificationAction(id);
    invalidate();
  };

  const unread = data?.unread ?? 0;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-[18px] w-[18px]" aria-hidden />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">
              {unread > 0 ? `${unread} unread` : "You're all caught up"}
            </p>
          </div>
          {unread > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead}>
              <CheckCheck className="h-4 w-4" aria-hidden />
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto p-1">
          {isLoading && (
            <div className="flex items-center justify-center py-10">
              <Spinner />
            </div>
          )}

          {!isLoading && (!data || data.items.length === 0) && (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <BellOff className="h-6 w-6 text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          )}

          {data?.items.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "group flex gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/60",
                !notification.read && "bg-accent/40",
              )}
            >
              <span
                className={cn(
                  "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                  NOTIFICATION_DOT[notification.type] ?? "bg-muted-foreground",
                )}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-snug">{notification.title}</p>
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {NOTIFICATION_TYPE_LABELS[notification.type] ?? notification.type}
                  </span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {notification.message}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground/70">
                  {format(new Date(notification.createdAt), "MMM d, h:mm a")}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                {!notification.read && (
                  <button
                    onClick={() => markRead(notification.id)}
                    className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground"
                    aria-label="Mark as read"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => remove(notification.id)}
                  className="rounded p-1 text-muted-foreground hover:bg-background hover:text-destructive"
                  aria-label="Delete notification"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
