'use client';

import React from 'react';
import { Calendar, ArrowRight, Sparkles } from 'lucide-react';

export interface NewsItem {
  id: string;
  title: string;
  date: string;
  category: string;
  description: string;
  content?: string;
  image: string;
  readTime?: string;
  featured?: boolean;
}

export interface NewsCardProps {
  article: NewsItem;
  onReadMore: (article: NewsItem) => void;
  lang?: 'en' | 'ur';
}

export const NewsCard: React.FC<NewsCardProps> = ({ article, onReadMore, lang = 'en' }) => {
  const isUr = lang === 'ur';

  return (
    <article
      className={`flex flex-col rounded-3xl bg-popo-dark-850 border border-white/10 overflow-hidden hover:border-popo-pink/40 hover:shadow-card-hover transition-all duration-300 group cursor-pointer ${
        isUr ? 'text-right' : 'text-left'
      }`}
      onClick={() => onReadMore(article)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] overflow-hidden bg-popo-dark-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="bg-black/60 backdrop-blur-md text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full text-popo-pink border border-white/10">
            {article.category}
          </span>
          {article.readTime && (
            <span className="bg-black/60 backdrop-blur-md text-[10px] font-semibold px-2 py-1 rounded-full text-popo-text-secondary border border-white/10">
              {article.readTime}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
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
          <span
            className={`text-xs font-bold text-popo-pink group-hover:text-white transition-colors flex items-center gap-1.5 ${
              isUr ? 'flex-row-reverse' : ''
            }`}
          >
            <span>{isUr ? 'پورا مضمون پڑھیں' : 'Read Article'}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </article>
  );
};
