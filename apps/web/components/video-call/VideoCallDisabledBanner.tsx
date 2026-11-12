'use client';

import React, { useState } from 'react';
import { ONE_TO_ONE_VIDEO_CALL_FEATURE } from './types';
import { Info, Lock, ShieldCheck, VideoOff } from 'lucide-react';

export const VideoCallDisabledBanner: React.FC = () => {
  const [lockedNotice, setLockedNotice] = useState(false);

  return (
    <div data-testid="video-call-disabled-banner" className="space-y-4">
      {/* Main Disabled Status Card matching 08_09_one_to_one_video_call_off.png */}
      <div className="rounded-3xl bg-[#16092D]/95 border border-purple-400/25 p-6 text-center space-y-3 shadow-xl">
        <div className="w-14 h-14 rounded-2xl mx-auto bg-[#FF1A6C]/15 border border-[#FF1A6C]/45 flex items-center justify-center shadow-glow-pink">
          <VideoOff className="w-7 h-7 text-[#FF4D8D]" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF1A6C]/15 border border-[#FF1A6C]/40 text-[11px] font-black text-[#FF6BA3] uppercase tracking-wider">
          <Lock className="w-3 h-3" />
          <span>Currently Disabled · OFF</span>
        </div>

        <h2 className="text-xl font-black text-white">
          Video calls are turned off
        </h2>

        <p className="text-xs sm:text-sm text-purple-200/75 max-w-md mx-auto leading-relaxed">
          This feature is not available yet. 1-to-1 video calling remains inactive by default until client approval is provided.
        </p>
      </div>

      {/* Locked Toggle Status Row matching 08_09_one_to_one_video_call_off.png */}
      <div className="rounded-3xl bg-[#16092D]/95 border border-purple-400/20 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-white">1-to-1 video calls</span>
              <span
                data-testid="video-call-status-badge-off"
                className="px-2 py-0.5 rounded-full bg-[#FF1A6C]/20 border border-[#FF1A6C]/45 text-[10px] font-black text-[#FF6BA3] uppercase"
              >
                {ONE_TO_ONE_VIDEO_CALL_FEATURE.defaultState}
              </span>
            </div>
            <p className="text-xs text-purple-200/65 mt-0.5">
              Enable only after client approval.
            </p>
          </div>

          {/* Strictly locked OFF control — clicking explains it cannot be turned ON */}
          <button
            type="button"
            role="switch"
            aria-checked="false"
            aria-disabled="true"
            data-testid="video-call-locked-off-switch"
            onClick={() => setLockedNotice(true)}
            className="w-12 h-7 rounded-full bg-[#241344] border border-purple-300/25 p-1 flex items-center justify-start cursor-not-allowed shrink-0 transition-colors hover:border-[#FF1A6C]/45"
            title="Locked OFF until client approval"
          >
            <span className="w-5 h-5 rounded-full bg-purple-200/55 shadow" />
          </button>
        </div>

        {lockedNotice && (
          <div
            data-testid="video-call-locked-notice"
            className="rounded-2xl bg-[#FF1A6C]/10 border border-[#FF1A6C]/35 px-3.5 py-2.5 text-[11px] font-semibold text-pink-200"
          >
            1-to-1 Video Calls are locked OFF in this build and cannot be activated without formal client approval.
          </div>
        )}
      </div>

      {/* Client Approval Required Card matching 08_09_one_to_one_video_call_off.png */}
      <div className="rounded-3xl bg-[#16092D]/95 border border-amber-400/30 p-4 sm:p-5 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-400/15 border border-amber-300/35 flex items-center justify-center shrink-0">
          <Info className="w-4 h-4 text-amber-300" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-black text-amber-300">Client approval required</h3>
          <p className="text-xs text-purple-100/80 leading-relaxed">
            Keep this feature disabled for the first release unless the client signs off. No live calling engine or media permissions are enabled.
          </p>
        </div>
      </div>

      {/* Feature Status Info Table */}
      <div
        data-testid="video-call-info-card"
        className="rounded-3xl bg-[#130628]/95 border border-purple-400/20 p-4 sm:p-5 space-y-3 text-xs"
      >
        <div className="flex items-center gap-2 text-white font-extrabold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Feature Readiness Summary</span>
        </div>

        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
            <span className="text-purple-200/60">Feature Status</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#FF1A6C]/20 border border-[#FF1A6C]/40 text-[#FF6BA3] font-black">
              {ONE_TO_ONE_VIDEO_CALL_FEATURE.featureStatusLabel} (OFF)
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
            <span className="text-purple-200/60">Release Stage</span>
            <span className="font-semibold text-white text-right">
              {ONE_TO_ONE_VIDEO_CALL_FEATURE.releaseStageLabel}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
            <span className="text-purple-200/60">Approval Requirement</span>
            <span className="font-semibold text-amber-200 text-right">
              {ONE_TO_ONE_VIDEO_CALL_FEATURE.approvalRequirementLabel}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-purple-200/60">Camera &amp; Microphone</span>
            <span className="font-semibold text-emerald-300 text-right">
              {ONE_TO_ONE_VIDEO_CALL_FEATURE.permissionsStatusLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
