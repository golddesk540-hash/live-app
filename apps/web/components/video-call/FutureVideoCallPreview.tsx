'use client';

import React, { useState } from 'react';
import {
  Clock,
  MicOff,
  PhoneOff,
  RefreshCw,
  ShieldOff,
  User,
  VideoOff,
  VolumeX,
} from 'lucide-react';

export const FutureVideoCallPreview: React.FC = () => {
  const [previewNotice, setPreviewNotice] = useState<string | null>(null);

  const handlePreviewTap = (controlLabel: string) => {
    setPreviewNotice(
      `${controlLabel} is a static layout preview only — 1-to-1 Video Calls are turned OFF by default.`
    );
  };

  return (
    <div
      data-testid="future-video-call-preview"
      className="rounded-3xl bg-[#16092D]/95 border border-purple-400/25 p-4 sm:p-5 space-y-4 shadow-xl"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-base sm:text-lg font-black text-white">
            Future Call Layout Preview
          </h2>
          <p className="text-[11px] text-purple-200/65">
            Static UI preview only — no real camera, audio, or WebRTC connection runs.
          </p>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-300/35 text-[10px] font-black text-amber-200 uppercase">
          Preview Only · OFF
        </span>
      </div>

      {/* Static Mock Video Call Stage */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#1E0C42] via-[#12062B] to-[#0A0218] border border-purple-400/30 min-h-[380px] flex flex-col justify-between p-4">
        {/* Top Connection & Duration Placeholders */}
        <div className="flex items-center justify-between gap-2 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/45 border border-white/10 text-[11px] font-bold text-purple-100/80">
            <ShieldOff className="w-3.5 h-3.5 text-[#FF4D8D]" />
            <span>Connection: Disconnected (OFF)</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/45 border border-white/10 text-[11px] font-mono font-bold text-purple-200/75">
            <Clock className="w-3 h-3 text-amber-300" />
            <span>00:00 (Placeholder)</span>
          </div>
        </div>

        {/* Center Remote Caller Placeholder */}
        <div className="my-auto py-8 flex flex-col items-center text-center gap-3 z-10">
          <div className="w-20 h-20 rounded-full bg-[#2B1554] border-2 border-purple-300/25 flex items-center justify-center shadow-lg">
            <User className="w-9 h-9 text-purple-200/70" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-black text-white">Sample Caller Profile</p>
            <p className="text-xs text-purple-200/65">
              Remote Video Stream Placeholder
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#FF1A6C]/20 border border-[#FF1A6C]/45 text-[11px] font-extrabold text-[#FF6BA3]">
            Inactive — Client Approval Required
          </span>
        </div>

        {/* Small Local Camera Preview Placeholder Corner */}
        <div
          data-testid="local-camera-placeholder"
          className="mt-2 mb-3 self-end sm:mt-0 sm:mb-0 sm:self-auto sm:absolute sm:right-4 sm:bottom-20 w-24 h-28 sm:h-32 rounded-2xl bg-[#190B36]/95 border border-purple-300/25 flex flex-col items-center justify-center p-2 text-center shadow-lg z-10"
        >
          <VideoOff className="w-5 h-5 text-purple-200/55 mb-1.5" />
          <span className="text-[10px] font-bold text-purple-200/75 leading-tight">
            Local Camera Preview
          </span>
          <span className="text-[9px] text-purple-300/50 mt-0.5">Off</span>
        </div>

        {/* Bottom Non-Functional Control Bar Preview */}
        <div
          data-testid="future-call-controls-preview"
          className="z-10 flex items-center justify-center gap-3 pt-3 border-t border-white/10"
        >
          <button
            type="button"
            aria-disabled="true"
            onClick={() => handlePreviewTap('Mute Mic')}
            title="Preview control only (OFF)"
            className="w-11 h-11 rounded-full bg-[#241245]/90 border border-white/10 flex items-center justify-center text-purple-200/65 hover:text-white cursor-not-allowed"
          >
            <MicOff className="w-4 h-4" />
          </button>

          <button
            type="button"
            aria-disabled="true"
            onClick={() => handlePreviewTap('Toggle Camera')}
            title="Preview control only (OFF)"
            className="w-11 h-11 rounded-full bg-[#241245]/90 border border-white/10 flex items-center justify-center text-purple-200/65 hover:text-white cursor-not-allowed"
          >
            <VideoOff className="w-4 h-4" />
          </button>

          <button
            type="button"
            aria-disabled="true"
            onClick={() => handlePreviewTap('Switch Camera')}
            title="Preview control only (OFF)"
            className="w-11 h-11 rounded-full bg-[#241245]/90 border border-white/10 flex items-center justify-center text-purple-200/65 hover:text-white cursor-not-allowed"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            aria-disabled="true"
            onClick={() => handlePreviewTap('Speaker Toggle')}
            title="Preview control only (OFF)"
            className="w-11 h-11 rounded-full bg-[#241245]/90 border border-white/10 flex items-center justify-center text-purple-200/65 hover:text-white cursor-not-allowed"
          >
            <VolumeX className="w-4 h-4" />
          </button>

          <button
            type="button"
            aria-disabled="true"
            onClick={() => handlePreviewTap('End Call')}
            title="Preview control only (OFF)"
            className="w-11 h-11 rounded-full bg-rose-500/35 border border-rose-400/40 flex items-center justify-center text-rose-200 cursor-not-allowed"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>

      {previewNotice && (
        <div
          data-testid="future-call-preview-notice"
          className="rounded-2xl bg-[#110523] border border-purple-400/25 px-3.5 py-2.5 text-xs text-purple-100/85"
        >
          {previewNotice}
        </div>
      )}
    </div>
  );
};
