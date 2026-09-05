"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Plus,
  CreditCard,
  PieChart,
  Shield,
  LogOut,
} from 'lucide-react';

interface MobileNavProps {
  onOpenQuickAdd: () => void;
}

export default function MobileNav({ onOpenQuickAdd }: MobileNavProps) {
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();

  if (currentUser?.role === 'ADMIN') {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 z-40 flex h-16 w-full items-center justify-around border-t border-slate-200 bg-white/95 px-4 backdrop-blur shadow-lg no-print">
        <Link
          href="/admin/users"
          className="flex flex-col items-center gap-1 text-[11px] font-semibold text-blue-600"
        >
          <Shield size={20} />
          <span>User Management</span>
        </Link>
        <button
          onClick={logout}
          className="flex flex-col items-center gap-1 text-[11px] font-semibold text-slate-500"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </nav>
    );
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 z-40 flex h-16 w-full items-center justify-around border-t border-slate-200 bg-white/95 px-2 backdrop-blur shadow-lg no-print">
      <Link
        href="/dashboard"
        className={`flex flex-col items-center gap-1 text-[11px] font-semibold ${
          pathname === '/dashboard' ? 'text-blue-600' : 'text-slate-500'
        }`}
      >
        <LayoutDashboard size={20} />
        <span>Home</span>
      </Link>

      <Link
        href="/transactions"
        className={`flex flex-col items-center gap-1 text-[11px] font-semibold ${
          pathname.startsWith('/transactions') ? 'text-blue-600' : 'text-slate-500'
        }`}
      >
        <ArrowLeftRight size={20} />
        <span>Txns</span>
      </Link>

      {/* Floating Center Button */}
      <button
        onClick={onOpenQuickAdd}
        className="flex h-12 w-12 -translate-y-3 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/40 active:scale-95 transition"
      >
        <Plus size={24} className="stroke-[2.5]" />
      </button>

      <Link
        href="/dues"
        className={`flex flex-col items-center gap-1 text-[11px] font-semibold ${
          pathname.startsWith('/dues') ? 'text-blue-600' : 'text-slate-500'
        }`}
      >
        <CreditCard size={20} />
        <span>Dues</span>
      </Link>

      <Link
        href="/budgets"
        className={`flex flex-col items-center gap-1 text-[11px] font-semibold ${
          pathname.startsWith('/budgets') ? 'text-blue-600' : 'text-slate-500'
        }`}
      >
        <PieChart size={20} />
        <span>Budgets</span>
      </Link>
    </nav>
  );
}
