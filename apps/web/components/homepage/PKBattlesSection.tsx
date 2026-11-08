'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { content } from './content';
import { Swords, Timer, Flame, Gift, Trophy, Sparkles } from 'lucide-react';

export interface PKBattlesSectionProps {
  lang: 'en' | 'ur';
}

export const PKBattlesSection: React.FC<PKBattlesSectionProps> = ({ lang }) => {
  const t = content[lang].pk;
  const isUr = lang === 'ur';

  return (
    <section id="pk" className="py-20 relative bg-popo-dark-950 border-t border-white/5 overflow-hidden">
      {/* Dynamic ambient battle glows */}
      <div className="absolute top-1/2 left-10 w-96 h-96 bg-red-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-96 h-96 bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-14 flex flex-col items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-red-400 flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-red-500/10 border border-red-500/20">
            <Swords className="w-3.5 h-3.5" />
            {t.tag}
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {t.title}
          </h2>
          <p className="text-sm sm:text-base text-popo-text-secondary leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        {/* 1v1 Battle Arena Visualizer */}
        <div className="max-w-4xl mx-auto rounded-3xl bg-popo-dark-900 border border-white/10 shadow-2xl overflow-hidden p-6 sm:p-8 relative">
          {/* Top Timer Bar */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <div className="flex items-center gap-2 text-red-400 font-extrabold text-xs uppercase tracking-wider">
              <Flame className="w-4 h-4 fill-red-400" />
              <span>{isUr ? 'سرخ ٹیم' : 'RED CORNER'}</span>
            </div>

            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 border border-white/10 text-white font-mono text-xs sm:text-sm font-bold shadow-inner">
              <Timer className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>PK BATTLE — 02:15</span>
            </div>

            <div className="flex items-center gap-2 text-cyan-400 font-extrabold text-xs uppercase tracking-wider">
              <span>{isUr ? 'نیلی ٹیم' : 'BLUE CORNER'}</span>
              <Flame className="w-4 h-4 fill-cyan-400" />
            </div>
          </div>

          {/* Dynamic Tug-of-War Score Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-xs font-extrabold text-white mb-2">
              <span className="text-red-400 flex items-center gap-1">
                🔥 68,400 PTS
              </span>
              <span className="text-xs text-popo-text-muted uppercase">Tug of War</span>
              <span className="text-cyan-400 flex items-center gap-1">
                54,200 PTS ⚡️
              </span>
            </div>
            <div className="w-full h-4 rounded-full bg-popo-dark-800 overflow-hidden flex border border-white/10 p-[1px]">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-popo-pink to-pink-500 transition-all duration-500 rounded-l-full"
                style={{ width: '56%' }}
              />
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-popo-cyan transition-all duration-500 rounded-r-full"
                style={{ width: '44%' }}
              />
            </div>
          </div>

          {/* Streamers Head-to-Head Visuals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative">
            {/* Center VS Crest */}
            <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-full bg-gradient-to-tr from-red-600 via-purple-600 to-blue-600 p-[2px] shadow-2xl items-center justify-center">
              <div className="w-full h-full bg-popo-dark-950 rounded-full flex items-center justify-center font-black text-sm text-white italic">
                VS
              </div>
            </div>

            {/* Host 1 (Red Side) */}
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-popo-dark-850 border-2 border-red-500/40 p-4 flex flex-col justify-between group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80"
                alt="Host 1"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between">
                <Badge variant="live">LEAD +14.2k</Badge>
                <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-xs">
                  👑
                </div>
              </div>

              <div className="relative z-10 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-base font-bold text-white">Noor Fatima 🇵🇰</h4>
                  <Badge variant="level" level={45} size="xs" />
                </div>
                <span className="text-xs text-red-300 font-extrabold flex items-center gap-1">
                  <Gift className="w-3.5 h-3.5" /> 1,240 Gifts Received
                </span>
              </div>
            </div>

            {/* Host 2 (Blue Side) */}
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-popo-dark-850 border-2 border-blue-500/40 p-4 flex flex-col justify-between group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80"
                alt="Host 2"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between">
                <Badge variant="category">CHALLENGER</Badge>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs">
                  ⚔️
                </div>
              </div>

              <div className="relative z-10 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-base font-bold text-white">Ayesha Khan 🇦🇪</h4>
                  <Badge variant="level" level={38} size="xs" />
                </div>
                <span className="text-xs text-cyan-300 font-extrabold flex items-center gap-1">
                  <Gift className="w-3.5 h-3.5" /> 980 Gifts Received
                </span>
              </div>
            </div>
          </div>

          {/* Action Callout */}
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className={`flex items-center gap-3 ${isUr ? 'text-right' : 'text-left'}`}>
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <p className="text-xs sm:text-sm text-popo-text-secondary leading-snug">
                {t.winnerBonus}
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => {
                const el = document.getElementById('download');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              leftIcon={<Gift className="w-4 h-4" />}
              className="w-full sm:w-auto shrink-0 shadow-glow-pink"
            >
              {t.sendGiftBoost}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
