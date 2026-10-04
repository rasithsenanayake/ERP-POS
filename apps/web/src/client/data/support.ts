import type { Ticket, TicketChannel, TicketPriority, TicketStatus } from '../types/support';

export const ticketChannelLabels: Record<TicketChannel, string> = { email: 'Email', whatsapp: 'WhatsApp', phone: 'Phone', walk_in: 'Walk-in' };
export const ticketStatusLabels: Record<TicketStatus, string> = { open: 'Open', pending: 'Waiting on customer', resolved: 'Resolved' };
export const ticketPriorityLabels: Record<TicketPriority, string> = { low: 'Low', normal: 'Normal', high: 'High', urgent: 'Urgent' };

export const cannedReplies = [
{ id: 'warranty', label: 'Warranty process', body: 'Thanks for reaching out. Please bring the device and your receipt to any Serendib store and we\u2019ll log a warranty claim on the spot. Repairs usually take 5–7 working days.' },
{ id: 'tracking', label: 'Delivery tracking', body: 'Your order has been handed to our courier. You\u2019ll receive an SMS with the tracking link shortly — deliveries within Colombo usually arrive next working day.' },
{ id: 'refund', label: 'Refund timeline', body: 'Your refund has been approved. Card refunds take 5–10 working days to appear depending on your bank; cash refunds can be collected at the store.' }];


export const tickets: Ticket[] = [
{
  id: 'tk-1', number: 'SUP-2041', subject: 'AirPods Pro left earbud not charging', customerId: 'cus-1', channel: 'whatsapp', status: 'open', priority: 'high', assigneeId: 'u-tharushi', createdAt: '2026-10-04T08:12:00+05:30', slaDueAt: '2026-10-04T12:12:00+05:30', orderRef: null,
  messages: [
  { id: 'm1', author: 'customer', userId: null, body: 'Hi, I bought AirPods Pro from your Colombo 07 store last month. The left earbud stopped charging since yesterday. Is this covered?', at: '2026-10-04T08:12:00+05:30', internal: false },
  { id: 'm2', author: 'agent', userId: 'u-tharushi', body: 'Checked — purchased 6 Sep, within Apple warranty. Asking him to come in.', at: '2026-10-04T08:40:00+05:30', internal: true }]

},
{
  id: 'tk-2', number: 'SUP-2040', subject: 'Invoice needed with company VAT number', customerId: 'cus-11', channel: 'email', status: 'open', priority: 'normal', assigneeId: null, createdAt: '2026-10-03T16:45:00+05:30', slaDueAt: '2026-10-04T16:45:00+05:30', orderRef: null,
  messages: [{ id: 'm1', author: 'customer', userId: null, body: 'Could you reissue last week\u2019s invoice with our VAT registration number (114589632-7000)? Our finance team needs it for input tax.', at: '2026-10-03T16:45:00+05:30', internal: false }]
},
{
  id: 'tk-3', number: 'SUP-2039', subject: 'Delivery to Kandy delayed', customerId: 'cus-27', channel: 'phone', status: 'pending', priority: 'normal', assigneeId: 'u-kasun', createdAt: '2026-10-02T11:20:00+05:30', slaDueAt: '2026-10-03T11:20:00+05:30', orderRef: null,
  messages: [
  { id: 'm1', author: 'customer', userId: null, body: 'Called about online order not yet delivered — promised 2 days.', at: '2026-10-02T11:20:00+05:30', internal: false },
  { id: 'm2', author: 'agent', userId: 'u-kasun', body: 'Sorry for the delay, Ishani. The courier confirms it\u2019s out for delivery today. Could you confirm someone will be home after 2pm?', at: '2026-10-02T13:05:00+05:30', internal: false }]

},
{
  id: 'tk-4', number: 'SUP-2038', subject: 'Wrong colour JBL Flip 6 received', customerId: 'cus-48', channel: 'email', status: 'open', priority: 'urgent', assigneeId: 'u-sachini', createdAt: '2026-10-03T09:02:00+05:30', slaDueAt: '2026-10-03T13:02:00+05:30', orderRef: null,
  messages: [{ id: 'm1', author: 'customer', userId: null, body: 'Ordered the blue Flip 6 as a birthday gift for Saturday, but a red one arrived. Can this be swapped before the weekend?', at: '2026-10-03T09:02:00+05:30', internal: false }]
},
{
  id: 'tk-5', number: 'SUP-2037', subject: 'Bulk pricing for 30 power banks', customerId: 'cus-13', channel: 'whatsapp', status: 'resolved', priority: 'low', assigneeId: 'u-ruwan', createdAt: '2026-09-30T10:10:00+05:30', slaDueAt: '2026-10-01T10:10:00+05:30', orderRef: null,
  messages: [
  { id: 'm1', author: 'customer', userId: null, body: 'What\u2019s your best price for 30 Anker PowerCore 10000?', at: '2026-09-30T10:10:00+05:30', internal: false },
  { id: 'm2', author: 'agent', userId: 'u-ruwan', body: 'Wholesale price is Rs 9,900 each for 30 units — I\u2019ve sent a quotation to your email.', at: '2026-09-30T10:42:00+05:30', internal: false }]

},
{
  id: 'tk-6', number: 'SUP-2036', subject: 'Screen protector bubbling after install', customerId: 'cus-17', channel: 'walk_in', status: 'resolved', priority: 'low', assigneeId: 'u-tharushi', createdAt: '2026-09-29T15:30:00+05:30', slaDueAt: '2026-09-30T15:30:00+05:30', orderRef: null,
  messages: [{ id: 'm1', author: 'agent', userId: 'u-tharushi', body: 'Replaced free of charge in store.', at: '2026-09-29T15:45:00+05:30', internal: true }]
}];