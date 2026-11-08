'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { content } from './content';
import {
  Download,
  Play,
  Sparkles,
  Users,
  ShieldCheck,
  Heart,
  Radio,
  Flame,
  Gift,
} from 'lucide-react';

export interface HeroSectionProps {
  lang: 'en' | 'ur';
}

export const HeroSection: React.FC<HeroSectionProps> = ({ lang }) => {
  const t = content[lang].hero;
  const isUr = lang === 'ur';

  return (
    <section
      id="home"
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-16 md:py-24"
    >
      {/* Background Ambient Lighting Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-popo-pink/20 via-purple-600/15 to-popo-cyan/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-popo-pink/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headlines & Call to Actions */}
          <div className={`lg:col-span-7 flex flex-col gap-6 text-center ${isUr ? 'lg:text-right' : 'lg:text-left'}`}>
            {/* Tag Badge */}
            <div className={`inline-flex items-center gap-2 self-center ${isUr ? 'lg:self-end' : 'lg:self-start'}`}>
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-popo-dark-850 border border-white/10 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-popo-pink animate-live-pulse" />
                <span className="text-xs font-bold text-popo-text-primary tracking-wide">
                  {t.tag}
                </span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-popo-pink via-purple-400 to-amber-300">
                {t.titleHighlight}
              </span>{' '}
              {t.titleRest}
            </h1>

            {/* Supporting Description */}
            <p className="text-base sm:text-lg text-popo-text-secondary leading-relaxed max-w-2xl mx-auto lg:mx-0">
              {t.description}
            </p>

            {/* CTAs */}
            <div className={`flex flex-wrap items-center justify-center gap-4 pt-2 ${isUr ? 'lg:justify-end' : 'lg:justify-start'}`}>
              <a href="/download">
                <Button
                  variant="primary"
                  size="lg"
                  leftIcon={<Download className="w-5 h-5" />}
                  className="text-base px-7 shadow-glow-pink"
                >
                  {t.ctaPrimary}
                </Button>
              </a>

              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  const el = document.getElementById('live');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                leftIcon={<Play className="w-4 h-4 fill-white" />}
                className="text-base px-6 border-white/15 hover:border-white/30"
              >
                {t.ctaSecondary}
              </Button>
            </div>

            {/* Quick Metrics Bar */}
            <div className={`grid grid-cols-3 gap-3 pt-6 border-t border-white/10 max-w-lg mx-auto lg:mx-0 text-left`}>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black text-white flex items-center gap-1">
                  12.4k<span className="text-popo-pink text-sm">🔴</span>
                </span>
                <span className="text-xs text-popo-text-muted font-medium">{t.activeStreamers}</span>
              </div>
              <div className="flex flex-col border-x border-white/10 px-3">
                <span className="text-xl sm:text-2xl font-black text-white flex items-center gap-1">
                  2.5M<span className="text-popo-cyan text-sm">✨</span>
                </span>
                <span className="text-xs text-popo-text-muted font-medium">{t.activeUsers}</span>
              </div>
              <div className="flex flex-col pl-2">
                <span className="text-xl sm:text-2xl font-black text-amber-400 flex items-center gap-1">
                  70%<span className="text-amber-400 text-xs">💎</span>
                </span>
                <span className="text-xs text-popo-text-muted font-medium">Host Gift Share</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Live Creator Showcase with Neon Heart (02_homepage_desktop.png) */}
          <div className="lg:col-span-5 flex justify-center items-center relative">
            {/* Glowing Neon Heart SVG Backdrop */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-0">
              <svg
                viewBox="0 0 400 400"
                className="w-[360px] sm:w-[440px] h-[360px] sm:h-[440px] text-popo-pink opacity-80 animate-pulse duration-3000 filter drop-shadow-[0_0_35px_rgba(255,26,108,0.7)]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M200 340C200 340 70 240 40 160C10 80 80 30 140 50C180 63 200 100 200 100C200 100 220 63 260 50C320 30 390 80 360 160C330 240 200 340 200 340Z"
                  stroke="url(#heart-gradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <defs>
                  <linearGradient id="heart-gradient" x1="40" y1="50" x2="360" y2="340" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FF1A6C" />
                    <stop offset="0.5" stopColor="#FF4D8D" />
                    <stop offset="1" stopColor="#7928CA" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Main Creator Portrait Showcase */}
            <div className="relative z-10 w-full max-w-[340px] sm:max-w-[380px] aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80"
                alt="Popo Live featured broadcaster"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none" />

              {/* In-Frame Live Badges */}
              <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-popo-pink text-white text-xs font-black shadow-glow-pink">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  LIVE
                </span>
                <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold border border-white/15">
                  🇵🇰 Pakistan
                </span>
              </div>

              {/* Floating Gift Trigger Mockup */}
              <div className="absolute bottom-16 left-4 z-10">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-black/60 backdrop-blur-md border border-amber-400/30 shadow-glow-gold">
                  <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-xs">
                    🎁
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-bold text-white">Luxury Crown</span>
                    <span className="text-[9px] text-amber-300 font-extrabold">+1,200 Pts</span>
                  </div>
                </div>
              </div>

              {/* Bottom Host Metadata */}
              <div className="absolute bottom-4 inset-x-4 z-10 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">Noor Fatima</h3>
                  <span className="text-xs text-popo-text-secondary">Singing & Acoustic</span>
                </div>
                <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold border border-white/15">
                  <span className="text-popo-pink">●</span>
                  <span>14.8k</span>
                </div>
              </div>
            </div>

            {/* Decorative Floating Badges */}
            <div className="absolute -top-3 -left-4 hidden sm:flex items-center gap-2 p-3 rounded-2xl bg-popo-dark-850/90 backdrop-blur-xl border border-white/15 shadow-card-dark z-20">
              <span className="text-xl">🎙️</span>
              <div className="text-left">
                <span className="text-xs font-bold text-white block">9-Seat Party Room</span>
                <span className="text-[10px] text-popo-cyan font-semibold">Stereo Voice Lounge</span>
              </div>
            </div>

            <div className="absolute -bottom-3 -right-4 hidden sm:flex items-center gap-2 p-3 rounded-2xl bg-popo-dark-850/90 backdrop-blur-xl border border-white/15 shadow-card-dark z-20">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div className="text-left">
                <span className="text-xs font-bold text-white block">Verified Host</span>
                <span className="text-[10px] text-popo-text-secondary font-semibold">Strict 18+ Protection</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
