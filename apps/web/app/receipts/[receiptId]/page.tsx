import React from 'react';
import { ReceiptDetailView } from '@/components/finance/ReceiptDetailView';

export const dynamic = 'force-dynamic';

export default async function ReceiptDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ receiptId: string }> | { receiptId: string };
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
}) {
  const resolvedParams = await Promise.resolve(params);
  const sp = await Promise.resolve(searchParams || {});
  const preview = sp?.preview === 'demo';
  const isUrdu = sp?.lang === 'ur';

  return (
    <div
      className="min-h-screen bg-[#0c041c] text-white py-8 px-4 print:bg-white print:p-0"
      style={{
        backgroundImage:
          'radial-gradient(circle at 20% 0%, rgba(255,45,120,0.16), transparent 45%), radial-gradient(circle at 80% 15%, rgba(139,92,246,0.20), transparent 45%)',
      }}
    >
      <ReceiptDetailView
        receiptOrTxId={resolvedParams.receiptId}
        isPreviewDemo={preview}
        isUrdu={isUrdu}
      />
    </div>
  );
}
