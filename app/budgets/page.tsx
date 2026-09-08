"use client";

import React, { useState, useEffect } from 'react';
import { usePersonalFinance } from '@/lib/personal-context';
import { formatCurrency } from '@/lib/finance-math';
import { PersonalTransaction, PersonalBudget } from '@/lib/types';
import Link from 'next/link';
import {
  PieChart,
  Plus,
  Sliders,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Settings,
} from 'lucide-react';

export default function BudgetsPage() {
  const { profile, budgets, transactions, updateBudgetLimit, expenseCategories } = usePersonalFinance();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(expenseCategories[0] || '');
  const [limitAmount, setLimitAmount] = useState('5000');

  useEffect(() => {
    if (expenseCategories.length > 0 && (!selectedCategory || !expenseCategories.includes(selectedCategory))) {
      setSelectedCategory(expenseCategories[0]);
    }
  }, [expenseCategories, selectedCategory]);

  // Calculate monthly spent for each budget category
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const monthExpenses = transactions.filter((t: PersonalTransaction) => t.type === 'EXPENSE' && t.date.startsWith(currentMonth));

  const totalBudgeted = budgets.reduce((s: number, b: PersonalBudget) => s + b.monthlyLimit, 0);
  const totalSpentInBudgeted = budgets.reduce((sum: number, b: PersonalBudget) => {
    const spent = monthExpenses.filter((t: PersonalTransaction) => t.category === b.category).reduce((s: number, t: PersonalTransaction) => s + t.amount, 0);
    return sum + spent;
  }, 0);

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(limitAmount) || 0;
    if (amt <= 0 || !selectedCategory) return;

    updateBudgetLimit(selectedCategory, amt);
    setIsEditOpen(false);
  };

  const handleOpenEdit = (category: string, currentLimit: number) => {
    setSelectedCategory(category);
    setLimitAmount(currentLimit.toString());
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Monthly Spending Budgets</h1>
          <p className="text-xs text-slate-500">Set monthly targets to prevent overspending in specific categories</p>
        </div>

        <button
          onClick={() => {
            setSelectedCategory(expenseCategories[0] || '');
            setLimitAmount('5000');
            setIsEditOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition active:scale-95"
        >
          <Plus size={14} />
          <span>Set Category Budget</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Monthly Budget</div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 font-mono">
            {formatCurrency(totalBudgeted, profile.currencySymbol)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            Target allocated across {budgets.length} categories
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Spent This Month</div>
          <div className="mt-2 text-2xl font-extrabold text-blue-900 font-mono">
            {formatCurrency(totalSpentInBudgeted, profile.currencySymbol)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            {totalBudgeted > 0 ? `${Math.round((totalSpentInBudgeted / totalBudgeted) * 100)}% of total budget used` : 'No budget set'}
          </div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-blue-900">Remaining Budget</div>
          <div className="mt-2 text-2xl font-extrabold text-blue-950 font-mono">
            {formatCurrency(Math.max(0, totalBudgeted - totalSpentInBudgeted), profile.currencySymbol)}
          </div>
          <div className="mt-2 text-[11px] text-blue-800 border-t border-blue-100 pt-2">
            Safe to spend this month
          </div>
        </div>
      </div>

      {/* Category Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgets.map((b: PersonalBudget) => {
          const spent = monthExpenses.filter((t: PersonalTransaction) => t.category === b.category).reduce((s: number, t: PersonalTransaction) => s + t.amount, 0);
          const percent = Math.min(100, Math.round((spent / b.monthlyLimit) * 100));
          const remaining = Math.max(0, b.monthlyLimit - spent);
          const isOver = spent > b.monthlyLimit;
          const isWarning = percent >= 80 && !isOver;

          return (
            <div key={b.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{b.category}</h3>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    Limit: {formatCurrency(b.monthlyLimit, profile.currencySymbol)} / month
                  </div>
                </div>

                <button
                  onClick={() => handleOpenEdit(b.category, b.monthlyLimit)}
                  className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition"
                  title="Adjust Budget"
                >
                  <Sliders size={14} />
                </button>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className={isOver ? 'text-blue-900 font-bold' : 'text-slate-700 font-mono'}>
                    Spent: ₹{spent}
                  </span>
                  <span className="text-slate-500 font-mono">
                    {isOver ? 'Over budget!' : `Left: ₹${remaining}`} ({percent}%)
                  </span>
                </div>

                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isOver ? 'bg-blue-950' : isWarning ? 'bg-blue-800' : 'bg-blue-600'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* Alert note */}
              {isOver && (
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-950 bg-blue-50/80 p-2 rounded-lg">
                  <AlertTriangle size={13} className="shrink-0" />
                  <span>Exceeded target budget by ₹{spent - b.monthlyLimit}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: Set Budget */}
      {isEditOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in select-none">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl select-text">
            <h3 className="text-base font-bold text-slate-900">Set Category Budget Limit</h3>
            
            {expenseCategories.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center space-y-3 text-xs">
                <p className="text-slate-600">
                  You haven't created any <strong>Categories</strong> yet. Please add custom categories in Settings first.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white"
                  >
                    Close
                  </button>
                  <Link
                    href="/settings"
                    onClick={() => setIsEditOpen(false)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 shadow-sm"
                  >
                    <Settings size={13} />
                    <span>Go to Category Settings</span>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveBudget} className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700">Category</label>
                  <select
                    value={selectedCategory}
                    required
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs focus:border-blue-600 focus:outline-none"
                  >
                    <option value="" disabled>Select Category</option>
                    {expenseCategories.map((c: string) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700">Monthly Spending Limit ({profile.currencySymbol}) *</label>
                  <input
                    type="number"
                    step="100"
                    required
                    placeholder="5000"
                    value={limitAmount}
                    onChange={(e) => setLimitAmount(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-base font-bold focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
                  >
                    Save Budget
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
