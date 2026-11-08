'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/homepage/Navbar';
import { Footer } from '@/components/homepage/Footer';
import { AuthModal } from '@/components/homepage/AuthModal';
import { NewsCard, NewsItem } from '@/components/news/NewsCard';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Newspaper, Calendar, Sparkles, AlertCircle, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const mockNewsData: NewsItem[] = [
  {
    id: 'feat-1',
    title: 'Popo Live Global Creator Summit 2026: Honoring Top Broadcasters with Diamond Accolades',
    date: 'November 7, 2026',
    category: 'Creator Summit',
    description:
      'Over 500 leading creators and partner agencies gathered at our annual flagship summit. We unveiled new creator task streak bonuses, higher PK battle reward multipliers, and custom VIP entrance carriages.',
    content: `The Popo Live Global Creator Summit 2026 brought together broadcasters, talent agencies, and industry leaders from across 30 countries.

Key Announcements:
1. Enhanced Daily Host Missions: Broadcasters completing 2+ hours daily now earn compound streak multipliers directly converted to withdrawable points.
2. Next-Gen 9-Seat Party Engines: Lower latency audio codecs and interactive group game slots inside voice lounges.
3. Transparent Payouts: Reaffirming our core rule where 70% of all gift coin values flow to host points with bi-weekly automated payouts.

"Our creators are the heartbeat of Popo Live. This year, we continue investing in safety, transparent creator revenue, and global community connection."`,
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1000&auto=format&fit=crop&q=80',
    readTime: '4 min read',
    featured: true,
  },
  {
    id: '2',
    title: 'Introducing Next-Gen 9-Seat Party Room Themes and Studio Soundboard',
    date: 'November 4, 2026',
    category: 'Product Update',
    description:
      'Broadcasters can now skin their party lounges with custom neon club, cozy lounge, and cosmic space backgrounds, paired with 12 studio soundboard reactions.',
    content: `Party rooms are where communities forge lasting friendships. Starting today, all room owners can access our upgraded theme gallery.

Highlights include:
- High-definition animated audio visualizers on all 8 guest seats.
- Instant host mic priority mode to moderate discussions seamlessly.
- Audience mini-games and interactive sticker showers during live celebrations.`,
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    readTime: '3 min read',
  },
  {
    id: '3',
    title: 'Trust & Safety Charter: Zero-Tolerance Child Safety & AI Live Stream Moderation',
    date: 'October 29, 2026',
    category: 'Safety & Trust',
    description:
      'Our dedicated safety operations report on 24/7 stream monitoring, Level 5 broadcaster eligibility gates, and enhanced real-time content filtering.',
    content: `Popo Live maintains a strict zero-tolerance stance towards harmful content. All broadcasters must pass facial KYC verification and wealth gate checks before going live.

Our Safety Commitments:
- Strict 18+ platform policy enforced at onboarding.
- Real-time AI stream analysis flagging non-compliant broadcasts within seconds.
- Human moderator kill-switches and immediate hardware device bans for serious violations.`,
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80',
    readTime: '5 min read',
  },
  {
    id: '4',
    title: 'Autumn PK Battle Arena Championship: Regional Brackets Open for Registration',
    date: 'October 24, 2026',
    category: 'Tournaments',
    description:
      'Hosts can team up with fellow creators to represent their country in the Autumn PK Tournament. Top 3 champions will receive custom profile crowns and gift multipliers.',
    content: `Registration for the Autumn PK Arena is now officially live. Streamers with wealth Level 5 and above can register directly through their in-app event center.

Tournament Rules:
- 1v1 Elimination matches over 5-minute timed rounds.
- Real-time gift score conversion tracking live supporter rankings.
- Special reward pools distributed among both victorious streamers and top fan club contributors.`,
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
    readTime: '3 min read',
  },
  {
    id: '5',
    title: 'Creator Spotlight: How Singer Zoya Khan Built a 250,000 Fan Community on Popo Live',
    date: 'October 18, 2026',
    category: 'Creator Spotlight',
    description:
      'From her first solo acoustic stream to commanding packed 9-seat concert rooms, discover Zoya’s journey and advice for aspiring musical broadcasters.',
    content: `Zoya Khan began streaming on Popo Live eight months ago. Today, her daily evening ghazal sessions draw thousands of active listeners worldwide.

"The audio quality on Popo Live’s party rooms is unmatched. It feels like performing in an intimate studio where every fan’s message and gift is felt in real time," shares Zoya.`,
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    readTime: '4 min read',
  },
  {
    id: '6',
    title: 'Agency Growth Program: Scaling Multi-Host Rosters with Centralized Analytics',
    date: 'October 12, 2026',
    category: 'Agency News',
    description:
      'We launched dedicated agency tools allowing talent directors to monitor daily streaming hours, streak achievements, and transparent weekly revenue splits.',
    content: `Agencies are crucial partners in coaching and elevating high-potential broadcasters. Our new agency console provides real-time health metrics, streamer performance alerts, and simplified payout disbursements.`,
    image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&auto=format&fit=crop&q=80',
    readTime: '4 min read',
  },
];

