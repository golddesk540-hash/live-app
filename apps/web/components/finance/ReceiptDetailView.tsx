'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Printer,
  Share2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Coins,
  Star,
  ShieldCheck,
  Copy,
  Check,
} from 'lucide-react';
import type { FinancialReceiptRecord } from '@/lib/receipts';

interface ReceiptDetailViewProps {
  receiptOrTxId?: string;
  initialReceipt?: FinancialReceiptRecord | null;
  isPreviewDemo?: boolean;
  isUrdu?: boolean;
  onClose?: () => void;
}

export function ReceiptDetailView({
  receiptOrTxId,
  initialReceipt,
  isPreviewDemo = false,
  isUrdu = false,
  onClose,
}: ReceiptDetailViewProps) {
  const [receipt, setReceipt] = useState<FinancialReceiptRecord | null>(initialReceipt || null);
  const [loading, setLoading] = useState<boolean>(!initialReceipt);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  const loadReceipt = useCallback(async () => {
    if (!receiptOrTxId) return;
    setLoading(true);
    setError(null);
    try {
      const qs = isPreviewDemo ? '?preview=demo' : '';
      const res = await fetch(`/api/finance/receipts/${encodeURIComponent(receiptOrTxId)}${qs}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Receipt not found or unavailable.');
        setReceipt(null);
      } else {
        setReceipt(data.receipt);
      }
    } catch {
      setError('Failed to load receipt record.');
    } finally {
      setLoading(false);
    }
  }, [receiptOrTxId, isPreviewDemo]);

  useEffect(() => {
    if (!initialReceipt && receiptOrTxId) {
      loadReceipt();
    }
  }, [initialReceipt, receiptOrTxId, loadReceipt]);

  const targetId = receipt?.receiptId || receiptOrTxId || '';
  const pdfHref = `/api/finance/receipts/${encodeURIComponent(targetId)}/pdf${isPreviewDemo ? '?preview=demo' : ''}`;

  const handleShare = async () => {
    if (!receipt) return;
    const summaryText = `Popo Live Receipt ${receipt.receiptNumber} (${receipt.title}) — Status: ${receipt.status.toUpperCase()} — Tx: ${receipt.transactionId}`;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: `Popo Live Receipt ${receipt.receiptNumber}`,
          text: summaryText,
          url: window.location.href,
        });
        setShareMsg(isUrdu ? 'رسید شیئر کر دی گئی' : 'Receipt shared');
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(`${summaryText}\n${window.location.href}`);
        setCopied(true);
        setShareMsg(isUrdu ? 'رسید لنک کاپی ہو گیا' : 'Receipt details copied to clipboard');
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // User dismissed share sheet
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-white/60">
        {isUrdu ? 'رسید لوڈ ہو رہی ہے...' : 'Loading official Popo Live receipt...'}
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="rounded-3xl bg-[#160b2e] border border-rose-500/30 p-6 text-center max-w-lg mx-auto">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h3 className="text-base font-extrabold text-white mb-1">
          {isUrdu ? 'رسید دستیاب نہیں' : 'Receipt Not Available'}
        </h3>
        <p className="text-xs text-white/65 mb-4">{error}</p>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white"
          >
            {isUrdu ? 'بند کریں' : 'Close'}
          </button>
        ) : (
          <Link
            href={isPreviewDemo ? '/finance?preview=demo' : '/finance'}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ff2d78] text-xs font-bold text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isUrdu ? 'ہسٹری پر واپس جائیں' : 'Back to Finance History'}</span>
          </Link>
        )}
      </div>
    );
  }

  const statusBadge =
    receipt.status === 'successful'
      ? { label: isUrdu ? 'تصدیق شدہ' : 'VERIFIED', cls: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300', Icon: CheckCircle2 }
      : receipt.status === 'refunded'
      ? { label: isUrdu ? 'رقم واپس' : 'REFUNDED', cls: 'bg-amber-500/20 border-amber-400/40 text-amber-300', Icon: RotateCcw }
      : { label: isUrdu ? 'منسوخ' : 'REVERSED', cls: 'bg-rose-500/20 border-rose-400/40 text-rose-300', Icon: AlertTriangle };

  const StatusIcon = statusBadge.Icon;

  return (
    <div
      dir={isUrdu ? 'rtl' : 'ltr'}
      data-testid="receipt-detail-card"
      className="max-w-2xl mx-auto rounded-3xl bg-[#140a2a] border border-purple-500/35 shadow-2xl overflow-hidden print:bg-white print:text-black print:border-gray-300"
    >
      {/* Top Popo Live Brand Header */}
      <div className="bg-gradient-to-r from-[#1f0d42] via-[#2b1056] to-[#1a0b36] p-5 border-b border-[#ff2d78]/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {!onClose && (
            <Link
              href={isPreviewDemo ? '/finance?preview=demo' : '/finance'}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center print:hidden"
            >
              <ArrowLeft className={`w-4 h-4 text-white ${isUrdu ? 'rotate-180' : ''}`} />
            </Link>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white">POPO LIVE</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#ff2d78]/20 text-[#ff85b3] border border-[#ff2d78]/40">
                {isUrdu ? 'مستند رسید' : 'OFFICIAL RECEIPT'}
              </span>
            </div>
            <p className="text-xs text-amber-300 font-bold mt-0.5" data-testid="receipt-number-value">
              {receipt.receiptNumber}
            </p>
          </div>
        </div>

        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold ${statusBadge.cls}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          <span>{statusBadge.label}</span>
        </div>
      </div>

      {/* Separated Quantitative Highlight Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-[#0e0622]/90 border-b border-white/10">
        <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3">
          <div className="text-[10px] text-white/55 font-bold uppercase">
            {isUrdu ? 'ادائیگی کی رقم' : 'Cash Payment'}
          </div>
          <div className="text-sm font-black text-white mt-0.5">
            {receipt.paymentAmount > 0 && receipt.currency !== 'NONE'
              ? `${receipt.currency} ${receipt.paymentAmount.toFixed(2)}`
              : '— (Virtual)'}
          </div>
        </div>

        <div className="rounded-2xl bg-amber-500/10 border border-amber-400/25 p-3">
          <div className="text-[10px] text-amber-200/80 font-bold uppercase flex items-center gap-1">
            <Coins className="w-3 h-3 text-amber-400" />
            <span>{isUrdu ? 'سکے' : 'Coins'}</span>
          </div>
          <div className="text-sm font-black text-amber-300 mt-0.5">
            {receipt.coinQuantity.toLocaleString()}
            {receipt.bonusCoinQuantity > 0 ? ` +${receipt.bonusCoinQuantity.toLocaleString()} Bonus` : ''}
          </div>
        </div>

        <div className="rounded-2xl bg-pink-500/10 border border-pink-400/25 p-3">
          <div className="text-[10px] text-pink-200/80 font-bold uppercase flex items-center gap-1">
            <Star className="w-3 h-3 text-pink-400" />
            <span>{isUrdu ? 'ہوسٹ پوائنٹس' : 'Host Points'}</span>
          </div>
          <div className="text-sm font-black text-pink-300 mt-0.5">
            {receipt.pointsQuantity.toLocaleString()} Pts
          </div>
        </div>

        <div className="rounded-2xl bg-purple-500/10 border border-purple-400/25 p-3">
          <div className="text-[10px] text-purple-200/80 font-bold uppercase">
            {isUrdu ? 'پلیٹ فارم حصہ' : 'Platform Share'}
          </div>
          <div className="text-sm font-black text-purple-200 mt-0.5">
            {receipt.platformShareCoins.toLocaleString()} Coins
          </div>
        </div>
      </div>

      {/* Receipt Metadata Grid */}
      <div className="p-5 space-y-3 text-xs">
        {[
          [isUrdu ? 'عنوان' : 'Title', isUrdu ? receipt.titleUr : receipt.title],
          [isUrdu ? 'رسید آئی ڈی' : 'Receipt ID', receipt.receiptId],
          [isUrdu ? 'ٹرانزیکشن آئی ڈی' : 'Transaction ID', receipt.transactionId],
          [isUrdu ? 'ٹرانزیکشن کی قسم' : 'Transaction Type', receipt.txCategory.toUpperCase()],
          [
            isUrdu ? 'صارف' : 'Account Holder',
            receipt.userNickname
              ? `${receipt.userNickname}${receipt.userPoppoId ? ` (ID: ${receipt.userPoppoId})` : ''}`
              : receipt.userId,
          ],
          [isUrdu ? 'تفصیل' : 'Description', receipt.description],
          [isUrdu ? 'آئٹم / پیکج تفصیل' : 'Item / Plan Summary', receipt.itemDetailSummary],
          [isUrdu ? 'ادائیگی کا طریقہ' : 'Payment Method', receipt.paymentMethod || 'Popo Live Wallet'],
          [
            isUrdu ? 'پرووائیڈر حوالہ' : 'Provider Reference',
            receipt.providerReferenceMasked || 'Internal Popo Live Reference',
          ],
          [isUrdu ? 'تاریخ اور وقت' : 'Issued At (UTC)', new Date(receipt.issuedAt).toUTCString()],
        ].map(([label, value]) => (
          <div key={label} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-2.5 border-b border-white/10">
            <span className="text-white/55 font-semibold">{label}</span>
            <span className="text-white font-bold break-all sm:text-right">{value}</span>
          </div>
        ))}

        {receipt.nonCashPointsNote && (
          <div className="rounded-2xl bg-amber-500/10 border border-amber-400/30 p-3 text-[11px] text-amber-200 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span>{receipt.nonCashPointsNote}</span>
          </div>
        )}

        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3 text-[11px] text-white/55">
          {isUrdu
            ? 'سکے، پوائنٹس، پلیٹ فارم کا حصہ اور اصل ادائیگی کی رقم الگ الگ رکھی جاتی ہے۔'
            : 'Separation Policy: Cash payments, Coins, Bonus Coins, Non-Cash Host Points (70%), and Platform Share (30%) are never merged into one balance.'}
        </div>

        {shareMsg && (
          <div className="text-center text-[11px] font-bold text-emerald-300">{shareMsg}</div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="p-4 bg-[#0d0520] border-t border-white/10 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={pdfHref}
            download
            data-testid="download-receipt-pdf-btn"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#ff2d78] to-[#ec4899] text-white text-xs font-extrabold shadow-lg hover:brightness-110"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isUrdu ? 'پی ڈی ایف ڈاؤن لوڈ کریں' : 'Download PDF'}</span>
          </a>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isUrdu ? 'پرنٹ' : 'Print'}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{isUrdu ? 'شیئر کریں' : 'Share Receipt'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <Link
              href={`/receipts/${encodeURIComponent(receipt.receiptId)}${isPreviewDemo ? '?preview=demo' : ''}`}
              className="px-3 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-xs font-bold text-purple-200"
            >
              {isUrdu ? 'مکمل صفحہ' : 'Full Page'}
            </Link>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white"
            >
              {isUrdu ? 'بند کریں' : 'Close'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
