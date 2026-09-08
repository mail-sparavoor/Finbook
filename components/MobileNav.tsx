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
  FileText,
} from 'lucide-react';

interface MobileNavProps {
  onOpenQuickAdd: (tab?: 'EXPENSE' | 'INCOME' | 'DUE') => void;
}

export default function MobileNav({ onOpenQuickAdd }: MobileNavProps) {
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();

  if (currentUser?.role === 'ADMIN') {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 z-40 flex h-[calc(4rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] w-full items-center justify-around border-t border-slate-200/80 bg-white/95 px-4 backdrop-blur-md shadow-lg no-print select-none">
        <Link
          href="/admin/users"
          className="flex flex-col items-center gap-1 text-[11px] font-bold text-blue-600 active:scale-95 transition"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Shield size={18} />
          </div>
          <span>User Accounts</span>
        </Link>
        <button
          onClick={logout}
          className="flex flex-col items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-900 active:scale-95 transition"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400">
            <LogOut size={18} />
          </div>
          <span>Sign Out</span>
        </button>
      </nav>
    );
  }

  const navLinks = [
    {
      title: 'Home',
      href: '/dashboard',
      icon: LayoutDashboard,
      isActive: pathname === '/dashboard',
    },
    {
      title: 'Txns',
      href: '/transactions',
      icon: ArrowLeftRight,
      isActive: pathname.startsWith('/transactions'),
    },
    {
      title: 'Dues',
      href: '/dues',
      icon: CreditCard,
      isActive: pathname.startsWith('/dues'),
    },
    {
      title: 'Budgets',
      href: '/budgets',
      icon: PieChart,
      isActive: pathname.startsWith('/budgets'),
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 z-40 flex h-[calc(4rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] w-full items-center justify-between border-t border-slate-200/80 bg-white/95 px-3 backdrop-blur-md shadow-lg no-print select-none">
      {/* 1. Home */}
      <Link
        href={navLinks[0].href}
        className={`flex flex-1 flex-col items-center justify-center py-1 transition active:scale-95 ${
          navLinks[0].isActive ? 'text-blue-600 font-bold' : 'text-slate-500 font-medium'
        }`}
      >
        <LayoutDashboard size={20} className={navLinks[0].isActive ? 'text-blue-600 stroke-[2.5]' : 'text-slate-400'} />
        <span className="text-[10px] mt-0.5 tracking-tight">{navLinks[0].title}</span>
      </Link>

      {/* 2. Transactions */}
      <Link
        href={navLinks[1].href}
        className={`flex flex-1 flex-col items-center justify-center py-1 transition active:scale-95 ${
          navLinks[1].isActive ? 'text-blue-600 font-bold' : 'text-slate-500 font-medium'
        }`}
      >
        <ArrowLeftRight size={20} className={navLinks[1].isActive ? 'text-blue-600 stroke-[2.5]' : 'text-slate-400'} />
        <span className="text-[10px] mt-0.5 tracking-tight">{navLinks[1].title}</span>
      </Link>

      {/* 3. Center Floating Quick Add Action */}
      <div className="flex flex-1 justify-center -translate-y-3.5">
        <button
          onClick={() => onOpenQuickAdd('EXPENSE')}
          aria-label="Add Transaction or Due"
          className="flex h-13 w-13 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/35 active:scale-90 active:bg-blue-700 transition"
        >
          <Plus size={24} className="stroke-[3]" />
        </button>
      </div>

      {/* 4. Dues */}
      <Link
        href={navLinks[2].href}
        className={`flex flex-1 flex-col items-center justify-center py-1 transition active:scale-95 ${
          navLinks[2].isActive ? 'text-blue-600 font-bold' : 'text-slate-500 font-medium'
        }`}
      >
        <CreditCard size={20} className={navLinks[2].isActive ? 'text-blue-600 stroke-[2.5]' : 'text-slate-400'} />
        <span className="text-[10px] mt-0.5 tracking-tight">{navLinks[2].title}</span>
      </Link>

      {/* 5. Budgets */}
      <Link
        href={navLinks[3].href}
        className={`flex flex-1 flex-col items-center justify-center py-1 transition active:scale-95 ${
          navLinks[3].isActive ? 'text-blue-600 font-bold' : 'text-slate-500 font-medium'
        }`}
      >
        <PieChart size={20} className={navLinks[3].isActive ? 'text-blue-600 stroke-[2.5]' : 'text-slate-400'} />
        <span className="text-[10px] mt-0.5 tracking-tight">{navLinks[3].title}</span>
      </Link>
    </nav>
  );
}
