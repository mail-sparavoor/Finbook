"use client";

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { UserAccount, UserRole, UserStatus } from '@/lib/types';
import {
  Shield,
  UserPlus,
  Users,
  Search,
  KeyRound,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  Mail,
  User,
  Power,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminUsersPage() {
  const {
    currentUser,
    users,
    createUserAccount,
    updateUserAccount,
    deleteUserAccount,
  } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'USER' | 'DISABLED'>('ALL');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);

  // New User Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('USER');
  const [newCurrency, setNewCurrency] = useState('INR');
  const [newCurrencySymbol, setNewCurrencySymbol] = useState('₹');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Edit User Form State
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('USER');
  const [editStatus, setEditStatus] = useState<UserStatus>('ACTIVE');

  // Reset Password State
  const [resetPassValue, setResetPassValue] = useState('');

  const safeUsers = Array.isArray(users) ? users : [];

  // Filtered Users List (Must be declared before any conditional return)
  const filteredUsers = useMemo(() => {
    return safeUsers.filter((u) => {
      if (roleFilter === 'ADMIN' && u.role !== 'ADMIN') return false;
      if (roleFilter === 'USER' && u.role !== 'USER') return false;
      if (roleFilter === 'DISABLED' && u.status !== 'DISABLED') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      }
      return true;
    });
  }, [safeUsers, roleFilter, searchQuery]);

  // Metric counts
  const totalCount = safeUsers.length;
  const activeCount = safeUsers.filter((u) => u.status === 'ACTIVE').length;
  const adminCount = safeUsers.filter((u) => u.role === 'ADMIN').length;
  const standardCount = safeUsers.filter((u) => u.role === 'USER').length;

  // Access Control: Only Admins can access
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <div className="h-16 w-16 bg-blue-50 text-blue-900 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <Shield size={32} />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Administrator Privileges Required</h2>
        <p className="text-xs text-slate-500">
          You are currently signed in as <strong>{currentUser?.name || 'Standard User'}</strong> ({currentUser?.role || 'USER'}). Only system administrators can view and manage user accounts.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
        >
          <span>Return to Dashboard</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  // Handlers
  const handleOpenCreate = () => {
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setNewRole('USER');
    setNewCurrency('INR');
    setNewCurrencySymbol('₹');
    setFormError(null);
    setFormSuccess(null);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const result = await createUserAccount({
      name: newName,
      email: newEmail,
      password: newPassword,
      role: newRole,
      currency: newCurrency,
      currencySymbol: newCurrencySymbol,
    });

    if (result.success) {
      setIsCreateOpen(false);
      setFormSuccess(`User account created successfully for "${newName}".`);
      setTimeout(() => setFormSuccess(null), 4000);
    } else {
      setFormError(result.error || 'Failed to create user.');
    }
  };

  const handleOpenEdit = (u: UserAccount) => {
    setSelectedUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditStatus(u.status);
    setFormError(null);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setFormError(null);

    const result = await updateUserAccount(selectedUser.id, {
      name: editName,
      email: editEmail,
      role: editRole,
      status: editStatus,
    });

    if (result.success) {
      setIsEditOpen(false);
      setSelectedUser(null);
      setFormSuccess(`Updated account details for "${editName}".`);
      setTimeout(() => setFormSuccess(null), 4000);
    } else {
      setFormError(result.error || 'Failed to update user.');
    }
  };

  const handleOpenPasswordReset = (u: UserAccount) => {
    setSelectedUser(u);
    setResetPassValue('');
    setFormError(null);
    setIsPasswordResetOpen(true);
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !resetPassValue.trim()) return;

    const result = await updateUserAccount(selectedUser.id, {
      password: resetPassValue.trim(),
    });

    if (result.success) {
      setIsPasswordResetOpen(false);
      setSelectedUser(null);
      setFormSuccess(`Password successfully updated for "${selectedUser.name}".`);
      setTimeout(() => setFormSuccess(null), 4000);
    } else {
      setFormError(result.error || 'Failed to reset password.');
    }
  };

  const handleToggleStatus = async (u: UserAccount) => {
    if (!currentUser) return;
    if (u.id === currentUser.id) {
      alert('You cannot deactivate your own currently active Admin account.');
      return;
    }
    const newStatus: UserStatus = u.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    await updateUserAccount(u.id, { status: newStatus });
  };

  const handleDelete = async (u: UserAccount) => {
    if (confirm(`Are you sure you want to permanently delete the account for "${u.name}" (${u.email})?`)) {
      const res = await deleteUserAccount(u.id);
      if (!res.success) {
        alert(res.error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">User Account Management</h1>
            <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-900">
              <Shield size={10} /> Admin Only
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Create, manage, and configure login accounts and roles for all users
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition active:scale-95"
        >
          <UserPlus size={14} />
          <span>+ Create New User</span>
        </button>
      </div>

      {/* Success Notification */}
      {formSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-950 shadow-sm animate-in fade-in">
          <CheckCircle2 size={16} className="text-blue-700 shrink-0" />
          <span>{formSuccess}</span>
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Users</div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">{totalCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">System accounts</div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-blue-900">Active Accounts</div>
          <div className="text-2xl font-extrabold text-blue-950 font-mono mt-1">{activeCount}</div>
          <div className="text-[10px] text-blue-800 mt-1">Ready to log in</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400">Administrators</div>
          <div className="text-2xl font-extrabold text-blue-900 font-mono mt-1">{adminCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Full access rights</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400">Standard Users</div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">{standardCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Personal accounts</div>
        </div>
      </div>

      {/* Users Ledger Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Role Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              onClick={() => setRoleFilter('ALL')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                roleFilter === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Users ({totalCount})
            </button>
            <button
              onClick={() => setRoleFilter('ADMIN')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                roleFilter === 'ADMIN' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admins ({adminCount})
            </button>
            <button
              onClick={() => setRoleFilter('USER')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                roleFilter === 'USER' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Standard Users ({standardCount})
            </button>
            <button
              onClick={() => setRoleFilter('DISABLED')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                roleFilter === 'DISABLED' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Deactivated
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs focus:border-blue-600 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">User Profile</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Currency</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                    No user accounts match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = currentUser.id === u.id;
                  const initials = u.name
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold text-xs shadow-sm ${
                            u.role === 'ADMIN' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{u.name}</span>
                              {isCurrent && (
                                <span className="rounded bg-blue-100 px-1.5 py-0.2 text-[9px] font-bold text-blue-900">
                                  You (Active Session)
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            u.role === 'ADMIN'
                              ? 'bg-blue-100 text-blue-900'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.role === 'ADMIN' && <Shield size={10} />}
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            u.status === 'ACTIVE'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              u.status === 'ACTIVE' ? 'bg-blue-600' : 'bg-slate-400'
                            }`}
                          />
                          {u.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {u.currencySymbol} ({u.currency})
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition"
                            title="Edit Account"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleOpenPasswordReset(u)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition"
                            title="Reset Password"
                          >
                            <KeyRound size={13} />
                          </button>
                          {!isCurrent && (
                            <>
                              <button
                                onClick={() => handleToggleStatus(u)}
                                className={`rounded-lg p-1.5 transition ${
                                  u.status === 'ACTIVE'
                                    ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-800'
                                    : 'text-blue-600 hover:bg-blue-50'
                                }`}
                                title={u.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
                              >
                                <Power size={13} />
                              </button>
                              <button
                                onClick={() => handleDelete(u)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition"
                                title="Delete Account"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
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

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE NEW USER */}
      {/* ========================================================================= */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <UserPlus size={16} />
                </div>
                <h3 className="text-base font-bold text-slate-900">Create New User Account</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="flex items-start gap-2 rounded-lg bg-slate-100 p-2.5 text-xs text-slate-800">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-blue-700" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. John Doe"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email / Login ID *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Account Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs focus:border-blue-600 focus:outline-none"
                  >
                    <option value="USER">Standard User</option>
                    <option value="ADMIN">System Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Currency Symbol</label>
                  <select
                    value={newCurrencySymbol}
                    onChange={(e) => {
                      setNewCurrencySymbol(e.target.value);
                      if (e.target.value === '₹') setNewCurrency('INR');
                      if (e.target.value === '$') setNewCurrency('USD');
                      if (e.target.value === '€') setNewCurrency('EUR');
                      if (e.target.value === '£') setNewCurrency('GBP');
                      if (e.target.value === 'AED') setNewCurrency('AED');
                    }}
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs focus:border-blue-600 focus:outline-none"
                  >
                    <option value="₹">₹ (INR - Indian Rupee)</option>
                    <option value="$">$ (USD - US Dollar)</option>
                    <option value="€">€ (EUR - Euro)</option>
                    <option value="£">£ (GBP - British Pound)</option>
                    <option value="AED">AED (UAE Dirham)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition active:scale-95"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT USER */}
      {/* ========================================================================= */}
      {isEditOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Edit User Details</h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="flex items-start gap-2 rounded-lg bg-slate-100 p-2.5 text-xs text-slate-800">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-blue-700" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email / Login ID</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs focus:border-blue-600 focus:outline-none"
                  >
                    <option value="USER">Standard User</option>
                    <option value="ADMIN">System Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as UserStatus)}
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs focus:border-blue-600 focus:outline-none"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="DISABLED">Deactivated</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RESET PASSWORD */}
      {/* ========================================================================= */}
      {isPasswordResetOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Reset User Password</h3>
              <button
                onClick={() => setIsPasswordResetOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Set a new password for <strong>{selectedUser.name}</strong> ({selectedUser.email}):
            </p>

            {formError && (
              <div className="flex items-start gap-2 rounded-lg bg-slate-100 p-2.5 text-xs text-slate-800">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-blue-700" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordResetSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Password</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Enter new password"
                  value={resetPassValue}
                  onChange={(e) => setResetPassValue(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordResetOpen(false)}
                  className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
                >
                  Confirm Password Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
