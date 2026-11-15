import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import type { Notification } from "@hvac/shared";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/features/auth";
import { useRealtimeInvalidate } from "@/lib/realtime";
import { useNotifications, useUnreadCount, useMarkRead, useMarkAllRead } from "./hooks";

function notificationLink(n: Notification): string | null {
  if (n.refType === "request" && n.refId) return `/panel/solicitudes/${n.refId}`;
  if (n.refType === "quote" && n.refId) return `/panel/solicitudes/${n.refId}`;
  if (n.refType === "provider") return "/panel/proveedor";
  return null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  // NOT-01: en vivo con Supabase Realtime; sin Supabase (modo demo), polling corto.
  const live = useRealtimeInvalidate("notifications", user ? `user_id=eq.${user.id}` : null, [
    ["notifications"],
  ]);
  const { data: unread = 0 } = useUnreadCount(live ? false : 10_000);
  const { data: notifications } = useNotifications(live ? false : 10_000);
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const recent = notifications?.slice(0, 8) ?? [];

  function handleItemClick(n: Notification) {
    if (!n.read) markRead.mutate(n.id);
    setOpen(false);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificaciones">
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-semibold">Notificaciones</span>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck className="mr-1 size-3" />
              Marcar todas
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {recent.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            Sin notificaciones
          </div>
        ) : (
          recent.map((n) => {
            const href = notificationLink(n);
            const content = (
              <div className="flex flex-col gap-0.5">
                <span className={`text-sm ${n.read ? "text-muted-foreground" : "font-medium"}`}>
                  {n.title}
                </span>
                {n.body && (
                  <span className="line-clamp-1 text-xs text-muted-foreground">{n.body}</span>
                )}
                <span className="text-[10px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
              </div>
            );

            return (
              <DropdownMenuItem
                key={n.id}
                className={`cursor-pointer ${!n.read ? "bg-muted/50" : ""}`}
                onClick={() => handleItemClick(n)}
                asChild={!!href}
              >
                {href ? (
                  <Link to={href} className="block w-full">
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
