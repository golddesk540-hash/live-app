'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/homepage/Navbar';
import { Footer } from '@/components/homepage/Footer';
import { AuthModal } from '@/components/homepage/AuthModal';
import { Button } from '@/components/ui/Button';
import { allNewsArticles, newsCategories, Article, NewsCategory } from '@/lib/newsData';
import {
  Newspaper,
  Calendar,
  Sparkles,
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Search,
  Mail,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useLanguage } from '@/lib/languageContext';
import { cn } from '@/lib/utils';

export default function NewsPage() {
  const { lang, toggleLang, isUr } = useLanguage();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('All News');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Newsletter state
  const [emailInput, setEmailInput] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [newsletterMessage, setNewsletterMessage] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput)) {
      setNewsletterStatus('error');
      setNewsletterMessage(isUr ? 'براہ کرم درست ای میل پتہ درج کریں۔' : 'Please enter a valid email address.');
      return;
    }

    setNewsletterStatus('success');
    setNewsletterMessage(
      isUr
        ? 'شکریہ! ڈیمو موڈ: بیک اینڈ کنکشن کے بعد نیوز لیٹر ایکٹیو ہو جائے گا۔'
        : 'Thank you for your interest! (Notice: Subscriptions will be activated upon Phase 2 API connection).'
    );
    setEmailInput('');
  };

  // Filter articles based on Category and Search Query
  const filteredArticles = allNewsArticles.filter((article) => {
    const matchesCategory =
      selectedCategory === 'All News' || article.category === selectedCategory;
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Featured article is the top featured one (or first)
  const featuredArticle = allNewsArticles.find((a) => a.featured) || allNewsArticles[0];

  // Pagination calculations
  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage) || 1;
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div
      dir={isUr ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-[#0B0E17] text-popo-text-primary overflow-x-hidden selection:bg-popo-pink selection:text-white ${
        isUr ? 'font-urdu' : 'font-sans'
      }`}
    >
      {/* 1. Website Header (Navbar with News active) */}
      <Navbar
        lang={lang}
        onToggleLang={toggleLang}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 flex flex-col gap-12">
        {/* Placeholder Demo Notice */}
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-[#131A2B]/80 border border-white/10 text-xs text-popo-text-secondary">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            {isUr
              ? 'وضاحت: یہ تمام مضامین اور خبریں پیج ڈیزائن اور پریویو کے لیے فرضی ڈیمو ڈیٹا ہیں۔'
              : 'Notice: Articles and announcements displayed are professional demo placeholder content created for UI/UX showcase purposes.'}
          </span>
        </div>

        {/* 2. News Hero Section */}
        <div className={`flex flex-col gap-3 ${isUr ? 'text-right' : 'text-left'}`}>
          <div className={`inline-flex items-center gap-2 ${isUr ? 'self-end' : 'self-start'}`}>
            <span className="text-xs font-bold uppercase tracking-widest text-popo-pink flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-popo-pink/10 border border-popo-pink/20">
              <Newspaper className="w-3.5 h-3.5" />
              {isUr ? 'پوپو لائیو نیوز روم' : 'Popo Live News & Updates'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {isUr ? 'پوپو لائیو نیوز اور اعلانات' : 'Popo Live News & Updates'}
          </h1>

          <p className="text-base sm:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-popo-pink via-purple-300 to-amber-300">
            {isUr ? 'جڑے رہیں • باخبر رہیں' : 'Stay Connected. Stay Updated.'}
          </p>

          <p className="text-sm sm:text-base text-popo-text-secondary max-w-3xl leading-relaxed">
            {isUr
              ? 'پلیٹ فارم کی نئی خصوصیات، کمیونٹی ایونٹس، کری ایٹر سرگرمیوں اور آنے والے ٹورنامنٹس سے باخبر رہیں۔'
              : 'Discover the latest platform updates, community announcements, creator activities and upcoming events from Popo Live.'}
          </p>
        </div>

        {/* 3. Featured News Section */}
        {featuredArticle && searchQuery === '' && selectedCategory === 'All News' && (
          <div className="group relative rounded-3xl overflow-hidden bg-[#131A2B] border border-white/10 hover:border-popo-pink/50 hover:shadow-glow-pink/20 transition-all duration-300 grid grid-cols-1 lg:grid-cols-12 gap-0 shadow-2xl">
            <div className="lg:col-span-7 relative aspect-[16/10] lg:aspect-auto overflow-hidden bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={featuredArticle.image}
                alt={featuredArticle.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent lg:hidden" />
              <span className="absolute top-4 left-4 bg-popo-pink text-white text-[11px] font-extrabold uppercase px-3 py-1 rounded-full shadow-glow-pink">
                FEATURED STORY
              </span>
            </div>

            <div className={`lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-6 ${isUr ? 'text-right' : 'text-left'}`}>
              <div className="flex flex-col gap-3">
                <div className={`flex items-center gap-2 text-xs text-popo-text-muted ${isUr ? 'justify-end' : 'justify-start'}`}>
                  <Calendar className="w-3.5 h-3.5 text-popo-cyan" />
                  <span>{featuredArticle.date}</span>
                  <span>•</span>
                  <span>{featuredArticle.readTime}</span>
                </div>

                <span className="text-xs font-bold text-popo-pink uppercase tracking-wider">
                  {featuredArticle.category}
                </span>

                <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-popo-pink transition-colors leading-snug">
                  {isUr && featuredArticle.titleUr ? featuredArticle.titleUr : featuredArticle.title}
                </h2>

                <p className="text-xs sm:text-sm text-popo-text-secondary leading-relaxed line-clamp-3">
                  {isUr && featuredArticle.descriptionUr ? featuredArticle.descriptionUr : featuredArticle.description}
                </p>
              </div>

              <div className={`pt-4 border-t border-white/10 flex items-center ${isUr ? 'justify-end' : 'justify-start'}`}>
                <Link href={`/news/${featuredArticle.slug}`}>
                  <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />} className="shadow-glow-pink">
                    {isUr ? 'پورا مضمون پڑھیں' : 'Read Full Article'}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 4. News Categories & 7. Search Input */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-4 border-t border-white/10">
          {/* Category Filter Pills (Mobile friendly horizontal scroll) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {newsCategories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    'px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all select-none',
                    isActive
                      ? 'bg-popo-pink text-white shadow-glow-pink font-extrabold'
                      : 'bg-[#131A2B] hover:bg-[#1A233A] text-popo-text-secondary hover:text-white border border-white/10'
                  )}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 text-popo-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={isUr ? 'خبریں تلاش کریں...' : 'Search news & updates...'}
              className="w-full pl-10 pr-4 py-2 rounded-full bg-[#131A2B] border border-white/10 text-white placeholder-popo-text-muted text-xs focus:outline-none focus:border-popo-pink transition-colors"
            />
          </div>
        </div>

        {/* 5. Latest News Grid */}
        {paginatedArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {paginatedArticles.map((article) => (
              <div
                key={article.slug}
                className={cn(
                  'group flex flex-col justify-between rounded-3xl overflow-hidden bg-[#131A2B]/80 border border-white/10 hover:border-popo-pink/40 transition-all duration-300 shadow-xl hover:-translate-y-1',
                  isUr ? 'text-right' : 'text-left'
                )}
              >
                <div>
                  {/* Thumbnail */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-black/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-md text-white border border-white/10">
                      {article.category}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex flex-col gap-2.5">
                    <div className={`flex items-center gap-2 text-[11px] text-popo-text-muted ${isUr ? 'justify-end' : 'justify-start'}`}>
                      <Calendar className="w-3 h-3 text-popo-cyan" />
                      <span>{article.date}</span>
                      <span>•</span>
                      <span>{article.readTime}</span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-popo-pink transition-colors line-clamp-2 leading-snug">
                      {isUr && article.titleUr ? article.titleUr : article.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-popo-text-secondary line-clamp-2 leading-relaxed">
                      {isUr && article.descriptionUr ? article.descriptionUr : article.description}
                    </p>
                  </div>
                </div>

                {/* Read More Link */}
                <div className={`p-6 pt-0 border-t border-white/5 flex items-center ${isUr ? 'justify-end' : 'justify-start'}`}>
                  <Link
                    href={`/news/${article.slug}`}
                    className={`inline-flex items-center gap-1.5 text-xs font-bold text-popo-pink hover:text-white transition-colors group-hover:translate-x-1 ${
                      isUr ? 'flex-row-reverse group-hover:-translate-x-1' : ''
                    }`}
                  >
                    <span>{isUr ? 'مزید پڑھیں' : 'Read More'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty Search Results Message (Section 7) */
          <div className="p-12 rounded-3xl bg-[#131A2B]/40 border border-white/10 text-center flex flex-col items-center gap-4">
            <Newspaper className="w-12 h-12 text-popo-text-muted" />
            <h3 className="text-lg font-bold text-white">
              {isUr ? 'کوئی خبر نہیں ملی' : 'No News Articles Found'}
            </h3>
            <p className="text-xs sm:text-sm text-popo-text-secondary max-w-sm">
              {isUr
                ? 'آپ کی تلاش کے مطابق کوئی خبر دستیاب نہیں ہے۔ براہ کرم دوسرے الفاظ آزمائیں۔'
                : `We could not find any announcements matching "${searchQuery}". Try selecting another category or clearing your search.`}
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All News');
              }}
            >
              Clear Filter & Search
            </Button>
          </div>
        )}

        {/* 7. Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6 border-t border-white/10">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-2.5 rounded-full bg-[#131A2B] text-popo-text-secondary hover:text-white border border-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  'w-9 h-9 rounded-full text-xs font-bold transition-all',
                  currentPage === page
                    ? 'bg-popo-pink text-white shadow-glow-pink'
                    : 'bg-[#131A2B] text-popo-text-secondary hover:text-white border border-white/10'
                )}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-2.5 rounded-full bg-[#131A2B] text-popo-text-secondary hover:text-white border border-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 8. Newsletter Section */}
        <section className="mt-8 p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-popo-pink/15 via-[#131A2B] to-purple-600/15 border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-popo-pink/20 border border-popo-pink/30 flex items-center justify-center text-popo-pink mb-1">
              <Mail className="w-6 h-6" />
            </div>

            <h2 className={cn('text-2xl sm:text-3xl font-black text-white', isUr && 'font-urdu')}>
              {isUr ? 'پوپو لائیو کے ساتھ باخبر رہیں' : 'Stay Updated with Popo Live'}
            </h2>

            <p className="text-xs sm:text-sm text-popo-text-secondary max-w-md leading-relaxed">
              {isUr
                ? 'پلیٹ فارم کی تازہ ترین خبریں، فیچرز اور ایونٹس کے اعلانات براہ راست حاصل کریں۔'
                : 'Get the latest platform news, community releases, and event announcements delivered directly.'}
            </p>

            <form onSubmit={handleSubscribe} className="w-full max-w-md flex flex-col sm:flex-row gap-2 mt-2">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (newsletterStatus !== 'idle') setNewsletterStatus('idle');
                }}
                placeholder={isUr ? 'اپنا ای میل درج کریں...' : 'Enter your email address...'}
                className="flex-1 px-4 py-3 rounded-full bg-[#0B0E17] border border-white/15 text-white placeholder-popo-text-muted text-xs focus:outline-none focus:border-popo-pink transition-colors"
              />
              <Button type="submit" variant="primary" size="md" className="shadow-glow-pink shrink-0 font-bold">
                {isUr ? 'سبسکرائب کریں' : 'Subscribe'}
              </Button>
            </form>

            {newsletterStatus === 'success' && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20 mt-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{newsletterMessage}</span>
              </div>
            )}

            {newsletterStatus === 'error' && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20 mt-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{newsletterMessage}</span>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* 9. Website Footer (Reused existing footer) */}
      <Footer lang={lang} />

      <AuthModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        lang={lang}
      />
    </div>
  );
}
