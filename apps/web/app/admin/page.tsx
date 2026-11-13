import React from 'react';
import { Metadata } from 'next';
import { AdminHomeScreen } from '@/components/admin/AdminHomeScreen';

export const metadata: Metadata = {
  title: 'Admin Home & Roles | Popo Live',
  description:
    'Popo Live Administrative Operations Suite — Platform statistics, user oversight, role management, and granular permission matrices.',
};

export default function AdminPage() {
  return <AdminHomeScreen />;
}
