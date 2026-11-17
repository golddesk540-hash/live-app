'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/languageContext';
import {
  ArrowLeft,
  Copy,
  Check,
  Coins,
  Smartphone,
  Settings,
  ShieldCheck,
  LogOut,
  Edit3,
  Loader2,
  ChevronRight,
  Globe,
  Sliders,
  AlertTriangle,
} from 'lucide-react';

interface UserProfileData {
  id: string;
  poppoId: string;
  email: string | null;
  phone: string | null;
  nickname: string;
  avatarUrl: string;
  gender: string;
  birthdate: string | null;
  country: string | null;
  countryCode: string | null;
  bio: string;
  isAdultVerified: boolean;
  status: string;
  createdAt: string;
}

function MyProfileContent() {
  const router = useRouter();
  const { isUr } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 1. Fetch authenticated user data (identical for normal users, hosts, and all roles)
  useEffect(() => {
    async function loadData() {
      try {
        const profileRes = await fetch('/api/profile/me', { cache: 'no-store' });

        if (profileRes.status === 401) {
          router.push('/login?redirect=/profile');
          return;
        }

        const profileData = await profileRes.json();
        if (profileData.user) {
          setUser(profileData.user);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  // Copy User ID
  const handleCopyUserId = () => {
    if (!user?.poppoId) return;
    navigator.clipboard?.writeText(user.poppoId);
    setCopiedId(true);
    setToastMessage(isUr ? `آئی ڈی ${user.poppoId} کاپی ہوگئی!` : `User ID ${user.poppoId} copied!`);
    setTimeout(() => {
      setCopiedId(false);
      setToastMessage(null);
    }, 2500);
  };

  // Logout
  const handleLogout = async () => {
    if (!confirm(isUr ? 'کیا آپ واقعی لاگ آؤٹ کرنا چاہتے ہیں؟' : 'Are you sure you want to log out?')) {
      return;
    }

    try {
      setIsLoggingOut(true);
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
      setIsLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070514] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF2E74]" />
          <p className="text-xs text-white/60">{isUr ? 'پروفائل لوڈ ہو رہی ہے...' : 'Loading profile...'}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#070514] flex items-center justify-center text-white p-4">
        <div className="text-center space-y-4">
          <p className="text-sm text-white/70">{isUr ? 'صارف کا ڈیٹا دستیاب نہیں ہے۔' : 'User profile could not be loaded.'}</p>
          <Link
            href="/login"
            className="inline-block px-5 py-2.5 rounded-full bg-[#FF2E74] text-white text-xs font-bold"
          >
            {isUr ? 'لاگ ان کریں' : 'Log In'}
          </Link>
        </div>
      </div>
    );
  }

  const countryDisplay = user.country || 'Pakistan';
  const genderSymbol = user.gender === 'female' ? '♀' : user.gender === 'male' ? '♂' : '⚧';
  const genderColor = user.gender === 'female' ? 'text-[#FF2E74]' : user.gender === 'male' ? 'text-cyan-400' : 'text-purple-400';

  return (
    <main className="min-h-screen bg-[#070514] text-white flex justify-center py-0 sm:py-8 px-0 sm:px-4">
      {/* Centered Thin Web Profile Container */}
      <div className="w-full sm:max-w-md bg-gradient-to-b from-[#180E35] via-[#0E0922] to-[#070514] sm:rounded-[40px] sm:border-[8px] sm:border-[#22173F] sm:shadow-[0_0_80px_rgba(168,85,247,0.25)] flex flex-col min-h-screen sm:min-h-[820px] overflow-hidden relative">

        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#FF2E74] text-white text-xs font-bold shadow-lg shadow-[#FF2E74]/40 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Check className="w-3.5 h-3.5" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 1. Top Bar Navigation */}
        <div className="pt-4 px-5 pb-3 flex items-center justify-between border-b border-white/10 z-10 bg-black/20">
          <Link
            href="/"
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
            title={isUr ? 'ہوم پیج پر جائیں' : 'Back to Home'}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <h1 className="text-sm font-bold text-white tracking-wide">
            {isUr ? 'ویب اکاؤنٹ' : 'Web Account'}
          </h1>

          <Link
            href="/settings"
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
            title={isUr ? 'ترتیبات' : 'Settings'}
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>

        {/* 2. Scrollable Thin Profile Content */}
        <div className="flex-1 px-5 py-5 space-y-5 overflow-y-auto custom-scrollbar">

          {/* BASIC USER IDENTITY CARD */}
          <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 flex flex-col items-center text-center shadow-lg relative">
            {/* Profile Avatar */}
            <div className="relative mb-3 group" data-testid="profile-avatar-wrap">
              <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr from-[#FF2E74] via-[#C026D3] to-[#A855F7] shadow-[0_0_24px_rgba(255,46,116,0.4)]">
                <div className="w-full h-full rounded-full overflow-hidden bg-[#0F0A24]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user.avatarUrl || '/avatars/default.png'}
                    alt={user.nickname}
                    className="w-full h-full object-cover"
                    data-testid="profile-avatar-img"
                  />
                </div>
              </div>
              <Link
                href="/profile/edit"
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#FF2E74] text-white shadow-md hover:scale-105 transition-transform"
                title={isUr ? 'تصویر تبدیل کریں' : 'Change Avatar'}
              >
                <Edit3 className="w-3 h-3" />
              </Link>
            </div>

            {/* Nickname & Gender */}
            <div className="flex items-center justify-center gap-1.5 mb-1.5">
              <h2
                data-testid="profile-nickname"
                className="text-lg font-bold text-white tracking-wide"
              >
                {user.nickname}
              </h2>
              <span className={`text-base font-bold ${genderColor}`}>
                {genderSymbol}
              </span>
            </div>

            {/* User ID & Copy Action */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <span
                data-testid="profile-user-id"
                className="text-xs font-mono font-medium text-white/70 tracking-wider px-2.5 py-1 rounded-full bg-black/40 border border-white/5"
              >
                ID: {user.poppoId}
              </span>
              <button
                type="button"
                onClick={handleCopyUserId}
                data-testid="profile-copy-id-button"
                className="p-1.5 rounded-lg bg-[#3B225E] hover:bg-[#4E2D7C] text-white/90 hover:text-white transition-all shadow-sm active:scale-95"
                title={isUr ? 'یوزر آئی ڈی کاپی کریں' : 'Copy User ID'}
              >
                {copiedId ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Country & Verification Badge */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              <span
                data-testid="profile-country"
                className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/80 flex items-center gap-1.5"
              >
                <Globe className="w-3 h-3 text-[#FF2E74]" />
                <span>{countryDisplay}</span>
              </span>

              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold text-[10px] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Active & 18+ Verified</span>
              </span>
            </div>

            {/* Edit Profile Button (Edit Nickname, Profile Photo, Country) */}
            <div className="w-full mt-4 pt-4 border-t border-white/10">
              <Link
                href="/profile/edit"
                data-testid="profile-edit-button"
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all group"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#FF2E74] group-hover:scale-110 transition-transform" />
                <span>{isUr ? 'پروفائل میں ترمیم کریں (نام، تصویر، ملک)' : 'Edit Profile (Name, Photo, Country)'}</span>
              </Link>
            </div>
          </div>

          {/* TWO ADDITIONAL ACTIONS: GET COINS & GET THE APP */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider px-1">
              {isUr ? 'ویب اور ایپ ایکشنز' : 'Web & App Services'}
            </h3>

            {/* ACTION 1: Get Coins (Recharge) */}
            <Link
              href="/recharge"
              data-testid="profile-get-coins-link"
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-pink-500/10 to-transparent hover:from-amber-500/25 border border-amber-400/30 flex items-center justify-between text-left transition-all group shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-[#1D0F03] shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    {isUr ? 'کوائنز حاصل کریں (ریچارج)' : 'Get Coins (Card Recharge)'}
                  </span>
                  <span className="text-[10px] text-amber-200/70 block">
                    {isUr ? 'کارڈ یا آن لائن پیمنٹ سے کوائنز خریدیں' : 'Official card and web recharge payment receipts'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-300 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* ACTION 2: Get the App */}
            <Link
              href="/download"
              data-testid="profile-get-app-link"
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#FF2E74]/15 via-purple-500/10 to-transparent hover:from-[#FF2E74]/25 border border-[#FF2E74]/30 flex items-center justify-between text-left transition-all group shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF2E74] to-[#A855F7] flex items-center justify-center text-white shadow-md shadow-[#FF2E74]/20 group-hover:scale-105 transition-transform">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    {isUr ? 'ایپ ڈاؤن لوڈ کریں' : 'Get the App'}
                  </span>
                  <span className="text-[10px] text-pink-200/70 block">
                    {isUr ? 'گو لائیو، پی کے بیٹلز اور گفٹنگ ایپ میں دستیاب ہیں' : 'Go Live, PK Battles, Party Rooms & Gifts on iOS / Android'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#FF2E74] group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* SETTINGS & SESSIONS */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider px-1">
              {isUr ? 'ترتیبات اور سیکیورٹی' : 'Settings & Security'}
            </h3>

            {/* Web Settings */}
            <Link
              href="/settings"
              data-testid="profile-settings-link"
              className="w-full p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 flex items-center justify-between text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    {isUr ? 'ویب ترتیبات' : 'Web Settings'}
                  </span>
                  <span className="text-[10px] text-white/50 block">
                    {isUr ? 'زبان اور سیکیورٹی پن' : 'Language and security preferences'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
            </Link>

            {/* Active Sessions */}
            <Link
              href="/user-id"
              data-testid="profile-sessions-link"
              className="w-full p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 flex items-center justify-between text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    {isUr ? 'فعال سیشنز' : 'Active Sessions'}
                  </span>
                  <span className="text-[10px] text-white/50 block">
                    {isUr ? 'منسلک آلات اور لاگ ان تاریخ' : 'Manage active logins and connected devices'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
            </Link>
          </div>

          {/* ACCOUNT ACTIONS: CLOSE ACCOUNT & LOG OUT */}
          <div className="pt-2 space-y-2 border-t border-white/10">
            {/* Close Account */}
            <Link
              href="/account/close"
              data-testid="profile-close-account-link"
              className="w-full p-3.5 rounded-2xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 flex items-center justify-between text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-red-400 block">
                    {isUr ? 'اکاؤنٹ بند کریں' : 'Close Account'}
                  </span>
                  <span className="text-[10px] text-red-400/60 block">
                    {isUr ? 'اکاؤنٹ مستقل طور پر بند اور ڈیٹا حذف کریں' : 'Request account closure and data deletion'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-red-400/50 group-hover:text-red-400 transition-colors" />
            </Link>

            {/* Log Out */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              data-testid="profile-logout-button"
              className="w-full p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 flex items-center justify-center gap-2 text-white/70 hover:text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span>{isLoggingOut ? (isUr ? 'لاگ آؤٹ ہو رہا ہے...' : 'Logging out...') : (isUr ? 'لاگ آؤٹ' : 'Log Out')}</span>
            </button>
          </div>

        </div>

      </div>
    </main>
  );
}

export default function MyProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070514] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF2E74]" />
        </div>
      }
    >
      <MyProfileContent />
    </Suspense>
  );
}
