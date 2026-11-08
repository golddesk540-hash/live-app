'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/languageContext';
import {
  ArrowLeft,
  HelpCircle,
  Edit3,
  Search,
  X,
  ChevronRight,
  ChevronDown,
  User,
  Radio,
  Gift,
  CreditCard,
  AlertTriangle,
  Shield,
  Users,
  Briefcase,
  Lock,
  ThumbsUp,
  ThumbsDown,
  LifeBuoy,
  MessageSquare,
  Ticket,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Globe,
} from 'lucide-react';

interface FAQItem {
  id: string;
  category: string;
  question_en: string;
  question_ur: string;
  answer_en: string;
  answer_ur: string;
  helpful_count: number;
  not_helpful_count: number;
  display_order: number;
}

interface HelpArticle {
  id: string;
  slug: string;
  category: string;
  title_en: string;
  title_ur: string;
  content_en: string;
  content_ur: string;
  view_count: number;
}

interface CategoryConfig {
  id: string;
  slug: string;
  title_en: string;
  title_ur: string;
  icon: string;
  faqCount: number;
}

function HelpCenterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isUr, toggleLang, setLang, lang } = useLanguage();

  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('cat') || 'all');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  // Rating state: map faqId -> 'helpful' | 'not_helpful'
  const [ratedFaqs, setRatedFaqs] = useState<Record<string, 'helpful' | 'not_helpful'>>({});
  const [ratingLoading, setRatingLoading] = useState<Record<string, boolean>>({});

  // Ticket count badge
  const [ticketCount, setTicketCount] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [catRes, faqRes, artRes, ticketRes] = await Promise.allSettled([
          fetch('/api/help/categories').then((r) => r.json()),
          fetch('/api/help/faqs').then((r) => r.json()),
          fetch('/api/help/articles').then((r) => r.json()),
          fetch('/api/help/tickets/me').then((r) => r.json()),
        ]);

        if (catRes.status === 'fulfilled' && catRes.value.success) {
          setCategories(catRes.value.categories || []);
        }
        if (faqRes.status === 'fulfilled' && faqRes.value.success) {
          setFaqs(faqRes.value.faqs || []);
        }
        if (artRes.status === 'fulfilled' && artRes.value.success) {
          setArticles(artRes.value.articles || []);
        }
        if (ticketRes.status === 'fulfilled' && ticketRes.value.success) {
          setTicketCount(ticketRes.value.totalCount ?? 0);
        }
      } catch (err) {
        console.error('Failed to load help center data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    let list = faqs;
    if (selectedCategory && selectedCategory !== 'all') {
      list = list.filter((f) => f.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (f) =>
          f.question_en.toLowerCase().includes(q) ||
          f.question_ur.toLowerCase().includes(q) ||
          f.answer_en.toLowerCase().includes(q) ||
          f.answer_ur.toLowerCase().includes(q)
      );
    }
    return list;
  }, [faqs, selectedCategory, searchQuery]);

  // Handle rating FAQ
  const handleRateFaq = async (faqId: string, isHelpful: boolean) => {
    if (ratingLoading[faqId]) return;
    setRatingLoading((prev) => ({ ...prev, [faqId]: true }));
    try {
      const res = await fetch(`/api/help/faqs/${faqId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHelpful }),
      });
      const data = await res.json();
      if (data.success) {
        setRatedFaqs((prev) => ({
          ...prev,
          [faqId]: isHelpful ? 'helpful' : 'not_helpful',
        }));
        // Update local counts
        setFaqs((prev) =>
          prev.map((f) =>
            f.id === faqId
              ? {
                  ...f,
                  helpful_count: data.helpfulCount,
                  not_helpful_count: data.notHelpfulCount,
                }
              : f
          )
        );
      }
    } catch (err) {
      console.error('Failed to rate FAQ:', err);
    } finally {
      setRatingLoading((prev) => ({ ...prev, [faqId]: false }));
    }
  };

  const scrollToFaqs = (catId?: string) => {
    if (catId) setSelectedCategory(catId);
    const element = document.getElementById('faq-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <main
      dir={isUr ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-[#070514] text-white selection:bg-[#ff2d55] selection:text-white pb-24 ${
        isUr ? 'font-urdu' : 'font-sans'
      }`}
    >
      {/* Background ambient light */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-[#b81dff]/20 via-[#ff2d55]/15 to-transparent blur-3xl opacity-75" />
        <div className="absolute top-1/3 -right-24 w-80 h-80 bg-[#b81dff]/10 blur-3xl rounded-full" />
        <div className="absolute bottom-20 -left-20 w-80 h-80 bg-[#ff2d55]/10 blur-3xl rounded-full" />
      </div>

      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 bg-[#070514]/90 backdrop-blur-md border-b border-white/10 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push('/settings')}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center transition-colors text-white"
            aria-label="Go Back"
          >
            <ArrowLeft className={`w-5 h-5 ${isUr ? 'rotate-180' : ''}`} />
          </button>

          <h1 className="text-base sm:text-lg font-bold text-white tracking-wide">
            {isUr ? 'مدد اور تاثرات' : 'Help & Feedback'}
          </h1>

          {/* Language Switcher pill */}
          <button
            type="button"
            onClick={toggleLang}
            className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white/90 flex items-center gap-1.5 transition-all"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-pink-400" />
            <span>{isUr ? 'English' : 'اردو'}</span>
          </button>
        </div>
      </header>

      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-4 sm:pt-6 space-y-6">

        {/* 1. TOP TWO ACTION CARDS (02_08_help_feedback.png) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Card 1: Help Center */}
          <button
            type="button"
            onClick={() => scrollToFaqs('all')}
            className="relative p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#1d143c] to-[#120c27] border border-white/10 hover:border-pink-500/40 text-center transition-all duration-300 shadow-lg shadow-purple-950/40 group active:scale-[0.98]"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 rounded-full bg-gradient-to-tr from-[#99158c] to-[#e61b7b] flex items-center justify-center shadow-lg shadow-pink-600/30 group-hover:scale-105 transition-transform">
              <span className="text-xl sm:text-2xl font-black text-white">?</span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white mb-1 group-hover:text-pink-300 transition-colors">
              {isUr ? 'ہیلپ سینٹر' : 'Help Center'}
            </h2>
            <p className="text-[11px] sm:text-xs text-white/60 leading-snug">
              {isUr ? 'عام سوالات کے جوابات حاصل کریں' : 'Get answers to common questions'}
            </p>
          </button>

          {/* Card 2: Send Feedback */}
          <Link
            href="/feedback"
            className="relative p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#1d143c] to-[#120c27] border border-white/10 hover:border-pink-500/40 text-center transition-all duration-300 shadow-lg shadow-purple-950/40 group active:scale-[0.98] block"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-[#8a19a5] to-[#f4268a] flex items-center justify-center shadow-lg shadow-pink-600/30 group-hover:scale-105 transition-transform">
              <Edit3 className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white mb-1 group-hover:text-pink-300 transition-colors">
              {isUr ? 'فیڈ بیک بھیجیں' : 'Send Feedback'}
            </h2>
            <p className="text-[11px] sm:text-xs text-white/60 leading-snug">
              {isUr ? 'اپنی قیمتی تجاویز شیئر کریں' : 'Share your suggestions'}
            </p>
          </Link>
        </div>

        {/* QUICK SHORTCUTS ROW (My Tickets & Contact Support) */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/help/my-tickets"
            className="flex-1 py-2.5 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-xs font-semibold text-white/90 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-pink-400" />
              <span>{isUr ? 'میری سپورٹ ٹکٹس' : 'My Support Tickets'}</span>
            </div>
            {ticketCount !== null && ticketCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-pink-500 text-[10px] font-bold text-white">
                {ticketCount}
              </span>
            ) : (
              <ChevronRight className={`w-3.5 h-3.5 text-white/40 group-hover:text-white ${isUr ? 'rotate-180' : ''}`} />
            )}
          </Link>

          <Link
            href="/help/contact"
            className="flex-1 py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white flex items-center justify-center gap-1.5 text-xs font-bold transition-all shadow-md shadow-pink-600/20"
          >
            <LifeBuoy className="w-4 h-4" />
            <span>{isUr ? 'سپورٹ سے رابطہ' : 'Contact Support'}</span>
          </Link>
        </div>

        {/* 2. POPULAR TOPICS (02_08_help_feedback.png) */}
        <div>
          <h2 className="text-sm sm:text-base font-bold text-white mb-3">
            {isUr ? 'مشہور موضوعات' : 'Popular Topics'}
          </h2>

          <div className="space-y-2 rounded-2xl sm:rounded-3xl bg-[#140f2b]/80 border border-white/10 p-2 sm:p-2.5 shadow-xl">
            {/* 1. Account & Login */}
            <button
              type="button"
              onClick={() => scrollToFaqs('account_registration')}
              className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-xl hover:bg-white/5 transition-colors group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-pink-400 group-hover:bg-pink-500/10 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-white/90 group-hover:text-white">
                  {isUr ? 'اکاؤنٹ اور لاگ ان' : 'Account & Login'}
                </span>
              </div>
              <ChevronRight className={`w-4 h-4 text-white/40 group-hover:text-white transition-colors ${isUr ? 'rotate-180' : ''}`} />
            </button>

            {/* 2. Live Streaming */}
            <button
              type="button"
              onClick={() => scrollToFaqs('live_streaming')}
              className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-xl hover:bg-white/5 transition-colors group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/10 transition-colors">
                  <Radio className="w-5 h-5" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-white/90 group-hover:text-white">
                  {isUr ? 'لائیو اسٹریمنگ' : 'Live Streaming'}
                </span>
              </div>
              <ChevronRight className={`w-4 h-4 text-white/40 group-hover:text-white transition-colors ${isUr ? 'rotate-180' : ''}`} />
            </button>

            {/* 3. Gifts & Coins */}
            <button
              type="button"
              onClick={() => scrollToFaqs('coins_gifts')}
              className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-xl hover:bg-white/5 transition-colors group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/10 transition-colors">
                  <Gift className="w-5 h-5" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-white/90 group-hover:text-white">
                  {isUr ? 'کوائنز اور تحائف' : 'Gifts & Coins'}
                </span>
              </div>
              <ChevronRight className={`w-4 h-4 text-white/40 group-hover:text-white transition-colors ${isUr ? 'rotate-180' : ''}`} />
            </button>

            {/* 4. Payments & Wallet */}
            <button
              type="button"
              onClick={() => scrollToFaqs('payments_recharge')}
              className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-xl hover:bg-white/5 transition-colors group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/10 transition-colors">
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-white/90 group-hover:text-white">
                  {isUr ? 'ادائیگیاں اور والٹ' : 'Payments & Wallet'}
                </span>
              </div>
              <ChevronRight className={`w-4 h-4 text-white/40 group-hover:text-white transition-colors ${isUr ? 'rotate-180' : ''}`} />
            </button>

            {/* 5. Report a Problem */}
            <Link
              href="/help/report-problem"
              className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-xl hover:bg-white/5 transition-colors group text-left block"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-rose-400 group-hover:bg-rose-500/10 transition-colors">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-white/90 group-hover:text-white">
                  {isUr ? 'تکنیکی خرابی کی اطلاع دیں' : 'Report a Problem'}
                </span>
              </div>
              <ChevronRight className={`w-4 h-4 text-white/40 group-hover:text-white transition-colors ${isUr ? 'rotate-180' : ''}`} />
            </Link>
          </div>
        </div>

        {/* 3. SEARCH HELP ARTICLES & FAQS */}
        <section id="faq-section" className="pt-2">
          <div className="relative mb-3">
            <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 ${isUr ? 'right-3.5' : 'left-3.5'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isUr ? 'مضامین، اکثر پوچھے گئے سوالات یا عنوانات تلاش کریں...' : 'Search help articles, questions, or topics...'}
              className={`w-full py-2.5 sm:py-3 rounded-2xl bg-[#140f2b] border border-white/15 focus:border-pink-500 focus:outline-none text-xs sm:text-sm text-white placeholder:text-white/40 transition-colors shadow-inner ${
                isUr ? 'pr-10 pl-10' : 'pl-10 pr-10'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={`absolute top-1/2 -translate-y-1/2 p-1 rounded-full text-white/40 hover:text-white ${
                  isUr ? 'left-3' : 'right-3'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20'
                  : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
              }`}
            >
              {isUr ? 'تمام سوالات' : 'All FAQs'}
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20'
                    : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
                }`}
              >
                {isUr ? cat.title_ur : cat.title_en}
                {cat.faqCount > 0 && <span className="ml-1 opacity-70">({cat.faqCount})</span>}
              </button>
            ))}
          </div>
        </section>

        {/* 4. FAQ ACCORDION LIST */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-pink-400" />
              <span>{isUr ? 'اکثر پوچھے گئے سوالات' : 'Frequently Asked Questions'}</span>
            </h3>
            <span className="text-[11px] text-white/50 font-medium">
              {filteredFaqs.length} {isUr ? 'سوالات' : 'items'}
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-white/50 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-pink-500" />
              <p className="text-xs">{isUr ? 'معلومات لوڈ ہو رہی ہیں...' : 'Loading knowledge base...'}</p>
            </div>
          ) : filteredFaqs.length === 0 ? (
            /* Empty State */
            <div className="p-8 rounded-2xl bg-[#140f2b]/60 border border-white/10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-white/5 mx-auto flex items-center justify-center text-white/40">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-white/80">
                {isUr ? 'کوئی متعلقہ سوال یا مضمون نہیں ملا' : 'No matching help topics found'}
              </p>
              <p className="text-[11px] text-white/50 max-w-sm mx-auto">
                {isUr
                  ? 'آپ اپنی تلاش کی اصطلاح تبدیل کر سکتے ہیں یا ہماری کسٹمر سپورٹ ٹیم سے رابطہ کر سکتے ہیں۔'
                  : 'Try searching with different keywords or reach out directly to our dedicated support agents.'}
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors"
                >
                  {isUr ? 'فلٹرز صاف کریں' : 'Clear Filters'}
                </button>
                <Link
                  href="/help/contact"
                  className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-xs font-bold text-white transition-colors shadow-md"
                >
                  {isUr ? 'ٹکٹ درج کریں' : 'Submit Ticket'}
                </Link>
              </div>
            </div>
          ) : (
            /* Accordion Items */
            <div className="space-y-2.5">
              {filteredFaqs.map((faq) => {
                const isExpanded = expandedFaqId === faq.id;
                const rated = ratedFaqs[faq.id];
                const questionText = isUr ? faq.question_ur : faq.question_en;
                const answerText = isUr ? faq.answer_ur : faq.answer_en;

                return (
                  <div
                    key={faq.id}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isExpanded
                        ? 'bg-[#1a1338] border-pink-500/40 shadow-lg shadow-purple-950/50'
                        : 'bg-[#140f2b]/80 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                      className="w-full p-4 flex items-center justify-between text-left gap-3"
                    >
                      <span className={`text-xs sm:text-sm font-semibold transition-colors ${
                        isExpanded ? 'text-pink-300' : 'text-white/90'
                      }`}>
                        {questionText}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-white/50 transition-transform duration-200 shrink-0 ${
                          isExpanded ? 'rotate-180 text-pink-400' : ''
                        }`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-white/10 text-xs sm:text-sm text-white/80 leading-relaxed space-y-3">
                        <p>{answerText}</p>

                        {/* Was this answer helpful? */}
                        <div className="pt-2 flex items-center justify-between border-t border-white/5 text-[11px] text-white/60">
                          <span>{isUr ? 'کیا یہ جواب مددگار تھا؟' : 'Was this answer helpful?'}</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleRateFaq(faq.id, true)}
                              disabled={ratingLoading[faq.id]}
                              className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors ${
                                rated === 'helpful'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-white/5 hover:bg-white/10 text-white/70'
                              }`}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>{faq.helpful_count}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRateFaq(faq.id, false)}
                              disabled={ratingLoading[faq.id]}
                              className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors ${
                                rated === 'not_helpful'
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : 'bg-white/5 hover:bg-white/10 text-white/70'
                              }`}
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                              <span>{faq.not_helpful_count}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 5. STILL NEED HELP? CONTACT SUPPORT CALLOUT */}
        <div className="p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-purple-900/40 via-[#1e133d] to-pink-900/30 border border-white/15 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-pink-500/20 border border-pink-500/30 mx-auto flex items-center justify-center text-pink-400">
            <LifeBuoy className="w-5 h-5" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-white">
            {isUr ? 'کیا آپ کو مزید مدد درکار ہے؟' : 'Still Need Help?'}
          </h3>
          <p className="text-xs text-white/60 max-w-md mx-auto">
            {isUr
              ? 'ہماری کسٹمر سروس ٹیم 24/7 آپ کے سوالات اور اکاؤنٹ سے متعلق مسائل حل کرنے کے لیے دستیاب ہے۔'
              : 'Our dedicated customer support agents are ready 24/7 to assist with your account, recharges, and queries.'}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/help/contact"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-xs font-bold text-white shadow-md shadow-pink-600/30 transition-transform active:scale-95"
            >
              {isUr ? 'سپورٹ ٹکٹ جمع کروائیں' : 'Submit Support Ticket'}
            </Link>
            <Link
              href="/help/my-tickets"
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors"
            >
              {isUr ? 'ٹکٹ کی صورتحال دیکھیں' : 'View My Tickets'}
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}

export default function HelpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070514] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      }
    >
      <HelpCenterContent />
    </Suspense>
  );
}
