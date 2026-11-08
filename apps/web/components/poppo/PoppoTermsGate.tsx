'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/languageContext';

export const CURRENT_TERMS_VERSION = 'v4.2.0';

export default function PoppoTermsGate() {
  const { lang, setLang, isUr } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isDeclinedView, setIsDeclinedView] = useState(false);
  const [previewPolicy, setPreviewPolicy] = useState<'terms' | 'privacy' | null>(null);

  // Checkbox states
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  // UI / Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check consent on mount
  useEffect(() => {
    setMounted(true);

    const checkConsent = async () => {
      try {
        const localVersion = localStorage.getItem('poppo_terms_consent_version');
        const localStatus = localStorage.getItem('poppo_terms_consent_status');

        // Check backend API verification
        const res = await fetch('/api/consent', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.hasAccepted && data.status === 'accepted') {
            // Validated by server
            setIsVisible(false);
            return;
          }
          if (data.status === 'declined') {
            setIsVisible(true);
            setIsDeclinedView(true);
            return;
          }
        } else if (localStatus === 'accepted' && localVersion === CURRENT_TERMS_VERSION) {
          // Fallback to local storage if API fails temporarily
          setIsVisible(false);
          return;
        }

        // Needs acceptance
        setIsVisible(true);
      } catch (err) {
        console.error('Failed to verify terms consent:', err);
        // Show gate safely by default
        const localVersion = localStorage.getItem('poppo_terms_consent_version');
        if (localVersion !== CURRENT_TERMS_VERSION) {
          setIsVisible(true);
        }
      }
    };

    checkConsent();
  }, []);

  const handleAccept = async () => {
    setErrorMessage(null);

    if (!termsAccepted) {
      setErrorMessage(
        isUr
          ? 'براہ کرم سروس کی شرائط سے اتفاق کریں۔'
          : 'Please agree to the Terms of Service to continue.'
      );
      return;
    }
    if (!privacyAccepted) {
      setErrorMessage(
        isUr
          ? 'براہ کرم پرائیویسی پالیسی سے اتفاق کریں۔'
          : 'Please agree to the Privacy Policy to continue.'
      );
      return;
    }
    if (!ageConfirmed) {
      setErrorMessage(
        isUr
          ? 'براہ کرم تصدیق کریں کہ آپ کی عمر کم از کم 18 سال ہے۔'
          : 'You must confirm that you are at least 18 years of age to proceed.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // Get or create anonymous session ID in client storage
      let sessionId = localStorage.getItem('poppo_anon_session_id');
      if (!sessionId) {
        sessionId = 'sess_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
        localStorage.setItem('poppo_anon_session_id', sessionId);
      }

      const res = await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept',
          termsAccepted: true,
          privacyAccepted: true,
          isAdultConfirmed: true,
          anonymousSessionId: sessionId,
          language: lang,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Server error recording consent');
      }

      // Mark locally
      localStorage.setItem('poppo_terms_consent_status', 'accepted');
      localStorage.setItem('poppo_terms_consent_version', CURRENT_TERMS_VERSION);
      localStorage.setItem('poppo_terms_consent_timestamp', new Date().toISOString());

      // Dismiss gate
      setIsVisible(false);
    } catch (err: any) {
      console.error('Consent submission failed:', err);
      setErrorMessage(
        isUr
          ? 'معذرت، تصدیق کے دوران خرابی پیش آئی۔ دوبارہ کوشش کریں۔'
          : err.message || 'Consent verification failed. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    setIsSubmitting(true);
    try {
      let sessionId = localStorage.getItem('poppo_anon_session_id');
      if (!sessionId) {
        sessionId = 'sess_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
        localStorage.setItem('poppo_anon_session_id', sessionId);
      }

      await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'decline',
          termsAccepted: false,
          privacyAccepted: false,
          isAdultConfirmed: false,
          anonymousSessionId: sessionId,
          language: lang,
        }),
      });

      localStorage.setItem('poppo_terms_consent_status', 'declined');
      setIsDeclinedView(true);
    } catch (err) {
      console.error('Error during decline action:', err);
      setIsDeclinedView(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || !isVisible) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-gate-title"
      className="fixed inset-0 z-[99999] flex items-center justify-center overflow-y-auto bg-black/85 backdrop-blur-xl p-3 sm:p-4 md:p-6 transition-all duration-300"
      dir={isUr ? 'rtl' : 'ltr'}
    >
      {/* Ambient background glows */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-gradient-to-tr from-purple-700/25 via-pink-600/20 to-transparent rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-10 right-1/4 w-[280px] h-[280px] bg-pink-500/15 rounded-full blur-[90px] pointer-events-none" />

      {/* Main Container Card: Faithfully matches 02_01_first_open_terms_gate.png */}
      <div className="relative w-full max-w-[420px] sm:max-w-[450px] my-auto bg-gradient-to-b from-[#140C29] via-[#0E091E] to-[#0A0614] border border-[#2D1B4E]/80 rounded-[32px] sm:rounded-[36px] p-6 sm:p-8 shadow-[0_20px_70px_rgba(0,0,0,0.8),0_0_35px_rgba(168,85,247,0.18)] text-white overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Subtle decorative top glow line */}
        <div className="absolute top-0 left-12 right-12 h-[2px] bg-gradient-to-r from-transparent via-[#FF1A6C] to-transparent opacity-80" />

        {/* Top bar with Language Switcher */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-medium text-purple-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{isUr ? 'پوپو سیکیورٹی و قانونی گیٹ' : 'Official Compliance Gate'}</span>
          </div>

          {/* Working Language selector */}
          <div className="flex items-center bg-white/10 rounded-full p-0.5 border border-white/10">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                !isUr
                  ? 'bg-gradient-to-r from-[#FF1A6C] to-[#E0125C] text-white shadow-sm'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('ur')}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                isUr
                  ? 'bg-gradient-to-r from-[#FF1A6C] to-[#E0125C] text-white shadow-sm'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              اردو
            </button>
          </div>
        </div>

        {/* Brand Logo & Name */}
        <div className="flex flex-col items-center mb-5">
          {/* Authentic Poppo Heart-Ribbon Icon */}
          <div className="relative mb-2">
            <div className="absolute inset-0 bg-[#FF1A6C] blur-md opacity-60 rounded-full" />
            <svg
              className="relative w-12 h-12 text-[#FF1A6C] transform hover:scale-105 transition-transform"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M50 82C50 82 18 58 18 36C18 24 28 16 40 16C46 16 50 19 50 19C50 19 54 16 60 16C72 16 82 24 82 36C82 58 50 82 50 82Z"
                stroke="url(#gateLogoGrad)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M38 42C44 50 56 50 62 42"
                stroke="url(#gateLogoGrad)"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gateLogoGrad" x1="18" y1="16" x2="82" y2="82" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FF2E93" />
                  <stop offset="1" stopColor="#E0125C" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
            <span>Popo Live</span>
          </h2>
        </div>

        {/* ===================== VIEW 1: NORMAL TERMS ACCEPTANCE ===================== */}
        {!isDeclinedView ? (
          <div>
            {/* Center Hero Artwork: 3D Shield with Document & Pink Checkmark */}
            <div className="relative flex justify-center items-center my-4">
              {/* Shield aura glow */}
              <div className="absolute w-44 h-44 rounded-full bg-gradient-to-tr from-[#9333EA]/30 via-[#EC4899]/25 to-transparent blur-2xl pointer-events-none" />

              <svg
                className="w-36 h-36 sm:w-40 sm:h-40 drop-shadow-[0_10px_25px_rgba(168,85,247,0.35)]"
                viewBox="0 0 160 160"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Background floating sparkle elements */}
                <circle cx="28" cy="44" r="3.5" fill="#E879F9" opacity="0.7" className="animate-pulse" />
                <circle cx="136" cy="48" r="4" fill="#F472B6" opacity="0.8" className="animate-pulse" />
                <path d="M138 96L142 100L138 104L134 100Z" fill="#C084FC" opacity="0.6" />
                <path d="M22 106L25 109L22 112L19 109Z" fill="#F43F5E" opacity="0.5" />

                {/* 3D Shield Outer Shell */}
                <path
                  d="M80 18C80 18 116 28 126 44C126 80 106 122 80 138C54 122 34 80 34 44C44 28 80 18 80 18Z"
                  fill="url(#shieldGrad)"
                  stroke="url(#shieldStroke)"
                  strokeWidth="3.5"
                />

                {/* Shield Inner Shadow Border */}
                <path
                  d="M80 26C80 26 110 35 118 48C118 78 102 114 80 128C58 114 42 78 42 48C50 35 80 26 80 26Z"
                  fill="url(#shieldInner)"
                  opacity="0.9"
                />

                {/* Document Inside Shield */}
                <rect x="58" y="46" width="44" height="56" rx="6" fill="#FFFFFF" fillOpacity="0.95" />
                {/* Document Header lines */}
                <rect x="65" y="55" width="30" height="3.5" rx="1.75" fill="#C084FC" />
                <rect x="65" y="63" width="22" height="3" rx="1.5" fill="#E2E8F0" />
                <rect x="65" y="70" width="26" height="3" rx="1.5" fill="#E2E8F0" />
                <rect x="65" y="77" width="18" height="3" rx="1.5" fill="#E2E8F0" />

                {/* Round Badge with Checkmark on document */}
                <circle cx="72" cy="56" r="8" fill="#EC4899" />
                <path
                  d="M69 56L71.5 58.5L76 53.5"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Large 3D Neon Pink Checkmark at bottom right of shield */}
                <g filter="url(#glowFilter)">
                  <circle cx="106" cy="104" r="16" fill="url(#pinkCheckBg)" />
                  <path
                    d="M99 104L104 109L113 99"
                    stroke="#FFFFFF"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>

                <defs>
                  <linearGradient id="shieldGrad" x1="34" y1="18" x2="126" y2="138" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6D28D9" />
                    <stop offset="0.5" stopColor="#4C1D95" />
                    <stop offset="1" stopColor="#2E1065" />
                  </linearGradient>
                  <linearGradient id="shieldStroke" x1="34" y1="18" x2="126" y2="138" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#E879F9" />
                    <stop offset="0.7" stopColor="#A855F7" />
                    <stop offset="1" stopColor="#EC4899" />
                  </linearGradient>
                  <linearGradient id="shieldInner" x1="42" y1="26" x2="118" y2="128" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#581C87" />
                    <stop offset="1" stopColor="#1E0E38" />
                  </linearGradient>
                  <linearGradient id="pinkCheckBg" x1="90" y1="88" x2="122" y2="120" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FF2A85" />
                    <stop offset="1" stopColor="#E11D48" />
                  </linearGradient>
                  <filter id="glowFilter" x="84" y="82" width="44" height="44" filterUnits="userSpaceOnUse">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#FF1A6C" floodOpacity="0.6" />
                  </filter>
                </defs>
              </svg>
            </div>

            {/* Main Title and Subtitle */}
            <div className="text-center mb-5">
              <h1
                id="terms-gate-title"
                className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2"
              >
                {isUr ? 'سروس کی شرائط' : 'Terms of Service'}
              </h1>
              <p className="text-xs sm:text-sm text-[#B3A8C7] leading-relaxed max-w-[340px] mx-auto">
                {isUr
                  ? 'پوپو لائیو استعمال کرنے کے لیے براہ کرم ہماری سروس کی شرائط اور رازداری کی پالیسی پڑھیں اور قبول کریں۔'
                  : 'Please read and accept our Terms of Service and Privacy Policy to use Popo Live.'}
              </p>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-shake"
              >
                <svg className="w-4 h-4 shrink-0 text-rose-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Checkboxes Group */}
            <div className="space-y-3 mb-5">
              {/* Checkbox 1: Terms of Service */}
              <label
                className={`flex items-start gap-3 p-3 rounded-2xl bg-white/[0.04] border transition-all cursor-pointer ${
                  termsAccepted
                    ? 'border-[#FF1A6C]/60 bg-[#FF1A6C]/[0.06]'
                    : 'border-white/10 hover:border-purple-400/40'
                }`}
              >
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border transition-all ${
                    termsAccepted
                      ? 'bg-gradient-to-tr from-[#FF1A6C] to-[#C026D3] border-transparent shadow-[0_0_10px_rgba(255,26,108,0.5)]'
                      : 'border-purple-400/50 bg-[#160D2E]'
                  }`}
                >
                  {termsAccepted && (
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div className="text-xs sm:text-[13px] text-gray-200 leading-snug">
                  {isUr ? (
                    <span>
                      میں{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setPreviewPolicy('terms');
                        }}
                        className="text-[#FF4A8B] font-semibold underline underline-offset-2 hover:text-pink-300"
                      >
                        سروس کی شرائط
                      </button>{' '}
                      سے متفق ہوں
                    </span>
                  ) : (
                    <span>
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setPreviewPolicy('terms');
                        }}
                        className="text-[#FF4A8B] font-semibold underline underline-offset-2 hover:text-pink-300"
                      >
                        Terms of Service
                      </button>
                    </span>
                  )}
                </div>
              </label>

              {/* Checkbox 2: Privacy Policy */}
              <label
                className={`flex items-start gap-3 p-3 rounded-2xl bg-white/[0.04] border transition-all cursor-pointer ${
                  privacyAccepted
                    ? 'border-[#FF1A6C]/60 bg-[#FF1A6C]/[0.06]'
                    : 'border-white/10 hover:border-purple-400/40'
                }`}
              >
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border transition-all ${
                    privacyAccepted
                      ? 'bg-gradient-to-tr from-[#FF1A6C] to-[#C026D3] border-transparent shadow-[0_0_10px_rgba(255,26,108,0.5)]'
                      : 'border-purple-400/50 bg-[#160D2E]'
                  }`}
                >
                  {privacyAccepted && (
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div className="text-xs sm:text-[13px] text-gray-200 leading-snug">
                  {isUr ? (
                    <span>
                      میں{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setPreviewPolicy('privacy');
                        }}
                        className="text-[#FF4A8B] font-semibold underline underline-offset-2 hover:text-pink-300"
                      >
                        پرائیویسی پالیسی
                      </button>{' '}
                      سے متفق ہوں
                    </span>
                  ) : (
                    <span>
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setPreviewPolicy('privacy');
                        }}
                        className="text-[#FF4A8B] font-semibold underline underline-offset-2 hover:text-pink-300"
                      >
                        Privacy Policy
                      </button>
                    </span>
                  )}
                </div>
              </label>

              {/* Age Verification Notice & Checkbox (18+ Requirement) */}
              <label
                className={`flex items-start gap-3 p-3 rounded-2xl bg-amber-500/[0.05] border transition-all cursor-pointer ${
                  ageConfirmed
                    ? 'border-amber-400/60 bg-amber-500/[0.08]'
                    : 'border-amber-500/20 hover:border-amber-400/40'
                }`}
              >
                <input
                  type="checkbox"
                  checked={ageConfirmed}
                  onChange={(e) => setAgeConfirmed(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border transition-all ${
                    ageConfirmed
                      ? 'bg-gradient-to-tr from-amber-500 to-amber-600 border-transparent shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                      : 'border-amber-500/50 bg-[#1A121E]'
                  }`}
                >
                  {ageConfirmed && (
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div className="text-xs sm:text-[13px] text-amber-200/90 leading-snug">
                  <div className="font-semibold text-amber-300 flex items-center gap-1.5 mb-0.5">
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-[10px] font-bold">18+</span>
                    <span>{isUr ? 'عمر کی تصدیق (18+)' : 'Age Requirement Notice (18+)'}</span>
                  </div>
                  <span>
                    {isUr
                      ? 'میں تصدیق کرتا ہوں کہ میری عمر 18 سال یا اس سے زیادہ ہے۔'
                      : 'I confirm that I am at least 18 years old to use Popo Live.'}
                  </span>
                </div>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Primary: Accept & Continue (Radiant Pink Pill) */}
              <button
                type="button"
                onClick={handleAccept}
                disabled={isSubmitting}
                className={`w-full py-3.5 px-6 rounded-full font-bold text-sm sm:text-base tracking-wide text-white transition-all transform active:scale-[0.98] ${
                  isSubmitting
                    ? 'opacity-70 cursor-not-allowed bg-gradient-to-r from-[#FF1A6C] to-[#E0125C]'
                    : 'bg-gradient-to-r from-[#FF1A6C] via-[#FF2E80] to-[#E0125C] shadow-[0_8px_25px_rgba(255,26,108,0.45)] hover:shadow-[0_12px_32px_rgba(255,26,108,0.65)] hover:brightness-105'
                }`}
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    <span>{isUr ? 'تصدیق ہو رہی ہے...' : 'Verifying...'}</span>
                  </span>
                ) : isUr ? (
                  'قبول کریں اور جاری رکھیں'
                ) : (
                  'Accept & Continue'
                )}
              </button>

              {/* Secondary: Decline Button */}
              <button
                type="button"
                onClick={handleDecline}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 text-xs sm:text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                {isUr ? 'مسترد کریں' : 'Decline'}
              </button>
            </div>

            {/* Footer version label */}
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
              <span>Popo Live Platform v4.2</span>
              <span>Terms & Privacy {CURRENT_TERMS_VERSION}</span>
            </div>
          </div>
        ) : (
          /* ===================== VIEW 2: DECLINED STATE SCREEN ===================== */
          <div className="text-center py-2 animate-in fade-in zoom-in-95 duration-200">
            {/* Warning Shield Graphic */}
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.25)]">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
              {isUr ? 'شرائط کی قبولیت لازمی ہے' : 'Terms Acceptance Required'}
            </h3>

            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-6 max-w-[340px] mx-auto">
              {isUr
                ? 'پوپو لائیو کے لائیو سٹریمنگ، پارٹی آڈیو رومز، سکے ریچارج اور کمیونٹی فیچرز استعمال کرنے کے لیے سروس کی شرائط اور رازداری کی پالیسی کو قبول کرنا اور 18 سال یا زائد عمر کا ہونا لازمی ہے۔'
                : 'To protect our community and satisfy legal safety standards, access to Popo Live live-streams, party audio rooms, coin recharge, and creator interactions requires accepting our Terms of Service and Privacy Policy. You must also be at least 18 years of age.'}
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setIsDeclinedView(false)}
                className="w-full py-3.5 px-6 rounded-full font-bold text-sm sm:text-base text-white bg-gradient-to-r from-[#FF1A6C] to-[#E0125C] shadow-lg shadow-pink-500/30 hover:brightness-110 transition-all"
              >
                {isUr ? 'شرائط کا دوبارہ جائزہ لیں' : 'Review & Accept Terms'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.href = 'https://www.google.com';
                  }
                }}
                className="w-full py-2.5 px-4 text-xs sm:text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                {isUr ? 'ویب سائٹ چھوڑیں' : 'Exit Website'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===================== IN-MODAL POLICY PREVIEW DRAWER ===================== */}
      {previewPolicy && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#120B24] border border-purple-500/30 rounded-2xl flex flex-col shadow-2xl overflow-hidden text-white">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-[#160D2E]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF1A6C]" />
                <h3 className="font-bold text-base sm:text-lg">
                  {previewPolicy === 'terms'
                    ? isUr
                      ? 'سروس کی شرائط — پوپو لائیو'
                      : 'Terms of Service — Popo Live'
                    : isUr
                    ? 'پرائیویسی پالیسی — پوپو لائیو'
                    : 'Privacy Policy — Popo Live'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPolicy(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-gray-300 leading-relaxed">
              {previewPolicy === 'terms' ? (
                <>
                  <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20 text-[#FF4A8B] text-xs">
                    {isUr
                      ? 'آخری اپ ڈیٹ: نومبر 2026 | ورژن 4.2.0 | قانونی پابندی نافذ العمل ہے'
                      : 'Last Updated: November 2026 | Version 4.2.0 | Legally Binding Agreement'}
                  </div>
                  <h4 className="font-bold text-white text-sm sm:text-base">1. User Eligibility (18+ Requirement)</h4>
                  <p>
                    You must be at least 18 years of age to access or use the Popo Live platform, broadcast live video or audio, participate in party rooms, send virtual gifts, or recharge coins. Individuals under 18 years old are strictly prohibited.
                  </p>
                  <h4 className="font-bold text-white text-sm sm:text-base">2. Community Standards & Conduct</h4>
                  <p>
                    Users must respect community standards. Content featuring nudity, violence, hate speech, harassment, illegal gambling, or copyrighted broadcasts without authorization will result in immediate suspension and forfeiture of virtual balances.
                  </p>
                  <h4 className="font-bold text-white text-sm sm:text-base">3. Virtual Items & Payments</h4>
                  <p>
                    All coin recharges and virtual gifts are final and non-refundable except where required by applicable consumer law. Virtual coins have no monetary value outside the Popo Live platform.
                  </p>
                </>
              ) : (
                <>
                  <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20 text-[#FF4A8B] text-xs">
                    {isUr
                      ? 'آخری اپ ڈیٹ: نومبر 2026 | ورژن 4.2.0 | ڈیٹا کے تحفظ کی پالیسی'
                      : 'Last Updated: November 2026 | Version 4.2.0 | Privacy & Data Protection Policy'}
                  </div>
                  <h4 className="font-bold text-white text-sm sm:text-base">1. Information We Collect</h4>
                  <p>
                    We collect profile data (nickname, avatar), device information, IP address (anonymized for security logs), stream metadata, and transaction history to operate live broadcasts and secure transactions.
                  </p>
                  <h4 className="font-bold text-white text-sm sm:text-base">2. How We Protect Your Data</h4>
                  <p>
                    All network traffic is encrypted via TLS 1.3. Payment card numbers are processed by certified PCI-DSS payment gateways and are never stored on our application servers.
                  </p>
                  <h4 className="font-bold text-white text-sm sm:text-base">3. Cookie & Consent Management</h4>
                  <p>
                    We use cryptographically signed consent tokens to ensure you have explicitly acknowledged our Terms and Privacy policies without tracking you across third-party websites.
                  </p>
                </>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-white/10 bg-[#160D2E] flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewPolicy(null)}
                className="py-2 px-5 rounded-full bg-gradient-to-r from-[#FF1A6C] to-[#E0125C] text-white font-semibold text-xs sm:text-sm shadow-md"
              >
                {isUr ? 'واپس جائیں اور قبول کریں' : 'Close & Return to Gate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
