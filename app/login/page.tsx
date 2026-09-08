"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Lock,
  Mail,
  Phone,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Globe,
  Sparkles,
} from 'lucide-react';

export default function LoginPage() {
  const { currentUser, login, createUserAccount, isLoading } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regIdentifierType, setRegIdentifierType] = useState<'EMAIL' | 'PHONE'>('PHONE');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regCurrency, setRegCurrency] = useState('INR');
  const [regCurrencySymbol, setRegCurrencySymbol] = useState('₹');

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect based on role
  useEffect(() => {
    if (!isLoading && currentUser) {
      if (currentUser.role === 'ADMIN') {
        router.replace('/admin/users');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [currentUser, isLoading, router]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const result = await login(loginIdentifier, loginPassword);
      if (result.success && result.user) {
        if (result.user.role === 'ADMIN') {
          router.replace('/admin/users');
        } else {
          router.replace('/dashboard');
        }
      } else {
        setErrorMsg(result.error || 'Failed to sign in. Please check your credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    if (!regEmail.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    if (!regEmail.includes('@') || !regEmail.includes('.')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!regPhone.trim()) {
      setErrorMsg('Please enter your mobile number.');
      return;
    }

    if (regPassword.length < 4) {
      setErrorMsg('Password should be at least 4 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createUserAccount({
        name: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        phone: regPhone.trim(),
        password: regPassword,
        role: 'USER',
        currency: regCurrency,
        currencySymbol: regCurrencySymbol,
      });

      if (result.success && result.user) {
        setSuccessMsg('Account created successfully! Signing you in...');
        // Auto sign-in
        const loginRes = await login(
          regEmail.trim(),
          regPassword
        );
        if (loginRes.success) {
          router.replace('/dashboard');
        } else {
          setMode('LOGIN');
          setLoginIdentifier(regEmail.trim());
          setSuccessMsg('Account created! Please sign in with your email or mobile number.');
        }
      } else {
        setErrorMsg(result.error || 'Failed to create user account.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If loading or already authenticated, show clean spinner while redirecting
  if (isLoading || currentUser) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-blue-50/60 to-slate-100 p-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mb-3" />
        <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
          Loading FinBook...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-blue-50/60 via-slate-50 to-slate-100 p-4 select-none">
      <div className="w-full max-w-md space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-[20px] bg-blue-600 text-white shadow-lg shadow-blue-500/25">
            <BookOpen size={28} className="stroke-[2.5]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Fin<span className="text-blue-600">Book</span>
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            Personal cashbook, financial ledgers, lending tracking, and spending budgets
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xl shadow-slate-200/50 space-y-5">
          {/* Card Header Title */}
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              {mode === 'LOGIN' ? 'Sign in to your account' : 'Create your account'}
            </h2>
            <p className="text-xs text-slate-500">
              {mode === 'LOGIN'
                ? 'Enter your mobile number or email to access your finances'
                : 'Provide your details to set up your personal cashbook'}
            </p>
          </div>

          {/* Alert Messages */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 animate-in fade-in">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-blue-700" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 animate-in fade-in">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-blue-700" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* FORM 1: SIGN IN */}
          {/* ========================================================================= */}
          {mode === 'LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mobile Number, Email, or Username
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-slate-400 flex items-center gap-1">
                    <Mail size={14} />
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. +91 98765 43210 or user@example.com"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-10 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.99] transition disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Signing in...' : 'Sign In to FinBook'}</span>
                <ArrowRight size={14} />
              </button>

              <div className="text-center pt-2 border-t border-slate-100">
                <span className="text-slate-500">Don't have an account yet? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('REGISTER');
                    setErrorMsg(null);
                  }}
                  className="font-bold text-blue-600 hover:underline"
                >
                  Create one now
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: CREATE ACCOUNT (REGISTER) FORM */}
          {/* ========================================================================= */}
          {mode === 'REGISTER' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. John Doe"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. user@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Number *</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none transition"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  You can use either your email or mobile number to sign in.
                </p>
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Create Password *</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Confirm Password *</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Currency Preference */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Preferred Currency</label>
                <div className="relative">
                  <Globe size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <select
                    value={regCurrencySymbol}
                    onChange={(e) => {
                      setRegCurrencySymbol(e.target.value);
                      if (e.target.value === '₹') setRegCurrency('INR');
                      if (e.target.value === '$') setRegCurrency('USD');
                      if (e.target.value === '€') setRegCurrency('EUR');
                      if (e.target.value === '£') setRegCurrency('GBP');
                      if (e.target.value === 'AED') setRegCurrency('AED');
                    }}
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none transition"
                  >
                    <option value="₹">₹ (INR - Indian Rupee)</option>
                    <option value="$">$ (USD - US Dollar)</option>
                    <option value="€">€ (EUR - Euro)</option>
                    <option value="£">£ (GBP - British Pound)</option>
                    <option value="AED">AED (UAE Dirham)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.99] transition disabled:opacity-50 mt-1"
              >
                <span>{isSubmitting ? 'Creating Account...' : 'Create Account & Get Started'}</span>
                <ArrowRight size={14} />
              </button>

              <div className="text-center pt-2 border-t border-slate-100">
                <span className="text-slate-500">Already registered? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('LOGIN');
                    setErrorMsg(null);
                  }}
                  className="font-bold text-blue-600 hover:underline"
                >
                  Sign in here
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-400">
          Personal & isolated ledger books • 100% secure financial tracking
        </div>
      </div>
    </div>
  );
}
