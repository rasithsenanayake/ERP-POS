export type CampaignChannel = 'sms' | 'email' | 'whatsapp';
export type CampaignStatus = 'draft' | 'scheduled' | 'sent';
export type AudienceSegment = 'all' | 'vip' | 'wholesale' | 'corporate' | 'returning';

export interface Campaign {
  id: string;
  name: string;
  channel: CampaignChannel;
  segment: AudienceSegment;
  status: CampaignStatus;
  message: string;
  scheduledAt: string;
  recipients: number;
  opened: number;
  clicked: number;
  /** Attributed sales within 7 days, integer cents. */
  revenue: number;
}

export interface Promotion {
  id: string;
  code: string;
  description: string;
  kind: 'percent' | 'fixed';
  /** Percent (whole number) or integer cents. */
  amount: number;
  uses: number;
  limit: number | null;
  endsAt: string;
  active: boolean;
}