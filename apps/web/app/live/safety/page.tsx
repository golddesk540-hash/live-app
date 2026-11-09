import React, { Suspense } from 'react';
import SafetyToolsScreen from '@/components/live/SafetyToolsScreen';

export const metadata = {
  title: 'Safety Tools | Popo Live',
  description: 'Official Popo Live safety moderation tools: report, block, and mute (Module 4.6)',
};

export default function SafetyToolsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070814] flex items-center justify-center text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-white/60">Loading Safety Tools...</p>
          </div>
        </div>
      }
    >
      <SafetyToolsScreen />
    </Suspense>
  );
}
