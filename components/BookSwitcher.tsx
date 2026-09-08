"use client";

import React, { useState, useRef, useEffect } from 'react';
import { usePersonalFinance } from '@/lib/personal-context';
import { PersonalBook } from '@/lib/types';
import { BookOpen, Check, ChevronDown, Plus, Settings2 } from 'lucide-react';
import BookModal from './modals/BookModal';

interface BookSwitcherProps {
  compact?: boolean;
}

export default function BookSwitcher({ compact = false }: BookSwitcherProps) {
  const { books, currentBook, switchBook } = usePersonalFinance();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<PersonalBook | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleOpenCreate = () => {
    setEditingBook(null);
    setDropdownOpen(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (book: PersonalBook, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBook(book);
    setDropdownOpen(false);
    setModalOpen(true);
  };

  const activeColor = currentBook?.color || '#2563eb';
  const activeName = currentBook?.name || 'Personal Book';
  const activeCurrency = currentBook?.currencySymbol || '₹';

  return (
    <div className="relative" ref={containerRef}>
      {/* Switcher Button */}
      <button
        type="button"
        onClick={() => setDropdownOpen((prev) => !prev)}
        className={`flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 hover:border-slate-300 transition shadow-2xs ${
          compact ? 'max-w-[140px] sm:max-w-none' : 'w-full justify-between'
        }`}
        title={`Active Book: ${activeName}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-white text-[10px] font-bold shadow-2xs"
            style={{ backgroundColor: activeColor }}
          >
            <BookOpen size={11} className="stroke-[2.5]" />
          </div>
          <span className="truncate font-bold text-slate-900">{activeName}</span>
          <span className="shrink-0 rounded bg-white px-1 py-0.2 text-[10px] font-bold text-slate-500 border border-slate-200">
            {activeCurrency}
          </span>
        </div>
        <ChevronDown size={14} className="shrink-0 text-slate-400" />
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className={`absolute ${compact ? 'right-0 sm:left-0' : 'left-0'} top-full mt-1.5 z-50 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl animate-in fade-in zoom-in-95`}>
          <div className="px-2.5 py-1.5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              My Books & Ledgers
            </span>
            <span className="text-[11px] font-semibold text-blue-600">
              {books.length} {books.length === 1 ? 'Book' : 'Books'}
            </span>
          </div>

          <div className="mt-1 max-h-56 overflow-y-auto space-y-0.5">
            {books.map((b) => {
              const isSelected = currentBook?.id === b.id;
              return (
                <div
                  key={b.id}
                  onClick={() => {
                    switchBook(b.id);
                    setDropdownOpen(false);
                  }}
                  className={`group flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold cursor-pointer transition ${
                    isSelected ? 'bg-blue-50/80 text-blue-900' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: b.color || '#2563eb' }}
                    />
                    <div className="truncate">
                      <div className="truncate font-bold leading-tight">{b.name}</div>
                      {b.description && (
                        <div className="text-[10px] font-normal text-slate-400 truncate">
                          {b.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {b.currencySymbol}
                    </span>
                    {isSelected && <Check size={14} className="text-blue-600 stroke-[3]" />}
                    <button
                      type="button"
                      onClick={(e) => handleOpenEdit(b, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                      title="Edit Book"
                    >
                      <Settings2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add New Book Button */}
          <div className="mt-1.5 border-t border-slate-100 pt-1.5">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-50/70 hover:bg-blue-100/70 px-3 py-2 text-xs font-bold text-blue-700 transition"
            >
              <Plus size={14} className="stroke-[2.5]" />
              Create New Book
            </button>
          </div>
        </div>
      )}

      {/* Book Modal */}
      <BookModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingBook={editingBook}
      />
    </div>
  );
}
