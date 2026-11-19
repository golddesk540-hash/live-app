'use client';

import React from 'react';
import { X, Smartphone, Monitor, Download, QrCode, CheckCircle, Apple, Play } from 'lucide-react';

export interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  isUr?: boolean;
}

export const AppDownloadModal: React.FC<AppDownloadModalProps> = ({
  isOpen,
  onClose,
  isUr = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl border border-gray-200 shadow-2xl p-6 sm:p-8 text-gray-900 space-y-6 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        dir={isUr ? 'rtl' : 'ltr'}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF1A6C] via-purple-600 to-[#00E5FF] p-[2px] shadow-sm shrink-0">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center font-black text-xl text-transparent bg-clip-text bg-gradient-to-tr from-[#FF1A6C] to-amber-500">
              P
            </div>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <span>{isUr ? 'پوپو لائیو ایپ ڈاؤن لوڈ کریں' : 'Get Popo Live App'}</span>
              <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-full bg-pink-100 text-[#FF1A6C]">
                Official
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isUr
                ? 'موبائل اور ڈیسک ٹاپ پر اعلیٰ کوالٹی لائیو اسٹریمنگ اور 9 سیٹ پارٹی رومز کا لطف اٹھائیں'
                : 'Experience crystal-clear live streams, 9-seat voice lounges, and PK battles on mobile & desktop.'}
            </p>
          </div>
        </div>

        {/* QR Code & Mobile Download Section */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-pink-50/50 via-gray-50 to-purple-50/30 border border-pink-100/80 flex flex-col sm:flex-row items-center gap-5">
          {/* Simulated QR Code */}
          <div className="w-28 h-28 rounded-2xl bg-white p-2 border border-gray-200/80 shadow-sm shrink-0 flex flex-col items-center justify-center">
            <div className="w-full h-full bg-gray-900 rounded-lg p-1.5 flex flex-col justify-between">
              <div className="flex justify-between">
                <div className="w-6 h-6 border-2 border-white rounded-sm flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-white rounded-xs" />
                </div>
                <div className="w-6 h-6 border-2 border-white rounded-sm flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-white rounded-xs" />
                </div>
              </div>
              <div className="flex items-center justify-center text-white text-[9px] font-black">
                POPO
              </div>
              <div className="flex justify-between items-end">
                <div className="w-6 h-6 border-2 border-white rounded-sm flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-white rounded-xs" />
                </div>
                <div className="grid grid-cols-2 gap-0.5">
                  <div className="w-2 h-2 bg-pink-400 rounded-xs" />
                  <div className="w-2 h-2 bg-white rounded-xs" />
                  <div className="w-2 h-2 bg-white rounded-xs" />
                  <div className="w-2 h-2 bg-pink-400 rounded-xs" />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Description & Download Links */}
          <div className="space-y-3 text-center sm:text-left flex-1">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-[#FF1A6C] uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
                <QrCode className="w-3.5 h-3.5" />
                {isUr ? 'موبائل سے اسکین کریں' : 'Scan with Camera'}
              </span>
              <p className="text-xs text-gray-600 font-medium">
                {isUr
                  ? 'اپنے فون کے کیمرے سے اسکین کریں اور فوری انسٹال کریں۔'
                  : 'Point your smartphone camera at the code to download the official mobile app.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <a
                href="/download"
                className="px-3.5 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Google Play</span>
              </a>
              <a
                href="/download"
                className="px-3.5 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Apple className="w-3.5 h-3.5 fill-current" />
                <span>App Store</span>
              </a>
            </div>
          </div>
        </div>

        {/* Desktop Application Section */}
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-700 shadow-xs shrink-0">
              <Monitor className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900">
                {isUr ? 'پوپو لائیو برائے ڈیسک ٹاپ (PC & Mac)' : 'Popo Live for Desktop (PC & Mac)'}
              </h4>
              <p className="text-[11px] text-gray-500">
                {isUr ? 'براڈکاسٹنگ اور بڑی اسکرین کے لیے' : 'Optimized for high-FPS broadcasts and creator tools'}
              </p>
            </div>
          </div>

          <a
            href="/download"
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-xs font-bold text-gray-800 flex items-center gap-1 transition-colors shrink-0 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-gray-600" />
            <span>Download</span>
          </a>
        </div>

        {/* Modal Footer */}
        <div className="pt-2 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100">
          <span className="flex items-center gap-1 text-[11px]">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            {isUr ? '100% محفوظ اور تصدیق شدہ' : '100% Safe & Verified Official Release'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-gray-700 hover:text-[#FF1A6C] transition-colors"
          >
            {isUr ? 'ویب پر جاری رکھیں' : 'Continue on Web'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppDownloadModal;
