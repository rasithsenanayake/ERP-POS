export type AppCategory = 'Payments' | 'Delivery' | 'Messaging' | 'Accounting' | 'Sales channels';

export interface AppField {
  key: string;
  label: string;
  secret: boolean;
  placeholder: string;
}

export interface IntegrationApp {
  id: string;
  name: string;
  monogram: string;
  category: AppCategory;
  description: string;
  fields: AppField[];
  connected: boolean;
  account: string | null;
  connectedAt: string | null;
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  lastDelivery: 'ok' | 'failing';
}