export default function NewsPage() {
  const [lang, setLang] = useState<'en' | 'ur'>('en');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const categories = ['All', 'Creator Summit', 'Product Update', 'Safety & Trust', 'Tournaments', 'Creator Spotlight', 'Agency News'];

  const filteredNews = mockNewsData.filter((item) => {
    if (activeCategory === 'All') return true;
    return item.category === activeCategory;
  });

  const featuredArticle = mockNewsData.find((item) => item.featured) || mockNewsData[0];
  const listArticles = filteredNews.filter((item) => item.id !== featuredArticle.id || activeCategory !== 'All');

  const isUr = lang === 'ur';

  return (
    <div
      dir={isUr ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-popo-dark-950 text-popo-text-primary overflow-x-hidden selection:bg-popo-pink selection:text-white ${
        isUr ? 'font-urdu' : 'font-sans'
      }`}
    >
      <Navbar
        lang={lang}
        onToggleLang={() => setLang((prev) => (prev === 'en' ? 'ur' : 'en'))}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 flex flex-col gap-12">
        {/* Placeholder notice alert */}
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-popo-dark-850/80 border border-white/10 text-xs text-popo-text-secondary">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            {isUr
              ? 'وضاحت: یہ تمام مضامین اور خبریں پیج ڈیزائن اور پریویو کے لیے فرضی ڈیمو ڈیٹا ہیں۔'
              : 'Notice: Articles displayed are professional demo placeholder content created for UI/UX showcase purposes.'}
          </span>
        </div>

        {/* Hero Section */}
        <div className={`flex flex-col gap-3 ${isUr ? 'text-right' : 'text-left'}`}>
          <div className={`inline-flex items-center gap-2 ${isUr ? 'self-end' : 'self-start'}`}>
            <span className="text-xs font-bold uppercase tracking-widest text-popo-pink flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-popo-pink/10 border border-popo-pink/20">
              <Newspaper className="w-3.5 h-3.5" />
              {isUr ? 'پوپو لائیو نیوز روم' : 'Popo Live Newsroom'}
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {isUr ? 'تازہ ترین خبریں، اپڈیٹس اور کہانیاں' : 'Latest News, Product Updates & Stories'}
          </h1>
          <p className="text-sm sm:text-base text-popo-text-secondary max-w-3xl leading-relaxed">
            {isUr
              ? 'پلیٹ فارم کی نئی خصوصیات، کمیونٹی ایونٹس، ہوسٹس کے اعزازات اور سیفٹی اعلانات سے باخبر رہیں۔'
              : 'Discover the latest tournament announcements, party room feature releases, creator summits, and platform trust charters.'}
          </p>
        </div>

        {/* Featured News Article Hero */}
        {featuredArticle && activeCategory === 'All' && (
          <div
            onClick={() => setSelectedArticle(featuredArticle)}
            className="group relative rounded-3xl overflow-hidden bg-popo-dark-900 border border-white/10 hover:border-popo-pink/50 hover:shadow-card-hover transition-all duration-300 cursor-pointer grid grid-cols-1 lg:grid-cols-12 gap-0"
          >
            <div className="lg:col-span-7 relative aspect-[16/10] lg:aspect-auto overflow-hidden bg-popo-dark-800">
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

                <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-popo-pink transition-colors leading-snug">
                  {featuredArticle.title}
                </h2>

                <p className="text-xs sm:text-sm text-popo-text-secondary leading-relaxed">
                  {featuredArticle.description}
                </p>
              </div>

              <div className={`pt-4 border-t border-white/10 flex items-center ${isUr ? 'justify-end' : 'justify-start'}`}>
                <span className={`text-xs font-bold text-popo-pink flex items-center gap-2 ${isUr ? 'flex-row-reverse' : ''}`}>
                  <span>{isUr ? 'پورا مضمون پڑھیں' : 'Read Full Article'}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all select-none ${
                  isActive
                    ? 'bg-gradient-to-r from-popo-pink to-[#FF5E3A] text-white shadow-glow-pink'
                    : 'bg-popo-dark-850 hover:bg-popo-dark-800 text-popo-text-secondary hover:text-white border border-white/10'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* News Listing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {listArticles.map((article) => (
            <NewsCard
              key={article.id}
              article={article}
              onReadMore={(item) => setSelectedArticle(item)}
              lang={lang}
            />
          ))}
        </div>

        {/* Pagination UI */}
        <div className="flex items-center justify-center gap-2 pt-8 border-t border-white/10">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-2.5 rounded-full bg-popo-dark-850 text-popo-text-secondary hover:text-white border border-white/10 disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {[1, 2, 3].map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-9 h-9 rounded-full text-xs font-bold transition-colors ${
                currentPage === page
                  ? 'bg-popo-pink text-white shadow-glow-pink'
                  : 'bg-popo-dark-850 text-popo-text-secondary hover:text-white border border-white/10'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setCurrentPage((p) => p + 1)}
            className="p-2.5 rounded-full bg-popo-dark-850 text-popo-text-secondary hover:text-white border border-white/10"
            aria-label="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      <Footer lang={lang} />

      {/* Article Detail Reading Modal */}
      {selectedArticle && (
        <Modal
          isOpen={Boolean(selectedArticle)}
          onClose={() => setSelectedArticle(null)}
          title={selectedArticle.title}
          subtitle={`${selectedArticle.category} • ${selectedArticle.date}`}
          maxWidth="lg"
        >
          <div className={`flex flex-col gap-4 ${isUr ? 'text-right' : 'text-left'}`}>
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-popo-dark-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedArticle.image}
                alt={selectedArticle.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-sm text-popo-text-secondary leading-relaxed whitespace-pre-line pt-2">
              {selectedArticle.content || selectedArticle.description}
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center text-xs text-popo-text-muted">
              <span>Popo Live News Editorial</span>
              <Button variant="secondary" size="xs" onClick={() => setSelectedArticle(null)}>
                Close Article
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <AuthModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        lang={lang}
      />
    </div>
  );
}
