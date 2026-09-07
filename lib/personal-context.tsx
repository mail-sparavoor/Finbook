"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  PersonalTransaction,
  PersonalDue,
  PersonalBudget,
  PersonalProfile,
  PersonContact,
  TransactionType,
  DueType,
} from './types';
import {
  SEED_PROFILE,
  generateSeedTransactions,
  SEED_DUES,
  SEED_BUDGETS,
  SEED_CONTACTS,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  DEFAULT_PAYMENT_MODES,
} from './storage';
import { round2 } from './finance-math';
import { useAuth } from './auth-context';

export interface PersonLedger {
  contact: PersonContact | null;
  personName: string;
  phone?: string;
  dues: PersonalDue[];
  transactions: PersonalTransaction[];
  totalLent: number;
  totalBorrowed: number;
  totalSettledLent: number;
  totalSettledBorrowed: number;
  netBalance: number;
  status: 'RECEIVABLE' | 'PAYABLE' | 'SETTLED';
}

interface PersonalContextType {
  profile: PersonalProfile;
  updateProfile: (data: Partial<PersonalProfile>) => void;

  // Transactions
  transactions: PersonalTransaction[];
  addTransaction: (tx: {
    type: TransactionType;
    category: string;
    amount: number;
    paymentMode?: string;
    personId?: string;
    personName?: string;
    date?: string;
    notes?: string;
  }) => void;
  updateTransaction: (id: string, data: Partial<PersonalTransaction>) => void;
  deleteTransaction: (id: string) => void;

  // Person Profiles & Contact Ledgers
  contacts: PersonContact[];
  getOrCreateContact: (name: string, phone?: string) => PersonContact;
  addContact: (name: string, phone?: string, notes?: string) => PersonContact;
  updateContact: (id: string, data: Partial<PersonContact>) => void;
  deleteContact: (id: string, deleteAssociatedDues?: boolean) => void;
  getPersonLedger: (personIdOrName: string) => PersonLedger;

  // Dues / Lending & Borrowing
  dues: PersonalDue[];
  addDue: (due: {
    personName: string;
    phone?: string;
    personId?: string;
    type: DueType;
    amount: number;
    dueDate?: string;
    notes?: string;
  }) => void;
  updateDue: (id: string, data: Partial<PersonalDue>) => void;
  recordDuePayment: (dueId: string, amount: number, accountId?: string, notes?: string) => void;
  deleteDue: (id: string) => void;

  // Budgets
  budgets: PersonalBudget[];
  updateBudgetLimit: (category: string, monthlyLimit: number) => void;

  // Categories & Payment Modes
  expenseCategories: string[];
  incomeCategories: string[];
  addCategory: (type: 'EXPENSE' | 'INCOME', categoryName: string) => string;
  paymentModes: string[];
  addPaymentMode: (modeName: string) => string;

  // Global Helpers & Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  resetAllData: () => void;
  refreshData: () => Promise<void>;

  // Metrics
  metrics: {
    totalNetWorth: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    netSavings: number;
    savingsRate: number;
    totalLent: number;
    totalBorrowed: number;
  };
}

const PersonalContext = createContext<PersonalContextType | undefined>(undefined);

