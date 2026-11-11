'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Crown, ShieldCheck, Star, Award, X } from 'lucide-react';
import type { RecognitionLevelUpEventRecord } from '@/lib/recognition';

interface WingBadgeProps {
  levelNumber: number;
  wingStyle?: string;
  avatarUrl?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  highlighted?: boolean;
}

const WING_PALETTES: Record<
  string,
  {
    leftGradFrom: string;
    leftGradTo: string;
    rightGradFrom: string;
    rightGradTo: string;
    ringClass: string;
    pillClass: string;
    glowRgba: string;
    hasCrown?: boolean;
  }
> = {
  imperial_gold_wings: {
    leftGradFrom: '#FEF08A',
    leftGradTo: '#D97706',
    rightGradFrom: '#FDE047',
    rightGradTo: '#B45309',
    ringClass: 'from-yellow-200 via-amber-400 to-yellow-600',
    pillClass: 'from-amber-400 to-yellow-300 text-[#231202]',
    glowRgba: 'rgba(251, 191, 36, 0.55)',
    hasCrown: true,
  },
  sapphire_violet_wings: {
    leftGradFrom: '#38BDF8',
    leftGradTo: '#2563EB',
    rightGradFrom: '#C084FC',
    rightGradTo: '#7C3AED',
    ringClass: 'from-sky-300 via-indigo-400 to-purple-500',
    pillClass: 'from-sky-500 to-purple-600 text-white',
    glowRgba: 'rgba(96, 165, 250, 0.5)',
    hasCrown: false,
  },
  rose_bronze_wings: {
    leftGradFrom: '#FDA4AF',
    leftGradTo: '#BE123C',
    rightGradFrom: '#FDBA74',
    rightGradTo: '#9A3412',
    ringClass: 'from-rose-300 via-orange-300 to-rose-500',
    pillClass: 'from-rose-500 to-amber-700 text-white',
    glowRgba: 'rgba(251, 113, 133, 0.45)',
    hasCrown: false,
  },
  neon_magenta: {
    leftGradFrom: '#F472B6',
    leftGradTo: '#DB2777',
    rightGradFrom: '#E879F9',
    rightGradTo: '#9333EA',
    ringClass: 'from-pink-400 via-[#EC248F] to-fuchsia-500',
    pillClass: 'from-[#FF2E74] to-[#C026D3] text-white',
    glowRgba: 'rgba(236, 36, 143, 0.5)',
  },
  emerald_wings: {
    leftGradFrom: '#6EE7B7',
    leftGradTo: '#059669',
    rightGradFrom: '#34D399',
    rightGradTo: '#047857',
    ringClass: 'from-emerald-300 via-teal-400 to-green-600',
    pillClass: 'from-emerald-500 to-teal-600 text-white',
    glowRgba: 'rgba(16, 185, 129, 0.45)',
  },
};

function resolvePalette(wingStyle?: string) {
  if (wingStyle && WING_PALETTES[wingStyle]) return WING_PALETTES[wingStyle];
  if (wingStyle?.includes('gold')) return WING_PALETTES.imperial_gold_wings;
  if (wingStyle?.includes('sapphire') || wingStyle?.includes('cyan') || wingStyle?.includes('indigo')) {
    return WING_PALETTES.sapphire_violet_wings;
  }
  if (wingStyle?.includes('rose') || wingStyle?.includes('silver')) return WING_PALETTES.rose_bronze_wings;
  if (wingStyle?.includes('emerald')) return WING_PALETTES.emerald_wings;
  return WING_PALETTES.neon_magenta;
}

