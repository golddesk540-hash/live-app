import React from 'react';
import { Metadata } from 'next';
import PKActivitySlotScreen from '@/components/pk/PKActivitySlotScreen';

export const metadata: Metadata = {
  title: 'PK Activity Slot | Daily Challenge & Rewards | Popo Live',
  description: 'Official Popo Live PK Activity Slot - Participate in daily PK challenges and earn rewards.',
};

export default function PKActivitySlotPage() {
  return <PKActivitySlotScreen />;
}
