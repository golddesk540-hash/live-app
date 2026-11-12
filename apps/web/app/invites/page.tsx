import type { Metadata } from 'next';
import { InvitesScreen } from '@/components/invites/InvitesScreen';

export const metadata: Metadata = {
  title: 'Invite Friends | Popo Live',
  description:
    'Share your Popo Live invite link, customize your invitation message, and manage demo invitation activity.',
};

export default function InvitesPage() {
  return <InvitesScreen />;
}
