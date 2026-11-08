import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Poppo Live Official Coin Recharge | Instant Top Up',
  description:
    'Official Poppo Live Coin Recharge portal. Enter your User ID and purchase coins instantly with 0% extra fees across JazzCash, EasyPaisa, GCash, UPI, and bank cards.',
};

export default function RechargeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
