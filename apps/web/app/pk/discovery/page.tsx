import React from 'react';
import { Metadata } from 'next';
import PKDiscoveryTabScreen from '@/components/pk/PKDiscoveryTabScreen';

export const metadata: Metadata = {
  title: 'PK Discovery Tab | Live Battles & Available Hosts | Popo Live',
  description: 'Explore live PK battles, watch high-stakes competitions, and find available hosts for PK matchmaking.',
};

export default function PKDiscoveryPage() {
  return <PKDiscoveryTabScreen />;
}
