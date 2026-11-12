import React from 'react';
import { FinanceCenterScreen } from '@/components/finance/FinanceCenterScreen';

export const dynamic = 'force-dynamic';

export default async function FinancePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
}) {
  const sp = await Promise.resolve(searchParams || {});
  const preview = sp?.preview === 'demo';
  const lang = typeof sp?.lang === 'string' ? sp.lang : 'en';

  return <FinanceCenterScreen initialPreviewDemo={preview} initialLang={lang} />;
}
