'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PoppoLogo } from './PoppoLogo';
import { useLanguage } from '@/lib/languageContext';
import { ChevronDown, Globe, Menu, X, Coins, Sparkles, User, LogIn } from 'lucide-react';

export interface PoppoHeaderProps {
  onOpenLogin?: () => void;
}

export const PoppoHeader: React.FC<PoppoHeaderProps> = ({ onOpenLogin }) => {
  const pathname = usePathname();
  const { lang, toggleLang, isUr } = useLanguage();
  const [isPoliciesOpen, setIsPoliciesOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ nickname: string; avatarUrl: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated && d.user) {
          setCurrentUser(d.user);
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const policiesRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (policiesRef.current && !policiesRef.current.contains(e.target as Node)) {
        setIsPoliciesOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const policyLinks = [
    { label: isUr ? 'پرائیویسی پالیسی' : 'Privacy Policy', href: '/policies/privacy' },
    { label: isUr ? 'استعمال کی شرائط' : 'Terms of Service', href: '/policies/terms' },
    { label: isUr ? 'لائیو معاہدہ' : 'Live Agreement', href: '/policies/live-agreement' },
    { label: isUr ? 'ریچارج معاہدہ' : 'User Recharge Agreement', href: '/policies/recharge-agreement' },
    { label: isUr ? 'چائلڈ پروٹیکشن پالیسی' : 'Child Protection Policy', href: '/policies/child-protection' },
  ];

  const isPolicyActive = pathname.startsWith('/policies');

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-gray-100 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <PoppoLogo />

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-gray-700">
          <Link
            href="/"
            className={`transition-colors hover:text-[#5653FE] ${
              pathname === '/' ? 'text-[#5653FE] font-bold' : ''
            }`}
          >
            {isUr ? 'ہوم پیج' : 'Homepage'}
          </Link>

          <Link
            href="/live"
            className={`transition-colors hover:text-[#5653FE] ${
              pathname === '/live' ? 'text-[#5653FE] font-bold' : ''
            }`}
          >
            LIVE
          </Link>

          <Link
            href="/contact"
            className={`transition-colors hover:text-[#5653FE] ${
              pathname === '/contact' ? 'text-[#5653FE] font-bold' : ''
            }`}
          >
            {isUr ? 'رابطہ' : 'Contact'}
          </Link>

          <Link
            href="/news"
            className={`transition-colors hover:text-[#5653FE] ${
              pathname.startsWith('/news') ? 'text-[#5653FE] font-bold' : ''
            }`}
          >
            {isUr ? 'نیوز سینٹر' : 'News Center'}
          </Link>

          {/* Policies Dropdown */}
          <div className="relative" ref={policiesRef}>
            <button
              type="button"
              onClick={() => setIsPoliciesOpen(!isPoliciesOpen)}
              className={`flex items-center gap-1 transition-colors hover:text-[#5653FE] ${
                isPolicyActive ? 'text-[#5653FE] font-bold' : ''
              }`}
            >
              <span>{isUr ? 'پالیسیاں' : 'Policies'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isPoliciesOpen ? 'rotate-180 text-[#5653FE]' : ''}`} />
            </button>

            {isPoliciesOpen && (
              <div className="absolute top-full mt-2 left-0 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 flex flex-col gap-0.5 z-50 animate-in fade-in-50 duration-150">
                {policyLinks.map((p) => (
                  <Link
                    key={p.href}
                    href={p.href}
                    onClick={() => setIsPoliciesOpen(false)}
                    className={`px-4 py-2 text-xs font-medium hover:bg-gray-50 hover:text-[#5653FE] transition-colors ${
                      pathname === p.href ? 'text-[#5653FE] bg-indigo-50/50 font-bold' : 'text-gray-700'
                    }`}
                  >
                    {p.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Get Coins (Recharge Link) */}
          <Link
            href="/recharge"
            className={`flex items-center gap-1.5 transition-colors hover:text-[#5653FE] ${
              pathname === '/recharge' ? 'text-[#5653FE] font-bold' : ''
            }`}
          >
            <span>{isUr ? 'کوائنز حاصل کریں' : 'Get Coins'}</span>
          </Link>
        </nav>

        {/* Right Section: Language & Log in Button */}
        <div className="hidden lg:flex items-center gap-4">
          {/* Language Selector */}
          <div className="relative" ref={langRef}>
            <button
              type="button"
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-[#5653FE] py-1.5 px-2 rounded-lg transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-gray-400" />
              <span>{lang === 'ur' ? 'اردو' : 'English'}</span>
              <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLangOpen && (
              <div className="absolute top-full mt-1.5 right-0 w-32 bg-white rounded-xl shadow-lg border border-gray-100 py-1 flex flex-col z-50">
                <button
                  type="button"
                  onClick={() => {
                    if (lang !== 'en') toggleLang();
                    setIsLangOpen(false);
                  }}
                  className={`px-3 py-2 text-xs text-left font-medium hover:bg-gray-50 transition-colors ${
                    lang === 'en' ? 'text-[#5653FE] font-bold bg-indigo-50/30' : 'text-gray-700'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (lang !== 'ur') toggleLang();
                    setIsLangOpen(false);
                  }}
                  className={`px-3 py-2 text-xs text-left font-medium hover:bg-gray-50 transition-colors ${
                    lang === 'ur' ? 'text-[#5653FE] font-bold bg-indigo-50/30' : 'text-gray-700'
                  }`}
                >
                  اردو (Urdu)
                </button>
              </div>
            )}
          </div>

          {/* Log in or Profile Button */}
          {currentUser ? (
            <Link
              href="/profile"
              className="flex items-center gap-2 pl-1.5 pr-4 py-1 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 text-xs font-bold transition-all shadow-sm"
            >
              <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 border border-[#5653FE]/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentUser.avatarUrl || '/avatars/default.png'}
                  alt={currentUser.nickname}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="max-w-[120px] truncate">{currentUser.nickname}</span>
            </Link>
          ) : onOpenLogin ? (
            <button
              type="button"
              onClick={onOpenLogin}
              className="px-6 py-2 rounded-full bg-[#5653FE] hover:bg-[#4643E0] text-white font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer"
            >
              {isUr ? 'لاگ ان' : 'Log in'}
            </button>
          ) : (
            <Link
              href="/login"
              className="px-6 py-2 rounded-full bg-[#5653FE] hover:bg-[#4643E0] text-white font-bold text-xs shadow-sm hover:shadow transition-all"
            >
              {isUr ? 'لاگ ان' : 'Log in'}
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center gap-2">
          {currentUser ? (
            <Link
              href="/profile"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-800 font-bold text-xs"
            >
              <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentUser.avatarUrl || '/avatars/default.png'}
                  alt={currentUser.nickname}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="max-w-[70px] truncate">{currentUser.nickname}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-3.5 py-1.5 rounded-full bg-[#5653FE] text-white font-bold text-xs"
            >
              {isUr ? 'لاگ ان' : 'Log in'}
            </Link>
          )}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Toggle Navigation"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-100 px-4 pt-2 pb-6 flex flex-col gap-3 animate-in slide-in-from-top-4 duration-200 shadow-xl">
          {currentUser && (
            <Link
              href="/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 border border-[#5653FE]/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentUser.avatarUrl || '/avatars/default.png'}
                    alt={currentUser.nickname}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">{currentUser.nickname}</p>
                  <p className="text-[10px] text-[#5653FE] font-medium">{isUr ? 'میری پروفائل دیکھیں' : 'View My Profile'}</p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-[#5653FE] -rotate-90" />
            </Link>
          )}

          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="py-2 px-3 rounded-lg text-sm font-semibold text-gray-800 hover:bg-gray-50 hover:text-[#5653FE]"
          >
            {isUr ? 'ہوم پیج' : 'Homepage'}
          </Link>
          <Link
            href="/live"
            onClick={() => setIsMobileMenuOpen(false)}
            className="py-2 px-3 rounded-lg text-sm font-semibold text-gray-800 hover:bg-gray-50 hover:text-[#5653FE]"
          >
            LIVE
          </Link>
          <Link
            href="/contact"
            onClick={() => setIsMobileMenuOpen(false)}
            className="py-2 px-3 rounded-lg text-sm font-semibold text-gray-800 hover:bg-gray-50 hover:text-[#5653FE]"
          >
            {isUr ? 'رابطہ' : 'Contact'}
          </Link>
          <Link
            href="/news"
            onClick={() => setIsMobileMenuOpen(false)}
            className="py-2 px-3 rounded-lg text-sm font-semibold text-gray-800 hover:bg-gray-50 hover:text-[#5653FE]"
          >
            {isUr ? 'نیوز سینٹر' : 'News Center'}
          </Link>
          <Link
            href="/recharge"
            onClick={() => setIsMobileMenuOpen(false)}
            className="py-2 px-3 rounded-lg text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 flex items-center justify-between"
          >
            <span>{isUr ? 'کوائنز حاصل کریں' : 'Get Coins (Top Up)'}</span>
            <span className="text-[10px] bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded">0% Fee</span>
          </Link>
          <Link
            href="/download"
            onClick={() => setIsMobileMenuOpen(false)}
            className="py-2 px-3 rounded-lg text-sm font-semibold text-gray-800 hover:bg-gray-50 hover:text-[#5653FE]"
          >
            {isUr ? 'موبائل ایپ ڈاؤن لوڈ' : 'Download App'}
          </Link>
          <Link
            href="/agency"
            onClick={() => setIsMobileMenuOpen(false)}
            className="py-2 px-3 rounded-lg text-sm font-semibold text-gray-800 hover:bg-gray-50 hover:text-[#5653FE]"
          >
            {isUr ? 'ایجنسی پارٹنر بنیں' : 'Agency Partnership'}
          </Link>

          <div className="border-t border-gray-100 pt-2 flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-3">
              {isUr ? 'پالیسیاں' : 'Policies'}
            </span>
            {policyLinks.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-1.5 px-3 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-[#5653FE]"
              >
                {p.label}
              </Link>
            ))}
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between px-3">
            <span className="text-xs text-gray-500">{isUr ? 'زبان تبدیل کریں:' : 'Language:'}</span>
            <button
              type="button"
              onClick={toggleLang}
              className="px-3 py-1 rounded-full bg-gray-100 font-bold text-xs text-gray-800 flex items-center gap-1"
            >
              <Globe className="w-3 h-3 text-[#5653FE]" />
              <span>{lang === 'en' ? 'اردو' : 'English'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
