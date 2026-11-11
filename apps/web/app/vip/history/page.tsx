import React from 'react';
import type { Metadata } from 'next';
import { VipHistoryScreen } from '@/components/vip/VipHistoryScreen';

export const metadata: Metadata = {
  title: 'VIP Membership History — Popo Live',
  description: 'Review Popo Live VIP membership purchases, renewals, expiries, and downloadable receipts.',
};

export default function VipHistoryPage({
  searchParams,
}: {
  searchParams?: { preview?: string };
}) {
  return <VipHistoryScreen previewMode={searchParams?.preview === 'demo'} />;
}
