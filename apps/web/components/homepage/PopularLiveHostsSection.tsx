'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Radio, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export interface PopularLiveHostsProps {
  lang: 'en' | 'ur';
}

export const PopularLiveHostsSection: React.FC<PopularLiveHostsProps> = ({ lang }) => {
  const isUr = lang === 'ur';
  const [startIndex, setStartIndex] = useState(0);

  const sampleHosts = [
    {
      id: '1',
      name: 'Ayla Noor',
      country: '🇵🇰 PK',
      viewers: '24.1k',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
      category: isUr ? 'موسیقی' : 'Singing & Music',
      level: 48,
    },
    {
      id: '2',
      name: 'Zara Khan',
      country: '🇦🇪 UAE',
      viewers: '18.9k',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80',
      category: isUr ? 'پی کے مقابلہ' : 'PK Battle',
      level: 65,
    },
    {
      id: '3',
      name: 'Sanam R.',
      country: '🇸🇦 KSA',
      viewers: '15.6k',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
      category: isUr ? 'گپ شپ' : 'Chit-Chat',
      level: 37,
    },
    {
      id: '4',
      name: 'Maria Q.',
      country: '🇬🇧 UK',
      viewers: '21.3k',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80',
      category: isUr ? 'ڈانس' : 'Dance',
      level: 52,
    },
    {
      id: '5',
      name: 'Danyal S.',
      country: '🇺🇸 USA',
      viewers: '12.8k',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
      category: isUr ? 'گیمنگ' : 'Gaming',
      level: 44,
    },
  ];

  const handlePrev = () => {
    setStartIndex((prev) => (prev === 0 ? sampleHosts.length - 3 : prev - 1));
  };

  const handleNext = () => {
    setStartIndex((prev) => (prev >= sampleHosts.length - 3 ? 0 : prev + 1));
  };

  const visibleHosts = [
    sampleHosts[startIndex % sampleHosts.length],
    sampleHosts[(startIndex + 1) % sampleHosts.length],
    sampleHosts[(startIndex + 2) % sampleHosts.length],
  ];

  return (
    <section className="py-16 bg-[#0B0E17] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Carousel Arrows */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className={cn('text-2xl sm:text-3xl font-bold text-white', isUr && 'font-urdu')}>
              {isUr ? 'مقبول لائیو ہوسٹس' : 'Popular Live Hosts'}
            </h2>
            <p className="text-xs sm:text-sm text-popo-text-secondary mt-1">
              {isUr
                ? 'اس وقت ٹرینڈنگ براڈکاسٹرز جنہیں شائقین کی بڑی تعداد دیکھ رہی ہے'
                : 'Trending broadcasters captivating audiences across the globe right now'}
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="w-10 h-10 rounded-full bg-[#131A2B] hover:bg-popo-pink/20 text-white/80 hover:text-white border border-white/10 flex items-center justify-center transition-all active:scale-95"
              aria-label="Previous hosts"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="w-10 h-10 rounded-full bg-[#131A2B] hover:bg-popo-pink/20 text-white/80 hover:text-white border border-white/10 flex items-center justify-center transition-all active:scale-95"
              aria-label="Next hosts"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3 Host Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {visibleHosts.map((host) => (
            <div
              key={host.id}
              className="group relative aspect-[3/4] sm:aspect-[4/5] rounded-3xl overflow-hidden bg-[#131A2B] border border-white/10 hover:border-popo-pink/50 transition-all duration-300 shadow-xl hover:shadow-glow-pink/30"
            >
              {/* Host Portrait */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={host.avatar}
                alt={host.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/60 pointer-events-none" />

              {/* Top Badges */}
              <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-popo-pink text-white text-xs font-black shadow-glow-pink">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  LIVE
                </span>
                <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold border border-white/15">
                  {host.country}
                </span>
              </div>

              {/* Bottom Info Bar */}
              <div className="absolute bottom-4 inset-x-4 z-10 flex items-end justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-popo-pink transition-colors">
                    {host.name}
                  </h3>
                  <span className="text-xs text-popo-text-secondary">{host.category}</span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-xs font-bold border border-white/15">
                  <Eye className="w-3.5 h-3.5 text-popo-pink" />
                  <span>{host.viewers}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
