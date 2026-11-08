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
  lastUpdated = 'November 8, 2026',
  sections,
}) => {
  const { lang, isUr } = useLanguage();
  const pathname = usePathname();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileTocOpen, setIsMobileTocOpen] = useState(false);

  const policyNav = [
    { labelEn: 'Terms of Service', labelUr: 'استعمال کی شرائط', href: '/terms' },
    { labelEn: 'Privacy Policy', labelUr: 'پرائیویسی پالیسی', href: '/privacy' },
    { labelEn: 'Community Guidelines', labelUr: 'کمیونٹی گائیڈ لائنز', href: '/community-guidelines' },
    { labelEn: 'Safety Policy (18+)', labelUr: 'سیفٹی اور پروٹیکشن', href: '/safety' },
    { labelEn: 'Cookie Policy', labelUr: 'کوکی پالیسی', href: '/cookies' },
  ];

  const title = isUr ? titleUr : titleEn;
  const description = isUr ? descUr : descEn;

  return (
    <div
      dir={isUr ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-popo-dark-950 text-popo-text-primary overflow-x-hidden selection:bg-popo-pink selection:text-white ${
        isUr ? 'font-urdu' : 'font-sans'
      }`}
    >
      <Navbar onOpenLogin={() => setIsLoginModalOpen(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 flex flex-col gap-8">
        {/* Breadcrumb Navigation */}
        <nav
          className={`flex items-center gap-2 text-xs text-popo-text-muted ${
            isUr ? 'flex-row-reverse justify-end' : ''
          }`}
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-white transition-colors">
            {isUr ? 'ہوم' : 'Home'}
          </Link>
          <ChevronRight className={`w-3.5 h-3.5 ${isUr ? 'rotate-180' : ''}`} />
          <span className="text-popo-text-secondary">{isUr ? 'قانونی پالیسیاں' : 'Legal & Policies'}</span>
          <ChevronRight className={`w-3.5 h-3.5 ${isUr ? 'rotate-180' : ''}`} />
          <span className="text-popo-pink font-semibold truncate max-w-[200px] sm:max-w-none">
            {title}
          </span>
        </nav>

        {/* DRAFT Warning Alert Box */}
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 sm:p-5 flex items-start gap-3.5">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className={`flex flex-col gap-1 text-xs sm:text-sm text-popo-text-secondary ${isUr ? 'text-right' : 'text-left'}`}>
            <span className="font-extrabold uppercase tracking-wider text-amber-400">
              {isUr ? 'مسودہ — قانونی مشاورت اور کلائنٹ منظوری کے زیر التواء' : 'DRAFT — Pending Client & Legal Counsel Approval'}
            </span>
            <p className="leading-relaxed">
              {isUr
                ? 'یہ دستاویز پوپو لائیو کے انتظامی، حفاظتی اور کمیونٹی کے طے شدہ فریم ورک کی عکاسی کرتی ہے۔ حتمی قانونی اصطلاحات کلائنٹ کے قانونی مشیر کی منظوری سے مشروط ہیں۔'
                : 'This document specifies platform operational, safety, and community guidelines according to the approved product blueprint. Final legal wording and regional jurisdiction clauses remain subject to formal counsel review.'}
            </p>
          </div>
        </div>

        {/* Page Hero Header */}
        <div className={`flex flex-col gap-4 border-b border-white/10 pb-8 ${isUr ? 'text-right' : 'text-left'}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              {title}
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-xs text-popo-text-muted flex items-center gap-1.5 bg-popo-dark-850 px-3 py-1.5 rounded-full border border-white/5">
                <Clock className="w-3.5 h-3.5 text-popo-cyan" />
                <span>{isUr ? 'آخری اپ ڈیٹ: ' : 'Last Updated: '}{lastUpdated}</span>
              </span>
            </div>
          </div>

          <p className="text-sm sm:text-base text-popo-text-secondary leading-relaxed max-w-4xl">
            {description}
          </p>

          {/* Related Policies Nav Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-3">
            {policyNav.map((p) => {
              const isActive = pathname === p.href;
              return (
                <Link
                  key={p.href}
                  href={p.href}
                  className={`text-xs font-bold px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-popo-pink text-white shadow-glow-pink'
                      : 'bg-popo-dark-850 hover:bg-popo-dark-800 text-popo-text-secondary hover:text-white border border-white/10'
                  }`}
                >
                  {isUr ? p.labelUr : p.labelEn}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Mobile Collapsible Table of Contents */}
        <div className="lg:hidden rounded-2xl bg-popo-dark-850 border border-white/10 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsMobileTocOpen(!isMobileTocOpen)}
            className={`w-full p-4 flex items-center justify-between text-left font-bold text-sm text-white ${
              isUr ? 'flex-row-reverse text-right' : ''
            }`}
          >
            <div className={`flex items-center gap-2 ${isUr ? 'flex-row-reverse' : ''}`}>
              <List className="w-4 h-4 text-popo-pink" />
              <span>{isUr ? `فہرست مضامین (${sections.length} سیکشنز)` : `Table of Contents (${sections.length} Sections)`}</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-popo-text-muted transition-transform duration-200 ${
                isMobileTocOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
          {isMobileTocOpen && (
            <div className="px-4 pb-4 pt-1 border-t border-white/5 flex flex-col gap-1.5 text-xs">
              {sections.map((sec, idx) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  onClick={() => setIsMobileTocOpen(false)}
                  className={`py-1.5 px-2.5 rounded-lg text-popo-text-secondary hover:text-white hover:bg-white/5 transition-colors ${
                    isUr ? 'text-right' : 'text-left'
                  }`}
                >
                  <span className="font-mono text-popo-pink font-bold mr-1.5">{idx + 1}.</span>
                  <span>{isUr ? sec.titleUr : sec.titleEn}</span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Main Content Layout with Desktop Sticky TOC */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Desktop Sticky Table of Contents Sidebar */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-28 rounded-3xl bg-popo-dark-900 border border-white/10 p-6 shadow-xl max-h-[calc(100vh-140px)] overflow-y-auto">
            <div className={`flex items-center gap-2 font-bold text-sm text-white border-b border-white/10 pb-3 mb-3 ${
              isUr ? 'flex-row-reverse text-right' : ''
            }`}>
              <List className="w-4 h-4 text-popo-pink" />
              <span>{isUr ? 'فہرست مضامین' : 'Table of Contents'}</span>
            </div>
            <nav className="flex flex-col gap-1 text-xs">
              {sections.map((sec, idx) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className={`py-2 px-3 rounded-xl text-popo-text-secondary hover:text-white hover:bg-popo-dark-850 transition-colors flex items-center gap-2 ${
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
          <div className="lg:col-span-8 flex flex-col gap-12">
            {sections.map((sec, idx) => (
              <section
                key={sec.id}
                id={sec.id}
                className={`scroll-mt-28 p-6 sm:p-8 rounded-3xl bg-popo-dark-900 border border-white/10 shadow-lg flex flex-col gap-4 ${
                  isUr ? 'text-right' : 'text-left'
                }`}
              >
                <div className={`flex items-center gap-3 border-b border-white/5 pb-4 ${
                  isUr ? 'flex-row-reverse' : ''
                }`}>
                  <span className="w-8 h-8 rounded-xl bg-popo-pink/15 text-popo-pink border border-popo-pink/30 flex items-center justify-center font-mono font-black text-xs shrink-0">
                    {idx + 1}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {isUr ? sec.titleUr : sec.titleEn}
                  </h2>
                </div>

                <div className="text-xs sm:text-sm text-popo-text-secondary leading-relaxed space-y-3">
                  {isUr ? sec.contentUr : sec.contentEn}
                </div>
              </section>
            ))}

            {/* End of Policy / Contact Box */}
            <div className="p-6 rounded-3xl bg-popo-dark-850 border border-white/10 text-center flex flex-col items-center gap-3">
              <span className="text-xs font-bold text-popo-cyan uppercase tracking-wider">
                {isUr ? 'سوالات یا قانونی استفسارات؟' : 'Questions Regarding This Policy?'}
              </span>
              <p className="text-xs text-popo-text-secondary max-w-md">
                {isUr
                  ? 'اگر آپ کو اس پالیسی کے بارے میں کوئی سوال ہے تو ہماری قانونی و سیفٹی ٹیم سے رابطہ کریں۔'
                  : 'If you have questions or inquiries regarding Popo Live platform policies, reach out to our compliance operations.'}
              </p>
              <Link
                href="/contact"
                className="text-xs font-bold text-popo-pink hover:underline"
              >
                {isUr ? 'سپورٹ ٹیم سے رابطہ کریں' : 'Contact Support & Compliance →'}
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <AuthModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
};
