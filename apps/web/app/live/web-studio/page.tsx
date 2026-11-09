import React, { Suspense } from 'react';
import WebWatchStudioScreen from '@/components/live/WebWatchStudioScreen';

export const metadata = {
  title: 'Web Studio | Popo Live',
  description: 'Popo Live Web Studio - Real browser camera broadcast with Agora RTC (Module 4.7)',
};

export default function WebStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070817] flex items-center justify-center text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#ff2e93] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-white/60">Loading Web Studio...</p>
          </div>
        </div>
      }
    >
      <WebWatchStudioScreen defaultMode="studio" />
    </Suspense>
  );
}
