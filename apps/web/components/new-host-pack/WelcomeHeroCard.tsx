'use client';

import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SAMPLE_PACK_HOST } from './mockNewHostPackData';
import { PackProgressSummary } from './types';

interface WelcomeHeroCardProps {
  progress: PackProgressSummary;
  onGetStarted: () => void;
  onOpenProgress: () => void;
}

export const WelcomeHeroCard: React.FC<WelcomeHeroCardProps> = ({
  progress,
  onGetStarted,
  onOpenProgress,
}) => {
  return (
    <section
      data-testid="new-host-welcome-hero"
      className="rounded-3xl bg-gradient-to-br from-[#230E45] via-[#170932] to-[#120526] border border-purple-400/25 p-5 sm:p-7 shadow-2xl space-y-5"
    >
      {/* Top Centered Hero Sparkle Emblem matching 09_04_new_host_pack.png */}
      <div className="text-center space-y-3 py-2">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center shadow-lg">
          <Sparkles className="w-9 h-9 text-amber-400" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg sm:text-xl font-black uppercase tracking-[0.06em] text-white">
            WELCOME TO POPO LIVE
          </h2>
          <p className="text-xs sm:text-sm font-bold text-[#FF85B3]">
            Your creator starter pack
          </p>
        </div>

        <p className="text-xs sm:text-sm text-purple-100/80 max-w-xl mx-auto leading-relaxed">
          Welcome to Popo Live! Your creator journey starts here. Explore the tools, learn the basics and get ready to connect with your community.
        </p>
      </div>

      {/* Host Identity + Starter Progress Indicator */}
      <div className="rounded-2xl bg-[#16082E] border border-purple-400/20 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-[#FF1A6C] to-amber-300 shrink-0">
              <div className="w-full h-full rounded-full overflow-hidden bg-[#14072A]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={SAMPLE_PACK_HOST.avatarUrl}
                  alt={SAMPLE_PACK_HOST.hostName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="min-w-0 leading-tight">
              <p className="text-xs sm:text-sm font-black text-white truncate">
                {SAMPLE_PACK_HOST.hostName}
              </p>
              <p className="text-[11px] text-purple-200/70 truncate">
                {SAMPLE_PACK_HOST.username} · Host Starter Pack
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenProgress}
            data-testid="welcome-progress-pill-btn"
            className="px-3 py-1 rounded-full bg-[#FF1A6C]/20 border border-[#FF1A6C]/45 text-xs font-black text-[#FF85B3] hover:bg-[#FF1A6C]/30 transition-colors"
          >
            {progress.overallPercent}% Complete ({progress.completedCount}/{progress.totalSteps})
          </button>
        </div>

        <div className="h-2.5 w-full rounded-full bg-[#2B174A] overflow-hidden">
          <div
            data-testid="welcome-progress-bar"
            className="h-full rounded-full bg-gradient-to-r from-[#FF1A6C] via-[#EC4899] to-amber-300 transition-all duration-300"
            style={{ width: `${progress.overallPercent}%` }}
          />
        </div>
      </div>

      {/* Getting Started CTA */}
      <div className="flex flex-wrap items-center justify-center sm:justify-between gap-3 pt-1">
        <span className="text-[11px] text-purple-200/65">
          Frontend creator onboarding guide · Interactive local progress
        </span>
        <Button
          type="button"
          size="md"
          variant="primary"
          rightIcon={<ArrowRight className="w-4 h-4" />}
          onClick={onGetStarted}
          data-testid="new-host-getting-started-btn"
          className="whitespace-nowrap"
        >
          {progress.completedCount > 0 && progress.pendingCount > 0
            ? 'Getting Started / Continue'
            : 'Getting Started'}
        </Button>
      </div>
    </section>
  );
};
