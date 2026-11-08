'use client';

import React from 'react';
import { content } from './content';
import { Newspaper, Calendar, ArrowRight } from 'lucide-react';

export interface NewsSectionProps {
  lang: 'en' | 'ur';
}

export const NewsSection: React.FC<NewsSectionProps> = ({ lang }) => {
  const t = content[lang].news;
  const isUr = lang === 'ur';

  const newsArticles = [
    {
      id: '1',
      date: 'November 6, 2026',
      title: isUr
        ? 'پوپو لائیو گلوبل کری ایٹر سمٹ: ٹاپ براڈکاسٹرز کو شاندار انعامات'
        : 'Popo Live Global Creator Summit: Rewarding Top Broadcasters Worldwide',
      description: isUr
        ? 'اس سال کے سب سے بڑے لائیو اسٹریمنگ فیسٹیول میں نمایاں ہوسٹس اور ایجنسیوں کے لیے خصوصی کیش پول اور ایوارڈز کا اعلان۔'
        : 'Highlighting our highest-earning hosts and agency leaders with tournament bonuses, custom avatar frames, and exclusive VIP badges.',
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&auto=format&fit=crop&q=80',
      category: isUr ? 'کمیونٹی' : 'Community',
    },
    {
      id: '2',
      date: 'November 2, 2026',
      title: isUr
        ? '۹ سیٹوں والے وائس رومز کے لیے نئے تھری ڈی تھیمز اور ساؤنڈ افیکٹس'
        : 'Introducing Next-Gen 9-Seat Party Room Skins & Soundboard Filters',
      description: isUr
        ? 'ہوسٹس اور مہمانوں کے لیے نئے متحرک بیک گراؤنڈز، ہائی فیڈیلیٹی آڈیو اور چیٹ اینیمیشنز کی دستیابی۔'
        : 'Party rooms receive dynamic atmospheric skins, studio stereo audio enhancements, and interactive audience soundboards.',
      image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
      category: isUr ? 'پروڈکٹ اپڈیٹ' : 'Product Update',
    },
    {
      id: '3',
      date: 'October 28, 2026',
      title: isUr
        ? 'کمیونٹی سیفٹی اور ٹرسٹ پالیسی ۲۰۲۶: ہمارے بنیادی اصول'
        : 'Trust & Safety First: Our 2026 Platform Child Safety & Creator Charter',
      description: isUr
        ? '۱۸ سال سے زائد عمر کی سخت شرط، فیشل تصدیق اور ۲۴ گھنٹے فعال مانیٹرنگ کے ساتھ مکمل محفوظ ماحول کی ضمانت۔'
        : 'Reaffirming our zero-tolerance policies, robust real-time AI live monitoring, and age-verification gates protecting all creators.',
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80',
      category: isUr ? 'حفاظت اور اعتماد' : 'Safety & Trust',
    },
  ];

  return (
    <section id="news" className="py-20 relative bg-popo-dark-950 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className={`max-w-3xl mb-12 flex flex-col gap-3 ${isUr ? 'text-right ml-auto' : 'text-left'}`}>
          <div className={`inline-flex items-center gap-2 ${isUr ? 'self-end' : 'self-start'}`}>
            <span className="text-xs font-bold uppercase tracking-widest text-popo-pink flex items-center gap-1.5 px-3 py-1 rounded-full bg-popo-pink/10 border border-popo-pink/20">
              <Newspaper className="w-3.5 h-3.5" />
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

        {/* 3 News Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {newsArticles.map((article) => (
            <article
              key={article.id}
              className={`flex flex-col rounded-3xl bg-popo-dark-850 border border-white/10 overflow-hidden hover:border-popo-pink/40 hover:shadow-card-hover transition-all duration-300 group ${
                isUr ? 'text-right' : 'text-left'
              }`}
            >
              {/* News Thumbnail */}
              <div className="relative aspect-[16/10] overflow-hidden bg-popo-dark-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full text-popo-pink border border-white/10">
                  {article.category}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-6 flex flex-col flex-1 justify-between gap-4">
                <div className="flex flex-col gap-2.5">
                  <div className={`flex items-center gap-2 text-xs text-popo-text-muted ${isUr ? 'justify-end' : 'justify-start'}`}>
                    <Calendar className="w-3.5 h-3.5 text-popo-cyan" />
                    <span>{article.date}</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-popo-pink transition-colors leading-snug">
                    {article.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-popo-text-secondary line-clamp-3 leading-relaxed">
                    {article.description}
                  </p>
                </div>

                <div className={`pt-4 border-t border-white/5 flex items-center ${isUr ? 'justify-end' : 'justify-start'}`}>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('download');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`text-xs font-bold text-popo-pink hover:text-white transition-colors flex items-center gap-1.5 ${
                      isUr ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <span>{t.readMore}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
