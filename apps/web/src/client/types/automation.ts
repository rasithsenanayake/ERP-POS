export type TriggerKey = 'order.created' | 'order.paid' | 'stock.low' | 'customer.created' | 'invoice.overdue' | 'ticket.created';
export type ConditionKey = 'none' | 'total_over' | 'channel_online' | 'tag_vip' | 'branch_colombo';
export type ActionKey = 'sms_customer' | 'whatsapp_customer' | 'notify_manager' | 'create_po' | 'assign_round_robin' | 'add_tag_vip';

export interface Workflow {
  id: string;
  name: string;
  trigger: TriggerKey;
  condition: ConditionKey;
  /** Used by "total_over", integer cents. */
  threshold: number;
  actions: ActionKey[];
  enabled: boolean;
  runs: number;
  lastRunAt: string | null;
  failures: number;
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  at: string;
  subject: string;
  status: 'success' | 'failed' | 'skipped';
  detail: string;
}