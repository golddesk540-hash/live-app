'use client';

import React from 'react';
import { Download, UserCheck, Video, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface HowItWorksSectionProps {
  lang: 'en' | 'ur';
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ lang }) => {
  const isUr = lang === 'ur';

  const steps = [
    {
      step: '01',
      icon: <Download className="w-6 h-6 text-popo-pink" />,
      title: isUr ? 'ایپ حاصل کریں' : 'Download Popo Live',
      desc: isUr
        ? 'گوگل پلے یا ایپل ایپ اسٹور سے آفیشل ایپ مفت میں انسٹال کریں۔'
        : 'Get the official app for Android or iOS from the verified app store.',
    },
    {
      step: '02',
      icon: <UserCheck className="w-6 h-6 text-purple-400" />,
      title: isUr ? 'پروفائل بنائیں اور عمر تصدیق کریں' : 'Complete 18+ Verification',
      desc: isUr
        ? 'گوگل، فون نمبر یا ایپل آئی ڈی سے سائن اپ کریں اور محفوظ شناختی تصدیق مکمل کریں۔'
        : 'Sign up securely and complete the fast facial age check to unlock creator privileges.',
    },
    {
      step: '03',
      icon: <Video className="w-6 h-6 text-popo-cyan" />,
      title: isUr ? 'لائیو جائیں یا پارٹی جوائن کریں' : 'Go Live or Join Rooms',
      desc: isUr
        ? 'ایک کلک پر اپنا سولو براڈکاسٹ شروع کریں یا ۹ سیٹوں والی پارٹی میں شامل ہوں۔'
        : 'Broadcast your talent solo, challenge rivals in PK battles, or take a mic seat in party rooms.',
    },
    {
      step: '04',
      icon: <Gift className="w-6 h-6 text-amber-400" />,
      title: isUr ? 'تحائف اور انعامات کی وصولی' : 'Receive Gifts & Cash Out',
      desc: isUr
        ? 'شائقین سے تھری ڈی تحائف وصول کریں اور ستر فیصد شیئر کے ساتھ فوری رقم نکلوائیں۔'
        : 'Receive animated gifts from supporters and withdraw points with our transparent 70% share.',
    },
  ];

  return (
    <section className="py-20 bg-[#0B0E17] relative border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-popo-cyan px-3.5 py-1.5 rounded-full bg-popo-cyan/10 border border-popo-cyan/20">
            {isUr ? 'طریقہ کار' : 'How Popo Live Works'}
          </span>
          <h2 className={cn('text-3xl sm:text-4xl font-extrabold text-white mt-4', isUr && 'font-urdu')}>
            {isUr
              ? 'چند آسان مراحل میں لائیو اسٹریمنگ کا سفر شروع کریں'
              : 'Start Your Live Journey in Four Simple Steps'}
          </h2>
          <p className="text-sm sm:text-base text-popo-text-secondary mt-3">
            {isUr
              ? 'چاہے آپ ناظر ہوں یا ہوسٹ، پوپو لائیو پر شامل ہونا انتہائی آسان اور محفوظ ہے۔'
              : 'Whether you want to discover exciting content or build a global broadcasting career.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, idx) => (
            <div
              key={idx}
              className="relative p-6 rounded-3xl bg-[#131A2B]/80 border border-white/10 hover:border-popo-pink/40 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-popo-pink/15 group-hover:border-popo-pink/30 transition-colors">
                    {s.icon}
                  </div>
                  <span className="text-2xl font-black text-white/20 group-hover:text-popo-pink/40 transition-colors">
                    {s.step}
                  </span>
                </div>

                <h3 className={cn('text-lg font-bold text-white mb-2 group-hover:text-popo-pink transition-colors', isUr && 'font-urdu')}>
                  {s.title}
                </h3>
                <p className="text-sm text-popo-text-secondary leading-relaxed">
                  {s.desc}
                </p>
              </div>

              <div className="w-full h-1 rounded-full bg-white/5 mt-6 overflow-hidden">
                <div className="w-1/3 h-full bg-gradient-to-r from-popo-pink to-popo-purple group-hover:w-full transition-all duration-500" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
