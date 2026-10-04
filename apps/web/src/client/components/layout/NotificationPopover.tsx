import React from "react";
import { useNavigate } from "react-router-dom";
import { BanknoteIcon, BellIcon, AtSignIcon, PackageXIcon, ReceiptIcon, TriangleAlertIcon, TruckIcon, Undo2Icon } from "lucide-react";
import type { LucideIcon } from 'lucide-react';
import { useErp } from "../../contexts/ErpContext";
import { NotificationKind } from "../../types/system";
import { cn } from "../../utils/cn";
import { timeAgo } from "../../utils/dates";
import { Popover } from "../ui/Popover";
const icons: Record<NotificationKind, LucideIcon> = {
  low_stock: PackageXIcon,
  payment: BanknoteIcon,
  order: ReceiptIcon,
  overdue: TriangleAlertIcon,
  transfer: TruckIcon,
  mention: AtSignIcon,
  refund: Undo2Icon
};
export function NotificationPopover() {
  const {
    state,
    actions
  } = useErp();
  const navigate = useNavigate();
  const unread = state.notifications.filter((n) => !n.read).length;
  return <Popover align="end" className="w-[360px] p-0" trigger={({
    open,
    toggle
  }) => <button type="button" onClick={toggle} aria-expanded={open} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-ink">
          <BellIcon className="h-4 w-4" />
          {unread > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-surface bg-critical" aria-hidden />}
        </button>}>
      {(close) => <div>
          <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
            <h2 className="text-sm font-semibold">Notifications</h2>
            {unread > 0 && <button type="button" onClick={actions.markAllNotificationsRead} className="text-xs text-accent hover:underline">
                Mark all as read
              </button>}
          </div>
          <ul className="max-h-[420px] overflow-y-auto p-1">
            {state.notifications.slice(0, 15).map((n) => {
          const Icon = icons[n.kind];
          return <li key={n.id}>
                  <button type="button" onClick={() => {
              actions.markNotificationRead(n.id);
              navigate(n.href);
              close();
            }} className="flex w-full gap-3 rounded-md px-2 py-2 text-left hover:bg-surface-2">
                    <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md', n.read ? 'bg-surface-2 text-muted' : 'bg-accent-soft text-accent')}>
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn('block truncate text-[13px]', n.read ? 'text-ink' : 'font-semibold text-ink')}>{n.title}</span>
                      <span className="block truncate text-xs text-muted">{n.body}</span>
                      <span className="mt-0.5 block text-[11px] text-subtle">{timeAgo(n.createdAt)}</span>
                    </span>
                    {!n.read && <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
                  </button>
                </li>;
        })}
            {state.notifications.length === 0 && <li className="px-3 py-8 text-center text-[13px] text-muted">You're all caught up.</li>}
          </ul>
        </div>}
    </Popover>;
}
