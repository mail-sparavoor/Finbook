"use client";

import React, { useState, useEffect } from 'react';
import { usePersonalFinance } from '@/lib/personal-context';
import { PersonalBook } from '@/lib/types';
import {
  Settings,
  User,
  DollarSign,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  BookOpen,
  Plus,
  Settings2,
  Check,
} from 'lucide-react';
import BookModal from '@/components/modals/BookModal';

export default function PersonalSettingsPage() {
  const { profile, updateProfile, resetAllData, books, currentBook, switchBook } = usePersonalFinance();

  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [currency, setCurrency] = useState(profile.currency);
  const [currencySymbol, setCurrencySymbol] = useState(profile.currencySymbol);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Book Modal state
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [selectedBookForEdit, setSelectedBookForEdit] = useState<PersonalBook | null>(null);

  // Sync inputs with profile when profile loads or updates
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
      setCurrency(profile.currency || 'INR');
      setCurrencySymbol(profile.currencySymbol || '₹');
    }
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSaving(true);
    try {
      const res = await updateProfile({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        currency,
        currencySymbol,
      });
      if (res && !res.success) {
        setErrorMsg(res.error || 'Failed to update preferences.');
      } else {
        setSavedMsg(true);
        setTimeout(() => setSavedMsg(false), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenCreateBook = () => {
    setSelectedBookForEdit(null);
    setBookModalOpen(true);
  };

  const handleOpenEditBook = (b: PersonalBook) => {
    setSelectedBookForEdit(b);
    setBookModalOpen(true);
  };

  const handleExportBackup = () => {
    const data = {
      profile: localStorage.getItem('myfinbook_personal_profile'),
      accounts: localStorage.getItem('myfinbook_personal_accounts'),
      transactions: localStorage.getItem('myfinbook_personal_transactions'),
      dues: localStorage.getItem('myfinbook_personal_dues'),
      budgets: localStorage.getItem('myfinbook_personal_budgets'),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FinBook_Personal_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    link.remove();
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all data back to the default sample records?')) {
      resetAllData();
      alert('Data reset successfully!');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Personal Settings & Books</h1>
          <p className="text-xs text-slate-500">Configure your profile, manage multiple books/ledgers, and local backups</p>
        </div>
      </div>

      {savedMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3.5 text-xs font-bold text-blue-900 animate-in fade-in">
          <CheckCircle2 size={16} className="text-blue-600" />
          <span>Profile preferences saved and synced successfully!</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 p-3.5 text-xs font-bold text-slate-800 animate-in fade-in">
          <AlertCircle size={16} className="text-blue-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Books Management Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <BookOpen size={16} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">My Books & Ledgers</h2>
              <p className="text-xs text-slate-500">Create and isolate records between Personal, Business, Projects, etc.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenCreateBook}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <Plus size={14} className="stroke-[2.5]" />
            <span>New Book</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
          {books.map((b) => {
            const isSelected = currentBook?.id === b.id;
            return (
              <div
                key={b.id}
                className={`relative flex flex-col justify-between rounded-xl border p-4 transition ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3.5 w-3.5 rounded-full shadow-2xs"
                        style={{ backgroundColor: b.color || '#2563eb' }}
                      />
                      <span className="font-bold text-sm text-slate-900">{b.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenEditBook(b)}
                      className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                      title="Edit Book Settings"
                    >
                      <Settings2 size={15} />
                    </button>
                  </div>

                  {b.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">{b.description}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
                  <span className="font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {b.currency} ({b.currencySymbol})
                  </span>

                  {isSelected ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                      <Check size={12} className="stroke-[3]" /> Active
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => switchBook(b.id)}
                      className="text-[11px] font-semibold text-blue-600 hover:underline"
                    >
                      Switch to Book
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Profile & Currency Form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
            <User size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Profile & Default Account Preferences</h2>
            <p className="text-xs text-slate-500">Customize your user profile details</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs max-w-lg">
          <div>
            <label className="block font-semibold text-slate-700">Your Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700">Mobile Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isSaving ? 'Saving Changes...' : 'Save Preferences'}
          </button>
        </form>
      </div>

      {/* Backup & Reset Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-900 text-white">
            <ShieldCheck size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Data Backup & Privacy</h2>
            <p className="text-xs text-slate-500">Your personal finance data is stored private and securely</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Export Backup */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-2">
            <div className="text-xs font-bold text-slate-900">Download Full JSON Backup</div>
            <p className="text-[11px] text-slate-500">
              Export all your personal transactions, dues, and accounts to a secure JSON file.
            </p>
            <button
              onClick={handleExportBackup}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <Download size={13} />
              <span>Export JSON File</span>
            </button>
          </div>

          {/* Reset Data */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-2">
            <div className="text-xs font-bold text-slate-900">Reset to Sample Data</div>
            <p className="text-[11px] text-slate-500">
              Restore default sample personal accounts and demo transactions.
            </p>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              <RotateCcw size={13} />
              <span>Reset Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Book Modal */}
      <BookModal
        isOpen={bookModalOpen}
        onClose={() => setBookModalOpen(false)}
        editingBook={selectedBookForEdit}
      />
    </div>
  );
}
