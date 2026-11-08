'use client';

import React from 'react';
import { ShieldCheck, Zap, DollarSign, Users, Award, HeartHandshake } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WhyChooseSectionProps {
  lang: 'en' | 'ur';
}

export const WhyChooseSection: React.FC<WhyChooseSectionProps> = ({ lang }) => {
  const isUr = lang === 'ur';

  const pillars = [
    {
      icon: <DollarSign className="w-6 h-6 text-amber-400" />,
      title: isUr ? '۷۰ فیصد فیاضانہ شیئر' : 'Industry-Leading 70% Host Share',
      desc: isUr
        ? 'تحائف کی کل قیمت کا ستر فیصد حصہ براہ راست ہوسٹ کے قابل واپسی اکاؤنٹ میں جاتا ہے۔'
        : 'Broadcasters retain 70% of all gift coin values directly into redeemable cash points.',
    },
    {
      icon: <Zap className="w-6 h-6 text-popo-pink" />,
      title: isUr ? 'انتہائی تیز اور ہموار اسٹریمنگ' : 'Ultra-Low Latency Video',
      desc: isUr
        ? 'صفر وقفے اور ہائی ڈیفینیشن ویڈیو کے ساتھ ناظرین کے ساتھ ریئل ٹائم گفتگو۔'
        : 'Powered by real-time RTC infrastructure delivering sub-second audio & video globally.',
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
      title: isUr ? '۱۸+ محفوظ اور باوقار ماحول' : 'Strict 18+ Safety & Moderation',
      desc: isUr
        ? 'سخت عمر تصدیق اور چوبیس گھنٹے نگرانی کے ساتھ تمام صارفین کے لیے محفوظ پلیٹ فارم۔'
        : 'Rigorous facial verification, AI safety shields, and human moderators protecting your stream.',
    },
    {
      icon: <Users className="w-6 h-6 text-purple-400" />,
      title: isUr ? '۹ سیٹوں والے وائس لاؤنجز' : 'Interactive 9-Seat Party Grids',
      desc: isUr
        ? 'ایک ہوسٹ اور آٹھ دوست ایک ساتھ مائیک پر آ کر بات چیت اور موسیقی سے لطف اندوز ہوں۔'
        : 'Fixed 1 Host + 8 Guest seat architecture designed for high-concurrency group voice & video.',
    },
    {
      icon: <Award className="w-6 h-6 text-popo-cyan" />,
      title: isUr ? 'روزانہ ٹاسک اور انعامات' : 'Daily Tasks & Streak Bonuses',
      desc: isUr
        ? 'روزانہ لائیو سٹریمنگ کے اہداف حاصل کریں اور اضافی سکے اور لیول اپ انعامات پائیں۔'
        : 'Complete creator quests, climb daily leaderboards, and unlock VIP aesthetic crowns.',
    },
    {
      icon: <HeartHandshake className="w-6 h-6 text-rose-400" />,
      title: isUr ? 'مخلص ایجنسی سپورٹ' : 'Dedicated Agency Partnerships',
      desc: isUr
        ? 'ایجنسی مینیجرز کے لیے جامع رپورٹنگ، ہوسٹ بھرتی اور خودکار شفاف ادائیگیوں کا نظام۔'
        : 'Transparent agency portals with performance dashboards, instant settlements, and direct training.',
    },
  ];

  return (
    <section className="py-20 bg-[#0B0E17] relative border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-popo-pink px-3.5 py-1.5 rounded-full bg-popo-pink/10 border border-popo-pink/20">
            {isUr ? 'پوپو لائیو کا انتخاب کیوں؟' : 'Why Choose Popo Live'}
          </span>
          <h2 className={cn('text-3xl sm:text-4xl font-extrabold text-white mt-4', isUr && 'font-urdu')}>
            {isUr
              ? 'تخلیق کاروں اور کمیونٹی کے لیے بنایا گیا سب سے طاقتور پلیٹ فارم'
              : 'Built for High-Growth Creators and Vibrant Social Communities'}
          </h2>
          <p className="text-sm sm:text-base text-popo-text-secondary mt-3">
            {isUr
              ? 'ہم نے ہر فیچر کو شفافیت، حفاظت اور اعلیٰ تفریح کو مدنظر رکھ کر تیار کیا ہے۔'
              : 'Experience a creator-first entertainment ecosystem with crystal-clear rules and high real-time rewards.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map((p, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-[#131A2B]/80 border border-white/10 hover:border-popo-pink/40 transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-popo-pink/15 group-hover:border-popo-pink/30 transition-colors">
                {p.icon}
              </div>
              <h3 className={cn('text-lg font-bold text-white mb-2 group-hover:text-popo-pink transition-colors', isUr && 'font-urdu')}>
                {p.title}
              </h3>
              <p className="text-sm text-popo-text-secondary leading-relaxed">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
