'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/languageContext';
import {
  ArrowLeft,
  Copy,
  Check,
  ShieldCheck,
  Smartphone,
  Laptop,
  Globe,
  LogOut,
  Loader2,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface SessionData {
  id: string;
  isCurrent: boolean;
  deviceType: string;
  browserName: string;
  osName: string;
  location: string;
  ipMasked: string;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
}

interface UserProfile {
  id: string;
  poppoId: string;
  nickname: string;
  avatarUrl: string;
  country: string;
  createdAt: string;
}

function UserIdContent() {
  const router = useRouter();
  const { lang, setLang, isUr } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [copied, setCopied] = useState(false);

  const [activeTab, setActiveTab] = useState<'id' | 'sessions'>('id');
  const [terminatingSessionId, setTerminatingSessionId] = useState<string | null>(null);
  const [terminatingAll, setTerminatingAll] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Fetch User ID and Active Sessions on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [userRes, sessionsRes] = await Promise.all([
          fetch('/api/users/me/id', { cache: 'no-store' }),
          fetch('/api/users/me/sessions', { cache: 'no-store' }),
        ]);

        if (userRes.status === 401) {
          router.push('/login?error=auth_required');
          return;
        }

        const userData = await userRes.json();
        const sessionsData = await sessionsRes.json();

        if (userData.success) {
          setProfile(userData);
        }
        if (sessionsData.sessions) {
          setSessions(sessionsData.sessions);
        }
      } catch (err) {
        console.error('Failed to load user ID / sessions:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  // Handle Copy User ID
  const handleCopyId = async () => {
    if (!profile?.poppoId) return;
    try {
      await navigator.clipboard.writeText(profile.poppoId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  // Terminate a specific session
  const handleTerminateSession = async (sessionId: string) => {
    setTerminatingSessionId(sessionId);
    setActionMessage(null);
    try {
      const res = await fetch('/api/users/me/sessions/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to terminate session');

      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setActionMessage(isUr ? 'ڈیوائس سیشن کامیابی سے بند کر دیا گیا۔' : 'Device session logged out.');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage(err.message || 'Error revoking session.');
    } finally {
      setTerminatingSessionId(null);
    }
  };

  // Terminate all other sessions
  const handleTerminateAllOthers = async () => {
    setTerminatingAll(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/users/me/sessions/logout-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to terminate other sessions');

      setSessions((prev) => prev.filter((s) => s.isCurrent));
      setActionMessage(
        isUr
          ? `دیگر تمام سیشنز بند کر دیے گئے۔ صرف یہ ڈیوائس فعال ہے۔`
          : `All other devices logged out successfully.`
      );
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: any) {
      setActionMessage(err.message || 'Error terminating sessions.');
    } finally {
      setTerminatingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07040E] flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF1A6C]" />
      </div>
    );
  }

  const otherSessions = sessions.filter((s) => !s.isCurrent);
  const currentSession = sessions.find((s) => s.isCurrent) || sessions[0];

  return (
    <div
      dir={isUr ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#07040E] text-white flex flex-col justify-between selection:bg-[#FF1A6C] selection:text-white relative overflow-hidden"
    >
      {/* Ambient background flares matching 02_04_user_id_session.png */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[700px] h-[550px] sm:h-[700px] bg-gradient-to-tr from-purple-900/30 via-[#FF1A6C]/20 to-transparent rounded-full blur-[130px] pointer-events-none" />
      <div className="fixed bottom-10 right-10 w-[320px] h-[320px] bg-pink-600/15 rounded-full blur-[110px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-5 flex items-center justify-between z-10">
        <Link
          href="/"
          className={`flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 ${
            isUr ? 'flex-row-reverse' : ''
          }`}
        >
          <ArrowLeft className={`w-3.5 h-3.5 ${isUr ? 'rotate-180' : ''}`} />
          <span>{isUr ? 'ہوم پیج پر جائیں' : 'Home'}</span>
        </Link>

        {/* Working Language selector */}
        <div className="flex items-center bg-white/10 rounded-full p-0.5 border border-white/10">
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
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
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              isUr
                ? 'bg-gradient-to-r from-[#FF1A6C] to-[#E0125C] text-white shadow-sm'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            اردو
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[420px] sm:max-w-[460px] mx-auto w-full px-4 py-6 z-10 my-auto">
        <div className="relative rounded-[32px] sm:rounded-[36px] bg-gradient-to-b from-[#140C29] via-[#0E091E] to-[#0A0614] border border-[#2D1B4E]/90 p-6 sm:p-8 shadow-[0_20px_70px_rgba(0,0,0,0.85),0_0_35px_rgba(168,85,247,0.18)] flex flex-col gap-5 text-center overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Subtle top edge glow */}
          <div className="absolute top-0 left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-[#FF1A6C] to-transparent opacity-80" />

          {/* Top Right Security / Ticket Badge (Matches 02_04_user_id_session.png top-right icon) */}
          <div className="absolute top-6 right-6 w-9 h-9 rounded-full bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-purple-300" />
          </div>

          {/* Tab Selector between ID Card and Active Sessions */}
          <div className="flex p-1 bg-[#0A0614] rounded-2xl border border-white/10 mb-1 max-w-[280px] mx-auto">
            <button
              type="button"
              onClick={() => setActiveTab('id')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'id'
                  ? 'bg-gradient-to-r from-[#FF1A6C] to-[#E0125C] text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {isUr ? 'پوپو آئی ڈی' : 'User ID Card'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sessions')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'sessions'
                  ? 'bg-gradient-to-r from-[#FF1A6C] to-[#E0125C] text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {isUr ? 'فعال سیشنز' : 'Sessions'}
            </button>
          </div>

          {actionMessage && (
            <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-200 text-xs text-center animate-in zoom-in-95">
              {actionMessage}
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 1: USER ID CELEBRATION (02_04_user_id_session.png)      */}
          {/* ============================================================ */}
          {activeTab === 'id' && (
            <div className="flex flex-col items-center gap-5">
              {/* Centered Celebration Badge with Checkmark & Confetti */}
              <div className="relative my-2">
                {/* SVG Confetti Burst */}
                <svg
                  className="absolute -top-10 -left-10 w-44 h-44 pointer-events-none"
                  viewBox="0 0 160 160"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Confetti geometric shapes in 3D perspective */}
                  <rect x="25" y="42" width="6" height="14" rx="2" transform="rotate(-35 25 42)" fill="#FF2A85" />
                  <rect x="125" y="35" width="7" height="14" rx="2" transform="rotate(40 125 35)" fill="#FBBF24" />
                  <rect x="135" y="85" width="6" height="12" rx="2" transform="rotate(-20 135 85)" fill="#C084FC" />
                  <rect x="20" y="95" width="6" height="14" rx="2" transform="rotate(45 20 95)" fill="#A855F7" />
                  <circle cx="45" cy="25" r="3.5" fill="#38BDF8" />
                  <circle cx="115" cy="22" r="3" fill="#F472B6" />
                  <circle cx="140" cy="60" r="3" fill="#E879F9" />
                  <circle cx="24" cy="72" r="3" fill="#FBBF24" />
                  <circle cx="120" cy="115" r="3.5" fill="#EC4899" />
                  <circle cx="42" cy="118" r="3" fill="#34D399" />
                </svg>

                {/* Glowing Pink Circular Badge with White Checkmark */}
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-[#FF1A6C] via-[#FF2E80] to-[#E0125C] shadow-[0_0_35px_rgba(255,26,108,0.55)] flex items-center justify-center transform hover:scale-105 transition-transform">
                  <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              {/* Headings */}
              <div className="flex flex-col items-center gap-1">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {isUr ? 'اکاؤنٹ بن گیا!' : 'Account Created!'}
                </h1>
                <p className="text-xs sm:text-sm text-[#B3A8C7]">
                  {isUr ? 'آپ کی منفرد پوپو لائیو آئی ڈی' : 'Your unique Popo Live ID'}
                </p>
              </div>

              {/* The User ID Card with Copy Button */}
              <div className="w-full relative group">
                <div className="w-full bg-[#180E2E] hover:bg-[#1F123B] border border-purple-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex items-center justify-between shadow-[0_8px_25px_rgba(0,0,0,0.5)] transition-all">
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      Permanent Popo ID
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-wider text-[#FF90B8]">
                      ID: {profile?.poppoId || '1000123456'}
                    </span>
                  </div>

                  {/* Copy Button */}
                  <button
                    type="button"
                    onClick={handleCopyId}
                    title={isUr ? 'آئی ڈی کاپی کریں' : 'Copy User ID'}
                    className={`p-3 rounded-2xl border transition-all transform active:scale-90 flex items-center gap-1.5 ${
                      copied
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                        : 'bg-white/10 hover:bg-[#FF1A6C] border-white/15 text-white shadow-md'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-5 h-5 text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        <span className="text-xs font-semibold hidden sm:inline">Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Guidance advice text (Direct from 02_04_user_id_session.png) */}
              <p className="text-xs text-gray-300 leading-relaxed max-w-[320px]">
                {isUr
                  ? 'اپنی آئی ڈی کو محفوظ رکھیں۔ آپ اسے دوستوں کو تلاش کرنے، ریچارج کرنے اور براڈکاسٹنگ رومز میں جڑنے کے لیے استعمال کر سکتے ہیں۔'
                  : 'Keep your ID safe. You can use it to find and connect with others.'}
              </p>

              {/* Primary Action Button (Matches 02_04_user_id_session.png) */}
              <div className="w-full space-y-3 pt-2">
                <Link href="/" className="w-full block">
                  <button
                    type="button"
                    className="w-full py-4 px-6 rounded-full font-bold text-sm tracking-wide text-white bg-gradient-to-r from-[#FF1A6C] via-[#FF2E80] to-[#E0125C] shadow-[0_8px_25px_rgba(255,26,108,0.45)] hover:brightness-105 active:scale-[0.99] transition-all"
                  >
                    {isUr ? 'میرے پروفائل پر جائیں' : 'Go to My Profile'}
                  </button>
                </Link>

                <button
                  type="button"
                  onClick={() => setActiveTab('sessions')}
                  className="w-full py-2.5 text-xs text-purple-300 hover:text-white transition-colors flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4 text-[#FF1A6C]" />
                  <span>{isUr ? 'فعال سیشنز اور لاگ ان ڈیوائسز دیکھیں' : 'Manage Active Logged-in Devices'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 2: ACTIVE SESSIONS & DEVICE MANAGEMENT                  */}
          {/* ============================================================ */}
          {activeTab === 'sessions' && (
            <div className="flex flex-col gap-4 text-left">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    {isUr ? 'فعال لاگ ان ڈیوائسز' : 'Active Logged-In Devices'}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    {isUr
                      ? `کل ${sessions.length} فعال ڈیوائس سیشنز موجود ہیں۔`
                      : `Currently managing ${sessions.length} active device session(s).`}
                  </p>
                </div>

                {otherSessions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleTerminateAllOthers}
                    disabled={terminatingAll}
                    className="py-1.5 px-3 rounded-full bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white text-xs font-bold border border-rose-500/40 transition-all flex items-center gap-1.5"
                  >
                    {terminatingAll ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <LogOut className="w-3.5 h-3.5" />
                    )}
                    <span>{isUr ? 'دیگر تمام ڈیوائسز سے لاگ آؤٹ' : 'Log Out Others'}</span>
                  </button>
                )}
              </div>

              {/* Sessions List */}
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      s.isCurrent
                        ? 'bg-[#1D123B] border-emerald-500/40 shadow-sm'
                        : 'bg-[#150D29] border-white/10 hover:border-purple-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2.5 rounded-xl ${
                            s.isCurrent
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-white/10 text-gray-300'
                          }`}
                        >
                          {s.deviceType === 'mobile' ? (
                            <Smartphone className="w-5 h-5" />
                          ) : (
                            <Laptop className="w-5 h-5" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-white">
                              {s.browserName} on {s.osName}
                            </span>
                            {s.isCurrent && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                                {isUr ? 'موجودہ ڈیوائس' : 'This Device'}
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-gray-400 space-y-0.5 mt-1">
                            <div>Location: {s.location} • IP: {s.ipMasked}</div>
                            <div className="text-gray-500">
                              {s.isCurrent
                                ? 'Active right now'
                                : `Last active: ${new Date(s.lastActiveAt).toLocaleString()}`}
                            </div>
                          </div>
                        </div>
                      </div>

                      {!s.isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleTerminateSession(s.id)}
                          disabled={terminatingSessionId === s.id}
                          className="p-2 rounded-xl text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title={isUr ? 'یہ سیشن بند کریں' : 'Log out this device'}
                        >
                          {terminatingSessionId === s.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                          ) : (
                            <LogOut className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Back to ID Card */}
              <button
                type="button"
                onClick={() => setActiveTab('id')}
                className="w-full py-3 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className={`w-3.5 h-3.5 ${isUr ? 'rotate-180' : ''}`} />
                <span>{isUr ? 'پوپو آئی ڈی کارڈ پر واپس جائیں' : 'Back to User ID Card'}</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="max-w-7xl mx-auto w-full px-4 py-5 text-center text-xs text-gray-500 z-10">
        <span>© 2026 Popo Live Global Inc. All rights reserved. Permanent ID & Secure Sessions.</span>
      </footer>
    </div>
  );
}

export default function UserIdPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07040E] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF1A6C]" />
        </div>
      }
    >
      <UserIdContent />
    </Suspense>
  );
}
