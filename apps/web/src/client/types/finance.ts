export type ExpenseCategory = 'Rent' | 'Utilities' | 'Salaries' | 'Marketing' | 'Logistics' | 'Maintenance' | 'Software' | 'Other';

export interface Expense {
  id: string;
  date: string;
  vendor: string;
  category: ExpenseCategory;
  branchId: string | null;
  /** Integer cents (LKR). */
  amount: number;
  method: 'bank_transfer' | 'cash' | 'card' | 'cheque';
  reference: string;
  status: 'paid' | 'pending_approval';
}

export interface BankAccount {
  id: string;
  name: string;
  bank: string;
  last4: string;
  /** Integer cents (LKR). */
  balance: number;
  kind: 'current' | 'savings' | 'cash';
}