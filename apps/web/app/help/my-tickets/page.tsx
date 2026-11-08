'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/languageContext';
import {
  ArrowLeft,
  Ticket,
  Clock,
  MessageSquare,
  AlertCircle,
  Plus,
  Loader2,
  ChevronRight,
  Filter,
  CheckCircle2,
  LogIn,
} from 'lucide-react';

interface TicketItem {
  id: string;
  ticket_number: string;
  category: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  reply_count: number;
  last_reply_at: string | null;
}

const STATUS_BADGES: Record<string, { label_en: string; label_ur: string; color: string; bg: string }> = {
  open: {
    label_en: 'Open',
    label_ur: 'اوپن',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15 border-emerald-500/30',
  },
  in_progress: {
    label_en: 'In Progress',
    label_ur: 'زیر غور',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15 border-amber-500/30',
  },
  waiting_for_user: {
    label_en: 'Waiting for User',
    label_ur: 'صارف کے جواب کا انتظار',
    color: 'text-purple-400',
    bg: 'bg-purple-500/15 border-purple-500/30',
  },
  resolved: {
    label_en: 'Resolved',
    label_ur: 'حل شدہ',
    color: 'text-blue-400',
    bg: 'bg-blue-500/15 border-blue-500/30',
  },
  closed: {
    label_en: 'Closed',
    label_ur: 'بند',
    color: 'text-gray-400',
    bg: 'bg-white/10 border-white/15',
  },
};

const CATEGORY_NAMES: Record<string, { en: string; ur: string }> = {
  account_issues: { en: 'Account Issues', ur: 'اکاؤنٹ کے مسائل' },
  login_problems: { en: 'Login Problems', ur: 'لاگ ان کے مسائل' },
  profile_problems: { en: 'Profile Problems', ur: 'پروفائل کے مسائل' },
  security_issues: { en: 'Security Issues', ur: 'سیکیورٹی کے مسائل' },
  payments_recharge: { en: 'Payment and Recharge', ur: 'ادائیگی اور ریچارج' },
  coins_gifts: { en: 'Coins and Gifts', ur: 'کوائنز اور تحائف' },
  live_streaming: { en: 'Live Streaming', ur: 'لائیو اسٹریمنگ' },
  agency_support: { en: 'Agency Support', ur: 'ایجنسی سپورٹ' },
  other: { en: 'Other', ur: 'دیگر' },
};

