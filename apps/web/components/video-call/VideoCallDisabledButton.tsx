'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ExternalLink, Lock, ShieldAlert, VideoOff } from 'lucide-react';

interface VideoCallDisabledButtonProps {
  variant?: 'icon' | 'pill' | 'button';
  testId?: string;
  targetName?: string;
  className?: string;
}

export const VideoCallDisabledButton: React.FC<VideoCallDisabledButtonProps> = ({
  variant = 'pill',
  testId = 'video-call-disabled-btn',
  targetName,
  className = '',
}) => {
  const [infoOpen, setInfoOpen] = useState(false);

  const tooltip =
    '1-to-1 Video Calls are currently OFF by default (requires client approval).';

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          data-testid={testId}
          aria-disabled="true"
          title={tooltip}
          onClick={() => setInfoOpen(true)}
          className={`relative inline-flex items-center gap-1 px-2.5 py-2 rounded-full bg-[#1C0E36]/80 border border-purple-400/20 text-purple-200/55 hover:text-purple-100/80 hover:border-purple-400/40 cursor-not-allowed transition-colors ${className}`}
        >
          <VideoOff className="w-4 h-4 shrink-0" />
          <span className="px-1.5 py-0.5 rounded-full bg-[#FF1A6C]/20 border border-[#FF1A6C]/45 text-[9px] font-black text-[#FF6BA3] uppercase tracking-wider leading-none">
            OFF
          </span>
        </button>
      ) : variant === 'button' ? (
        <button
          type="button"
          data-testid={testId}
          aria-disabled="true"
          title={tooltip}
          onClick={() => setInfoOpen(true)}
          className={`w-full py-2.5 px-4 rounded-full bg-[#190B33]/85 border border-purple-400/20 text-purple-200/65 hover:border-purple-400/40 text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed transition-colors ${className}`}
        >
          <VideoOff className="w-3.5 h-3.5 shrink-0" />
          <span>1-to-1 Video Call</span>
          <span className="px-2 py-0.5 rounded-full bg-[#FF1A6C]/20 border border-[#FF1A6C]/45 text-[9px] font-black text-[#FF6BA3] uppercase">
            OFF
          </span>
        </button>
      ) : (
        <button
          type="button"
          data-testid={testId}
          aria-disabled="true"
          title={tooltip}
          onClick={() => setInfoOpen(true)}
          className={`inline-flex items-center justify-center gap-1.5 px-3 py-3 rounded-2xl bg-[#160D2C] border border-white/10 text-white/55 hover:text-white/80 hover:border-purple-400/30 text-xs font-bold cursor-not-allowed transition-colors ${className}`}
        >
          <VideoOff className="w-4 h-4 shrink-0" />
          <span>Video Call</span>
          <span className="px-1.5 py-0.5 rounded-full bg-[#FF1A6C]/20 border border-[#FF1A6C]/45 text-[9px] font-black text-[#FF6BA3] uppercase">
            OFF
          </span>
        </button>
      )}

      {/* Informational Modal — strictly never initiates any call or permission request */}
      <Modal
        isOpen={infoOpen}
        onClose={() => setInfoOpen(false)}
        title="1-to-1 Video Calls Currently OFF"
        subtitle="Feature unavailable by default until client approval"
        maxWidth="sm"
      >
        <div data-testid="video-call-disabled-modal" className="space-y-4">
          <div className="rounded-2xl bg-[#1B0D35] border border-purple-400/25 p-4 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl mx-auto bg-[#FF1A6C]/15 border border-[#FF1A6C]/40 flex items-center justify-center">
              <VideoOff className="w-6 h-6 text-[#FF4D8D]" />
            </div>
            <h4 className="text-sm font-black text-white">
              1-to-1 Video Calls are Turned Off
            </h4>
            <p className="text-xs text-purple-200/75 leading-relaxed">
              {targetName
                ? `Calling ${targetName} via 1-to-1 video is disabled in this release.`
                : 'Private 1-to-1 video calling is disabled in this release.'}{' '}
              Camera, microphone, and real-time calling services are inactive.
            </p>
          </div>

          <div className="rounded-2xl bg-amber-500/10 border border-amber-400/30 p-3.5 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <p className="font-extrabold text-amber-200 flex items-center gap-1.5">
                <Lock className="w-3 h-3" /> Client Approval Required
              </p>
              <p className="text-purple-100/80 leading-relaxed">
                Keep this feature disabled by default unless the client signs off for a future release.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setInfoOpen(false)}>
              Close
            </Button>
            <Link
              href="/video-call"
              onClick={() => setInfoOpen(false)}
              data-testid="modal-view-video-call-status-link"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#FF1A6C] to-[#D946EF] text-white text-xs font-extrabold shadow-glow-pink"
            >
              <span>View Status Screen</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </Modal>
    </>
  );
};
