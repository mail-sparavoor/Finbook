"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePersonalFinance } from '@/lib/personal-context';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency } from '@/lib/finance-math';
import { PersonalDue } from '@/lib/types';
import {
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  PieChart,
  FileText,
  Settings,
  BookOpen,
  Shield,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, metrics, dues } = usePersonalFinance();
  const { currentUser, logout } = useAuth();

  const isAdmin = currentUser?.role === 'ADMIN';
  const activeDuesCount = dues.filter((d: PersonalDue) => d.status === 'ACTIVE').length;

  const userNavItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Transactions',
      href: '/transactions',
      icon: ArrowLeftRight,
    },
    {
      title: 'Dues & Loans',
      href: '/dues',
      icon: CreditCard,
      badge: activeDuesCount > 0 ? activeDuesCount : undefined,
    },
    {
      title: 'Monthly Budgets',
      href: '/budgets',
      icon: PieChart,
    },
    {
      title: 'Statements & Export',
      href: '/reports',
      icon: FileText,
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: Settings,
    },
  ];

  const adminNavItems = [
    {
      title: 'User Management',
      href: '/admin/users',
      icon: Shield,
      badge: 'Admin Only',
    },
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <aside className="hidden md:flex flex-col w-60 border-r border-slate-200 bg-white min-h-screen text-slate-700 select-none no-print">
      {/* Brand Logo */}
      <div className="flex h-16 items-center gap-2.5 px-6 border-b border-slate-200">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
          <BookOpen size={18} className="stroke-[2.5]" />
        </div>
        <div>
          <div className="text-base font-bold tracking-tight text-slate-900">
            Fin<span className="text-blue-600">Book</span>
          </div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            {isAdmin ? 'System Admin' : 'Personal Finance'}
          </div>
        </div>
      </div>

      {/* Nav Link List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.title}
              href={item.href}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <item.icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span>{item.title}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-white text-blue-700' : 'bg-blue-100 text-blue-800'}`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom Card */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/50">
        {isAdmin ? (
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 shadow-sm space-y-2">
            <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
              <Shield size={14} />
              <span>Admin Console</span>
            </div>
            <p className="text-[11px] text-blue-950 leading-relaxed">
              Managing user accounts and system access.
            </p>
            <button
              onClick={logout}
              className="w-full mt-1 rounded-lg border border-blue-200 bg-white py-1.5 text-[11px] font-bold text-blue-900 hover:bg-blue-50 transition"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-blue-100 bg-white p-3 shadow-sm">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Net Balance</div>
            <div className="text-sm font-extrabold text-blue-900 mt-0.5 font-mono">
              {formatCurrency(metrics.totalNetWorth, profile.currencySymbol)}
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex justify-between border-t border-slate-100 pt-1.5">
              <span>Saved: {metrics.savingsRate}%</span>
              <span className="text-blue-700 font-bold">This Month</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function usePersonalFinanceSafe() {
  try {
    return usePersonalFinance();
  } catch {
    return {
      profile: { name: 'Personal User', currencySymbol: '₹' },
      metrics: { totalNetWorth: 0, savingsRate: 0 },
      dues: [],
    };
  }
}
