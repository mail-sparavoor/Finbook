"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePersonalFinance } from '@/lib/personal-context';
import { X, CheckCircle2 } from 'lucide-react';
import { PersonalDue, DueType, PersonContact } from '@/lib/types';

interface EditDueModalProps {
  isOpen: boolean;
  onClose: () => void;
  due: PersonalDue | null;
}

export default function EditDueModal({ isOpen, onClose, due }: EditDueModalProps) {
  const { profile, updateDue, contacts } = usePersonalFinance();

  const [type, setType] = useState<DueType>('I_LENT');
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [personName, setPersonName] = useState('');
  const [phone, setPhone] = useState('');
  const [originalAmount, setOriginalAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'SETTLED'>('ACTIVE');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (due) {
      setType(due.type);
      setSelectedPersonId(due.personId || '');
      setPersonName(due.personName);
      setPhone(due.phone || '');
      setOriginalAmount(due.originalAmount.toString());
      setPaidAmount(due.paidAmount.toString());
      setDueDate(due.dueDate);
      setNotes(due.notes || '');
      setStatus(due.status);
    }
  }, [due]);

  if (!isOpen || !due || !mounted) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const origAmt = parseFloat(originalAmount) || 0;
    const paidAmt = parseFloat(paidAmount) || 0;
    if (origAmt <= 0 || !personName.trim()) return;

    const remaining = Math.max(0, origAmt - paidAmt);
    const calculatedStatus = remaining === 0 ? 'SETTLED' : status;

    updateDue(due.id, {
      type,
      personId: selectedPersonId || undefined,
      personName: personName.trim(),
      phone: phone.trim() || undefined,
      originalAmount: origAmt,
      paidAmount: paidAmt,
      dueDate,
      notes: notes.trim(),
      status: calculatedStatus,
    });

    setSuccessMsg('Loan record updated successfully!');
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 800);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] select-text">
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden mx-auto -mt-1 mb-3.5 h-1.5 w-12 rounded-full bg-slate-200" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Edit Due / Loan Entry</h3>
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
            <div>
              <label className="block font-semibold text-slate-700">Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as DueType)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs focus:border-blue-600 focus:outline-none"
              >
                <option value="I_LENT">I Lent (Money Given - Collectable)</option>
                <option value="I_BORROWED">I Borrowed (Money Taken - Payable)</option>
              </select>
            </div>

            {/* Person Name & Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700">Person Name *</label>
                <input
                  type="text"
                  required
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Phone Number</label>
                <input
                  type="text"
                  placeholder="+91..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Amounts */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700">Original Amount ({profile.currencySymbol}) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={originalAmount}
                  onChange={(e) => setOriginalAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Paid Amount ({profile.currencySymbol})</label>
                <input
                  type="number"
                  step="0.01"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Due Date & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700">Due Date</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs focus:border-blue-600 focus:outline-none"
                >
                  <option value="ACTIVE">ACTIVE (Pending)</option>
                  <option value="SETTLED">SETTLED (Cleared)</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block font-semibold text-slate-700">Reason / Notes</label>
              <input
                type="text"
                placeholder="e.g. Travel split or loan assistance"
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
    </div>,
    document.body
  );
}
