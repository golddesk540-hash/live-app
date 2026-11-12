import React from 'react';
import type { Metadata } from 'next';
import { NotificationsScreen } from '@/components/notifications/NotificationsScreen';

export const metadata: Metadata = {
  title: 'Notifications — Popo Live',
  description:
    'Activity from people you follow on Popo Live — post likes, comments, followers, mentions, Fan Club updates, invites, and live streams.',
};

export default function NotificationsPage() {
  return <NotificationsScreen />;
}
