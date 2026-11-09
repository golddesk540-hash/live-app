import React, { Suspense } from 'react';
import WebWatchStudioScreen from '@/components/live/WebWatchStudioScreen';

export const metadata = {
  title: 'Web Watch | Popo Live',
  description: 'Popo Live Web Watch - Watch live stream in browser (Module 4.7)',
};

export default function WatchAliasPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070817] flex items-center justify-center text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#7b2cbf] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-white/60">Loading Web Watch...</p>
          </div>
        </div>
      }
    >
      <WebWatchStudioScreen defaultMode="watch" />
    </Suspense>
  );
}
