"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePersonalFinance } from '@/lib/personal-context';
import { PersonalBook } from '@/lib/types';
import { X, BookOpen, Check, Trash2, AlertCircle } from 'lucide-react';

interface BookModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingBook?: PersonalBook | null;
}

const COLOR_OPTIONS = [
  { name: 'Royal Blue', value: '#2563eb', bg: 'bg-blue-600' },
  { name: 'Emerald Green', value: '#059669', bg: 'bg-emerald-600' },
  { name: 'Indigo Purple', value: '#6366f1', bg: 'bg-indigo-500' },
  { name: 'Amber Orange', value: '#d97706', bg: 'bg-amber-600' },
  { name: 'Rose Pink', value: '#e11d48', bg: 'bg-rose-600' },
  { name: 'Teal Cyan', value: '#0d9488', bg: 'bg-teal-600' },
  { name: 'Slate Gray', value: '#475569', bg: 'bg-slate-600' },
];

const COMMON_CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'INR (₹) - Indian Rupee' },
  { code: 'USD', symbol: '$', label: 'USD ($) - US Dollar' },
  { code: 'EUR', symbol: '€', label: 'EUR (€) - Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP (£) - British Pound' },
  { code: 'AED', symbol: 'د.إ', label: 'AED (د.إ) - UAE Dirham' },
  { code: 'SAR', symbol: '﷼', label: 'SAR (﷼) - Saudi Riyal' },
  { code: 'CAD', symbol: '$', label: 'CAD ($) - Canadian Dollar' },
  { code: 'AUD', symbol: '$', label: 'AUD ($) - Australian Dollar' },
  { code: 'SGD', symbol: '$', label: 'SGD ($) - Singapore Dollar' },
  { code: 'QAR', symbol: 'QR', label: 'QAR (QR) - Qatari Riyal' },
  { code: 'KWD', symbol: 'KD', label: 'KWD (KD) - Kuwaiti Dinar' },
  { code: 'OMR', symbol: 'OMR', label: 'OMR (OMR) - Omani Rial' },
  { code: 'BHD', symbol: 'BD', label: 'BHD (BD) - Bahraini Dinar' },
];

export default function BookModal({ isOpen, onClose, editingBook }: BookModalProps) {
  const { createBook, updateBook, deleteBook, books } = usePersonalFinance();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [color, setColor] = useState('#2563eb');
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (editingBook) {
      setName(editingBook.name);
      setDescription(editingBook.description || '');
      setCurrency(editingBook.currency || 'INR');
      setCurrencySymbol(editingBook.currencySymbol || '₹');
      setColor(editingBook.color || '#2563eb');
      setIsDefault(Boolean(editingBook.isDefault));
    } else {
      setName('');
      setDescription('');
      setCurrency('INR');
      setCurrencySymbol('₹');
      setColor('#2563eb');
      setIsDefault(false);
    }
    setErrorMsg(null);
  }, [editingBook, isOpen]);

  if (!isOpen || !mounted) return null;

  const handleCurrencyChange = (currCode: string) => {
    const match = COMMON_CURRENCIES.find((c) => c.code === currCode);
    if (match) {
      setCurrency(match.code);
      setCurrencySymbol(match.symbol);
    } else {
      setCurrency(currCode.toUpperCase());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please enter a book name.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingBook) {
        const success = await updateBook(editingBook.id, {
          name: name.trim(),
          description: description.trim(),
          currency: currency.trim(),
          currencySymbol: currencySymbol.trim(),
          color,
          isDefault,
        });
        if (success) {
          onClose();
        } else {
          setErrorMsg('Failed to update book.');
        }
      } else {
        const newBook = await createBook({
          name: name.trim(),
          description: description.trim(),
          currency: currency.trim(),
          currencySymbol: currencySymbol.trim(),
          color,
          isDefault,
        });
        if (newBook) {
          onClose();
        } else {
          setErrorMsg('Failed to create new book.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingBook) return;
    if (books.length <= 1) {
      setErrorMsg('You must have at least one active book.');
      return;
    }
    if (confirm(`Are you sure you want to delete "${editingBook.name}"? All transactions and dues inside this book will be permanently removed.`)) {
      setIsSubmitting(true);
      const res = await deleteBook(editingBook.id);
      setIsSubmitting(false);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to delete book.');
      }
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] select-text">
        {/* Mobile Drag Handle */}
        <div className="sm:hidden mx-auto -mt-1 mb-3.5 h-1.5 w-12 rounded-full bg-slate-200" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm"
              style={{ backgroundColor: color }}
            >
              <BookOpen size={20} className="stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingBook ? 'Edit Book / Ledger' : 'Create New Book'}
              </h2>
              <p className="text-xs text-slate-500">
                {editingBook
                  ? 'Update book details and currency settings'
                  : 'Add an isolated cashbook for personal, business or projects'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Book Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Book Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Personal, Business, Side Project, Travel"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Notes (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Cashbook for store sales and vendor expenses"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {COMMON_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Symbol</label>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                maxLength={4}
              />
            </div>
          </div>

          {/* Color Badge Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Book Color Theme</label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform ${c.bg} ${
                    color === c.value ? 'scale-110 ring-3 ring-blue-300 ring-offset-2' : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  title={c.name}
                >
                  {color === c.value && <Check size={14} className="text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Default Switcher */}
          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div>
              <div className="text-xs font-semibold text-slate-900">Set as Primary Default Book</div>
              <div className="text-[11px] text-slate-500">Opens automatically when you sign in</div>
            </div>
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            {editingBook && books.length > 1 ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
              >
                <Trash2 size={14} />
                Delete
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition"
              >
                {isSubmitting ? 'Saving...' : editingBook ? 'Save Changes' : 'Create Book'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
