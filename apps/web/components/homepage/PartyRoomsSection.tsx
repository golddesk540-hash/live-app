'use client';

import React from 'react';
import { NineSeatPartyPreview } from '@/components/references/NineSeatPartyPreview';
import { Button } from '@/components/ui/Button';
import { content } from './content';
import { Users, Mic, ShieldCheck, Sparkles, Volume2, CheckCircle2 } from 'lucide-react';

export interface PartyRoomsSectionProps {
  lang: 'en' | 'ur';
}

export const PartyRoomsSection: React.FC<PartyRoomsSectionProps> = ({ lang }) => {
  const t = content[lang].party;
  const isUr = lang === 'ur';

  return (
    <section id="party" className="py-20 relative bg-popo-dark-900 border-t border-white/5 overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-popo-purple/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left / Info Column */}
          <div className={`lg:col-span-6 flex flex-col gap-6 ${isUr ? 'text-right' : 'text-left'}`}>
            <div className={`inline-flex items-center gap-2 ${isUr ? 'self-end' : 'self-start'}`}>
              <span className="text-xs font-bold uppercase tracking-widest text-popo-purple-light flex items-center gap-1.5 px-3 py-1 rounded-full bg-popo-purple/15 border border-popo-purple/30">
                <Users className="w-3.5 h-3.5" />
                {t.tag}
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              {t.title}
            </h2>

            <p className="text-sm sm:text-base text-popo-text-secondary leading-relaxed">
              {t.subtitle}
            </p>

            {/* Key Feature Bullets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-2">
              {t.features.map((feature: string, idx: number) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2.5 p-3 rounded-xl bg-popo-dark-850/60 border border-white/5 ${
                    isUr ? 'flex-row-reverse text-right' : 'text-left'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-popo-cyan shrink-0" />
                  <span className="text-xs font-semibold text-white">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className={`flex items-center gap-4 pt-2 ${isUr ? 'justify-end' : 'justify-start'}`}>
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  const el = document.getElementById('download');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                leftIcon={<Mic className="w-4 h-4" />}
                className="bg-gradient-to-r from-popo-purple via-popo-pink to-[#FF5E3A]"
              >
                {t.requestSeat}
              </Button>
            </div>
          </div>

          {/* Right Column: Interactive 9-Seat Party Visualizer */}
          <div className="lg:col-span-6 flex justify-center">
            <NineSeatPartyPreview
              roomTitle={isUr ? '✨ رات کی محفل: اردو شاعری اور گپ شپ کلب ✨' : '✨ Late Night Urdu Ghazal & Chill Club ✨'}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
