'use client';

import React, { useState } from 'react';
import { Sliders, Volume2, Sparkles, ShieldCheck, X } from 'lucide-react';
import type { UserAnimationPreferences } from '@/lib/animations';

interface AnimationSettingsModalProps {
  open: boolean;
  preferences: UserAnimationPreferences;
  isUrdu?: boolean;
  saving?: boolean;
  onClose: () => void;
  onSave: (next: {
    enableLargeAnimations: boolean;
    enableSoundEffects: boolean;
    reduceAnimations: boolean;
    respectDeviceReducedMotion: boolean;
  }) => Promise<void> | void;
}

export default function AnimationSettingsModal({
  open,
  preferences,
  isUrdu = false,
  saving = false,
  onClose,
  onSave,
}: AnimationSettingsModalProps) {
  const [enableLargeAnimations, setEnableLargeAnimations] = useState(
    preferences.enableLargeAnimations
  );
  const [enableSoundEffects, setEnableSoundEffects] = useState(
    preferences.enableSoundEffects
  );
  const [reduceAnimations, setReduceAnimations] = useState(preferences.reduceAnimations);
  const [respectDeviceReducedMotion, setRespectDeviceReducedMotion] = useState(
    preferences.respectDeviceReducedMotion
  );

  React.useEffect(() => {
    setEnableLargeAnimations(preferences.enableLargeAnimations);
    setEnableSoundEffects(preferences.enableSoundEffects);
    setReduceAnimations(preferences.reduceAnimations);
    setRespectDeviceReducedMotion(preferences.respectDeviceReducedMotion);
  }, [preferences, open]);

  if (!open) return null;

  return (
    <div
      data-testid="animation-settings-modal"
      dir={isUrdu ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3"
    >
      <div className="w-full max-w-md rounded-3xl bg-[#180833] border border-[#491d88] p-5 text-white shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#ff2e93]" />
            <h3 className="text-sm font-extrabold">
              {isUrdu ? 'اینیمیشن اور ساؤنڈ کی ترتیبات' : 'Animation & Sound Settings'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5 text-xs">
          <label className="flex items-center justify-between gap-3 rounded-2xl bg-[#220c47] border border-[#3e1a76] p-3 cursor-pointer">
            <div>
              <p className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                {isUrdu ? 'بڑی فل اسکرین اینیمیشنز' : 'Enable Large Animations'}
              </p>
              <p className="text-[11px] text-purple-300 mt-0.5">
                {isUrdu
                  ? 'قلعہ، سپورٹس کار اور لگزری اثرات دکھائیں'
                  : 'Display full-screen luxury gifts, fireworks and 3D overlays'}
              </p>
            </div>
            <input
              type="checkbox"
              data-testid="toggle-large-animations"
              checked={enableLargeAnimations}
              onChange={(e) => setEnableLargeAnimations(e.target.checked)}
              className="w-4 h-4 accent-[#ff007f]"
            />
          </label>

          <label className="flex items-center justify-between gap-3 rounded-2xl bg-[#220c47] border border-[#3e1a76] p-3 cursor-pointer">
            <div>
              <p className="font-bold flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-pink-300" />
                {isUrdu ? 'ساؤنڈ ایفیکٹس فعال کریں' : 'Enable Sound Effects'}
              </p>
              <p className="text-[11px] text-purple-300 mt-0.5">
                {isUrdu
                  ? 'تحائف اور میزبان کی آمد کی آواز چلائیں'
                  : 'Play approved chimes, fanfare and VIP entrance audio'}
              </p>
            </div>
            <input
              type="checkbox"
              data-testid="toggle-sound-effects"
              checked={enableSoundEffects}
              onChange={(e) => setEnableSoundEffects(e.target.checked)}
              className="w-4 h-4 accent-[#ff007f]"
            />
          </label>

          <label className="flex items-center justify-between gap-3 rounded-2xl bg-[#220c47] border border-[#3e1a76] p-3 cursor-pointer">
            <div>
              <p className="font-bold">
                {isUrdu ? 'ہلکی اینیمیشن (کم طاقت ڈیوائس)' : 'Reduce Animations (Low-End Mode)'}
              </p>
              <p className="text-[11px] text-purple-300 mt-0.5">
                {isUrdu
                  ? 'ویڈیو کو ہموار رکھنے کے لیے ہلکے بینرز استعمال کریں'
                  : 'Use lightweight banners to keep Agora video silky smooth'}
              </p>
            </div>
            <input
              type="checkbox"
              data-testid="toggle-reduce-animations"
              checked={reduceAnimations}
              onChange={(e) => setReduceAnimations(e.target.checked)}
              className="w-4 h-4 accent-[#ff007f]"
            />
          </label>

          <label className="flex items-center justify-between gap-3 rounded-2xl bg-[#220c47] border border-[#3e1a76] p-3 cursor-pointer">
            <div>
              <p className="font-bold">
                {isUrdu ? 'ڈیوائس رسائی کی ترتیبات مانیں' : 'Respect Device Accessibility'}
              </p>
              <p className="text-[11px] text-purple-300 mt-0.5">
                {isUrdu
                  ? 'ڈیوائس موشن کم ہونے پر خودکار لائٹ موڈ'
                  : 'Honor OS prefers-reduced-motion accessibility settings'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={respectDeviceReducedMotion}
              onChange={(e) => setRespectDeviceReducedMotion(e.target.checked)}
              className="w-4 h-4 accent-[#ff007f]"
            />
          </label>
        </div>

        <div className="rounded-2xl bg-emerald-950/50 border border-emerald-500/35 px-3 py-2 text-[11px] text-emerald-200 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>
            {isUrdu
              ? 'اینیمیشن بند کرنے سے تحفے بھیجنے یا میزبان کے پوائنٹس متاثر نہیں ہوتے۔'
              : 'Visual settings never block gift transactions, wallet coins, or host points.'}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-purple-400/30 py-2.5 text-xs font-bold text-purple-200 hover:bg-white/5"
          >
            {isUrdu ? 'بند کریں' : 'Close'}
          </button>
          <button
            type="button"
            disabled={saving}
            data-testid="save-animation-settings-btn"
            onClick={() =>
              onSave({
                enableLargeAnimations,
                enableSoundEffects,
                reduceAnimations,
                respectDeviceReducedMotion,
              })
            }
            className="flex-1 rounded-2xl bg-gradient-to-r from-[#ff007f] to-[#a855f7] py-2.5 text-xs font-extrabold text-white shadow-lg disabled:opacity-60"
          >
            {saving ? (isUrdu ? 'محفوظ ہو رہا ہے...' : 'Saving...') : isUrdu ? 'محفوظ کریں' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
