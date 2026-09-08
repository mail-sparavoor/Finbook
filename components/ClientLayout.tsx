"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import QuickAddModal from './modals/QuickAddModal';
import GlobalSearchModal from './modals/GlobalSearchModal';
import { BookOpen } from 'lucide-react';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isLoading } = useAuth();

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddTab, setQuickAddTab] = useState<'EXPENSE' | 'INCOME' | 'DUE'>('EXPENSE');
  const [searchOpen, setSearchOpen] = useState(false);

  const handleOpenQuickAdd = (tab: 'EXPENSE' | 'INCOME' | 'DUE' = 'EXPENSE') => {
    setQuickAddTab(tab);
    setQuickAddOpen(true);
  };

  // Auth & Role Guard
  useEffect(() => {
    if (!isLoading) {
      if (!currentUser) {
        if (pathname !== '/login') {
          router.replace('/login');
        }
        return;
      }

      if (currentUser) {
        if (currentUser.role === 'ADMIN') {
          // Admin only has access to User Account Management
          if (pathname !== '/admin/users') {
            router.replace('/admin/users');
          }
        } else if (currentUser.role === 'USER') {
          // Standard User cannot access Admin routes or login page
          if (pathname.startsWith('/admin') || pathname === '/login') {
            router.replace('/dashboard');
          }
        }
      }
    }
  }, [currentUser, isLoading, pathname, router]);

  // Global search shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Loading state (shows clean splash while determining authentication)
  if (isLoading || (currentUser && pathname === '/login')) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-500 space-y-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
          Loading FinBook...
        </div>
      </div>
    );
  }

  // If unauthenticated on /login page, render clean standalone view
  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-50 text-slate-900 antialiased">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 w-full pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        <Header
          onOpenQuickAdd={handleOpenQuickAdd}
          onOpenSearch={() => setSearchOpen(true)}
        />
        <main className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Bar */}
      <MobileNav onOpenQuickAdd={handleOpenQuickAdd} />

      {/* Modals */}
      <QuickAddModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        defaultTab={quickAddTab}
      />
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
}
