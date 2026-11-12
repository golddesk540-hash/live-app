import type { Metadata } from 'next';
import { EarningIdentityScreen } from '@/components/earning-identity/EarningIdentityScreen';

export const metadata: Metadata = {
  title: 'Earning Identity | Popo Live',
  description:
    'Manage host earning identity information, temporary local document previews, and verification display states.',
};

export default function EarningIdentityPage() {
  return <EarningIdentityScreen initialView="dashboard" />;
}