export function LevelWingBadge({
  levelNumber,
  wingStyle = 'neon_magenta',
  avatarUrl,
  label,
  size = 'md',
  highlighted = false,
}: WingBadgeProps) {
  const pal = resolvePalette(wingStyle);
  const avatarBox = size === 'lg' ? 'w-16 h-16' : size === 'sm' ? 'w-10 h-10' : 'w-14 h-14';
  const wingW = size === 'lg' ? 196 : size === 'sm' ? 116 : 164;
  const wingH = size === 'lg' ? 84 : size === 'sm' ? 50 : 70;
  const gradId = `wg_${levelNumber}_${wingStyle}_${size}`.replace(/[^a-zA-Z0-9_]/g, '');
  const resolvedSrc =
    avatarUrl && avatarUrl !== '/avatars/default.png' ? avatarUrl : '/assets/following/zara_live.png';
  const [imgFailed, setImgFailed] = useState(false);
  useEffect(() => {
    setImgFailed(false);
  }, [resolvedSrc]);

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center select-none ${
        highlighted ? 'scale-105 transition-transform duration-300' : ''
      }`}
      style={{
        filter: `drop-shadow(0 0 ${size === 'lg' ? 18 : 10}px ${pal.glowRgba})`,
      }}
    >
      {pal.hasCrown && (
        <div className="mb-[-6px] z-20 flex items-center justify-center">
          <Crown className={`${size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} text-yellow-300 fill-yellow-400 drop-shadow`} />
        </div>
      )}

      <div className="relative flex items-center justify-center" style={{ width: wingW, height: wingH }}>
        {/* Detailed Layered Metallic SVG Wings matching 07_08_wealth_shining_and_honor.png */}
        <svg
          viewBox="0 0 220 90"
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`${gradId}_L`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={pal.leftGradFrom} />
              <stop offset="100%" stopColor={pal.leftGradTo} />
            </linearGradient>
            <linearGradient id={`${gradId}_R`} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={pal.rightGradFrom} />
              <stop offset="100%" stopColor={pal.rightGradTo} />
            </linearGradient>
          </defs>
          {/* Left Wing Layers */}
          <path
            d="M84 44 C58 34, 24 22, 6 6 C14 26, 28 36, 52 44 C30 40, 16 34, 14 28 C22 44, 38 52, 60 56 C40 56, 26 52, 22 47 C32 62, 52 68, 82 64 Z"
            fill={`url(#${gradId}_L)`}
            opacity="0.96"
          />
          <path
            d="M84 48 C62 42, 38 35, 22 25 C34 40, 52 49, 78 55 Z"
            fill="#ffffff"
            opacity="0.22"
          />
          {/* Right Wing Layers */}
          <path
            d="M136 44 C162 34, 196 22, 214 6 C206 26, 192 36, 168 44 C190 40, 204 34, 206 28 C198 44, 182 52, 160 56 C180 56, 194 52, 198 47 C188 62, 168 68, 138 64 Z"
            fill={`url(#${gradId}_R)`}
            opacity="0.96"
          />
          <path
            d="M136 48 C158 42, 182 35, 198 25 C186 40, 168 49, 142 55 Z"
            fill="#ffffff"
            opacity="0.22"
          />
        </svg>

        {/* Central Circular Avatar Crest */}
        <div
          className={`relative z-10 ${avatarBox} rounded-full p-[3px] bg-gradient-to-tr ${pal.ringClass} shadow-xl`}
        >
          <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-[#2B125D] to-[#12072B] flex items-center justify-center">
            {!imgFailed ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={resolvedSrc}
                alt={label || `Lv.${levelNumber}`}
                className="w-full h-full object-cover"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <Crown className="w-6 h-6 text-amber-300" />
            )}
          </div>
        </div>

        {/* Lv.XX Emblem Pill */}
        <div
          className={`absolute -bottom-1 z-20 px-3 py-0.5 rounded-full bg-gradient-to-r ${pal.pillClass} border border-white/40 shadow-lg text-[11px] font-black tracking-wide`}
        >
          {label || `Lv.${levelNumber}`}
        </div>
      </div>
    </div>
  );
}

