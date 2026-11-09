import React, { Suspense } from 'react';
import QualityCostGuardScreen from '@/components/live/QualityCostGuardScreen';

export const metadata = {
  title: 'Quality & Cost Guard | Popo Live',
  description: 'Popo Live stream resolution, adaptive bitrate, and data cost guard controls (Module 4.9)',
};

export default function QualityPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070817] flex items-center justify-center text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-white/60">Loading quality settings...</p>
          </div>
        </div>
      }
    >
      <QualityCostGuardScreen />
    </Suspense>
  );
}
