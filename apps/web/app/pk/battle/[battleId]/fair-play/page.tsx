import React, { Suspense } from 'react';
import { Metadata } from 'next';
import PKFairPlayScreen from '@/components/pk/PKFairPlayScreen';

export const metadata: Metadata = {
  title: 'PK Fair Play & Anti-Cheat | Popo Live',
  description: 'Official PK Fair Play rules, anti-cheat security guard, and community reporting for Popo Live PK Battles.',
};

export default function PKBattleFairPlayPage({
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
      <PKFairPlayScreen
        battleId={params.battleId}
        initialLanguage={initialLanguage}
      />
    </Suspense>
  );
}
