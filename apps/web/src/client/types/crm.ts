export type DealStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface DealActivity {
  id: string;
  kind: 'call' | 'email' | 'meeting' | 'note' | 'stage';
  body: string;
  userId: string;
  at: string;
}

export interface Deal {
  id: string;
  title: string;
  company: string;
  contactName: string;
  contactPhone: string;
  /** Integer cents (LKR). */
  value: number;
  stage: DealStage;
  ownerId: string;
  expectedClose: string;
  nextStep: string;
  activities: DealActivity[];
}