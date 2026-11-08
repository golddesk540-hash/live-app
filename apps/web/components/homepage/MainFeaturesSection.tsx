'use client';

import React from 'react';
import { Video, Users, Swords, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MainFeaturesSectionProps {
  lang: 'en' | 'ur';
}

export const MainFeaturesSection: React.FC<MainFeaturesSectionProps> = ({ lang }) => {
  const isUr = lang === 'ur';

  const features = [
    {
      id: 'live',
      icon: <Video className="w-8 h-8 text-popo-pink" />,
      title: isUr ? 'لائیو اسٹریمنگ' : 'Live Streaming',
      desc: isUr
        ? 'دنیا بھر سے باصلاحیت ہوسٹس کو دیکھیں اور ان سے ریئل ٹائم میں بات کریں۔'
        : 'Watch top broadcast talent worldwide with ultra-low latency streaming.',
      link: '#live',
    },
    {
      id: 'party',
      icon: <Users className="w-8 h-8 text-popo-pink" />,
      title: isUr ? 'پارٹی رومز' : 'Party Rooms',
      desc: isUr
        ? '۹ سیٹوں والے وائس لاؤنجز میں دوستوں کے ساتھ گپ شپ کریں اور محفل سجائیں۔'
        : 'Join 9-seat voice and video lounges to hang out, chat, and play music.',
      link: '#party',
    },
    {
      id: 'pk',
      icon: <Swords className="w-8 h-8 text-popo-pink" />,
      title: isUr ? 'پی کے مقابلے' : 'PK Battles',
      desc: isUr
        ? 'دو براڈکاسٹرز کا آمنے سامنے سنسنی خیز مقابلہ۔ اپنے پسندیدہ کو جتوائیں۔'
        : 'Experience intense 1v1 streamer showdowns powered by live fan support.',
      link: '#pk',
    },
    {
      id: 'gifts',
      icon: <Gift className="w-8 h-8 text-popo-pink" />,
      title: isUr ? 'تحائف اور انعامات' : 'Gifts & Rewards',
      desc: isUr
        ? 'شاندار تھری ڈی اینیمیٹڈ تحائف بھیجیں اور لائیو اسٹریمنگ سے کمائی کریں۔'
        : 'Send luxury animated 3D gifts and earn rewards with a 70% host conversion.',
      link: '#gifts',
    },
  ];

  return (
    <section className="py-12 bg-popo-dark-950 border-y border-white/5 relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {features.map((f) => (
            <a
              key={f.id}
              href={f.link}
              className={cn(
                'group flex flex-col items-center text-center p-6 rounded-2xl bg-[#131A2B]/60 hover:bg-[#131A2B] border border-white/5 hover:border-popo-pink/40 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-glow-pink/20',
                isUr && 'font-urdu'
              )}
            >
              <div className="w-16 h-16 rounded-2xl bg-popo-pink/10 border border-popo-pink/20 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:bg-popo-pink/20">
                {f.icon}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2 group-hover:text-popo-pink transition-colors">
                {f.title}
              </h3>
              <p className="text-xs sm:text-sm text-popo-text-secondary line-clamp-2 leading-relaxed">
                {f.desc}
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
