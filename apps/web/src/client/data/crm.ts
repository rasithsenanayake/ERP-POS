import type { Deal, DealStage } from '../types/crm';

export const dealStages: {id: DealStage;label: string;probability: number;}[] = [
{ id: 'lead', label: 'Lead', probability: 10 },
{ id: 'qualified', label: 'Qualified', probability: 30 },
{ id: 'proposal', label: 'Proposal sent', probability: 55 },
{ id: 'negotiation', label: 'Negotiation', probability: 80 },
{ id: 'won', label: 'Won', probability: 100 },
{ id: 'lost', label: 'Lost', probability: 0 }];


export const deals: Deal[] = [
{ id: 'deal-1', title: '40 laptops for new office', company: 'Bayview Tech Solutions', contactName: 'Lakshan Perera', contactPhone: '077 300 4410', value: 1099600000, stage: 'negotiation', ownerId: 'u-ruwan', expectedClose: '2026-10-12', nextStep: 'Send revised quote with 3-year Care+', activities: [{ id: 'a1', kind: 'meeting', body: 'On-site demo of ThinkPad E14 with IT lead', userId: 'u-ruwan', at: '2026-10-02T11:00:00+05:30' }] },
{ id: 'deal-2', title: 'Guest room smart speakers', company: 'Hill Country Hotels', contactName: 'Udara Samarakoon', contactPhone: '077 640 1185', value: 262800000, stage: 'proposal', ownerId: 'u-kasun', expectedClose: '2026-10-20', nextStep: 'Follow up on proposal', activities: [{ id: 'a2', kind: 'email', body: 'Proposal for 120 Echo Dots sent', userId: 'u-kasun', at: '2026-09-30T15:20:00+05:30' }] },
{ id: 'deal-3', title: 'Staff phones refresh', company: 'Harbourline Logistics', contactName: 'Shanika Ekanayake', contactPhone: '077 622 8814', value: 674700000, stage: 'qualified', ownerId: 'u-tharushi', expectedClose: '2026-11-05', nextStep: 'Confirm handset mix', activities: [{ id: 'a3', kind: 'call', body: 'Needs 50 mid-range Android phones, MDM support', userId: 'u-tharushi', at: '2026-10-01T10:05:00+05:30' }] },
{ id: 'deal-4', title: 'Lobby security cameras', company: 'Fort Bay Boutique Hotel', contactName: 'Roshan Hewage', contactPhone: '077 284 9917', value: 47600000, stage: 'won', ownerId: 'u-sachini', expectedClose: '2026-09-28', nextStep: 'Installation booked', activities: [{ id: 'a4', kind: 'stage', body: 'Marked as won', userId: 'u-sachini', at: '2026-09-28T17:40:00+05:30' }] },
{ id: 'deal-5', title: 'Wholesale accessories contract', company: 'Central Hills Traders', contactName: 'Nuwan Kodikara', contactPhone: '077 563 2208', value: 185000000, stage: 'lead', ownerId: 'u-dilshan', expectedClose: '2026-11-15', nextStep: 'Intro call', activities: [] },
{ id: 'deal-6', title: 'Conference room AV kits', company: 'Lakeside Consulting', contactName: 'Nadeesha Herath', contactPhone: '076 509 1180', value: 98700000, stage: 'proposal', ownerId: 'u-ruwan', expectedClose: '2026-10-18', nextStep: 'Price check against competitor', activities: [] },
{ id: 'deal-7', title: 'Back-to-school laptop bundle', company: 'Kandy Office Supplies', contactName: 'Asela Kumara', contactPhone: '071 778 2059', value: 379800000, stage: 'qualified', ownerId: 'u-kasun', expectedClose: '2026-12-01', nextStep: 'Agree on bundle pricing', activities: [] },
{ id: 'deal-8', title: 'Resort Wi-Fi mesh upgrade', company: 'Southern Star Traders', contactName: 'Asanka Weerakkody', contactPhone: '077 667 0285', value: 158700000, stage: 'lead', ownerId: 'u-sachini', expectedClose: '2026-11-20', nextStep: 'Site survey', activities: [] },
{ id: 'deal-9', title: 'Retail display tablets', company: 'Metro Gadget Hub', contactName: 'Chamara Bandara', contactPhone: '071 845 2296', value: 82400000, stage: 'lost', ownerId: 'u-tharushi', expectedClose: '2026-09-20', nextStep: '—', activities: [{ id: 'a9', kind: 'stage', body: 'Lost on price', userId: 'u-tharushi', at: '2026-09-21T09:00:00+05:30' }] }];