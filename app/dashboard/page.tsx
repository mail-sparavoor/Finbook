"use client";

import React, { useMemo } from 'react';
import { usePersonalFinance } from '@/lib/personal-context';
import { formatCurrency } from '@/lib/finance-math';
import {
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { PersonalTransaction, PersonalDue, PersonalBudget } from '@/lib/types';
import Link from 'next/link';
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

  const currentMonthName = useMemo(() => {
    return new Date().toLocaleString('default', { month: 'short' });
  }, []);

  // Monthly cash flow trend
  const monthlyData = [
    { name: 'Jun', income: 75000, expense: 48000 },
    { name: 'Jul', income: 90000, expense: 52000 },
    { name: 'Aug', income: 82000, expense: 49000 },
    { name: `${currentMonthName} (Current)`, income: metrics.monthlyIncome, expense: metrics.monthlyExpenses },
  ];

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
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-900 to-blue-800 p-6 text-white shadow-sm">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
            Personal CashBook & Ledger
          </span>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Welcome, {profile.name}</h1>
          <p className="mt-0.5 text-xs text-blue-100">
            Track your personal income, expenses, savings, and personal lending.
          </p>
        </div>

        <div className="rounded-xl bg-white/10 px-5 py-3 backdrop-blur text-right">
          <div className="text-[10px] uppercase font-bold text-blue-200">Total Net Balance</div>
          <div className="text-2xl font-extrabold text-white font-mono mt-0.5">
            {formatCurrency(metrics.totalNetWorth, profile.currencySymbol)}
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Monthly Income */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">This Month Income</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <ArrowDownLeft size={16} />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-blue-900 font-mono">
            +{formatCurrency(metrics.monthlyIncome, profile.currencySymbol)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            Salary, freelance & other income
          </div>
        </div>

        {/* Card 2: Monthly Expenses */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">This Month Expenses</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-900">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900 font-mono">
            -{formatCurrency(metrics.monthlyExpenses, profile.currencySymbol)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            Rent, food, groceries & bills
          </div>
        </div>

        {/* Card 3: Net Savings */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Net Savings</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-blue-900 font-mono">
            {formatCurrency(metrics.netSavings, profile.currencySymbol)}
          </div>
          <div className="mt-2 text-[11px] text-blue-700 font-semibold border-t border-slate-100 pt-2">
            Savings rate: {metrics.savingsRate}% of income
          </div>
        </div>

        {/* Card 4: Dues (Lent & Borrowed) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Dues & Loans</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="mt-3 text-sm font-bold text-slate-900 flex justify-between items-center font-mono">
            <span>I Lent: <strong className="text-blue-700">₹{metrics.totalLent}</strong></span>
          </div>
          <div className="mt-1 text-sm font-bold text-slate-900 flex justify-between items-center font-mono">
            <span>I Owe: <strong className="text-slate-800">₹{metrics.totalBorrowed}</strong></span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            <Link href="/dues" className="text-blue-600 font-semibold hover:underline">
              View Khatabook →
            </Link>
          </div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expenses Bar Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Personal Cashflow Trend</h3>
              <p className="text-xs text-slate-500">Monthly money in vs money out comparison</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-blue-600" />
                <span className="text-slate-600">Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-slate-300" />
                <span className="text-slate-600">Expenses</span>
              </div>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="income" fill="#2563eb" radius={[4, 4, 0, 0]} name="Income" />
                <Bar dataKey="expense" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Pie Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Top Spending Categories</h3>
            <p className="text-xs text-slate-500">Where your money goes</p>
          </div>

          <div className="h-44 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={4} dataKey="value">
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-slate-100 pt-3">
            {categoryData.map((cat) => (
              <div key={cat.name} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="text-slate-600 truncate">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dues & Budgets Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Dues Widget */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
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
                <CheckCircle size={24} className="mx-auto text-blue-600 mb-1" />
                No pending dues! All settled.
              </div>
            ) : (
              activeDues.map((d: PersonalDue) => {
                const isLent = d.type === 'I_LENT';
                return (
                  <div key={d.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{d.personName}</div>
                      <div className="text-[10px] text-slate-500">
                        {isLent ? 'They owe you' : 'You owe them'} • Due: {d.dueDate}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-extrabold font-mono ${isLent ? 'text-blue-700' : 'text-slate-900'}`}>
                        {isLent ? '+' : '-'}₹{d.remainingAmount}
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
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
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
              // Calculate spent for this category
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

      {/* Recent Transactions Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Personal Transactions</h3>
            <p className="text-xs text-slate-500">Your latest money in and money out entries</p>
          </div>
          <Link
            href="/transactions"
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
          >
            <span>All Transactions</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto mt-2">
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
    </div>
  );
}
