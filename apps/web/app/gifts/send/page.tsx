'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Gift } from 'lucide-react';
import GiftSendingPanel from '@/components/gifts/GiftSendingPanel';

function GiftSendPageInner() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId');
  const pkBattleId = searchParams.get('pkBattleId');
  const giftId = searchParams.get('giftId');
  const previewDemo = searchParams.get('preview') !== 'false';

  return (
    <div className="min-h-screen w-full bg-[#080312] py-2 sm:py-6 px-0 sm:px-4">
      <div className="max-w-[960px] mx-auto mb-2 px-3 sm:px-0 flex items-center justify-between text-xs text-purple-200/80">
        <Link
          href="/gifts"
          className="inline-flex items-center gap-1.5 hover:text-white transition font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Gift Catalog</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/gifts/send?roomId=880219&preview=demo"
            className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[11px] font-semibold"
          >
            Solo Live Stage
          </Link>
          <Link
            href="/gifts/send?pkBattleId=00000000-0000-0000-0000-000000000603&preview=demo"
            className="px-2.5 py-1 rounded-full bg-pink-500/20 border border-pink-400/40 hover:bg-pink-500/30 text-[11px] font-semibold text-pink-200 flex items-center gap-1"
          >
            <Gift className="w-3 h-3" />
            <span>PK Gift Stage</span>
          </Link>
        </div>
      </div>

      <GiftSendingPanel
        variant="stage"
        roomId={roomId}
        pkBattleId={pkBattleId}
        initialGiftId={giftId}
        previewDemo={previewDemo}
      />
    </div>
  );
}

export default function GiftSendPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-[#080312] flex items-center justify-center text-purple-200 text-sm">
          Loading Popo Live Gift Stage...
        </div>
      }
    >
      <GiftSendPageInner />
    </Suspense>
  );
}
