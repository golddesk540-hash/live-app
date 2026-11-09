'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  Grid,
  Power,
  X,
  ArrowUpDown,
  CheckCircle,
  AlertCircle,
  Users,
  Clock,
  Sparkles,
  Loader2,
  ShieldAlert,
  Cast,
} from 'lucide-react';
import {
  PartySeat,
  PartyRoomResponse,
  ReorderSeatsDto,
  TransferHostDto,
  ClosePartyDto,
  generateDefaultSeats,
} from '@/lib/party';

export interface OrderAndClosingScreenProps {
  roomId?: string;
  isHost?: boolean;
  onClose?: () => void;
  isModal?: boolean;
  initialSeats?: PartySeat[];
  onSeatsUpdated?: (seats: PartySeat[]) => void;
  onPartyClosed?: () => void;
}

export default function OrderAndClosingScreen({
  roomId = '7001',
  isHost = true,
  onClose,
  isModal = false,
  initialSeats,
  onSeatsUpdated,
  onPartyClosed,
}: OrderAndClosingScreenProps) {
  const router = useRouter();

  // Active view inside room controls: 'menu' (1:1 reference) | 'order' | 'transfer' | 'closing_confirm' | 'ended'
  const [activeView, setActiveView] = useState<
    'menu' | 'order' | 'transfer' | 'closing_confirm' | 'ended'
  >('menu');

  // Room & Seats state
  const [seats, setSeats] = useState<PartySeat[]>(
    initialSeats && initialSeats.length > 0 ? initialSeats : generateDefaultSeats(roomId)
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [isClosingParty, setIsClosingParty] = useState<boolean>(false);
  const [isReordering, setIsReordering] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Seat Reorder Selection state
  const [selectedFromSeat, setSelectedFromSeat] = useState<number | null>(null);
  const [selectedToSeat, setSelectedToSeat] = useState<number | null>(null);

  // Transfer Host Selection state
  const [selectedTargetSeat, setSelectedTargetSeat] = useState<number | null>(null);

  // Post-close Summary stats
  const [closeSummary, setCloseSummary] = useState<{
    durationSeconds: number;
    durationFormatted: string;
    peakAudience: number;
    totalSeated: number;
  }>({
    durationSeconds: 2715,
    durationFormatted: '45m 15s',
    peakAudience: 256,
    totalSeated: 6,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Fetch current live seats from backend
  useEffect(() => {
    let isMounted = true;
    async function fetchSeats() {
      try {
        const res = await fetch(`/api/party/${roomId}/seats`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.seats) && data.seats.length > 0) {
            if (isMounted) setSeats(data.seats);
          }
        }
      } catch (err) {
        console.warn('Could not fetch remote seats, using local defaults:', err);
      }
    }
    fetchSeats();
    return () => {
      isMounted = false;
    };
  }, [roomId]);

  // Execute Seat Reorder
  const handleReorderConfirm = async () => {
    if (!selectedFromSeat || !selectedToSeat) {
      setErrorMessage('Please select both a source participant seat and a target seat.');
      return;
    }
    if (selectedFromSeat === 1 || selectedToSeat === 1) {
      setErrorMessage('Seat 1 is reserved for the Host and cannot be reordered.');
      return;
    }
    if (selectedFromSeat === selectedToSeat) {
      setErrorMessage('Source and target seat cannot be the same.');
      return;
    }

    setIsReordering(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/party/${roomId}/seats/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromSeat: selectedFromSeat,
          toSeat: selectedToSeat,
          isHostAction: isHost,
          preview: 'demo',
        }),
      });

      const data = await res.json();

      if (data.success) {
        const updatedSeats = data.seats || seats;
        setSeats(updatedSeats);
        if (onSeatsUpdated) onSeatsUpdated(updatedSeats);
        showToast(data.message || `Swapped Seat ${selectedFromSeat} and Seat ${selectedToSeat}!`);
        setSelectedFromSeat(null);
        setSelectedToSeat(null);
        setActiveView('menu');
      } else {
        setErrorMessage(data.error || 'Failed to reorder seats');
      }
    } catch (err: any) {
      setErrorMessage('Network error while reordering seats');
    } finally {
      setIsReordering(false);
    }
  };

  // Execute Host Transfer
  const handleTransferHostConfirm = async () => {
    if (!selectedTargetSeat) {
      setErrorMessage('Please select an active seated participant to become the new host.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/party/${roomId}/transfer-host`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetSeatNumber: selectedTargetSeat,
          isHostAction: isHost,
          preview: 'demo',
        }),
      });

      const data = await res.json();

      if (data.success) {
        const updatedSeats = data.seats || seats;
        setSeats(updatedSeats);
        if (onSeatsUpdated) onSeatsUpdated(updatedSeats);
        showToast(data.message || `Host transferred successfully!`);
        setSelectedTargetSeat(null);
        setActiveView('menu');
      } else {
        setErrorMessage(data.error || 'Failed to transfer host');
      }
    } catch (err) {
      setErrorMessage('Network error while transferring host');
    } finally {
      setLoading(false);
    }
  };

  // Execute End Party / Close Room
  const handleClosePartyConfirm = async () => {
    setIsClosingParty(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/party/${roomId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: 'Host ended party',
          isHostAction: isHost,
          preview: 'demo',
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (data.summary) {
          setCloseSummary({
            durationSeconds: data.summary.durationSeconds || 2715,
            durationFormatted: data.summary.durationFormatted || '45m 15s',
            peakAudience: data.summary.peakAudience || 256,
            totalSeated: data.summary.totalSeated || 6,
          });
        }
        showToast('Party successfully ended. Room is now closed.');
        if (onPartyClosed) onPartyClosed();
        setActiveView('ended');
      } else {
        setErrorMessage(data.error || 'Failed to close party room');
      }
    } catch (err) {
      setErrorMessage('Network error while closing party');
    } finally {
      setIsClosingParty(false);
    }
  };

  // Participants available for transfer (Seats 2-9 occupied)
  const eligibleTransferParticipants = seats.filter(
    (s) => s.seatNumber >= 2 && s.seatNumber <= 9 && s.status === 'occupied' && s.participantId
  );

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-3 sm:p-6 text-white font-sans select-none relative overflow-x-hidden"
      style={{
        background: 'linear-gradient(180deg, #070415 0%, #120a2e 45%, #080518 100%)',
      }}
      data-testid="order-and-closing-container"
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

      {/* MOBILE DEVICE SHELL MATCHING 05_08_order_and_closing.png (301x506 proportions) */}
      <div className="w-full max-w-[360px] rounded-[38px] p-2 bg-[#05030f] border-4 border-zinc-800 shadow-[0_20px_60px_rgba(0,0,0,0.85)] relative flex flex-col min-h-[580px] overflow-hidden">
        {/* Inner Phone Screen */}
        <div
          className="w-full flex-1 rounded-[32px] overflow-hidden flex flex-col relative"
          style={{
            background:
              'linear-gradient(180deg, #0B081B 0%, #130e2d 35%, #18113b 65%, #0B081B 100%)',
          }}
        >
          {/* Top Status Bar (9:41, Cellular, WiFi/flash, Battery) */}
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
          <header className="px-4 py-2.5 flex items-center justify-between z-20">
            <button
              onClick={() => {
                if (onClose) {
                  onClose();
                } else if (activeView !== 'menu') {
                  setActiveView('menu');
                } else {
                  router.push(`/party/room/${roomId}`);
                }
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

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 px-4 py-3 flex flex-col justify-center relative z-20">
            {/* 1. ROOM CONTROLS MENU (1:1 STRICT MATCH TO 05_08_order_and_closing.png) */}
            {activeView === 'menu' && (
              <div
                className="w-full rounded-[26px] p-5 shadow-2xl relative border border-white/10 transition-all"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(29, 23, 56, 0.94) 0%, rgba(20, 16, 42, 0.96) 100%)',
                  boxShadow:
                    '0 15px 35px -5px rgba(0, 0, 0, 0.7), 0 0 25px rgba(124, 58, 237, 0.15)',
                }}
                data-testid="room-controls-card"
              >
                {/* Modal Title & Close Button */}
                <div className="flex items-center justify-between mb-5">
                  <h2
                    className="text-[19px] font-bold text-white tracking-tight"
                    data-testid="room-controls-title"
                  >
                    Room Controls
                  </h2>
                  <button
                    onClick={() => {
                      if (onClose) onClose();
                      else router.push(`/party/room/${roomId}`);
                    }}
                    data-action="close-modal"
                    className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Control Rows */}
                <div className="space-y-3">
                  {/* ROW 1: Seat Order */}
                  <button
                    onClick={() => {
                      setSelectedFromSeat(null);
                      setSelectedToSeat(null);
                      setActiveView('order');
                    }}
                    data-action="open-seat-order"
                    data-testid="row-seat-order"
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#261f49]/80 hover:bg-[#322960]/90 border border-white/5 active:scale-[0.98] transition-all group"
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Neon Blue/Purple Grid Icon */}
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/25 to-purple-600/35 border border-indigo-400/40 flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.35)]">
                        <Grid className="w-5 h-5 text-indigo-300 group-hover:scale-110 transition-transform" />
                      </div>
                      <span className="text-[15px] font-semibold text-white tracking-tight">
                        Seat Order
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* ROW 2: Transfer Host */}
                  <button
                    onClick={() => {
                      setSelectedTargetSeat(null);
                      setActiveView('transfer');
                    }}
                    data-action="open-transfer-host"
                    data-testid="row-transfer-host"
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#261f49]/80 hover:bg-[#322960]/90 border border-white/5 active:scale-[0.98] transition-all group"
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Neon Pink/Gold Crown Icon */}
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/25 to-purple-600/35 border border-pink-400/40 flex items-center justify-center shadow-[0_0_12px_rgba(236,72,153,0.35)]">
                        <Crown className="w-5 h-5 text-pink-300 group-hover:scale-110 transition-transform" />
                      </div>
                      <span className="text-[15px] font-semibold text-white tracking-tight">
                        Transfer Host
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* ROW 3: Close Party */}
                  <button
                    onClick={() => setActiveView('closing_confirm')}
                    data-action="open-close-party"
                    data-testid="row-close-party"
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#2c152a]/70 hover:bg-[#3c1839]/90 border border-red-500/20 active:scale-[0.98] transition-all group"
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Red Power Icon */}
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/25 to-rose-600/35 border border-red-500/40 flex items-center justify-center shadow-[0_0_12px_rgba(239,68,68,0.35)]">
                        <Power className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <span className="text-[15px] font-bold text-red-500 tracking-tight">
                        Close Party
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-red-400/80 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {/* 2. SUB-VIEW: SEAT ORDER MANAGEMENT */}
            {activeView === 'order' && (
              <div
                className="w-full rounded-[26px] p-4 shadow-2xl relative border border-white/10 flex flex-col max-h-[460px] overflow-hidden"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(29, 23, 56, 0.96) 0%, rgba(20, 16, 42, 0.98) 100%)',
                }}
                data-testid="seat-order-management-card"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveView('menu')}
                      className="p-1 rounded-full text-zinc-400 hover:text-white"
                      data-action="order-back-to-menu"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <h3 className="font-bold text-[16px] text-white">Reorder Seats</h3>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300 font-medium border border-purple-500/30">
                    Host Only
                  </span>
                </div>

                {/* Instruction banner */}
                <p className="text-[11px] text-zinc-300 mb-2 leading-relaxed">
                  Select an occupied seat (2–9) then choose destination seat to swap or move.
                  <span className="text-amber-300 font-semibold block">
                    👑 Seat 1 is protected for Host Maria Live.
                  </span>
                </p>

                {/* 9 Seats List */}
                <div className="space-y-1.5 overflow-y-auto pr-1 flex-1 max-h-[250px] scrollbar-thin">
                  {seats.map((seat) => {
                    const isSeat1 = seat.seatNumber === 1;
                    const isFromSelected = selectedFromSeat === seat.seatNumber;
                    const isToSelected = selectedToSeat === seat.seatNumber;
                    const isOccupied = seat.status === 'occupied' && !!seat.participantId;

                    return (
                      <div
                        key={seat.seatNumber}
                        onClick={() => {
                          if (isSeat1) return; // Protected Seat 1 cannot be touched
                          if (!selectedFromSeat) {
                            if (isOccupied) {
                              setSelectedFromSeat(seat.seatNumber);
                            } else {
                              showToast(`Seat ${seat.seatNumber} is empty. Select an occupied seat first.`);
                            }
                          } else if (selectedFromSeat === seat.seatNumber) {
                            setSelectedFromSeat(null);
                          } else {
                            setSelectedToSeat(seat.seatNumber);
                          }
                        }}
                        data-testid={`seat-order-item-${seat.seatNumber}`}
                        className={`p-2 rounded-xl flex items-center justify-between transition-all cursor-pointer border ${
                          isSeat1
                            ? 'bg-amber-950/30 border-amber-500/30 cursor-not-allowed opacity-90'
                            : isFromSelected
                            ? 'bg-indigo-600/40 border-indigo-400 ring-2 ring-indigo-400/50 shadow-lg'
                            : isToSelected
                            ? 'bg-pink-600/40 border-pink-400 ring-2 ring-pink-400/50 shadow-lg'
                            : 'bg-white/5 hover:bg-white/10 border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              isSeat1
                                ? 'bg-amber-500 text-black'
                                : 'bg-purple-900/80 text-purple-200'
                            }`}
                          >
                            {seat.seatNumber}
                          </span>

                          <div className="relative w-7 h-7 rounded-full overflow-hidden bg-purple-950/80 border border-white/20">
                            {isOccupied && seat.participantAvatar ? (
                              <Image
                                src={seat.participantAvatar}
                                alt={seat.participantName || 'User'}
                                fill
                                sizes="28px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-500">
                                ✕
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-white leading-tight flex items-center gap-1">
                              {seat.participantName || `Seat ${seat.seatNumber} (Empty)`}
                              {isSeat1 && <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />}
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              {isSeat1
                                ? 'Host • Protected'
                                : isOccupied
                                ? 'Occupied'
                                : 'Available for Move'}
                            </span>
                          </div>
                        </div>

                        {/* Status / Selection badge */}
                        <div>
                          {isSeat1 ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                              Locked
                            </span>
                          ) : isFromSelected ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500 text-white font-bold animate-pulse">
                              From
                            </span>
                          ) : isToSelected ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500 text-white font-bold">
                              To
                            </span>
                          ) : isOccupied ? (
                            <span className="text-[10px] text-zinc-400">Tap to Pick</span>
                          ) : (
                            <span className="text-[10px] text-emerald-400">Empty</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Action buttons */}
                <div className="pt-3 border-t border-white/10 mt-2 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedFromSeat(null);
                      setSelectedToSeat(null);
                    }}
                    className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-zinc-300 transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleReorderConfirm}
                    disabled={!selectedFromSeat || !selectedToSeat || isReordering}
                    data-testid="btn-confirm-reorder"
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-purple-900/40 flex items-center justify-center gap-1.5 transition-all"
                  >
                    {isReordering ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    )}
                    Confirm Swap
                  </button>
                </div>
              </div>
            )}

            {/* 3. SUB-VIEW: TRANSFER HOST PRIVILEGES */}
            {activeView === 'transfer' && (
              <div
                className="w-full rounded-[26px] p-4 shadow-2xl relative border border-white/10 flex flex-col max-h-[460px] overflow-hidden"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(29, 23, 56, 0.96) 0%, rgba(20, 16, 42, 0.98) 100%)',
                }}
                data-testid="transfer-host-card"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveView('menu')}
                      className="p-1 rounded-full text-zinc-400 hover:text-white"
                      data-action="transfer-back-to-menu"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <h3 className="font-bold text-[16px] text-white">Transfer Host</h3>
                  </div>
                  <Crown className="w-4 h-4 text-pink-400" />
                </div>

                <p className="text-[11px] text-zinc-300 mb-2 leading-relaxed">
                  Choose an active participant from seats 2–9 to transfer host controls.
                </p>

                {/* List of eligible participants */}
                <div className="space-y-1.5 overflow-y-auto pr-1 flex-1 max-h-[250px] scrollbar-thin">
                  {eligibleTransferParticipants.length === 0 ? (
                    <div className="py-8 text-center text-zinc-400 text-xs">
                      No seated participants currently in seats 2–9.
                    </div>
                  ) : (
                    eligibleTransferParticipants.map((seat) => {
                      const isSelected = selectedTargetSeat === seat.seatNumber;
                      return (
                        <div
                          key={seat.seatNumber}
                          onClick={() => setSelectedTargetSeat(seat.seatNumber)}
                          data-testid={`transfer-candidate-${seat.seatNumber}`}
                          className={`p-2.5 rounded-xl flex items-center justify-between border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-pink-600/40 border-pink-400 ring-2 ring-pink-400/40 shadow-lg'
                              : 'bg-white/5 hover:bg-white/10 border-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-full bg-purple-900/70 text-purple-200 text-xs font-bold flex items-center justify-center">
                              {seat.seatNumber}
                            </span>
                            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-purple-950/80 border border-white/20">
                              {seat.participantAvatar ? (
                                <Image
                                  src={seat.participantAvatar}
                                  alt={seat.participantName || 'User'}
                                  fill
                                  sizes="32px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs">
                                  👤
                                </div>
                              )}
                            </div>
                            <span className="text-xs font-semibold text-white">
                              {seat.participantName}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              isSelected
                                ? 'bg-pink-500 text-white'
                                : 'bg-white/10 text-zinc-400'
                            }`}
                          >
                            {isSelected ? 'Selected' : 'Select'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="pt-3 border-t border-white/10 mt-2 flex items-center gap-2">
                  <button
                    onClick={() => setActiveView('menu')}
                    className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-zinc-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTransferHostConfirm}
                    disabled={!selectedTargetSeat || loading}
                    data-testid="btn-confirm-transfer-host"
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 text-xs font-bold text-white shadow-lg flex items-center justify-center gap-1.5"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crown className="w-3.5 h-3.5" />}
                    Confirm Transfer
                  </button>
                </div>
              </div>
            )}

            {/* 4. SUB-VIEW: CLOSE PARTY CONFIRMATION DIALOG */}
            {activeView === 'closing_confirm' && (
              <div
                className="w-full rounded-[26px] p-5 shadow-2xl relative border border-red-500/30 flex flex-col items-center text-center animate-in zoom-in-95 duration-150"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(38, 14, 28, 0.96) 0%, rgba(20, 10, 20, 0.98) 100%)',
                  boxShadow: '0 20px 40px rgba(239, 68, 68, 0.25)',
                }}
                data-testid="end-party-confirmation-modal"
              >
                {/* Warning Icon */}
                <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(239,68,68,0.35)]">
                  <Power className="w-7 h-7 text-red-500" />
                </div>

                <h3 className="text-lg font-bold text-white mb-1.5" data-testid="end-party-heading">
                  End Party?
                </h3>
                <p className="text-xs text-zinc-300 mb-5 leading-relaxed px-2">
                  Are you sure you want to end the party? This will close the room for all 9 seats
                  and audience members, release Agora media, and cancel all pending requests.
                </p>

                <div className="w-full space-y-2">
                  <button
                    onClick={handleClosePartyConfirm}
                    disabled={isClosingParty}
                    data-action="confirm-close-party"
                    data-testid="btn-end-party"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 disabled:opacity-50 text-sm font-bold text-white shadow-lg shadow-red-900/50 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                  >
                    {isClosingParty ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Power className="w-4 h-4" />
                    )}
                    End Party Now
                  </button>

                  <button
                    onClick={() => setActiveView('menu')}
                    data-action="cancel-close-party"
                    data-testid="btn-cancel-close-party"
                    className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-zinc-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* 5. SUB-VIEW: POST-CLOSE SUMMARY / PARTY ENDED */}
            {activeView === 'ended' && (
              <div
                className="w-full rounded-[26px] p-5 shadow-2xl relative border border-purple-500/30 flex flex-col items-center text-center animate-in zoom-in-95 duration-200"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(29, 23, 56, 0.96) 0%, rgba(18, 14, 38, 0.98) 100%)',
                }}
                data-testid="party-ended-summary"
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(168,85,247,0.35)]">
                  <Sparkles className="w-6 h-6 text-purple-300" />
                </div>

                <h3 className="text-lg font-bold text-white mb-1">Party Ended</h3>
                <p className="text-xs text-zinc-400 mb-4">
                  The session has closed for all participants.
                </p>

                {/* Summary Grid */}
                <div className="w-full grid grid-cols-3 gap-2 p-3 rounded-2xl bg-white/5 border border-white/5 mb-4 text-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-400 font-medium">Duration</span>
                    <span className="text-xs font-bold text-purple-300 mt-0.5">
                      {closeSummary.durationFormatted}
                    </span>
                  </div>
                  <div className="flex flex-col border-x border-white/10">
                    <span className="text-[10px] text-zinc-400 font-medium">Peak</span>
                    <span className="text-xs font-bold text-pink-300 mt-0.5">
                      {closeSummary.peakAudience}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-400 font-medium">Seated</span>
                    <span className="text-xs font-bold text-indigo-300 mt-0.5">
                      {closeSummary.totalSeated}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => router.push('/party')}
                  data-testid="btn-return-party-discovery"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-xs font-bold text-white shadow-lg transition-all"
                >
                  Return to Party Discovery
                </button>
              </div>
            )}
          </main>

          {/* FOOTER WATERMARK MATCHING 05_08_order_and_closing.png */}
          <footer
            className="pb-3 pt-1 px-4 flex justify-center z-20"
            data-testid="footer-reference-banner"
          >
            <div className="px-4 py-1.5 rounded-full bg-purple-950/70 border border-purple-600/30 text-[12px] font-bold text-white/90 tracking-wide shadow-md">
              05_08 Order and Closing
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
