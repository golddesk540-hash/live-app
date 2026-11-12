import type { Metadata } from 'next';
import { SquareDiscoveryScreen } from '@/components/square/SquareDiscoveryScreen';

export const metadata: Metadata = {
  title: 'Square Discovery | Popo Live Web',
  description:
    'Discover featured community posts, trending creators, and popular hashtags across Popo Live Square.',
};

export default function SquareDiscoveryPage() {
  return <SquareDiscoveryScreen />;
}
