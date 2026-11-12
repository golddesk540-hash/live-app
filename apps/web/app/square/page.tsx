import React from 'react';
import type { Metadata } from 'next';
import { SquareFeedScreen } from '@/components/square/SquareFeedScreen';

export const metadata: Metadata = {
  title: 'Square — Popo Live Community Posts',
  description: 'Explore community photos, highlights, and live lounge posts on Popo Live Square.',
};

export default function SquarePage() {
  return <SquareFeedScreen />;
}
