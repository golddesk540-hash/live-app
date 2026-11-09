'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronDown,
  Shield,
  Sparkles,
  Cast,
  CheckCircle,
  AlertCircle,
  Loader2,
  Lock,
  Users,
  Check,
} from 'lucide-react';
import { PartyRoomLimits } from '@/lib/party';

export interface RoomLimitsScreenProps {
  roomId?: string;
  isHost?: boolean;
  onClose?: () => void;
  isModal?: boolean;
  onLimitsUpdated?: (limits: PartyRoomLimits) => void;
}

export default function RoomLimitsScreen({
  roomId = '7001',
  isHost = true,
  onClose,
  isModal = false,
  onLimitsUpdated,
}: RoomLimitsScreenProps) {
  const router = useRouter();

  // Settings State matching 05_09_limits_that_protect_the_room.png
  const [maxSeats, setMaxSeats] = useState<number>(9);
  const [seatsLayout, setSeatsLayout] = useState<string>('9 (3×3)');
  const [audienceLimit, setAudienceLimit] = useState<number>(1000);
  const [joinRequestsEnabled, setJoinRequestsEnabled] = useState<boolean>(true); // purple ON in reference
  const [inviteOnly, setInviteOnly] = useState<boolean>(false); // OFF in reference
  const [lockRoom, setLockRoom] = useState<boolean>(false); // OFF in reference

  // Live room stats from backend
  const [currentAudience, setCurrentAudience] = useState<number>(256);
  const [occupiedSeats, setOccupiedSeats] = useState<number>(6);

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dropdown dialogs
  const [showSeatsDropdown, setShowSeatsDropdown] = useState<boolean>(false);
  const [showAudienceDropdown, setShowAudienceDropdown] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Fetch current limits from backend
  useEffect(() => {
    let isMounted = true;
    async function loadLimits() {
      try {
        const res = await fetch(`/api/party/${roomId}/limits`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && isMounted) {
            setMaxSeats(data.maxSeats || 9);
            setSeatsLayout(data.seatsLayout || '9 (3×3)');
            setAudienceLimit(data.audienceLimit || 1000);
            setJoinRequestsEnabled(data.joinRequestsEnabled !== false);
            setInviteOnly(Boolean(data.inviteOnly));
            setLockRoom(Boolean(data.lockRoom));
            if (typeof data.currentAudienceCount === 'number') {
              setCurrentAudience(data.currentAudienceCount);
            }
            if (typeof data.occupiedSeatsCount === 'number') {
              setOccupiedSeats(data.occupiedSeatsCount);
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch limits, using canonical defaults:', err);
      }
    }
    loadLimits();
    return () => {
      isMounted = false;
    };
  }, [roomId]);

  // Save changes to backend
  const handleSaveChanges = async (updatedValues?: Partial<{
    maxSeats: number;
    seatsLayout: string;
    audienceLimit: number;
    joinRequestsEnabled: boolean;
    inviteOnly: boolean;
    lockRoom: boolean;
  }>) => {
    setSaving(true);
    setErrorMessage(null);

    const payload = {
      maxSeats: updatedValues?.maxSeats ?? maxSeats,
      seatsLayout: updatedValues?.seatsLayout ?? seatsLayout,
      audienceLimit: updatedValues?.audienceLimit ?? audienceLimit,
      joinRequestsEnabled: updatedValues?.joinRequestsEnabled ?? joinRequestsEnabled,
      inviteOnly: updatedValues?.inviteOnly ?? inviteOnly,
      lockRoom: updatedValues?.lockRoom ?? lockRoom,
      isHostAction: isHost,
      preview: 'demo',
    };

    try {
      const res = await fetch(`/api/party/${roomId}/limits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        showToast('Room limits updated successfully!');
        if (onLimitsUpdated) {
          onLimitsUpdated(data);
        }
      } else {
        setErrorMessage(data.error || 'Failed to update limits');
      }
    } catch (err: any) {
      setErrorMessage('Network error while saving limits');
    } finally {
      setSaving(false);
    }
  };

  const seatsOptions = [
    { label: '9 (3×3)', value: 9 },
    { label: '6 (2×3)', value: 6 },
    { label: '4 (2×2)', value: 4 },
  ];

  const audienceOptions = [200, 500, 1000, 2000, 5000];

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-3 sm:p-6 text-white font-sans select-none relative overflow-x-hidden"
      style={{
        background: 'linear-gradient(180deg, #070415 0%, #120a2e 45%, #080518 100%)',
      }}
      data-testid="limits-screen-container"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-purple-600/90 text-white text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 border border-purple-400/40 animate-in fade-in slide-in-from-top-4 duration-200"
          data-testid="toast-notification"
        >
          <CheckCircle className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-sm px-4 py-2.5 rounded-xl bg-red-950/90 text-red-200 text-xs font-medium shadow-2xl backdrop-blur-md flex items-center gap-2 border border-red-500/40"
          data-testid="error-notification"
        >
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="ml-auto text-red-300 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* MOBILE DEVICE CONTAINER (MATCHING 05_09 REFERENCE 301x506 PROPORTIONS) */}
      <div className="w-full max-w-[360px] rounded-[38px] p-2 bg-[#05030f] border-4 border-zinc-800 shadow-[0_20px_60px_rgba(0,0,0,0.85)] relative flex flex-col min-h-[580px] overflow-hidden">
        {/* Inner Phone Screen */}
        <div
          className="w-full flex-1 rounded-[32px] overflow-hidden flex flex-col relative"
          style={{
            background:
              'linear-gradient(180deg, #090616 0%, #120c2a 35%, #180f3b 65%, #090616 100%)',
          }}
        >
          {/* Top Status Bar (9:41, Cellular, WiFi, Battery) */}
          <div className="pt-3 px-5 flex items-center justify-between text-xs font-semibold text-zinc-300 tracking-tight z-20">
            <span className="font-bold text-[13px] text-white">9:41</span>
            <div className="flex items-center gap-1.5 text-zinc-300">
              {/* Cellular 4 bars */}
              <div className="flex items-end gap-[1.5px] h-3">
                <span className="w-[2.5px] h-1 bg-white rounded-full"></span>
                <span className="w-[2.5px] h-1.5 bg-white rounded-full"></span>
                <span className="w-[2.5px] h-2 bg-white rounded-full"></span>
                <span className="w-[2.5px] h-2.5 bg-white rounded-full"></span>
              </div>
              {/* WiFi symbol */}
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98C20.93 5.9 16.69 4 12 4z" />
              </svg>
              {/* Battery pill */}
              <div className="w-5 h-2.5 rounded-[4px] border border-white/80 p-[1px] flex items-center">
                <div className="w-3.5 h-full bg-white rounded-[2px]"></div>
              </div>
            </div>
          </div>

          {/* App Header: Back button, Popo Live logo, Cast icon */}
          <header className="px-4 py-2 flex items-center justify-between z-20">
            <button
              onClick={() => {
                if (onClose) onClose();
                else router.push(`/party/room/${roomId}`);
              }}
              data-action="back"
              data-testid="header-back-button"
              className="p-1 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Back"
            >
              <ChevronLeft className="w-5 h-5 text-zinc-200" />
            </button>

            {/* Popo Live Logo with Purple 'P' */}
            <div className="flex items-center gap-0.5 tracking-tight font-extrabold text-[17px]">
              <span className="text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.7)] text-[18px]">
                P
              </span>
              <span className="text-white">opo Live</span>
            </div>

            {/* Right Cast / Headset Icon */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-300 hover:text-white"
              title="Party Stream"
              data-testid="cast-icon"
            >
              <Cast className="w-4 h-4 text-zinc-300" />
            </div>
          </header>

          {/* Subheader Back Arrow (as seen below Popo Live in 05_09) */}
          <div className="px-4 pt-0 pb-1 z-20">
            <button
              onClick={() => {
                if (onClose) onClose();
                else router.push(`/party/room/${roomId}`);
              }}
              className="p-1 text-zinc-400 hover:text-white transition-colors"
              aria-label="Back to Party"
              data-action="sub-back"
            >
              <ChevronLeft className="w-5 h-5 text-zinc-300" />
            </button>
          </div>

          {/* HERO ICON & TITLE: Glowing Shield with 4-Point Star + "Room Limits" */}
          <div className="flex flex-col items-center justify-center pt-1 pb-3 z-20">
            {/* Glowing Shield with Star */}
            <div className="relative mb-2">
              <div
                className="w-14 h-16 rounded-[22px] flex items-center justify-center relative overflow-hidden transition-transform duration-300 hover:scale-105"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(168, 85, 247, 0.45) 0%, rgba(126, 34, 206, 0.55) 100%)',
                  boxShadow:
                    '0 0 30px rgba(168, 85, 247, 0.55), inset 0 0 15px rgba(236, 72, 153, 0.3)',
                  border: '1.5px solid rgba(216, 180, 254, 0.6)',
                  clipPath:
                    'polygon(50% 0%, 100% 15%, 100% 75%, 50% 100%, 0% 75%, 0% 15%)',
                }}
                data-testid="shield-hero-badge"
              >
                {/* 4-point Golden Star */}
                <div className="text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-pulse">
                  <svg
                    className="w-7 h-7 fill-amber-300 text-amber-300"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Screen Title */}
            <h1
              className="text-[20px] font-bold text-white tracking-tight"
              data-testid="room-limits-title"
            >
              Room Limits
            </h1>
          </div>

          {/* MAIN CARD CONTAINER (MATCHING 05_09_limits_that_protect_the_room.png) */}
          <main className="flex-1 px-4 py-1 flex flex-col justify-start relative z-20">
            <div
              className="w-full rounded-[26px] p-4 shadow-2xl relative border border-white/10"
              style={{
                background:
                  'linear-gradient(180deg, rgba(29, 21, 56, 0.92) 0%, rgba(18, 13, 38, 0.95) 100%)',
                boxShadow:
                  '0 15px 35px -5px rgba(0, 0, 0, 0.7), 0 0 20px rgba(139, 92, 246, 0.12)',
              }}
              data-testid="room-limits-card"
            >
              {/* ROW 1: Max Seats */}
              <div
                className="flex items-center justify-between py-3 border-b border-white/5"
                data-testid="row-max-seats"
              >
                <span className="text-[15px] font-semibold text-white tracking-tight">
                  Max Seats
                </span>

                <div className="relative">
                  <button
                    onClick={() => {
                      setShowSeatsDropdown((prev) => !prev);
                      setShowAudienceDropdown(false);
                    }}
                    data-action="toggle-seats-dropdown"
                    data-testid="btn-select-max-seats"
                    className="px-3.5 py-1.5 rounded-xl bg-[#281e4e] hover:bg-[#342767] border border-white/10 text-[13px] font-medium text-white flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                  >
                    <span>{seatsLayout}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-300" />
                  </button>

                  {/* Dropdown Menu */}
                  {showSeatsDropdown && (
                    <div
                      className="absolute right-0 top-full mt-1.5 w-32 rounded-xl bg-[#221845] border border-purple-500/40 shadow-2xl z-30 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100"
                      data-testid="dropdown-seats-menu"
                    >
                      {seatsOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setMaxSeats(opt.value);
                            setSeatsLayout(opt.label);
                            setShowSeatsDropdown(false);
                            handleSaveChanges({
                              maxSeats: opt.value,
                              seatsLayout: opt.label,
                            });
                          }}
                          data-testid={`option-seat-${opt.value}`}
                          className={`w-full px-3 py-1.5 text-left text-xs font-semibold flex items-center justify-between hover:bg-purple-600/30 transition-colors ${
                            maxSeats === opt.value
                              ? 'text-purple-300 bg-purple-900/40'
                              : 'text-zinc-200'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {maxSeats === opt.value && <Check className="w-3 h-3 text-purple-300" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ROW 2: Audience Limit */}
              <div
                className="flex items-center justify-between py-3 border-b border-white/5"
                data-testid="row-audience-limit"
              >
                <span className="text-[15px] font-semibold text-white tracking-tight">
                  Audience Limit
                </span>

                <div className="relative">
                  <button
                    onClick={() => {
                      setShowAudienceDropdown((prev) => !prev);
                      setShowSeatsDropdown(false);
                    }}
                    data-action="toggle-audience-dropdown"
                    data-testid="btn-select-audience-limit"
                    className="px-3.5 py-1.5 rounded-xl bg-[#281e4e] hover:bg-[#342767] border border-white/10 text-[13px] font-medium text-white flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                  >
                    <span>{audienceLimit}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-300" />
                  </button>

                  {/* Dropdown Menu */}
                  {showAudienceDropdown && (
                    <div
                      className="absolute right-0 top-full mt-1.5 w-28 rounded-xl bg-[#221845] border border-purple-500/40 shadow-2xl z-30 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100"
                      data-testid="dropdown-audience-menu"
                    >
                      {audienceOptions.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => {
                            setAudienceLimit(opt);
                            setShowAudienceDropdown(false);
                            handleSaveChanges({ audienceLimit: opt });
                          }}
                          data-testid={`option-audience-${opt}`}
                          className={`w-full px-3 py-1.5 text-left text-xs font-semibold flex items-center justify-between hover:bg-purple-600/30 transition-colors ${
                            audienceLimit === opt
                              ? 'text-purple-300 bg-purple-900/40'
                              : 'text-zinc-200'
                          }`}
                        >
                          <span>{opt}</span>
                          {audienceLimit === opt && <Check className="w-3 h-3 text-purple-300" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ROW 3: Join Requests (Purple ON in reference) */}
              <div
                className="flex items-center justify-between py-3.5 border-b border-white/5"
                data-testid="row-join-requests"
              >
                <span className="text-[15px] font-semibold text-white tracking-tight">
                  Join Requests
                </span>

                {/* iOS/Flutter Style Toggle */}
                <button
                  onClick={() => {
                    const nextVal = !joinRequestsEnabled;
                    setJoinRequestsEnabled(nextVal);
                    handleSaveChanges({ joinRequestsEnabled: nextVal });
                  }}
                  data-action="toggle-join-requests"
                  data-testid="toggle-join-requests"
                  aria-checked={joinRequestsEnabled}
                  role="switch"
                  className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none flex items-center cursor-pointer ${
                    joinRequestsEnabled
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_0_10px_rgba(139,92,246,0.5)] justify-end'
                      : 'bg-[#2a204d] justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform" />
                </button>
              </div>

              {/* ROW 4: Invite Only (OFF in reference) */}
              <div
                className="flex items-center justify-between py-3.5 border-b border-white/5"
                data-testid="row-invite-only"
              >
                <span className="text-[15px] font-semibold text-white tracking-tight">
                  Invite Only
                </span>

                <button
                  onClick={() => {
                    const nextVal = !inviteOnly;
                    setInviteOnly(nextVal);
                    handleSaveChanges({ inviteOnly: nextVal });
                  }}
                  data-action="toggle-invite-only"
                  data-testid="toggle-invite-only"
                  aria-checked={inviteOnly}
                  role="switch"
                  className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none flex items-center cursor-pointer ${
                    inviteOnly
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_0_10px_rgba(139,92,246,0.5)] justify-end'
                      : 'bg-[#2a204d] justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform" />
                </button>
              </div>

              {/* ROW 5: Lock Room (OFF in reference) */}
              <div
                className="flex items-center justify-between py-3.5"
                data-testid="row-lock-room"
              >
                <span className="text-[15px] font-semibold text-white tracking-tight">
                  Lock Room
                </span>

                <button
                  onClick={() => {
                    const nextVal = !lockRoom;
                    setLockRoom(nextVal);
                    handleSaveChanges({ lockRoom: nextVal });
                  }}
                  data-action="toggle-lock-room"
                  data-testid="toggle-lock-room"
                  aria-checked={lockRoom}
                  role="switch"
                  className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none flex items-center cursor-pointer ${
                    lockRoom
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_0_10px_rgba(139,92,246,0.5)] justify-end'
                      : 'bg-[#2a204d] justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform" />
                </button>
              </div>
            </div>

            {/* Auxiliary Save Changes button for manual confirmation / testing */}
            <div className="mt-3">
              <button
                onClick={() => handleSaveChanges()}
                disabled={saving}
                data-action="save-limits"
                data-testid="btn-save-limits"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-xs font-bold text-white shadow-md shadow-purple-900/30 flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-pink-300" />
                )}
                <span>Save Limits</span>
              </button>
            </div>
          </main>

          {/* FOOTER WATERMARK MATCHING 05_09_limits_that_protect_the_room.png */}
          <footer
            className="pb-3 pt-2 px-4 flex justify-center z-20 text-center"
            data-testid="footer-reference-banner"
          >
            <div className="px-4 py-1.5 rounded-full bg-purple-950/70 border border-purple-600/30 text-[12px] font-bold text-white/90 tracking-wide shadow-md flex flex-col items-center leading-tight">
              <span>05_09 Limits that</span>
              <span>Protect the Room</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
