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
  Send,
  UserPlus,
  Clock,
  Check,
  ShieldAlert,
} from 'lucide-react';
import {
  PartySeat,
  PartyRoomResponse,
  PartySeatRequest,
  PartySeatInvitation,
} from '@/lib/party';

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

  // Seat Requests & Invitations State (Module 5.3)
  const [seatRequests, setSeatRequests] = useState<PartySeatRequest[]>([]);
  const [seatInvitations, setSeatInvitations] = useState<PartySeatInvitation[]>([]);
  const [isRequestPanelOpen, setIsRequestPanelOpen] = useState<boolean>(true); // Open by default matching 05_03
  const [panelTab, setPanelTab] = useState<'requests' | 'invite'>('requests');
  const [inviteTargetSeat, setInviteTargetSeat] = useState<number>(2);

  // Local device media toggles
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(false);
  const [audienceCount, setAudienceCount] = useState<number>(256);

  // Interactive UI modals
  const [selectedSeat, setSelectedSeat] = useState<PartySeat | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Viewer pending request tracker (tracks if current user requested a seat)
  const [myPendingSeat, setMyPendingSeat] = useState<number | null>(null);

  // Audience roster for host invitation
  const eligibleAudience = [
    { id: 'aud_kenji', name: 'Kenji R', avatar: '/assets/studio/user_avatar_1.png' },
    { id: 'aud_chloe', name: 'Chloe Pop', avatar: '/assets/studio/user_avatar_2.png' },
    { id: 'aud_sammy', name: 'Sammy VIP', avatar: '/assets/studio/user_avatar_3.png' },
    { id: 'aud_luna', name: 'Luna Glow', avatar: '/assets/studio/user_avatar_1.png' },
    { id: 'aud_david', name: 'David Cool', avatar: '/assets/studio/user_avatar_2.png' },
  ];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch Room, Seats, and Requests
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
      }

      // Fetch Seat Requests & Invitations (Module 5.3)
      const reqRes = await fetch(`/api/party/${roomId}/seats/requests`);
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        if (reqData.success) {
          setSeatRequests(reqData.requests || []);
          setSeatInvitations(reqData.invitations || []);
        }
      }
    } catch (err: any) {
      console.error('Error fetching room/seats/requests:', err);
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
        // Poll Seat Status
        const statusRes = await fetch(`/api/party/${roomId}/seats/status`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.success && Array.isArray(statusData.seats)) {
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

        // Poll Requests & Invitations (Module 5.3)
        const reqRes = await fetch(`/api/party/${roomId}/seats/requests`);
        if (reqRes.ok) {
          const reqData = await reqRes.json();
          if (reqData.success) {
            setSeatRequests(reqData.requests || []);
            setSeatInvitations(reqData.invitations || []);
          }
        }
      } catch (pollErr) {
        // silent polling catch
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [roomId]);

  // 3. Viewer Request Seat Action (Module 5.3)
  const handleRequestSeat = async (seatNumber: number) => {
    if (seatNumber === 1) {
      showToast('Seat 1 is reserved exclusively for Host Maria Live.');
      return;
    }

    setActionLoading(true);
    try {
      const demoNames = ['Kenji R', 'Sammy VIP', 'Chloe Pop', 'Luna Glow', 'Alex Star', 'David Cool'];
      const myName = demoNames[(seatNumber - 2) % demoNames.length];
      const myId = `user_${seatNumber}_${Date.now().toString().slice(-4)}`;
      const myAvatar = `/assets/studio/user_avatar_${((seatNumber % 3) + 1)}.png`;

      const res = await fetch(`/api/party/${roomId}/seats/request?preview=demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatNumber,
          userId: myId,
          userName: myName,
          userAvatar: myAvatar,
          preview: 'demo',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMyPendingSeat(seatNumber);
        showToast(`📨 Seat request for Seat #${seatNumber} sent to host!`);
        setIsRequestPanelOpen(true);
        await loadRoomAndSeats();
        setSelectedSeat(null);
      } else {
        showToast(data.error || 'Failed to request seat.');
      }
    } catch (err: any) {
      showToast('Network error while requesting seat.');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Host Accept / Reject Seat Request Action (Module 5.3)
  const handleRespondRequest = async (requestId: string, action: 'accept' | 'reject') => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/party/${roomId}/seats/requests/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          action,
          isHostAction: true,
          preview: true,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          action === 'accept'
            ? `✅ Request accepted! Participant placed on seat.`
            : `❌ Seat request rejected.`
        );
        await loadRoomAndSeats();
      } else {
        showToast(data.error || 'Failed to respond to seat request.');
      }
    } catch (err: any) {
      showToast('Network error while responding to request.');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Host Send Invitation Action (Module 5.3)
  const handleSendInvitation = async (seatNumber: number, viewer: { id: string; name: string; avatar: string }) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/party/${roomId}/seats/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatNumber,
          invitedUserId: viewer.id,
          invitedUserName: viewer.name,
          invitedUserAvatar: viewer.avatar,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`🎉 Invitation sent to ${viewer.name} for Seat #${seatNumber}!`);
        await loadRoomAndSeats();
      } else {
        showToast(data.error || 'Failed to send invitation.');
      }
    } catch (err: any) {
      showToast('Network error sending invitation.');
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Viewer Respond to Invitation Action (Module 5.3)
  const handleRespondInvitation = async (invitationId: string, action: 'accept' | 'decline') => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/party/${roomId}/seats/invite/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId,
          action,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          action === 'accept'
            ? `🎉 Invitation accepted! Welcome to the seat.`
            : `Invitation declined.`
        );
        await loadRoomAndSeats();
      } else {
        showToast(data.error || 'Failed to respond to invitation.');
      }
    } catch (err: any) {
      showToast('Network error responding to invitation.');
    } finally {
      setActionLoading(false);
    }
  };

  // 7. Direct Take Seat Action (Module 5.2 backward compatibility & testing)
  const handleOccupySeat = async (seatNumber: number) => {
    if (seatNumber === 1) {
      showToast('Seat 1 is reserved exclusively for Host Maria Live.');
      return;
    }

    setActionLoading(true);
    try {
      const demoNames = ['Alex Star', 'Luna Glow', 'Kenji R', 'Sammy VIP', 'Chloe Pop', 'David Cool'];
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

  // 8. Vacate Seat Action
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

  // 9. Media toggles
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

  // Available seats for invitation selector
  const availableSeatNumbers = displaySeats.filter((s) => s.seatNumber >= 2 && s.status === 'available').map((s) => s.seatNumber);

  return (
    <div className="min-h-screen bg-[#050224] text-white flex flex-col justify-between max-w-sm sm:max-w-md mx-auto select-none font-sans relative overflow-hidden shadow-2xl border-x border-[#1c184d]">
      {/* Ambient background glows matching 05_03_taking_a_seat_request_invite.png */}
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

          {/* Audience Count Pill with Incoming Requests indicator */}
          <button
            onClick={() => setIsRequestPanelOpen(!isRequestPanelOpen)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-900/60 hover:bg-purple-800/80 border border-purple-500/30 text-xs text-purple-200 transition-all cursor-pointer"
            title="Toggle Seat Requests Panel"
            data-testid="request-panel-toggle"
          >
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-semibold text-xs" data-testid="audience-count">
              {audienceCount}
            </span>
            {seatRequests.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* INCOMING INVITATION BANNER (Module 5.3) */}
      {seatInvitations.length > 0 && (
        <div
          data-testid="invitation-banner"
          className="mx-4 my-1 p-3 rounded-2xl bg-gradient-to-r from-purple-900/90 via-pink-950/90 to-purple-900/90 border border-pink-500/50 shadow-xl backdrop-blur-md z-30 flex items-center justify-between animate-in fade-in zoom-in duration-200"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-pink-500/20 border border-pink-400/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-pink-300" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                Host Maria Live invited you to Seat #{seatInvitations[0].seatNumber}!
              </p>
              <p className="text-[10px] text-pink-200/80">Invitation expires in 2 minutes</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleRespondInvitation(seatInvitations[0].id, 'accept')}
              data-action="accept-invitation"
              className="px-2.5 py-1 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1"
            >
              <Check className="w-3 h-3" /> Accept
            </button>
            <button
              onClick={() => handleRespondInvitation(seatInvitations[0].id, 'decline')}
              data-action="decline-invitation"
              className="p-1 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300"
              title="Decline"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* MAIN 9-SEAT 3x3 GRID */}
      <main className="px-4 py-2 flex flex-col justify-center z-20" data-testid="nine-seat-grid">
        <div className="grid grid-cols-3 gap-3">
          {displaySeats.map((seat) => {
            const isHostSeat = seat.seatNumber === 1;
            const isOccupied = seat.status === 'occupied';
            const hasPendingRequest = seatRequests.some((r) => r.seatNumber === seat.seatNumber);

            if (isHostSeat) {
              // SEAT 1: HOST SEAT
              return (
                <div
                  key={seat.seatNumber}
                  data-testid="seat-1-host"
                  data-seat-number="1"
                  className="aspect-square rounded-2xl relative overflow-hidden bg-gradient-to-b from-[#22164f] to-[#120b33] border-2 border-purple-400/90 shadow-xl shadow-purple-600/30 ring-2 ring-purple-500/40 flex flex-col justify-between p-2 group transition-all"
                >
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

                  <div className="relative z-10 flex items-center justify-between w-full">
                    <span className="text-[11px] font-bold text-amber-300 px-1.5 py-0.5 rounded-full bg-black/50 backdrop-blur-sm border border-amber-400/30 flex items-center gap-1">
                      👑 1
                    </span>
                    <div className="w-5 h-5 rounded-full bg-emerald-500/90 text-white flex items-center justify-center shadow-md shadow-emerald-500/40">
                      <Mic className="w-3 h-3 text-white" />
                    </div>
                  </div>

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

            // OCCUPIED PARTICIPANT SEAT
            if (isOccupied) {
              return (
                <div
                  key={seat.seatNumber}
                  data-testid={`seat-${seat.seatNumber}-occupied`}
                  data-seat-number={seat.seatNumber}
                  onClick={() => setSelectedSeat(seat)}
                  className="aspect-square rounded-2xl relative overflow-hidden bg-gradient-to-b from-[#22164f] to-[#120b33] border border-purple-500/50 shadow-lg shadow-purple-900/30 flex flex-col justify-between p-2 cursor-pointer group hover:border-pink-500/70 transition-all"
                >
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

                  <div className="relative z-10 flex flex-col items-center">
                    <span className="text-xs font-semibold text-white/95 truncate max-w-full drop-shadow-md">
                      {seat.participantName || `User ${seat.seatNumber}`}
                    </span>
                  </div>
                </div>
              );
            }

            // AVAILABLE EMPTY SEAT
            return (
              <div
                key={seat.seatNumber}
                data-testid={`seat-${seat.seatNumber}-empty`}
                data-seat-number={seat.seatNumber}
                onClick={() => setSelectedSeat(seat)}
                className={`aspect-square rounded-2xl bg-[#141038]/80 hover:bg-[#1b154b] border ${
                  hasPendingRequest ? 'border-pink-500/80 shadow-pink-500/20' : 'border-[#2a225c] hover:border-purple-500/50'
                } shadow-inner shadow-purple-950/60 backdrop-blur-md flex flex-col items-center justify-between p-2 cursor-pointer transition-all group active:scale-95 relative`}
              >
                {/* Pending Request Indicator Badge */}
                {hasPendingRequest && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-pink-600 border border-pink-300 text-[9px] font-bold text-white shadow-md animate-pulse">
                    Request
                  </span>
                )}

                <span className="text-xs font-semibold text-purple-300/70 group-hover:text-purple-200">
                  {seat.seatNumber}
                </span>

                <div
                  className="w-10 h-10 rounded-full bg-[#352563] group-hover:bg-[#483385] text-purple-200 group-hover:text-white flex items-center justify-center shadow-md shadow-purple-950/70 border border-purple-400/20 group-hover:scale-105 transition-all"
                  data-action="add-participant"
                >
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>

                <span className="text-[10px] text-zinc-500 group-hover:text-purple-300 transition-colors">
                  {hasPendingRequest ? '1 Pending' : 'Available'}
                </span>
              </div>
            );
          })}
        </div>
      </main>

      {/* INCOMING SEAT REQUEST & INVITATION PANEL matching 05_03_taking_a_seat_request_invite.png */}
      {isRequestPanelOpen && (
        <section
          data-testid="seat-request-panel"
          className="mx-4 my-2 rounded-2xl bg-[#16113a]/95 border border-[#2f2268] p-3 shadow-2xl backdrop-blur-md z-20 relative animate-in slide-in-from-bottom-2 duration-200"
        >
          {/* Header & Tabs */}
          <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-purple-900/40">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPanelTab('requests')}
                data-action="tab-requests"
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  panelTab === 'requests'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'bg-white/5 text-purple-300/70 hover:text-white'
                }`}
              >
                <span>Seat Requests</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px]" data-testid="request-count-badge">
                  {seatRequests.length}
                </span>
              </button>

              <button
                onClick={() => setPanelTab('invite')}
                data-action="tab-invite"
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  panelTab === 'invite'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'bg-white/5 text-purple-300/70 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite Audience</span>
              </button>
            </div>

            <button
              onClick={() => setIsRequestPanelOpen(false)}
              className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white flex items-center justify-center text-xs"
              title="Close Panel"
            >
              ✕
            </button>
          </div>

          {/* TAB 1: INCOMING REQUESTS (Matching 05_03 exactly) */}
          {panelTab === 'requests' && (
            <div className="space-y-2">
              {seatRequests.length === 0 ? (
                <div className="py-4 text-center text-xs text-purple-300/60" data-testid="no-requests-msg">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-purple-400/40" />
                  No pending seat requests. Viewers can tap an empty seat to request.
                </div>
              ) : (
                seatRequests.map((req) => (
                  <div
                    key={req.id}
                    data-testid={`request-item-${req.id}`}
                    data-request-id={req.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#211950]/90 border border-purple-500/30 hover:border-purple-400/50 shadow-md transition-all"
                  >
                    {/* User Info */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-purple-950 border border-purple-400/40 shrink-0">
                        <Image
                          src={req.userAvatar || '/assets/studio/user_avatar_1.png'}
                          alt={req.userName}
                          width={36}
                          height={36}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as any).src = '/assets/studio/user_avatar_1.png';
                          }}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white" data-testid="request-user-name">
                            {req.userName}
                          </span>
                          <span className="px-1.5 py-0.2 rounded-md bg-purple-800/80 border border-purple-400/30 text-[10px] font-bold text-purple-200">
                            Seat #{req.seatNumber}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5 text-pink-400" /> Pending host approval
                        </span>
                      </div>
                    </div>

                    {/* Host Action Buttons (Accept / Reject) */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleRespondRequest(req.id, 'accept')}
                        disabled={actionLoading}
                        data-action="accept-request"
                        className="py-1 px-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" /> Accept
                      </button>

                      <button
                        onClick={() => handleRespondRequest(req.id, 'reject')}
                        disabled={actionLoading}
                        data-action="reject-request"
                        className="py-1 px-2.5 rounded-lg bg-white/10 hover:bg-red-500/20 text-zinc-300 hover:text-red-300 border border-white/15 text-xs font-semibold active:scale-95 transition-all disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: INVITE VIEWERS */}
          {panelTab === 'invite' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-purple-200 mb-1">
                <span>Select seat to invite to:</span>
                <select
                  value={inviteTargetSeat}
                  onChange={(e) => setInviteTargetSeat(Number(e.target.value))}
                  data-testid="invite-seat-selector"
                  className="bg-[#241a54] border border-purple-500/40 rounded-lg px-2 py-0.5 text-xs text-white focus:outline-none"
                >
                  {availableSeatNumbers.length === 0 ? (
                    <option value="">No available seats</option>
                  ) : (
                    availableSeatNumbers.map((num) => (
                      <option key={num} value={num}>
                        Seat #{num}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {eligibleAudience.map((viewer) => (
                  <div
                    key={viewer.id}
                    data-testid={`audience-row-${viewer.id}`}
                    className="flex items-center justify-between p-1.5 rounded-xl bg-[#211950]/80 border border-purple-900/40"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full overflow-hidden bg-purple-950 border border-purple-500/30">
                        <Image
                          src={viewer.avatar}
                          alt={viewer.name}
                          width={28}
                          height={28}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-xs font-medium text-white">{viewer.name}</span>
                    </div>

                    <button
                      onClick={() => handleSendInvitation(inviteTargetSeat, viewer)}
                      disabled={actionLoading || availableSeatNumbers.length === 0}
                      data-action="send-invitation"
                      className="py-1 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold text-xs transition-all disabled:opacity-50 flex items-center gap-1"
                    >
                      <UserPlus className="w-3 h-3" /> Invite
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* SEAT MODAL (Viewer Request & Host Occupy / Vacate Drawer) */}
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
                  {selectedSeat.status === 'occupied'
                    ? 'Currently on voice seat'
                    : 'Available participant seat'}
                </p>
              </div>
            </div>

            {/* Actions for Available Seat */}
            <div className="space-y-2 mt-4">
              {selectedSeat.status === 'available' ? (
                <>
                  {/* Primary Action: Request Seat (Module 5.3) */}
                  <button
                    onClick={() => handleRequestSeat(selectedSeat.seatNumber)}
                    disabled={actionLoading}
                    data-action="request-seat"
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:to-pink-500 active:scale-98 text-white font-bold text-sm shadow-lg shadow-purple-600/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Request Seat #{selectedSeat.seatNumber}
                      </>
                    )}
                  </button>

                  {/* Direct Take Seat (Testing / Demo fallback from Module 5.2) */}
                  <button
                    onClick={() => handleOccupySeat(selectedSeat.seatNumber)}
                    disabled={actionLoading}
                    data-action="confirm-take-seat"
                    className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 active:scale-98 text-purple-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Direct Join (Host/Demo)
                  </button>
                </>
              ) : (
                /* Vacate Seat Button */
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

      {/* BOTTOM CONTROL BAR (6 Circular Buttons matching 05_03_taking_a_seat_request_invite.png) */}
      <footer className="px-4 pt-1 pb-3 z-20" data-testid="bottom-control-bar">
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

          {/* 3. Audience/Users Button (Opens Seat Requests Panel) */}
          <button
            onClick={() => setIsRequestPanelOpen(!isRequestPanelOpen)}
            data-testid="control-audience"
            className="w-11 h-11 rounded-full bg-[#291b52] hover:bg-[#38256e] text-zinc-300 border border-purple-700/40 flex items-center justify-center transition-all shadow-lg active:scale-95 relative"
            title="Audience & Seat Requests"
          >
            <Users className="w-5 h-5 text-zinc-300" />
            {seatRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-500 text-[10px] font-bold text-white flex items-center justify-center">
                {seatRequests.length}
              </span>
            )}
          </button>

          {/* 4. Chat Button */}
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

        {/* Footer Reference Banner matching 05_03_taking_a_seat_request_invite.png */}
        <div className="mt-2 text-center" data-testid="footer-reference-banner">
          <span className="inline-block px-3 py-1 rounded-full bg-purple-950/80 border border-purple-700/40 text-[11px] font-semibold text-purple-300/90 tracking-wide">
            05_03 Taking a Seat (Request / Invite)
          </span>
        </div>
      </footer>
    </div>
  );
}
