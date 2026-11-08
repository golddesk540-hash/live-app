'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { content } from './content';
import { ShieldCheck, Heart, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/lib/languageContext';

export interface FooterProps {
  lang?: 'en' | 'ur';
}

export const Footer: React.FC<FooterProps> = ({ lang: propLang }) => {
  const { lang: contextLang } = useLanguage();
  const lang = propLang || contextLang || 'en';
  const t = content[lang].footer;
  const isUr = lang === 'ur';

  // Mobile Accordion state
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    platforms: false,
    creators: false,
    legal: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <footer id="footer" className="bg-[#0B0E17] border-t border-white/10 pt-12 sm:pt-16 pb-12 text-popo-text-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 pb-8 sm:pb-12 border-b border-white/10">
          {/* Brand Info */}
          <div className={`lg:col-span-2 flex flex-col gap-4 ${isUr ? 'text-right' : 'text-left'}`}>
            <Link href="/" className={`flex items-center gap-3 ${isUr ? 'justify-end' : 'justify-start'}`}>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-popo-pink via-purple-600 to-popo-cyan p-[2px] shadow-glow-pink">
                <div className="w-full h-full bg-popo-dark-950 rounded-[14px] flex items-center justify-center font-black text-xl text-popo-pink">
                  P
                </div>
              </div>
              <span className="font-black text-2xl tracking-tight text-white">
                POPO <span className="text-popo-pink">LIVE</span>
              </span>
            </Link>

            <p className="text-xs sm:text-sm text-popo-text-secondary leading-relaxed max-w-sm">
              {t.tagline}
            </p>

            <div className={`flex items-center gap-2 text-xs text-amber-400 font-semibold pt-1 ${isUr ? 'justify-end' : 'justify-start'}`}>
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{isUr ? 'صرف ۱۸ سال اور زائد عمر کے لیے' : 'Strict 18+ Verified Platform'}</span>
            </div>

            {/* Social Media Links */}
            <div className={`flex items-center gap-3 pt-2 ${isUr ? 'justify-end' : 'justify-start'}`}>
              {['TikTok', 'Instagram', 'Twitter/X', 'YouTube', 'Facebook'].map((soc) => (
                <span
                  key={soc}
                  className="w-9 h-9 rounded-full bg-popo-dark-850 hover:bg-popo-dark-800 border border-white/10 flex items-center justify-center text-xs font-bold text-white hover:text-popo-pink transition-colors cursor-pointer select-none active:scale-95"
                >
                  {soc.slice(0, 2)}
                </span>
              ))}
            </div>
          </div>

          {/* Column 1: Navigation / Platforms */}
          <div className={`flex flex-col border-t border-white/5 md:border-0 pt-4 md:pt-0 ${isUr ? 'text-right' : 'text-left'}`}>
            <button
              onClick={() => toggleSection('platforms')}
              className="flex items-center justify-between w-full md:cursor-default"
            >
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">{t.platforms}</h4>
              <ChevronDown
                className={`w-4 h-4 text-popo-text-muted md:hidden transition-transform duration-200 ${
                  openSections.platforms ? 'rotate-180 text-popo-pink' : ''
                }`}
              />
            </button>
            <ul
              className={`flex flex-col gap-2 text-xs pt-3 ${
                openSections.platforms ? 'block' : 'hidden md:flex'
              }`}
            >
              <li><Link href="/" className="hover:text-white transition-colors block py-1">{isUr ? 'ہوم' : 'Home'}</Link></li>
              <li><Link href="/#live" className="hover:text-white transition-colors block py-1">{isUr ? 'لائیو اسٹریمنگ' : 'Live Streams'}</Link></li>
              <li><Link href="/#party" className="hover:text-white transition-colors block py-1">{isUr ? '۹ سیٹ پارٹی رومز' : '9-Seat Party Lounges'}</Link></li>
              <li><Link href="/#pk" className="hover:text-white transition-colors block py-1">{isUr ? 'پی کے بیٹلز' : 'PK Battles'}</Link></li>
              <li><Link href="/#download" className="hover:text-white transition-colors block py-1">{isUr ? 'موبائل ایپس' : 'Mobile Applications'}</Link></li>
              <li><Link href="/design-system" target="_blank" className="text-popo-cyan hover:underline block py-1">{isUr ? 'ڈیزائن سسٹم پریویو' : 'Design Tokens Preview'}</Link></li>
            </ul>
          </div>

          {/* Column 2: Creators & Agency */}
          <div className={`flex flex-col border-t border-white/5 md:border-0 pt-4 md:pt-0 ${isUr ? 'text-right' : 'text-left'}`}>
            <button
              onClick={() => toggleSection('creators')}
              className="flex items-center justify-between w-full md:cursor-default"
            >
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">{t.creators}</h4>
              <ChevronDown
                className={`w-4 h-4 text-popo-text-muted md:hidden transition-transform duration-200 ${
                  openSections.creators ? 'rotate-180 text-popo-pink' : ''
                }`}
              />
            </button>
            <ul
              className={`flex flex-col gap-2 text-xs pt-3 ${
                openSections.creators ? 'block' : 'hidden md:flex'
              }`}
            >
              <li><Link href="/agency" className="hover:text-white transition-colors block py-1">{isUr ? 'ایجنسی پورٹل' : 'Agency Portal'}</Link></li>
              <li><Link href="/agency#apply-form" className="hover:text-white transition-colors block py-1">{isUr ? 'ہوسٹ رجسٹریشن' : 'Become a Host'}</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors block py-1">{isUr ? 'کوائن سیلرز رابطہ' : 'Authorized Coin Resellers'}</Link></li>
              <li><Link href="/news" className="hover:text-white transition-colors block py-1">{isUr ? 'کمیونٹی ایونٹس' : 'Leaderboards & Events'}</Link></li>
            </ul>
          </div>

          {/* Column 3: Legal & Policies */}
          <div className={`flex flex-col border-t border-white/5 md:border-0 pt-4 md:pt-0 ${isUr ? 'text-right' : 'text-left'}`}>
            <button
              onClick={() => toggleSection('legal')}
              className="flex items-center justify-between w-full md:cursor-default"
            >
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">{t.legal}</h4>
              <ChevronDown
                className={`w-4 h-4 text-popo-text-muted md:hidden transition-transform duration-200 ${
                  openSections.legal ? 'rotate-180 text-popo-pink' : ''
                }`}
              />
            </button>
            <ul
              className={`flex flex-col gap-2 text-xs pt-3 ${
                openSections.legal ? 'block' : 'hidden md:flex'
              }`}
            >
              <li><Link href="/policies" className="text-popo-pink hover:underline font-bold block py-1">{isUr ? 'تمام پالیسیوں کا مرکز' : 'Policies Hub'}</Link></li>
              <li><Link href="/policies/terms" className="hover:text-white transition-colors block py-1">{isUr ? 'استعمال کی شرائط (Terms)' : 'Terms of Service'}</Link></li>
              <li><Link href="/policies/privacy" className="hover:text-white transition-colors block py-1">{isUr ? 'پرائیویسی پالیسی (Privacy)' : 'Privacy Policy'}</Link></li>
              <li><Link href="/policies/community-guidelines" className="hover:text-white transition-colors block py-1">{isUr ? 'کمیونٹی گائیڈ لائنز' : 'Community Guidelines'}</Link></li>
              <li><Link href="/policies/refunds" className="hover:text-white transition-colors block py-1">{isUr ? 'ریفنڈ و ورچوئل کوائنز' : 'Refund & Virtual Items'}</Link></li>
              <li><Link href="/policies/cookies" className="hover:text-white transition-colors block py-1">{isUr ? 'کوکی پالیسی' : 'Cookie Policy'}</Link></li>
              <li><Link href="/safety" className="hover:text-white transition-colors block py-1">{isUr ? 'سیفٹی اور پروٹیکشن' : 'Safety Policy (18+)'}</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors block py-1">{isUr ? 'ہمارے متعلق' : 'About Popo Live'}</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors block py-1">{isUr ? 'سپورٹ ڈیسک' : 'Contact Support'}</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Age Disclaimer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-popo-text-muted">
          <span>{t.copyright}</span>
          <span className="flex items-center gap-1">
            <span>Built with precision for Popo Live</span>
            <Heart className="w-3.5 h-3.5 text-popo-pink fill-popo-pink" />
          </span>
        </div>
      </div>
    </footer>
  );
};