function MyTicketsContent() {
  const router = useRouter();
  const { isUr } = useLanguage();

  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchTickets() {
      try {
        setLoading(true);
        const res = await fetch('/api/help/tickets/me');
        if (res.status === 401) {
          setUnauthorized(true);
          return;
        }
        const data = await res.json();
        if (data.success) {
          setTickets(data.tickets || []);
        }
      } catch (err) {
        console.error('Failed to load tickets:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    if (statusFilter === 'all') return tickets;
    return tickets.filter((t) => t.status === statusFilter);
  }, [tickets, statusFilter]);

  const formatDate = (isoStr: string) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleDateString(isUr ? 'ur-PK' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <main
      dir={isUr ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-[#070514] text-white selection:bg-[#ff2d55] selection:text-white pb-20 ${
        isUr ? 'font-urdu' : 'font-sans'
      }`}
    >
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-[#b81dff]/20 via-[#ff2d55]/15 to-transparent blur-3xl opacity-75" />
      </div>

      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 bg-[#070514]/90 backdrop-blur-md border-b border-white/10 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push('/help')}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center transition-colors text-white"
            aria-label="Back to Help Center"
          >
            <ArrowLeft className={`w-5 h-5 ${isUr ? 'rotate-180' : ''}`} />
          </button>

          <h1 className="text-base sm:text-lg font-bold text-white tracking-wide">
            {isUr ? 'میری سپورٹ ٹکٹس' : 'My Support Tickets'}
          </h1>

          <Link
            href="/help/contact"
            className="w-8 h-8 rounded-full bg-pink-600 hover:bg-pink-500 flex items-center justify-center text-white transition-colors shadow-md shadow-pink-600/30"
            title="Create New Ticket"
          >
            <Plus className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-4 sm:pt-6 space-y-4">

        {/* UNAUTHORIZED STATE */}
        {unauthorized ? (
          <div className="p-8 rounded-3xl bg-[#140f2b] border border-white/10 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-pink-500/20 text-pink-400 mx-auto flex items-center justify-center">
              <LogIn className="w-6 h-6" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              {isUr ? 'براہ کرم لاگ ان کریں' : 'Authentication Required'}
            </h2>
            <p className="text-xs text-white/60 max-w-sm mx-auto">
              {isUr
                ? 'اپنی جمع کرائی گئی سپورٹ ٹکٹس اور جوابات دیکھنے کے لیے اپنے اکاؤنٹ میں لاگ ان کریں۔'
                : 'Please sign in to your Popo Live account to view your past support inquiries and official staff replies.'}
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link
                href="/login?redirect=/help/my-tickets"
                className="px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-xs font-bold text-white shadow-lg shadow-pink-600/30 transition-transform active:scale-95"
              >
                {isUr ? 'لاگ ان کریں' : 'Log In Now'}
              </Link>
              <Link
                href="/help/contact"
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors"
              >
                {isUr ? 'مہمان کے طور پر ٹکٹ درج کریں' : 'Submit Ticket as Guest'}
              </Link>
            </div>
          </div>
        ) : loading ? (
          <div className="py-20 text-center text-white/50 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-pink-500" />
            <p className="text-xs">{isUr ? 'ٹکٹس لوڈ ہو رہی ہیں...' : 'Loading your tickets...'}</p>
          </div>
        ) : (
          <>
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'all', en: 'All Tickets', ur: 'تمام ٹکٹس' },
                { id: 'open', en: 'Open', ur: 'اوپن' },
                { id: 'in_progress', en: 'In Progress', ur: 'زیر غور' },
                { id: 'resolved', en: 'Resolved', ur: 'حل شدہ' },
                { id: 'closed', en: 'Closed', ur: 'بند' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    statusFilter === tab.id
                      ? 'bg-pink-600 text-white shadow-md shadow-pink-600/20'
                      : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
                  }`}
                >
                  {isUr ? tab.ur : tab.en}
                </button>
              ))}
            </div>

            {/* TICKETS LIST */}
            {filteredTickets.length === 0 ? (
              <div className="p-8 rounded-3xl bg-[#140f2b]/70 border border-white/10 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-white/5 mx-auto flex items-center justify-center text-white/40">
                  <Ticket className="w-7 h-7" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {isUr ? 'کوئی سپورٹ ٹکٹ نہیں ملی' : 'No Support Tickets Found'}
                </h3>
                <p className="text-xs text-white/50 max-w-sm mx-auto">
                  {statusFilter === 'all'
                    ? isUr
                      ? 'آپ نے ابھی تک کوئی سپورٹ ٹکٹ جمع نہیں کروائی ہے۔ اگر آپ کو کوئی مسئلہ درپیش ہے تو نئی ٹکٹ درج کریں۔'
                      : 'You have not submitted any support tickets yet. If you are experiencing any issue, our team is here to assist.'
                    : isUr
                    ? 'اس فیلٹر سے متعلق کوئی ٹکٹ موجود نہیں ہے۔'
                    : 'No tickets found matching this filter.'}
                </p>
                <div className="pt-2">
                  <Link
                    href="/help/contact"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-xs font-bold text-white shadow-md shadow-pink-600/30 transition-transform active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isUr ? 'نئی سپورٹ ٹکٹ بنائیں' : 'Create New Ticket'}</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTickets.map((t) => {
                  const badge = STATUS_BADGES[t.status] || STATUS_BADGES.open;
                  const catName = CATEGORY_NAMES[t.category]
                    ? isUr
                      ? CATEGORY_NAMES[t.category].ur
                      : CATEGORY_NAMES[t.category].en
                    : t.category;

                  return (
                    <Link
                      key={t.id}
                      href={`/help/ticket/${t.id}`}
                      className="block p-4 sm:p-5 rounded-2xl bg-[#140f2b]/90 border border-white/10 hover:border-pink-500/40 transition-all shadow-lg shadow-purple-950/30 group active:scale-[0.99]"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-pink-400">
                              {t.ticket_number}
                            </span>
                            <span className="text-[11px] text-white/40">•</span>
                            <span className="text-[11px] font-medium text-white/60 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                              {catName}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-white group-hover:text-pink-300 transition-colors">
                            {t.subject}
                          </h3>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide shrink-0 ${badge.bg} ${badge.color}`}
                        >
                          {isUr ? badge.label_ur : badge.label_en}
                        </span>
                      </div>

                      {/* Footer info: dates & replies */}
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-white/50">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatDate(t.created_at)}</span>
                        </span>

                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-white/70">
                            <MessageSquare className="w-3.5 h-3.5 text-pink-400" />
                            <span>{t.reply_count || 1} {isUr ? 'پیغامات' : 'messages'}</span>
                          </span>
                          <ChevronRight className={`w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors ${isUr ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}

      </div>
    </main>
  );
}

export default function MyTicketsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070514] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      }
    >
      <MyTicketsContent />
    </Suspense>
  );
}
