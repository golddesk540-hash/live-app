'use client';

import React from 'react';
import Link from 'next/link';
import { VideoCallDisabledBanner } from './VideoCallDisabledBanner';
import { FutureVideoCallPreview } from './FutureVideoCallPreview';
import {
  ArrowLeft,
  Compass,
  Home,
  MessageCircle,
  PlusSquare,
  User,
  VideoOff,
} from 'lucide-react';

export const VideoCallDisabledScreen: React.FC = () => {
  return (
    <div
      data-testid="video-call-disabled-screen"
      className="min-h-screen bg-[#0D031B] text-white flex flex-col pb-24 lg:pb-10"
    >
      {/* Popo Live Branded App Bar */}
      <header className="sticky top-0 z-40 border-b border-purple-400/20 bg-[#120624]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href="/live"
              aria-label="Back to Popo Live Home"
              className="p-2 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-purple-100/90 transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <Link href="/live" className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF1A6C] to-[#9333EA] flex items-center justify-center shadow-glow-pink">
                <span className="font-black text-white text-sm tracking-tight">P</span>
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm tracking-tight text-white">Popo Live</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-[#FF1A6C]/20 border border-[#FF1A6C]/45 text-[9px] font-extrabold text-[#FF6BA3] uppercase tracking-wider">
                    Video Call · OFF
                  </span>
                </div>
                <p className="text-[10px] text-purple-200/60 hidden sm:block">
                  Disabled Feature Placeholder
                </p>
              </div>
            </Link>
          </div>

          <Link
            href="/inbox"
            data-testid="video-call-back-to-inbox-btn"
            className="px-3.5 py-1.5 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-purple-400/25 text-xs font-bold text-purple-100 transition-colors"
          >
            Go to Inbox
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-5">
        <section className="rounded-3xl bg-[#110523]/90 border border-purple-400/20 p-4 sm:p-5 shadow-2xl flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#261148] border border-[#FF1A6C]/40 flex items-center justify-center shrink-0">
              <VideoOff className="w-5 h-5 text-[#FF4D8D]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-[28px] font-black tracking-tight text-white">
                1-to-1 Video Calls
              </h1>
              <p className="text-xs text-purple-200/70">
                1-to-1 video call setting &amp; disabled feature preview
              </p>
            </div>
          </div>

          <Link
            href="/live"
            className="px-4 py-2 rounded-full bg-[#241046] hover:bg-[#311761] border border-white/10 text-xs font-bold text-purple-100"
          >
            Go Back Home
          </Link>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-6 items-start">
          <VideoCallDisabledBanner />
          <FutureVideoCallPreview />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Mobile quick navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 h-16 bg-[#130626]/95 backdrop-blur-xl border-t border-purple-400/20 flex items-center justify-around px-2"
      >
        <Link
          href="/live"
          className="flex flex-col items-center gap-0.5 text-purple-200/60 hover:text-white"
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Home</span>
        </Link>
        <Link
          href="/square"
          className="flex flex-col items-center gap-0.5 text-purple-200/60 hover:text-white"
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Square</span>
        </Link>
        <Link
          href="/square/create"
          aria-label="Create Post"
          className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF1A6C] to-[#9333EA] flex items-center justify-center text-white shadow-glow-pink"
        >
          <PlusSquare className="w-5 h-5" />
        </Link>
        <Link
          href="/inbox"
          className="flex flex-col items-center gap-0.5 text-purple-200/60 hover:text-white"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Inbox</span>
        </Link>
        <Link
          href="/profile"
          className="flex flex-col items-center gap-0.5 text-[#FF1A6C]"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-extrabold">Me</span>
        </Link>
      </nav>
    </div>
  );
};
