import React from 'react';
import type { Metadata } from 'next';
import AdminGiftCatalogPanel from '@/components/gifts/AdminGiftCatalogPanel';

export const metadata: Metadata = {
  title: 'Popo Live — Gift Catalog Admin',
  description:
    'Authorized admin management console for Popo Live virtual gifts, categories, animations, and pricing.',
};

export const dynamic = 'force-dynamic';

export default function AdminGiftCatalogPage() {
  return <AdminGiftCatalogPanel />;
}
