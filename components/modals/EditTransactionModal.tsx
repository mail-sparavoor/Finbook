"use client";

import React, { useState, useEffect } from 'react';
import { usePersonalFinance } from '@/lib/personal-context';
import { X, CheckCircle2 } from 'lucide-react';
import { PersonalTransaction, TransactionType } from '@/lib/types';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: PersonalTransaction | null;
}

export default function EditTransactionModal({ isOpen, onClose, transaction }: EditTransactionModalProps) {
  const {
    profile,
    updateTransaction,
    expenseCategories,
    incomeCategories,
    addCategory,
    paymentModes,
    addPaymentMode,
  } = usePersonalFinance();

  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Custom Category & Payment Mode state
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [isAddingCustomPaymentMode, setIsAddingCustomPaymentMode] = useState(false);
  const [customPaymentModeInput, setCustomPaymentModeInput] = useState('');

  useEffect(() => {
    if (transaction) {
      setType(transaction.type === 'INCOME' ? 'INCOME' : 'EXPENSE');
      setAmount(transaction.amount.toString());
      setCategory(transaction.category);
      setPaymentMode(transaction.paymentMode || 'Online / UPI');
      setDate(transaction.date);
      setNotes(transaction.notes || '');
      setIsAddingCustomCategory(false);
      setIsAddingCustomPaymentMode(false);
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const currentCategoryList = type === 'EXPENSE' ? expenseCategories : incomeCategories;

  const handleSaveCustomCategory = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (!customCategoryInput.trim()) return;

    const newCat = addCategory(type, customCategoryInput);
    if (newCat) {
      setCategory(newCat);
      setCustomCategoryInput('');
      setIsAddingCustomCategory(false);
    }
  };

  const handleSaveCustomPaymentMode = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (!customPaymentModeInput.trim()) return;

    const newMode = addPaymentMode(customPaymentModeInput);
    if (newMode) {
      setPaymentMode(newMode);
      setCustomPaymentModeInput('');
      setIsAddingCustomPaymentMode(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const amtNum = parseFloat(amount) || 0;
    if (amtNum <= 0) return;

    updateTransaction(transaction.id, {
      type,
      category,
      amount: amtNum,
      paymentMode,
      date,
      notes,
    });

    setSuccessMsg('Transaction updated successfully!');
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden mx-auto -mt-1 mb-3.5 h-1.5 w-12 rounded-full bg-slate-200" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Edit Transaction</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {successMsg ? (
          <div className="py-10 flex flex-col items-center justify-center text-center">
            <CheckCircle2 size={44} className="text-blue-600 mb-2" />
            <div className="text-sm font-bold text-slate-900">{successMsg}</div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="mt-4 space-y-3.5 text-xs">
            {/* Type selector */}
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => {
                  setType('EXPENSE');
                  if (!expenseCategories.includes(category)) {
                    setCategory(expenseCategories[0] || 'Other Expense');
                  }
                }}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                  type === 'EXPENSE' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Expense (Money Out)
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('INCOME');
                  if (!incomeCategories.includes(category)) {
                    setCategory(incomeCategories[0] || 'Other Income');
                  }
                }}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                  type === 'INCOME' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Income (Money In)
              </button>
            </div>

            {/* Amount */}
            <div>
              <label className="block font-semibold text-slate-700">Amount ({profile.currencySymbol}) *</label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                required
                autoFocus
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-base font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            {/* Category & Date */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-semibold text-slate-700">Category</label>
                {!isAddingCustomCategory ? (
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomCategory(true)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition"
                  >
                    + Add New Category
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomCategory(false)}
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-700 transition"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {isAddingCustomCategory ? (
                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-2.5 space-y-2">
                  <div className="text-[11px] font-semibold text-blue-900">
                    Create Custom {type === 'EXPENSE' ? 'Expense' : 'Income'} Category:
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      autoFocus
                      placeholder="e.g. Subscriptions, Groceries..."
                      value={customCategoryInput}
                      onChange={(e) => setCustomCategoryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveCustomCategory();
                        }
                      }}
                      className="flex-1 rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveCustomCategory()}
                      disabled={!customCategoryInput.trim()}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <select
                      value={category}
                      onChange={(e) => {
                        if (e.target.value === '__ADD_NEW__') {
                          setIsAddingCustomCategory(true);
                        } else {
                          setCategory(e.target.value);
                        }
                      }}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs focus:border-blue-600 focus:outline-none"
                    >
                      {currentCategoryList.map((c: string) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      {!currentCategoryList.includes(category) && category && (
                        <option value={category}>{category}</option>
                      )}
                      <option value="__ADD_NEW__" className="font-bold text-blue-600">
                        + Add New Category...
                      </option>
                    </select>
                  </div>

                  <div>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {isAddingCustomCategory && (
                <div>
                  <label className="block font-semibold text-slate-700 mt-2 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Payment Mode */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block font-semibold text-slate-700">Payment Mode</label>
                {!isAddingCustomPaymentMode ? (
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomPaymentMode(true)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition"
                  >
                    + Add Mode
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomPaymentMode(false)}
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-700 transition"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {isAddingCustomPaymentMode ? (
                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-2.5 space-y-2">
                  <div className="text-[11px] font-semibold text-blue-900">
                    Create Custom Payment Mode:
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      autoFocus
                      placeholder="e.g. Google Pay, Cheque, Wallet..."
                      value={customPaymentModeInput}
                      onChange={(e) => setCustomPaymentModeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveCustomPaymentMode();
                        }
                      }}
                      className="flex-1 rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveCustomPaymentMode()}
                      disabled={!customPaymentModeInput.trim()}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ) : (
                <select
                  value={paymentMode}
                  onChange={(e) => {
                    if (e.target.value === '__ADD_NEW_MODE__') {
                      setIsAddingCustomPaymentMode(true);
                    } else {
                      setPaymentMode(e.target.value);
                    }
                  }}
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs focus:border-blue-600 focus:outline-none"
                >
                  {paymentModes.map((m: string) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                  {!paymentModes.includes(paymentMode) && paymentMode && (
                    <option value={paymentMode}>{paymentMode}</option>
                  )}
                  <option value="__ADD_NEW_MODE__" className="font-bold text-blue-600">
                    + Add New Payment Mode...
                  </option>
                </select>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block font-semibold text-slate-700">Notes / Details</label>
              <input
                type="text"
                placeholder="e.g. Supermarket groceries or Freelance payout"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
