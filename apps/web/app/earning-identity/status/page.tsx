import type { Metadata } from 'next';
import { EarningIdentityScreen } from '@/components/earning-identity/EarningIdentityScreen';

export const metadata: Metadata = {
  title: 'Verification Status | Earning Identity · Popo Live',
  description:
    'View frontend display status, progress steps, and masked host identity summary on Popo Live.',
};

export default function EarningIdentityStatusPage() {
  return <EarningIdentityScreen initialView="status" />;
}
