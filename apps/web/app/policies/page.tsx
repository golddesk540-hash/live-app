'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/homepage/Navbar';
import { Footer } from '@/components/homepage/Footer';
import { AuthModal } from '@/components/homepage/AuthModal';
import { useLanguage } from '@/lib/languageContext';
import { Button } from '@/components/ui/Button';
import {
  ShieldCheck,
  FileText,
  Users,
  Cookie,
  Coins,
  ArrowRight,
  Clock,
  AlertTriangle,
  Lock,
  Headphones,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export default function PoliciesHubPage() {
  const { lang, toggleLang, isUr } = useLanguage();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const policyCards = [
    {
      titleEn: 'Privacy Policy',
      titleUr: 'پرائیویسی پالیسی',
      descEn:
        'Learn how Popo Live collects, uses, and safeguards your account credentials, profile details, and telemetry while streaming.',
      descUr:
        'جانیں کہ پوپو لائیو کس طرح آپ کے اکاؤنٹ، پروفائل کی معلومات اور اسٹریمنگ ڈیٹا کو محفوظ اور استعمال کرتا ہے۔',
      icon: Lock,
      href: '/policies/privacy',
      badgeColor: 'from-pink-500/20 to-rose-500/20 text-pink-400 border-pink-500/30',
      lastUpdated: 'Draft — November 2026',
    },
    {
      titleEn: 'Terms of Service',
      titleUr: 'استعمال کی شرائط',
      descEn:
        'The binding platform agreement outlining user eligibility (Strict 18+), live streaming rules, party rooms, and virtual coins.',
      descUr:
        'لازمی پلیٹ فارم معاہدہ جس میں صارف کی اہلیت (۱۸ سال کی پابندی)، لائیو اسٹریمنگ اور ورچوئل کوائنز کے قواعد شامل ہیں۔',
      icon: FileText,
      href: '/policies/terms',
      badgeColor: 'from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/30',
      lastUpdated: 'Draft — November 2026',
    },
    {
      titleEn: 'Community Guidelines',
      titleUr: 'کمیونٹی گائیڈ لائنز',
      descEn:
        'Platform standards enforcing respect, safety, anti-harassment, anti-bullying, zero child exploitation, and fair-play conduct.',
      descUr:
        'پلیٹ فارم کے اصول جو باہمی احترام، انسداد ہراسانی، چائلڈ سیفٹی اور منصفانہ اسٹریمنگ کو یقینی بناتے ہیں۔',
      icon: Users,
      href: '/policies/community-guidelines',
      badgeColor: 'from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30',
      lastUpdated: 'Draft — November 2026',
    },
    {
      titleEn: 'Cookie Policy',
      titleUr: 'کوکی پالیسی',
      descEn:
        'Clear information on essential session tokens and preference cookies used to keep the web application secure and responsive.',
      descUr:
        'ضروری سیشن ٹوکنز اور ترجیحی کوکیز کے استعمال کی وضاحت جو ویب ایپ کو محفوظ اور فعال رکھتی ہیں۔',
      icon: Cookie,
      href: '/policies/cookies',
      badgeColor: 'from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30',
      lastUpdated: 'Draft — November 2026',
    },
    {
      titleEn: 'Refund and Virtual Items Policy',
      titleUr: 'ریفنڈ اور ورچوئل کوائنز پالیسی',
      descEn:
        'Operational rules governing virtual coin purchases, gift transactions, 70% host conversion, and dispute inquiry processes.',
      descUr:
        'ورچوئل کوائنز کی خریداری، تحائف کے تبادلے، ہوسٹس کے ۷۰٪ ریونیو شیئر اور انکوائری کے ضوابط۔',
      icon: Coins,
      href: '/policies/refunds',
      badgeColor: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
      lastUpdated: 'Draft — November 2026',
    },
  ];

  return (
    <div
      dir={isUr ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-[#0B0E17] text-white selection:bg-popo-pink selection:text-white ${
        isUr ? 'font-urdu' : 'font-sans'
      }`}
    >
      {/* 1. Website Header */}
      <Navbar
        lang={lang}
        onToggleLang={toggleLang}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 flex flex-col gap-16 overflow-x-hidden">
        {/* Breadcrumb Navigation */}
        <nav
          className={`flex items-center gap-2 text-xs text-gray-400 ${
            isUr ? 'flex-row-reverse justify-end' : ''
          }`}
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-white transition-colors">
            {isUr ? 'ہوم' : 'Home'}
          </Link>
          <ChevronRight className={`w-3.5 h-3.5 ${isUr ? 'rotate-180' : ''}`} />
          <span className="text-popo-pink font-semibold">
            {isUr ? 'پالیسیاں اور شرائط' : 'Policies & Guidelines'}
          </span>
        </nav>

        {/* DRAFT Warning Alert Box */}
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 sm:p-5 flex items-start gap-3.5">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div
            className={`flex flex-col gap-1 text-xs sm:text-sm text-gray-300 ${
              isUr ? 'text-right' : 'text-left'
            }`}
          >
            <span className="font-extrabold uppercase tracking-wider text-amber-400">
              {isUr
                ? 'مسودہ — قانونی مشاورت اور کلائنٹ منظوری کے زیر التواء (DRAFT FOR LEGAL REVIEW)'
                : 'DRAFT FOR LEGAL REVIEW — PENDING OFFICIAL COUNSEL & CLIENT APPROVAL'}
            </span>
            <p className="leading-relaxed">
              {isUr
                ? 'پوپو لائیو کا پلیٹ فارم سختی سے ۱۸ سال اور زائد عمر کے صارفین کے لیے ہے۔ درج ذیل دستاویزات آپریشنل فریم ورک کی عکاسی کرتی ہیں۔ تمام شرائط و ضوابط حتمی قانونی جانچ کے بعد باضابطہ نافذ ہوں گی۔'
                : 'Popo Live is strictly intended for individuals who are 18 years of age or older. The documents below represent our platform governance framework and remain in draft status pending formal legal counsel review.'}
            </p>
          </div>
        </div>

        {/* 2. Policies Main Page Hero */}
        <section className="relative text-center max-w-3xl mx-auto flex flex-col items-center gap-4">
          <span className="text-xs font-bold uppercase tracking-widest text-popo-pink px-4 py-1.5 rounded-full bg-popo-pink/10 border border-popo-pink/25">
            {isUr ? 'قانونی و تعمیلی دستاویزات' : 'Legal & Compliance Directory'}
          </span>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            {isUr ? (
              <>
                پوپو لائیو{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-popo-pink via-purple-400 to-indigo-400">
                  پالیسیاں اور رہنما اصول
                </span>
              </>
            ) : (
              <>
                Popo Live{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-popo-pink via-purple-400 to-indigo-400">
                  Policies & Guidelines
                </span>
              </>
            )}
          </h1>

          <p className="text-sm sm:text-base text-gray-400 leading-relaxed max-w-2xl">
            {isUr
              ? 'پلیٹ فارم کی پالیسیوں، صارف کی ذمہ داریوں، پرائیویسی کے طریقہ کار اور کمیونٹی گائیڈ لائنز کے بارے میں جانیں۔'
              : 'Learn about our platform policies, user responsibilities, privacy practices and community guidelines.'}
          </p>
        </section>

        {/* 5 Attractive Policy Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {policyCards.map((card, idx) => {
            const IconComp = card.icon;
            return (
              <div
                key={idx}
                className={`p-7 rounded-3xl bg-[#171722] border border-white/10 hover:border-popo-pink/40 hover:bg-[#1C1C2A] transition-all duration-300 flex flex-col justify-between gap-6 relative group shadow-xl ${
                  isUr ? 'text-right' : 'text-left'
                }`}
              >
                <div className="flex flex-col gap-4">
                  <div
                    className={`flex items-center justify-between ${
                      isUr ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.badgeColor} border flex items-center justify-center shrink-0`}
                    >
                      <IconComp className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-mono text-gray-400 flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full border border-white/5">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      {card.lastUpdated}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-white group-hover:text-popo-pink transition-colors">
                    {isUr ? card.titleUr : card.titleEn}
                  </h2>

                  <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                    {isUr ? card.descUr : card.descEn}
                  </p>
                </div>

                <div className={`pt-2 flex ${isUr ? 'justify-start' : 'justify-end'}`}>
                  <Link href={card.href} className="w-full sm:w-auto">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full sm:w-auto font-semibold bg-white/5 border-white/10 hover:bg-popo-pink hover:text-white hover:border-popo-pink transition-all"
                      rightIcon={
                        isUr ? undefined : <ArrowRight className="w-4 h-4 ml-1" />
                      }
                      leftIcon={isUr ? <ArrowRight className="w-4 h-4 mr-1 rotate-180" /> : undefined}
                    >
                      {isUr ? 'پالیسی پڑھیں' : 'Read More'}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </section>

        {/* Legal Inquiries & Contact Support Section */}
        <section className="relative rounded-3xl bg-gradient-to-r from-purple-900/40 via-[#171722] to-pink-900/30 border border-white/10 p-8 sm:p-10 text-center flex flex-col items-center gap-4">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
            {isUr ? 'قانونی و ریگولیٹری تعاون' : 'Compliance & Operations'}
          </span>
          <h2 className="text-xl sm:text-3xl font-black text-white">
            {isUr
              ? 'پالیسیوں کے متعلق کوئی سوال یا استفسار ہے؟'
              : 'Have Questions Regarding Our Platform Policies?'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 max-w-xl leading-relaxed">
            {isUr
              ? 'ہماری سپورٹ اور کمپلائنس ٹیم صارف کے حقوق، ڈیٹا کی حفاظت اور سروس کی شرائط سے متعلق سوالات کے لیے ۲۴/۷ دستیاب ہے۔'
              : 'Our global support and legal operations team is available around the clock to assist with inquiries, reporting violations, and privacy rights.'}
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link href="/contact">
              <Button variant="primary" size="md" leftIcon={<Headphones className="w-4 h-4" />}>
                {isUr ? 'سپورٹ ٹیم سے رابطہ کریں' : 'Contact Support'}
              </Button>
            </Link>
            <a href="mailto:support@popolive.com">
              <Button
                variant="secondary"
                size="md"
                className="bg-white/5 border-white/10"
              >
                support@popolive.com
              </Button>
            </a>
          </div>
        </section>
      </main>

      {/* Reused Footer */}
      <Footer lang={lang} />

      <AuthModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        lang={lang}
      />
    </div>
  );
}
