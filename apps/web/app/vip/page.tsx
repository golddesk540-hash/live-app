import React from 'react';
import type { Metadata } from 'next';
import { VipMembershipScreen } from '@/components/vip/VipMembershipScreen';

export const metadata: Metadata = {
  title: 'VIP Membership — Popo Live',
  description: 'Upgrade to Popo Live VIP Membership for badges, profile frames, room entrances, and exclusive identity perks.',
};

export default function VipMembershipPage({
  searchParams,
}: {
  searchParams?: { preview?: string };
}) {
  const previewMode = searchParams?.preview === 'demo';
  return <VipMembershipScreen previewMode={previewMode} />;
}
