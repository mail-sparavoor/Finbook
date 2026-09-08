"use client";

import React, { useState, useEffect } from 'react';
import { usePersonalFinance } from '@/lib/personal-context';
import { PersonalBook } from '@/lib/types';
import {
  User,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Plus,
  Settings2,
  Check,
  Tag,
  Edit2,
  Trash2,
  FolderPlus,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import BookModal from '@/components/modals/BookModal';
import { UserCategory } from '@/lib/types';

export default function PersonalSettingsPage() {
  const {
    profile,
    updateProfile,
    books,
    currentBook,
    switchBook,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    transactions,
  } = usePersonalFinance();

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

  // Category Management state
  const [activeCategoryTab, setActiveCategoryTab] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#ef4444');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [editingCatColor, setEditingCatColor] = useState('');
  const [categoryMsg, setCategoryMsg] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);

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

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryError(null);
    if (!newCatName.trim()) return;

    try {
      const added = await addCategory(activeCategoryTab, newCatName.trim(), newCatColor);
      if (added) {
        setNewCatName('');
        setIsAddingCategory(false);
        setCategoryMsg(`Added "${added}" to ${activeCategoryTab === 'EXPENSE' ? 'Expense' : 'Income'} categories!`);
        setTimeout(() => setCategoryMsg(null), 3000);
      } else {
        setCategoryError('Failed to add category or category already exists.');
      }
    } catch (err: any) {
      setCategoryError(err.message || 'Error adding category');
    }
  };

  const handleStartEditCategory = (cat: UserCategory) => {
    setEditingCategoryId(cat.id);
    setEditingCatName(cat.name);
    setEditingCatColor(cat.color || (cat.type === 'EXPENSE' ? '#ef4444' : '#10b981'));
  };

  const handleSaveEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryError(null);
    if (!editingCategoryId || !editingCatName.trim()) return;

    try {
      const res = await updateCategory(editingCategoryId, editingCatName.trim(), editingCatColor);
      if (res.success) {
        setEditingCategoryId(null);
        setEditingCatName('');
        setCategoryMsg('Category updated successfully!');
        setTimeout(() => setCategoryMsg(null), 3000);
      } else {
        setCategoryError(res.error || 'Failed to update category.');
      }
    } catch (err: any) {
      setCategoryError(err.message || 'Error updating category');
    }
  };

  const handleDeleteCategory = async (cat: UserCategory) => {
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;
    setCategoryError(null);
    try {
      const res = await deleteCategory(cat.id);
      if (res.success) {
        setCategoryMsg(`Deleted category "${cat.name}".`);
        setTimeout(() => setCategoryMsg(null), 3000);
      } else {
        setCategoryError(res.error || 'Failed to delete category.');
      }
    } catch (err: any) {
      setCategoryError(err.message || 'Error deleting category');
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

  const filteredCategories = categories.filter((c) => c.type === activeCategoryTab);
  const COLOR_PALETTE = ['#ef4444', '#10b981', '#2563eb', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#475569'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Personal Settings & Books</h1>
          <p className="text-xs text-slate-500">Configure your profile and manage multiple books/ledgers</p>
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

      {/* Category Management Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <Tag size={16} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Custom Categories</h2>
              <p className="text-xs text-slate-500">Create, edit, or delete categories specific to your account</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsAddingCategory(!isAddingCategory);
              setNewCatColor(activeCategoryTab === 'EXPENSE' ? '#ef4444' : '#10b981');
            }}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition active:scale-95 self-start sm:self-auto"
          >
            <Plus size={14} className="stroke-[2.5]" />
            <span>{isAddingCategory ? 'Cancel' : `Add ${activeCategoryTab === 'EXPENSE' ? 'Expense' : 'Income'} Category`}</span>
          </button>
        </div>

        {categoryMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs font-bold text-blue-900 animate-in fade-in">
            <CheckCircle2 size={15} className="text-blue-600 shrink-0" />
            <span>{categoryMsg}</span>
          </div>
        )}

        {categoryError && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800 animate-in fade-in">
            <AlertCircle size={15} className="text-red-600 shrink-0" />
            <span>{categoryError}</span>
          </div>
        )}

        {/* Tabs: Expense Categories vs Income Categories */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 w-full sm:w-80">
          <button
            type="button"
            onClick={() => {
              setActiveCategoryTab('EXPENSE');
              setIsAddingCategory(false);
              setEditingCategoryId(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition ${
              activeCategoryTab === 'EXPENSE' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingDown size={13} />
            <span>Expense ({categories.filter((c) => c.type === 'EXPENSE').length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveCategoryTab('INCOME');
              setIsAddingCategory(false);
              setEditingCategoryId(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition ${
              activeCategoryTab === 'INCOME' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp size={13} />
            <span>Income ({categories.filter((c) => c.type === 'INCOME').length})</span>
          </button>
        </div>

        {/* Add Category Form */}
        {isAddingCategory && (
          <form onSubmit={handleCreateCategory} className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 space-y-3.5 animate-in fade-in">
            <div className="text-xs font-bold text-blue-950">
              Create New {activeCategoryTab === 'EXPENSE' ? 'Expense' : 'Income'} Category
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder={activeCategoryTab === 'EXPENSE' ? 'e.g. Groceries, Fuel, Netflix, Dining...' : 'e.g. Salary, Side Gig, Dividends, Rental...'}
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Theme Color</label>
                <div className="flex items-center gap-1.5 pt-1">
                  {COLOR_PALETTE.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setNewCatColor(hex)}
                      className={`h-6 w-6 rounded-full transition transform ${
                        newCatColor === hex ? 'scale-125 ring-2 ring-blue-600 ring-offset-2' : 'hover:scale-110 opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingCategory(false)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newCatName.trim()}
                className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
              >
                Create Category
              </button>
            </div>
          </form>
        )}

        {/* Categories List */}
        {filteredCategories.length === 0 && !isAddingCategory ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-200 text-slate-500 mx-auto">
              <Tag size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">No {activeCategoryTab === 'EXPENSE' ? 'Expense' : 'Income'} Categories Yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                You haven't added any {activeCategoryTab === 'EXPENSE' ? 'expense' : 'income'} categories. Add categories that match your lifestyle to organize transactions and set budgets.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsAddingCategory(true);
                setNewCatColor(activeCategoryTab === 'EXPENSE' ? '#ef4444' : '#10b981');
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
            >
              <Plus size={14} className="stroke-[2.5]" />
              <span>Add First {activeCategoryTab === 'EXPENSE' ? 'Expense' : 'Income'} Category</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCategories.map((cat) => {
              const isEditing = editingCategoryId === cat.id;
              const usageCount = transactions.filter((t) => t.category === cat.name && t.type === cat.type).length;

              if (isEditing) {
                return (
                  <form
                    key={cat.id}
                    onSubmit={handleSaveEditCategory}
                    className="rounded-2xl border-2 border-blue-500 bg-blue-50/70 p-3.5 space-y-3 shadow-md animate-in fade-in"
                  >
                    <div className="text-[11px] font-bold text-blue-900">Edit Category Name</div>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={editingCatName}
                      onChange={(e) => setEditingCatName(e.target.value)}
                      className="w-full rounded-lg border border-blue-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />

                    <div className="flex items-center gap-1.5">
                      {COLOR_PALETTE.map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => setEditingCatColor(hex)}
                          className={`h-5 w-5 rounded-full transition transform ${
                            editingCatColor === hex ? 'scale-125 ring-2 ring-blue-600 ring-offset-1' : 'hover:scale-110 opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingCategoryId(null)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!editingCatName.trim()}
                        className="rounded-lg bg-blue-600 px-3 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                );
              }

              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-blue-200 hover:shadow-xs transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="h-3.5 w-3.5 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: cat.color || (cat.type === 'EXPENSE' ? '#ef4444' : '#10b981') }}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{cat.name}</div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {usageCount} {usageCount === 1 ? 'transaction' : 'transactions'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => handleStartEditCategory(cat)}
                      title="Edit Category Name"
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat)}
                      title="Delete Category"
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
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

      {/* Book Modal */}
      <BookModal
        isOpen={bookModalOpen}
        onClose={() => setBookModalOpen(false)}
        editingBook={selectedBookForEdit}
      />
    </div>
  );
}
