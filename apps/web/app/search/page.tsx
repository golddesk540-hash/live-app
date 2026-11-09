import React, { Suspense } from 'react';
import SearchScreen from '@/components/search/SearchScreen';
import { Loader2 } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Users, Rooms & Broadcasters | Popo Live',
  description: 'Search for live hosts, popular broadcasters, PK battles, and 9-seat voice party rooms on Popo Live.',
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080915] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF2E74]" />
        </div>
      }
    >
      <SearchScreen />
    </Suspense>
  );
}
