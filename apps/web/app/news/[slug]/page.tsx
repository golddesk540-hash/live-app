import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Navbar } from '@/components/homepage/Navbar';
import { Footer } from '@/components/homepage/Footer';
import { Button } from '@/components/ui/Button';
import { allNewsArticles, Article } from '@/lib/newsData';
import { ArrowLeft, Calendar, Clock, Tag, Share2, Sparkles, AlertCircle } from 'lucide-react';

interface Props {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  return allNewsArticles.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = allNewsArticles.find((a) => a.slug === params.slug);
  if (!article) return { title: 'Article Not Found — Popo Live' };

  return {
    title: `${article.title} — Popo Live News`,
    description: article.description,
  };
}

export default function ArticleDetailPage({ params }: Props) {
  const article = allNewsArticles.find((a) => a.slug === params.slug);

  if (!article) {
    notFound();
  }

  // Related articles in same or other categories
  const relatedArticles = allNewsArticles
    .filter((a) => a.slug !== article.slug)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#0B0E17] text-popo-text-primary overflow-x-hidden selection:bg-popo-pink selection:text-white font-sans">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 flex flex-col gap-8">
        {/* Breadcrumb & Back to News Button */}
        <div className="flex items-center justify-between">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-xs font-bold text-popo-text-secondary hover:text-white group px-3.5 py-2 rounded-full bg-[#131A2B] border border-white/10 hover:border-popo-pink/40 transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-popo-pink group-hover:-translate-x-1 transition-transform" />
            <span>Back to All News</span>
          </Link>

          <span className="text-xs text-popo-text-muted hidden sm:inline">
            Popo Live News Editorial
          </span>
        </div>

        {/* Demo Notice */}
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#131A2B]/80 border border-white/10 text-xs text-popo-text-secondary">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Notice: This is a verified sample news article for platform UI/UX preview purposes.</span>
        </div>

        {/* Article Header */}
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-popo-pink text-white shadow-glow-pink">
              {article.category}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-popo-text-secondary">
              <Calendar className="w-3.5 h-3.5 text-popo-cyan" />
              <span>{article.date}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-popo-text-muted">
              <Clock className="w-3.5 h-3.5" />
              <span>{article.readTime}</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            {article.title}
          </h1>

          <p className="text-base sm:text-lg text-popo-text-secondary leading-relaxed border-l-2 border-popo-pink pl-4 italic">
            {article.description}
          </p>
        </header>

        {/* Featured Image */}
        <div className="relative aspect-[16/9] rounded-3xl overflow-hidden bg-[#131A2B] border border-white/10 shadow-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Article Full Content */}
        <article className="flex flex-col gap-6 text-sm sm:text-base text-popo-text-secondary leading-relaxed pt-4 border-b border-white/10 pb-10">
          {article.content.map((paragraph, index) => (
            <p key={index} className="whitespace-pre-line text-white/90 leading-loose">
              {paragraph}
            </p>
          ))}
        </article>

        {/* Share & Call to Action */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-[#131A2B]/60 border border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-bold text-white">Share this announcement:</span>
          </div>
          <div className="flex items-center gap-2">
            {['Twitter/X', 'Telegram', 'Facebook', 'WhatsApp'].map((platform) => (
              <span
                key={platform}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 hover:bg-popo-pink hover:text-white border border-white/10 transition-colors cursor-pointer"
              >
                {platform}
              </span>
            ))}
          </div>
        </div>

        {/* Related Articles Section */}
        <section className="flex flex-col gap-6 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Related Announcements</h2>
            <Link href="/news" className="text-xs font-bold text-popo-pink hover:underline">
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map((rel) => (
              <Link
                key={rel.slug}
                href={`/news/${rel.slug}`}
                className="group flex flex-col rounded-2xl overflow-hidden bg-[#131A2B]/80 border border-white/10 hover:border-popo-pink/40 transition-all p-4 shadow-lg hover:-translate-y-1"
              >
                <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-3 bg-black/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={rel.image}
                    alt={rel.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/70 backdrop-blur-sm text-white">
                    {rel.category}
                  </span>
                </div>
                <span className="text-[11px] text-popo-text-muted mb-1">{rel.date}</span>
                <h3 className="text-sm font-bold text-white group-hover:text-popo-pink transition-colors line-clamp-2">
                  {rel.title}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
