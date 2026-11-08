import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PoppoHeader } from '@/components/poppo/PoppoHeader';
import { PoppoFooter } from '@/components/poppo/PoppoFooter';
import { allNewsArticles, Article } from '@/lib/newsData';
import { ArrowLeft, Calendar, Clock, Tag, Share2, Sparkles, ShieldCheck } from 'lucide-react';

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
  if (!article) return { title: 'Article Not Found — Poppo Live' };

  return {
    title: `${article.title} — Poppo Live Official News`,
    description: article.description,
  };
}

export default function ArticleDetailPage({ params }: Props) {
  const article = allNewsArticles.find((a) => a.slug === params.slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = allNewsArticles
    .filter((a) => a.slug !== article.slug)
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-[#5653FE] selection:text-white font-sans">
      <PoppoHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Breadcrumb Back Link */}
        <div className="mb-6">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-[#5653FE] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to News Center</span>
          </Link>
        </div>

        {/* Article Header */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-purple-50 text-[#5653FE] text-xs font-bold border border-purple-100">
              {article.category}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>{article.date}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{article.readTime}</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-950 tracking-tight leading-tight">
            {article.title}
          </h1>

          <p className="text-base sm:text-lg text-gray-600 leading-relaxed font-normal">
            {article.description}
          </p>
        </div>

        {/* Featured Cover Image */}
        <div className="relative aspect-[16/9] w-full rounded-3xl overflow-hidden shadow-lg border border-gray-150 mb-10">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Article Body */}
        <div className="prose prose-lg max-w-none text-gray-700 space-y-6 text-base leading-relaxed border-b border-gray-150 pb-12">
          {article.content.map((paragraph, index) => (
            <p key={index} className="text-gray-700">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Related Articles */}
        <div className="pt-12">
          <h3 className="text-xl font-bold text-gray-950 mb-6">Related News & Announcements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relatedArticles.map((rel) => (
              <Link
                key={rel.slug}
                href={`/news/${rel.slug}`}
                className="group p-5 rounded-2xl border border-gray-200 hover:border-[#5653FE]/50 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="text-[11px] font-bold text-[#5653FE] uppercase">{rel.category}</span>
                  <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#5653FE] transition-colors mt-1 line-clamp-2">
                    {rel.title}
                  </h4>
                </div>
                <div className="text-[11px] text-gray-400 mt-4 flex items-center justify-between">
                  <span>{rel.date}</span>
                  <span className="text-[#5653FE] font-bold group-hover:translate-x-1 transition-transform">Read →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <PoppoFooter />
    </div>
  );
}
