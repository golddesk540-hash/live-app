'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Crown,
  Users,
  Mic,
  MicOff,
  Video,
  VideoOff,
  MessageSquare,
  Smile,
  Gift,
  Plus,
  Radio,
  Cast,
  Sparkles,
  Volume2,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import { PartySeat, PartyRoomResponse } from '@/lib/party';

interface SeatGridScreenProps {
  roomId: string;
  initialRoom?: PartyRoomResponse;
}

export default function SeatGridScreen({ roomId, initialRoom }: SeatGridScreenProps) {
  const router = useRouter();

  // State
  const [room, setRoom] = useState<PartyRoomResponse | null>(initialRoom || null);
  const [seats, setSeats] = useState<PartySeat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Local device media toggles
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(false);
  const [audienceCount, setAudienceCount] = useState<number>(256);

  // Interactive UI modals
  const [selectedSeat, setSelectedSeat] = useState<PartySeat | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'chat' | 'audience' | 'gift' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch Room and Seats
  const loadRoomAndSeats = useCallback(async () => {
    try {
      // Fetch Room Details
      const roomRes = await fetch(`/api/party/${roomId}`);
      if (roomRes.ok) {
        const roomData = await roomRes.json();
        if (roomData.success && roomData.room) {
          setRoom(roomData.room);
        }
      }

      // Fetch 9 Seats
      const seatsRes = await fetch(`/api/party/${roomId}/seats`);
      if (seatsRes.ok) {
        const seatsData = await seatsRes.json();
        if (seatsData.success && Array.isArray(seatsData.seats)) {
          setSeats(seatsData.seats);
          setError(null);
        }
      } else {
        setError('Unable to load party seats. Retrying...');
      }
    } catch (err: any) {
      console.error('Error fetching room/seats:', err);
      setError('Connection issue. Checking party status...');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // Initial load
  useEffect(() => {
    loadRoomAndSeats();
  }, [loadRoomAndSeats]);

  // 2. Real-Time Sync Polling (every 2.5 seconds)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const statusRes = await fetch(`/api/party/${roomId}/seats/status`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.success && Array.isArray(statusData.seats)) {
            // Update seats dynamically if changed
            setSeats((prev) => {
              const currentMap = new Map(prev.map((s) => [s.seatNumber, s]));
              let hasChanges = false;
              const next = statusData.seats.map((remote: any) => {
                const local = currentMap.get(remote.seat_number);
                if (
                  !local ||
                  local.status !== remote.status ||
                  local.participantId !== remote.participant_id ||
                  local.participantName !== remote.participant_name ||
                  local.isMuted !== remote.is_muted
                ) {
                  hasChanges = true;
                }
                return {
                  id: local?.id || `seat-${roomId}-${remote.seat_number}`,
                  roomNumber: roomId,
                  seatNumber: Number(remote.seat_number),
                  participantId: remote.participant_id,
                  participantName: remote.participant_name,
                  participantAvatar: remote.participant_avatar,
                  isHost: Boolean(remote.is_host),
                  isMuted: Boolean(remote.is_muted),
                  isCameraOn: Boolean(remote.is_camera_on),
                  status: remote.status,
                  occupiedAt: remote.occupied_at,
                  updatedAt: remote.updated_at,
                };
              });
              return hasChanges ? next : prev;
            });
          }
        }
      } catch (pollErr) {
        // silent polling catch
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [roomId]);

  // 3. Occupy Seat Action
  const handleOccupySeat = async (seatNumber: number) => {
    if (seatNumber === 1) {
      showToast('Seat 1 is reserved exclusively for Host Maria Live.');
      return;
    }

    setActionLoading(true);
    try {
      const demoNames = ['Alex Star', 'Luna Glow', 'Kenji R', 'Sammy VIP', 'Chloe Pop', 'David Cool', 'Emma Joy'];
      const randomName = demoNames[(seatNumber - 2) % demoNames.length];
      const randomId = `user_${seatNumber}_${Date.now().toString().slice(-4)}`;
      const avatar = `/assets/studio/user_avatar_${((seatNumber % 3) + 1)}.png`;

      const res = await fetch(`/api/party/${roomId}/seats/occupy?preview=demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatNumber,
          participantId: randomId,
          participantName: randomName,
          participantAvatar: avatar,
          preview: 'demo',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`🎉 ${randomName} took Seat #${seatNumber}!`);
        await loadRoomAndSeats();
        setSelectedSeat(null);
      } else {
        showToast(data.error || 'Failed to occupy seat.');
      }
    } catch (err: any) {
      showToast('Network error while occupying seat.');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Vacate Seat Action
  const handleVacateSeat = async (seatNumber: number) => {
    if (seatNumber === 1) {
      showToast('Host Seat 1 cannot be vacated while the party is active.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/party/${roomId}/seats/vacate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatNumber,
          preview: true,
          isHostAction: true,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Seat #${seatNumber} is now available.`);
        await loadRoomAndSeats();
        setSelectedSeat(null);
      } else {
        showToast(data.error || 'Failed to vacate seat.');
      }
    } catch (err: any) {
      showToast('Network error while vacating seat.');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Toggle Media Buttons
  const toggleMic = () => {
    const nextState = !isMicOn;
    setIsMicOn(nextState);
    showToast(nextState ? 'Microphone unmuted' : 'Microphone muted');
  };

  const toggleCamera = () => {
    const nextState = !isCameraOn;
    setIsCameraOn(nextState);
    showToast(nextState ? 'Camera enabled' : 'Camera disabled');
  };

  // Ensure 9 seats exist in render
  const displaySeats: PartySeat[] = [];
  for (let i = 1; i <= 9; i++) {
    const found = seats.find((s) => s.seatNumber === i);
    if (found) {
      displaySeats.push(found);
    } else {
      displaySeats.push({
        id: `seat-${roomId}-${i}`,
        roomNumber: roomId,
        seatNumber: i,
        participantId: i === 1 ? 'host_' + roomId : null,
        participantName: i === 1 ? (room?.hostNickname || 'Maria Live') : null,
        participantAvatar: i === 1 ? (room?.hostAvatar || '/assets/studio/host_zara_avatar.png') : null,
        isHost: i === 1,
        isMuted: false,
        isCameraOn: i === 1,
        status: i === 1 ? 'occupied' : 'available',
        occupiedAt: i === 1 ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  return (
    <div className="min-h-screen bg-[#050224] text-white flex flex-col justify-between max-w-sm sm:max-w-md mx-auto select-none font-sans relative overflow-hidden shadow-2xl border-x border-[#1c184d]">
      {/* Ambient background glows matching 05_02_seat_grid.png */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-purple-700/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl pointer-events-none" />

      {/* TOP STATUS BAR (9:41, Cellular, WiFi, Battery) */}
      <div className="w-full pt-3 px-6 pb-2 flex items-center justify-between text-xs text-white/90 z-20 font-medium">
        <span>9:41</span>
        <div className="flex items-center gap-1.5 text-white/90">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 22l7.03-4.39C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9zm0 2c3.87 0 7 3.13 7 7 0 1.62-.56 3.11-1.5 4.31L12 19.78l-5.5-3.47C5.56 15.11 5 13.62 5 12c0-3.87 3.13-7 7-7z" />
          </svg>
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98C20.93 5.9 16.69 4 12 4zm0 3.22c3.78 0 7.22 1.48 9.77 3.92L12 19.01 2.23 11.14C4.78 8.7 8.22 7.22 12 7.22z" />
          </svg>
          <div className="w-5 h-2.5 border border-white/80 rounded-sm p-0.5 flex items-center">
            <div className="w-full h-full bg-white rounded-2xs" />
          </div>
        </div>
      </div>

      {/* TOP HEADER: < Back, Popo Live Branding, Cast Icon */}
      <header className="px-4 py-2 flex items-center justify-between z-20" data-testid="seat-grid-header">
        {/* Back Button */}
        <Link
          href="/party/create?preview=demo"
          data-action="back"
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-all text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>

        {/* Popo Live Branding */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-600/40">
            <span className="font-extrabold text-white text-sm tracking-tighter">P</span>
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-purple-100 to-purple-200 bg-clip-text text-transparent">
            Popo Live
          </span>
        </div>

        {/* Top-Right Action: Screen Share / Cast Icon */}
        <button
          onClick={() => showToast('Audio cast / streaming mode active')}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-all text-white/90"
          title="Party Cast"
        >
          <Cast className="w-4 h-4" />
        </button>
      </header>

      {/* PARTY & HOST INFO BAR (Maria Live, 👑, #Party Room, 👥 256) */}
      <div className="px-4 py-2 z-20">
        <div className="bg-[#120d36]/90 border border-[#271d5b] rounded-2xl px-3 py-2 flex items-center justify-between shadow-lg backdrop-blur-md">
          {/* Host Info */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 p-[2px] shadow-md shadow-purple-500/30">
                <div className="w-full h-full rounded-full overflow-hidden bg-purple-950 flex items-center justify-center">
                  <Image
                    src={room?.hostAvatar || '/assets/studio/host_zara_avatar.png'}
                    alt="Host"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as any).src = '/assets/studio/host_zara_avatar.png';
                    }}
                  />
                </div>
              </div>
              <div className="absolute -top-1 -right-1 bg-amber-400 text-amber-950 rounded-full w-4 h-4 flex items-center justify-center shadow-sm text-[10px]">
                👑
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white tracking-tight" data-testid="host-name">
                  {displaySeats[0]?.participantName || room?.hostNickname || 'Maria Live'}
                </span>
                <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-purple-300/80">
                <span className="text-pink-400 font-semibold">🎉 Party Room</span>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-400 text-[11px] font-mono">#{room?.roomNumber || roomId}</span>
              </div>
            </div>
          </div>

          {/* Audience Count Pill */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-900/60 border border-purple-500/30 text-xs text-purple-200">
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-semibold text-xs" data-testid="audience-count">
              {audienceCount}
            </span>
          </div>
        </div>
      </div>

      {/* MAIN 9-SEAT 3x3 GRID (Matching 05_02_seat_grid.png exactly) */}
      <main className="flex-1 px-4 py-3 flex flex-col justify-center z-20" data-testid="nine-seat-grid">
        <div className="grid grid-cols-3 gap-3.5">
          {displaySeats.map((seat) => {
            const isHostSeat = seat.seatNumber === 1;
            const isOccupied = seat.status === 'occupied';

            if (isHostSeat) {
              // SEAT 1: HOST SEAT (Glowing border, Host badge, Crown, Maria Live photo)
              return (
                <div
                  key={seat.seatNumber}
                  data-testid="seat-1-host"
                  data-seat-number="1"
                  className="aspect-square rounded-2xl relative overflow-hidden bg-gradient-to-b from-[#22164f] to-[#120b33] border-2 border-purple-400/90 shadow-xl shadow-purple-600/30 ring-2 ring-purple-500/40 flex flex-col justify-between p-2 group transition-all"
                >
                  {/* Background Host Photo */}
                  <div className="absolute inset-0 z-0">
                    <Image
                      src={seat.participantAvatar || room?.hostAvatar || '/assets/studio/host_zara_avatar.png'}
                      alt="Host Maria"
                      fill
                      className="object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as any).src = '/assets/studio/host_zara_avatar.png';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  </div>

                  {/* Top: Crown Badge & Mic Icon */}
                  <div className="relative z-10 flex items-center justify-between w-full">
                    <span className="text-[11px] font-bold text-amber-300 px-1.5 py-0.5 rounded-full bg-black/50 backdrop-blur-sm border border-amber-400/30 flex items-center gap-1">
                      👑 1
                    </span>
                    <div className="w-5 h-5 rounded-full bg-emerald-500/90 text-white flex items-center justify-center shadow-md shadow-emerald-500/40">
                      <Mic className="w-3 h-3 text-white" />
                    </div>
                  </div>

                  {/* Bottom: "Host" Badge & Host Name */}
                  <div className="relative z-10 flex flex-col items-center">
                    <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-[10px] font-bold text-white shadow-md shadow-pink-600/40 tracking-wider uppercase border border-pink-300/40">
                      Host
                    </span>
                    <span className="text-xs font-semibold text-white/95 truncate max-w-full mt-0.5 drop-shadow-md">
                      {seat.participantName || room?.hostNickname || 'Maria Live'}
                    </span>
                  </div>
                </div>
              );
            }

            // SEATS 2 to 9: PARTICIPANT SEATS
            if (isOccupied) {
              // Occupied Participant Seat
              return (
                <div
                  key={seat.seatNumber}
                  data-testid={`seat-${seat.seatNumber}-occupied`}
                  data-seat-number={seat.seatNumber}
                  onClick={() => setSelectedSeat(seat)}
                  className="aspect-square rounded-2xl relative overflow-hidden bg-gradient-to-b from-[#22164f] to-[#120b33] border border-purple-500/50 shadow-lg shadow-purple-900/30 flex flex-col justify-between p-2 cursor-pointer group hover:border-pink-500/70 transition-all"
                >
                  {/* Participant Avatar */}
                  <div className="absolute inset-0 z-0">
                    <Image
                      src={seat.participantAvatar || '/assets/studio/user_avatar_default.png'}
                      alt={seat.participantName || `User ${seat.seatNumber}`}
                      fill
                      className="object-cover opacity-85 group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as any).src = '/assets/studio/user_avatar_default.png';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  </div>

                  {/* Top: Seat Number & Mic Status */}
                  <div className="relative z-10 flex items-center justify-between w-full">
                    <span className="text-[11px] font-bold text-purple-200 px-1.5 py-0.5 rounded-full bg-black/50 backdrop-blur-sm border border-purple-500/30">
                      #{seat.seatNumber}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-white ${
                        seat.isMuted ? 'bg-red-500/90' : 'bg-emerald-500/90'
                      }`}
                    >
                      {seat.isMuted ? <MicOff className="w-2.5 h-2.5" /> : <Mic className="w-2.5 h-2.5" />}
                    </div>
                  </div>

                  {/* Bottom: Participant Name */}
                  <div className="relative z-10 flex flex-col items-center">
                    <span className="text-xs font-semibold text-white/95 truncate max-w-full drop-shadow-md">
                      {seat.participantName || `User ${seat.seatNumber}`}
                    </span>
                  </div>
                </div>
              );
            }

            // Available Empty Participant Seat
            return (
              <div
                key={seat.seatNumber}
                data-testid={`seat-${seat.seatNumber}-empty`}
                data-seat-number={seat.seatNumber}
                onClick={() => setSelectedSeat(seat)}
                className="aspect-square rounded-2xl bg-[#141038]/80 hover:bg-[#1b154b] border border-[#2a225c] hover:border-purple-500/50 shadow-inner shadow-purple-950/60 backdrop-blur-md flex flex-col items-center justify-between p-2.5 cursor-pointer transition-all group active:scale-95"
              >
                {/* Top: Seat Number Centered/Top */}
                <span className="text-xs font-semibold text-purple-300/70 group-hover:text-purple-200">
                  {seat.seatNumber}
                </span>

                {/* Center: Circular Purple Button with '+' Icon matching 05_02_seat_grid.png */}
                <div
                  className="w-11 h-11 rounded-full bg-[#352563] group-hover:bg-[#483385] text-purple-200 group-hover:text-white flex items-center justify-center shadow-md shadow-purple-950/70 border border-purple-400/20 group-hover:scale-105 transition-all"
                  data-action="add-participant"
                >
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>

                {/* Bottom: Empty label spacer */}
                <span className="text-[10px] text-zinc-500 group-hover:text-purple-300 transition-colors">
                  Available
                </span>
              </div>
            );
          })}
        </div>
      </main>

      {/* SEAT INTERACTION DRAWER / MODAL */}
      {selectedSeat && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center p-4"
          data-testid="seat-modal"
          onClick={() => setSelectedSeat(null)}
        >
          <div
            className="w-full max-w-sm bg-[#130f38] border border-purple-500/40 rounded-3xl p-5 shadow-2xl relative animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedSeat(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 p-[2px] flex items-center justify-center">
                <div className="w-full h-full rounded-[14px] bg-[#1a1447] flex items-center justify-center font-bold text-lg text-purple-200">
                  #{selectedSeat.seatNumber}
                </div>
              </div>
              <div>
                <h3 className="font-bold text-base text-white">
                  {selectedSeat.status === 'occupied'
                    ? selectedSeat.participantName
                    : `Seat #${selectedSeat.seatNumber}`}
                </h3>
                <p className="text-xs text-purple-300/80">
                  {selectedSeat.status === 'occupied' ? 'Currently on voice seat' : 'Open seat for party participant'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 mt-4">
              {selectedSeat.status === 'available' ? (
                <button
                  onClick={() => handleOccupySeat(selectedSeat.seatNumber)}
                  disabled={actionLoading}
                  data-action="confirm-take-seat"
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:to-pink-500 active:scale-98 text-white font-bold text-sm shadow-lg shadow-purple-600/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Take Seat #{selectedSeat.seatNumber}
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => handleVacateSeat(selectedSeat.seatNumber)}
                  disabled={actionLoading}
                  data-action="confirm-vacate-seat"
                  className="w-full py-3 px-4 rounded-2xl bg-red-600/80 hover:bg-red-500 active:scale-98 text-white font-bold text-sm shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <LogOut className="w-4 h-4" />
                      Vacate Seat #{selectedSeat.seatNumber}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div
          data-testid="seat-grid-toast"
          className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-purple-950/90 border border-purple-400/50 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-2xl backdrop-blur-md animate-in fade-in zoom-in duration-150 flex items-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* BOTTOM CONTROL BAR (6 Circular Buttons horizontally matching 05_02_seat_grid.png) */}
      <footer className="px-4 pt-2 pb-4 z-20" data-testid="bottom-control-bar">
        <div className="flex items-center justify-between gap-2 max-w-sm mx-auto">
          {/* 1. Mic Button */}
          <button
            onClick={toggleMic}
            data-testid="control-mic"
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 ${
              isMicOn
                ? 'bg-[#b8265f] hover:bg-[#d42d6f] text-white shadow-rose-900/40'
                : 'bg-[#291b52] hover:bg-[#38256e] text-zinc-400 border border-purple-700/40'
            }`}
            title="Toggle Mic"
          >
            {isMicOn ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-zinc-400" />}
          </button>

          {/* 2. Camera Button */}
          <button
            onClick={toggleCamera}
            data-testid="control-camera"
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 ${
              isCameraOn
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/40'
                : 'bg-[#291b52] hover:bg-[#38256e] text-zinc-300 border border-purple-700/40'
            }`}
            title="Toggle Camera"
          >
            {isCameraOn ? <Video className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-zinc-300" />}
          </button>

          {/* 3. Audience/Users Button */}
          <button
            onClick={() => {
              showToast(`Audience count: ${audienceCount} viewers active`);
            }}
            data-testid="control-audience"
            className="w-11 h-11 rounded-full bg-[#291b52] hover:bg-[#38256e] text-zinc-300 border border-purple-700/40 flex items-center justify-center transition-all shadow-lg active:scale-95"
            title="Audience List"
          >
            <Users className="w-5 h-5 text-zinc-300" />
          </button>

          {/* 4. Chat Button 1 */}
          <button
            onClick={() => showToast('Opening Live Chat...')}
            data-testid="control-chat"
            className="w-11 h-11 rounded-full bg-[#291b52] hover:bg-[#38256e] text-zinc-300 border border-purple-700/40 flex items-center justify-center transition-all shadow-lg active:scale-95"
            title="Chat"
          >
            <MessageSquare className="w-5 h-5 text-zinc-300" />
          </button>

          {/* 5. Emotes / Reactions Button */}
          <button
            onClick={() => showToast('❤️ Reaction sent to Party Room!')}
            data-testid="control-emotes"
            className="w-11 h-11 rounded-full bg-[#291b52] hover:bg-[#38256e] text-zinc-300 border border-purple-700/40 flex items-center justify-center transition-all shadow-lg active:scale-95"
            title="Send Reaction"
          >
            <Smile className="w-5 h-5 text-zinc-300" />
          </button>

          {/* 6. Gift Button */}
          <button
            onClick={() => showToast('🎁 Gift Shop coming in Phase 6!')}
            data-testid="control-gift"
            className="w-11 h-11 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white flex items-center justify-center transition-all shadow-lg shadow-pink-500/30 active:scale-95"
            title="Send Gift"
          >
            <Gift className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Footer Reference Banner matching 05_02_seat_grid.png */}
        <div className="mt-3 text-center" data-testid="footer-reference-banner">
          <span className="inline-block px-3 py-1 rounded-full bg-purple-950/80 border border-purple-700/40 text-[11px] font-semibold text-purple-300/90 tracking-wide">
            05_02 Seat Grid
          </span>
        </div>
      </footer>
    </div>
  );
}
