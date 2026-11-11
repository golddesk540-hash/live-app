import React from 'react';
import StoreScreen from '@/components/store/StoreScreen';

export const dynamic = 'force-dynamic';

export default function StorePage({
  searchParams,
}: {
  searchParams?: { preview?: string; lang?: string; tab?: string };
}) {
  const previewDemo = searchParams?.preview === 'demo';
  const initialLanguage = searchParams?.lang === 'ur' ? 'ur' : 'en';
  const initialTab = searchParams?.tab === 'inventory' ? 'inventory' : 'store';

  return (
    <StoreScreen
      previewDemo={previewDemo}
      initialLanguage={initialLanguage}
      initialTab={initialTab}
    />
  );
}
