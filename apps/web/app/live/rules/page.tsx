import { Suspense } from 'react';
import { Metadata } from 'next';
import HostRulesScreen from '@/components/live/HostRulesScreen';

export const metadata: Metadata = {
  title: 'Host Rules | Poppo Live',
  description: 'Popo Live Module 4.10 Host Rules on Screen - Safety and Community Broadcasting Standards',
};

export default function HostRulesPage() {
  return (
    <main className="min-h-screen bg-[#070817] flex items-center justify-center p-0 sm:py-6">
      <Suspense
        fallback={
          <div className="w-full max-w-sm mx-auto min-h-screen bg-[#0a0a1f] text-white flex items-center justify-center">
            <span className="text-xs text-zinc-400">Loading Host Rules...</span>
          </div>
        }
      >
        <HostRulesScreen />
      </Suspense>
    </main>
  );
}
