"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePersonalFinance } from '@/lib/personal-context';
import { X, CheckCircle2 } from 'lucide-react';
import { PersonContact } from '@/lib/types';

interface EditContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: PersonContact | null;
}

export default function EditContactModal({ isOpen, onClose, contact }: EditContactModalProps) {
  const { updateContact } = usePersonalFinance();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (contact) {
      setName(contact.name);
      setPhone(contact.phone || '');
      setNotes(contact.notes || '');
    }
  }, [contact]);

  if (!isOpen || !contact || !mounted) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    updateContact(contact.id, {
      name: name.trim(),
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setSuccessMsg('Person profile updated successfully!');
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
          <h3 className="text-base font-bold text-slate-900">Edit Person Profile</h3>
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
            <div>
              <label className="block font-semibold text-slate-700">Person Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700">Mobile / Phone Number</label>
              <input
                type="text"
                placeholder="+91..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700">Notes / Relationship</label>
              <input
                type="text"
                placeholder="e.g. Roommate, Colleague"
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
