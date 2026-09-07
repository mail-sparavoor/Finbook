"use client";

import React, { useState, useRef, useEffect } from 'react';
import { usePersonalFinance } from '@/lib/personal-context';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency } from '@/lib/finance-math';
import {
  Search,
  Plus,
  Shield,
  User,
  LogOut,
  ChevronDown,
  Settings,
  Users,
  Check,
} from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  onOpenQuickAdd: () => void;
  onOpenSearch: () => void;
}

export default function Header({ onOpenQuickAdd, onOpenSearch }: HeaderProps) {
  const { profile, metrics } = usePersonalFinance();
  const { currentUser, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isAdmin = currentUser?.role === 'ADMIN';

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <header className="sticky top-0 z-30 flex min-h-16 h-[calc(4rem+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-3.5 sm:px-6 backdrop-blur-md no-print select-none">
      {/* Left: Brand / Profile Info & Search */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/90 px-2.5 sm:px-3 py-1.5 shadow-2xs">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs shadow-sm">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser?.name || profile.name}
              </span>
              {isAdmin && (
                <span className="flex items-center gap-0.5 rounded bg-blue-100 px-1 py-0.2 text-[9px] font-bold text-blue-900">
                  <Shield size={8} /> Admin
                </span>
              )}
            </div>
            {isAdmin ? (
              <div className="text-[10px] text-blue-700 font-medium">
                System Administration
              </div>
            ) : (
              <div className="text-[10px] text-blue-700 font-medium font-mono">
                Net: {formatCurrency(metrics.totalNetWorth, profile.currencySymbol)}
              </div>
            )}
          </div>
        </div>

        {/* Global Search trigger (User only) */}
        {!isAdmin && (
          <button
            onClick={onOpenSearch}
            className="hidden md:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs text-slate-500 transition hover:border-blue-300 hover:bg-white w-60 justify-between"
          >
            <div className="flex items-center gap-2">
              <Search size={14} className="text-slate-400" />
              <span>Search expenses, dues...</span>
            </div>
            <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
              ⌘K
            </kbd>
          </button>
        )}
      </div>

      {/* Right: Quick Actions & User Menu */}
      <div className="flex items-center gap-2.5">
        {/* Quick Month Metrics (User only) */}
        {!isAdmin && (
          <div className="hidden lg:flex items-center gap-3 text-xs border-r border-slate-200 pr-3 mr-1">
            <div className="flex items-center gap-1 text-slate-600">
              <span className="text-[10px] text-slate-400 uppercase font-bold">In:</span>
              <span className="font-bold font-mono text-blue-700">+{formatCurrency(metrics.monthlyIncome, profile.currencySymbol)}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-600">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Out:</span>
              <span className="font-bold font-mono text-slate-900">-{formatCurrency(metrics.monthlyExpenses, profile.currencySymbol)}</span>
            </div>
          </div>
        )}

        {/* Global + Add Button (User only) */}
        {!isAdmin && (
          <button
            onClick={onOpenQuickAdd}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
          >
            <Plus size={15} />
            <span>Add Entry</span>
          </button>
        )}

        {/* User Account Menu Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 p-1.5 text-xs font-semibold text-slate-700 hover:bg-white hover:border-blue-300 transition"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-[10px]">
              {initials}
            </div>
            <ChevronDown size={13} className="text-slate-400" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl space-y-1 z-50 text-xs animate-in fade-in zoom-in-95">
              {/* User Profile Card */}
              <div className="p-3 border-b border-slate-100 bg-slate-50/70 rounded-xl mb-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 truncate">{currentUser?.name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    isAdmin ? 'bg-blue-100 text-blue-900' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {currentUser?.role}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                  {currentUser?.email}
                </div>
              </div>

              {/* Navigation Options */}
              {isAdmin ? (
                <Link
                  href="/admin/users"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-blue-900 bg-blue-50/60 font-semibold transition"
                >
                  <Shield size={14} className="text-blue-600" />
                  <span>User Management</span>
                </Link>
              ) : (
                <Link
                  href="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition font-semibold"
                >
                  <Settings size={14} className="text-slate-400" />
                  <span>Account Settings</span>
                </Link>
              )}

              {/* Sign Out */}
              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition font-semibold"
                >
                  <LogOut size={14} className="text-slate-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
