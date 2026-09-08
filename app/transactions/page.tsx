"use client";

import React, { useState, useMemo } from 'react';
import { usePersonalFinance } from '@/lib/personal-context';
import { formatCurrency } from '@/lib/finance-math';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/lib/storage';
import { PersonalTransaction } from '@/lib/types';
import {
  Search,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Trash2,
  Download,
  Edit2,
  Calendar,
  RotateCcw,
  Filter,
  X,
} from 'lucide-react';
import QuickAddModal from '@/components/modals/QuickAddModal';
import EditTransactionModal from '@/components/modals/EditTransactionModal';

export default function TransactionsPage() {
  const {
    profile,
    transactions,
    deleteTransaction,
    expenseCategories,
    incomeCategories,
    paymentModes,
  } = usePersonalFinance();

  const [activeTab, setActiveTab] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  
  // Date & Period Filter States
  const [dateFilterMode, setDateFilterMode] = useState<
    'ALL' | 'TODAY' | 'YESTERDAY' | 'THIS_MONTH' | 'LAST_MONTH' | 'MONTH' | 'DATE' | 'CUSTOM_RANGE'
  >('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [quickAddTab, setQuickAddTab] = useState<'EXPENSE' | 'INCOME' | 'DUE'>('EXPENSE');
  const [editingTransaction, setEditingTransaction] = useState<PersonalTransaction | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);
  const thisMonthStr = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const lastMonthStr = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  }, []);

  const allCategories = useMemo(() => {
    return Array.from(new Set([...incomeCategories, ...expenseCategories]));
  }, [incomeCategories, expenseCategories]);

  // Derive unique recorded months from user transactions
  const availableMonths = useMemo(() => {
    const monthsMap = new Map<string, string>();
    transactions.forEach((t: PersonalTransaction) => {
      if (t.date && t.date.length >= 7) {
        const monthKey = t.date.slice(0, 7); // YYYY-MM
        if (!monthsMap.has(monthKey)) {
          const [yearStr, monthStr] = monthKey.split('-');
          const dateObj = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
          const label = !isNaN(dateObj.getTime())
            ? dateObj.toLocaleString('default', { month: 'long', year: 'numeric' })
            : monthKey;
          monthsMap.set(monthKey, label);
        }
      }
    });

    const sortedKeys = Array.from(monthsMap.keys()).sort().reverse();
    return sortedKeys.map((key) => ({
      key,
      label: monthsMap.get(key)!,
    }));
  }, [transactions]);

  const hasActiveFilters = useMemo(() => {
    return (
      activeTab !== 'ALL' ||
      dateFilterMode !== 'ALL' ||
      selectedCategory !== 'ALL' ||
      selectedPaymentMode !== 'ALL' ||
      searchQuery.trim() !== ''
    );
  }, [activeTab, dateFilterMode, selectedCategory, selectedPaymentMode, searchQuery]);

  const handleResetFilters = () => {
    setActiveTab('ALL');
    setDateFilterMode('ALL');
    setSelectedMonth('ALL');
    setSelectedDate('');
    setCustomStartDate('');
    setCustomEndDate('');
    setSelectedCategory('ALL');
    setSelectedPaymentMode('ALL');
    setSearchQuery('');
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t: PersonalTransaction) => {
      if (activeTab !== 'ALL' && t.type !== activeTab) return false;
      if (selectedCategory !== 'ALL' && t.category !== selectedCategory) return false;
      if (selectedPaymentMode !== 'ALL' && (t.paymentMode || 'Online / UPI') !== selectedPaymentMode) return false;

      // Date / Period filters
      if (t.date) {
        if (dateFilterMode === 'TODAY' && t.date !== todayStr) return false;
        if (dateFilterMode === 'YESTERDAY' && t.date !== yesterdayStr) return false;
        if (dateFilterMode === 'THIS_MONTH' && !t.date.startsWith(thisMonthStr)) return false;
        if (dateFilterMode === 'LAST_MONTH' && !t.date.startsWith(lastMonthStr)) return false;
        if (dateFilterMode === 'MONTH' && selectedMonth !== 'ALL' && !t.date.startsWith(selectedMonth)) return false;
        if (dateFilterMode === 'DATE' && selectedDate && t.date !== selectedDate) return false;
        if (dateFilterMode === 'CUSTOM_RANGE') {
          if (customStartDate && t.date < customStartDate) return false;
          if (customEndDate && t.date > customEndDate) return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.category.toLowerCase().includes(q) ||
          (t.paymentMode && t.paymentMode.toLowerCase().includes(q)) ||
          (t.notes && t.notes.toLowerCase().includes(q)) ||
          (t.personName && t.personName.toLowerCase().includes(q)) ||
          (t.date && t.date.includes(q))
        );
      }
      return true;
    });
  }, [
    transactions,
    activeTab,
    selectedCategory,
    selectedPaymentMode,
    dateFilterMode,
    selectedMonth,
    selectedDate,
    customStartDate,
    customEndDate,
    searchQuery,
    todayStr,
    yesterdayStr,
    thisMonthStr,
    lastMonthStr,
  ]);

  const filteredIncome = useMemo(() => {
    return filteredTransactions
      .filter((t: PersonalTransaction) => t.type === 'INCOME')
      .reduce((sum: number, t: PersonalTransaction) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const filteredExpense = useMemo(() => {
    return filteredTransactions
      .filter((t: PersonalTransaction) => t.type === 'EXPENSE')
      .reduce((sum: number, t: PersonalTransaction) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const totalFilteredAmount = useMemo(() => {
    return filteredIncome - filteredExpense;
  }, [filteredIncome, filteredExpense]);

  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Payment Mode', 'Amount', 'Notes'];
    const rows = filteredTransactions.map((t: PersonalTransaction) => [
      t.date,
      t.type,
      t.category,
      t.paymentMode || 'Online / UPI',
      t.amount,
      t.notes || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((r: any[]) => r.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    let suffix = 'All';
    if (dateFilterMode === 'TODAY') suffix = `Today_${todayStr}`;
    else if (dateFilterMode === 'MONTH') suffix = `Month_${selectedMonth}`;
    else if (dateFilterMode === 'DATE') suffix = `Date_${selectedDate}`;
    else if (dateFilterMode === 'CUSTOM_RANGE') suffix = `Range_${customStartDate || 'start'}_to_${customEndDate || 'end'}`;
    else if (dateFilterMode === 'THIS_MONTH') suffix = `Month_${thisMonthStr}`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Personal_Transactions_${suffix}.csv`;
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Personal Transactions</h1>
          <p className="text-xs text-slate-500">Record, edit, and filter your entries by date, month, and categories</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={() => {
              setQuickAddTab('INCOME');
              setIsAddOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 sm:py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition active:scale-95"
            title="Add Cash In (Income)"
          >
            <ArrowDownLeft size={14} className="stroke-[2.5]" />
            <span>Cash In</span>
          </button>

          <button
            onClick={() => {
              setQuickAddTab('EXPENSE');
              setIsAddOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 sm:py-2 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-50 transition active:scale-95"
            title="Add Cash Out (Expense)"
          >
            <ArrowUpRight size={14} className="stroke-[2.5] text-slate-700" />
            <span>Cash Out</span>
          </button>

          <button
            onClick={() => {
              setQuickAddTab('DUE');
              setIsAddOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 sm:py-2 text-xs font-bold text-blue-900 hover:bg-blue-100 transition active:scale-95"
            title="Record Loan / Due"
          >
            <CreditCard size={14} className="text-blue-700" />
            <span>Loan</span>
          </button>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3.5">
        {/* Type Tabs & Metrics Summary */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                activeTab === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Types ({transactions.length})
            </button>
            <button
              onClick={() => setActiveTab('EXPENSE')}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                activeTab === 'EXPENSE' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => setActiveTab('INCOME')}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                activeTab === 'INCOME' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Income
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <div className="text-blue-700 font-bold">
              +{formatCurrency(filteredIncome, profile.currencySymbol)}
            </div>
            <div className="text-slate-800 font-bold">
              -{formatCurrency(filteredExpense, profile.currencySymbol)}
            </div>
            <div className="border-l border-slate-200 pl-3 font-bold text-slate-700">
              Net: <span className={totalFilteredAmount >= 0 ? 'text-blue-700' : 'text-slate-900'}>
                {formatCurrency(totalFilteredAmount, profile.currencySymbol)}
              </span>
            </div>
          </div>
        </div>

        {/* Date & Period Preset Selector */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Calendar size={13} className="text-blue-600" /> Period:
          </span>

          <button
            type="button"
            onClick={() => setDateFilterMode('ALL')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              dateFilterMode === 'ALL' ? 'bg-blue-100 text-blue-900 font-bold' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Dates
          </button>

          <button
            type="button"
            onClick={() => setDateFilterMode('TODAY')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              dateFilterMode === 'TODAY' ? 'bg-blue-100 text-blue-900 font-bold' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Today
          </button>

          <button
            type="button"
            onClick={() => setDateFilterMode('YESTERDAY')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              dateFilterMode === 'YESTERDAY' ? 'bg-blue-100 text-blue-900 font-bold' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Yesterday
          </button>

          <button
            type="button"
            onClick={() => setDateFilterMode('THIS_MONTH')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              dateFilterMode === 'THIS_MONTH' ? 'bg-blue-100 text-blue-900 font-bold' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            This Month
          </button>

          <button
            type="button"
            onClick={() => {
              setDateFilterMode('MONTH');
              if (selectedMonth === 'ALL' && availableMonths.length > 0) {
                setSelectedMonth(availableMonths[0].key);
              }
            }}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              dateFilterMode === 'MONTH' ? 'bg-blue-100 text-blue-900 font-bold' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Specific Month
          </button>

          <button
            type="button"
            onClick={() => {
              setDateFilterMode('DATE');
              if (!selectedDate) setSelectedDate(todayStr);
            }}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              dateFilterMode === 'DATE' ? 'bg-blue-100 text-blue-900 font-bold' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Specific Date
          </button>

          <button
            type="button"
            onClick={() => {
              setDateFilterMode('CUSTOM_RANGE');
              if (!customStartDate) setCustomStartDate(thisMonthStr + '-01');
              if (!customEndDate) setCustomEndDate(todayStr);
            }}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              dateFilterMode === 'CUSTOM_RANGE' ? 'bg-blue-100 text-blue-900 font-bold' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Date Range
          </button>
        </div>

        {/* Dynamic Secondary Date Inputs */}
        {dateFilterMode === 'MONTH' && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50/60 border border-blue-100">
            <span className="text-xs font-bold text-blue-900">Select Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs text-slate-800 font-semibold focus:border-blue-600 focus:outline-none"
            >
              <option value="ALL">All Recorded Months</option>
              {availableMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label} ({m.key})
                </option>
              ))}
            </select>
          </div>
        )}

        {dateFilterMode === 'DATE' && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50/60 border border-blue-100">
            <span className="text-xs font-bold text-blue-900">Select Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs text-slate-800 font-semibold focus:border-blue-600 focus:outline-none"
            />
          </div>
        )}

        {dateFilterMode === 'CUSTOM_RANGE' && (
          <div className="flex flex-wrap items-center gap-3 p-2.5 rounded-xl bg-blue-50/60 border border-blue-100">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-blue-900">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs text-slate-800 font-semibold focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-blue-900">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs text-slate-800 font-semibold focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Filter Dropdowns, Search & Reset */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100 items-center">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search category, notes, mode, person..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs focus:border-blue-600 focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-700 focus:border-blue-600 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {allCategories.map((c: string) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={selectedPaymentMode}
            onChange={(e) => setSelectedPaymentMode(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-700 focus:border-blue-600 focus:outline-none"
          >
            <option value="ALL">All Payment Modes</option>
            {paymentModes.map((m: string) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
            >
              <RotateCcw size={12} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Transactions Container */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Mobile View: Native Card List */}
        <div className="sm:hidden divide-y divide-slate-100">
          {filteredTransactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No transactions match the selected filters.
            </div>
          ) : (
            filteredTransactions.map((tx: PersonalTransaction) => (
              <div key={tx.id} className="p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${
                    tx.type === 'INCOME' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {tx.type === 'INCOME' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">{tx.category}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono">{tx.date}</span>
                      {tx.paymentMode && <span>• {tx.paymentMode}</span>}
                    </div>
                    {tx.notes && <div className="text-[11px] text-slate-500 truncate mt-0.5">{tx.notes}</div>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 text-right">
                  <div className={`text-xs font-bold font-mono ${
                    tx.type === 'INCOME' ? 'text-blue-700' : 'text-slate-900'
                  }`}>
                    {tx.type === 'INCOME' ? '+' : '-'} {formatCurrency(tx.amount, profile.currencySymbol)}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingTransaction(tx)}
                      className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                      title="Edit Transaction"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this transaction?')) deleteTransaction(tx.id);
                      }}
                      className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    No transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx: PersonalTransaction) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">{tx.date}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${
                        tx.type === 'INCOME'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {tx.type === 'INCOME' ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
                        <span>{tx.type}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{tx.category}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        {tx.paymentMode || 'Online / UPI'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{tx.notes || '-'}</td>
                    <td className={`py-3 px-4 text-right font-bold font-mono ${
                      tx.type === 'INCOME' ? 'text-blue-700' : 'text-slate-900'
                    }`}>
                      {tx.type === 'INCOME' ? '+' : '-'}
                      {formatCurrency(tx.amount, profile.currencySymbol)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingTransaction(tx)}
                          className="rounded p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                          title="Edit Transaction"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this transaction?')) deleteTransaction(tx.id);
                          }}
                          className="rounded p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                          title="Delete Transaction"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <QuickAddModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        defaultTab={quickAddTab}
      />

      <EditTransactionModal
        isOpen={!!editingTransaction}
        transaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
      />
    </div>
  );
}
