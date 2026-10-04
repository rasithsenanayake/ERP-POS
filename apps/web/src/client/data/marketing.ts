import type { AudienceSegment, Campaign, CampaignChannel, Promotion } from '../types/marketing';

export const segmentOptions: {value: AudienceSegment;label: string;tag: string | null;}[] = [
{ value: 'all', label: 'All customers', tag: null },
{ value: 'vip', label: 'VIP customers', tag: 'VIP' },
{ value: 'returning', label: 'Returning customers', tag: 'Returning' },
{ value: 'wholesale', label: 'Wholesale accounts', tag: 'Wholesale' },
{ value: 'corporate', label: 'Corporate accounts', tag: 'Corporate' }];


export const channelLabels: Record<CampaignChannel, string> = { sms: 'SMS', email: 'Email', whatsapp: 'WhatsApp' };

export const campaigns: Campaign[] = [
{ id: 'cmp-1', name: 'Deepavali tech gifting', channel: 'whatsapp', segment: 'all', status: 'scheduled', message: 'Light up Deepavali with up to 15% off audio and smart home. Visit any Serendib store or shop online.', scheduledAt: '2026-10-15T09:00:00+05:30', recipients: 0, opened: 0, clicked: 0, revenue: 0 },
{ id: 'cmp-2', name: 'iPhone 15 price drop', channel: 'sms', segment: 'vip', status: 'sent', message: 'Serendib VIP: iPhone 15 now from Rs 289,900 + free Spigen case. Today only at Colombo 07, Kandy & Galle.', scheduledAt: '2026-09-27T10:00:00+05:30', recipients: 14, opened: 14, clicked: 6, revenue: 115960000 },
{ id: 'cmp-3', name: 'Back-to-office laptop week', channel: 'email', segment: 'corporate', status: 'sent', message: 'Equip your team: ThinkPad and MacBook bundles with 3-year Care+.', scheduledAt: '2026-09-15T08:30:00+05:30', recipients: 6, opened: 5, clicked: 3, revenue: 274900000 },
{ id: 'cmp-4', name: 'Accessories restock alert', channel: 'whatsapp', segment: 'wholesale', status: 'sent', message: 'Anker, Belkin & Spigen back in stock. Wholesale pricing for orders over 20 units.', scheduledAt: '2026-09-08T11:00:00+05:30', recipients: 7, opened: 7, clicked: 4, revenue: 48600000 },
{ id: 'cmp-5', name: 'Year-end clearance teaser', channel: 'email', segment: 'all', status: 'draft', message: '', scheduledAt: '2026-12-01T09:00:00+05:30', recipients: 0, opened: 0, clicked: 0, revenue: 0 }];


export const promotions: Promotion[] = [
{ id: 'pr-1', code: 'DEEPAVALI15', description: '15% off audio & smart home', kind: 'percent', amount: 15, uses: 0, limit: 500, endsAt: '2026-10-31', active: true },
{ id: 'pr-2', code: 'CASEFREE', description: 'Free case with any iPhone 15', kind: 'fixed', amount: 590000, uses: 38, limit: null, endsAt: '2026-10-10', active: true },
{ id: 'pr-3', code: 'WELCOME1000', description: 'Rs 1,000 off first online order over Rs 10,000', kind: 'fixed', amount: 100000, uses: 212, limit: null, endsAt: '2026-12-31', active: true },
{ id: 'pr-4', code: 'BULK5', description: '5% off wholesale orders over 20 units', kind: 'percent', amount: 5, uses: 17, limit: null, endsAt: '2026-11-30', active: false },
{ id: 'pr-5', code: 'AUG-AUDIO', description: '10% off headphones', kind: 'percent', amount: 10, uses: 164, limit: 200, endsAt: '2026-08-31', active: false }];


export const loyaltyTiers = [
{ id: 'bronze', label: 'Bronze', min: 0, perk: '1 point per Rs 100' },
{ id: 'silver', label: 'Silver', min: 1000, perk: '1.25× points · free screen protector install' },
{ id: 'gold', label: 'Gold', min: 5000, perk: '1.5× points · priority repairs · early access' }];