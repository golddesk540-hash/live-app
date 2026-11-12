import type { Metadata } from 'next';
import { WithdrawalsScreen } from '@/components/withdrawals/WithdrawalsScreen';

export const metadata: Metadata = {
  title: 'Withdrawals | Popo Live',
  description:
    'Withdrawals frontend module displaying demo available balance, withdrawal request form with validation, placeholder payment methods, review, confirmation, and withdrawal history.',
};

export default function WithdrawalsPage() {
  return <WithdrawalsScreen />;
}
