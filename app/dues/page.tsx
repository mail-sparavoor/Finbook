"use client";

import React, { useState, useMemo } from 'react';
import { usePersonalFinance, PersonLedger } from '@/lib/personal-context';
import { formatCurrency } from '@/lib/finance-math';
import {
  CreditCard,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Phone,
  Trash2,
  DollarSign,
  Search,
  Users,
  UserPlus,
  ChevronRight,
  X,
  MessageCircle,
  Calendar,
  Wallet,
  Clock,
  ArrowRight,
  Edit2,
} from 'lucide-react';
import { PersonalDue, DueType, PersonContact, PersonalTransaction } from '@/lib/types';
import EditDueModal from '@/components/modals/EditDueModal';
import EditContactModal from '@/components/modals/EditContactModal';

export default function DuesPage() {
  const {
    profile,
    dues,
    contacts,
    addContact,
    deleteContact,
    getPersonLedger,
    addDue,
    recordDuePayment,
    deleteDue,
  } = usePersonalFinance();

  const [mainView, setMainView] = useState<'PROFILES' | 'MASTER_TABLE'>('PROFILES');
  const [profileFilter, setProfileFilter] = useState<'ALL' | 'RECEIVABLE' | 'PAYABLE' | 'SETTLED'>('ALL');
  const [masterTab, setMasterTab] = useState<'ALL' | 'I_LENT' | 'I_BORROWED' | 'SETTLED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [isAddDueOpen, setIsAddDueOpen] = useState(false);
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [selectedDue, setSelectedDue] = useState<PersonalDue | null>(null);
  const [editingDue, setEditingDue] = useState<PersonalDue | null>(null);
  const [editingContact, setEditingContact] = useState<PersonContact | null>(null);

  // New Person Form
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonPhone, setNewPersonPhone] = useState('');
  const [newPersonNotes, setNewPersonNotes] = useState('');

  // Add Due Form
  const [dueTargetPersonId, setDueTargetPersonId] = useState<string>('');
  const [dueType, setDueType] = useState<DueType>('I_LENT');
  const [dueAmount, setDueAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]);
  const [dueNotes, setDueNotes] = useState('');

  // Settle Form
  const [settleAmount, setSettleAmount] = useState('');
  const [settleNotes, setSettleNotes] = useState('');

  // Metrics
  const totalLentActive = useMemo(() => {
    return dues
      .filter((d: PersonalDue) => d.type === 'I_LENT' && d.status === 'ACTIVE')
      .reduce((s: number, d: PersonalDue) => {
        const orig = Number(d.originalAmount) || 0;
        const paid = Number(d.paidAmount) || 0;
        const rem = d.remainingAmount !== undefined && d.remainingAmount !== null && !isNaN(Number(d.remainingAmount))
          ? Number(d.remainingAmount)
          : Math.max(0, orig - paid);
        return s + rem;
      }, 0);
  }, [dues]);

  const totalBorrowedActive = useMemo(() => {
    return dues
      .filter((d: PersonalDue) => d.type === 'I_BORROWED' && d.status === 'ACTIVE')
      .reduce((s: number, d: PersonalDue) => {
        const orig = Number(d.originalAmount) || 0;
        const paid = Number(d.paidAmount) || 0;
        const rem = d.remainingAmount !== undefined && d.remainingAmount !== null && !isNaN(Number(d.remainingAmount))
          ? Number(d.remainingAmount)
          : Math.max(0, orig - paid);
        return s + rem;
      }, 0);
  }, [dues]);

  // Aggregate Ledgers for all contacts
  const contactLedgers = useMemo(() => {
    return contacts.map((contact: PersonContact) => getPersonLedger(contact.id));
  }, [contacts, dues, getPersonLedger]);

  // Filtered Contacts
  const filteredContactLedgers = useMemo(() => {
    return contactLedgers.filter((ledger: PersonLedger) => {
      if (profileFilter === 'RECEIVABLE' && ledger.status !== 'RECEIVABLE') return false;
      if (profileFilter === 'PAYABLE' && ledger.status !== 'PAYABLE') return false;
      if (profileFilter === 'SETTLED' && ledger.status !== 'SETTLED') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          ledger.personName.toLowerCase().includes(q) ||
          (ledger.phone && ledger.phone.includes(q)) ||
          (ledger.contact?.notes && ledger.contact.notes.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [contactLedgers, profileFilter, searchQuery]);

  // Filtered Master Dues Table
  const filteredDues = useMemo(() => {
    return dues.filter((d: PersonalDue) => {
      if (masterTab === 'I_LENT' && (d.type !== 'I_LENT' || d.status !== 'ACTIVE')) return false;
      if (masterTab === 'I_BORROWED' && (d.type !== 'I_BORROWED' || d.status !== 'ACTIVE')) return false;
      if (masterTab === 'SETTLED' && d.status !== 'SETTLED') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return d.personName.toLowerCase().includes(q) || (d.phone ? d.phone.includes(q) : false) || (d.notes ? d.notes.toLowerCase().includes(q) : false);
      }
      return true;
    });
  }, [dues, masterTab, searchQuery]);

  // Active Selected Person Ledger
  const activeSelectedLedger = useMemo(() => {
    if (!selectedPersonId) return null;
    return getPersonLedger(selectedPersonId);
  }, [selectedPersonId, getPersonLedger]);

  // Handlers
  const handleCreatePerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonName.trim()) return;

    const created = addContact(newPersonName.trim(), newPersonPhone.trim(), newPersonNotes.trim());
    setIsAddPersonOpen(false);
    setNewPersonName('');
    setNewPersonPhone('');
    setNewPersonNotes('');
    setSelectedPersonId(created.id);
  };

  const handleOpenAddDueForPerson = (personId?: string, defaultType: DueType = 'I_LENT') => {
    setDueTargetPersonId(personId || (contacts[0]?.id ?? ''));
    setDueType(defaultType);
    setDueAmount('');
    setDueNotes('');
    setIsAddDueOpen(true);
  };

  const handleSaveDue = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(dueAmount) || 0;
    if (amt <= 0 || !dueTargetPersonId) return;

    const targetContact = contacts.find((c: PersonContact) => c.id === dueTargetPersonId);
    if (!targetContact) return;

    addDue({
      personId: targetContact.id,
      personName: targetContact.name,
      phone: targetContact.phone,
      type: dueType,
      amount: amt,
      dueDate,
      notes: dueNotes,
    });

    setIsAddDueOpen(false);
    setDueAmount('');
    setDueNotes('');
  };

  const handleOpenSettle = (d: PersonalDue) => {
    setSelectedDue(d);
    setSettleAmount(d.remainingAmount.toString());
    setIsSettleOpen(true);
  };

  const handleConfirmSettle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDue) return;

    const amt = parseFloat(settleAmount) || 0;
    if (amt <= 0) return;

    recordDuePayment(selectedDue.id, amt, 'default', settleNotes);
    setIsSettleOpen(false);
    setSelectedDue(null);
    setSettleAmount('');
    setSettleNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Personal Dues & Friends Khatabook</h1>
          <p className="text-xs text-slate-500">
            Dedicated personal profiles & individual financial ledgers for friends, colleagues, and family
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddPersonOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition active:scale-95"
          >
            <UserPlus size={14} />
            <span>+ New Person Profile</span>
          </button>
          <button
            onClick={() => handleOpenAddDueForPerson()}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition active:scale-95"
          >
            <Plus size={14} />
            <span>Record Loan / Due</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-sm">
          <div className="flex items-center justify-between text-blue-900">
            <span className="text-xs font-bold uppercase tracking-wider">Total You Will Get (Lent)</span>
            <ArrowDownLeft size={18} className="text-blue-700" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-blue-950 font-mono">
            {formatCurrency(totalLentActive, profile.currencySymbol)}
          </div>
          <div className="mt-2 text-[11px] text-blue-800 border-t border-blue-100 pt-2">
            Collectable from {contactLedgers.filter((l: PersonLedger) => l.status === 'RECEIVABLE').length} person profiles
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-xs font-bold uppercase tracking-wider">Total You Will Give (Borrowed)</span>
            <ArrowUpRight size={18} className="text-slate-800" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 font-mono">
            {formatCurrency(totalBorrowedActive, profile.currencySymbol)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            Payable by you to {contactLedgers.filter((l: PersonLedger) => l.status === 'PAYABLE').length} person profiles
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-xs font-bold uppercase tracking-wider">Personal Profiles</span>
            <Users size={18} className="text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 font-mono">
            {contacts.length}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            Active friends, colleagues & family contacts
          </div>
        </div>
      </div>

      {/* Main View Toggle & Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Main Mode Tabs */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              onClick={() => setMainView('PROFILES')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${mainView === 'PROFILES' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Users size={14} />
              <span>Person Profiles ({contacts.length})</span>
            </button>
            <button
              onClick={() => setMainView('MASTER_TABLE')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${mainView === 'MASTER_TABLE' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <CreditCard size={14} />
              <span>All Dues Ledger ({dues.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search person, mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs focus:border-blue-600 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* View 1: Person Profiles Grid */}
        {mainView === 'PROFILES' && (
          <div className="space-y-4">
            {/* Filter Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
              <button
                onClick={() => setProfileFilter('ALL')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${profileFilter === 'ALL' ? 'bg-blue-100 text-blue-900 font-bold' : 'text-slate-500 hover:bg-slate-100'
                  }`}
              >
                All People ({contacts.length})
              </button>
              <button
                onClick={() => setProfileFilter('RECEIVABLE')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${profileFilter === 'RECEIVABLE'
                    ? 'bg-blue-100 text-blue-900 font-bold'
                    : 'text-slate-500 hover:bg-slate-100'
                  }`}
              >
                You'll Get ({contactLedgers.filter((l: PersonLedger) => l.status === 'RECEIVABLE').length})
              </button>
              <button
                onClick={() => setProfileFilter('PAYABLE')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${profileFilter === 'PAYABLE' ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-500 hover:bg-slate-100'
                  }`}
              >
                You'll Give ({contactLedgers.filter((l: PersonLedger) => l.status === 'PAYABLE').length})
              </button>
              <button
                onClick={() => setProfileFilter('SETTLED')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${profileFilter === 'SETTLED' ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-500 hover:bg-slate-100'
                  }`}
              >
                Settled / Nil ({contactLedgers.filter((l: PersonLedger) => l.status === 'SETTLED').length})
              </button>
            </div>

            {/* Profile Cards Grid */}
            {filteredContactLedgers.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No personal profiles found. Click <strong>+ New Person Profile</strong> to create one.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredContactLedgers.map((ledger: PersonLedger) => {
                  const initials = ledger.personName
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  const isReceivable = ledger.status === 'RECEIVABLE';
                  const isPayable = ledger.status === 'PAYABLE';
                  const isSettled = ledger.status === 'SETTLED';

                  return (
                    <div
                      key={ledger.contact?.id || ledger.personName}
                      onClick={() => setSelectedPersonId(ledger.contact?.id || ledger.personName)}
                      className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md flex flex-col justify-between"
                    >
                      <div>
                        {/* Top: Avatar & Name */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-900 text-sm">
                              {initials}
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-slate-900">{ledger.personName}</h3>
                              {ledger.phone ? (
                                <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                                  <Phone size={11} /> {ledger.phone}
                                </div>
                              ) : (
                                <div className="text-[11px] text-slate-400 italic">No phone added</div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            {ledger.contact && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingContact(ledger.contact);
                                }}
                                className="rounded-lg p-1.5 text-slate-300 hover:bg-blue-50 hover:text-blue-600 transition"
                                title="Edit Person Profile"
                              >
                                <Edit2 size={13} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete profile for "${ledger.personName}"? This will also remove their dues records.`)) {
                                  if (ledger.contact?.id) {
                                    deleteContact(ledger.contact.id);
                                  }
                                }
                              }}
                              className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-700 transition"
                              title="Delete Person Profile"
                            >
                              <Trash2 size={14} />
                            </button>
                            <div className="text-slate-300 hover:text-blue-600 transition">
                              <ChevronRight size={18} />
                            </div>
                          </div>
                        </div>

                        {/* Middle: Net Balance Banner */}
                        <div
                          className={`mt-4 rounded-xl p-3 border ${isReceivable
                              ? 'border-blue-200 bg-blue-50/70 text-blue-950'
                              : isPayable
                                ? 'border-slate-200 bg-slate-50 text-slate-900'
                                : 'border-slate-100 bg-slate-50/50 text-slate-500'
                            }`}
                        >
                          <div className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                            {isReceivable ? "You'll Get" : isPayable ? "You'll Give" : 'Net Balance'}
                          </div>
                          <div className="text-lg font-extrabold font-mono mt-0.5">
                            {isSettled
                              ? '₹0 (All Cleared)'
                              : formatCurrency(Math.abs(ledger.netBalance), profile.currencySymbol)}
                          </div>
                        </div>

                        {/* Stats Row */}
                        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] border-t border-slate-100 pt-2 text-slate-600">
                          <div>
                            <span className="text-slate-400">Total Lent:</span>{' '}
                            <strong>{formatCurrency(ledger.totalLent, profile.currencySymbol)}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400">Total Borrowed:</span>{' '}
                            <strong>{formatCurrency(ledger.totalBorrowed, profile.currencySymbol)}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-400">
                          {ledger.dues.length} dues • {ledger.transactions.length} entries
                        </span>
                        <span className="font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1">
                          View Ledger <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* View 2: Master Dues Table */}
        {mainView === 'MASTER_TABLE' && (
          <div className="space-y-4">
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button
                onClick={() => setMasterTab('ALL')}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${masterTab === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'
                  }`}
              >
                All ({dues.length})
              </button>
              <button
                onClick={() => setMasterTab('I_LENT')}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${masterTab === 'I_LENT' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'
                  }`}
              >
                I Lent ({dues.filter((d: PersonalDue) => d.type === 'I_LENT' && d.status === 'ACTIVE').length})
              </button>
              <button
                onClick={() => setMasterTab('I_BORROWED')}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${masterTab === 'I_BORROWED' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'
                  }`}
              >
                I Borrowed ({dues.filter((d: PersonalDue) => d.type === 'I_BORROWED' && d.status === 'ACTIVE').length})
              </button>
              <button
                onClick={() => setMasterTab('SETTLED')}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${masterTab === 'SETTLED' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'
                  }`}
              >
                Settled / Cleared
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Person Profile</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Original</th>
                    <th className="py-3 px-4 text-right">Remaining Due</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDues.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                        No dues recorded in this view.
                      </td>
                    </tr>
                  ) : (
                    filteredDues.map((d: PersonalDue) => {
                      const isLent = d.type === 'I_LENT';
                      const isSettled = d.status === 'SETTLED';

                      return (
                        <tr key={d.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-4 font-medium text-slate-900">
                            <button
                              onClick={() => setSelectedPersonId(d.personId || d.personName)}
                              className="font-bold text-slate-900 hover:text-blue-600 hover:underline text-left transition"
                            >
                              {d.personName}
                            </button>
                            {d.phone && (
                              <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                                <Phone size={10} /> {d.phone}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${isLent ? 'bg-blue-100 text-blue-900' : 'bg-slate-200 text-slate-800'
                                }`}
                            >
                              {isLent ? 'I Lent' : 'I Borrowed'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">{d.notes || '-'}</td>

                          <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">{d.dueDate}</td>

                          <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                            {formatCurrency(d.originalAmount, profile.currencySymbol)}
                          </td>

                          <td
                            className={`py-3.5 px-4 text-right font-bold font-mono ${isLent ? 'text-blue-700' : 'text-slate-900'
                              }`}
                          >
                            {formatCurrency(d.remainingAmount, profile.currencySymbol)}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${isSettled ? 'bg-blue-100 text-blue-800' : 'bg-blue-50 text-blue-700'
                                }`}
                            >
                              {d.status}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isSettled && (
                                <button
                                  onClick={() => handleOpenSettle(d)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-blue-700 transition"
                                >
                                  <DollarSign size={12} />
                                  <span>Settle</span>
                                </button>
                              )}
                              <button
                                onClick={() => setEditingDue(d)}
                                className="rounded p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                                title="Edit Due Entry"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Delete this due record?')) deleteDue(d.id);
                                }}
                                className="rounded p-1 text-slate-400 hover:text-slate-800 transition"
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: FULL PERSON PROFILE & DEDICATED LEDGER MODAL */}
      {/* ========================================================================= */}
      {selectedPersonId && activeSelectedLedger && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in select-none">
          <div className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl overflow-y-auto space-y-6 select-text">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 font-bold text-white text-base shadow-sm">
                  {activeSelectedLedger.personName
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">{activeSelectedLedger.personName}</h2>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                      Profile
                    </span>
                  </div>
                  {activeSelectedLedger.phone ? (
                    <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Phone size={12} /> {activeSelectedLedger.phone}
                      </span>
                      <a
                        href={`https://wa.me/${activeSelectedLedger.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 font-sans"
                      >
                        <MessageCircle size={12} /> WhatsApp
                      </a>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic">No phone number recorded</div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeSelectedLedger.contact && (
                  <button
                    type="button"
                    onClick={() => setEditingContact(activeSelectedLedger.contact)}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition"
                    title="Edit Profile"
                  >
                    <Edit2 size={13} />
                    <span>Edit Profile</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (
                      confirm(
                        `Delete profile for "${activeSelectedLedger.personName}"? This will remove this profile and all its associated dues.`
                      )
                    ) {
                      if (activeSelectedLedger.contact?.id) {
                        deleteContact(activeSelectedLedger.contact.id);
                      }
                      setSelectedPersonId(null);
                    }
                  }}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                  title="Delete Profile"
                >
                  <Trash2 size={13} />
                  <span>Delete Profile</span>
                </button>
                <button
                  onClick={() => setSelectedPersonId(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Net Balance Status Card */}
            <div
              className={`rounded-2xl p-5 border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${activeSelectedLedger.status === 'RECEIVABLE'
                  ? 'border-blue-200 bg-gradient-to-r from-blue-900 to-blue-800 text-white'
                  : activeSelectedLedger.status === 'PAYABLE'
                    ? 'border-slate-300 bg-slate-900 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-900'
                }`}
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                  Current Net Outstanding Balance
                </span>
                <div className="text-2xl font-extrabold font-mono mt-0.5">
                  {activeSelectedLedger.status === 'SETTLED'
                    ? `${formatCurrency(0, profile.currencySymbol)} (All Settled)`
                    : formatCurrency(Math.abs(activeSelectedLedger.netBalance), profile.currencySymbol)}
                </div>
                <div className="text-xs mt-1 opacity-90">
                  {activeSelectedLedger.status === 'RECEIVABLE' && `You will receive this money from ${activeSelectedLedger.personName}`}
                  {activeSelectedLedger.status === 'PAYABLE' && `You need to pay this amount to ${activeSelectedLedger.personName}`}
                  {activeSelectedLedger.status === 'SETTLED' && `All dues and loans with ${activeSelectedLedger.personName} are fully cleared`}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleOpenAddDueForPerson(activeSelectedLedger.contact?.id, 'I_LENT')}
                  className="rounded-xl bg-white/20 px-3 py-2 text-xs font-bold text-white hover:bg-white/30 backdrop-blur transition"
                >
                  + Lend (I Lent)
                </button>
                <button
                  onClick={() => handleOpenAddDueForPerson(activeSelectedLedger.contact?.id, 'I_BORROWED')}
                  className="rounded-xl bg-white/20 px-3 py-2 text-xs font-bold text-white hover:bg-white/30 backdrop-blur transition"
                >
                  + Borrow
                </button>
              </div>
            </div>

            {/* 3 Metric Cards */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Total Lent</div>
                <div className="text-base font-extrabold text-blue-900 font-mono mt-1">
                  {formatCurrency(activeSelectedLedger.totalLent, profile.currencySymbol)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Repaid: {formatCurrency(activeSelectedLedger.totalSettledLent, profile.currencySymbol)}</div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Total Borrowed</div>
                <div className="text-base font-extrabold text-slate-900 font-mono mt-1">
                  {formatCurrency(activeSelectedLedger.totalBorrowed, profile.currencySymbol)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Repaid: {formatCurrency(activeSelectedLedger.totalSettledBorrowed, profile.currencySymbol)}</div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Active Loans</div>
                <div className="text-base font-extrabold text-slate-900 font-mono mt-1">
                  {activeSelectedLedger.dues.filter((d: PersonalDue) => d.status === 'ACTIVE').length} Active
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">{activeSelectedLedger.dues.length} Total Loans</div>
              </div>
            </div>

            {/* Individual Dues & Loan Items */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Loan Records & Settlements ({activeSelectedLedger.dues.length})
                </h3>
                <button
                  onClick={() => handleOpenAddDueForPerson(activeSelectedLedger.contact?.id)}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  + Add New Due
                </button>
              </div>

              {activeSelectedLedger.dues.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 rounded-xl border border-dashed border-slate-200">
                  No loans recorded for this person yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {activeSelectedLedger.dues.map((d: PersonalDue) => {
                    const isLent = d.type === 'I_LENT';
                    const isSettled = d.status === 'SETTLED';

                    return (
                      <div
                        key={d.id}
                        className={`rounded-xl border p-3.5 flex items-center justify-between gap-3 text-xs transition ${isSettled ? 'border-slate-200 bg-slate-50/40 opacity-75' : 'border-blue-100 bg-white shadow-sm'
                          }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${isLent ? 'bg-blue-100 text-blue-900' : 'bg-slate-200 text-slate-800'
                                }`}
                            >
                              {isLent ? 'Money Lent (You gave)' : 'Money Borrowed (You took)'}
                            </span>
                            <span className="text-slate-400 font-mono text-[11px]">• Due: {d.dueDate}</span>
                            {isSettled && (
                              <span className="text-blue-700 font-bold text-[10px] flex items-center gap-0.5">
                                <CheckCircle2 size={11} /> Settled
                              </span>
                            )}
                          </div>
                          <div className="font-semibold text-slate-800">{d.notes || 'Personal loan/due entry'}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Original: {formatCurrency(d.originalAmount, profile.currencySymbol)} | Paid: {formatCurrency(d.paidAmount, profile.currencySymbol)} | Remaining:{' '}
                            <strong className={isLent ? 'text-blue-700' : 'text-slate-900'}>{formatCurrency(d.remainingAmount, profile.currencySymbol)}</strong>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {!isSettled && (
                            <button
                              onClick={() => handleOpenSettle(d)}
                              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
                            >
                              Settle
                            </button>
                          )}
                          <button
                            onClick={() => setEditingDue(d)}
                            className="rounded p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Edit Loan Entry"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this loan entry?')) deleteDue(d.id);
                            }}
                            className="rounded p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Linked Transactions History */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Linked Cashbook Transactions ({activeSelectedLedger.transactions.length})
              </h3>

              {activeSelectedLedger.transactions.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  No linked cashbook transactions found for this profile.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden text-xs">
                  {activeSelectedLedger.transactions.map((tx: PersonalTransaction) => (
                    <div key={tx.id} className="p-3 flex items-center justify-between hover:bg-slate-50/60 transition">
                      <div>
                        <div className="font-semibold text-slate-900">{tx.category}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {tx.date} • {tx.paymentMode || 'Online / UPI'} • {tx.notes || '-'}
                        </div>
                      </div>
                      <div
                        className={`font-mono font-bold ${tx.type === 'INCOME' ? 'text-blue-700' : 'text-slate-900'
                          }`}
                      >
                        {tx.type === 'INCOME' ? '+' : '-'}₹{tx.amount}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      `Are you sure you want to completely delete the person profile for "${activeSelectedLedger.personName}" along with all recorded dues?`
                    )
                  ) {
                    if (activeSelectedLedger.contact?.id) {
                      deleteContact(activeSelectedLedger.contact.id);
                    }
                    setSelectedPersonId(null);
                  }
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
              >
                <Trash2 size={14} />
                <span>Delete This Person Profile</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPersonId(null)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD PERSON PROFILE */}
      {/* ========================================================================= */}
      {isAddPersonOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in select-none">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 select-text">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Create New Person Profile</h3>
              <button
                onClick={() => setIsAddPersonOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePerson} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">Person Name *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Imran (Friend) or Rahul (Colleague)"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Mobile / Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 99461..."
                  value={newPersonPhone}
                  onChange={(e) => setNewPersonPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Notes / Relationship</label>
                <input
                  type="text"
                  placeholder="e.g. College roommate or Business partner"
                  value={newPersonNotes}
                  onChange={(e) => setNewPersonNotes(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddPersonOpen(false)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition active:scale-95"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RECORD LOAN / DUE ENTRY */}
      {/* ========================================================================= */}
      {isAddDueOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in select-none">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 select-text">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Record Loan / Due Entry</h3>
              <button
                onClick={() => setIsAddDueOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDue} className="space-y-3.5 text-xs">
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

              <div>
                <label className="block font-semibold text-slate-700">Select Person Profile *</label>
                <select
                  value={dueTargetPersonId}
                  onChange={(e) => setDueTargetPersonId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs focus:border-blue-600 focus:outline-none"
                >
                  {contacts.map((c: PersonContact) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="5000"
                    value={dueAmount}
                    onChange={(e) => setDueAmount(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold focus:border-blue-600 focus:outline-none"
                  />
                </div>
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
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Reason / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Trip hotel advance split or Urgent help"
                  value={dueNotes}
                  onChange={(e) => setDueNotes(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddDueOpen(false)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition active:scale-95"
                >
                  Save Due Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: SETTLE / REPAYMENT MODAL */}
      {/* ========================================================================= */}
      {isSettleOpen && selectedDue && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in select-none">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 select-text">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Record Settlement / Repayment</h3>
              <button
                onClick={() => setIsSettleOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              {selectedDue.type === 'I_LENT' ? 'Receiving repayment from' : 'Paying money back to'}{' '}
              <strong>{selectedDue.personName}</strong> (Outstanding: ₹{selectedDue.remainingAmount})
            </p>

            <form onSubmit={handleConfirmSettle} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">Settlement Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-base font-bold focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Payment Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Received via GPay / Cash"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSettleOpen(false)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition active:scale-95"
                >
                  Confirm Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Due Modal */}
      <EditDueModal
        isOpen={!!editingDue}
        due={editingDue}
        onClose={() => setEditingDue(null)}
      />

      {/* Edit Contact Modal */}
      <EditContactModal
        isOpen={!!editingContact}
        contact={editingContact}
        onClose={() => setEditingContact(null)}
      />
    </div>
  );
}

