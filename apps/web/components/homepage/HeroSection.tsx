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
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  const el = document.getElementById('download');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                leftIcon={<Download className="w-5 h-5" />}
                className="text-base px-7 shadow-glow-pink"
              >
                {t.ctaPrimary}
              </Button>

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

          {/* Right Column: Visual Live Preview Showcase Card */}
          <div className="lg:col-span-5 flex justify-center relative">
            {/* Visual Phone Mockup / Live Stream Window */}
            <div className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-[9/16] rounded-[36px] overflow-hidden bg-popo-dark-900 border-4 border-white/15 shadow-2xl p-4 flex flex-col justify-between">
              {/* Background Streamer Simulated Video */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80"
                alt="Live streaming preview"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/70 pointer-events-none" />

              {/* Streamer Top Bar Capsule */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2 bg-black/55 backdrop-blur-md rounded-full p-1 pr-3 border border-white/15">
                  <Avatar
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                    size="sm"
                    ring="live"
                  />
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-white leading-tight">Noor Fatima 🇵🇰</span>
                    <span className="text-[10px] text-amber-400 font-extrabold flex items-center gap-0.5">
                      ⭐️ 148,200 Pts
                    </span>
                  </div>
                  <button className="text-[10px] font-extrabold text-white bg-popo-pink px-2 py-0.5 rounded-full shadow-glow-pink hover:opacity-90 transition-opacity">
                    + Follow
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-xs font-bold border border-white/15">
                  <Radio className="w-3 h-3 text-popo-live animate-pulse" />
                  <span>3,842</span>
                </div>
              </div>

              {/* Floating Gift Effect Pill */}
              <div className="relative z-10 self-start animate-bounce duration-1000">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500/40 via-purple-600/40 to-popo-pink/40 backdrop-blur-xl border border-amber-400/40 shadow-glow-gold">
                  <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center text-sm">
                    🚀
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-bold text-white">Hamza sent Luxury Rocket!</span>
                    <span className="text-[9px] text-amber-300 font-extrabold">+5,000 Host Points</span>
                  </div>
                </div>
              </div>

              {/* Bottom In-Room Feed & Actions */}
              <div className="relative z-10 flex flex-col gap-2 text-left">
                {/* Chat Bubbles */}
                <div className="flex flex-col gap-1 max-w-[85%]">
                  <div className="bg-black/50 backdrop-blur-md rounded-xl px-2.5 py-1 text-xs border border-white/5 inline-flex items-center gap-1.5">
                    <Badge variant="level" level={42} size="xs" />
                    <span className="font-bold text-popo-pink">Zaid:</span>
                    <span className="text-white">Love the new song! ❤️</span>
                  </div>
                  <div className="bg-black/50 backdrop-blur-md rounded-xl px-2.5 py-1 text-xs border border-white/5 inline-flex items-center gap-1.5">
                    <Badge variant="level" level={65} size="xs" />
                    <Badge variant="vip" size="xs">VIP</Badge>
                    <span className="font-bold text-amber-400">Sultan:</span>
                    <span className="text-white">PK Battle starting soon ⚔️</span>
                  </div>
                </div>

                {/* Bottom Stream Action Tray */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                  <div className="flex-1 bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5 text-xs text-popo-text-muted border border-white/10">
                    Say something...
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                    <Heart className="w-4 h-4 fill-popo-pink text-popo-pink" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-400 to-popo-pink flex items-center justify-center text-white shadow-glow-pink">
                    <Gift className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Floating Badges */}
            <div className="absolute -top-4 -left-6 hidden sm:flex items-center gap-2 p-3 rounded-2xl bg-popo-dark-850/90 backdrop-blur-xl border border-white/15 shadow-card-dark">
              <span className="text-xl">🎙️</span>
              <div className="text-left">
                <span className="text-xs font-bold text-white block">9-Seat Party Room</span>
                <span className="text-[10px] text-popo-cyan font-semibold">Stereo Voice Lounge</span>
              </div>
            </div>

            <div className="absolute -bottom-4 -right-4 hidden sm:flex items-center gap-2 p-3 rounded-2xl bg-popo-dark-850/90 backdrop-blur-xl border border-white/15 shadow-card-dark">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div className="text-left">
                <span className="text-xs font-bold text-white block">Safe & Verified</span>
                <span className="text-[10px] text-popo-text-secondary font-semibold">Strict 18+ Age Gate</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
