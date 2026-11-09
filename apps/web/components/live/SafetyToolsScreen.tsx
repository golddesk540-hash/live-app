'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

export const REPORT_REASONS = [
  { id: 'harassment_bullying', label: 'Harassment or bullying' },
  { id: 'inappropriate_content', label: 'Inappropriate content' },
  { id: 'spam', label: 'Spam' },
  { id: 'impersonation', label: 'Fake account or impersonation' },
  { id: 'hate_speech', label: 'Hate or abusive language' },
  { id: 'other', label: 'Other' },
];

export interface SafetyToolsProps {
  roomId?: string;
  hostName?: string;
  hostAvatar?: string;
  hostId?: string;
  userRole?: 'viewer' | 'host' | 'moderator' | 'admin';
  onClose?: () => void;
  onBlockSuccess?: (userId: string) => void;
  onMuteSuccess?: (userId: string, muteType: string) => void;
}

export default function SafetyToolsScreen({
  roomId: propRoomId,
  hostName: propHostName,
  hostAvatar: propHostAvatar,
  hostId: propHostId,
  userRole: propUserRole,
  onClose,
  onBlockSuccess,
  onMuteSuccess,
}: SafetyToolsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const roomId = propRoomId || searchParams.get('roomId') || '880219';
  const targetHostName = propHostName || 'Zara Live';
  const targetHostAvatar = propHostAvatar || '/assets/studio/host_zara_avatar.png';
  const targetHostId = propHostId || 'demo-host-zara';
  const userRole = propUserRole || (searchParams.get('role') === 'host' ? 'host' : 'viewer');

  // Sub-dialog states
  const [activeDialog, setActiveDialog] = useState<'menu' | 'report' | 'block' | 'mute'>('menu');

  // Report state
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [reportDescription, setReportDescription] = useState<string>('');
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);
  const [reportSuccessData, setReportSuccessData] = useState<{ id: string; message: string } | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  // Block state
  const [isBlocking, setIsBlocking] = useState<boolean>(false);
  const [blockSuccessMsg, setBlockSuccessMsg] = useState<string | null>(null);
  const [blockError, setBlockError] = useState<string | null>(null);

  // Mute state
  const [mutedParticipants, setMutedParticipants] = useState<Record<string, boolean>>({});
  const [muteSuccessMsg, setMuteSuccessMsg] = useState<string | null>(null);
  const [muteError, setMuteError] = useState<string | null>(null);

  // Sample room participants for muting
  const [participants] = useState([
    { id: 'demo-user-sana', nickname: 'Sana', avatar: '/assets/chat/avatar_sana.png', role: 'viewer' },
    { id: 'demo-user-rizwan', nickname: 'Rizwan', avatar: '/assets/chat/avatar_rizwan.png', role: 'viewer' },
    { id: 'demo-user-mehak', nickname: 'Mehak', avatar: '/assets/chat/avatar_mehak.png', role: 'viewer' },
    { id: 'demo-user-khang', nickname: 'Khan G', avatar: '/assets/chat/avatar_khang.png', role: 'viewer' },
    { id: 'demo-user-ayesha', nickname: 'Ayesha', avatar: '/assets/chat/avatar_ayesha.png', role: 'viewer' },
    { id: 'demo-user-bilal', nickname: 'Bilal', avatar: '/assets/chat/avatar_bilal.png', role: 'viewer' },
  ]);

  // Load existing mutes
  useEffect(() => {
    fetch(`/api/live/safety/mute?roomId=${encodeURIComponent(roomId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.mutedUserIds) {
          const map: Record<string, boolean> = {};
          data.mutedUserIds.forEach((uid: string) => (map[uid] = true));
          setMutedParticipants(map);
        }
      })
      .catch(() => {});
  }, [roomId]);

  // Handle Cancel / Dismiss
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.push(`/live/room/${roomId}`);
    }
  };

  // Submit Report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) {
      setReportError('Please select a report reason.');
      return;
    }

    setIsSubmittingReport(true);
    setReportError(null);

    try {
      const res = await fetch('/api/live/safety/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          reportedUserId: targetHostId,
          reportedNickname: targetHostName,
          reason: selectedReason,
          description: reportDescription,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit report');
      }

      setReportSuccessData({
        id: data.reportId,
        message: data.message,
      });
    } catch (err: any) {
      setReportError(err.message || 'Network error submitting report.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Confirm Block
  const handleConfirmBlock = async () => {
    setIsBlocking(true);
    setBlockError(null);

    try {
      const res = await fetch('/api/live/safety/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: targetHostId,
          targetNickname: targetHostName,
          roomId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to block user');
      }

      setBlockSuccessMsg(`${targetHostName} has been blocked.`);
      if (onBlockSuccess) onBlockSuccess(targetHostId);
      setTimeout(() => {
        handleClose();
      }, 1600);
    } catch (err: any) {
      setBlockError(err.message || 'Error executing block action.');
    } finally {
      setIsBlocking(false);
    }
  };

  // Toggle Mute Participant
  const handleToggleMute = async (participantId: string, participantNickname: string, isRoomGlobal: boolean = false) => {
    const isCurrentlyMuted = !!mutedParticipants[participantId];
    setMuteError(null);

    try {
      const method = isCurrentlyMuted ? 'DELETE' : 'POST';
      const url = isCurrentlyMuted
        ? `/api/live/safety/mute?roomId=${encodeURIComponent(roomId)}&targetUserId=${encodeURIComponent(participantId)}`
        : '/api/live/safety/mute';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: isCurrentlyMuted
          ? undefined
          : JSON.stringify({
              roomId,
              targetUserId: participantId,
              targetNickname: participantNickname,
              muteType: isRoomGlobal ? 'room_global' : 'viewer_local',
              requesterRole: userRole,
            }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update mute state');
      }

      setMutedParticipants((prev) => ({
        ...prev,
        [participantId]: !isCurrentlyMuted,
      }));

      setMuteSuccessMsg(
        isCurrentlyMuted
          ? `${participantNickname} unmuted.`
          : `${participantNickname} muted ${isRoomGlobal ? 'room-wide' : 'in chat'}.`
      );

      if (onMuteSuccess) onMuteSuccess(participantId, isRoomGlobal ? 'room_global' : 'viewer_local');
      setTimeout(() => setMuteSuccessMsg(null), 2500);
    } catch (err: any) {
      setMuteError(err.message || 'Mute operation failed.');
      setTimeout(() => setMuteError(null), 3500);
    }
  };

  return (
    <div className="min-h-screen bg-[#070814] text-white flex flex-col items-center justify-start antialiased selection:bg-pink-500 selection:text-white">
      {/* Mobile Frame (1:1 with 04_06_safety_tools.png) */}
      <div className="w-full max-w-[420px] min-h-screen bg-[#070817] flex flex-col shadow-2xl relative overflow-hidden">

        {/* ======================================================== */}
        {/* BACKGROUND: LIVE ROOM STREAM CONTEXT (DIMMED UNDERLAY)   */}
        {/* ======================================================== */}
        <div className="absolute inset-0 z-0">
          {/* Sample broadcast background image */}
          <img
            src="/assets/viewer/sample_viewer_broadcast.png"
            alt="Live Stream"
            className="w-full h-full object-cover filter brightness-[0.38] blur-[1px]"
          />

          {/* Dim Backdrop Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#08091a]/80 via-black/70 to-[#0d0f26]/95" />

          {/* Simulated Live Room Header */}
          <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between z-10 opacity-60 pointer-events-none">
            {/* Host Pill */}
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full px-2 py-1 border border-white/10">
              <img
                src={targetHostAvatar}
                alt={targetHostName}
                className="w-7 h-7 rounded-full object-cover border border-pink-500/50"
              />
              <div className="text-left leading-tight">
                <span className="text-white text-xs font-bold block">{targetHostName}</span>
                <span className="text-white/60 text-[10px]">7.6K Viewers</span>
              </div>
            </div>

            {/* Exit Button */}
            <div className="w-7 h-7 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white/70">
              ✕
            </div>
          </div>

          {/* Simulated Chat Feed in background */}
          <div className="absolute bottom-60 left-3 right-3 space-y-2 opacity-40 pointer-events-none">
            <div className="text-xs bg-black/30 backdrop-blur rounded-full px-3 py-1 inline-block">
              <span className="text-zinc-400">Sana: </span>
              <span className="text-white">So beautiful 💕</span>
            </div>
            <br />
            <div className="text-xs bg-black/30 backdrop-blur rounded-full px-3 py-1 inline-block">
              <span className="text-zinc-400">Rizwan: </span>
              <span className="text-white">Nice live 😊</span>
            </div>
          </div>
        </div>

        {/* Spacer pushing safety modal to the bottom */}
        <div className="flex-1" />

        {/* ======================================================== */}
        {/* SAFETY TOOLS BOTTOM SHEET DRAWER (EXACT 1:1 REFERENCE)   */}
        {/* ======================================================== */}
        <div className="relative z-30 w-full bg-[#13152d]/95 backdrop-blur-xl border-t border-white/10 rounded-t-[28px] shadow-2xl flex flex-col p-4 animate-slide-up">

          {/* Drag Handle Bar */}
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-3" />

          {/* ======================================================== */}
          {/* VIEW 1: MAIN SAFETY TOOLS MENU (1:1 with 04_06)          */}
          {/* ======================================================== */}
          {activeDialog === 'menu' && (
            <div className="space-y-3">
              {/* Header: Safety Tools */}
              <div className="flex items-center justify-between pb-1 px-1">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Safety Tools
                </h2>
                <span className="text-[11px] text-pink-400 font-medium">Room Protection</span>
              </div>

              {/* Menu List */}
              <div className="space-y-2">
                {/* 1. Report Option */}
                <button
                  onClick={() => {
                    setActiveDialog('report');
                    setSelectedReason('');
                    setReportDescription('');
                    setReportSuccessData(null);
                    setReportError(null);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#1a1d3b]/90 hover:bg-[#21254a] border border-white/5 hover:border-pink-500/30 transition group text-left active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    {/* Exclamation Icon in Circle */}
                    <div className="w-10 h-10 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-105 transition">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-white font-semibold text-sm block">Report</span>
                      <span className="text-white/50 text-xs">Flag inappropriate behavior or content</span>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* 2. Block Option */}
                <button
                  onClick={() => {
                    setActiveDialog('block');
                    setBlockSuccessMsg(null);
                    setBlockError(null);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#1a1d3b]/90 hover:bg-[#21254a] border border-white/5 hover:border-amber-500/30 transition group text-left active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    {/* Ban / Block Icon */}
                    <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-white font-semibold text-sm block">Block</span>
                      <span className="text-white/50 text-xs">Hide stream & add user to your blacklist</span>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* 3. Mute Option */}
                <button
                  onClick={() => {
                    setActiveDialog('mute');
                    setMuteSuccessMsg(null);
                    setMuteError(null);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#1a1d3b]/90 hover:bg-[#21254a] border border-white/5 hover:border-purple-500/30 transition group text-left active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    {/* Speaker Mute Icon */}
                    <div className="w-10 h-10 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-white font-semibold text-sm block">Mute Chat</span>
                      <span className="text-white/50 text-xs">Mute participants & filter messages</span>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Bottom Cancel Button */}
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-3 rounded-full bg-[#1d2042] hover:bg-[#252a55] text-white/90 font-medium text-sm transition text-center border border-white/5 active:scale-[0.98] mt-2"
              >
                Cancel
              </button>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 2: REPORT FORM MODAL                                */}
          {/* ======================================================== */}
          {activeDialog === 'report' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between pb-1 border-b border-white/5">
                <button
                  type="button"
                  onClick={() => setActiveDialog('menu')}
                  className="text-white/60 hover:text-white text-xs flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                <h3 className="text-sm font-bold text-white">Report User</h3>
                <span className="text-[11px] text-zinc-400">ID: {roomId}</span>
              </div>

              {reportSuccessData ? (
                /* Success Screen */
                <div className="py-4 px-3 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto text-xl animate-bounce">
                    ✓
                  </div>
                  <h4 className="text-white font-bold text-base">Report Submitted</h4>
                  <p className="text-xs text-white/70 max-w-xs mx-auto">
                    {reportSuccessData.message}
                  </p>
                  <div className="p-2.5 bg-black/40 rounded-xl border border-white/10 text-xs">
                    <span className="text-white/50 block">Reference Report ID:</span>
                    <strong className="text-pink-400 font-mono text-sm">{reportSuccessData.id}</strong>
                  </div>
                  <button
                    onClick={() => setActiveDialog('menu')}
                    className="w-full py-2.5 rounded-full bg-pink-500 hover:bg-pink-600 text-white font-semibold text-xs transition"
                  >
                    Done
                  </button>
                </div>
              ) : (
                /* Report Form */
                <form onSubmit={handleSubmitReport} className="space-y-3">
                  {reportError && (
                    <div className="p-2 bg-rose-500/20 border border-rose-500/40 rounded-lg text-rose-300 text-xs">
                      {reportError}
                    </div>
                  )}

                  {/* Target User Info */}
                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-black/30 border border-white/5">
                    <img src={targetHostAvatar} alt={targetHostName} className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <span className="text-xs font-bold text-white block">{targetHostName}</span>
                      <span className="text-[10px] text-white/50">Room #{roomId}</span>
                    </div>
                  </div>

                  {/* Reasons Radio / Pill list */}
                  <div>
                    <label className="text-[11px] font-semibold text-white/70 mb-1.5 block">
                      Select reason for reporting (Required):
                    </label>
                    <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto pr-1">
                      {REPORT_REASONS.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setSelectedReason(r.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition text-left border ${
                            selectedReason === r.id
                              ? 'bg-rose-500/20 border-rose-500 text-white font-semibold'
                              : 'bg-[#181a38] border-white/5 text-white/70 hover:bg-white/5'
                          }`}
                        >
                          <span>{r.label}</span>
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[8px] ${
                            selectedReason === r.id ? 'border-rose-400 bg-rose-500 text-white' : 'border-white/30'
                          }`}>
                            {selectedReason === r.id ? '●' : ''}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Optional Description */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-white/70 mb-1">
                      <span>Additional details (Optional):</span>
                      <span className="text-white/40">{reportDescription.length}/500</span>
                    </div>
                    <textarea
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value.slice(0, 500))}
                      placeholder="Describe what occurred during the live broadcast..."
                      rows={2}
                      className="w-full bg-[#181a38] border border-white/10 rounded-xl p-2 text-xs text-white placeholder-white/30 outline-none focus:border-rose-500/60 transition resize-none"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveDialog('menu')}
                      className="flex-1 py-2.5 rounded-full bg-white/10 text-white/80 font-medium text-xs hover:bg-white/15 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedReason || isSubmittingReport}
                      className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 disabled:opacity-40 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition flex items-center justify-center gap-1.5"
                    >
                      {isSubmittingReport ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <span>Submit Report</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 3: BLOCK CONFIRMATION DIALOG                        */}
          {/* ======================================================== */}
          {activeDialog === 'block' && (
            <div className="space-y-3.5 text-center py-2">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto text-xl">
                🚫
              </div>

              <div>
                <h3 className="text-base font-bold text-white">Block {targetHostName}?</h3>
                <p className="text-xs text-white/70 max-w-xs mx-auto mt-1 leading-relaxed">
                  They will be added to your blacklist. You will no longer see their broadcasts, and their chat messages will be hidden.
                </p>
              </div>

              {/* Target User Badge */}
              <div className="flex items-center justify-center gap-2.5 p-2 bg-black/40 rounded-xl border border-white/5 max-w-xs mx-auto">
                <img src={targetHostAvatar} alt={targetHostName} className="w-9 h-9 rounded-full object-cover" />
                <div className="text-left">
                  <span className="text-xs font-bold text-white block">{targetHostName}</span>
                  <span className="text-[10px] text-white/40">ID: {targetHostId}</span>
                </div>
              </div>

              {blockSuccessMsg && (
                <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs">
                  {blockSuccessMsg}
                </div>
              )}

              {blockError && (
                <div className="p-2 bg-rose-500/20 border border-rose-500/40 rounded-lg text-rose-300 text-xs">
                  {blockError}
                </div>
              )}

              {/* Confirmation Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveDialog('menu')}
                  className="flex-1 py-2.5 rounded-full bg-white/10 text-white/80 font-medium text-xs hover:bg-white/15 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBlock}
                  disabled={isBlocking}
                  className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 disabled:opacity-40 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-1.5"
                >
                  {isBlocking ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Blocking...</span>
                    </>
                  ) : (
                    <span>Confirm Block</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 4: MUTE PARTICIPANT DIALOG                          */}
          {/* ======================================================== */}
          {activeDialog === 'mute' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-white/5">
                <button
                  type="button"
                  onClick={() => setActiveDialog('menu')}
                  className="text-white/60 hover:text-white text-xs flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                <h3 className="text-sm font-bold text-white">Mute Participants</h3>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-medium">
                  {userRole === 'host' ? 'Host Control' : 'Viewer Mute'}
                </span>
              </div>

              {muteSuccessMsg && (
                <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs">
                  {muteSuccessMsg}
                </div>
              )}

              {muteError && (
                <div className="p-2 bg-rose-500/20 border border-rose-500/40 rounded-lg text-rose-300 text-xs">
                  {muteError}
                </div>
              )}

              <p className="text-[11px] text-white/60">
                {userRole === 'host'
                  ? 'As host, you can mute participants room-wide to stop them from chatting.'
                  : 'Muting hides that participant\'s chat messages from your view.'}
              </p>

              {/* Participant List */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {participants.map((p) => {
                  const isMuted = !!mutedParticipants[p.id];
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-[#181a38] border border-white/5"
                    >
                      <div className="flex items-center gap-2.5">
                        <img src={p.avatar} alt={p.nickname} className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <span className="text-xs font-semibold text-white block">{p.nickname}</span>
                          <span className="text-[10px] text-white/40">Participant</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Viewer Chat Mute Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleMute(p.id, p.nickname, false)}
                          className={`px-3 py-1 rounded-full text-[11px] font-semibold transition ${
                            isMuted
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-white/10 hover:bg-white/20 text-white'
                          }`}
                        >
                          {isMuted ? '🔇 Muted' : 'Mute'}
                        </button>

                        {/* Host Room-Wide Mute Button (Only for Host) */}
                        {userRole === 'host' && (
                          <button
                            type="button"
                            onClick={() => handleToggleMute(p.id, p.nickname, true)}
                            title="Mute room-wide for all viewers"
                            className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition"
                          >
                            Room Mute
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setActiveDialog('menu')}
                className="w-full py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white/90 font-medium text-xs transition text-center"
              >
                Close
              </button>
            </div>
          )}

        </div>

        {/* ======================================================== */}
        {/* BOTTOM MODULE BANNER: "4.6 Safety Tools"                 */}
        {/* ======================================================== */}
        <div className="h-9 bg-[#1a163a] border-t border-white/5 flex items-center justify-center relative z-40">
          <span className="text-white/90 text-xs sm:text-[13px] font-medium tracking-wide">
            4.6 Safety Tools
          </span>
        </div>

      </div>
    </div>
  );
}
