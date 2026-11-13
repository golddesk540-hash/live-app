'use client';

import React, { useState } from 'react';
import { LiveSessionRecord } from './liveMonitorTypes';
import { LiveMonitorEmptyState } from './LiveMonitorEmptyStates';

interface LiveStreamPreviewModalProps {
  session: LiveSessionRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenSessionDetails?: (session: LiveSessionRecord) => void;
}

export const LiveStreamPreviewModal: React.FC<LiveStreamPreviewModalProps> = ({
  session,
  isOpen,
  onClose,
  onOpenSessionDetails,
}) => {
  const [isMuted, setIsMuted] = useState(true);
  const [forceUnavailable, setForceUnavailable] = useState(false);

  if (!isOpen || !session) return null;

  const showUnavailable = forceUnavailable || !session.hasPreviewFeed;

  return (
    <div
      id="live-stream-preview-modal"
      data-testid="live-stream-preview-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn"
    >
      <div className="w-full max-w-4xl rounded-3xl bg-[#160A2D] border border-purple-500/35 shadow-[0_0_60px_rgba(255,15,123,0.35)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-[#0E061E]/95 border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Room #{session.roomNumber}</span>
                  <span className="text-xs text-zinc-400 font-normal">· {session.hostUsername}</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-pink-500/20 text-pink-300 border border-pink-500/40">
                  Demo Preview
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 truncate max-w-md mt-0.5">
                {session.sessionTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setForceUnavailable(!forceUnavailable)}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-purple-200 border border-white/10 transition"
              title="Toggle preview availability demo state"
            >
              {forceUnavailable ? 'Restore Feed' : 'Simulate Feed Hold'}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition"
              title="Close Preview"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Video / Preview Stage */}
        <div className="relative aspect-video w-full bg-[#07020E] flex items-center justify-center overflow-hidden">
          {showUnavailable ? (
            <div className="w-full h-full flex items-center justify-center p-6">
              <LiveMonitorEmptyState
                kind="preview_unavailable"
                customMessage="Broadcast signal currently on administrative hold or bitrate dropped below threshold."
              />
            </div>
          ) : (
            <>
              {/* Preview Backdrop Image */}
              <img
                src={session.previewImageUrl}
                alt={session.sessionTitle}
                className="w-full h-full object-cover opacity-85 select-none"
              />

              {/* Gradient Vignette Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/60 pointer-events-none" />

              {/* Top Stream Overlay */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/15">
                  <img
                    src={session.hostAvatar}
                    alt={session.hostUsername}
                    className="w-8 h-8 rounded-full object-cover border border-pink-500"
                  />
                  <div className="leading-tight">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{session.hostUsername}</span>
                      <span className="text-[10px] text-pink-400 font-semibold uppercase">
                        {session.hostTier}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-300">ID: {session.hostId}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white font-black text-[10px] tracking-wider uppercase shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    <span>LIVE</span>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white text-xs font-bold">
                    <svg className="w-3.5 h-3.5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>{session.currentViewers.toLocaleString()}</span>
                  </div>

                  <div className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-purple-200 text-xs font-mono font-semibold">
                    {session.duration}
                  </div>
                </div>
              </div>

              {/* Bottom Stream Controls Bar */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-auto">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 text-white transition"
                    title={isMuted ? 'Unmute (Demo)' : 'Mute (Demo)'}
                  >
                    {isMuted ? (
                      <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    )}
                  </button>

                  <span className="px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-mono text-zinc-300">
                    1080p60 · Agora Demo
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenSessionDetails && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenSessionDetails(session);
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-xs shadow-lg shadow-pink-500/25 transition flex items-center gap-1.5"
                    >
                      <span>Inspect Session</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer / Vitals Summary */}
        <div className="p-4 bg-[#0E061E] border-t border-purple-500/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-2.5 rounded-2xl bg-[#160A2D] border border-purple-500/20">
            <div className="text-[10px] text-zinc-400 uppercase font-bold">Category</div>
            <div className="text-xs font-bold text-pink-300 mt-0.5">{session.category}</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-[#160A2D] border border-purple-500/20">
            <div className="text-[10px] text-zinc-400 uppercase font-bold">Session Type</div>
            <div className="text-xs font-bold text-white mt-0.5">{session.sessionType}</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-[#160A2D] border border-purple-500/20">
            <div className="text-[10px] text-zinc-400 uppercase font-bold">Peak Viewers</div>
            <div className="text-xs font-bold text-emerald-400 mt-0.5">{session.peakViewers.toLocaleString()}</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-[#160A2D] border border-purple-500/20">
            <div className="text-[10px] text-zinc-400 uppercase font-bold">Gifts Received</div>
            <div className="text-xs font-bold text-amber-400 mt-0.5">{session.totalGiftsReceivedCoins.toLocaleString()} coins</div>
          </div>
        </div>
      </div>
    </div>
  );
};
