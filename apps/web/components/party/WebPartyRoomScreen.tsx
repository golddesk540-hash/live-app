'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Plus,
  Cast,
  Sparkles,
  X,
  LogOut,
  Send,
  UserPlus,
  Check,
  SwitchCamera,
  Gift,
  Palette,
  ExternalLink,
  Copy,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import {
  PartySeat,
  PartyRoomResponse,
  PartySeatRequest,
  PartySeatInvitation,
  PartyMessage,
  PartyAudienceMember,
  PartyTheme,
  CANONICAL_PARTY_THEMES,
  getPartyThemeById,
} from '@/lib/party';
import PartyThemesScreen from './PartyThemesScreen';

export interface WebPartyRoomScreenProps {
  roomId: string;
  initialRoom?: PartyRoomResponse;
}

export default function WebPartyRoomScreen({
  roomId = '7001',
  initialRoom,
}: WebPartyRoomScreenProps) {
  const router = useRouter();

  // State
  const [room, setRoom] = useState<PartyRoomResponse | null>(initialRoom || null);
  const [seats, setSeats] = useState<PartySeat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active theme (Module 5.6 synchronization)
  const [activeTheme, setActiveTheme] = useState<PartyTheme>(CANONICAL_PARTY_THEMES[0]);
  const [isThemesOpen, setIsThemesOpen] = useState<boolean>(false);

  // Web Media & Camera State (Agora WebRTC integration)
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [isJoinedSeat, setIsJoinedSeat] = useState<boolean>(true); // Host in Seat 1 by default
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Right Side Panel: 'chat' | 'audience' | 'requests'
  const [activeTab, setActiveTab] = useState<'chat' | 'audience' | 'requests'>('chat');

  // Chat Messages (Module 5.5)
  const [messages, setMessages] = useState<PartyMessage[]>([
    {
      id: 'msg-seed-1',
      roomNumber: roomId,
      senderId: 'aud_ali_khan',
      senderName: 'Ali Khan',
      senderAvatar: '/assets/party/chat_avatar_ali_khan.png',
      senderRole: 'audience',
      messageText: 'Great party! 🎉',
      emoji: '🎉',
      createdAt: new Date(Date.now() - 30000).toISOString(),
    },
    {
      id: 'msg-seed-2',
      roomNumber: roomId,
      senderId: 'aud_sana',
      senderName: 'Sana',
      senderAvatar: '/assets/party/chat_avatar_sana.png',
      senderRole: 'audience',
      messageText: 'Can I join a seat? 😀',
      emoji: '😀',
      createdAt: new Date(Date.now() - 20000).toISOString(),
    },
    {
      id: 'msg-seed-3',
      roomNumber: roomId,
      senderId: 'aud_bilal',
      senderName: 'Bilal',
      senderAvatar: '/assets/party/chat_avatar_bilal.png',
      senderRole: 'audience',
      messageText: 'Amazing vibes 💜',
      emoji: '💜',
      createdAt: new Date(Date.now() - 10000).toISOString(),
    },
    {
      id: 'msg-seed-4',
      roomNumber: roomId,
      senderId: 'aud_zoya',
      senderName: 'Zoya',
      senderAvatar: '/assets/party/chat_avatar_zoya.png',
      senderRole: 'audience',
      messageText: 'Love this room! ❤️',
      emoji: '❤️',
      createdAt: new Date(Date.now() - 2000).toISOString(),
    },
  ]);
  const [chatInputText, setChatInputText] = useState<string>('');
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Audience State (Module 5.5)
  const [audienceCount, setAudienceCount] = useState<number>(256);
  const [audienceMembers, setAudienceMembers] = useState<PartyAudienceMember[]>([
    {
      id: 'aud-1',
      roomNumber: roomId,
      userId: 'aud_ali_khan',
      userName: 'Ali Khan',
      userAvatar: '/assets/party/chat_avatar_ali_khan.png',
      userLevel: 5,
      isActive: true,
      joinedAt: new Date().toISOString(),
    },
    {
      id: 'aud-2',
      roomNumber: roomId,
      userId: 'aud_sana',
      userName: 'Sana',
      userAvatar: '/assets/party/chat_avatar_sana.png',
      userLevel: 4,
      isActive: true,
      joinedAt: new Date().toISOString(),
    },
    {
      id: 'aud-3',
      roomNumber: roomId,
      userId: 'aud_bilal',
      userName: 'Bilal',
      userAvatar: '/assets/party/chat_avatar_bilal.png',
      userLevel: 7,
      isActive: true,
      joinedAt: new Date().toISOString(),
    },
    {
      id: 'aud-4',
      roomNumber: roomId,
      userId: 'aud_zoya',
      userName: 'Zoya',
      userAvatar: '/assets/party/chat_avatar_zoya.png',
      userLevel: 6,
      isActive: true,
      joinedAt: new Date().toISOString(),
    },
  ]);

  // Seat Requests & Invitations (Module 5.3)
  const [seatRequests, setSeatRequests] = useState<PartySeatRequest[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<PartySeat | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Fetch Room, Seats, Chat, Audience, and Active Theme
  const fetchRoomData = useCallback(async () => {
    try {
      // Room info
      const roomRes = await fetch(`/api/party/${roomId}/web-info`);
      if (roomRes.ok) {
        const data = await roomRes.json();
        if (data.success) {
          if (data.room) setRoom(data.room);
          if (data.activeTheme) setActiveTheme(data.activeTheme);
        }
      }

      // Seats info
      const seatsRes = await fetch(`/api/party/${roomId}/seats`);
      if (seatsRes.ok) {
        const seatsData = await seatsRes.json();
        if (seatsData.success && Array.isArray(seatsData.seats)) {
          setSeats(seatsData.seats);
        }
      }

      // Chat Messages
      const chatRes = await fetch(`/api/party/${roomId}/chat/messages`);
      if (chatRes.ok) {
        const chatData = await chatRes.json();
        if (chatData.success && Array.isArray(chatData.messages) && chatData.messages.length > 0) {
          setMessages(chatData.messages);
        }
      }

      // Audience List
      const audRes = await fetch(`/api/party/${roomId}/audience`);
      if (audRes.ok) {
        const audData = await audRes.json();
        if (audData.success) {
          if (audData.audienceCount) setAudienceCount(audData.audienceCount);
          if (Array.isArray(audData.members) && audData.members.length > 0) {
            setAudienceMembers(audData.members);
          }
        }
      }

      // Requests
      const reqRes = await fetch(`/api/party/${roomId}/seats/requests`);
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        if (reqData.success && Array.isArray(reqData.requests)) {
          setSeatRequests(reqData.requests);
        }
      }
    } catch (err: any) {
      console.warn('Error fetching web party data:', err);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // 2. Real-time background sync polling every 2.5s
  useEffect(() => {
    fetchRoomData();
    const interval = setInterval(async () => {
      try {
        // Poll Seats Status
        const res = await fetch(`/api/party/${roomId}/seats/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.seats)) {
            setSeats((prev) =>
              prev.map((s) => {
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
              })
            );
          }
        }

        // Poll Chat Messages
        const chatRes = await fetch(`/api/party/${roomId}/chat/messages`);
        if (chatRes.ok) {
          const chatData = await chatRes.json();
          if (chatData.success && Array.isArray(chatData.messages)) {
            setMessages(chatData.messages);
          }
        }

        // Poll Theme
        const themeRes = await fetch(`/api/party/${roomId}/theme`);
        if (themeRes.ok) {
          const themeData = await themeRes.json();
          if (themeData.success && themeData.theme) {
            setActiveTheme((prev) => (prev.id !== themeData.theme.id ? themeData.theme : prev));
          }
        }
      } catch (e) {
        // Silent sync
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [roomId, fetchRoomData]);

  // 3. Initialize Camera Video Stream for Seated Web Host/Participant
  useEffect(() => {
    let stream: MediaStream | null = null;
    async function initCamera() {
      if (isCameraOn && typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: cameraFacing },
            audio: isMicOn,
          });
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        } catch (e) {
          console.warn('WebRTC camera initialization bypassed or denied:', e);
        }
      } else {
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((t) => t.stop());
          localStreamRef.current = null;
        }
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }
      }
    }

    initCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isCameraOn, isMicOn, cameraFacing]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Send Chat Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = chatInputText.trim();
    if (!text || isSendingMessage) return;

    setIsSendingMessage(true);
    setChatInputText('');

    // Optimistic update
    const optimisticMsg: PartyMessage = {
      id: `msg-opt-${Date.now()}`,
      roomNumber: roomId,
      senderId: 'user_web_maria',
      senderName: 'Maria Live (Host)',
      senderAvatar: '/assets/party/seat_avatar_1.png',
      senderRole: 'host',
      messageText: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch(`/api/party/${roomId}/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: 'user_web_maria',
          senderName: 'Maria Live',
          senderAvatar: '/assets/party/seat_avatar_1.png',
          senderRole: 'host',
          messageText: text,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Toggle Mic
  const handleToggleMic = async () => {
    const nextState = !isMicOn;
    setIsMicOn(nextState);
    showToast(nextState ? '🎙️ Microphone Unmuted' : '🔇 Microphone Muted');
    try {
      await fetch(`/api/party/${roomId}/seats/media/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatNumber: 1, type: 'mic', enabled: nextState }),
      });
    } catch (e) {}
  };

  // Toggle Camera
  const handleToggleCamera = async () => {
    const nextState = !isCameraOn;
    setIsCameraOn(nextState);
    showToast(nextState ? '📹 Camera Enabled' : '🚫 Camera Disabled');
    try {
      await fetch(`/api/party/${roomId}/seats/media/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatNumber: 1, type: 'camera', enabled: nextState }),
      });
    } catch (e) {}
  };

  // 9 Canonical Seats
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

  return (
    <div
      className="min-h-screen text-white flex flex-col justify-between font-sans relative overflow-x-hidden transition-colors duration-500"
      style={{
        background: activeTheme.backgroundGradient,
      }}
      data-testid="web-party-room-screen"
      data-active-theme={activeTheme.id}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#1F1938]/95 border border-[#8B5CF6] text-white text-xs px-5 py-2.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 animate-fade-in"
          data-testid="web-party-toast"
        >
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER: Widescreen Web Header matching laptop interface */}
      <header className="w-full border-b border-white/10 bg-[#0B081E]/80 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between z-30 flex-wrap gap-2">
        {/* Left: Back & Branding */}
        <div className="flex items-center gap-3">
          <Link
            href="/party/web"
            data-action="back-showcase"
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-white/90"
            title="Back to Web Party Showcase"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#9333EA] to-[#C084FC] flex items-center justify-center shadow-md shadow-[#9333EA]/40">
              <span className="text-white font-extrabold text-sm">P</span>
            </div>
            <span className="font-bold text-base tracking-wide bg-gradient-to-r from-white via-white/95 to-white/80 bg-clip-text text-transparent">
              Popo Live <span className="text-xs font-semibold text-purple-300 ml-1">Web Party</span>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-950/70 border border-purple-500/30 text-xs text-purple-300">
            <span>🎉 Party Room</span>
            <span>•</span>
            <span className="font-mono font-semibold">#{room?.roomNumber || roomId}</span>
          </div>
        </div>

        {/* Center: Host Badge & Audience Counter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
            <div className="relative w-6 h-6 rounded-full overflow-hidden border border-amber-400">
              <Image
                src={room?.hostAvatar || '/assets/party/seat_avatar_1.png'}
                alt="Host"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <span className="text-xs font-bold text-white flex items-center gap-1">
              {displaySeats[0]?.participantName || 'Maria Live'} <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />
            </span>
          </div>

          <button
            onClick={() => setActiveTab('audience')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-900/60 hover:bg-purple-800/80 border border-purple-500/30 text-xs text-purple-200 transition-all shadow-md cursor-pointer"
            data-testid="web-audience-pill"
          >
            <Users className="w-3.5 h-3.5 text-purple-300" />
            <span className="font-semibold text-xs">{audienceCount}</span>
          </button>
        </div>

        {/* Right: Active Theme & Controls */}
        <div className="flex items-center gap-2">
          {/* Active Theme Selector */}
          <button
            onClick={() => setIsThemesOpen(true)}
            data-action="open-web-themes"
            className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-purple-500/30 text-xs font-bold text-purple-200 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            title="Change Party Theme"
          >
            <Palette className="w-3.5 h-3.5 text-pink-400" />
            <span>{activeTheme.name}</span>
          </button>

          {/* Audio Cast */}
          <button
            onClick={() => showToast('Audio Cast Active')}
            data-action="cast"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/90 transition-colors"
            title="Cast Audio"
          >
            <Cast className="w-4 h-4" />
          </button>

          {/* Copy Share Link */}
          <button
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
              }
              showToast('Web Party link copied to clipboard!');
            }}
            data-action="copy-share-url"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/90 transition-colors"
            title="Copy Party Link"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN BODY: 2-Column Desktop Layout matching 05_07 laptop screen */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: The 9-Seat Web Grid (8 Cols on Desktop) */}
        <section
          className="lg:col-span-8 flex flex-col gap-4"
          data-testid="web-seats-container"
        >
          {/* Nine-Seat Grid matching 05_07_web_party.png */}
          <div
            className="grid grid-cols-3 gap-3 sm:gap-4 p-4 sm:p-5 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md relative"
            style={{
              backgroundColor: activeTheme.cardBg,
              boxShadow: `0 12px 36px ${activeTheme.accentColor}20`,
            }}
            data-testid="web-nine-seat-grid"
          >
            {displaySeats.map((seat) => {
              const isOccupied = seat.status === 'occupied';
              const isHostSeat = seat.seatNumber === 1;

              return (
                <div
                  key={seat.seatNumber}
                  onClick={() => setSelectedSeat(seat)}
                  className={`aspect-[4/3] rounded-2xl p-2 relative flex flex-col justify-between overflow-hidden cursor-pointer transition-all border ${
                    isOccupied
                      ? 'border-white/15 bg-[#171133]/80 hover:border-purple-400/50'
                      : 'border-dashed border-white/20 bg-white/5 hover:bg-white/10'
                  }`}
                  data-testid={`web-seat-${seat.seatNumber}`}
                  data-occupied={isOccupied ? 'true' : 'false'}
                >
                  {/* Top indicators: Seat number + Mic / Crown */}
                  <div className="flex items-center justify-between w-full z-10">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-black/50 text-white/80">
                      #{seat.seatNumber}
                    </span>

                    {isOccupied && (
                      <div className="flex items-center gap-1">
                        {isHostSeat && (
                          <span className="text-[10px] bg-amber-400 text-amber-950 px-1 rounded font-bold">
                            👑 Host
                          </span>
                        )}
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                            seat.isMuted
                              ? 'bg-rose-600/90 text-white'
                              : 'bg-emerald-500/90 text-white shadow-sm'
                          }`}
                        >
                          {seat.isMuted ? <MicOff className="w-2.5 h-2.5" /> : <Mic className="w-2.5 h-2.5" />}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Seat Content: Video feed or Avatar or Empty CTA */}
                  <div className="my-auto flex flex-col items-center justify-center relative w-full h-full">
                    {isOccupied ? (
                      <>
                        {/* Live Camera for Seat 1 (Host) or Seated Participant */}
                        {isHostSeat && isCameraOn ? (
                          <div className="absolute inset-0 rounded-xl overflow-hidden bg-black">
                            <video
                              ref={localVideoRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-full h-full object-cover scale-x-[-1]"
                            />
                          </div>
                        ) : (
                          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-purple-400/40 shadow-lg">
                            <Image
                              src={seat.participantAvatar || `/assets/party/seat_avatar_${seat.seatNumber}.png`}
                              alt={seat.participantName || `Seat ${seat.seatNumber}`}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-white/50 group-hover:text-white/80 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-1">
                          <Plus className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-semibold">Join Seat</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Participant Name & Status */}
                  {isOccupied && (
                    <div className="w-full text-center truncate z-10">
                      <span className="text-[11px] font-bold text-white tracking-wide bg-black/40 px-2 py-0.5 rounded-full inline-block truncate max-w-full">
                        {seat.participantName}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Interactive Controls Bar */}
          <div
            className="flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-[#0B081E]/90 backdrop-blur-md shadow-xl flex-wrap gap-2"
            data-testid="web-party-controls"
          >
            <div className="flex items-center gap-2">
              {/* Mic Toggle */}
              <button
                onClick={handleToggleMic}
                data-action="toggle-mic"
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  isMicOn
                    ? 'bg-emerald-600/90 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-rose-600/90 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30'
                }`}
              >
                {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                <span>{isMicOn ? 'Mic ON' : 'Mic Muted'}</span>
              </button>

              {/* Camera Toggle */}
              <button
                onClick={handleToggleCamera}
                data-action="toggle-camera"
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  isCameraOn
                    ? 'bg-purple-600/90 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30'
                    : 'bg-zinc-700/80 hover:bg-zinc-600 text-white/80'
                }`}
              >
                {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                <span>{isCameraOn ? 'Camera ON' : 'Camera OFF'}</span>
              </button>

              {/* Switch Facing */}
              <button
                onClick={() => {
                  setCameraFacing((prev) => (prev === 'user' ? 'environment' : 'user'));
                  showToast('Camera flipped');
                }}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                title="Switch Camera Facing"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Gift Button */}
              <button
                onClick={() => showToast('Gifts feature in Module 6')}
                data-testid="btn-web-gift"
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#EC4899] to-[#F43F5E] flex items-center justify-center text-white shadow-lg shadow-pink-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Send Gift"
              >
                <Gift className="w-5 h-5" />
              </button>

              {/* Leave Party */}
              <Link
                href="/party/web"
                data-action="leave-party"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Leave</span>
              </Link>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Chat, Audience, and Requests Panel (4 Cols on Desktop) */}
        <aside
          className="lg:col-span-4 flex flex-col rounded-3xl border border-white/10 bg-[#0F0B24]/90 backdrop-blur-md shadow-2xl h-[560px] overflow-hidden"
          data-testid="web-right-sidebar"
        >
          {/* Segmented Control Tabs */}
          <div className="flex items-center border-b border-white/10 p-2 gap-1.5 bg-black/20">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-[#9333EA] to-[#C084FC] text-white shadow-md'
                  : 'text-white/70 hover:text-white'
              }`}
              data-testid="tab-web-chat"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
            </button>

            <button
              onClick={() => setActiveTab('audience')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'audience'
                  ? 'bg-gradient-to-r from-[#9333EA] to-[#C084FC] text-white shadow-md'
                  : 'text-white/70 hover:text-white'
              }`}
              data-testid="tab-web-audience"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Audience ({audienceCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'requests'
                  ? 'bg-gradient-to-r from-[#9333EA] to-[#C084FC] text-white shadow-md'
                  : 'text-white/70 hover:text-white'
              }`}
              data-testid="tab-web-requests"
            >
              <span>✋</span>
              {seatRequests.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-[10px] text-white flex items-center justify-center">
                  {seatRequests.length}
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: Chat Stream */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              <div
                className="flex-1 p-3.5 overflow-y-auto space-y-2.5"
                data-testid="web-chat-stream"
              >
                {messages.map((msg) => (
                  <div key={msg.id} className="flex items-start gap-2.5 animate-fade-in">
                    <div className="w-7 h-7 rounded-full overflow-hidden relative flex-shrink-0 border border-white/20">
                      <Image
                        src={msg.senderAvatar || '/assets/party/chat_avatar_ali_khan.png'}
                        alt={msg.senderName}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white/90 truncate">
                          {msg.senderName}
                        </span>
                        {msg.senderRole === 'host' && (
                          <span className="text-[9px] bg-amber-400 text-amber-950 font-bold px-1 rounded">
                            Host
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 inline-block px-3 py-1.5 rounded-2xl rounded-tl-sm bg-white/10 text-white/95 text-xs font-medium max-w-full break-words">
                        {msg.messageText}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Capsule */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-white/10 bg-black/20 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInputText}
                  onChange={(e) => setChatInputText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 rounded-full bg-white/10 border border-white/15 text-xs text-white placeholder-white/50 focus:outline-none focus:border-[#C084FC]"
                  data-testid="web-chat-input"
                />
                <button
                  type="submit"
                  disabled={isSendingMessage || !chatInputText.trim()}
                  className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#9333EA] to-[#C084FC] flex items-center justify-center text-white disabled:opacity-40 transition-all cursor-pointer"
                  data-testid="web-chat-send-btn"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: Audience List */}
          {activeTab === 'audience' && (
            <div
              className="flex-1 p-3.5 overflow-y-auto space-y-2"
              data-testid="web-audience-list"
            >
              {audienceMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20">
                      <Image
                        src={member.userAvatar}
                        alt={member.userName}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white truncate block">
                        {member.userName}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-200 font-bold">
                        Lv.{member.userLevel}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => showToast(`Invited ${member.userName} to stage`)}
                    className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#9333EA] to-[#C084FC] text-[11px] font-bold text-white hover:opacity-90 transition-all cursor-pointer"
                    data-action="invite-audience-btn"
                  >
                    + Invite
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: Seat Requests */}
          {activeTab === 'requests' && (
            <div
              className="flex-1 p-3.5 overflow-y-auto space-y-2.5"
              data-testid="web-requests-list"
            >
              {seatRequests.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-white/50 text-xs">
                  <span>No pending seat requests</span>
                </div>
              ) : (
                seatRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        {req.userName} requests Seat #{req.seatNumber}
                      </span>
                      <span className="text-[10px] text-amber-400 font-semibold">Pending</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={async () => {
                          await fetch(`/api/party/${roomId}/seats/requests/respond`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ requestId: req.id, action: 'accept', isHostAction: true }),
                          });
                          showToast(`Accepted seat request from ${req.userName}`);
                          fetchRoomData();
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={async () => {
                          await fetch(`/api/party/${roomId}/seats/requests/respond`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ requestId: req.id, action: 'reject', isHostAction: true }),
                          });
                          showToast(`Rejected request`);
                          fetchRoomData();
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-all cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </aside>
      </main>

      {/* THEMES MODAL (Module 5.6) */}
      {isThemesOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          data-testid="web-themes-modal"
        >
          <div className="w-full max-w-md max-h-[92vh] bg-[#0B081E] rounded-3xl border border-white/15 overflow-y-auto shadow-2xl relative">
            <button
              onClick={() => setIsThemesOpen(false)}
              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 transition-colors"
              aria-label="Close Themes"
            >
              <X className="w-4 h-4" />
            </button>
            <PartyThemesScreen
              roomId={roomId}
              isHost={true}
              initialThemeId={activeTheme.id}
              isModal={true}
              onThemeApplied={(newTheme) => {
                setActiveTheme(newTheme);
                showToast(`Theme "${newTheme.name}" applied across Web and Mobile!`);
              }}
              onClose={() => setIsThemesOpen(false)}
            />
          </div>
        </div>
      )}

      {/* FOOTER WATERMARK */}
      <footer className="w-full py-2 text-center text-xs text-white/50 font-semibold tracking-wider">
        05_07 Web Party • Cross-Platform System
      </footer>
    </div>
  );
}
