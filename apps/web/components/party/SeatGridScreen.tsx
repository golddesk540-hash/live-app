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
  Volume2,
  VolumeX,
  MoreHorizontal,
  Plus,
  Cast,
  Sparkles,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  LogOut,
  Send,
  UserPlus,
  Clock,
  Check,
  ShieldAlert,
  ShieldCheck,
  SwitchCamera,
  RotateCcw,
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected seat for modal (request, occupy, vacate, media actions)
  const [selectedSeat, setSelectedSeat] = useState<PartySeat | null>(null);

  // Module 5.3 Seat Requests and Invitations state
  const [seatRequests, setSeatRequests] = useState<PartySeatRequest[]>([]);
  const [seatInvitations, setSeatInvitations] = useState<PartySeatInvitation[]>([]);
  const [isRequestPanelOpen, setIsRequestPanelOpen] = useState<boolean>(false);
  const [panelTab, setPanelTab] = useState<'requests' | 'invite'>('requests');
  const [inviteTargetSeat, setInviteTargetSeat] = useState<number>(2);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Module 5.4 Sound & Camera state
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');

  // Audience list
  const [audienceCount, setAudienceCount] = useState<number>(256);
  const [eligibleAudience, setEligibleAudience] = useState<
    Array<{ id: string; name: string; avatar: string }>
  >([
    { id: 'user_tariq_01', name: 'Tariq Vance', avatar: '/assets/chat/avatar_rizwan.png' },
    { id: 'user_nadia_02', name: 'Nadia Khan', avatar: '/assets/chat/avatar_sana.png' },
    { id: 'user_arjun_03', name: 'Arjun Verma', avatar: '/assets/chat/avatar_bilal.png' },
    { id: 'user_hina_04', name: 'Hina Malik', avatar: '/assets/chat/avatar_mehak.png' },
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  // 1. Fetch Room and Seats
  const fetchRoomData = useCallback(async () => {
    try {
      // Room info
      const roomRes = await fetch(`/api/party/${roomId}`);
      if (roomRes.ok) {
        const roomData = await roomRes.json();
        if (roomData.success && roomData.party) {
          setRoom(roomData.party);
        }
      }

      // Seats info
      const seatsRes = await fetch(`/api/party/${roomId}/seats`);
      if (seatsRes.ok) {
        const seatsData = await seatsRes.json();
        if (seatsData.success && Array.isArray(seatsData.seats)) {
          setSeats(seatsData.seats);
          // Set host seat mic/camera state if available
          const hostSeat = seatsData.seats.find((s: PartySeat) => s.seatNumber === 1);
          if (hostSeat) {
            setIsMicOn(!hostSeat.isMuted);
            setIsCameraOn(hostSeat.isCameraOn);
          }
        }
      }

      // Requests & Invitations
      const reqRes = await fetch(`/api/party/${roomId}/seats/requests`);
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        if (reqData.success) {
          if (Array.isArray(reqData.requests)) setSeatRequests(reqData.requests);
          if (Array.isArray(reqData.invitations)) setSeatInvitations(reqData.invitations);
        }
      }
    } catch (err: any) {
      console.error('Error fetching party room data:', err);
      setError('Failed to connect to party room');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // 2. Poll for real-time seat status updates every 3 seconds
  useEffect(() => {
    fetchRoomData();
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/party/${roomId}/seats/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.seats)) {
            setSeats((prev) => {
              return prev.map((s) => {
                const updated = data.seats.find((us: any) => us.seat_number === s.seatNumber);
                if (updated) {
                  return {
                    ...s,
                    participantId: updated.participant_id,
                    participantName: updated.participant_name,
                    participantAvatar: updated.participant_avatar,
                    isHost: Boolean(updated.is_host),
                    isMuted: Boolean(updated.is_muted),
                    isCameraOn: Boolean(updated.is_camera_on),
                    isHostMuted: Boolean(updated.is_host_muted),
                    isVideoDisabled: Boolean(updated.is_video_disabled),
                    cameraFacing: updated.camera_facing || 'user',
                    status: updated.status,
                    occupiedAt: updated.occupied_at,
                    updatedAt: updated.updated_at,
                  };
                }
                return s;
              });
            });
          }
        }

        // Requests update
        const reqRes = await fetch(`/api/party/${roomId}/seats/requests`);
        if (reqRes.ok) {
          const reqData = await reqRes.json();
          if (reqData.success) {
            if (Array.isArray(reqData.requests)) setSeatRequests(reqData.requests);
            if (Array.isArray(reqData.invitations)) setSeatInvitations(reqData.invitations);
          }
        }
      } catch (e) {
        // Silent background polling error
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [roomId, fetchRoomData]);

  // 3. Module 5.4 Media Controls (Toggle Mic, Toggle Camera, Flip Camera)
  const handleToggleMedia = async (
    seatNum: number,
    type: 'mic' | 'camera' | 'facing',
    enabledVal?: boolean,
    facingVal?: 'user' | 'environment'
  ) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/party/${roomId}/seats/media/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatNumber: seatNum,
          type,
          enabled: enabledVal,
          facing: facingVal,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Media updated');
        // Update local state
        setSeats((prev) =>
          prev.map((s) => {
            if (s.seatNumber === seatNum) {
              return {
                ...s,
                isMuted: data.seat.isMuted,
                isCameraOn: data.seat.isCameraOn,
                isHostMuted: data.seat.isHostMuted,
                isVideoDisabled: data.seat.isVideoDisabled,
                cameraFacing: data.seat.cameraFacing,
              };
            }
            return s;
          })
        );

        if (seatNum === 1) {
          if (type === 'mic') setIsMicOn(Boolean(enabledVal));
          if (type === 'camera') setIsCameraOn(Boolean(enabledVal));
          if (type === 'facing') setCameraFacing(facingVal || 'user');
        }

        if (selectedSeat && selectedSeat.seatNumber === seatNum) {
          setSelectedSeat((prev) =>
            prev
              ? {
                  ...prev,
                  isMuted: data.seat.isMuted,
                  isCameraOn: data.seat.isCameraOn,
                  isHostMuted: data.seat.isHostMuted,
                  isVideoDisabled: data.seat.isVideoDisabled,
                  cameraFacing: data.seat.cameraFacing,
                }
              : null
          );
        }
      } else {
        showToast(data.error || 'Failed to update media');
      }
    } catch (err: any) {
      showToast('Network error while toggling media');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Module 5.4 Host Moderation (Host Mute, Disable Video)
  const handleModerateSeat = async (
    seatNum: number,
    action: 'host_mute' | 'disable_video' | 'kick'
  ) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/party/${roomId}/seats/media/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatNumber: seatNum,
          action,
          isHostAction: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Seat moderated successfully');
        if (action === 'kick') {
          // Vacated
          setSeats((prev) =>
            prev.map((s) =>
              s.seatNumber === seatNum
                ? {
                    ...s,
                    participantId: null,
                    participantName: null,
                    participantAvatar: null,
                    isHost: false,
                    isMuted: false,
                    isCameraOn: false,
                    isHostMuted: false,
                    isVideoDisabled: false,
                    status: 'available',
                  }
                : s
            )
          );
        } else if (data.moderatedSeat) {
          setSeats((prev) =>
            prev.map((s) =>
              s.seatNumber === seatNum
                ? {
                    ...s,
                    isMuted: data.moderatedSeat.isMuted,
                    isCameraOn: data.moderatedSeat.isCameraOn,
                    isHostMuted: data.moderatedSeat.isHostMuted,
                    isVideoDisabled: data.moderatedSeat.isVideoDisabled,
                  }
                : s
            )
          );
        }
        setSelectedSeat(null);
      } else {
        showToast(data.error || 'Host moderation action failed');
      }
    } catch (err: any) {
      showToast('Error executing moderation action');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Toggle bottom bar mic button
  const toggleBottomMic = () => {
    const nextVal = !isMicOn;
    setIsMicOn(nextVal);
    handleToggleMedia(1, 'mic', nextVal);
  };

  // 6. Toggle bottom bar camera button
  const toggleBottomCamera = () => {
    const nextVal = !isCameraOn;
    setIsCameraOn(nextVal);
    handleToggleMedia(1, 'camera', nextVal);
  };

  // 7. Toggle room speaker sound
  const toggleSpeaker = () => {
    const nextVal = !isSpeakerOn;
    setIsSpeakerOn(nextVal);
    showToast(nextVal ? 'Party room sound enabled' : 'Party room sound muted');
  };

  // 8. Handle Request Seat
  const handleRequestSeat = async (seatNumber: number) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/party/${roomId}/seats/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatNumber,
          userId: 'user_viewer_' + Math.floor(Math.random() * 1000),
          userName: 'Viewer (You)',
          userAvatar: '/assets/studio/user_avatar_default.png',
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Request sent for Seat #${seatNumber}! Awaiting host approval.`);
        setSelectedSeat(null);
        fetchRoomData();
      } else {
        showToast(data.error || 'Failed to submit seat request');
      }
    } catch (err: any) {
      showToast('Error requesting seat');
    } finally {
      setActionLoading(false);
    }
  };

  // 9. Respond to Request (Host Action)
  const handleRespondRequest = async (requestId: string, action: 'accept' | 'reject') => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/party/${roomId}/seats/requests/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || `Request ${action}ed`);
        fetchRoomData();
      } else {
        showToast(data.error || `Failed to ${action} request`);
      }
    } catch (err: any) {
      showToast('Error responding to request');
    } finally {
      setActionLoading(false);
    }
  };

  // 10. Send Invitation
  const handleSendInvitation = async (
    seatNumber: number,
    viewer: { id: string; name: string; avatar: string }
  ) => {
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
      if (data.success) {
        showToast(`Invitation sent to ${viewer.name} for Seat #${seatNumber}!`);
        fetchRoomData();
      } else {
        showToast(data.error || 'Failed to send invitation');
      }
    } catch (err: any) {
      showToast('Error sending invitation');
    } finally {
      setActionLoading(false);
    }
  };

  // 11. Respond to Invitation (Viewer Action)
  const handleRespondInvitation = async (invitationId: string, action: 'accept' | 'decline') => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/party/${roomId}/seats/invite/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, action }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || `Invitation ${action}ed`);
        fetchRoomData();
      } else {
        showToast(data.error || `Failed to ${action} invitation`);
      }
    } catch (err: any) {
      showToast('Error responding to invitation');
    } finally {
      setActionLoading(false);
    }
  };

  // 12. Occupy Seat directly
  const handleOccupySeat = async (seatNumber: number) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/party/${roomId}/seats/occupy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatNumber,
          participantId: 'user_dev_' + Math.floor(Math.random() * 1000),
          participantName: `Alex ${seatNumber}`,
          participantAvatar: `/assets/party/seat_avatar_${seatNumber <= 6 ? seatNumber : 2}.png`,
          isMuted: false,
          isCameraOn: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Joined Seat #${seatNumber} successfully!`);
        setSelectedSeat(null);
        fetchRoomData();
      } else {
        showToast(data.error || 'Failed to take seat');
      }
    } catch (err: any) {
      showToast('Error joining seat');
    } finally {
      setActionLoading(false);
    }
  };

  // 13. Vacate Seat
  const handleVacateSeat = async (seatNumber: number) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/party/${roomId}/seats/vacate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatNumber,
          isHostAction: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Seat #${seatNumber} vacated`);
        setSelectedSeat(null);
        fetchRoomData();
      } else {
        showToast(data.error || 'Failed to vacate seat');
      }
    } catch (err: any) {
      showToast('Error vacating seat');
    } finally {
      setActionLoading(false);
    }
  };

  // Ensure 9 seats exist for rendering
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
        participantId: i <= 6 ? `user_${i}` : null,
        participantName: i === 1 ? 'Maria Live' : i <= 6 ? `Participant ${i}` : null,
        participantAvatar: `/assets/party/seat_avatar_${i <= 6 ? i : 1}.png`,
        isHost: i === 1,
        isMuted: false,
        isCameraOn: i <= 6,
        isHostMuted: false,
        isVideoDisabled: false,
        cameraFacing: 'user',
        status: i <= 6 ? 'occupied' : 'available',
        occupiedAt: i <= 6 ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  const availableSeatNumbers = displaySeats
    .filter((s) => s.seatNumber >= 2 && s.status === 'available')
    .map((s) => s.seatNumber);

  return (
    <div className="min-h-screen bg-[#07031b] text-white flex flex-col justify-between max-w-sm sm:max-w-md mx-auto select-none font-sans relative overflow-hidden shadow-2xl border-x border-[#1a123f]">
      {/* Ambient background glows matching 05_04_sound_and_camera_on_a_seat.png */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-900/25 rounded-full blur-3xl pointer-events-none" />

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

      {/* TOP HEADER: < Back, Popo Live Branding, Audio Cast Icon */}
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
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 via-pink-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-600/40">
            <span className="font-extrabold text-white text-sm tracking-tighter">P</span>
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-purple-100 to-purple-200 bg-clip-text text-transparent">
            Popo Live
          </span>
        </div>

        {/* Top-Right Action: Screen Share / Audio Cast Icon matching {•} in 05_04 */}
        <button
          onClick={() => showToast('Audio cast / streaming mode active')}
          data-action="cast"
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-all text-white/90"
          title="Party Cast"
        >
          <Cast className="w-4 h-4" />
        </button>
      </header>

      {/* PARTY & HOST INFO BAR (Maria Live, 👑, Party Room, 👥 256) */}
      <div className="px-4 py-1.5 z-20">
        <div className="bg-[#120a32]/90 border border-[#261759] rounded-2xl px-3 py-2 flex items-center justify-between shadow-lg backdrop-blur-md">
          {/* Host Info */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 p-[2px] shadow-md shadow-purple-500/30">
                <div className="w-full h-full rounded-full overflow-hidden bg-purple-950 flex items-center justify-center">
                  <Image
                    src={room?.hostAvatar || '/assets/party/seat_avatar_1.png'}
                    alt="Host"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as any).src = '/assets/party/seat_avatar_1.png';
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
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-900/60 hover:bg-purple-800/80 border border-purple-500/30 text-xs text-purple-200 transition-all cursor-pointer shadow-md"
            title="Toggle Seat Requests Panel"
            data-testid="request-panel-toggle"
          >
            <Users className="w-3.5 h-3.5 text-purple-300" />
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
          className="mx-4 my-1 p-2.5 rounded-2xl bg-gradient-to-r from-purple-900/95 via-pink-950/95 to-purple-900/95 border border-pink-500/50 shadow-xl backdrop-blur-md z-30 flex items-center justify-between animate-in fade-in zoom-in duration-200"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-pink-500/20 border border-pink-400/40 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-pink-300" />
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

      {/* MAIN 9-SEAT 3x3 GRID matching 05_04_sound_and_camera_on_a_seat.png */}
      <main className="px-4 py-2 flex flex-col justify-center z-20" data-testid="nine-seat-grid">
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          {displaySeats.map((seat) => {
            const isHostSeat = seat.seatNumber === 1;
            const isOccupied = seat.status === 'occupied';
            const hasPendingRequest = seatRequests.some((r) => r.seatNumber === seat.seatNumber);

            // SEAT 1: HOST SEAT WITH GLOWING MAGENTA BORDER AND GOLD CROWN / MIC
            if (isHostSeat) {
              return (
                <div
                  key={seat.seatNumber}
                  data-testid="seat-1-host"
                  data-seat-number="1"
                  onClick={() => setSelectedSeat(seat)}
                  className="aspect-square rounded-2xl relative overflow-hidden bg-[#180e3c] border-2 border-fuchsia-500 shadow-xl shadow-fuchsia-600/30 ring-2 ring-fuchsia-500/40 flex flex-col justify-between p-2 cursor-pointer group transition-all"
                >
                  {/* Host Camera Feed / Avatar */}
                  <div className="absolute inset-0 z-0">
                    <Image
                      src={seat.participantAvatar || '/assets/party/seat_avatar_1.png'}
                      alt="Host Maria"
                      fill
                      className={`object-cover ${
                        seat.isCameraOn ? 'opacity-95' : 'opacity-40 grayscale'
                      } group-hover:scale-105 transition-all duration-300`}
                      onError={(e) => {
                        (e.target as any).src = '/assets/party/seat_avatar_1.png';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  </div>

                  {/* Top Overlay: Crown 👑 and Mic Status */}
                  <div className="relative z-10 flex items-center justify-between w-full">
                    <span className="text-sm drop-shadow-md" title="Host Crown">
                      👑
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-white shadow-md ${
                        seat.isMuted
                          ? 'bg-red-500/90 shadow-red-500/40'
                          : 'bg-emerald-500/90 shadow-emerald-500/40 ring-1 ring-emerald-300'
                      }`}
                      data-testid="host-mic-badge"
                    >
                      {seat.isMuted ? <MicOff className="w-2.5 h-2.5" /> : <Mic className="w-2.5 h-2.5" />}
                    </div>
                  </div>

                  {/* Bottom Overlay: Host Label + Golden Mic matching 05_04 */}
                  <div className="relative z-10 flex items-center justify-center gap-1 w-full pb-0.5">
                    <span className="text-xs font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-wide">
                      Host
                    </span>
                    <span className="text-amber-400 text-xs drop-shadow" title="Golden Microphone">
                      🎙️
                    </span>
                  </div>
                </div>
              );
            }

            // OCCUPIED PARTICIPANT SEATS (Seats 2 to 6 in 05_04)
            if (isOccupied) {
              return (
                <div
                  key={seat.seatNumber}
                  data-testid={`seat-${seat.seatNumber}-occupied`}
                  data-seat-number={seat.seatNumber}
                  onClick={() => setSelectedSeat(seat)}
                  className={`aspect-square rounded-2xl relative overflow-hidden bg-[#180e3c] border ${
                    seat.isCameraOn
                      ? 'border-purple-400/60 shadow-lg shadow-purple-900/30'
                      : 'border-zinc-700/60 opacity-80'
                  } flex flex-col justify-between p-2 cursor-pointer group transition-all`}
                >
                  {/* Participant Video / Avatar */}
                  <div className="absolute inset-0 z-0">
                    <Image
                      src={
                        seat.participantAvatar ||
                        `/assets/party/seat_avatar_${seat.seatNumber <= 6 ? seat.seatNumber : 2}.png`
                      }
                      alt={seat.participantName || `Seat ${seat.seatNumber}`}
                      fill
                      className={`object-cover ${
                        seat.isCameraOn ? 'opacity-95' : 'opacity-40 grayscale'
                      } group-hover:scale-105 transition-all duration-300`}
                      onError={(e) => {
                        (e.target as any).src = `/assets/party/seat_avatar_${seat.seatNumber <= 6 ? seat.seatNumber : 2}.png`;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
                  </div>

                  {/* Top Overlay: Seat Number */}
                  <div className="relative z-10 flex items-center justify-between w-full">
                    <span className="text-[10px] font-bold text-purple-200/90 px-1.5 py-0.2 rounded-md bg-black/50 backdrop-blur-sm border border-purple-500/30">
                      #{seat.seatNumber}
                    </span>
                    {seat.isVideoDisabled && (
                      <span className="text-[9px] font-bold text-red-300 px-1 py-0.2 rounded bg-black/60 border border-red-500/40">
                        Host Blocked
                      </span>
                    )}
                  </div>

                  {/* Bottom Badges matching 05_04: Camera Badge on Left, Mic Badge on Right */}
                  <div className="relative z-10 flex items-end justify-between w-full">
                    {/* Left Badge: Camera status or Level badge */}
                    <div className="flex items-center">
                      {seat.isCameraOn ? (
                        <div
                          className="w-5 h-5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white shadow-sm"
                          title="Camera Active"
                          data-testid={`seat-${seat.seatNumber}-camera-badge`}
                        >
                          <Video className="w-2.5 h-2.5" />
                        </div>
                      ) : (
                        <div
                          className="w-5 h-5 rounded-full bg-red-600/80 backdrop-blur-sm border border-red-400/40 flex items-center justify-center text-white shadow-sm"
                          title="Camera Disabled"
                          data-testid={`seat-${seat.seatNumber}-camera-off-badge`}
                        >
                          <VideoOff className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>

                    {/* Right Badge: Mic status */}
                    <div className="flex items-center">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-white shadow-md ${
                          seat.isMuted
                            ? 'bg-red-500/90 shadow-red-500/30'
                            : 'bg-emerald-500/90 shadow-emerald-500/30 ring-1 ring-emerald-300 animate-pulse'
                        }`}
                        title={seat.isMuted ? 'Muted' : 'Speaking'}
                        data-testid={`seat-${seat.seatNumber}-mic-badge`}
                      >
                        {seat.isMuted ? (
                          <MicOff className="w-2.5 h-2.5" />
                        ) : (
                          <Mic className="w-2.5 h-2.5" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // AVAILABLE EMPTY SEATS (Seats 7, 8, 9 in 05_04)
            return (
              <div
                key={seat.seatNumber}
                data-testid={`seat-${seat.seatNumber}-empty`}
                data-seat-number={seat.seatNumber}
                onClick={() => setSelectedSeat(seat)}
                className={`aspect-square rounded-2xl bg-[#140b32]/85 hover:bg-[#1a0f42] border ${
                  hasPendingRequest ? 'border-pink-500/80 shadow-pink-500/20' : 'border-[#291759] hover:border-purple-500/50'
                } shadow-inner shadow-purple-950/60 backdrop-blur-md flex flex-col items-center justify-between p-2 cursor-pointer transition-all group active:scale-95 relative`}
              >
                {/* Pending Request Indicator Badge */}
                {hasPendingRequest && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-pink-600 border border-pink-300 text-[9px] font-bold text-white shadow-md animate-pulse">
                    Request
                  </span>
                )}

                {/* Seat Number at Top */}
                <span className="text-xs font-semibold text-purple-300/80 group-hover:text-purple-200">
                  {seat.seatNumber}
                </span>

                {/* Circular Purple Button with White Plus in Center matching 05_04 */}
                <div
                  className="w-10 h-10 rounded-full bg-[#361e68] group-hover:bg-[#4b2a91] text-purple-200 group-hover:text-white flex items-center justify-center shadow-md shadow-purple-950/70 border border-purple-400/20 group-hover:scale-105 transition-all"
                  data-action="add-participant"
                >
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>

                {/* Available label */}
                <span className="text-[10px] text-zinc-500 group-hover:text-purple-300 transition-colors">
                  {hasPendingRequest ? '1 Pending' : 'Available'}
                </span>
              </div>
            );
          })}
        </div>
      </main>

      {/* INCOMING SEAT REQUEST & INVITATION PANEL (Module 5.3) */}
      {isRequestPanelOpen && (
        <section
          data-testid="seat-request-panel"
          className="mx-4 my-2 rounded-2xl bg-[#150c36]/95 border border-[#2d195e] p-3 shadow-2xl backdrop-blur-md z-20 relative animate-in slide-in-from-bottom-2 duration-200"
        >
          {/* Header & Tabs */}
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-purple-900/40">
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
                <span>Invite Audience</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px]">
                  {eligibleAudience.length}
                </span>
              </button>
            </div>

            <button
              onClick={() => setIsRequestPanelOpen(false)}
              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* TAB 1: PENDING SEAT REQUESTS */}
          {panelTab === 'requests' && (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {seatRequests.length === 0 ? (
                <div className="py-4 text-center text-xs text-zinc-400">
                  No pending seat requests at this moment.
                </div>
              ) : (
                seatRequests.map((req) => (
                  <div
                    key={req.id}
                    data-testid={`request-item-${req.id}`}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#20134e]/80 border border-purple-900/40"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-purple-950 border border-purple-500/30">
                        <Image
                          src={req.userAvatar || '/assets/studio/user_avatar_default.png'}
                          alt={req.userName}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
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

                    {/* Host Action Buttons */}
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
                  className="bg-[#26165b] border border-purple-500/40 rounded-lg px-2 py-0.5 text-xs text-white focus:outline-none"
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
                    className="flex items-center justify-between p-1.5 rounded-xl bg-[#20134e]/80 border border-purple-900/40"
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

      {/* SEAT MODAL: SOUND, CAMERA & HOST MODERATION DRAWER */}
      {selectedSeat && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-end justify-center p-4 animate-in fade-in duration-150"
          data-testid="seat-modal"
          onClick={() => setSelectedSeat(null)}
        >
          <div
            className="w-full max-w-sm bg-[#140b33] border border-purple-500/40 rounded-3xl p-5 shadow-2xl relative animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedSeat(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header with Seat Participant Details */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 p-[2px] flex items-center justify-center overflow-hidden">
                {selectedSeat.status === 'occupied' && selectedSeat.participantAvatar ? (
                  <Image
                    src={selectedSeat.participantAvatar}
                    alt={selectedSeat.participantName || 'Seat'}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover rounded-[14px]"
                  />
                ) : (
                  <div className="w-full h-full rounded-[14px] bg-[#1d1045] flex items-center justify-center font-bold text-lg text-purple-200">
                    #{selectedSeat.seatNumber}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-base text-white">
                    {selectedSeat.status === 'occupied'
                      ? selectedSeat.participantName
                      : `Seat #${selectedSeat.seatNumber}`}
                  </h3>
                  {selectedSeat.seatNumber === 1 && <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                </div>
                <div className="flex items-center gap-2 text-xs text-purple-300/80 mt-0.5">
                  <span className="px-1.5 py-0.2 rounded bg-purple-900/60 border border-purple-500/30 text-[10px]">
                    {selectedSeat.status === 'occupied' ? 'Voice & Video Seat' : 'Available'}
                  </span>
                  {selectedSeat.status === 'occupied' && (
                    <span className="text-[10px] text-zinc-400">
                      {selectedSeat.isMuted ? '🔇 Muted' : '🔊 Speaking'} • {selectedSeat.isCameraOn ? '📹 Camera On' : '📷 Camera Off'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* OCCUPIED SEAT CONTROLS (Module 5.4 Sound & Camera) */}
            {selectedSeat.status === 'occupied' ? (
              <div className="space-y-2 mt-4">
                {/* 1. Participant Self Media Controls */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Mic Toggle Button */}
                  <button
                    onClick={() =>
                      handleToggleMedia(selectedSeat.seatNumber, 'mic', selectedSeat.isMuted)
                    }
                    disabled={actionLoading}
                    data-action="toggle-seat-mic"
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                      selectedSeat.isMuted
                        ? 'bg-rose-950/60 border-rose-500/50 text-rose-300 hover:bg-rose-900/70'
                        : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/70'
                    }`}
                  >
                    {selectedSeat.isMuted ? <MicOff className="w-3.5 h-3.5 text-rose-400" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>{selectedSeat.isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
                  </button>

                  {/* Camera Toggle Button */}
                  <button
                    onClick={() =>
                      handleToggleMedia(selectedSeat.seatNumber, 'camera', !selectedSeat.isCameraOn)
                    }
                    disabled={actionLoading}
                    data-action="toggle-seat-camera"
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                      selectedSeat.isCameraOn
                        ? 'bg-purple-950/60 border-purple-500/50 text-purple-200 hover:bg-purple-900/70'
                        : 'bg-zinc-800/60 border-zinc-600/50 text-zinc-300 hover:bg-zinc-700/70'
                    }`}
                  >
                    {selectedSeat.isCameraOn ? <Video className="w-3.5 h-3.5 text-purple-300" /> : <VideoOff className="w-3.5 h-3.5 text-zinc-400" />}
                    <span>{selectedSeat.isCameraOn ? 'Turn Video Off' : 'Turn Video On'}</span>
                  </button>
                </div>

                {/* Flip Camera Button */}
                <button
                  onClick={() =>
                    handleToggleMedia(
                      selectedSeat.seatNumber,
                      'facing',
                      undefined,
                      selectedSeat.cameraFacing === 'user' ? 'environment' : 'user'
                    )
                  }
                  disabled={actionLoading}
                  data-action="flip-seat-camera"
                  className="w-full py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 active:scale-98 text-xs font-semibold text-purple-200 flex items-center justify-center gap-2 transition-all"
                >
                  <SwitchCamera className="w-3.5 h-3.5 text-pink-400" />
                  <span>
                    Flip Camera ({selectedSeat.cameraFacing === 'user' ? 'Front' : 'Back'})
                  </span>
                </button>

                {/* 2. Host Moderation Section (for seats 2 to 9) */}
                {selectedSeat.seatNumber > 1 && (
                  <div className="pt-2 border-t border-purple-900/40 space-y-1.5">
                    <p className="text-[11px] font-bold text-purple-300/90 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-pink-400" /> Host Moderation
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Host Mute Participant */}
                      <button
                        onClick={() => handleModerateSeat(selectedSeat.seatNumber, 'host_mute')}
                        disabled={actionLoading || selectedSeat.isMuted}
                        data-action="host-mute"
                        className="py-2 px-2.5 rounded-xl bg-purple-900/50 hover:bg-purple-800/60 border border-purple-500/30 text-[11px] font-semibold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-1"
                      >
                        <MicOff className="w-3 h-3 text-pink-400" /> Host Mute
                      </button>

                      {/* Disable Participant Video */}
                      <button
                        onClick={() => handleModerateSeat(selectedSeat.seatNumber, 'disable_video')}
                        disabled={actionLoading || !selectedSeat.isCameraOn}
                        data-action="disable-video"
                        className="py-2 px-2.5 rounded-xl bg-purple-900/50 hover:bg-purple-800/60 border border-purple-500/30 text-[11px] font-semibold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-1"
                      >
                        <VideoOff className="w-3 h-3 text-pink-400" /> Disable Video
                      </button>
                    </div>

                    {/* Security Notice: Host cannot secretly force participant media on */}
                    <div className="p-2 rounded-xl bg-purple-950/50 border border-purple-800/30 text-[10px] text-zinc-400 leading-snug flex items-start gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        Host can mute or disable video. Reactivation requires participant consent to protect user privacy.
                      </span>
                    </div>

                    {/* Vacate / Kick from Seat */}
                    <button
                      onClick={() => handleVacateSeat(selectedSeat.seatNumber)}
                      disabled={actionLoading}
                      data-action="confirm-vacate-seat"
                      className="w-full py-2.5 px-3 rounded-xl bg-red-600/80 hover:bg-red-500 active:scale-98 text-white font-bold text-xs shadow-md shadow-red-600/30 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Vacate Participant from Seat #{selectedSeat.seatNumber}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* AVAILABLE SEAT ACTIONS (Request Seat / Join) */
              <div className="space-y-2 mt-4">
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

                <button
                  onClick={() => handleOccupySeat(selectedSeat.seatNumber)}
                  disabled={actionLoading}
                  data-action="confirm-take-seat"
                  className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 active:scale-98 text-purple-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Direct Join (Host/Demo)
                </button>
              </div>
            )}
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

      {/* BOTTOM CONTROL BAR (6 Circular Buttons matching 05_04_sound_and_camera_on_a_seat.png) */}
      <footer className="px-4 pt-1 pb-3 z-20" data-testid="bottom-control-bar">
        <div className="flex items-center justify-between gap-2 max-w-sm mx-auto">
          {/* 1. Mic Button */}
          <button
            onClick={toggleBottomMic}
            data-testid="control-mic"
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 ${
              isMicOn
                ? 'bg-[#291b52] hover:bg-[#38256e] text-white border border-purple-600/50 shadow-purple-900/30'
                : 'bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-300 shadow-rose-900/30'
            }`}
            title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {isMicOn ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-rose-300" />}
          </button>

          {/* 2. Camera Button */}
          <button
            onClick={toggleBottomCamera}
            data-testid="control-camera"
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 ${
              isCameraOn
                ? 'bg-[#291b52] hover:bg-[#38256e] text-white border border-purple-600/50 shadow-purple-900/30'
                : 'bg-zinc-800 hover:bg-zinc-700 border border-zinc-600/50 text-zinc-400'
            }`}
            title={isCameraOn ? 'Turn Video Off' : 'Turn Video On'}
          >
            {isCameraOn ? <Video className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-zinc-400" />}
          </button>

          {/* 3. Speaker / Audio volume button matching 05_04 */}
          <button
            onClick={toggleSpeaker}
            data-testid="control-sound"
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 ${
              isSpeakerOn
                ? 'bg-[#291b52] hover:bg-[#38256e] text-zinc-200 border border-purple-700/40'
                : 'bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-300'
            }`}
            title={isSpeakerOn ? 'Mute Room Audio' : 'Unmute Room Audio'}
          >
            {isSpeakerOn ? <Volume2 className="w-5 h-5 text-white" /> : <VolumeX className="w-5 h-5 text-amber-300" />}
          </button>

          {/* 4. Audience / Guests Button */}
          <button
            onClick={() => setIsRequestPanelOpen(!isRequestPanelOpen)}
            data-testid="control-audience"
            className="w-11 h-11 rounded-full bg-[#291b52] hover:bg-[#38256e] text-zinc-200 border border-purple-700/40 flex items-center justify-center transition-all shadow-lg active:scale-95 relative"
            title="Audience & Seat Requests"
          >
            <Users className="w-5 h-5 text-zinc-200" />
            {seatRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-500 text-[10px] font-bold text-white flex items-center justify-center">
                {seatRequests.length}
              </span>
            )}
          </button>

          {/* 5. Chat Button */}
          <button
            onClick={() => showToast('Live Chat connected')}
            data-testid="control-chat"
            className="w-11 h-11 rounded-full bg-[#291b52] hover:bg-[#38256e] text-zinc-200 border border-purple-700/40 flex items-center justify-center transition-all shadow-lg active:scale-95"
            title="Party Chat"
          >
            <MessageSquare className="w-5 h-5 text-zinc-200" />
          </button>

          {/* 6. More Options Button matching ••• in 05_04 */}
          <button
            onClick={() => showToast('Party Settings & Media Options')}
            data-testid="control-more"
            className="w-11 h-11 rounded-full bg-[#291b52] hover:bg-[#38256e] text-zinc-200 border border-purple-700/40 flex items-center justify-center transition-all shadow-lg active:scale-95"
            title="More Options"
          >
            <MoreHorizontal className="w-5 h-5 text-zinc-200" />
          </button>
        </div>

        {/* Footer Reference Banner matching 05_04_sound_and_camera_on_a_seat.png */}
        <div className="mt-2 text-center" data-testid="footer-reference-banner">
          <span className="inline-block px-3 py-1 rounded-full bg-purple-950/80 border border-purple-700/40 text-[11px] font-semibold text-purple-300/90 tracking-wide">
            05_04 Sound and Camera on a Seat
          </span>
        </div>
      </footer>
    </div>
  );
}
