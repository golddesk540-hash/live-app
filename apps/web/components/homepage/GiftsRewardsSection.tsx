'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { content } from './content';
import { Gift, Coins, Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export interface GiftsRewardsSectionProps {
  lang: 'en' | 'ur';
}

export const GiftsRewardsSection: React.FC<GiftsRewardsSectionProps> = ({ lang }) => {
  const t = content[lang].gifts;
  const isUr = lang === 'ur';

  const giftCatalog = [
    { icon: '🌹', name: isUr ? 'سرخ گلاب' : 'Lucky Rose', coins: 10, points: 7 },
    { icon: '🏎️', name: isUr ? 'سپر اسپورٹس کار' : 'Supercar', coins: 1000, points: 700 },
    { icon: '🚀', name: isUr ? 'اسپیس راکٹ' : 'Luxury Rocket', coins: 5000, points: 3500, hot: true },
    { icon: '🏰', name: isUr ? 'شاہی محل' : 'Royal Castle', coins: 15000, points: 10500 },
    { icon: '👑', name: isUr ? 'امپیریل کراؤن' : 'Imperial Crown', coins: 30000, points: 21000 },
    { icon: '🌌', name: isUr ? 'کہکشاں' : 'Space Galaxy', coins: 50000, points: 35000, hot: true },
  ];

  return (
    <section className="py-20 relative bg-popo-dark-900 border-t border-white/5 overflow-hidden">
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Heading */}
        <div className={`max-w-3xl mb-12 flex flex-col gap-3 ${isUr ? 'text-right ml-auto' : 'text-left'}`}>
          <div className={`inline-flex items-center gap-2 ${isUr ? 'self-end' : 'self-start'}`}>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Gift className="w-3.5 h-3.5" />
              {t.tag}
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            {t.title}
          </h2>

          <p className="text-sm sm:text-base text-popo-text-secondary leading-relaxed">
            {t.subtitle}
          </p>

          {/* 70% Host Share Callout Banner */}
          <div className="mt-2 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-popo-pink/15 to-purple-500/15 border border-amber-400/30 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-black flex items-center justify-center font-black text-sm shrink-0">
              70%
            </div>
            <p className="text-xs sm:text-sm font-semibold text-white">
              {t.hostShareNotice}
            </p>
          </div>
        </div>

        {/* Gift Showcase Shelf */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          {giftCatalog.map((item) => (
            <div
              key={item.name}
              className="relative p-4 rounded-2xl bg-popo-dark-850 border border-white/10 hover:border-amber-400/50 hover:shadow-glow-gold transition-all duration-300 flex flex-col items-center text-center group cursor-pointer"
            >
              {item.hot && (
                <span className="absolute top-2 right-2 text-[9px] font-black uppercase bg-gradient-to-r from-red-600 to-popo-pink text-white px-1.5 py-0.5 rounded-full shadow-sm">
                  POPULAR
                </span>
              )}
              <span className="text-4xl sm:text-5xl my-3 transition-transform duration-300 group-hover:scale-110 drop-shadow-md">
                {item.icon}
              </span>
              <h4 className="text-xs font-bold text-white mb-1 truncate w-full">{item.name}</h4>
              <div className="flex items-center gap-1 text-amber-400 text-xs font-extrabold mb-1">
                <Coins className="w-3 h-3 fill-amber-400" />
                <span>{item.coins.toLocaleString()}</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold">
                +{item.points.toLocaleString()} Host Pts
              </span>
            </div>
          ))}
        </div>

        {/* Dual Cards: Coins & Points Flow */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Viewers & Gifting */}
          <div className={`p-6 rounded-3xl bg-popo-dark-850 border border-white/10 flex flex-col justify-between gap-6 ${isUr ? 'text-right' : 'text-left'}`}>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                {isUr ? 'صارفین کے لیے کوائنز' : 'For Viewers & Fans'}
              </span>
              <h3 className="text-lg font-bold text-white">
                {isUr ? 'آسان اور محفوظ کوائنز ٹاپ اپ' : 'Instant Top-Up & VIP Privileges'}
              </h3>
              <p className="text-xs sm:text-sm text-popo-text-secondary leading-relaxed">
                {isUr
                  ? 'آفیشل اسٹور اور تصدیق شدہ سیلرز سے کوائنز خریدیں۔ تحائف بھیج کر اپنے ویلتھ لیول اور فین کلب رینک کو بلند کریں۔'
                  : 'Recharge coins securely through Google Play, Apple App Store, and authorized coin sellers. Unlock custom avatar frames and glowing entrance effects.'}
              </p>
            </div>
            <div className={`flex items-center gap-3 ${isUr ? 'justify-end' : 'justify-start'}`}>
              <Button
                variant="vip"
                size="sm"
                onClick={() => {
                  const el = document.getElementById('download');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                leftIcon={<Coins className="w-4 h-4 fill-black" />}
              >
                {t.rechargeBtn}
              </Button>
            </div>
          </div>

          {/* Card 2: Creators & Cash Out */}
          <div className={`p-6 rounded-3xl bg-popo-dark-850 border border-white/10 flex flex-col justify-between gap-6 ${isUr ? 'text-right' : 'text-left'}`}>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                {isUr ? 'ہوسٹس کے لیے پوائنٹس' : 'For Broadcasters & Hosts'}
              </span>
              <h3 className="text-lg font-bold text-white">
                {isUr ? 'شفاف ہوسٹ پوائنٹس اور کیش آؤٹ' : 'Direct Host Points & Fast Withdrawals'}
              </h3>
              <p className="text-xs sm:text-sm text-popo-text-secondary leading-relaxed">
                {isUr
                  ? 'آپ کی اسٹریم پر موصول ہونے والے ہر گفٹ کا ۷۰٪ فوری طور پر پوائنٹس میں تبدیل ہو جاتا ہے۔ بینک اکاؤنٹ میں باآسانی رقم حاصل کریں۔'
                  : 'Every gift sent in your live room immediately accrues to your host points ledger. Complete KYC verification and withdraw earnings with audit tracking.'}
              </p>
            </div>
            <div className={`flex items-center gap-3 ${isUr ? 'justify-end' : 'justify-start'}`}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const el = document.getElementById('agency');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                leftIcon={<Sparkles className="w-4 h-4 text-emerald-400" />}
              >
                {t.withdrawBtn}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
