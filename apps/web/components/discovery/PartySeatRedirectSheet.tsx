'use client';

import React from 'react';
import { X, Smartphone, Mic, QrCode, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export interface PartySeatRedirectSheetProps {
  isOpen: boolean;
  seatIndex: number;
  roomTitle?: string;
  onClose: () => void;
  isUr?: boolean;
}

export const PartySeatRedirectSheet: React.FC<PartySeatRedirectSheetProps> = ({
  isOpen,
  seatIndex,
  roomTitle = '9-Seat Party Lounge',
  onClose,
  isUr = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="party-seat-redirect-sheet"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-md bg-[#0f1124] border border-purple-500/30 rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 text-white space-y-5 overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
        dir={isUr ? 'rtl' : 'ltr'}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Capsule */}
        <div className="flex items-center gap-3 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF1A6C] to-purple-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20 shrink-0">
            <Mic className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300">
              Seat #{seatIndex}
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight mt-1">
              {isUr ? 'وائس سیٹ پوپو لائیو موبائل پر دستیاب ہے' : 'Voice Seats on Popo Live Mobile'}
            </h2>
          </div>
        </div>

        {/* Explanatory Banner */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
          <p className="text-zinc-300 leading-relaxed">
            {isUr
              ? `سیٹ #${seatIndex} پر مائیکروفون اسٹریمنگ اور بات چیت کی خصوصیات صرف پوپو لائیو موبائل ایپ پر میسر ہیں۔`
              : `Interactive microphone audio streaming and speaking on Seat #${seatIndex} are hosted exclusively on the Popo Live mobile app.`}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-pink-300 font-semibold pt-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              {isUr
                ? 'ویب پر آپ پارٹی روم سن سکتے ہیں اور چیٹ کر سکتے ہیں۔'
                : 'You can listen to the lounge audio & chat right here on Web.'}
            </span>
          </div>
        </div>

        {/* QR Code & Mobile Prompt */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-pink-950/30 to-black border border-purple-500/30 flex items-center gap-4">
          {/* Simulated QR Code */}
          <div className="w-20 h-20 rounded-xl bg-white p-1.5 shrink-0 flex flex-col justify-between shadow-md">
            <div className="w-full h-full bg-gray-900 rounded-md p-1 flex flex-col justify-between">
              <div className="flex justify-between">
                <div className="w-4 h-4 border border-white rounded-xs bg-pink-500" />
                <div className="w-4 h-4 border border-white rounded-xs bg-white" />
              </div>
              <div className="text-[8px] font-black text-center text-white">POPO</div>
              <div className="flex justify-between">
                <div className="w-4 h-4 border border-white rounded-xs bg-white" />
                <div className="w-4 h-4 border border-white rounded-xs bg-pink-500" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Smartphone className="w-3.5 h-3.5 text-pink-400" />
              <span>{isUr ? 'کیمرہ سے اسکین کریں' : 'Scan to Open in App'}</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-tight">
              {isUr
                ? 'اپنے فون سے اسکین کریں اور فوری طور پر سیٹ پر گفتگو شروع کریں۔'
                : 'Scan with your smartphone camera to claim your speaking seat.'}
            </p>
          </div>
        </div>

        {/* Note on Seat Occupation */}
        <p className="text-[10px] text-zinc-500 text-center">
          Note: This seat remains available in this lounge and is not occupied until you connect on mobile.
        </p>

        {/* Bottom Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-zinc-300 text-xs font-bold transition"
          >
            {isUr ? 'لاؤنج سنتے رہیں' : 'Listen in Lounge'}
          </button>

          <a
            href="/download"
            onClick={(e) => {
              e.preventDefault();
              onClose();
              window.open('/download', '_blank');
            }}
            className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-[#FF1A6C] to-[#E0125C] text-white text-xs font-black shadow-lg shadow-pink-500/30 hover:brightness-110 active:scale-95 transition text-center flex items-center justify-center gap-1"
          >
            <span>{isUr ? 'ایپ کھولیں' : 'Get Mobile App'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default PartySeatRedirectSheet;
