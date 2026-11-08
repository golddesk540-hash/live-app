'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/homepage/Navbar';
import { Footer } from '@/components/homepage/Footer';
import { AuthModal } from '@/components/homepage/AuthModal';
import { useLanguage } from '@/lib/languageContext';
import {
  ShieldAlert,
  ChevronRight,
  List,
  ChevronDown,
  Clock,
  FileText,
  AlertTriangle,
  Lock,
  Globe,
  Share2,
  Printer,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';

export interface PolicySection {
  id: string;
  titleEn: string;
  titleUr: string;
  contentEn: React.ReactNode;
  contentUr: React.ReactNode;
}

export interface PolicyLayoutProps {
  titleEn: string;
  titleUr: string;
  descEn: string;
  descUr: string;
  lastUpdated?: string;
  sections: PolicySection[];
}

export const PolicyLayout: React.FC<PolicyLayoutProps> = ({
  titleEn,
  titleUr,
  descEn,
  descUr,
  lastUpdated = 'Draft — November 2026',
  sections,
}) => {
  const { lang, toggleLang, isUr } = useLanguage();
  const pathname = usePathname();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileTocOpen, setIsMobileTocOpen] = useState(false);

  const policyNav = [
    {
      labelEn: 'Policies Hub',
      labelUr: 'پالیسی گائیڈ لائنز',
      href: '/policies',
      matchHrefs: ['/policies'],
    },
    {
      labelEn: 'Terms of Service',
      labelUr: 'استعمال کی شرائط',
      href: '/policies/terms',
      matchHrefs: ['/policies/terms', '/terms'],
    },
    {
      labelEn: 'Privacy Policy',
      labelUr: 'پرائیویسی پالیسی',
      href: '/policies/privacy',
      matchHrefs: ['/policies/privacy', '/privacy'],
    },
    {
      labelEn: 'Community Guidelines',
      labelUr: 'کمیونٹی گائیڈ لائنز',
      href: '/policies/community-guidelines',
      matchHrefs: ['/policies/community-guidelines', '/community-guidelines'],
    },
    {
      labelEn: 'Cookie Policy',
      labelUr: 'کوکی پالیسی',
      href: '/policies/cookies',
      matchHrefs: ['/policies/cookies', '/cookies'],
    },
    {
      labelEn: 'Refunds & Virtual Items',
      labelUr: 'ریفنڈ و ورچوئل کوائنز',
      href: '/policies/refunds',
      matchHrefs: ['/policies/refunds'],
    },
  ];

  const title = isUr ? titleUr : titleEn;
  const description = isUr ? descUr : descEn;

  return (
    <div
      dir={isUr ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-[#0B0E17] text-white selection:bg-popo-pink selection:text-white ${
        isUr ? 'font-urdu' : 'font-sans'
      }`}
    >
      <Navbar
        lang={lang}
        onToggleLang={toggleLang}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 flex flex-col gap-8">
        {/* Breadcrumb Navigation & Back to Policies Hub */}
        <div className={`flex flex-wrap items-center justify-between gap-4 ${isUr ? 'flex-row-reverse' : ''}`}>
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
            <Link href="/policies" className="hover:text-white transition-colors">
              {isUr ? 'پالیسیاں اور شرائط' : 'Policies & Guidelines'}
            </Link>
            <ChevronRight className={`w-3.5 h-3.5 ${isUr ? 'rotate-180' : ''}`} />
            <span className="text-popo-pink font-semibold truncate max-w-[200px] sm:max-w-none">
              {title}
            </span>
          </nav>

          <Link
            href="/policies"
            className={`text-xs font-semibold text-gray-400 hover:text-popo-pink flex items-center gap-1.5 transition-colors ${
              isUr ? 'flex-row-reverse' : ''
            }`}
          >
            {isUr ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
            <span>{isUr ? 'تمام پالیسیوں کا مرکزی صفحہ' : 'Back to Policies Hub'}</span>
          </Link>
        </div>

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
                ? 'مسودہ — قانونی مشاورت اور حتمی منظوری کے زیر التواء (DRAFT FOR LEGAL REVIEW)'
                : 'DRAFT FOR LEGAL REVIEW — PENDING OFFICIAL COUNSEL & CLIENT APPROVAL'}
            </span>
            <p className="leading-relaxed">
              {isUr
                ? 'یہ دستاویز پوپو لائیو کے انتظامی، حفاظتی اور کمیونٹی کے طے شدہ فریم ورک کی عکاسی کرتی ہے۔ کم از کم عمر کا تقاضا ۱۸ سال ہے۔ باضابطہ قانونی اصطلاحات اور علاقائی دائرہ اختیار کے حتمی نکات قانونی مشیر کی جانچ کے بعد منظور کیے جائیں گے۔'
                : 'This document specifies platform operational, safety, and community guidelines according to the approved product blueprint. The platform minimum user age is strictly eighteen (18) years. Final legal wording and jurisdiction clauses remain subject to formal counsel review.'}
            </p>
          </div>
        </div>

        {/* Page Hero Header */}
        <div
          className={`flex flex-col gap-4 border-b border-white/10 pb-8 ${
            isUr ? 'text-right' : 'text-left'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              {title}
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 flex items-center gap-1.5 bg-[#171722] px-3.5 py-1.5 rounded-full border border-white/10 font-mono">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {isUr ? 'آخری نظرثانی: ' : 'Status: '}
                  {lastUpdated}
                </span>
              </span>
            </div>
          </div>

          <p className="text-sm sm:text-base text-gray-400 leading-relaxed max-w-4xl">
            {description}
          </p>

          {/* Related Policies Nav Bar / Top Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-3">
            {policyNav.map((p) => {
              const isActive = p.matchHrefs.some((h) => pathname === h);
              return (
                <Link
                  key={p.href}
                  href={p.href}
                  className={`text-xs font-bold px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-popo-pink text-white shadow-lg shadow-popo-pink/25'
                      : 'bg-[#171722] hover:bg-[#20202F] text-gray-300 hover:text-white border border-white/10'
                  }`}
                >
                  {isUr ? p.labelUr : p.labelEn}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Mobile Collapsible Table of Contents */}
        <div className="lg:hidden rounded-2xl bg-[#171722] border border-white/10 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsMobileTocOpen(!isMobileTocOpen)}
            className={`w-full p-4 flex items-center justify-between text-left font-bold text-sm text-white ${
              isUr ? 'flex-row-reverse text-right' : ''
            }`}
          >
            <div className={`flex items-center gap-2 ${isUr ? 'flex-row-reverse' : ''}`}>
              <List className="w-4 h-4 text-popo-pink" />
              <span>
                {isUr
                  ? `فہرست مضامین (${sections.length} سیکشنز)`
                  : `Table of Contents (${sections.length} Sections)`}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                isMobileTocOpen ? 'rotate-180 text-popo-pink' : ''
              }`}
            />
          </button>
          {isMobileTocOpen && (
            <div className="px-4 pb-4 pt-1 border-t border-white/5 flex flex-col gap-1 text-xs">
              {sections.map((sec, idx) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  onClick={() => setIsMobileTocOpen(false)}
                  className={`py-2 px-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors ${
                    isUr ? 'text-right' : 'text-left'
                  }`}
                >
                  <span className="font-mono text-popo-pink font-bold mr-2">{idx + 1}.</span>
                  <span>{isUr ? sec.titleUr : sec.titleEn}</span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Main Content Layout with Desktop Sticky TOC */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Desktop Sticky Table of Contents Sidebar */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-28 rounded-3xl bg-[#171722] border border-white/10 p-6 shadow-xl max-h-[calc(100vh-140px)] overflow-y-auto">
            <div
              className={`flex items-center gap-2 font-bold text-sm text-white border-b border-white/10 pb-3 mb-3 ${
                isUr ? 'flex-row-reverse text-right' : ''
              }`}
            >
              <List className="w-4 h-4 text-popo-pink" />
              <span>{isUr ? 'فہرست مضامین' : 'Table of Contents'}</span>
            </div>
            <nav className="flex flex-col gap-1 text-xs">
              {sections.map((sec, idx) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className={`py-2 px-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 ${
                    isUr ? 'flex-row-reverse text-right' : 'text-left'
                  }`}
                >
                  <span className="font-mono text-popo-pink font-bold text-[11px] shrink-0">
                    {idx + 1}.
                  </span>
                  <span className="truncate">{isUr ? sec.titleUr : sec.titleEn}</span>
                </a>
              ))}
            </nav>
          </aside>

          {/* Numbered Content Sections */}
          <div className="lg:col-span-8 flex flex-col gap-10">
            {sections.map((sec, idx) => (
              <section
                key={sec.id}
                id={sec.id}
                className={`scroll-mt-28 p-6 sm:p-8 rounded-3xl bg-[#171722] border border-white/10 shadow-lg flex flex-col gap-4 ${
                  isUr ? 'text-right' : 'text-left'
                }`}
              >
                <div
                  className={`flex items-center gap-3 border-b border-white/5 pb-4 ${
                    isUr ? 'flex-row-reverse' : ''
                  }`}
                >
                  <span className="w-8 h-8 rounded-xl bg-popo-pink/15 text-popo-pink border border-popo-pink/30 flex items-center justify-center font-mono font-black text-xs shrink-0">
                    {idx + 1}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {isUr ? sec.titleUr : sec.titleEn}
                  </h2>
                </div>

                <div className="text-xs sm:text-sm text-gray-300 leading-relaxed space-y-3.5">
                  {isUr ? sec.contentUr : sec.contentEn}
                </div>
              </section>
            ))}

            {/* End of Policy / Contact Box */}
            <div className="p-6 rounded-3xl bg-[#131A2B]/60 border border-white/10 text-center flex flex-col items-center gap-3">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                {isUr ? 'سوالات یا قانونی استفسارات؟' : 'Questions Regarding This Policy?'}
              </span>
              <p className="text-xs text-gray-400 max-w-md leading-relaxed">
                {isUr
                  ? 'اگر آپ کو اس پالیسی کے بارے میں کوئی سوال ہے تو ہماری قانونی و تعمیلی ٹیم سے رابطہ کریں۔'
                  : 'If you have questions or inquiries regarding Popo Live platform policies or compliance requirements, reach out to our team.'}
              </p>
              <Link
                href="/contact"
                className="text-xs font-bold text-popo-pink hover:underline"
              >
                {isUr ? 'سپورٹ ٹیم سے رابطہ کریں ←' : 'Contact Support & Compliance →'}
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer lang={lang} />

      <AuthModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        lang={lang}
      />
    </div>
  );
};
