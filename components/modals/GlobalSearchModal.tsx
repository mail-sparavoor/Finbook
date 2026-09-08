"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePersonalFinance } from '@/lib/personal-context';
import { formatCurrency } from '@/lib/finance-math';
import { PersonalTransaction, PersonalDue } from '@/lib/types';
import {
  Search,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
} from 'lucide-react';
import Link from 'next/link';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const { profile, transactions, dues } = usePersonalFinance();
  const [query, setQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase().trim();

    const matchedTx = transactions.filter(
      (t: PersonalTransaction) =>
        t.category.toLowerCase().includes(q) ||
        (t.notes ? t.notes.toLowerCase().includes(q) : false)
    );

    const matchedDues = dues.filter(
      (d: PersonalDue) =>
        d.personName.toLowerCase().includes(q) ||
        (d.notes ? d.notes.toLowerCase().includes(q) : false) ||
        (d.phone ? d.phone.includes(q) : false)
    );

    return {
      transactions: matchedTx,
      dues: matchedDues,
      totalCount: matchedTx.length + matchedDues.length,
    };
  }, [query, transactions, dues]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Search Bar */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5">
          <Search size={18} className="text-blue-600" />
          <input
            type="text"
            autoFocus
            placeholder="Search expenses, salary, dues..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="rounded p-1 text-slate-400 hover:bg-slate-100">
              <X size={16} />
            </button>
          )}
          <kbd className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-mono text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!query && (
            <div className="py-8 text-center text-xs text-slate-400">
              Type anything to search (e.g. <span className="font-semibold text-blue-600">"Groceries"</span>, <span className="font-semibold text-blue-600">"Salary"</span>, <span className="font-semibold text-blue-600">"Imran"</span>)
            </div>
          )}

          {query && results && results.totalCount === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching records found for "{query}".
            </div>
          )}

          {/* Dues */}
          {results && results.dues.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Dues & Personal Loans
              </div>
              <div className="space-y-1">
                {results.dues.map((d: PersonalDue) => (
                  <Link
                    key={d.id}
                    href="/dues"
                    onClick={onClose}
                    className="flex items-center justify-between rounded-lg p-2.5 hover:bg-blue-50/70 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                        <CreditCard size={15} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{d.personName}</div>
                        <div className="text-[10px] text-slate-500">
                          {d.type === 'I_LENT' ? 'Money Lent (They owe me)' : 'Money Borrowed (I owe them)'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold font-mono text-blue-900">₹{d.remainingAmount}</div>
                      <span className="text-[9px] text-slate-400">Due: {d.dueDate}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Transactions */}
          {results && results.transactions.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Transactions
              </div>
              <div className="space-y-1">
                {results.transactions.slice(0, 5).map((t: PersonalTransaction) => (
                  <Link
                    key={t.id}
                    href="/transactions"
                    onClick={onClose}
                    className="flex items-center justify-between rounded-lg p-2.5 hover:bg-blue-50/70 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        t.type === 'INCOME' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {t.type === 'INCOME' ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{t.category}</div>
                        <div className="text-[10px] text-slate-500">{t.date} • {t.notes || '-'}</div>
                      </div>
                    </div>
                    <div className={`text-xs font-bold font-mono ${
                      t.type === 'INCOME' ? 'text-blue-700' : 'text-slate-900'
                    }`}>
                      {t.type === 'INCOME' ? '+' : '-'}₹{t.amount}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
