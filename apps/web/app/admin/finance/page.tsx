import React from 'react';
import { Metadata } from 'next';
import AdminFinancePanel from '@/components/wallet/AdminFinancePanel';

export const metadata: Metadata = {
  title: 'Admin Finance Controls | Popo Live',
  description:
    'Authorized Finance Admin dashboard for wallet balances, transaction audit trails, manual adjustments, and reversals.',
};

export default function AdminFinancePage() {
  return <AdminFinancePanel />;
}
