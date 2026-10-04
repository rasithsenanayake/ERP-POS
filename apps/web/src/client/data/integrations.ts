import type { AppCategory, IntegrationApp, Webhook } from '../types/integrations';

export const appCategories: AppCategory[] = ['Payments', 'Delivery', 'Messaging', 'Accounting', 'Sales channels'];

const key = (label = 'API key') => ({ key: 'apiKey', label, secret: true, placeholder: '••••••••••••' });
const merchant = { key: 'merchantId', label: 'Merchant ID', secret: false, placeholder: 'e.g. 1221449' };

export const integrationApps: IntegrationApp[] = [
{ id: 'payhere', name: 'PayHere', monogram: 'PH', category: 'Payments', description: 'Accept cards, eZ Cash and mCash on serendib.lk.', fields: [merchant, key('Merchant secret')], connected: true, account: 'Merchant 1221449', connectedAt: '2025-11-02' },
{ id: 'lankaqr', name: 'LankaQR', monogram: 'QR', category: 'Payments', description: 'Show a dynamic QR at the POS for instant bank payments.', fields: [merchant], connected: true, account: 'Commercial Bank ·· 4471', connectedAt: '2026-01-15' },
{ id: 'stripe', name: 'Stripe', monogram: 'S', category: 'Payments', description: 'International card payments in USD and other currencies.', fields: [key('Secret key')], connected: false, account: null, connectedAt: null },
{ id: 'domex', name: 'Domex', monogram: 'DX', category: 'Delivery', description: 'Book island-wide courier pickups and print waybills from orders.', fields: [{ key: 'account', label: 'Account number', secret: false, placeholder: 'DX-000000' }, key()], connected: true, account: 'DX-204118', connectedAt: '2025-08-20' },
{ id: 'pronto', name: 'Pronto Lanka', monogram: 'PL', category: 'Delivery', description: 'Same-day delivery within Colombo and suburbs.', fields: [key()], connected: false, account: null, connectedAt: null },
{ id: 'pickme', name: 'PickMe Flash', monogram: 'PM', category: 'Delivery', description: 'On-demand rider delivery from any branch.', fields: [key()], connected: false, account: null, connectedAt: null },
{ id: 'dialog', name: 'Dialog SMS', monogram: 'D', category: 'Messaging', description: 'Send order updates and campaigns from a masked “SERENDIB” sender ID.', fields: [{ key: 'mask', label: 'Sender mask', secret: false, placeholder: 'SERENDIB' }, key()], connected: true, account: 'Mask: SERENDIB', connectedAt: '2025-06-11' },
{ id: 'whatsapp', name: 'WhatsApp Business', monogram: 'WA', category: 'Messaging', description: 'Two-way customer chat in the Support inbox, plus template messages.', fields: [{ key: 'phone', label: 'Business phone number', secret: false, placeholder: '+94 77 …' }, key('Access token')], connected: false, account: null, connectedAt: null },
{ id: 'quickbooks', name: 'QuickBooks Online', monogram: 'QB', category: 'Accounting', description: 'Sync invoices, payments and expenses nightly.', fields: [{ key: 'realm', label: 'Company ID', secret: false, placeholder: '9130 …' }], connected: false, account: null, connectedAt: null },
{ id: 'daraz', name: 'Daraz', monogram: 'DZ', category: 'Sales channels', description: 'Import marketplace orders and keep stock in sync.', fields: [{ key: 'seller', label: 'Seller ID', secret: false, placeholder: 'LK…' }, key()], connected: false, account: null, connectedAt: null },
{ id: 'meta', name: 'Facebook & Instagram Shop', monogram: 'FB', category: 'Sales channels', description: 'Publish your catalog and tag products in posts.', fields: [{ key: 'catalog', label: 'Catalog ID', secret: false, placeholder: '…' }], connected: false, account: null, connectedAt: null }];


export const webhooks: Webhook[] = [
{ id: 'wh-1', url: 'https://hooks.serendib.lk/erp/orders', events: ['order.created', 'order.paid'], lastDelivery: 'ok' },
{ id: 'wh-2', url: 'https://warehouse-display.local/stock', events: ['stock.changed'], lastDelivery: 'failing' }];