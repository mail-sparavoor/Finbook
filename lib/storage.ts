// ==========================================
// PERSONAL FINANCE SEED DATA & STORAGE
// ==========================================

import {
  PersonalTransaction,
  PersonalDue,
  PersonalBudget,
  PersonalProfile,
  PersonContact,
  UserAccount,
} from './types';

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance & Side Gig',
  'Loan Repayment Received',
  'Loan Received (Money Borrowed)',
  'Investments & Dividends',
  'Gifts & Grants',
  'Rental Income',
  'Refunds',
  'Other Income',
];

export const EXPENSE_CATEGORIES = [
  'Groceries & Supplies',
  'Food & Dining Out',
  'Rent & Housing',
  'Loan Given (Money Lent)',
  'Loan Repaid to Person',
  'Electricity & Utilities',
  'Transport & Fuel',
  'Shopping & Apparel',
  'Health & Medical',
  'Entertainment & Leisure',
  'Subscriptions & Apps',
  'Education & Courses',
  'Personal Care',
  'Gifts & Donations',
  'Other Expense',
];

export const DEFAULT_PAYMENT_MODES = [
  'Online / UPI',
  'Cash',
  'Net Banking',
  'Card (Debit/Credit)',
];

export const SEED_PROFILE: PersonalProfile = {
  name: 'User',
  email: '',
  currency: 'INR',
  currencySymbol: '₹',
};

function getRelativeDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

export function generateSeedTransactions(): PersonalTransaction[] {
  return [
    {
      id: 'tx-1',
      date: getRelativeDate(4),
      type: 'INCOME',
      category: 'Salary',
      amount: 85000,
      paymentMode: 'Net Banking',
      notes: 'Monthly salary credit',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-2',
      date: getRelativeDate(3),
      type: 'EXPENSE',
      category: 'Rent & Housing',
      amount: 18000,
      paymentMode: 'Net Banking',
      notes: 'Apartment monthly rent',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-3',
      date: getRelativeDate(3),
      type: 'EXPENSE',
      category: 'Loan Given (Money Lent)',
      amount: 5000,
      paymentMode: 'Online / UPI',
      notes: 'Loan given to Imran (Friend) - Trip hotel advance split',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-4',
      date: getRelativeDate(2),
      type: 'INCOME',
      category: 'Loan Repayment Received',
      amount: 2000,
      paymentMode: 'Online / UPI',
      notes: 'Repayment received from Imran (Friend)',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-5',
      date: getRelativeDate(2),
      type: 'EXPENSE',
      category: 'Groceries & Supplies',
      amount: 4250,
      paymentMode: 'Online / UPI',
      notes: 'Weekly supermarket shopping',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-6',
      date: getRelativeDate(1),
      type: 'EXPENSE',
      category: 'Food & Dining Out',
      amount: 1200,
      paymentMode: 'Cash',
      notes: 'Dinner with family',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-7',
      date: getRelativeDate(0),
      type: 'EXPENSE',
      category: 'Electricity & Utilities',
      amount: 2400,
      paymentMode: 'Online / UPI',
      notes: 'Monthly electricity bill',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-8',
      date: getRelativeDate(0),
      type: 'INCOME',
      category: 'Freelance & Side Gig',
      amount: 15000,
      paymentMode: 'Net Banking',
      notes: 'Web design client milestone payout',
      createdAt: new Date().toISOString(),
    },
  ];
}

export const SEED_TRANSACTIONS: PersonalTransaction[] = generateSeedTransactions();

export const SEED_CONTACTS: PersonContact[] = [
  {
    id: 'contact-1',
    name: 'Imran (Friend)',
    phone: '+91 99461 11223',
    notes: 'Friend from college',
    createdAt: getRelativeDate(30),
  },
  {
    id: 'contact-2',
    name: 'Rahul (Colleague)',
    phone: '+91 98470 99881',
    notes: 'Work colleague',
    createdAt: getRelativeDate(20),
  },
  {
    id: 'contact-3',
    name: 'Brother (Faheem)',
    phone: '+91 97450 44332',
    notes: 'Family member',
    createdAt: getRelativeDate(60),
  },
];

export const SEED_DUES: PersonalDue[] = [
  {
    id: 'due-1',
    personId: 'contact-1',
    personName: 'Imran (Friend)',
    phone: '+91 99461 11223',
    type: 'I_LENT',
    originalAmount: 5000,
    paidAmount: 2000,
    remainingAmount: 3000,
    dueDate: getRelativeDate(-10),
    notes: 'Trip hotel advance split',
    status: 'ACTIVE',
    createdAt: getRelativeDate(15),
  },
  {
    id: 'due-2',
    personId: 'contact-2',
    personName: 'Rahul (Colleague)',
    phone: '+91 98470 99881',
    type: 'I_LENT',
    originalAmount: 2500,
    paidAmount: 0,
    remainingAmount: 2500,
    dueDate: getRelativeDate(-5),
    notes: 'Concert tickets booking',
    status: 'ACTIVE',
    createdAt: getRelativeDate(7),
  },
  {
    id: 'due-3',
    personId: 'contact-3',
    personName: 'Brother (Faheem)',
    phone: '+91 97450 44332',
    type: 'I_BORROWED',
    originalAmount: 10000,
    paidAmount: 4000,
    remainingAmount: 6000,
    dueDate: getRelativeDate(-20),
    notes: 'Borrowed for laptop upgrade',
    status: 'ACTIVE',
    createdAt: getRelativeDate(20),
  },
];

export const SEED_BUDGETS: PersonalBudget[] = [
  { id: 'bg-1', category: 'Food & Dining Out', monthlyLimit: 8000 },
  { id: 'bg-2', category: 'Groceries & Supplies', monthlyLimit: 12000 },
  { id: 'bg-3', category: 'Shopping & Apparel', monthlyLimit: 6000 },
  { id: 'bg-4', category: 'Transport & Fuel', monthlyLimit: 5000 },
  { id: 'bg-5', category: 'Entertainment & Leisure', monthlyLimit: 4000 },
  { id: 'bg-6', category: 'Electricity & Utilities', monthlyLimit: 4500 },
];

export const SEED_USERS: UserAccount[] = [
  {
    id: 'user-admin',
    name: 'Admin User',
    email: 'admin@myfinbook.com',
    password: 'admin123',
    role: 'ADMIN',
    status: 'ACTIVE',
    currency: 'INR',
    currencySymbol: '₹',
    createdAt: new Date().toISOString(),
  },
];
