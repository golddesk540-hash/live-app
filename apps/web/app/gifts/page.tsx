import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import GiftCatalogScreen from '@/components/gifts/GiftCatalogScreen';

export const metadata: Metadata = {
  title: 'Popo Live — Virtual Gift Catalog (Module 7.2)',
  description:
    'Browse virtual gifts, categories, search, popular & new arrivals, animations, and coin prices on Popo Live.',
};

export const dynamic = 'force-dynamic';

export default function GiftCatalogPage() {
  return (
    <div className="min-h-screen w-full bg-[#080312]">
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-[#080312] text-purple-200 text-sm">
            Loading Popo Live Gift Catalog...
          </div>
        }
      >
        <GiftCatalogScreen />
      </Suspense>
    </div>
  );
}
