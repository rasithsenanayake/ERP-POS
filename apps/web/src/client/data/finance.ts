import type { BankAccount, Expense, ExpenseCategory } from '../types/finance';

export const expenseCategories: ExpenseCategory[] = ['Rent', 'Utilities', 'Salaries', 'Marketing', 'Logistics', 'Maintenance', 'Software', 'Other'];

export const bankAccounts: BankAccount[] = [
{ id: 'ba-com', name: 'Operating account', bank: 'Commercial Bank', last4: '4471', balance: 1842650000, kind: 'current' },
{ id: 'ba-hnb', name: 'Payroll account', bank: 'Hatton National Bank', last4: '0932', balance: 615000000, kind: 'current' },
{ id: 'ba-sav', name: 'Tax reserve', bank: 'Sampath Bank', last4: '7720', balance: 940000000, kind: 'savings' },
{ id: 'ba-cash', name: 'Store cash floats', bank: 'Cash on hand', last4: '—', balance: 18500000, kind: 'cash' }];


export const expenses: Expense[] = [
{ id: 'exp-1', date: '2026-10-03', vendor: 'Ward Place Properties', category: 'Rent', branchId: 'br-col', amount: 85000000, method: 'bank_transfer', reference: 'OCT-RENT', status: 'paid' },
{ id: 'exp-2', date: '2026-10-03', vendor: 'Kandy City Centre Mgmt', category: 'Rent', branchId: 'br-kdy', amount: 52000000, method: 'bank_transfer', reference: 'KCC-1026', status: 'paid' },
{ id: 'exp-3', date: '2026-10-02', vendor: 'Galle Heritage Trust', category: 'Rent', branchId: 'br-gal', amount: 38000000, method: 'cheque', reference: 'CHQ 552190', status: 'paid' },
{ id: 'exp-4', date: '2026-10-02', vendor: 'Meta Platforms Ireland', category: 'Marketing', branchId: null, amount: 14500000, method: 'card', reference: 'FB-ADS-SEP', status: 'paid' },
{ id: 'exp-5', date: '2026-10-01', vendor: 'Ceylon Electricity Board', category: 'Utilities', branchId: 'br-col', amount: 9840000, method: 'bank_transfer', reference: 'CEB 0042218', status: 'paid' },
{ id: 'exp-6', date: '2026-09-30', vendor: 'Domex Couriers', category: 'Logistics', branchId: null, amount: 6215000, method: 'bank_transfer', reference: 'INV-DX-8812', status: 'pending_approval' },
{ id: 'exp-7', date: '2026-09-30', vendor: 'September payroll', category: 'Salaries', branchId: null, amount: 412000000, method: 'bank_transfer', reference: 'PAY-2026-09', status: 'paid' },
{ id: 'exp-8', date: '2026-09-27', vendor: 'CoolTech Aircon Services', category: 'Maintenance', branchId: 'br-kdy', amount: 4200000, method: 'cash', reference: 'Receipt 3391', status: 'paid' },
{ id: 'exp-9', date: '2026-09-25', vendor: 'Google Workspace', category: 'Software', branchId: null, amount: 2860000, method: 'card', reference: 'GWS-SEP', status: 'paid' },
{ id: 'exp-10', date: '2026-09-22', vendor: 'Dialog Axiata', category: 'Utilities', branchId: null, amount: 3150000, method: 'bank_transfer', reference: 'DLG 77120', status: 'paid' },
{ id: 'exp-11', date: '2026-09-18', vendor: 'PrintCraft Colombo', category: 'Marketing', branchId: 'br-col', amount: 7800000, method: 'bank_transfer', reference: 'PC-4410', status: 'pending_approval' },
{ id: 'exp-12', date: '2026-09-12', vendor: 'Pronto Lanka', category: 'Logistics', branchId: null, amount: 3990000, method: 'bank_transfer', reference: 'PRT-09-12', status: 'paid' }];