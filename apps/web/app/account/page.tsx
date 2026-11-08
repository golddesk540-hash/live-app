'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/languageContext';
import {
  ArrowLeft,
  User,
  Shield,
  Lock,
  Globe,
  Sliders,
  Slash,
  HelpCircle,
  AlertOctagon,
  LogOut,
  Copy,
  Check,
  Edit3,
  KeyRound,
  Laptop,
  CheckCircle2,
  Clock,
  Smartphone,
  Monitor,
  Menu,
  X,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronRight,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Bell,
  Radio,
} from 'lucide-react';

interface AccountData {
  id: string;
  poppoId: string;
  nickname: string;
  avatarUrl: string;
  email: string | null;
  phone: string | null;
  gender: string;
  birthdate: string | null;
  country: string;
  countryCode: string;
  bio: string;
  hostLevel: number;
  wealthLevel: number;
  status: string;
  createdAt: string;
  profileCompletionPercent: number;
  isProfileCompleted: boolean;
}

interface VerificationData {
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isAdultVerified: boolean;
  status: string;
}

interface SecurityData {
  hasPassword: boolean;
  isPinEnabled: boolean;
  isPinLocked: boolean;
  activeSessionsCount: number;
  lastLogin: {
    timestamp: string;
    browser: string;
    os: string;
    device: string;
    location: string;
  } | null;
}

interface PreferencesData {
  language: string;
  timezone: string;
  displayTheme: string;
  streamQuality: string;
}

interface SessionItem {
  id: string;
  isCurrent: boolean;
  deviceType: string;
  browserName: string;
  osName: string;
  location: string;
  ipMasked: string;
  createdAt: string;
  lastActiveAt: string;
}

interface ActivityItem {
  id: string;
  activity_type: string;
  title: string;
  location: string;
  device_type: string;
  browser_name: string;
  os_name: string;
  last_active_at: string;
  created_at: string;
  is_active: boolean;
}

function WebAccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isUr, toggleLang, setLang, lang } = useLanguage();

  const [activeTab, setActiveTab] = useState<string>(searchParams.get('tab') || 'overview');
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Account State
  const [account, setAccount] = useState<AccountData | null>(null);
  const [verification, setVerification] = useState<VerificationData | null>(null);
  const [security, setSecurity] = useState<SecurityData | null>(null);
  const [preferences, setPreferences] = useState<PreferencesData | null>(null);
  const [privacy, setPrivacy] = useState<any>(null);
  const [stats, setStats] = useState<{ blacklistCount: number; openTicketsCount: number }>({
    blacklistCount: 0,
    openTicketsCount: 0,
  });

  // Sessions & Activities
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Edit Profile Form
  const [editForm, setEditForm] = useState({
    nickname: '',
    bio: '',
    gender: 'unspecified',
    country: 'Pakistan',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Change Password Form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Show "Continue to Web" banner from reference 02_09_web_account.png
  const [showWebAccountHero, setShowWebAccountHero] = useState(true);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadAccountData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/account');
      if (res.status === 401) {
        router.push('/login?redirect=/account');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setAccount(data.account);
        setVerification(data.verification);
        setSecurity(data.security);
        setPreferences(data.preferences);
        setPrivacy(data.privacy);
        setStats(data.stats || { blacklistCount: 0, openTicketsCount: 0 });

        setEditForm({
          nickname: data.account.nickname || '',
          bio: data.account.bio || '',
          gender: data.account.gender || 'unspecified',
          country: data.account.country || 'Pakistan',
        });
      }
    } catch (err) {
      console.error('Failed to load account:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      setSessionsLoading(true);
      const [sessRes, actRes] = await Promise.all([
        fetch('/api/account/sessions').then((r) => r.json()),
        fetch('/api/account/activity').then((r) => r.json()),
      ]);
      if (sessRes.success) setSessions(sessRes.sessions || []);
      if (actRes.success) setActivities(actRes.activities || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    loadAccountData();
  }, []);

  useEffect(() => {
    if (activeTab === 'sessions' || activeTab === 'activity') {
      loadSessions();
    }
  }, [activeTab]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    showToast(isUr ? 'یوزر آئی ڈی کاپی ہو گئی!' : 'User ID copied to clipboard!');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update profile.');
      }
      showToast(isUr ? 'پروفائل کامیابی سے اپ ڈیٹ ہو گئی!' : 'Profile updated successfully!');
      loadAccountData();
      setActiveTab('overview');
    } catch (err: any) {
      alert(err.message || 'Error updating profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert(isUr ? 'نئے پاس ورڈ میل نہیں کھاتے۔' : 'New passwords do not match.');
      return;
    }
    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/account/password/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to change password.');
      }
      showToast(isUr ? 'پاس ورڈ کامیابی سے تبدیل ہو گیا!' : 'Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setActiveTab('overview');
    } catch (err: any) {
      alert(err.message || 'Error updating password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogoutAllOther = async () => {
    if (!confirm(isUr ? 'کیا آپ تمام دیگر ڈیوائسز سے لاگ آؤٹ کرنا چاہتے ہیں؟' : 'Are you sure you want to log out from all other active devices?')) {
      return;
    }
    try {
      const res = await fetch('/api/account/logout-all', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(isUr ? 'دیگر تمام سیشنز ختم کر دیے گئے ہیں!' : 'Logged out from all other sessions!');
        loadSessions();
        loadAccountData();
      }
    } catch (err) {
      alert('Failed to revoke sessions.');
    }
  };

  const handleLogout = async () => {
    if (!confirm(isUr ? 'کیا آپ واقعی لاگ آؤٹ کرنا چاہتے ہیں؟' : 'Are you sure you want to log out of your Popo Live account?')) {
      return;
    }
    try {
      await fetch('/api/account/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      router.push('/login');
    }
  };

  const formatDate = (isoStr: string) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleDateString(isUr ? 'ur-PK' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const navigationItems = [
    { id: 'overview', label_en: 'My Account', label_ur: 'میرا اکاؤنٹ', icon: User },
    { id: 'my_profile', label_en: 'My Profile', label_ur: 'میرا پروفائل', icon: User, href: '/profile' },
    { id: 'edit', label_en: 'Edit Profile', label_ur: 'پروفائل میں ترمیم', icon: Edit3 },
    { id: 'security', label_en: 'Account Security', label_ur: 'اکاؤنٹ سیکیورٹی', icon: Shield },
    { id: 'sessions', label_en: 'Login Sessions', label_ur: 'لاگ ان سیشنز', icon: Laptop },
    { id: 'privacy', label_en: 'Privacy Settings', label_ur: 'رازداری کی ترتیبات', icon: Lock },
    { id: 'preferences', label_en: 'Language & Preferences', label_ur: 'زبان اور ترجیحات', icon: Globe },
    { id: 'blacklist', label_en: 'Blacklist', label_ur: 'بلیک لسٹ', icon: Slash, href: '/settings/blacklist', badge: stats.blacklistCount },
    { id: 'help', label_en: 'Help Center', label_ur: 'ہیلپ سینٹر', icon: HelpCircle, href: '/help' },
    { id: 'tickets', label_en: 'My Support Tickets', label_ur: 'میری ٹکٹس', icon: Clock, href: '/help/my-tickets', badge: stats.openTicketsCount },
    { id: 'closure', label_en: 'Account Closure', label_ur: 'اکاؤنٹ بندش', icon: AlertOctagon, href: '/policies' },
  ];

  if (loading || !account) {
    return (
      <div className="min-h-screen bg-[#070514] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF2E74]" />
          <p className="text-xs text-white/60">{isUr ? 'اکاؤنٹ لوڈ ہو رہا ہے...' : 'Loading web account...'}</p>
        </div>
      </div>
    );
  }

  return (
    <main
      dir={isUr ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-[#070514] text-white selection:bg-[#ff2d55] selection:text-white pb-20 ${
        isUr ? 'font-urdu' : 'font-sans'
      }`}
    >
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-[#b81dff]/20 via-[#ff2d55]/15 to-transparent blur-3xl opacity-75" />
      </div>

      {/* TOAST NOTIFICATION */}
      {toastMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#FF2E74] text-white text-xs font-bold shadow-lg shadow-[#FF2E74]/40 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 bg-[#070514]/90 backdrop-blur-md border-b border-white/10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              className="lg:hidden w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white"
            >
              {mobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/profile" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
              <ArrowLeft className={`w-4 h-4 ${isUr ? 'rotate-180' : ''}`} />
              <span className="text-xs font-semibold hidden sm:inline">{isUr ? 'پروفائل' : 'Profile'}</span>
            </Link>

            <h1 className="text-base sm:text-lg font-bold text-white tracking-wide ml-2">
              {isUr ? 'ویب اکاؤنٹ مینجمنٹ' : 'Web Account'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleLang}
              className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white/90 flex items-center gap-1.5 transition-all"
            >
              <Globe className="w-3.5 h-3.5 text-pink-400" />
              <span>{isUr ? 'English' : 'اردو'}</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1 rounded-full bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isUr ? 'لاگ آؤٹ' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* DASHBOARD LAYOUT WITH SIDEBAR */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-4 sm:pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* SIDEBAR NAVIGATION (Desktop & Mobile Drawer) */}
          <aside
            className={`lg:col-span-3 ${
              mobileDrawerOpen
                ? 'fixed inset-y-0 left-0 z-50 w-72 bg-[#120c27] p-4 shadow-2xl overflow-y-auto block'
                : 'hidden lg:block'
            }`}
          >
            {mobileDrawerOpen && (
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <span className="text-sm font-bold text-white">{isUr ? 'نیویگیشن' : 'Account Menu'}</span>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1 rounded-full text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="p-3 rounded-3xl bg-[#140f2b]/90 border border-white/10 shadow-xl space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const label = isUr ? item.label_ur : item.label_en;

                if (item.href) {
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setMobileDrawerOpen(false)}
                      className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors group text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-white/50 group-hover:text-pink-400 transition-colors" />
                        <span className="text-xs font-semibold text-white/80 group-hover:text-white">
                          {label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-[10px] font-bold text-pink-300 border border-pink-500/30">
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight className={`w-3.5 h-3.5 text-white/30 group-hover:text-white ${isUr ? 'rotate-180' : ''}`} />
                      </div>
                    </Link>
                  );
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all text-left ${
                      isActive
                        ? 'bg-gradient-to-r from-pink-600/30 to-purple-600/20 border border-pink-500/40 text-white font-bold shadow-md'
                        : 'hover:bg-white/5 text-white/70 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-pink-400' : 'text-white/50'}`} />
                      <span className="text-xs font-semibold">{label}</span>
                    </div>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-pink-400 shadow-[0_0_6px_#ff2d55]" />}
                  </button>
                );
              })}

              <div className="pt-2 border-t border-white/5 mt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl text-rose-400 hover:bg-rose-500/10 transition-colors text-left text-xs font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{isUr ? 'لاگ آؤٹ' : 'Logout Session'}</span>
                </button>
              </div>
            </div>
          </aside>

          {/* MAIN DASHBOARD CONTENT AREA */}
          <div className="lg:col-span-9 space-y-6">

            {/* REFERENCE HERO BANNER (02_09_web_account.png) */}
            {showWebAccountHero && (
              <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#1a113d] via-[#120a2a] to-[#0d0720] border border-pink-500/30 shadow-2xl overflow-hidden animate-in fade-in">
                <button
                  type="button"
                  onClick={() => setShowWebAccountHero(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                  title="Dismiss Banner"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                  {/* Laptop Icon illustration matching reference */}
                  <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-br from-pink-500/20 to-purple-600/20 border border-white/15 flex items-center justify-center p-4 shadow-xl shrink-0 group">
                    <Laptop className="w-16 h-16 sm:w-20 sm:h-20 text-pink-400 group-hover:scale-105 transition-transform" />
                  </div>

                  <div className="space-y-3 text-center sm:text-left flex-1">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                      {isUr ? 'یہ آپ کا پوپو لائیو ویب اکاؤنٹ ہے' : 'This is your Popo Live web account.'}
                    </h2>

                    <div className="space-y-2 text-xs sm:text-sm text-white/80">
                      <div className="flex items-center gap-2.5 justify-center sm:justify-start">
                        <div className="w-4 h-4 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-400 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        <span>{isUr ? 'ویب براؤزر پر اپنا اکاؤنٹ استعمال کریں' : 'Use your account on web browser'}</span>
                      </div>
                      <div className="flex items-center gap-2.5 justify-center sm:justify-start">
                        <div className="w-4 h-4 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-400 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        <span>{isUr ? 'اپنے پروفائل اور ترتیبات تک رسائی حاصل کریں' : 'Access your profile and settings'}</span>
                      </div>
                      <div className="flex items-center gap-2.5 justify-center sm:justify-start">
                        <div className="w-4 h-4 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-400 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        <span>{isUr ? 'ویب پر لائیو اسٹریمنگ سے لطف اندوز ہوں' : 'Enjoy live streaming on web'}</span>
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveTab('overview')}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-xs font-bold text-white shadow-lg shadow-pink-600/30 transition-transform active:scale-95 inline-flex items-center gap-2"
                      >
                        <Laptop className="w-4 h-4" />
                        <span>{isUr ? 'ویب ڈیش بورڈ جاری رکھیں' : 'Continue to Web Dashboard'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 1: MY ACCOUNT OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">

                {/* USER PROFILE SUMMARY CARD */}
                <div className="p-6 rounded-3xl bg-[#140f2b] border border-white/10 shadow-xl space-y-5">
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    <img
                      src={account.avatarUrl}
                      alt={account.nickname}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-pink-500/50 shadow-lg shadow-pink-500/20"
                    />

                    <div className="space-y-1.5 text-center sm:text-left flex-1">
                      <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                        <h2 className="text-lg sm:text-xl font-bold text-white">{account.nickname}</h2>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                          {account.status}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                          Lv.{account.hostLevel}
                        </span>
                      </div>

                      {/* Numeric User ID with copy button */}
                      <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <span className="text-xs text-white/50">{isUr ? 'یوزر آئی ڈی:' : 'User ID:'}</span>
                        <span className="font-mono text-xs font-bold text-pink-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                          {account.poppoId}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(account.poppoId)}
                          className="p-1 rounded text-white/40 hover:text-white"
                          title="Copy User ID"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-xs text-white/60">
                        {account.country} • {isUr ? 'ممبر از' : 'Member since'} {formatDate(account.createdAt)}
                      </p>
                    </div>

                    <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setActiveTab('edit')}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-pink-400" />
                        <span>{isUr ? 'پروفائل تبدیل کریں' : 'Edit Profile'}</span>
                      </button>

                      <Link
                        href="/profile"
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-pink-600/30 hover:bg-pink-600/40 border border-pink-500/40 text-xs font-semibold text-pink-300 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{isUr ? 'پروفائل پیج' : 'View Profile'}</span>
                      </Link>
                    </div>
                  </div>

                  {/* Profile Completion Bar */}
                  <div className="pt-4 border-t border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/60">{isUr ? 'پروفائل کی تکمیل:' : 'Profile Completion:'}</span>
                      <span className="font-bold text-pink-400">{account.profileCompletionPercent}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 transition-all duration-500"
                        style={{ width: `${account.profileCompletionPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* VERIFICATION & SECURITY OVERVIEW TILES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Tile 1: Email Verification */}
                  <div className="p-4 rounded-2xl bg-[#140f2b] border border-white/10 space-y-2">
                    <span className="text-[11px] font-semibold text-white/50">{isUr ? 'ای میل تصدیق' : 'Email Verification'}</span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate max-w-[130px]">
                        {account.email || 'None'}
                      </span>
                      {verification?.isEmailVerified ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          Verified
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                          Unverified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tile 2: Phone Verification */}
                  <div className="p-4 rounded-2xl bg-[#140f2b] border border-white/10 space-y-2">
                    <span className="text-[11px] font-semibold text-white/50">{isUr ? 'فون نمبر' : 'Phone Number'}</span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate max-w-[130px]">
                        {account.phone || 'Not Linked'}
                      </span>
                      {verification?.isPhoneVerified ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          Verified
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tile 3: Security PIN */}
                  <div className="p-4 rounded-2xl bg-[#140f2b] border border-white/10 space-y-2">
                    <span className="text-[11px] font-semibold text-white/50">{isUr ? 'سیکیورٹی پن' : 'Security PIN'}</span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        {security?.isPinEnabled ? 'PIN Active' : 'Not Set'}
                      </span>
                      {security?.isPinEnabled ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          Enabled
                        </span>
                      ) : (
                        <Link
                          href="/settings"
                          className="text-[10px] font-bold text-pink-400 hover:text-pink-300"
                        >
                          Enable PIN →
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Tile 4: Active Sessions */}
                  <div className="p-4 rounded-2xl bg-[#140f2b] border border-white/10 space-y-2">
                    <span className="text-[11px] font-semibold text-white/50">{isUr ? 'ایکٹو سیشنز' : 'Active Sessions'}</span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        {security?.activeSessionsCount || 1} {isUr ? 'ڈیوائسز' : 'devices'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('sessions')}
                        className="text-[10px] font-bold text-pink-400 hover:text-pink-300"
                      >
                        Manage →
                      </button>
                    </div>
                  </div>
                </div>

                {/* LAST LOGIN BANNER */}
                {security?.lastLogin && (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs text-white/70">
                    <div className="flex items-center gap-2.5">
                      <Monitor className="w-4 h-4 text-pink-400 shrink-0" />
                      <span>
                        {isUr ? 'آخری لاگ ان:' : 'Last Login:'} {security.lastLogin.browser} on {security.lastLogin.os} ({security.lastLogin.location})
                      </span>
                    </div>
                    <span className="text-[11px] text-white/50">
                      {formatDate(security.lastLogin.timestamp)}
                    </span>
                  </div>
                )}

                {/* QUICK SHORTCUTS GRID */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('security')}
                    className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-center transition-colors group"
                  >
                    <KeyRound className="w-5 h-5 text-pink-400 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-white">{isUr ? 'پاس ورڈ تبدیل کریں' : 'Change Password'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('sessions')}
                    className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-center transition-colors group"
                  >
                    <Laptop className="w-5 h-5 text-purple-400 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-white">{isUr ? 'سیشنز کنٹرول' : 'Manage Sessions'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('privacy')}
                    className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-center transition-colors group"
                  >
                    <Lock className="w-5 h-5 text-cyan-400 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-white">{isUr ? 'رازداری ترتیبات' : 'Privacy Settings'}</span>
                  </button>

                  <Link
                    href="/help"
                    className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-center transition-colors group block"
                  >
                    <HelpCircle className="w-5 h-5 text-emerald-400 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-white">{isUr ? 'ہیلپ سینٹر' : 'Help Center'}</span>
                  </Link>
                </div>

              </div>
            )}

            {/* TAB 2: EDIT PROFILE */}
            {activeTab === 'edit' && (
              <div className="p-6 rounded-3xl bg-[#140f2b] border border-white/10 shadow-xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h2 className="text-base font-bold text-white">{isUr ? 'اکاؤنٹ اور پروفائل کی معلومات' : 'Edit Profile Information'}</h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    className="text-xs text-white/50 hover:text-white"
                  >
                    {isUr ? 'منسوخ' : 'Cancel'}
                  </button>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {/* Nickname */}
                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1.5">
                      {isUr ? 'عرفی نام (نک نیم)' : 'Nickname'}
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.nickname}
                      onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                      className="w-full py-2.5 px-3.5 rounded-xl bg-white/5 border border-white/15 focus:border-pink-500 focus:outline-none text-xs sm:text-sm text-white"
                    />
                  </div>

                  {/* Country & Gender */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-white/80 mb-1.5">
                        {isUr ? 'ملک' : 'Country'}
                      </label>
                      <input
                        type="text"
                        value={editForm.country}
                        onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                        className="w-full py-2.5 px-3.5 rounded-xl bg-white/5 border border-white/15 focus:border-pink-500 focus:outline-none text-xs sm:text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white/80 mb-1.5">
                        {isUr ? 'جنس' : 'Gender'}
                      </label>
                      <select
                        value={editForm.gender}
                        onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                        className="w-full py-2.5 px-3.5 rounded-xl bg-[#1d163d] border border-white/15 focus:border-pink-500 focus:outline-none text-xs sm:text-sm text-white"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="unspecified">Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  {/* Short Bio */}
                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1.5">
                      {isUr ? 'مختصر بائیو' : 'Short Bio'}
                    </label>
                    <textarea
                      rows={3}
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      placeholder="Share a short introduction about yourself..."
                      className="w-full py-2.5 px-3.5 rounded-xl bg-white/5 border border-white/15 focus:border-pink-500 focus:outline-none text-xs sm:text-sm text-white resize-y"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-xs font-bold text-white shadow-md shadow-pink-600/30 transition-all disabled:opacity-50"
                    >
                      {isSavingProfile ? (isUr ? 'محفوظ کیا جا رہا ہے...' : 'Saving...') : (isUr ? 'تبدیلیاں محفوظ کریں' : 'Save Changes')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 3: ACCOUNT SECURITY */}
            {activeTab === 'security' && (
              <div className="space-y-4">
                <div className="p-6 rounded-3xl bg-[#140f2b] border border-white/10 shadow-xl space-y-5">
                  <h2 className="text-base font-bold text-white pb-3 border-b border-white/10">
                    {isUr ? 'پاس ورڈ اور سیکیورٹی کی ترتیبات' : 'Security Management'}
                  </h2>

                  {/* Change Password Form */}
                  <form onSubmit={handleChangePassword} className="space-y-3.5 max-w-md">
                    <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider">
                      {isUr ? 'پاس ورڈ تبدیل کریں' : 'Change Account Password'}
                    </h3>

                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1">
                        {isUr ? 'موجودہ پاس ورڈ' : 'Current Password'}
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="w-full py-2 px-3 rounded-xl bg-white/5 border border-white/15 focus:border-pink-500 focus:outline-none text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1">
                        {isUr ? 'نیا پاس ورڈ' : 'New Password (min. 8 characters)'}
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full py-2 px-3 rounded-xl bg-white/5 border border-white/15 focus:border-pink-500 focus:outline-none text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1">
                        {isUr ? 'نئے پاس ورڈ کی تصدیق کریں' : 'Confirm New Password'}
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full py-2 px-3 rounded-xl bg-white/5 border border-white/15 focus:border-pink-500 focus:outline-none text-xs text-white"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="showPass"
                        checked={showPassword}
                        onChange={(e) => setShowPassword(e.target.checked)}
                        className="rounded accent-pink-500 cursor-pointer"
                      />
                      <label htmlFor="showPass" className="text-xs text-white/60 cursor-pointer">
                        {isUr ? 'پاس ورڈ دکھائیں' : 'Show Passwords'}
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="py-2.5 px-5 rounded-xl bg-pink-600 hover:bg-pink-500 text-xs font-bold text-white transition-colors disabled:opacity-50"
                    >
                      {isChangingPassword ? (isUr ? 'اپ ڈیٹ ہو رہا ہے...' : 'Updating...') : (isUr ? 'پاس ورڈ اپ ڈیٹ کریں' : 'Update Password')}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 4: LOGIN SESSIONS */}
            {activeTab === 'sessions' && (
              <div className="p-6 rounded-3xl bg-[#140f2b] border border-white/10 shadow-xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-white/10 flex-wrap gap-2">
                  <div>
                    <h2 className="text-base font-bold text-white">{isUr ? 'فعال لاگ ان سیشنز' : 'Active Login Sessions'}</h2>
                    <p className="text-xs text-white/50">{sessions.length} {isUr ? 'فعال ڈیوائسز جڑی ہوئی ہیں' : 'connected devices'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogoutAllOther}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-colors"
                  >
                    {isUr ? 'دیگر تمام ڈیوائسز سے لاگ آؤٹ' : 'Logout Other Devices'}
                  </button>
                </div>

                {sessionsLoading ? (
                  <div className="py-12 text-center text-white/50">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-pink-500 mb-2" />
                    <span className="text-xs">Loading sessions...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((s) => (
                      <div
                        key={s.id}
                        className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                          s.isCurrent
                            ? 'bg-[#1e1540] border-pink-500/40 shadow-lg'
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-pink-400">
                            {s.deviceType === 'mobile' ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">
                                {s.browserName} on {s.osName}
                              </span>
                              {s.isCurrent && (
                                <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30 text-[9px] font-bold">
                                  Current Device
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-white/50">
                              {s.location} • {s.ipMasked} • Active: {formatDate(s.lastActiveAt)}
                            </p>
                          </div>
                        </div>

                        {!s.isCurrent && (
                          <span className="text-xs text-emerald-400 font-semibold">Active</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: PRIVACY SETTINGS */}
            {activeTab === 'privacy' && (
              <div className="p-6 rounded-3xl bg-[#140f2b] border border-white/10 shadow-xl space-y-4">
                <h2 className="text-base font-bold text-white pb-3 border-b border-white/10">
                  {isUr ? 'رازداری اور نمائش کی ترتیبات' : 'Privacy Settings'}
                </h2>

                <div className="space-y-3">
                  {[
                    { label: isUr ? 'پروفائل کی نمائش' : 'Profile Visibility', desc: 'Allow public discovery on explore feed', val: privacy?.profile_visibility || 'Public' },
                    { label: isUr ? 'سالگرہ کی نمائش' : 'Birthday Visibility', desc: 'Show birthday on public profile', val: privacy?.birthday_visibility || 'Private' },
                    { label: isUr ? 'آن لائن حیثیت' : 'Online Status', desc: 'Display green active badge when live', val: privacy?.online_status_visibility || 'Public' },
                    { label: isUr ? 'پیغامات کے اختیارات' : 'Direct Messages', desc: 'Who can send direct chat messages', val: privacy?.message_permissions || 'Everyone' },
                  ].map((p, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-white">{p.label}</span>
                        <p className="text-[11px] text-white/50">{p.desc}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-white/10 text-xs font-semibold text-white/80">
                        {p.val}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <Link
                    href="/settings"
                    className="inline-flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300 font-semibold"
                  >
                    <span>{isUr ? 'مکمل ترتیبات تبدیل کریں →' : 'Edit Granular Settings in Account Settings →'}</span>
                  </Link>
                </div>
              </div>
            )}

            {/* TAB 6: PREFERENCES */}
            {activeTab === 'preferences' && (
              <div className="p-6 rounded-3xl bg-[#140f2b] border border-white/10 shadow-xl space-y-4">
                <h2 className="text-base font-bold text-white pb-3 border-b border-white/10">
                  {isUr ? 'ویب ترجیحات اور زبان' : 'Website Preferences'}
                </h2>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white">{isUr ? 'زبان' : 'Language'}</span>
                      <p className="text-[11px] text-white/50">{isUr ? 'انگریزی یا اردو منتخب کریں' : 'Choose English or Urdu'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleLang}
                      className="px-3.5 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-xs font-bold text-white"
                    >
                      {lang === 'ur' ? 'اردو (Urdu)' : 'English'}
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white">{isUr ? 'ٹائم زون' : 'Timezone'}</span>
                      <p className="text-[11px] text-white/50">{preferences?.timezone || 'Asia/Karachi (UTC+5)'}</p>
                    </div>
                    <span className="text-xs text-white/70">PKT (UTC+5)</span>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white">{isUr ? 'اسٹریم ویڈیو کوالٹی' : 'Streaming Video Quality'}</span>
                      <p className="text-[11px] text-white/50">{isUr ? 'ڈیفالٹ ریزولوشن' : 'Default resolution for live player'}</p>
                    </div>
                    <span className="text-xs font-semibold text-pink-400">1080p HD (Auto)</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: ACCOUNT ACTIVITY */}
            {activeTab === 'activity' && (
              <div className="p-6 rounded-3xl bg-[#140f2b] border border-white/10 shadow-xl space-y-4">
                <h2 className="text-base font-bold text-white pb-3 border-b border-white/10">
                  {isUr ? 'اکاؤنٹ کی سرگرمی اور لاگز' : 'Account Activity & Audit Log'}
                </h2>

                <div className="space-y-2.5">
                  {activities.length === 0 ? (
                    <p className="text-xs text-white/50 py-6 text-center">No recent security events recorded.</p>
                  ) : (
                    activities.map((a, i) => (
                      <div key={i} className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white">{a.title}</span>
                            <p className="text-[10px] text-white/50">Type: {a.activity_type} • {a.location}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-white/40">{formatDate(a.created_at)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </main>
  );
}

export default function WebAccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070514] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      }
    >
      <WebAccountContent />
    </Suspense>
  );
}
