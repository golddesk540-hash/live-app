'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/languageContext';
import {
  ArrowLeft,
  Shield,
  Lock,
  Globe,
  Droplet,
  Slash,
  Bell,
  Moon,
  Info,
  ChevronRight,
  LogOut,
  Check,
  X,
  AlertCircle,
  Loader2,
  Copy,
  Edit3,
  KeyRound,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';

interface SettingsData {
  account: {
    id: string;
    poppoId: string;
    nickname: string;
    avatarUrl: string;
    email: string | null;
    phone: string | null;
    country: string;
    memberSince: string;
    createdAt: string;
  };
  security: {
    isPinEnabled: boolean;
    isPinLocked: boolean;
    pinLockedUntil: string | null;
  };
  language: {
    preferred: string;
  };
  blacklist: {
    count: number;
  };
  privacy: {
    profileVisibility: string;
    birthdayVisibility: string;
    genderVisibility: string;
    onlineStatusVisibility: string;
    followPermissions: string;
    messagePermissions: string;
  };
  notifications: {
    account: boolean;
    security: boolean;
    system: boolean;
    promotional: boolean;
  };
}

function SettingsContent() {
  const router = useRouter();
  const { lang, setLang, toggleLang, isUr } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SettingsData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Modals
  const [activeModal, setActiveModal] = useState<
    'account' | 'pin_menu' | 'pin_set' | 'pin_change' | 'pin_verify' | 'pin_reset' | 'language' | 'privacy' | 'notifications' | 'logout' | null
  >(null);

  // PIN Form States
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Privacy Form States
  const [privacyState, setPrivacyState] = useState({
    profileVisibility: 'everyone',
    birthdayVisibility: 'only_me',
    genderVisibility: 'everyone',
    onlineStatusVisibility: 'everyone',
    followPermissions: 'everyone',
    messagePermissions: 'everyone',
  });
  const [privacySaving, setPrivacySaving] = useState(false);

  // Notifications Form States
  const [notifState, setNotifState] = useState({
    account: true,
    security: true,
    system: true,
    promotional: false,
  });
  const [notifSaving, setNotifSaving] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings', { cache: 'no-store' });
      if (res.status === 401) {
        router.push('/login?redirect=/settings');
        return;
      }
      const json = await res.json();
      if (json.success) {
        setData(json);
        setPrivacyState(json.privacy);
        setNotifState(json.notifications);
        // Sync context language if different
        if (json.language?.preferred && ['en', 'ur'].includes(json.language.preferred) && json.language.preferred !== lang) {
          setLang(json.language.preferred as any);
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // 1. PIN SET
  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    if (!pinInput || pinInput.length < 4 || pinInput.length > 6) {
      setPinError(isUr ? 'پن 4 سے 6 ہندسوں پر مشتمل ہونا چاہیے۔' : 'PIN must be between 4 and 6 numeric digits.');
      return;
    }
    if (pinInput !== confirmPinInput) {
      setPinError(isUr ? 'کنفرم پن مماثل نہیں ہے۔' : 'Confirmation PIN does not match.');
      return;
    }

    try {
      setPinLoading(true);
      const res = await fetch('/api/settings/pin/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput, confirmPin: confirmPinInput }),
      });
      const resData = await res.json();
      if (!res.ok) {
        setPinError(resData.error || 'Failed to set PIN.');
        return;
      }
      showToast(isUr ? 'سیکیورٹی پن کامیابی سے سیٹ ہو گیا!' : 'Security PIN set successfully!');
      setActiveModal(null);
      setPinInput('');
      setConfirmPinInput('');
      loadSettings();
    } catch (err) {
      setPinError('Network error setting PIN.');
    } finally {
      setPinLoading(false);
    }
  };

  // 2. PIN CHANGE
  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    try {
      setPinLoading(true);
      const res = await fetch('/api/settings/pin/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPin: currentPinInput,
          newPin: pinInput,
          confirmPin: confirmPinInput,
        }),
      });
      const resData = await res.json();
      if (!res.ok) {
        setPinError(resData.error || 'Failed to change PIN.');
        return;
      }
      showToast(isUr ? 'سیکیورٹی پن تبدیل ہو گیا!' : 'Security PIN changed successfully!');
      setActiveModal(null);
      setCurrentPinInput('');
      setPinInput('');
      setConfirmPinInput('');
      loadSettings();
    } catch (err) {
      setPinError('Network error changing PIN.');
    } finally {
      setPinLoading(false);
    }
  };

  // 3. PIN VERIFY TEST
  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    try {
      setPinLoading(true);
      const res = await fetch('/api/settings/pin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput }),
      });
      const resData = await res.json();
      if (!res.ok) {
        setPinError(resData.error || 'Incorrect PIN.');
        return;
      }
      showToast(isUr ? 'سیکیورٹی پن کی تصدیق کامیاب رہی!' : 'Security PIN verified successfully!');
      setActiveModal(null);
      setPinInput('');
    } catch (err) {
      setPinError('Network error verifying PIN.');
    } finally {
      setPinLoading(false);
    }
  };

  // 4. PIN RESET / REMOVE
  const handleResetOrRemovePin = async (remove = false) => {
    setPinError(null);
    try {
      setPinLoading(true);
      const res = await fetch('/api/settings/pin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountPassword: passwordInput,
          newPin: remove ? undefined : pinInput,
          confirmPin: remove ? undefined : confirmPinInput,
          removePin: remove,
        }),
      });
      const resData = await res.json();
      if (!res.ok) {
        setPinError(resData.error || 'Failed to reset/remove PIN.');
        return;
      }
      showToast(resData.message || 'Security PIN updated.');
      setActiveModal(null);
      setPasswordInput('');
      setPinInput('');
      setConfirmPinInput('');
      loadSettings();
    } catch (err) {
      setPinError('Network error resetting PIN.');
    } finally {
      setPinLoading(false);
    }
  };

  // 5. LANGUAGE CHANGE
  const handleLanguageSelect = async (selectedLang: 'en' | 'ur') => {
    try {
      setLang(selectedLang);
      await fetch('/api/settings/language', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: selectedLang }),
      });
      showToast(selectedLang === 'ur' ? 'زبان اردو میں تبدیل ہو گئی' : 'Language updated to English');
      setActiveModal(null);
      loadSettings();
    } catch (e) {}
  };

  // 6. SAVE PRIVACY SETTINGS
  const handleSavePrivacy = async () => {
    try {
      setPrivacySaving(true);
      const res = await fetch('/api/settings/privacy', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(privacyState),
      });
      if (res.ok) {
        showToast(isUr ? 'پرائیویسی ترتیبات محفوظ ہوگئیں!' : 'Privacy settings saved successfully!');
        setActiveModal(null);
        loadSettings();
      }
    } catch (err) {
      showToast('Error saving privacy settings.');
    } finally {
      setPrivacySaving(false);
    }
  };

  // 7. SAVE NOTIFICATIONS
  const handleSaveNotifications = async (updated: typeof notifState) => {
    try {
      setNotifSaving(true);
      setNotifState(updated);
      const res = await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        showToast(isUr ? 'اطلاعات کی ترجیحات محفوظ ہوگئیں!' : 'Notification preferences saved!');
      }
    } catch (err) {
      showToast('Error saving notifications.');
    } finally {
      setNotifSaving(false);
    }
  };

  // 8. LOGOUT
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      router.push('/login');
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#070514] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF2E74]" />
          <p className="text-xs text-white/60">{isUr ? 'ترتیبات لوڈ ہو رہی ہیں...' : 'Loading settings...'}</p>
        </div>
      </div>
    );
  }

  const isPinActive = data.security.isPinEnabled;

  return (
    <main className="min-h-screen bg-[#070514] text-white flex justify-center py-0 sm:py-8 px-0 sm:px-4">
      {/* Phone Mockup Frame Container (matches 02_07_settings_pin_blacklist.png) */}
      <div className="w-full sm:max-w-md bg-gradient-to-b from-[#180E35] via-[#0E0922] to-[#070514] sm:rounded-[40px] sm:border-[8px] sm:border-[#22173F] sm:shadow-[0_0_80px_rgba(168,85,247,0.25)] flex flex-col min-h-screen sm:min-h-[860px] overflow-hidden relative">

        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#FF2E74] text-white text-xs font-bold shadow-lg shadow-[#FF2E74]/40 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Check className="w-3.5 h-3.5" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 1. Top Bar Header (matches 02_07 reference) */}
        <div className="pt-4 px-5 pb-3 flex items-center justify-between border-b border-white/10 z-10 bg-black/20">
          <Link
            href="/profile"
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <h1 className="text-base font-bold text-white tracking-wide">
            {isUr ? 'ترتیبات' : 'Settings'}
          </h1>

          <div className="w-9" />
        </div>

        {/* 2. Settings Menu List (matches 02_07 reference screenshot meticulously) */}
        <div className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">

          {/* ITEM 1: Account & Security */}
          <button
            type="button"
            onClick={() => setActiveModal('account')}
            className="w-full p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 flex items-center justify-between text-left transition-all group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  {isUr ? 'اکاؤنٹ اور سیکیورٹی' : 'Account & Security'}
                </span>
                <span className="text-[10px] text-white/50 block">
                  {data.account.nickname} • ID: {data.account.poppoId}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
          </button>

          {/* ITEM 2: PIN Lock (with pink toggle switch in reference) */}
          <div className="w-full p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between transition-all">
            <button
              type="button"
              onClick={() => {
                setPinError(null);
                setPinInput('');
                setConfirmPinInput('');
                setCurrentPinInput('');
                setPasswordInput('');
                if (isPinActive) {
                  setActiveModal('pin_menu');
                } else {
                  setActiveModal('pin_set');
                }
              }}
              className="flex items-center gap-3.5 flex-1 text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center text-[#FF2E74]">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  {isUr ? 'سیکیورٹی پن لاک' : 'PIN Lock'}
                </span>
                <span className="text-[10px] text-white/50 block">
                  {isPinActive ? (isUr ? 'فعال (تبدیل / ہٹانے کے لیے ٹیپ کریں)' : 'Enabled (Tap to change or remove)') : (isUr ? 'غیر فعال' : 'Disabled')}
                </span>
              </div>
            </button>

            {/* Pink Toggle Switch (matching 02_07 screenshot) */}
            <button
              type="button"
              onClick={() => {
                setPinError(null);
                if (isPinActive) {
                  setActiveModal('pin_menu');
                } else {
                  setActiveModal('pin_set');
                }
              }}
              className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out relative ${
                isPinActive ? 'bg-[#FF2E74]' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                  isPinActive ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* ITEM 3: Language */}
          <button
            type="button"
            onClick={() => setActiveModal('language')}
            className="w-full p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 flex items-center justify-between text-left transition-all group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                <Globe className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white">
                {isUr ? 'زبان' : 'Language'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/50">
              <span>{lang === 'ur' ? 'اردو' : 'English'}</span>
              <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
            </div>
          </button>

          {/* ITEM 4: Privacy */}
          <button
            type="button"
            onClick={() => setActiveModal('privacy')}
            className="w-full p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 flex items-center justify-between text-left transition-all group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                <Droplet className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white">
                {isUr ? 'رازداری (Privacy)' : 'Privacy'}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
          </button>

          {/* ITEM 5: Blacklist (with count badge matching 02_07 reference) */}
          <Link
            href="/settings/blacklist"
            className="w-full p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 flex items-center justify-between text-left transition-all group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
                <Slash className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white">
                {isUr ? 'بلیک لسٹ' : 'Blacklist'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[11px] font-bold text-white/70">
                {data.blacklist.count}
              </span>
              <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
            </div>
          </Link>

          {/* ITEM 6: Notifications (with pink toggle switch in reference) */}
          <div className="w-full p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between transition-all">
            <button
              type="button"
              onClick={() => setActiveModal('notifications')}
              className="flex items-center gap-3.5 flex-1 text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  {isUr ? 'اطلاعات (Notifications)' : 'Notifications'}
                </span>
                <span className="text-[10px] text-white/50 block">
                  {notifState.account && notifState.security ? (isUr ? 'فعال' : 'Enabled') : (isUr ? 'ترمیم کے لیے ٹیپ کریں' : 'Customized')}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                const next = !notifState.account;
                handleSaveNotifications({
                  account: next,
                  security: next,
                  system: next,
                  promotional: notifState.promotional,
                });
              }}
              className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out relative ${
                notifState.account ? 'bg-[#FF2E74]' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                  notifState.account ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* ITEM 7: Appearance */}
          <div className="w-full p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between transition-all">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Moon className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white">
                {isUr ? 'ظاہری شکل' : 'Appearance'}
              </span>
            </div>
            <span className="text-xs text-white/50">{isUr ? 'ڈارک تھیم' : 'Dark'}</span>
          </div>

          {/* ITEM 8: About */}
          <Link
            href="/policies"
            className="w-full p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 flex items-center justify-between text-left transition-all group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <Info className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white">
                {isUr ? 'پوپو لائیو کے بارے میں' : 'About'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/50">
              <span>v4.2.0</span>
              <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
            </div>
          </Link>

          {/* ITEM 9: Logout Button */}
          <button
            type="button"
            onClick={() => setActiveModal('logout')}
            className="w-full p-4 rounded-2xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 flex items-center justify-between text-left transition-all mt-4 group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform">
                <LogOut className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-red-400">
                {isUr ? 'لاگ آؤٹ' : 'Log Out'}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-red-400/50" />
          </button>
        </div>

      </div>

      {/* MODAL 1: ACCOUNT & SECURITY MODAL */}
      {activeModal === 'account' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#181135] border border-white/15 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2 text-indigo-400">
                <Shield className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">{isUr ? 'اکاؤنٹ کی تفصیلات' : 'Account Information'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs mb-5">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-white/50">{isUr ? 'یوزر آئی ڈی' : 'User ID'}</span>
                <span className="font-mono font-bold text-white">{data.account.poppoId}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-white/50">{isUr ? 'نک نیم' : 'Nickname'}</span>
                <span className="font-bold text-white">{data.account.nickname}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-white/50">{isUr ? 'ای میل' : 'Email'}</span>
                <span className="text-white/80">{data.account.email || 'Not connected'}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-white/50">{isUr ? 'فون نمبر' : 'Phone'}</span>
                <span className="text-white/80">{data.account.phone || 'Not connected'}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-white/50">{isUr ? 'ملک' : 'Country'}</span>
                <span className="text-white/80">{data.account.country}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/50">{isUr ? 'شمولیت کی تاریخ' : 'Member Since'}</span>
                <span className="text-white/80">{data.account.memberSince}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Link
                href="/profile/edit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FF2E74] to-[#A855F7] text-white text-xs font-bold text-center block shadow-md"
              >
                {isUr ? 'پروفائل میں ترمیم کریں' : 'Edit Profile'}
              </Link>
              <Link
                href="/user-id"
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold text-center block transition-colors"
              >
                {isUr ? 'فعال ڈیوائسز اور سیشنز' : 'Active Devices & Sessions'}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PIN OPTIONS MENU (When PIN already enabled) */}
      {activeModal === 'pin_menu' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#181135] border border-white/15 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2 text-[#FF2E74]">
                <Lock className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">{isUr ? 'سیکیورٹی پن کے اختیارات' : 'Security PIN Options'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setPinError(null);
                  setCurrentPinInput('');
                  setPinInput('');
                  setConfirmPinInput('');
                  setActiveModal('pin_change');
                }}
                className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-left text-xs font-bold text-white flex items-center justify-between transition-colors"
              >
                <span>{isUr ? 'سیکیورٹی پن تبدیل کریں' : 'Change Security PIN'}</span>
                <ChevronRight className="w-4 h-4 text-white/50" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setPinError(null);
                  setPinInput('');
                  setActiveModal('pin_verify');
                }}
                className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-left text-xs font-bold text-white flex items-center justify-between transition-colors"
              >
                <span>{isUr ? 'سیکیورٹی پن ٹیسٹ کریں' : 'Verify / Test Security PIN'}</span>
                <ChevronRight className="w-4 h-4 text-white/50" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setPinError(null);
                  setPasswordInput('');
                  setPinInput('');
                  setConfirmPinInput('');
                  setActiveModal('pin_reset');
                }}
                className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-left text-xs font-bold text-amber-300 flex items-center justify-between transition-colors"
              >
                <span>{isUr ? 'پن بھول گئے؟ اکاؤنٹ پاس ورڈ سے ری سیٹ کریں' : 'Forgot PIN? Reset via Password'}</span>
                <ChevronRight className="w-4 h-4 text-white/50" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: SET NEW SECURITY PIN */}
      {activeModal === 'pin_set' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#181135] border border-white/15 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2 text-[#FF2E74]">
                <KeyRound className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">{isUr ? 'سیکیورٹی پن سیٹ کریں' : 'Set Security PIN'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {pinError && (
              <div className="mb-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <form onSubmit={handleSetPin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  {isUr ? '4 تا 6 ہندسوں کا نیا پن درج کریں' : 'Enter 4-6 Digit Numeric PIN'}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 1234"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm text-center tracking-widest text-white focus:outline-none focus:border-[#FF2E74]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  {isUr ? 'پن کی تصدیق کریں' : 'Confirm Security PIN'}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Repeat PIN"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm text-center tracking-widest text-white focus:outline-none focus:border-[#FF2E74]"
                />
              </div>

              <button
                type="submit"
                disabled={pinLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FF2E74] to-[#A855F7] text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md mt-4"
              >
                {pinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>{isUr ? 'پن محفوظ کریں' : 'Save Security PIN'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CHANGE SECURITY PIN */}
      {activeModal === 'pin_change' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#181135] border border-white/15 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2 text-[#FF2E74]">
                <KeyRound className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">{isUr ? 'سیکیورٹی پن تبدیل کریں' : 'Change Security PIN'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {pinError && (
              <div className="mb-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <form onSubmit={handleChangePin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  {isUr ? 'موجودہ سیکیورٹی پن' : 'Current Security PIN'}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm text-center tracking-widest text-white focus:outline-none focus:border-[#FF2E74]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  {isUr ? 'نیا سیکیورٹی پن (4-6 ہندسے)' : 'New Security PIN (4-6 digits)'}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm text-center tracking-widest text-white focus:outline-none focus:border-[#FF2E74]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  {isUr ? 'نئے پن کی تصدیق کریں' : 'Confirm New PIN'}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm text-center tracking-widest text-white focus:outline-none focus:border-[#FF2E74]"
                />
              </div>

              <button
                type="submit"
                disabled={pinLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FF2E74] to-[#A855F7] text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md mt-4"
              >
                {pinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>{isUr ? 'پن تبدیل کریں' : 'Update Security PIN'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: VERIFY PIN TEST */}
      {activeModal === 'pin_verify' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#181135] border border-white/15 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">{isUr ? 'پن کی تصدیق کریں' : 'Verify Security PIN'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {pinError && (
              <div className="mb-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyPin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  {isUr ? 'اپنا سیکیورٹی پن درج کریں' : 'Enter Your Security PIN'}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm text-center tracking-widest text-white focus:outline-none focus:border-emerald-400"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={pinLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md mt-4"
              >
                {pinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>{isUr ? 'تصدیق کریں' : 'Verify PIN'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: RESET OR REMOVE PIN (VIA PASSWORD) */}
      {activeModal === 'pin_reset' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#181135] border border-white/15 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2 text-amber-400">
                <Lock className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">{isUr ? 'پن ریکوری / ہٹائیں' : 'Reset or Remove PIN'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {pinError && (
              <div className="mb-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  {isUr ? 'اکاؤنٹ کا پاس ورڈ درج کریں' : 'Enter Account Password'}
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Current Password"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white focus:outline-none focus:border-[#FF2E74]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  {isUr ? 'نیا سیکیورٹی پن (اگر نیا پن رکھنا ہے)' : 'New PIN (If setting new)'}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Optional 4-6 digits"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white focus:outline-none focus:border-[#FF2E74]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  {isUr ? 'نئے پن کی تصدیق کریں' : 'Confirm New PIN'}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Confirm 4-6 digits"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white focus:outline-none focus:border-[#FF2E74]"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  disabled={pinLoading || !passwordInput}
                  onClick={() => handleResetOrRemovePin(true)}
                  className="w-1/2 py-2.5 rounded-xl bg-red-600/30 hover:bg-red-600/50 text-red-300 text-xs font-bold border border-red-500/30 transition-colors disabled:opacity-50"
                >
                  {isUr ? 'پن ختم کریں' : 'Remove PIN'}
                </button>

                <button
                  type="button"
                  disabled={pinLoading || !passwordInput || !pinInput}
                  onClick={() => handleResetOrRemovePin(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2E74] to-[#A855F7] text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isUr ? 'نیا پن لگائیں' : 'Save New PIN'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: LANGUAGE SELECTION */}
      {activeModal === 'language' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#181135] border border-white/15 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2 text-purple-400">
                <Globe className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">{isUr ? 'زبان منتخب کریں' : 'Select Language'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleLanguageSelect('en')}
                className={`w-full py-3 px-4 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-colors ${
                  lang === 'en'
                    ? 'bg-gradient-to-r from-[#FF2E74]/20 to-[#A855F7]/20 border border-[#FF2E74] text-white'
                    : 'bg-white/5 hover:bg-white/10 text-white/80'
                }`}
              >
                <span>English (US / Global)</span>
                {lang === 'en' && <Check className="w-4 h-4 text-[#FF2E74]" />}
              </button>

              <button
                type="button"
                onClick={() => handleLanguageSelect('ur')}
                className={`w-full py-3 px-4 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-colors ${
                  lang === 'ur'
                    ? 'bg-gradient-to-r from-[#FF2E74]/20 to-[#A855F7]/20 border border-[#FF2E74] text-white'
                    : 'bg-white/5 hover:bg-white/10 text-white/80'
                }`}
              >
                <span>اردو (Urdu)</span>
                {lang === 'ur' && <Check className="w-4 h-4 text-[#FF2E74]" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8: PRIVACY SETTINGS */}
      {activeModal === 'privacy' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#181135] border border-white/15 p-5 shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4 sticky top-0 bg-[#181135] z-10">
              <div className="flex items-center gap-2 text-cyan-400">
                <Droplet className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">{isUr ? 'رازداری کی ترتیبات' : 'Privacy Settings'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-white/80 mb-1">
                  {isUr ? 'پروفائل کون دیکھ سکتا ہے؟' : 'Who can view your profile?'}
                </label>
                <select
                  value={privacyState.profileVisibility}
                  onChange={(e) => setPrivacyState({ ...privacyState, profileVisibility: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-[#FF2E74]"
                >
                  <option value="everyone" className="bg-[#181135]">Everyone</option>
                  <option value="followers" className="bg-[#181135]">Followers Only</option>
                  <option value="only_me" className="bg-[#181135]">Only Me</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-white/80 mb-1">
                  {isUr ? 'تاریخ پیدائش کون دیکھ سکتا ہے؟' : 'Who can view your birthday?'}
                </label>
                <select
                  value={privacyState.birthdayVisibility}
                  onChange={(e) => setPrivacyState({ ...privacyState, birthdayVisibility: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-[#FF2E74]"
                >
                  <option value="only_me" className="bg-[#181135]">Only Me (Private)</option>
                  <option value="followers" className="bg-[#181135]">Followers Only</option>
                  <option value="everyone" className="bg-[#181135]">Everyone</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-white/80 mb-1">
                  {isUr ? 'جنس کون دیکھ سکتا ہے؟' : 'Who can view your gender?'}
                </label>
                <select
                  value={privacyState.genderVisibility}
                  onChange={(e) => setPrivacyState({ ...privacyState, genderVisibility: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-[#FF2E74]"
                >
                  <option value="everyone" className="bg-[#181135]">Everyone</option>
                  <option value="followers" className="bg-[#181135]">Followers Only</option>
                  <option value="only_me" className="bg-[#181135]">Only Me</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-white/80 mb-1">
                  {isUr ? 'آن لائن حیثیت کون دیکھ سکتا ہے؟' : 'Who can view online status?'}
                </label>
                <select
                  value={privacyState.onlineStatusVisibility}
                  onChange={(e) => setPrivacyState({ ...privacyState, onlineStatusVisibility: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-[#FF2E74]"
                >
                  <option value="everyone" className="bg-[#181135]">Everyone</option>
                  <option value="followers" className="bg-[#181135]">Followers Only</option>
                  <option value="only_me" className="bg-[#181135]">Only Me</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-white/80 mb-1">
                  {isUr ? 'فالو کی اجازت' : 'Follow Permissions'}
                </label>
                <select
                  value={privacyState.followPermissions}
                  onChange={(e) => setPrivacyState({ ...privacyState, followPermissions: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-[#FF2E74]"
                >
                  <option value="everyone" className="bg-[#181135]">Everyone (Instant Follow)</option>
                  <option value="approval_required" className="bg-[#181135]">Approval Required</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleSavePrivacy}
                disabled={privacySaving}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FF2E74] to-[#A855F7] text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md mt-4"
              >
                {privacySaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>{isUr ? 'پرائیویسی ترتیبات محفوظ کریں' : 'Save Privacy Settings'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 9: NOTIFICATION PREFERENCES */}
      {activeModal === 'notifications' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#181135] border border-white/15 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2 text-amber-400">
                <Bell className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">{isUr ? 'اطلاعات کی ترجیحات' : 'Notification Preferences'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {[
                { id: 'account', label: isUr ? 'اکاؤنٹ کی سرگرمیاں' : 'Account Notifications', desc: 'Login alerts and security notices' },
                { id: 'security', label: isUr ? 'سیکیورٹی الرٹس' : 'Security Notifications', desc: 'PIN changes and new devices' },
                { id: 'system', label: isUr ? 'سسٹم اعلانات' : 'System Announcements', desc: 'Maintenance and updates' },
                { id: 'promotional', label: isUr ? 'پروموشنز اور آفرز' : 'Promotional Offers', desc: 'Discounts and stream events' },
              ].map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">{item.label}</p>
                    <p className="text-[10px] text-white/50">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...notifState, [item.id]: !((notifState as any)[item.id]) };
                      handleSaveNotifications(updated);
                    }}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors relative ${
                      (notifState as any)[item.id] ? 'bg-[#FF2E74]' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                        (notifState as any)[item.id] ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors mt-2"
              >
                {isUr ? 'بند کریں' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 10: LOGOUT CONFIRMATION */}
      {activeModal === 'logout' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#181135] border border-white/15 p-6 shadow-2xl text-center">
            <LogOut className="w-10 h-10 text-red-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-white mb-1">
              {isUr ? 'لاگ آؤٹ کی تصدیق کریں' : 'Log Out of Popo Live?'}
            </h3>
            <p className="text-xs text-white/60 mb-5 leading-relaxed">
              {isUr
                ? 'کیا آپ واقعی اپنے اکاؤنٹ سے لاگ آؤٹ کرنا چاہتے ہیں؟'
                : 'Are you sure you want to end your active session on this device?'}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-1/2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors"
              >
                {isUr ? 'منسوخ' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors shadow-md"
              >
                {isUr ? 'لاگ آؤٹ' : 'Confirm Logout'}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070514] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF2E74]" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
