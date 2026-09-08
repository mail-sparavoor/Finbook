"use client";

import React, { useState, useEffect } from 'react';
import { Download, X, Share2, PlusSquare, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('MyFinBook Service Worker registered successfully', reg.scope);
        })
        .catch((err) => {
          console.warn('Service Worker registration failed:', err);
        });
    }

    // 2. Check if already installed / standalone
    if (typeof window !== 'undefined') {
      const isAppStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(isAppStandalone);

      // Check for iOS Safari
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
      const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
      setIsIos(isIosDevice && isSafari);

      // Check if user dismissed recently
      const wasDismissed = localStorage.getItem('myfinbook_pwa_dismissed');
      if (wasDismissed) {
        setDismissed(true);
      }
    }

    // 3. Listen for Android/Chrome beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('User installed the MyFinBook PWA');
        setDeferredPrompt(null);
      }
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('myfinbook_pwa_dismissed', 'true');
  };

  // Do not show if already in standalone app mode or dismissed and prompt not directly clicked
  if (isStandalone || dismissed || (!deferredPrompt && !isIos)) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom Install Banner for Mobile */}
      <div className="fixed bottom-20 md:bottom-5 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 animate-in slide-in-from-bottom-5 duration-300">
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-blue-200 bg-white shadow-xl shadow-blue-900/10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
              <Smartphone size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 leading-tight">Install FinBook App</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Add to your phone home screen for instant, offline access.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition"
            >
              <Download size={13} />
              <span>Install</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              title="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Step-by-Step Instructions Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md animate-in fade-in select-none">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 select-text">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Smartphone size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Install on iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 pt-1">
              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-800 font-bold text-xs">
                  1
                </span>
                <p className="leading-snug">
                  Tap the <strong className="text-slate-900">Share</strong> button <Share2 size={13} className="inline mx-0.5 text-blue-600" /> at the bottom of Safari.
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-800 font-bold text-xs">
                  2
                </span>
                <p className="leading-snug">
                  Scroll down and tap <strong className="text-slate-900">Add to Home Screen</strong> <PlusSquare size={13} className="inline mx-0.5 text-blue-600" />.
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-800 font-bold text-xs">
                  3
                </span>
                <p className="leading-snug">
                  Tap <strong className="text-slate-900">Add</strong> in the top-right corner to place FinBook on your home screen.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
