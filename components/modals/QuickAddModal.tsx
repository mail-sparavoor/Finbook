"use client";

import React, { useState } from 'react';
import { usePersonalFinance } from '@/lib/personal-context';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/lib/storage';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import { TransactionType, DueType, PersonContact } from '@/lib/types';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'EXPENSE' | 'INCOME' | 'DUE';
}

export default function QuickAddModal({ isOpen, onClose, defaultTab = 'EXPENSE' }: QuickAddModalProps) {
  const {
    profile,
    addTransaction,
    addDue,
    contacts,
    expenseCategories,
    incomeCategories,
    addCategory,
    paymentModes,
    addPaymentMode,
  } = usePersonalFinance();

  const [activeTab, setActiveTab] = useState<'EXPENSE' | 'INCOME' | 'DUE'>(defaultTab);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  // Common form fields
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(expenseCategories[0] || 'Other Expense');
  const [paymentMode, setPaymentMode] = useState(paymentModes[0] || 'Online / UPI');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Custom Category creation state
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  // Custom Payment Mode creation state
  const [isAddingCustomPaymentMode, setIsAddingCustomPaymentMode] = useState(false);
  const [customPaymentModeInput, setCustomPaymentModeInput] = useState('');

  // Due / Person fields
  const [selectedContactId, setSelectedContactId] = useState<string>(contacts[0]?.id || '__NEW__');
  const [personName, setPersonName] = useState(contacts[0]?.name || '');
  const [phone, setPhone] = useState(contacts[0]?.phone || '');
  const [dueType, setDueType] = useState<DueType>('I_LENT');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]);

  if (!isOpen) return null;

  const currentCategoryList = activeTab === 'EXPENSE' ? expenseCategories : incomeCategories;

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg(null);
      setAmount('');
      setNotes('');
      setPersonName('');
      setPhone('');
      setIsAddingCustomCategory(false);
      setCustomCategoryInput('');
      setIsAddingCustomPaymentMode(false);
      setCustomPaymentModeInput('');
      onClose();
    }, 1000);
  };

  const handleSaveCustomCategory = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (!customCategoryInput.trim()) return;

    const newCat = addCategory(activeTab === 'EXPENSE' ? 'EXPENSE' : 'INCOME', customCategoryInput);
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

    if (activeTab === 'EXPENSE') {
      addTransaction({
        type: 'EXPENSE',
        category,
        amount: amtNum,
        paymentMode,
        date,
        notes,
      });
      showSuccess('Expense recorded successfully!');
    } else if (activeTab === 'INCOME') {
      addTransaction({
        type: 'INCOME',
        category,
        amount: amtNum,
        paymentMode,
        date,
        notes,
      });
      showSuccess('Income added successfully!');
    } else if (activeTab === 'DUE') {
      if (!personName.trim()) return;

      addDue({
        personId: selectedContactId !== '__NEW__' ? selectedContactId : undefined,
        personName: personName.trim(),
        phone: phone.trim(),
        type: dueType,
        amount: amtNum,
        dueDate,
        notes,
      });
      showSuccess(dueType === 'I_LENT' ? 'Recorded money lent!' : 'Recorded money borrowed!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
        {/* Mobile Drag Indicator Handle */}
        <div className="sm:hidden mx-auto -mt-1 mb-3.5 h-1.5 w-12 rounded-full bg-slate-200" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Add New Entry</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Success Alert */}
        {successMsg ? (
          <div className="py-10 flex flex-col items-center justify-center text-center">
            <CheckCircle2 size={44} className="text-blue-600 mb-2" />
            <div className="text-sm font-bold text-slate-900">{successMsg}</div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="mt-4 flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('INCOME');
                  setIsAddingCustomCategory(false);
                  setCategory(incomeCategories[0] || 'Other Income');
                }}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                  activeTab === 'INCOME' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cash In
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('EXPENSE');
                  setIsAddingCustomCategory(false);
                  setCategory(expenseCategories[0] || 'Other Expense');
                }}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                  activeTab === 'EXPENSE' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cash Out
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('DUE');
                  setIsAddingCustomCategory(false);
                }}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                  activeTab === 'DUE' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Loan / Due
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="mt-4 space-y-3.5 text-xs">
              {/* Amount */}
              <div>
                <label className="block font-semibold text-slate-700">
                  Amount ({profile.currencySymbol}) *
                </label>
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

              {/* Expense & Income fields */}
              {(activeTab === 'EXPENSE' || activeTab === 'INCOME') && (
                <>
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
                          Create Custom {activeTab === 'EXPENSE' ? 'Expense' : 'Income'} Category:
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            autoFocus
                            placeholder="e.g. Pet Care, Gym, Tools..."
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
                        <option value="__ADD_NEW_MODE__" className="font-bold text-blue-600">
                          + Add New Payment Mode...
                        </option>
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700">Notes / Details</label>
                    <input
                      type="text"
                      placeholder="e.g. Weekly supermarket groceries or Freelance payout"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </>
              )}

              {/* Due fields */}
              {activeTab === 'DUE' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700">Type *</label>
                    <select
                      value={dueType}
                      onChange={(e) => setDueType(e.target.value as any)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs focus:border-blue-600 focus:outline-none"
                    >
                      <option value="I_LENT">I Lent (They owe me - Money Out)</option>
                      <option value="I_BORROWED">I Borrowed (I owe them - Money In)</option>
                    </select>
                  </div>

                  {/* Person Profile Selector */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block font-semibold text-slate-700">Person Profile *</label>
                      {selectedContactId !== '__NEW__' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedContactId('__NEW__');
                            setPersonName('');
                            setPhone('');
                          }}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition"
                        >
                          + New Person Profile
                        </button>
                      ) : (
                        contacts.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedContactId(contacts[0].id);
                              setPersonName(contacts[0].name);
                              setPhone(contacts[0].phone || '');
                            }}
                            className="text-[11px] font-medium text-slate-500 hover:text-slate-700 transition"
                          >
                            Select Existing Profile
                          </button>
                        )
                      )}
                    </div>

                    {selectedContactId !== '__NEW__' && contacts.length > 0 ? (
                      <select
                        value={selectedContactId}
                        onChange={(e) => {
                          if (e.target.value === '__NEW__') {
                            setSelectedContactId('__NEW__');
                            setPersonName('');
                            setPhone('');
                          } else {
                            setSelectedContactId(e.target.value);
                            const found = contacts.find((c: PersonContact) => c.id === e.target.value);
                            if (found) {
                              setPersonName(found.name);
                              setPhone(found.phone || '');
                            }
                          }
                        }}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs focus:border-blue-600 focus:outline-none"
                      >
                        {contacts.map((c: PersonContact) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.phone ? `(${c.phone})` : ''}
                          </option>
                        ))}
                        <option value="__NEW__" className="font-bold text-blue-600">
                          + Add New Person Profile...
                        </option>
                      </select>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-slate-500 mb-1">Person Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Imran or Rahul"
                            value={personName}
                            onChange={(e) => setPersonName(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-500 mb-1">Phone Number</label>
                          <input
                            type="text"
                            placeholder="+91 9847..."
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700">Expected Due Date</label>
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700">Reason / Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Split trip expenses or Friendly loan"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                className="mt-4 w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition"
              >
                Save Entry
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
