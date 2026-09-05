// ==========================================
// PERSONAL FINANCE & CASHBOOK TYPES
// ==========================================

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface PersonContact {
  id: string;
  name: string;
  phone?: string;
  notes?: string;
  createdAt: string;
}

export interface PersonalTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  category: string;
  amount: number;
  paymentMode?: string;
  personId?: string;
  personName?: string;
  accountId?: string;
  notes?: string;
  createdAt: string;
}

export type DueType = 'I_LENT' | 'I_BORROWED';

export interface PersonalDue {
  id: string;
  personId?: string;
  personName: string;
  phone?: string;
  type: DueType; // I_LENT = They owe me, I_BORROWED = I owe them
  originalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  notes?: string;
  status: 'ACTIVE' | 'SETTLED';
  createdAt: string;
}

export interface PersonalBudget {
  id: string;
  category: string;
  monthlyLimit: number;
  icon?: string;
}

export interface PersonalProfile {
  name: string;
  email?: string;
  currency: string;
  currencySymbol: string;
}

// ==========================================
// USER AUTHENTICATION & MULTI-USER TYPES
// ==========================================

export type UserRole = 'ADMIN' | 'USER';
export type UserStatus = 'ACTIVE' | 'DISABLED';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  currency: string;
  currencySymbol: string;
  createdAt: string;
}
