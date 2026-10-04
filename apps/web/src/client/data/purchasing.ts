import type { PurchaseOrder, Supplier } from '../types/purchasing';

export const suppliers: Supplier[] = [
{ id: 'sup-lmd', name: 'Lanka Mobile Distributors', contact: 'Harsha Mendis', phone: '011 254 8890', email: 'orders@lmd.lk', leadTimeDays: 5, terms: 'Net 30', onTimePct: 94 },
{ id: 'sup-cai', name: 'Ceylon Audio Imports', contact: 'Anoma Silva', phone: '011 269 3301', email: 'sales@ceylonaudio.lk', leadTimeDays: 9, terms: 'Net 30', onTimePct: 81 },
{ id: 'sup-ics', name: 'Island Computer Supplies', contact: 'Rohan Pieris', phone: '011 243 7712', email: 'b2b@islandcomputers.lk', leadTimeDays: 7, terms: 'Net 15', onTimePct: 88 },
{ id: 'sup-sll', name: 'SmartLiving Lanka', contact: 'Nadia Farook', phone: '077 334 1290', email: 'trade@smartliving.lk', leadTimeDays: 4, terms: 'Due on receipt', onTimePct: 97 },
{ id: 'sup-cah', name: 'Colombo Accessory House', contact: 'Suresh Kumar', phone: '011 233 6604', email: 'wholesale@cah.lk', leadTimeDays: 3, terms: 'Net 15', onTimePct: 91 }];


export const purchaseOrders: PurchaseOrder[] = [
{
  id: 'po-1048', number: 'PO-1048', supplierId: 'sup-lmd', warehouseId: 'wh-kel', status: 'sent', createdAt: '2026-10-01T09:20:00+05:30', expectedAt: '2026-10-06T12:00:00+05:30', createdBy: 'u-nimali', note: 'Festive season top-up',
  lines: [
  { variantId: 'p-iph15-v1', ordered: 10, received: 0, unitCost: 24600000 },
  { variantId: 'p-iph15-v2', ordered: 6, received: 0, unitCost: 24600000 },
  { variantId: 'p-ga55-v1', ordered: 12, received: 0, unitCost: 11200000 }]

},
{
  id: 'po-1047', number: 'PO-1047', supplierId: 'sup-cah', warehouseId: 'wh-kel', status: 'partial', createdAt: '2026-09-28T14:05:00+05:30', expectedAt: '2026-10-01T12:00:00+05:30', createdBy: 'u-ishara', note: '',
  lines: [
  { variantId: 'p-anker20-v1', ordered: 60, received: 40, unitCost: 390000 },
  { variantId: 'p-cable-v1', ordered: 80, received: 80, unitCost: 240000 },
  { variantId: 'p-glass-v1', ordered: 150, received: 100, unitCost: 90000 }]

},
{
  id: 'po-1046', number: 'PO-1046', supplierId: 'sup-cai', warehouseId: 'wh-col', status: 'sent', createdAt: '2026-09-24T11:40:00+05:30', expectedAt: '2026-10-03T12:00:00+05:30', createdBy: 'u-nimali', note: 'Supplier confirmed shipment cleared customs',
  lines: [
  { variantId: 'p-wh1000-v1', ordered: 8, received: 0, unitCost: 10400000 },
  { variantId: 'p-airpods-v1', ordered: 15, received: 0, unitCost: 6900000 }]

},
{
  id: 'po-1045', number: 'PO-1045', supplierId: 'sup-sll', warehouseId: 'wh-kdy', status: 'draft', createdAt: '2026-10-03T16:10:00+05:30', expectedAt: '2026-10-08T12:00:00+05:30', createdBy: 'u-kasun', note: 'Waiting on revised price list',
  lines: [
  { variantId: 'p-tapo-v1', ordered: 20, received: 0, unitCost: 810000 },
  { variantId: 'p-echo-v1', ordered: 10, received: 0, unitCost: 1550000 }]

},
{
  id: 'po-1044', number: 'PO-1044', supplierId: 'sup-ics', warehouseId: 'wh-kel', status: 'received', createdAt: '2026-09-15T10:00:00+05:30', expectedAt: '2026-09-22T12:00:00+05:30', createdBy: 'u-nimali', note: '',
  lines: [
  { variantId: 'p-mba13-v1', ordered: 5, received: 5, unitCost: 33400000 },
  { variantId: 'p-thinkpad-v1', ordered: 6, received: 6, unitCost: 22900000 }]

},
{
  id: 'po-1043', number: 'PO-1043', supplierId: 'sup-cah', warehouseId: 'wh-gal', status: 'received', createdAt: '2026-09-10T09:30:00+05:30', expectedAt: '2026-09-13T12:00:00+05:30', createdBy: 'u-sachini', note: '',
  lines: [
  { variantId: 'p-case-v1', ordered: 30, received: 30, unitCost: 290000 },
  { variantId: 'p-m331-v1', ordered: 12, received: 12, unitCost: 520000 }]

},
{
  id: 'po-1042', number: 'PO-1042', supplierId: 'sup-cai', warehouseId: 'wh-kel', status: 'cancelled', createdAt: '2026-09-02T13:15:00+05:30', expectedAt: '2026-09-11T12:00:00+05:30', createdBy: 'u-nimali', note: 'Supplier out of stock — reordered via PO-1046',
  lines: [{ variantId: 'p-sonos-v1', ordered: 6, received: 0, unitCost: 8200000 }]
}];