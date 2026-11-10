import React from 'react';
import { Metadata } from 'next';
import PKActivitySlotScreen from '@/components/pk/PKActivitySlotScreen';

export const metadata: Metadata = {
  title: 'PK Activity Details | Popo Live',
  description: 'View PK activity details, participating streamers, and linked battles.',
};

export default function PKActivityDetailPage({
  params,
}: {
  params: { activityId: string };
}) {
  return <PKActivitySlotScreen activityId={params.activityId} />;
}
