'use client';

import React, { useState } from 'react';
import { LiveRoomCard } from '@/components/references/LiveRoomCard';
import { Button } from '@/components/ui/Button';
import { content } from './content';
import { Radio, Sparkles, Flame, ArrowRight } from 'lucide-react';

export interface LiveExperienceSectionProps {
  lang: 'en' | 'ur';
}

export const LiveExperienceSection: React.FC<LiveExperienceSectionProps> = ({ lang }) => {
  const [activeCategory, setActiveCategory] = useState(0);
  const t = content[lang].live;
  const isUr = lang === 'ur';

  const mockRooms = [
    {
      id: '1',
      title: isUr ? '🔥 لائیو قوالی اور غزل کی محفل' : '🔥 Live Sufi Ghazal & Acoustic Night',
      hostName: 'Bilal Khan',
      country: '🇵🇰',
      hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      viewerCount: '4.8k',
      category: isUr ? 'موسیقی' : 'Music',
      level: 48,
    },
    {
      id: '2',
      title: isUr ? '⚔️ پاکستان بمقابلہ دبئی بڑا پی کے مقابلہ' : '⚔️ Mega PK Battle PK vs UAE',
      hostName: 'Sara Ali',
      country: '🇦🇪',
      hostAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
      coverImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
      viewerCount: '9.2k',
      category: 'PK Battle',
      level: 72,
      isPK: true,
    },
    {
      id: '3',
      title: isUr ? 'نئے ٹیلنٹ کی حوصلہ افزائی اور گپ شپ' : 'Late Night Chill & Storytelling Lounge',
      hostName: 'Hamza Sheikh',
      country: '🇵🇰',
      hostAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
      viewerCount: '2.1k',
      category: isUr ? 'گپ شپ' : 'Chat',
      level: 34,
    },
    {
      id: '4',
      title: isUr ? 'گیمنگ لائیو: کسٹم روم چیلنج' : 'Pro Gaming Championship Finals',
      hostName: 'Zain Gamer',
      country: '🇸🇦',
      hostAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
      coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
      viewerCount: '3.4k',
      category: isUr ? 'گیمنگ' : 'Gaming',
      level: 56,
    },
  ];

  return (
    <section id="live" className="py-20 relative bg-popo-dark-950 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className={`flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 ${isUr ? 'text-right' : 'text-left'}`}>
          <div className="max-w-2xl flex flex-col gap-3">
            <div className={`inline-flex items-center gap-2 ${isUr ? 'self-end' : 'self-start'}`}>
              <span className="text-xs font-bold uppercase tracking-widest text-popo-pink flex items-center gap-1.5 px-3 py-1 rounded-full bg-popo-pink/10 border border-popo-pink/20">
                <Radio className="w-3.5 h-3.5" />
                {t.tag}
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {t.title}
            </h2>
            <p className="text-sm sm:text-base text-popo-text-secondary leading-relaxed">
              {t.subtitle}
            </p>
          </div>

          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              const el = document.getElementById('download');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            rightIcon={<ArrowRight className="w-4 h-4 text-popo-pink" />}
            className="self-start md:self-end shrink-0"
          >
            {t.viewAll}
          </Button>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-8">
          {t.categories.map((cat: string, idx: number) => {
            const isActive = activeCategory === idx;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(idx)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all select-none ${
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

        {/* Live Room Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {mockRooms.map((room) => (
            <LiveRoomCard
              key={room.id}
              id={room.id}
              title={room.title}
              hostName={room.hostName}
              hostAvatar={room.hostAvatar}
              coverImage={room.coverImage}
              viewerCount={room.viewerCount}
              category={room.category}
              country={room.country}
              level={room.level}
              isPK={room.isPK}
              onClick={() => {
                const el = document.getElementById('download');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