export function RecognitionLevelUpOverlay({
  event,
  avatarUrl,
  animationsEnabled,
  soundEnabled,
  isUr,
  onClose,
}: {
  event: RecognitionLevelUpEventRecord | null;
  avatarUrl?: string;
  animationsEnabled: boolean;
  soundEnabled: boolean;
  isUr: boolean;
  onClose: (eventId: string) => void;
}) {
  useEffect(() => {
    if (!event || !soundEnabled) return;
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch {
      // Audio playback skipped cleanly in restricted headless browsers
    }
  }, [event, soundEnabled]);

  if (!event) return null;

  const wingStyle =
    event.newLevelNumber >= 80
      ? 'imperial_gold_wings'
      : event.newLevelNumber >= 70
      ? 'sapphire_violet_wings'
      : event.newLevelNumber >= 60
      ? 'rose_bronze_wings'
      : event.category === 'honor'
      ? 'emerald_wings'
      : 'neon_magenta';

  const catLabel =
    event.category === 'wealth'
      ? isUr
        ? 'دولت لیول'
        : 'Wealth Level'
      : event.category === 'shining'
      ? isUr
        ? 'شائننگ لیول'
        : 'Shining Level'
      : isUr
      ? 'اعزاز لیول'
      : 'Honor Level';

  return (
    <div
      data-testid="recognition-levelup-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div
        className={`relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#230E4D] via-[#13072B] to-[#0A0318] border border-amber-400/50 p-6 text-center shadow-[0_0_60px_rgba(236,36,143,0.45)] ${
          animationsEnabled ? 'animate-in zoom-in-95 fade-in duration-300' : ''
        }`}
      >
        <button
          type="button"
          onClick={() => onClose(event.eventId)}
          aria-label="Close"
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/75"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF2E74]/20 border border-[#FF2E74]/40 text-[#FF7AB8] text-[10px] font-extrabold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isUr ? 'مبارک ہو! نیا درجہ حاصل ہوا' : 'Backend Confirmed Level Up!'}</span>
        </div>

        <div className="my-2">
          <LevelWingBadge
            levelNumber={event.newLevelNumber}
            wingStyle={wingStyle}
            avatarUrl={avatarUrl}
            label={`Lv.${event.newLevelNumber}`}
            size="lg"
            highlighted
          />
        </div>

        <p className="text-xs font-bold uppercase tracking-widest text-amber-300 mt-3">{catLabel}</p>
        <h3 className="text-xl font-black text-white mt-0.5">{event.newLevelName}</h3>
        <p className="text-xs text-white/60 mt-1">
          {isUr ? 'منظور شدہ غیر مالی مراعات غیر مقفل:' : 'Unlocked Approved Benefits:'}
        </p>

        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {event.unlockedBenefits.map((b) => (
            <span
              key={b}
              className="px-2.5 py-1 rounded-full bg-white/10 border border-purple-400/30 text-[10px] font-bold text-purple-100"
            >
              {b.replace(/^rec_/, '').replace(/_/g, ' ')}
            </span>
          ))}
        </div>

        <button
          type="button"
          data-testid="ack-levelup-btn"
          onClick={() => onClose(event.eventId)}
          className="mt-5 w-full py-2.5 rounded-2xl bg-gradient-to-r from-[#FF2E74] to-[#EC4899] text-white text-xs font-extrabold shadow-lg shadow-[#FF2E74]/35 hover:brightness-110 transition"
        >
          {isUr ? 'زبردست! جاری رکھیں' : 'Celebrate & Continue'}
        </button>
      </div>
    </div>
  );
}

export function RecognitionCategoryIcon({ category, className }: { category: 'wealth' | 'shining' | 'honor'; className?: string }) {
  if (category === 'wealth') return <Crown className={className} />;
  if (category === 'shining') return <Star className={className} />;
  return <ShieldCheck className={className} />;
}

export function CategoryPillBadge({
  category,
  levelNumber,
  levelName,
}: {
  category: 'wealth' | 'shining' | 'honor';
  levelNumber: number;
  levelName: string;
}) {
  const styles =
    category === 'wealth'
      ? 'from-amber-500/25 to-yellow-500/20 border-amber-400/45 text-amber-200'
      : category === 'shining'
      ? 'from-pink-500/25 to-fuchsia-500/20 border-pink-400/45 text-pink-200'
      : 'from-emerald-500/25 to-cyan-500/20 border-emerald-400/45 text-emerald-200';

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r ${styles} border text-[10px] font-extrabold`}
    >
      <Award className="w-3 h-3" />
      <span>
        {category === 'wealth' ? 'Wealth' : category === 'shining' ? 'Shining' : 'Honor'} Lv.{levelNumber}
      </span>
      <span className="opacity-75 hidden sm:inline">• {levelName}</span>
    </span>
  );
}
