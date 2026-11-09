import React, { Suspense } from 'react';
import EndScreen from '@/components/live/EndScreen';

export const metadata = {
  title: 'Live Ended | Popo Live',
  description: 'Popo Live broadcast session performance summary and End Screen (Module 4.8)',
};

export default function EndScreenPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070817] flex items-center justify-center text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-white/60">Loading session summary...</p>
          </div>
        </div>
      }
    >
      <EndScreen />
    </Suspense>
  );
}
