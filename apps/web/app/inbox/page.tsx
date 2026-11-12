import React from 'react';
import type { Metadata } from 'next';
import { InboxScreen } from '@/components/inbox/InboxScreen';

export const metadata: Metadata = {
  title: 'Inbox — Popo Live',
  description: 'Popo Live Inbox: direct chats, contacts, and message requests.',
};

export default function InboxPage() {
  return <InboxScreen />;
}
