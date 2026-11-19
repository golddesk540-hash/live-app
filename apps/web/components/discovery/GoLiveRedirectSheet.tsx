'use client';

import React from 'react';
import { X, Smartphone, Radio, QrCode, CheckCircle, ArrowRight, Video, Sparkles } from 'lucide-react';

export interface GoLiveRedirectSheetProps {
  isOpen: boolean;
  onClose: () => void;
  isUr?: boolean;
}

export const GoLiveRedirectSheet: React.FC<GoLiveRedirectSheetProps> = ({
  isOpen,
  onClose,
  isUr = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="go-live-redirect-sheet"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-md bg-[#0f1124] border border-pink-500/30 rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 text-white space-y-5 overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF1A6C] via-[#FF4D8D] to-[#F59E0B] flex items-center justify-center text-white shadow-lg shadow-pink-500/30 shrink-0">
            <Radio className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-500/40 text-[#FF1A6C] text-[10px] font-black uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF1A6C] animate-ping" />
              <span>Broadcasting</span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight mt-1">
              {isUr ? 'براڈکاسٹنگ پوپو لائیو موبائل پر دستیاب ہے' : 'Go Live on Popo Live Mobile'}
            </h2>
          </div>
        </div>

        {/* Explanatory Banner */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
          <p className="text-zinc-300 leading-relaxed">
            {isUr
              ? 'کیمرہ براڈکاسٹنگ، بیوٹی فلٹرز، اسٹوڈیو اینیمیشنز اور پی کے بیٹلز مکمل طور پر پوپو لائیو موبائل ایپ پر میسر ہیں۔'
              : 'Live camera streaming, face beautification filters, virtual studio effects, and PK battles are hosted exclusively on the Popo Live mobile app.'}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-amber-300 font-semibold pt-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              {isUr
                ? 'ڈیسک ٹاپ ویب پر لائیو ویونگ، چیٹ اور گفٹس کا بھرپور لطف اٹھائیں۔'
                : 'Desktop web provides full live viewing, interactive chat, and gifting.'}
            </span>
          </div>
        </div>

        {/* QR Code & Mobile Prompt */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-black border border-pink-500/30 flex items-center gap-4">
          {/* Simulated QR Code */}
          <div className="w-20 h-20 rounded-xl bg-white p-1.5 shrink-0 flex flex-col justify-between shadow-md">
            <div className="w-full h-full bg-gray-900 rounded-md p-1 flex flex-col justify-between">
              <div className="flex justify-between">
                <div className="w-4 h-4 border border-white rounded-xs bg-[#FF1A6C]" />
                <div className="w-4 h-4 border border-white rounded-xs bg-white" />
              </div>
              <div className="text-[8px] font-black text-center text-white">LIVE</div>
              <div className="flex justify-between">
                <div className="w-4 h-4 border border-white rounded-xs bg-white" />
                <div className="w-4 h-4 border border-white rounded-xs bg-[#FF1A6C]" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Smartphone className="w-3.5 h-3.5 text-pink-400" />
              <span>{isUr ? 'اسکین کریں اور لائیو جائیں' : 'Scan to Broadcast'}</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-tight">
              {isUr
                ? 'اپنے فون کے کیمرہ سے کیو آر کوڈ اسکین کریں اور فوری لائیو اسٹریمنگ شروع کریں۔'
                : 'Scan with your mobile camera to launch the broadcaster studio on iOS or Android.'}
            </p>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-zinc-300 text-xs font-bold transition"
          >
            {isUr ? 'ویب براؤز جاری رکھیں' : 'Continue on Web'}
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
            <span>{isUr ? 'ایپ حاصل کریں' : 'Get Mobile App'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default GoLiveRedirectSheet;
