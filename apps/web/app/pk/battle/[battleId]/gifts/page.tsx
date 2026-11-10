import React, { Suspense } from 'react';
import { Metadata } from 'next';
import PKRealGiftsScreen from '@/components/pk/PKRealGiftsScreen';

export const metadata: Metadata = {
  title: 'PK Battle Real Gifts | Popo Live',
  description: 'Send real virtual gifts during active PK Battles. Real wallet deduction, 70% host earnings points, and live score updates.',
};

export default function PKBattleRealGiftsPage({
  params,
  searchParams,
}: {
  params: { battleId: string };
  searchParams?: { lang?: 'en' | 'ur' };
}) {
  const initialLanguage = searchParams?.lang === 'ur' ? 'ur' : 'en';

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0618] flex items-center justify-center text-white">
          <div className="w-8 h-8 border-2 border-[#ff2d78] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PKRealGiftsScreen
        battleId={params.battleId}
        initialLanguage={initialLanguage}
      />
    </Suspense>
  );
}
