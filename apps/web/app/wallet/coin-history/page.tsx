import React, { Suspense } from 'react';
import { Metadata } from 'next';
import WalletHistoryScreen from '@/components/wallet/WalletHistoryScreen';

export const metadata: Metadata = {
  title: 'Coin History | Popo Live Wallet',
  description:
    'View detailed Coin top-ups, virtual gift deductions, reversals, and failed transactions.',
};

export default function CoinHistoryPage({
  searchParams,
}: {
  searchParams?: { userId?: string; lang?: 'en' | 'ur'; preview?: string };
}) {
  const initialUserId = searchParams?.userId || undefined;
  const initialLanguage = searchParams?.lang === 'ur' ? 'ur' : 'en';
  const isPreviewDemo = searchParams?.preview === 'demo';

  return (
    <div className="min-h-screen w-full bg-[#080312]">
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#0a0618] flex items-center justify-center text-white">
            <div className="w-8 h-8 border-2 border-[#ff2d78] border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <WalletHistoryScreen
          mode="coins"
          initialUserId={initialUserId}
          initialLanguage={initialLanguage}
          isPreviewDemo={isPreviewDemo}
        />
      </Suspense>
    </div>
  );
}
