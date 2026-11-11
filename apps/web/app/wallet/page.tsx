import React, { Suspense } from 'react';
import { Metadata } from 'next';
import WalletScreen from '@/components/wallet/WalletScreen';

export const metadata: Metadata = {
  title: 'Wallet — Coins & Points | Popo Live',
  description:
    'Manage your Popo Live Coin balance, Host Earnings Points, Coin History, and Points History with real-time updates.',
};

export default function WalletPage({
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
        <WalletScreen
          initialUserId={initialUserId}
          initialLanguage={initialLanguage}
          isPreviewDemo={isPreviewDemo}
        />
      </Suspense>
    </div>
  );
}
