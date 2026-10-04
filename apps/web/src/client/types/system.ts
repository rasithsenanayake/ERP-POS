export type NotificationKind = 'low_stock' | 'payment' | 'order' | 'overdue' | 'transfer' | 'mention' | 'refund';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href: string;
  createdAt: string;
  read: boolean;
}

export interface AuditChange {
  field: string;
  from: string;
  to: string;
}

export interface AuditEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  resourceLabel: string;
  createdAt: string;
  ip: string;
  changes: AuditChange[];
}

export interface RecentItem {
  type: 'order' | 'customer' | 'product';
  id: string;
  label: string;
  sublabel: string;
  href: string;
}

export interface FavoritePage {
  path: string;
  label: string;
}

export type DrawerKind = 'order' | 'customer' | 'product' | 'adjust' | 'transfer';

export interface DrawerState {
  kind: DrawerKind;
  payload?: Record<string, string>;
}