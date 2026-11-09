import React, { Suspense } from 'react';
import LiveCenterScreen from '@/components/live/LiveCenterScreen';

export const metadata = {
  title: 'Live Center | Popo Live',
  description: 'Host live streaming history, session analytics, and performance KPIs (Module 4.8)',
};

export default function LiveCenterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070817] flex items-center justify-center text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-white/60">Loading Live Center...</p>
          </div>
        </div>
      }
    >
      <LiveCenterScreen />
    </Suspense>
  );
}
