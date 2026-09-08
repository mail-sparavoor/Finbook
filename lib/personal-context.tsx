"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  PersonalTransaction,
  PersonalDue,
  PersonalBudget,
  PersonalProfile,
  PersonContact,
  PersonalBook,
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
  updateProfile: (data: Partial<PersonalProfile>) => Promise<{ success: boolean; error?: string }>;

  // Multi-Book Management
  books: PersonalBook[];
  currentBook: PersonalBook | null;
  activeBookId: string;
  switchBook: (bookId: string) => void;
  createBook: (data: {
    name: string;
    description?: string;
    currency?: string;
    currencySymbol?: string;
    color?: string;
    icon?: string;
    isDefault?: boolean;
  }) => Promise<PersonalBook | null>;
  updateBook: (id: string, data: Partial<PersonalBook>) => Promise<boolean>;
  deleteBook: (id: string) => Promise<{ success: boolean; error?: string }>;

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
    bookId?: string;
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
    bookId?: string;
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
    totalIncome: number;
    totalExpenses: number;
    coreIncome: number;
    coreExpenses: number;
    netBalanceExcludingLoans: number;
    netBalanceAfterDues: number;
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
  const { currentUser, updateUserAccount } = useAuth();
  const userId = currentUser ? currentUser.id : '';

  const [books, setBooks] = useState<PersonalBook[]>([]);
  const [activeBookId, setActiveBookId] = useState<string>('');
  const [rawTransactions, setRawTransactions] = useState<PersonalTransaction[]>([]);
  const [rawDues, setRawDues] = useState<PersonalDue[]>([]);
  const [rawContacts, setRawContacts] = useState<PersonContact[]>([]);
  const [rawBudgets, setRawBudgets] = useState<PersonalBudget[]>([]);

  const [expenseCategories, setExpenseCategories] = useState<string[]>(EXPENSE_CATEGORIES);
  const [incomeCategories, setIncomeCategories] = useState<string[]>(INCOME_CATEGORIES);
  const [paymentModes, setPaymentModes] = useState<string[]>(DEFAULT_PAYMENT_MODES);
  const [searchQuery, setSearchQuery] = useState('');

  // Active Book Object
  const currentBook = useMemo(() => {
    if (!books || books.length === 0) return null;
    if (activeBookId) {
      const found = books.find((b) => b.id === activeBookId);
      if (found) return found;
    }
    const def = books.find((b) => b.isDefault);
    return def || books[0] || null;
  }, [books, activeBookId]);

  // Profile combined with active book currency
  const profile: PersonalProfile = useMemo(() => {
    const baseName = currentUser?.name || SEED_PROFILE.name;
    const baseEmail = currentUser?.email || SEED_PROFILE.email;
    const basePhone = currentUser?.phone || SEED_PROFILE.phone;

    return {
      name: baseName,
      email: baseEmail,
      phone: basePhone,
      currency: currentBook?.currency || currentUser?.currency || 'INR',
      currencySymbol: currentBook?.currencySymbol || currentUser?.currencySymbol || '₹',
    };
  }, [currentUser, currentBook]);

  // Filter scoped data by active book
  const transactions = useMemo(() => {
    if (!currentBook) return rawTransactions;
    return rawTransactions.filter((t) => !t.bookId || t.bookId === currentBook.id);
  }, [rawTransactions, currentBook]);

  const dues = useMemo(() => {
    if (!currentBook) return rawDues;
    return rawDues.filter((d) => !d.bookId || d.bookId === currentBook.id);
  }, [rawDues, currentBook]);

  const contacts = useMemo(() => {
    if (!currentBook) return rawContacts;
    return rawContacts.filter((c) => !c.bookId || c.bookId === currentBook.id);
  }, [rawContacts, currentBook]);

  const budgets = useMemo(() => {
    if (!currentBook) return rawBudgets;
    return rawBudgets.filter((b) => !b.bookId || b.bookId === currentBook.id);
  }, [rawBudgets, currentBook]);

  // Switch Active Book
  const switchBook = useCallback((bookId: string) => {
    setActiveBookId(bookId);
    if (typeof window !== 'undefined' && userId) {
      try {
        localStorage.setItem(`finbook_active_book_${userId}`, bookId);
      } catch {}
    }
  }, [userId]);

  // Fetch all user data from MySQL API endpoints
  const refreshData = useCallback(async () => {
    if (!currentUser || !userId) return;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      // 1. Fetch Books
      try {
        const bookRes = await fetch(`/api/books?userId=${encodeURIComponent(userId)}`, { signal: controller.signal });
        const bookJson = await bookRes.json();
        if (bookJson.success && Array.isArray(bookJson.data) && bookJson.data.length > 0) {
          setBooks(bookJson.data);

          // Restore saved active book
          const savedBookId = typeof window !== 'undefined' ? localStorage.getItem(`finbook_active_book_${userId}`) : null;
          if (savedBookId && bookJson.data.some((b: PersonalBook) => b.id === savedBookId)) {
            setActiveBookId(savedBookId);
          } else {
            const defBook = bookJson.data.find((b: PersonalBook) => b.isDefault) || bookJson.data[0];
            setActiveBookId(defBook.id);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch books', err);
      }

      // 2. Fetch transactions
      fetch(`/api/transactions?userId=${encodeURIComponent(userId)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data)) {
            const sanitized = json.data.map((t: any) => ({
              ...t,
              amount: Number(t.amount) || 0,
            }));
            setRawTransactions(sanitized);
          }
        })
        .catch(() => {});

      // 3. Fetch dues
      fetch(`/api/dues?userId=${encodeURIComponent(userId)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data)) {
            const sanitized = json.data.map((d: any) => {
              const orig = Number(d.originalAmount) || 0;
              const paid = Number(d.paidAmount) || 0;
              const remaining =
                d.remainingAmount !== undefined && d.remainingAmount !== null && !isNaN(Number(d.remainingAmount))
                  ? Number(d.remainingAmount)
                  : Math.max(0, orig - paid);
              return {
                ...d,
                originalAmount: orig,
                paidAmount: paid,
                remainingAmount: remaining,
              };
            });
            setRawDues(sanitized);
          }
        })
        .catch(() => {});

      // 4. Fetch budgets
      fetch(`/api/budgets?userId=${encodeURIComponent(userId)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data) && json.data.length > 0) setRawBudgets(json.data);
        })
        .catch(() => {});

      // 5. Fetch contacts
      fetch(`/api/contacts?userId=${encodeURIComponent(userId)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data)) setRawContacts(json.data);
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
      refreshData();
    }
  }, [currentUser, userId, refreshData]);

  // Create Book
  const createBook = async (data: {
    name: string;
    description?: string;
    currency?: string;
    currencySymbol?: string;
    color?: string;
    icon?: string;
    isDefault?: boolean;
  }): Promise<PersonalBook | null> => {
    if (!userId) return null;
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: data.name,
          description: data.description,
          currency: data.currency || profile.currency || 'INR',
          currencySymbol: data.currencySymbol || profile.currencySymbol || '₹',
          color: data.color || '#2563eb',
          icon: data.icon || 'BookOpen',
          isDefault: data.isDefault || false,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const newB: PersonalBook = json.data;
        setBooks((prev) => [newB, ...prev]);
        switchBook(newB.id);
        return newB;
      }
      return null;
    } catch (err) {
      console.error('Error creating book:', err);
      return null;
    }
  };

  // Update Book
  const updateBook = async (id: string, data: Partial<PersonalBook>): Promise<boolean> => {
    if (!userId) return false;
    try {
      setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, ...data } : b)));
      const res = await fetch('/api/books', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, userId, ...data }),
      });
      const json = await res.json();
      return Boolean(json.success);
    } catch (err) {
      console.error('Error updating book:', err);
      return false;
    }
  };

  // Delete Book
  const deleteBook = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!userId) return { success: false, error: 'User not authenticated' };
    if (books.length <= 1) {
      return { success: false, error: 'Cannot delete your only remaining book.' };
    }
    try {
      const res = await fetch(`/api/books?id=${encodeURIComponent(id)}&userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setBooks((prev) => prev.filter((b) => b.id !== id));
        setRawTransactions((prev) => prev.filter((t) => t.bookId !== id));
        setRawDues((prev) => prev.filter((d) => d.bookId !== id));
        setRawBudgets((prev) => prev.filter((b) => b.bookId !== id));
        setRawContacts((prev) => prev.filter((c) => c.bookId !== id));

        const remaining = books.filter((b) => b.id !== id);
        if (remaining.length > 0) {
          switchBook(remaining[0].id);
        }
        return { success: true };
      }
      return { success: false, error: json.error || 'Failed to delete book' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete book' };
    }
  };

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

  const updateProfile = async (data: Partial<PersonalProfile>): Promise<{ success: boolean; error?: string }> => {
    if (currentUser && currentUser.id) {
      const res = await updateUserAccount(currentUser.id, {
        name: data.name,
        email: data.email,
        phone: data.phone,
        currency: data.currency,
        currencySymbol: data.currencySymbol,
      });
      return res;
    }
    return { success: true };
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
      userId,
      bookId: currentBook?.id,
      name: trimmedName,
      phone: phone?.trim(),
      notes: notes?.trim(),
      createdAt: new Date().toISOString(),
    };

    // Optimistic UI update
    setRawContacts((prev) => [newContact, ...prev]);

    // Async MySQL insert
    fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: newContact.id,
        userId,
        bookId: currentBook?.id,
        name: newContact.name,
        phone: newContact.phone,
        notes: newContact.notes,
      }),
    }).catch((err) => console.error('Failed to sync contact to MySQL', err));

    return newContact;
  };

  const updateContact = (id: string, data: Partial<PersonContact>) => {
    setRawContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));

    fetch('/api/contacts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    }).catch((err) => console.error('Failed to update contact in MySQL', err));
  };

  const deleteContact = (id: string, deleteAssociatedDues: boolean = true) => {
    const contact = contacts.find((c: PersonContact) => c.id === id);
    setRawContacts((prev: PersonContact[]) => prev.filter((c: PersonContact) => c.id !== id));
    if (deleteAssociatedDues && contact) {
      setRawDues((prev: PersonalDue[]) =>
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

    const totalLent = lentDues.reduce((s, d) => s + (Number(d.originalAmount) || 0), 0);
    const totalSettledLent = lentDues.reduce((s, d) => s + (Number(d.paidAmount) || 0), 0);
    const remainingLent = lentDues
      .filter((d) => d.status === 'ACTIVE')
      .reduce((s, d) => {
        const orig = Number(d.originalAmount) || 0;
        const paid = Number(d.paidAmount) || 0;
        const rem = d.remainingAmount !== undefined && d.remainingAmount !== null && !isNaN(Number(d.remainingAmount))
          ? Number(d.remainingAmount)
          : Math.max(0, orig - paid);
        return s + rem;
      }, 0);

    const totalBorrowed = borrowedDues.reduce((s, d) => s + (Number(d.originalAmount) || 0), 0);
    const totalSettledBorrowed = borrowedDues.reduce((s, d) => s + (Number(d.paidAmount) || 0), 0);
    const remainingBorrowed = borrowedDues
      .filter((d) => d.status === 'ACTIVE')
      .reduce((s, d) => {
        const orig = Number(d.originalAmount) || 0;
        const paid = Number(d.paidAmount) || 0;
        const rem = d.remainingAmount !== undefined && d.remainingAmount !== null && !isNaN(Number(d.remainingAmount))
          ? Number(d.remainingAmount)
          : Math.max(0, orig - paid);
        return s + rem;
      }, 0);

    const netBalance = round2(remainingLent - remainingBorrowed);
    const status = netBalance > 0 ? 'RECEIVABLE' : netBalance < 0 ? 'PAYABLE' : 'SETTLED';

    return {
      contact,
      personName,
      phone,
      dues: personDues,
      transactions: personTransactions,
      totalLent: round2(totalLent),
      totalBorrowed: round2(totalBorrowed),
      totalSettledLent: round2(totalSettledLent),
      totalSettledBorrowed: round2(totalSettledBorrowed),
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
    bookId?: string;
  }) => {
    const rounded = round2(tx.amount);
    const targetBookId = tx.bookId || currentBook?.id;
    const newTx: PersonalTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      bookId: targetBookId,
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
    setRawTransactions((prev) => [newTx, ...prev]);

    // Async MySQL insert
    fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newTx,
        userId,
        bookId: targetBookId,
      }),
    }).catch((err) => console.error('Failed to sync transaction to MySQL', err));
  };

  const updateTransaction = (id: string, data: Partial<PersonalTransaction>) => {
    setRawTransactions((prev) =>
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
    setRawTransactions((prev) => prev.filter((t) => t.id !== id));

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
    bookId?: string;
  }) => {
    const rounded = round2(due.amount);
    const currentDate = new Date().toISOString().split('T')[0];
    const targetBookId = due.bookId || currentBook?.id;
    const contact = due.personId
      ? contacts.find((c) => c.id === due.personId) || getOrCreateContact(due.personName, due.phone)
      : getOrCreateContact(due.personName, due.phone);

    const newDue: PersonalDue = {
      id: `due-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      bookId: targetBookId,
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
    setRawDues((prev) => [newDue, ...prev]);

    // Async MySQL insert
    fetch('/api/dues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newDue,
        userId,
        bookId: targetBookId,
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
      bookId: targetBookId,
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
    setRawDues((prev) =>
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
      bookId: targetDue.bookId || currentBook?.id,
      notes: isLent
        ? `Repayment received from ${targetDue.personName}${notes ? ` (${notes})` : ''}`
        : `Repayment paid to ${targetDue.personName}${notes ? ` (${notes})` : ''}`,
    });
  };

  const updateDue = (id: string, data: Partial<PersonalDue>) => {
    setRawDues((prev) =>
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
    setRawDues((prev) => prev.filter((d) => d.id !== id));

    fetch(`/api/dues?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch((err) =>
      console.error('Failed to delete due in MySQL', err)
    );
  };

  // Budgets
  const updateBudgetLimit = (category: string, monthlyLimit: number) => {
    const limit = round2(monthlyLimit);
    const targetBookId = currentBook?.id;
    setRawBudgets((prev) => {
      const existing = prev.find((b) => b.category === category && (!b.bookId || b.bookId === targetBookId));
      if (existing) {
        return prev.map((b) => (b.id === existing.id ? { ...b, monthlyLimit: limit } : b));
      }
      return [...prev, { id: `bg-${Date.now()}`, userId, bookId: targetBookId, category, monthlyLimit: limit }];
    });

    fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        bookId: targetBookId,
        category,
        monthlyLimit: limit,
      }),
    }).catch((err) => console.error('Failed to sync budget to MySQL', err));
  };

  const resetAllData = () => {
    const freshTx = generateSeedTransactions();
    setRawTransactions(freshTx);
    setRawDues(SEED_DUES);
    setRawContacts(SEED_CONTACTS);
    setRawBudgets(SEED_BUDGETS);
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

    const isLoanTx = (t: PersonalTransaction) => {
      const cat = (t.category || '').toLowerCase();
      return (
        cat.includes('loan') ||
        cat.includes('borrow') ||
        cat.includes('lent') ||
        cat.includes('repay') ||
        Boolean(t.personId)
      );
    };

    const allIncome = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const allExpenses = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const coreIncome = transactions
      .filter((t) => t.type === 'INCOME' && !isLoanTx(t))
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const coreExpenses = transactions
      .filter((t) => t.type === 'EXPENSE' && !isLoanTx(t))
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const netBalanceExcludingLoans = round2(coreIncome - coreExpenses);

    const totalNetWorth = round2(allIncome - allExpenses);
    const totalSavings = totalNetWorth;
    const totalSavingsRate = allIncome > 0 ? Math.round(((allIncome - allExpenses) / allIncome) * 100) : 0;

    const totalLent = dues
      .filter((d) => d.type === 'I_LENT' && d.status === 'ACTIVE')
      .reduce((sum, d) => {
        const orig = Number(d.originalAmount) || 0;
        const paid = Number(d.paidAmount) || 0;
        const rem = d.remainingAmount !== undefined && d.remainingAmount !== null && !isNaN(Number(d.remainingAmount))
          ? Number(d.remainingAmount)
          : Math.max(0, orig - paid);
        return sum + rem;
      }, 0);

    const totalBorrowed = dues
      .filter((d) => d.type === 'I_BORROWED' && d.status === 'ACTIVE')
      .reduce((sum, d) => {
        const orig = Number(d.originalAmount) || 0;
        const paid = Number(d.paidAmount) || 0;
        const rem = d.remainingAmount !== undefined && d.remainingAmount !== null && !isNaN(Number(d.remainingAmount))
          ? Number(d.remainingAmount)
          : Math.max(0, orig - paid);
        return sum + rem;
      }, 0);

    const netBalanceAfterDues = round2(totalNetWorth + totalLent - totalBorrowed);

    return {
      totalNetWorth,
      totalIncome: round2(allIncome),
      totalExpenses: round2(allExpenses),
      coreIncome: round2(coreIncome),
      coreExpenses: round2(coreExpenses),
      netBalanceExcludingLoans,
      netBalanceAfterDues,
      monthlyIncome: round2(monthlyIncome),
      monthlyExpenses: round2(monthlyExpenses),
      netSavings: totalSavings,
      savingsRate: totalSavingsRate,
      totalLent: round2(totalLent),
      totalBorrowed: round2(totalBorrowed),
    };
  }, [transactions, dues]);

  return (
    <PersonalContext.Provider
      value={{
        profile,
        updateProfile,
        books,
        currentBook,
        activeBookId,
        switchBook,
        createBook,
        updateBook,
        deleteBook,
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
