import type { Metadata } from 'next';
import { CoinSellerScreen } from '@/components/coin-seller/CoinSellerScreen';

export const metadata: Metadata = {
  title: 'Coin Seller | Popo Live',
  description:
    'Coin Seller frontend module displaying demo seller status, sample coin sales summaries, orders management, sales records, and sales history.',
};

export default function CoinSellerPage() {
  return <CoinSellerScreen />;
}
