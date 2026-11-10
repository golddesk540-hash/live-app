import React from 'react';
import { Metadata } from 'next';
import PKDiscoveryTabScreen from '@/components/pk/PKDiscoveryTabScreen';

export const metadata: Metadata = {
  title: 'PK Discovery | Popo Live',
  description: 'Official PK Discovery Tab for Popo Live - Watch ongoing PK battles and discover eligible hosts.',
};

export default function PKMainPage() {
  return <PKDiscoveryTabScreen />;
}
