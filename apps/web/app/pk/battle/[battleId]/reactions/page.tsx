import React, { Suspense } from 'react';
import { Metadata } from 'next';
import PKReactionsScreen from '@/components/pk/PKReactionsScreen';

export const metadata: Metadata = {
  title: 'PK Battle Reactions | Popo Live',
  description: 'Real-time interactive audience reactions, floating hearts, and emojis for Popo Live PK Battles.',
};

export default function PKBattleReactionsPage({
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
        <div className="min-h-screen bg-[#070414] flex items-center justify-center text-white">
          <div className="w-8 h-8 border-2 border-[#ff2d78] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PKReactionsScreen
        battleId={params.battleId}
        initialLanguage={initialLanguage}
      />
    </Suspense>
  );
}
