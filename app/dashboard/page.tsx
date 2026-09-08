"use client";

import React, { useState, useMemo } from 'react';
import { usePersonalFinance } from '@/lib/personal-context';
import { formatCurrency } from '@/lib/finance-math';
import {
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  ArrowRight,
  CheckCircle,
  Receipt,
  Wallet,
  Plus,
} from 'lucide-react';
import { PersonalTransaction, PersonalDue, PersonalBudget } from '@/lib/types';
import Link from 'next/link';
import QuickAddModal from '@/components/modals/QuickAddModal';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function PersonalDashboardPage() {
  const { profile, metrics, transactions, dues, budgets } = usePersonalFinance();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddTab, setQuickAddTab] = useState<'EXPENSE' | 'INCOME' | 'DUE'>('EXPENSE');

  const handleOpenAction = (tab: 'EXPENSE' | 'INCOME' | 'DUE') => {
    setQuickAddTab(tab);
    setIsQuickAddOpen(true);
  };

  // Monthly cash flow trend - calculated dynamically from user's recorded transactions
  const monthlyData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      const currentMonth = new Date().toLocaleString('default', { month: 'short' });
      return [{ name: currentMonth, income: 0, expense: 0 }];
    }

    const monthMap: Record<string, { name: string; income: number; expense: number }> = {};

    transactions.forEach((t: PersonalTransaction) => {
      if (!t.date) return;
      const monthKey = t.date.slice(0, 7); // "YYYY-MM"
      if (!monthKey || monthKey.length < 7) return;

      if (!monthMap[monthKey]) {
        const [yearStr, monthStr] = monthKey.split('-');
        const dateObj = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
        const name = isNaN(dateObj.getTime())
          ? monthKey
          : dateObj.toLocaleString('default', { month: 'short' });
        monthMap[monthKey] = { name, income: 0, expense: 0 };
      }

      if (t.type === 'INCOME') {
        monthMap[monthKey].income += t.amount;
      } else if (t.type === 'EXPENSE') {
        monthMap[monthKey].expense += t.amount;
      }
    });

    const sortedKeys = Object.keys(monthMap).sort();
    if (sortedKeys.length === 0) {
      const currentMonth = new Date().toLocaleString('default', { month: 'short' });
      return [{ name: currentMonth, income: 0, expense: 0 }];
    }

    return sortedKeys.map((key) => monthMap[key]);
  }, [transactions]);

  // Category expense breakdown
  const categoryData = useMemo(() => {
    const map: { [key: string]: number } = {};
    transactions
      .filter((t: PersonalTransaction) => t.type === 'EXPENSE')
      .forEach((t: PersonalTransaction) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });

    const colors = ['#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];
    const entries = Object.entries(map).slice(0, 5);

    if (entries.length === 0) {
      return [{ name: 'No Expenses', value: 1, color: '#e2e8f0' }];
    }

    return entries.map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length],
    }));
  }, [transactions]);

  const recentTransactions = transactions.slice(0, 5);
  const activeDues = dues.filter((d: PersonalDue) => d.status === 'ACTIVE');

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl sm:rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-900 to-blue-800 p-4 sm:p-6 text-white shadow-sm">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
            Personal CashBook & Ledger
          </span>
          <h1 className="mt-0.5 sm:mt-1 text-xl sm:text-2xl font-bold tracking-tight">
            Welcome, {profile.name}
          </h1>
          <p className="mt-0.5 text-xs text-blue-100">
            Track your income, expenses, savings, and personal dues.
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 w-full sm:w-auto">
            {/* Total Net Balance */}
            <div className="rounded-xl bg-white/10 px-3.5 sm:px-4 py-2 backdrop-blur text-left sm:text-right border border-white/10">
              <div className="text-[10px] uppercase font-bold text-blue-200">Total Net Balance</div>
              <div className="text-lg sm:text-2xl font-extrabold text-white font-mono mt-0.5">
                {formatCurrency(metrics.totalNetWorth, profile.currencySymbol)}
              </div>
            </div>

            {/* Net Balance Excluding Dues & Loans */}
            <div className="rounded-xl bg-white/15 px-3.5 sm:px-4 py-2 backdrop-blur text-left sm:text-right border border-white/20 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-blue-200 flex items-center gap-1">
                <span>Net (Excl. Loans)</span>
              </div>
              <div className="text-lg sm:text-2xl font-extrabold text-white font-mono mt-0.5">
                {formatCurrency(metrics.netBalanceExcludingLoans, profile.currencySymbol)}
              </div>
            </div>
          </div>

          {/* 3 Direct Action Buttons on Dashboard */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => handleOpenAction('INCOME')}
              className="flex items-center gap-1 sm:gap-1.5 rounded-xl bg-white text-blue-900 px-3 py-1.5 text-xs font-bold shadow-sm hover:bg-blue-50 active:scale-95 transition"
            >
              <ArrowDownLeft size={14} className="text-blue-700 stroke-[2.5]" />
              <span>Cash In</span>
            </button>
            <button
              onClick={() => handleOpenAction('EXPENSE')}
              className="flex items-center gap-1 sm:gap-1.5 rounded-xl bg-white/15 text-white border border-white/20 px-3 py-1.5 text-xs font-bold hover:bg-white/25 active:scale-95 transition"
            >
              <ArrowUpRight size={14} className="stroke-[2.5]" />
              <span>Cash Out</span>
            </button>
            <button
              onClick={() => handleOpenAction('DUE')}
              className="flex items-center gap-1 sm:gap-1.5 rounded-xl bg-white/15 text-white border border-white/20 px-3 py-1.5 text-xs font-bold hover:bg-white/25 active:scale-95 transition"
            >
              <CreditCard size={14} />
              <span>Loan</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards - 2 Columns on Mobile, 4 on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Total Income */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-sm transition hover:border-blue-300">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">Total Income</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <ArrowDownLeft size={15} />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 text-base sm:text-2xl font-extrabold text-blue-900 font-mono truncate">
            +{formatCurrency(metrics.totalIncome, profile.currencySymbol)}
          </div>
          <div className="mt-1.5 text-[10px] sm:text-[11px] text-slate-500 border-t border-slate-100 pt-1.5 hidden sm:block truncate">
            Core: +{formatCurrency(metrics.coreIncome, profile.currencySymbol)}
          </div>
        </div>

        {/* Card 2: Total Expenses */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-sm transition hover:border-blue-300">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">Total Expenses</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-900">
              <ArrowUpRight size={15} />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 text-base sm:text-2xl font-extrabold text-slate-900 font-mono truncate">
            -{formatCurrency(metrics.totalExpenses, profile.currencySymbol)}
          </div>
          <div className="mt-1.5 text-[10px] sm:text-[11px] text-slate-500 border-t border-slate-100 pt-1.5 hidden sm:block truncate">
            Core: -{formatCurrency(metrics.coreExpenses, profile.currencySymbol)}
          </div>
        </div>

        {/* Card 3: Net Savings */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-sm transition hover:border-blue-300">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">Total Savings</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <TrendingUp size={15} />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 text-base sm:text-2xl font-extrabold text-blue-900 font-mono truncate">
            {formatCurrency(metrics.netSavings, profile.currencySymbol)}
          </div>
          <div className="mt-1.5 text-[10px] sm:text-[11px] text-blue-700 font-semibold border-t border-slate-100 pt-1.5 hidden sm:block truncate">
            Excl. Loans: {formatCurrency(metrics.netBalanceExcludingLoans, profile.currencySymbol)}
          </div>
        </div>

        {/* Card 4: Dues (Lent & Borrowed) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-sm transition hover:border-blue-300">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">Dues & Loans</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <CreditCard size={15} />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 text-xs sm:text-sm font-bold text-slate-900 flex justify-between items-center font-mono">
            <span className="truncate">Lent: <strong className="text-blue-700">{formatCurrency(metrics.totalLent, profile.currencySymbol)}</strong></span>
          </div>
          <div className="mt-0.5 sm:mt-1 text-xs sm:text-sm font-bold text-slate-900 flex justify-between items-center font-mono">
            <span className="truncate">Owe: <strong className="text-slate-800">{formatCurrency(metrics.totalBorrowed, profile.currencySymbol)}</strong></span>
          </div>
          <div className="mt-1.5 text-[10px] sm:text-[11px] text-slate-500 border-t border-slate-100 pt-1.5 hidden sm:block">
            <Link href="/dues" className="text-blue-600 font-semibold hover:underline">
              View Khatabook →
            </Link>
          </div>
        </div>
      </div>

      {/* Analytics Charts Row - Hidden on mobile screens */}
      <div className="hidden md:grid md:grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Income vs Expenses Bar Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Personal Cashflow Trend</h3>
              <p className="text-xs text-slate-500">Monthly money in vs money out comparison</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-blue-600" />
                <span className="text-slate-600">Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-slate-300" />
                <span className="text-slate-600">Expenses</span>
              </div>
            </div>
          </div>

          <div className="h-52 sm:h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Bar dataKey="income" fill="#2563eb" radius={[4, 4, 0, 0]} name="Income" />
                <Bar dataKey="expense" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Pie Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Top Spending Categories</h3>
            <p className="text-xs text-slate-500">Where your money goes</p>
          </div>

          <div className="h-44 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={4} dataKey="value">
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1 text-xs border-t border-slate-100 pt-2">
            {categoryData.slice(0, 3).map((c, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="text-slate-600 truncate">{c.name}</span>
                </div>
                <span className="font-semibold text-slate-800 font-mono ml-2">
                  {c.value > 1 ? `₹${c.value}` : '-'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dues & Budgets Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Personal Dues Khatabook Widget */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Personal Dues & Friends Khatabook
            </h3>
            <Link href="/dues" className="text-[11px] font-semibold text-blue-600 hover:underline">
              View All ({activeDues.length})
            </Link>
          </div>

          <div className="space-y-2">
            {activeDues.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                <CheckCircle size={28} className="mx-auto text-blue-600 mb-1" />
                No pending dues! All settled.
              </div>
            ) : (
              activeDues.slice(0, 3).map((due: PersonalDue) => {
                const isLent = due.type === 'I_LENT';
                return (
                  <div
                    key={due.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{due.personName}</div>
                      <div className="text-[11px] text-slate-400">
                        {isLent ? 'They owe you' : 'You owe them'} • Due {due.dueDate}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold font-mono ${isLent ? 'text-blue-700' : 'text-slate-900'}`}>
                        ₹{due.remainingAmount}
                      </div>
                      <Link
                        href="/dues"
                        className="text-[10px] font-semibold text-blue-600 hover:underline"
                      >
                        Settle →
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Monthly Budgets Widget */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Monthly Category Budgets
            </h3>
            <Link href="/budgets" className="text-[11px] font-semibold text-blue-600 hover:underline">
              Manage Budgets
            </Link>
          </div>

          <div className="space-y-3">
            {budgets.slice(0, 3).map((b: PersonalBudget) => {
              const spent = transactions
                .filter((t: PersonalTransaction) => t.type === 'EXPENSE' && t.category === b.category)
                .reduce((s: number, t: PersonalTransaction) => s + t.amount, 0);

              const percent = Math.min(100, Math.round((spent / b.monthlyLimit) * 100));

              return (
                <div key={b.id} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-800">{b.category}</span>
                    <span className="text-slate-500 font-mono">₹{spent} / ₹{b.monthlyLimit} ({percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        percent >= 90 ? 'bg-blue-900' : 'bg-blue-600'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Transactions List (Native Card view on Mobile, Table on Desktop) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Personal Transactions</h3>
            <p className="text-xs text-slate-500">Your latest money in and money out entries</p>
          </div>
          <Link
            href="/transactions"
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
          >
            <span>All</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Mobile View: Native Card List */}
        <div className="sm:hidden divide-y divide-slate-100 mt-1">
          {recentTransactions.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">No transactions recorded yet.</div>
          ) : (
            recentTransactions.map((tx: PersonalTransaction) => (
              <div key={tx.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold ${
                    tx.type === 'INCOME' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {tx.type === 'INCOME' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{tx.category}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <span>{tx.date}</span>
                      {tx.paymentMode && <span>• {tx.paymentMode}</span>}
                    </div>
                  </div>
                </div>
                <div className={`text-xs font-bold font-mono ${
                  tx.type === 'INCOME' ? 'text-blue-700' : 'text-slate-900'
                }`}>
                  {tx.type === 'INCOME' ? '+' : '-'} {formatCurrency(tx.amount, profile.currencySymbol)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden sm:block overflow-x-auto mt-2">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Category & Notes</th>
                <th className="py-3 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTransactions.map((tx: PersonalTransaction) => (
                <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-3 font-mono text-slate-500">{tx.date}</td>
                  <td className="py-3 px-3 font-medium text-slate-900">
                    <div>{tx.category}</div>
                    {tx.notes && <div className="text-[11px] text-slate-400">{tx.notes}</div>}
                  </td>
                  <td className={`py-3 px-3 text-right font-bold font-mono ${
                    tx.type === 'INCOME' ? 'text-blue-700' : 'text-slate-900'
                  }`}>
                    {tx.type === 'INCOME' ? '+' : '-'} {formatCurrency(tx.amount, profile.currencySymbol)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        defaultTab={quickAddTab}
      />
    </div>
  );
}
