import React from 'react';
import type { Metadata } from 'next';
import { SystemNoticesScreen } from '@/components/notices/SystemNoticesScreen';

export const metadata: Metadata = {
  title: 'System Notices — Popo Live',
  description: 'Official Popo Live platform notices, security alerts, feature announcements, and wallet updates.',
};

export default function SystemNoticesPage() {
  return <SystemNoticesScreen />;
}
