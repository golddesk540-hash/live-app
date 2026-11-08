'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { content } from './content';
import { Briefcase, UserCheck, Award, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';

export interface CreatorAgencySectionProps {
  lang: 'en' | 'ur';
}

export const CreatorAgencySection: React.FC<CreatorAgencySectionProps> = ({ lang }) => {
  const t = content[lang].agency;
  const isUr = lang === 'ur';

  return (
    <section id="agency" className="py-20 relative bg-popo-dark-950 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className={`max-w-3xl mb-14 flex flex-col gap-3 ${isUr ? 'text-right ml-auto' : 'text-left'}`}>
          <div className={`inline-flex items-center gap-2 ${isUr ? 'self-end' : 'self-start'}`}>
            <span className="text-xs font-bold uppercase tracking-widest text-popo-cyan flex items-center gap-1.5 px-3 py-1 rounded-full bg-popo-cyan/10 border border-popo-cyan/20">
              <Briefcase className="w-3.5 h-3.5" />
              {t.tag}
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            {t.title}
          </h2>

          <p className="text-sm sm:text-base text-popo-text-secondary leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        {/* Dual Program Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Card 1: Become a Host */}
          <div className={`relative p-8 rounded-3xl bg-gradient-to-br from-popo-dark-850 to-popo-dark-900 border border-white/10 hover:border-popo-pink/40 transition-all flex flex-col justify-between gap-6 ${isUr ? 'text-right' : 'text-left'}`}>
            <div className="flex flex-col gap-4">
              <div className={`w-12 h-12 rounded-2xl bg-popo-pink/15 border border-popo-pink/30 flex items-center justify-center text-popo-pink ${isUr ? 'self-end' : 'self-start'}`}>
                <UserCheck className="w-6 h-6" />
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-white">
                {t.hostCard.title}
              </h3>

              <p className="text-sm text-popo-text-secondary leading-relaxed">
                {t.hostCard.desc}
              </p>

              <div className="flex flex-col gap-2.5 pt-2">
                <div className={`flex items-center gap-2 text-xs font-semibold text-white ${isUr ? 'flex-row-reverse' : ''}`}>
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{isUr ? 'لیول ۵ ویلتھ گیٹ اور فیشل تصدیق' : 'Level 5 Wealth Gate & Facial KYC Verification'}</span>
                </div>
                <div className={`flex items-center gap-2 text-xs font-semibold text-white ${isUr ? 'flex-row-reverse' : ''}`}>
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{isUr ? 'روزانہ اسٹریمنگ گھنٹوں پر اسٹریک بونس' : 'Daily Streaming Hour Missions & Consecutive Streaks'}</span>
                </div>
                <div className={`flex items-center gap-2 text-xs font-semibold text-white ${isUr ? 'flex-row-reverse' : ''}`}>
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{isUr ? '۷۰٪ ہوسٹ گفٹ پوائنٹس شیئر' : 'Guaranteed 70% Gift Coin Conversion to Points'}</span>
                </div>
              </div>
            </div>

            <div className={`pt-4 border-t border-white/5 flex ${isUr ? 'justify-end' : 'justify-start'}`}>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  const el = document.getElementById('download');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {t.hostCard.btn}
              </Button>
            </div>
          </div>

          {/* Card 2: Agency Partnership */}
          <div className={`relative p-8 rounded-3xl bg-gradient-to-br from-popo-dark-850 to-popo-dark-900 border border-white/10 hover:border-popo-cyan/40 transition-all flex flex-col justify-between gap-6 ${isUr ? 'text-right' : 'text-left'}`}>
            <div className="flex flex-col gap-4">
              <div className={`w-12 h-12 rounded-2xl bg-popo-cyan/15 border border-popo-cyan/30 flex items-center justify-center text-popo-cyan ${isUr ? 'self-end' : 'self-start'}`}>
                <TrendingUp className="w-6 h-6" />
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-white">
                {t.agencyCard.title}
              </h3>

              <p className="text-sm text-popo-text-secondary leading-relaxed">
                {t.agencyCard.desc}
              </p>

              <div className="flex flex-col gap-2.5 pt-2">
                <div className={`flex items-center gap-2 text-xs font-semibold text-white ${isUr ? 'flex-row-reverse' : ''}`}>
                  <CheckCircle className="w-4 h-4 text-popo-cyan shrink-0" />
                  <span>{isUr ? 'سرشار ایجنسی مینجمنٹ ڈیش بورڈ' : 'Dedicated Agency Management Portal & Roster Tools'}</span>
                </div>
                <div className={`flex items-center gap-2 text-xs font-semibold text-white ${isUr ? 'flex-row-reverse' : ''}`}>
                  <CheckCircle className="w-4 h-4 text-popo-cyan shrink-0" />
                  <span>{isUr ? 'ہوسٹ کی کارکردگی اور اسٹریمنگ تجزیات' : 'Real-Time Host Performance & Broadcasting Analytics'}</span>
                </div>
                <div className={`flex items-center gap-2 text-xs font-semibold text-white ${isUr ? 'flex-row-reverse' : ''}`}>
                  <CheckCircle className="w-4 h-4 text-popo-cyan shrink-0" />
                  <span>{isUr ? 'ایجنسی ریونیو شیئر اور محفوظ ادائیگی' : 'Transparent Agency Splits & Bulk Settlement'}</span>
                </div>
              </div>
            </div>

            <div className={`pt-4 border-t border-white/5 flex ${isUr ? 'justify-end' : 'justify-start'}`}>
              <Button
                variant="cyan"
                size="md"
                onClick={() => {
                  const el = document.getElementById('footer');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {t.agencyCard.btn}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
