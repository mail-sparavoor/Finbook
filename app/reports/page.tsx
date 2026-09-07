"use client";

import React, { useState, useMemo } from 'react';
import { usePersonalFinance } from '@/lib/personal-context';
import { formatCurrency } from '@/lib/finance-math';
import { PersonalTransaction } from '@/lib/types';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

export default function PersonalReportsPage() {
  const { profile, metrics, transactions } = usePersonalFinance();

  // Derive only months for which figures/transactions have been added
  const availableMonths = useMemo(() => {
    const monthsMap = new Map<string, string>();
    transactions.forEach((t: PersonalTransaction) => {
      if (t.date && t.date.length >= 7) {
        const monthKey = t.date.slice(0, 7); // e.g. "2026-09"
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

  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  const activeMonth = useMemo(() => {
    if (selectedMonth && availableMonths.some((m) => m.key === selectedMonth)) {
      return selectedMonth;
    }
    if (availableMonths.length > 0) {
      return availableMonths[0].key;
    }
    return currentMonth;
  }, [selectedMonth, availableMonths, currentMonth]);

  const activeMonthLabel = useMemo(() => {
    const match = availableMonths.find((m) => m.key === activeMonth);
    if (match) return match.label;
    const [yearStr, monthStr] = activeMonth.split('-');
    const dateObj = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
    return !isNaN(dateObj.getTime())
      ? dateObj.toLocaleString('default', { month: 'long', year: 'numeric' })
      : activeMonth;
  }, [availableMonths, activeMonth]);

  const monthTransactions = useMemo(() => {
    return transactions.filter((t: PersonalTransaction) => t.date.startsWith(activeMonth));
  }, [transactions, activeMonth]);

  const monthIncome = useMemo(() => {
    return monthTransactions.filter((t: PersonalTransaction) => t.type === 'INCOME').reduce((s: number, t: PersonalTransaction) => s + t.amount, 0);
  }, [monthTransactions]);

  const monthExpenses = useMemo(() => {
    return monthTransactions.filter((t: PersonalTransaction) => t.type === 'EXPENSE').reduce((s: number, t: PersonalTransaction) => s + t.amount, 0);
  }, [monthTransactions]);

  const monthSavings = monthIncome - monthExpenses;
  const monthSavingsRate = monthIncome > 0 ? Math.round((monthSavings / monthIncome) * 100) : 0;

  // Group expenses by category
  const expensesByCategory = useMemo(() => {
    const map: { [key: string]: number } = {};
    monthTransactions
      .filter((t: PersonalTransaction) => t.type === 'EXPENSE')
      .forEach((t: PersonalTransaction) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [monthTransactions]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Payment Mode', 'Amount', 'Notes'];
    const rows = monthTransactions.map((t: PersonalTransaction) => [
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
    link.download = `Personal_Statement_${activeMonth}.csv`;
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Personal Statements & Reports</h1>
          <p className="text-xs text-slate-500">Monthly cash flow statement, savings summaries, and export tools</p>
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
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <Printer size={14} />
            <span>Print Statement</span>
          </button>
        </div>
      </div>

      {/* Month Selector - Displaying only months for which figures are added */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-blue-600" />
          <span className="text-xs font-bold text-slate-700">Statement Period:</span>
        </div>
        {availableMonths.length > 0 ? (
          <select
            value={activeMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
          >
            {availableMonths.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label} ({m.key})
              </option>
            ))}
          </select>
        ) : (
          <span className="text-xs font-medium text-slate-400 italic">No transaction months recorded yet</span>
        )}
      </div>

      {/* Printable Statement Document */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-6 print-card text-slate-800">
        {/* Statement Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="text-xl font-bold text-blue-900">Personal Cash Flow Statement</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Account Holder: <strong>{profile.name}</strong> • Period: <strong>{activeMonthLabel} ({activeMonth})</strong>
            </div>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div>Generated: {new Date().toLocaleDateString()}</div>
            <div className="font-mono text-blue-700 font-bold">Currency: {profile.currencySymbol} ({profile.currency})</div>
          </div>
        </div>

        {/* 3 Overview Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Month Income</div>
            <div className="text-xl font-extrabold text-blue-900 mt-1 font-mono">
              +{formatCurrency(monthIncome, profile.currencySymbol)}
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Month Expenses</div>
            <div className="text-xl font-extrabold text-slate-900 mt-1 font-mono">
              -{formatCurrency(monthExpenses, profile.currencySymbol)}
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <div className="text-[10px] uppercase font-bold text-blue-900">Net Month Savings</div>
            <div className="text-xl font-extrabold text-blue-950 mt-1 font-mono">
              {formatCurrency(monthSavings, profile.currencySymbol)}
            </div>
            <div className="text-[10px] text-blue-700 font-semibold mt-0.5">
              Savings Rate: {monthSavingsRate}%
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-100">
            Expense Breakdown by Category
          </div>

          {expensesByCategory.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">No expenses recorded for this month.</div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {expensesByCategory.map(([cat, amt]) => {
                const pct = monthExpenses > 0 ? Math.round((amt / monthExpenses) * 100) : 0;
                return (
                  <div key={cat} className="flex items-center justify-between py-2">
                    <span className="font-medium text-slate-700">{cat}</span>
                    <div className="flex items-center gap-4 font-mono">
                      <span className="text-slate-400 text-[11px]">{pct}%</span>
                      <span className="font-bold text-slate-900">₹{amt}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Transactions Table in Statement */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Transaction Ledger ({monthTransactions.length})
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase">
                  <th className="py-2">Date</th>
                  <th className="py-2">Type</th>
                  <th className="py-2">Category</th>
                  <th className="py-2">Mode</th>
                  <th className="py-2">Notes</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthTransactions.map((t: PersonalTransaction) => (
                  <tr key={t.id}>
                    <td className="py-2 font-mono text-slate-500">{t.date}</td>
                    <td className="py-2 font-semibold text-slate-700">{t.type}</td>
                    <td className="py-2 text-slate-900">{t.category}</td>
                    <td className="py-2 text-slate-600">{t.paymentMode || 'Online / UPI'}</td>
                    <td className="py-2 text-slate-500">{t.notes || '-'}</td>
                    <td className={`py-2 text-right font-mono font-bold ${
                      t.type === 'INCOME' ? 'text-blue-700' : 'text-slate-900'
                    }`}>
                      {t.type === 'INCOME' ? '+' : '-'}₹{t.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
