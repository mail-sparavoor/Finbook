"use client";

import React, { useState } from 'react';
import { usePersonalFinance } from '@/lib/personal-context';
import {
  Settings,
  User,
  DollarSign,
  Download,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

export default function PersonalSettingsPage() {
  const { profile, updateProfile, resetAllData } = usePersonalFinance();

  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email || '');
  const [currency, setCurrency] = useState(profile.currency);
  const [currencySymbol, setCurrencySymbol] = useState(profile.currencySymbol);
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      email,
      currency,
      currencySymbol,
    });
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
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
    link.download = `MyFinBook_Personal_Backup_${new Date().toISOString().split('T')[0]}.json`;
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
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Personal Settings & Backup</h1>
          <p className="text-xs text-slate-500">Configure your profile, currency preference, and local data backups</p>
        </div>
      </div>

      {savedMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3.5 text-xs font-bold text-blue-900">
          <CheckCircle2 size={16} className="text-blue-600" />
          <span>Profile preferences saved successfully!</span>
        </div>
      )}

      {/* Profile & Currency Form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <User size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Profile & Currency Preferences</h2>
            <p className="text-xs text-slate-500">Customize display name and local currency</p>
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

          <div>
            <label className="block font-semibold text-slate-700">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700">Preferred Currency</label>
              <select
                value={currency}
                onChange={(e) => {
                  setCurrency(e.target.value);
                  setCurrencySymbol(
                    e.target.value === 'USD' ? '$' : e.target.value === 'EUR' ? '€' : e.target.value === 'GBP' ? '£' : '₹'
                  );
                }}
                className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs focus:border-blue-600 focus:outline-none"
              >
                <option value="INR">INR - Indian Rupee (₹)</option>
                <option value="USD">USD - US Dollar ($)</option>
                <option value="EUR">EUR - Euro (€)</option>
                <option value="GBP">GBP - British Pound (£)</option>
                <option value="AED">AED - UAE Dirham (AED)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700">Symbol</label>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
          >
            Save Preferences
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
            <p className="text-xs text-slate-500">Your personal finance data is stored private and securely on your local machine</p>
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
    </div>
  );
}
