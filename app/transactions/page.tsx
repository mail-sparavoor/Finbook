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
  Trash2,
  Download,
} from 'lucide-react';
import QuickAddModal from '@/components/modals/QuickAddModal';

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
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const allCategories = useMemo(() => {
    return Array.from(new Set([...incomeCategories, ...expenseCategories]));
  }, [incomeCategories, expenseCategories]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t: PersonalTransaction) => {
      if (activeTab !== 'ALL' && t.type !== activeTab) return false;
      if (selectedCategory !== 'ALL' && t.category !== selectedCategory) return false;
      if (selectedPaymentMode !== 'ALL' && (t.paymentMode || 'Online / UPI') !== selectedPaymentMode) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.category.toLowerCase().includes(q) ||
          (t.paymentMode && t.paymentMode.toLowerCase().includes(q)) ||
          (t.notes && t.notes.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [transactions, activeTab, selectedCategory, selectedPaymentMode, searchQuery]);

  const totalFilteredAmount = useMemo(() => {
    return filteredTransactions.reduce((sum: number, t: PersonalTransaction) => {
      if (t.type === 'INCOME') return sum + t.amount;
      if (t.type === 'EXPENSE') return sum - t.amount;
      return sum;
    }, 0);
  }, [filteredTransactions]);

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

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Personal_Transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Personal Transactions</h1>
          <p className="text-xs text-slate-500">Record and review your daily income and expense entries</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition active:scale-95"
          >
            <Plus size={14} />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        {/* Type Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                activeTab === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'
              }`}
            >
              All Transactions ({transactions.length})
            </button>
            <button
              onClick={() => setActiveTab('EXPENSE')}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                activeTab === 'EXPENSE' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'
              }`}
            >
              Expenses (Money Out)
            </button>
            <button
              onClick={() => setActiveTab('INCOME')}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                activeTab === 'INCOME' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'
              }`}
            >
              Income (Money In)
            </button>
          </div>

          <div className="text-xs font-bold text-slate-700 font-mono">
            Net Total: <span className={totalFilteredAmount >= 0 ? 'text-blue-700' : 'text-slate-900'}>
              {formatCurrency(totalFilteredAmount, profile.currencySymbol)}
            </span>
          </div>
        </div>

        {/* Filter Dropdowns & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search category, notes, mode..."
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
                      <button
                        onClick={() => {
                          if (confirm('Delete this transaction?')) deleteTransaction(tx.id);
                        }}
                        className="rounded p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                        title="Delete Transaction"
                      >
                        <Trash2 size={13} />
                      </button>
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
      />
    </div>
  );
}
