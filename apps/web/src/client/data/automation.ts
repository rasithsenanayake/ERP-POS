import type { ActionKey, ConditionKey, TriggerKey, Workflow, WorkflowRun } from '../types/automation';

export const triggerOptions: Record<TriggerKey, string> = {
  'order.created': 'An order is created',
  'order.paid': 'An order is fully paid',
  'stock.low': 'Stock falls to reorder point',
  'customer.created': 'A new customer is added',
  'invoice.overdue': 'A balance becomes overdue',
  'ticket.created': 'A support ticket arrives'
};

export const conditionOptions: Record<ConditionKey, string> = {
  none: 'Always',
  total_over: 'Order total is over…',
  channel_online: 'Channel is online',
  tag_vip: 'Customer is tagged VIP',
  branch_colombo: 'Branch is Colombo 07'
};

export const actionOptions: Record<ActionKey, string> = {
  sms_customer: 'Send SMS to customer',
  whatsapp_customer: 'Send WhatsApp to customer',
  notify_manager: 'Notify branch manager',
  create_po: 'Draft a purchase order',
  assign_round_robin: 'Assign to next team member',
  add_tag_vip: 'Tag customer as VIP'
};

export const workflows: Workflow[] = [
{ id: 'wf-1', name: 'Order confirmation SMS', trigger: 'order.created', condition: 'channel_online', threshold: 0, actions: ['sms_customer'], enabled: true, runs: 1284, lastRunAt: '2026-10-04T09:41:00+05:30', failures: 3 },
{ id: 'wf-2', name: 'Low stock → draft PO', trigger: 'stock.low', condition: 'none', threshold: 0, actions: ['create_po', 'notify_manager'], enabled: true, runs: 46, lastRunAt: '2026-10-04T07:15:00+05:30', failures: 0 },
{ id: 'wf-3', name: 'High-value order alert', trigger: 'order.created', condition: 'total_over', threshold: 50000000, actions: ['notify_manager'], enabled: true, runs: 92, lastRunAt: '2026-10-03T18:02:00+05:30', failures: 0 },
{ id: 'wf-4', name: 'Overdue balance reminder', trigger: 'invoice.overdue', condition: 'none', threshold: 0, actions: ['whatsapp_customer', 'notify_manager'], enabled: false, runs: 18, lastRunAt: '2026-09-21T09:00:00+05:30', failures: 2 },
{ id: 'wf-5', name: 'Route new tickets', trigger: 'ticket.created', condition: 'none', threshold: 0, actions: ['assign_round_robin'], enabled: true, runs: 311, lastRunAt: '2026-10-04T08:12:00+05:30', failures: 0 }];


export const workflowRuns: WorkflowRun[] = [
{ id: 'run-1', workflowId: 'wf-1', at: '2026-10-04T09:41:00+05:30', subject: 'Online order for Dinusha Abeysekera', status: 'success', detail: 'SMS delivered to 071 553 2041' },
{ id: 'run-2', workflowId: 'wf-5', at: '2026-10-04T08:12:00+05:30', subject: 'SUP-2041', status: 'success', detail: 'Assigned to Tharushi Fernando' },
{ id: 'run-3', workflowId: 'wf-2', at: '2026-10-04T07:15:00+05:30', subject: 'Anker 20W USB-C Charger at Colombo 07', status: 'success', detail: 'Draft PO created for Colombo Accessory House' },
{ id: 'run-4', workflowId: 'wf-1', at: '2026-10-03T21:08:00+05:30', subject: 'Online order for Sarah Ondaatje', status: 'failed', detail: 'SMS gateway timeout — retried 3 times' },
{ id: 'run-5', workflowId: 'wf-3', at: '2026-10-03T18:02:00+05:30', subject: 'Order over Rs 500,000 at Kandy', status: 'success', detail: 'Kasun Jayawardena notified' },
{ id: 'run-6', workflowId: 'wf-1', at: '2026-10-03T16:30:00+05:30', subject: 'In-store order', status: 'skipped', detail: 'Condition not met: channel is in store' }];