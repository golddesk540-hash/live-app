'use client';

import React from 'react';
import Link from 'next/link';
import { content } from './content';
import { ShieldCheck, Heart } from 'lucide-react';

export interface FooterProps {
  lang: 'en' | 'ur';
}

export const Footer: React.FC<FooterProps> = ({ lang }) => {
  const t = content[lang].footer;
  const isUr = lang === 'ur';

  return (
    <footer id="footer" className="bg-popo-dark-950 border-t border-white/10 pt-16 pb-12 text-popo-text-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
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
                  className="w-8 h-8 rounded-full bg-popo-dark-850 hover:bg-popo-dark-800 border border-white/10 flex items-center justify-center text-xs font-bold text-white hover:text-popo-pink transition-colors cursor-pointer select-none"
                >
                  {soc.slice(0, 2)}
                </span>
              ))}
            </div>
          </div>

          {/* Column 1: Navigation / Platforms */}
          <div className={`flex flex-col gap-3 ${isUr ? 'text-right' : 'text-left'}`}>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">{t.platforms}</h4>
            <ul className="flex flex-col gap-2 text-xs">
              <li><Link href="/" className="hover:text-white transition-colors">{isUr ? 'ہوم' : 'Home'}</Link></li>
              <li><Link href="/#live" className="hover:text-white transition-colors">{isUr ? 'لائیو اسٹریمنگ' : 'Live Streams'}</Link></li>
              <li><Link href="/#party" className="hover:text-white transition-colors">{isUr ? '۹ سیٹ پارٹی رومز' : '9-Seat Party Lounges'}</Link></li>
              <li><Link href="/#pk" className="hover:text-white transition-colors">{isUr ? 'پی کے بیٹلز' : 'PK Battles'}</Link></li>
              <li><Link href="/#download" className="hover:text-white transition-colors">{isUr ? 'موبائل ایپس' : 'Mobile Applications'}</Link></li>
              <li><Link href="/design-system" target="_blank" className="text-popo-cyan hover:underline">{isUr ? 'ڈیزائن سسٹم پریویو' : 'Design Tokens Preview'}</Link></li>
            </ul>
          </div>

          {/* Column 2: Creators & Agency */}
          <div className={`flex flex-col gap-3 ${isUr ? 'text-right' : 'text-left'}`}>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">{t.creators}</h4>
            <ul className="flex flex-col gap-2 text-xs">
              <li><Link href="/agency" className="hover:text-white transition-colors">{isUr ? 'ایجنسی پارٹنرشپ' : 'Agency Portal'}</Link></li>
              <li><Link href="/agency#apply" className="hover:text-white transition-colors">{isUr ? 'ہوسٹ رجسٹریشن' : 'Become a Host'}</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">{isUr ? 'کوائن سیلرز رابطہ' : 'Authorized Coin Resellers'}</Link></li>
              <li><Link href="/news" className="hover:text-white transition-colors">{isUr ? 'کمیونٹی ایونٹس' : 'Leaderboards & Events'}</Link></li>
            </ul>
          </div>

          {/* Column 3: Legal & Policies */}
          <div className={`flex flex-col gap-3 ${isUr ? 'text-right' : 'text-left'}`}>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">{t.legal}</h4>
            <ul className="flex flex-col gap-2 text-xs">
              <li><Link href="/about" className="hover:text-white transition-colors">{isUr ? 'ہمارے متعلق' : 'About Us'}</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">{isUr ? 'رابطہ کریں' : 'Contact Us'}</Link></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">{isUr ? 'استعمال کی شرائط' : 'Terms of Service (Draft)'}</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">{isUr ? 'پرائیویسی پالیسی' : 'Privacy Policy (Draft)'}</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">{isUr ? 'کمیونٹی گائیڈ لائنز' : 'Community Guidelines (Draft)'}</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">{isUr ? 'چائلڈ سیفٹی چارٹر' : 'Child Safety & Protection'}</span></li>
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