export function PersonalFinanceProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const userId = currentUser ? currentUser.id : '';

  const defaultProfile: PersonalProfile = useMemo(() => {
    if (currentUser) {
      return {
        name: currentUser.name,
        email: currentUser.email,
        currency: currentUser.currency || 'INR',
        currencySymbol: currentUser.currencySymbol || '₹',
      };
    }
    return SEED_PROFILE;
  }, [currentUser]);

  const [profile, setProfile] = useState<PersonalProfile>(defaultProfile);
  const [transactions, setTransactions] = useState<PersonalTransaction[]>([]);
  const [dues, setDues] = useState<PersonalDue[]>([]);
  const [contacts, setContacts] = useState<PersonContact[]>([]);
  const [budgets, setBudgets] = useState<PersonalBudget[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<string[]>(EXPENSE_CATEGORIES);
  const [incomeCategories, setIncomeCategories] = useState<string[]>(INCOME_CATEGORIES);
  const [paymentModes, setPaymentModes] = useState<string[]>(DEFAULT_PAYMENT_MODES);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all user data from MySQL API endpoints
  const refreshData = useCallback(async () => {
    if (!currentUser || !userId) return;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      // 1. Fetch transactions
      fetch(`/api/transactions?userId=${encodeURIComponent(userId)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data)) setTransactions(json.data);
        })
        .catch(() => {});

      // 2. Fetch dues
      fetch(`/api/dues?userId=${encodeURIComponent(userId)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data)) setDues(json.data);
        })
        .catch(() => {});

      // 3. Fetch budgets
      fetch(`/api/budgets?userId=${encodeURIComponent(userId)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data) && json.data.length > 0) setBudgets(json.data);
        })
        .catch(() => {});

      // 4. Fetch contacts
      fetch(`/api/contacts?userId=${encodeURIComponent(userId)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data)) setContacts(json.data);
        })
        .catch(() => {})
        .finally(() => clearTimeout(timeoutId));
    } catch (error) {
      console.warn('API data fetch failed, using cached state', error);
    }
  }, [currentUser, userId]);

  // Load from MySQL when currentUser/userId changes
  useEffect(() => {
    if (currentUser) {
      setProfile({
        name: currentUser.name,
        email: currentUser.email,
        currency: currentUser.currency || 'INR',
        currencySymbol: currentUser.currencySymbol || '₹',
      });
      refreshData();
    }
  }, [currentUser, userId, refreshData]);

  const addCategory = (type: 'EXPENSE' | 'INCOME', categoryName: string): string => {
    const trimmed = categoryName.trim();
    if (!trimmed) return '';
    if (type === 'EXPENSE') {
      setExpenseCategories((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    } else {
      setIncomeCategories((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    }
    return trimmed;
  };

  const addPaymentMode = (modeName: string): string => {
    const trimmed = modeName.trim();
    if (!trimmed) return '';
    setPaymentModes((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    return trimmed;
  };

  const updateProfile = (data: Partial<PersonalProfile>) => {
    setProfile((prev) => ({ ...prev, ...data }));
  };

  // Contacts
  const getOrCreateContact = (name: string, phone?: string): PersonContact => {
    const trimmedName = name.trim();
    const existing = contacts.find(
      (c) => c.name.toLowerCase() === trimmedName.toLowerCase() || (phone && c.phone && c.phone.trim() === phone.trim())
    );
    if (existing) {
      if (phone && !existing.phone) {
        updateContact(existing.id, { phone: phone.trim() });
      }
      return existing;
    }
    return addContact(trimmedName, phone);
  };

  const addContact = (name: string, phone?: string, notes?: string): PersonContact => {
    const trimmedName = name.trim();
    const existing = contacts.find(
      (c) => c.name.toLowerCase() === trimmedName.toLowerCase() || (phone && c.phone && c.phone.trim() === phone.trim())
    );
    if (existing) return existing;

    const newContact: PersonContact = {
      id: `contact-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: trimmedName,
      phone: phone?.trim(),
      notes: notes?.trim(),
      createdAt: new Date().toISOString(),
    };

    // Optimistic UI update
    setContacts((prev) => [newContact, ...prev]);

    // Async MySQL insert
    fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: newContact.id,
        userId,
        name: newContact.name,
        phone: newContact.phone,
        notes: newContact.notes,
      }),
    }).catch((err) => console.error('Failed to sync contact to MySQL', err));

    return newContact;
  };

  const updateContact = (id: string, data: Partial<PersonContact>) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));

    fetch('/api/contacts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    }).catch((err) => console.error('Failed to update contact in MySQL', err));
  };

  const deleteContact = (id: string, deleteAssociatedDues: boolean = true) => {
    const contact = contacts.find((c: PersonContact) => c.id === id);
    setContacts((prev: PersonContact[]) => prev.filter((c: PersonContact) => c.id !== id));
    if (deleteAssociatedDues && contact) {
      setDues((prev: PersonalDue[]) =>
        prev.filter((d: PersonalDue) => d.personId !== id && d.personName.toLowerCase() !== contact.name.toLowerCase())
      );
    }

    fetch(`/api/contacts?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch((err) =>
      console.error('Failed to delete contact in MySQL', err)
    );
  };

  // Aggregated Ledger for a specific person
  const getPersonLedger = (personIdOrName: string): PersonLedger => {
    const contact =
      contacts.find((c) => c.id === personIdOrName || c.name.toLowerCase() === personIdOrName.toLowerCase()) || null;
    const personName = contact ? contact.name : personIdOrName;
    const phone = contact?.phone;

    const personDues = dues.filter(
      (d) => (contact && d.personId === contact.id) || d.personName.toLowerCase() === personName.toLowerCase()
    );

    const personTransactions = transactions.filter(
      (t) =>
        (contact && t.personId === contact.id) ||
        (t.personName && t.personName.toLowerCase() === personName.toLowerCase()) ||
        (t.notes && t.notes.toLowerCase().includes(personName.toLowerCase()))
    );

    const lentDues = personDues.filter((d) => d.type === 'I_LENT');
    const borrowedDues = personDues.filter((d) => d.type === 'I_BORROWED');

    const totalLent = lentDues.reduce((s, d) => s + d.originalAmount, 0);
    const totalSettledLent = lentDues.reduce((s, d) => s + d.paidAmount, 0);
    const remainingLent = lentDues.filter((d) => d.status === 'ACTIVE').reduce((s, d) => s + d.remainingAmount, 0);

    const totalBorrowed = borrowedDues.reduce((s, d) => s + d.originalAmount, 0);
    const totalSettledBorrowed = borrowedDues.reduce((s, d) => s + d.paidAmount, 0);
    const remainingBorrowed = borrowedDues
      .filter((d) => d.status === 'ACTIVE')
      .reduce((s, d) => s + d.remainingAmount, 0);

    const netBalance = round2(remainingLent - remainingBorrowed);
    const status = netBalance > 0 ? 'RECEIVABLE' : netBalance < 0 ? 'PAYABLE' : 'SETTLED';

    return {
      contact,
      personName,
      phone,
      dues: personDues,
      transactions: personTransactions,
      totalLent,
      totalBorrowed,
      totalSettledLent,
      totalSettledBorrowed,
      netBalance,
      status,
    };
  };

  // Add Transaction
  const addTransaction = (tx: {
    type: TransactionType;
    category: string;
    amount: number;
    paymentMode?: string;
    personId?: string;
    personName?: string;
    date?: string;
    notes?: string;
  }) => {
    const rounded = round2(tx.amount);
    const newTx: PersonalTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: tx.date || new Date().toISOString().split('T')[0],
      type: tx.type,
      category: tx.category,
      amount: rounded,
      paymentMode: tx.paymentMode || 'Online / UPI',
      personId: tx.personId,
      personName: tx.personName,
      notes: tx.notes,
      createdAt: new Date().toISOString(),
    };

    // Optimistic UI update
    setTransactions((prev) => [newTx, ...prev]);

    // Async MySQL insert
    fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newTx,
        userId,
      }),
    }).catch((err) => console.error('Failed to sync transaction to MySQL', err));
  };

  const updateTransaction = (id: string, data: Partial<PersonalTransaction>) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...data, amount: data.amount !== undefined ? round2(data.amount) : t.amount } : t))
    );

    fetch('/api/transactions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        ...data,
        amount: data.amount !== undefined ? round2(data.amount) : undefined,
        userId,
      }),
    }).catch((err) => console.error('Failed to update transaction in MySQL', err));
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    fetch(`/api/transactions?id=${encodeURIComponent(id)}&userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    }).catch((err) => console.error('Failed to delete transaction in MySQL', err));
  };

  // Add Due
  const addDue = (due: {
    personName: string;
    phone?: string;
    personId?: string;
    type: DueType;
    amount: number;
    dueDate?: string;
    notes?: string;
  }) => {
    const rounded = round2(due.amount);
    const currentDate = new Date().toISOString().split('T')[0];
    const contact = due.personId
      ? contacts.find((c) => c.id === due.personId) || getOrCreateContact(due.personName, due.phone)
      : getOrCreateContact(due.personName, due.phone);

    const newDue: PersonalDue = {
      id: `due-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      personId: contact.id,
      personName: contact.name,
      phone: contact.phone || due.phone,
      type: due.type,
      originalAmount: rounded,
      paidAmount: 0,
      remainingAmount: rounded,
      dueDate: due.dueDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      notes: due.notes,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    // Optimistic UI update
    setDues((prev) => [newDue, ...prev]);

    // Async MySQL insert
    fetch('/api/dues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newDue,
        userId,
      }),
    }).catch((err) => console.error('Failed to sync due to MySQL', err));

    // Linked transaction
    const isLent = due.type === 'I_LENT';
    addTransaction({
      type: isLent ? 'EXPENSE' : 'INCOME',
      category: isLent ? 'Loan Given (Money Lent)' : 'Loan Received (Money Borrowed)',
      amount: rounded,
      personId: contact.id,
      personName: contact.name,
      date: currentDate,
      notes: isLent
        ? `Loan given to ${contact.name}${due.notes ? ` (${due.notes})` : ''}`
        : `Loan borrowed from ${contact.name}${due.notes ? ` (${due.notes})` : ''}`,
    });
  };

  const recordDuePayment = (dueId: string, amount: number, accountId?: string, notes?: string) => {
    const targetDue = dues.find((d) => d.id === dueId);
    if (!targetDue) return;

    const rounded = round2(amount);
    const newPaid = round2(targetDue.paidAmount + rounded);
    const newRemaining = Math.max(0, round2(targetDue.originalAmount - newPaid));
    const newStatus = newRemaining === 0 ? 'SETTLED' : 'ACTIVE';
    const currentDate = new Date().toISOString().split('T')[0];

    // Optimistic UI update
    setDues((prev) =>
      prev.map((d) =>
        d.id === dueId
          ? {
              ...d,
              paidAmount: newPaid,
              remainingAmount: newRemaining,
              status: newStatus,
            }
          : d
      )
    );

    // Async MySQL update
    fetch('/api/dues', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: dueId,
        paidAmount: newPaid,
        status: newStatus,
      }),
    }).catch((err) => console.error('Failed to update due payment in MySQL', err));

    // Linked Transaction
    const isLent = targetDue.type === 'I_LENT';
    addTransaction({
      type: isLent ? 'INCOME' : 'EXPENSE',
      category: isLent ? 'Loan Repayment Received' : 'Loan Repaid to Person',
      amount: rounded,
      personId: targetDue.personId,
      personName: targetDue.personName,
      date: currentDate,
      notes: isLent
        ? `Repayment received from ${targetDue.personName}${notes ? ` (${notes})` : ''}`
        : `Repayment paid to ${targetDue.personName}${notes ? ` (${notes})` : ''}`,
    });
  };

  const updateDue = (id: string, data: Partial<PersonalDue>) => {
    setDues((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const updated = { ...d, ...data };
        if (data.originalAmount !== undefined || data.paidAmount !== undefined) {
          const orig = round2(data.originalAmount !== undefined ? Number(data.originalAmount) : d.originalAmount);
          const paid = round2(data.paidAmount !== undefined ? Number(data.paidAmount) : d.paidAmount);
          updated.originalAmount = orig;
          updated.paidAmount = paid;
          updated.remainingAmount = Math.max(0, round2(orig - paid));
          updated.status = updated.remainingAmount === 0 ? 'SETTLED' : 'ACTIVE';
        }
        return updated;
      })
    );

    fetch('/api/dues', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        ...data,
        userId,
      }),
    }).catch((err) => console.error('Failed to update due in MySQL', err));
  };

  const deleteDue = (id: string) => {
    setDues((prev) => prev.filter((d) => d.id !== id));

    fetch(`/api/dues?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch((err) =>
      console.error('Failed to delete due in MySQL', err)
    );
  };

  // Budgets
  const updateBudgetLimit = (category: string, monthlyLimit: number) => {
    const limit = round2(monthlyLimit);
    setBudgets((prev) => {
      const existing = prev.find((b) => b.category === category);
      if (existing) {
        return prev.map((b) => (b.category === category ? { ...b, monthlyLimit: limit } : b));
      }
      return [...prev, { id: `bg-${Date.now()}`, category, monthlyLimit: limit }];
    });

    fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        category,
        monthlyLimit: limit,
      }),
    }).catch((err) => console.error('Failed to sync budget to MySQL', err));
  };

  const resetAllData = () => {
    const freshTx = generateSeedTransactions();
    setProfile(SEED_PROFILE);
    setTransactions(freshTx);
    setDues(SEED_DUES);
    setContacts(SEED_CONTACTS);
    setBudgets(SEED_BUDGETS);
    setExpenseCategories(EXPENSE_CATEGORIES);
    setIncomeCategories(INCOME_CATEGORIES);
    setPaymentModes(DEFAULT_PAYMENT_MODES);
    localStorage.clear();
  };

  // Metrics
  const metrics = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    let relevantTx = transactions.filter((t) => t.date && t.date.startsWith(currentMonth));

    if (relevantTx.length === 0 && transactions.length > 0) {
      relevantTx = transactions;
    }

    const monthlyIncome = relevantTx
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const monthlyExpenses = relevantTx
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const netSavings = round2(monthlyIncome - monthlyExpenses);
    const savingsRate = monthlyIncome > 0 ? Math.round((netSavings / monthlyIncome) * 100) : 0;

    const allIncome = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const allExpenses = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalNetWorth = round2(allIncome - allExpenses);

    const totalLent = dues
      .filter((d) => d.type === 'I_LENT' && d.status === 'ACTIVE')
      .reduce((sum, d) => sum + Number(d.remainingAmount || 0), 0);

    const totalBorrowed = dues
      .filter((d) => d.type === 'I_BORROWED' && d.status === 'ACTIVE')
      .reduce((sum, d) => sum + Number(d.remainingAmount || 0), 0);

    return {
      totalNetWorth,
      monthlyIncome: round2(monthlyIncome),
      monthlyExpenses: round2(monthlyExpenses),
      netSavings,
      savingsRate,
      totalLent: round2(totalLent),
      totalBorrowed: round2(totalBorrowed),
    };
  }, [transactions, dues]);

  return (
    <PersonalContext.Provider
      value={{
        profile,
        updateProfile,
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        contacts,
        getOrCreateContact,
        addContact,
        updateContact,
        deleteContact,
        getPersonLedger,
        dues,
        addDue,
        updateDue,
        recordDuePayment,
        deleteDue,
        budgets,
        updateBudgetLimit,
        expenseCategories,
        incomeCategories,
        addCategory,
        paymentModes,
        addPaymentMode,
        searchQuery,
        setSearchQuery,
        resetAllData,
        refreshData,
        metrics,
      }}
    >
      {children}
    </PersonalContext.Provider>
  );
}

export function usePersonalFinance() {
  const context = useContext(PersonalContext);
  if (!context) {
    throw new Error('usePersonalFinance must be used within a PersonalFinanceProvider');
  }
  return context;
}
