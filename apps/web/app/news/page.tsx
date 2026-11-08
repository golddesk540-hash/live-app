'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PoppoHeader } from '@/components/poppo/PoppoHeader';
import { PoppoFooter } from '@/components/poppo/PoppoFooter';
import { allNewsArticles, newsCategories, Article, NewsCategory } from '@/lib/newsData';
import { useLanguage } from '@/lib/languageContext';
import {
  Calendar,
  ArrowRight,
  ChevronRight,
  Search,
  Sparkles,
  ShieldCheck,
  Flame,
  Radio
} from 'lucide-react';

export default function NewsCenterPage() {
  const { lang, toggleLang, isUr } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string>('Latest News');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const categories = [
    { id: 'Latest News', label: isUr ? 'تازہ ترین خبریں' : 'Latest News' },
    { id: 'Product News', label: isUr ? 'پروڈکٹ نیوز' : 'Product News' },
    { id: 'Latest Events', label: isUr ? 'تازہ ترین ایونٹس' : 'Latest Events' },
    { id: 'Compliance Updates', label: isUr ? 'قانونی اپڈیٹس' : 'Compliance Updates' },
  ];

  const filteredArticles = allNewsArticles.filter((article) => {
    const matchesCategory =
      activeCategory === 'Latest News' || article.category === activeCategory;
    const matchesSearch =
      searchQuery === '' ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div
      dir={isUr ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-white text-gray-900 selection:bg-[#5653FE] selection:text-white ${
        isUr ? 'font-urdu' : 'font-sans'
      }`}
    >
      <PoppoHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Page Title & Search Header (04_news_page.png) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-gray-150">
          <div>
            <span className="text-xs font-bold text-[#5653FE] uppercase tracking-wider bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
              {isUr ? 'سرکاری معلومات' : 'Official Press & Bulletins'}
            </span>
            <h1 className="text-4xl sm:text-6xl font-black text-gray-950 mt-3 tracking-tight uppercase">
              {isUr ? 'نیوز سینٹر' : 'NEWS'}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-500 max-w-xl">
              {isUr
                ? 'پلیٹ فارم اپڈیٹس، ایونٹس، اور قانونی ضوابط سے باخبر رہیں۔'
                : 'Stay informed with our latest announcements, product launches, creator activities, and compliance policies.'}
            </p>
          </div>

          {/* Search Box */}
          <div className="w-full md:w-72">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isUr ? 'خبریں تلاش کریں...' : 'Search articles...'}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 hover:bg-white focus:bg-white rounded-full text-xs sm:text-sm border border-gray-200 focus:border-[#5653FE] focus:ring-2 focus:ring-[#5653FE]/20 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* 2-Column Body: Left Category Sidebar + Right 2-Col Article Grid (Matching 04_news_page.png) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-10">
          
          {/* Left Category Sidebar */}
          <aside className="lg:col-span-3 space-y-2">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">
              {isUr ? 'زمرہ جات' : 'Categories'}
            </div>
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold flex items-center justify-between transition-all ${
                    isActive
                      ? 'bg-[#5653FE] text-white shadow-md shadow-purple-500/20'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-950'
                  }`}
                >
                  <span>{cat.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4" />}
                </button>
              );
            })}

            {/* Newsletter Mini Card */}
            <div className="mt-8 p-5 rounded-3xl bg-purple-50/60 border border-purple-100">
              <div className="w-9 h-9 rounded-xl bg-[#5653FE] text-white flex items-center justify-center mb-3">
                <Radio className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-gray-900">
                {isUr ? 'سب سے پہلے اپڈیٹس حاصل کریں' : 'Instant Event Alerts'}
              </h4>
              <p className="text-[11px] text-gray-500 mt-1">
                {isUr
                  ? 'پوپو لائیو ایپ میں فالو کریں اور بروقت نوٹیفیکیشنز پائیں۔'
                  : 'Get notified inside the app whenever new PK tournaments or features drop.'}
              </p>
              <Link
                href="/download"
                className="mt-3 block text-center py-2 bg-white rounded-xl text-xs font-bold text-[#5653FE] border border-purple-200 hover:bg-purple-100 transition-colors"
              >
                {isUr ? 'ایپ حاصل کریں' : 'Download App'}
              </Link>
            </div>
          </aside>

          {/* Right News Cards Grid (2-Column Grid Matching 04_news_page.png) */}
          <div className="lg:col-span-9">
            {filteredArticles.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-3xl border border-gray-200">
                <p className="text-sm text-gray-500">
                  {isUr ? 'کوئی خبر نہیں ملی۔ براہ کرم مختلف الفاظ آزمائیں۔' : 'No articles match your query.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredArticles.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/news/${article.slug}`}
                    className="group bg-white rounded-3xl overflow-hidden border border-gray-200 hover:border-[#5653FE]/50 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Cover Image */}
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-900">
                        <img
                          src={article.image}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                        {/* Category Badge */}
                        <div className="absolute top-3 left-3">
                          <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold border border-white/20">
                            {isUr && article.categoryUr ? article.categoryUr : article.category}
                          </span>
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="p-6">
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{article.date}</span>
                          <span>•</span>
                          <span>{article.readTime}</span>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-gray-950 group-hover:text-[#5653FE] transition-colors line-clamp-2">
                          {isUr && article.titleUr ? article.titleUr : article.title}
                        </h3>

                        <p className="text-xs sm:text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                          {isUr && article.descriptionUr ? article.descriptionUr : article.description}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Action Link */}
                    <div className="px-6 pb-6 pt-2 flex items-center justify-between border-t border-gray-100 text-xs font-bold text-[#5653FE]">
                      <span>{isUr ? 'مکمل تفصیل پڑھیں' : 'Read Article'}</span>
                      <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination Controls (Matching 04_news_page.png) */}
            <div className="mt-12 flex items-center justify-center gap-2">
              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                    currentPage === page
                      ? 'bg-[#5653FE] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(3, p + 1))}
                className="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center text-xs font-bold"
              >
                ›
              </button>
            </div>
          </div>

        </div>
      </main>

      <PoppoFooter />
    </div>
  );
}
