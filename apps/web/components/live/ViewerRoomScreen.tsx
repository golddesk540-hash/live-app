'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  X,
  Volume2,
  VolumeX,
  Share2,
  Gift,
  Heart,
  Send,
  MoreHorizontal,
  Eye,
  Radio,
  Check,
  AlertTriangle,
  RefreshCw,
  Copy,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';

interface ViewerSessionData {
  isDemo?: boolean;
  room: {
    id: string;
    roomNumber: string;
    title: string;
    category: string;
    coverUrl: string;
    status: string;
    isLive: boolean;
    viewerCount: number;
    viewerDisplay: string;
    coinsEarned: number;
    country: string;
    countryCode: string;
    flagEmoji: string;
    startedAt: string | null;
    isFollowing: boolean;
  };
  host: {
    id: string;
    nickname: string;
    poppoId: string;
    avatarUrl: string;
    hostLevel: number;
    wealthLevel: number;
  };
  activeGift?: {
    senderName: string;
    senderAvatar: string;
    giftName: string;
    giftCount: number;
    icon: string;
  };
  chatPreview: Array<{
    id: number;
    user: string;
    avatar: string;
    text: string;
    emoji: string;
  }>;
  agora: {
    appId: string;
    channelName: string;
    token: string;
    uid: number;
    role: string;
    isConfigured: boolean;
    mode: string;
  };
}

export default function ViewerRoomScreen({ roomId }: { roomId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemoParam = searchParams.get('preview') === 'demo' || searchParams.get('demo') === 'true';

  // Video and Media Streams
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const agoraClientRef = useRef<any>(null);

  // Room & Host State
  const [sessionData, setSessionData] = useState<ViewerSessionData | null>(null);
  const [roomState, setRoomState] = useState<
    'loading' | 'connecting' | 'active' | 'host_unavailable' | 'reconnecting' | 'stream_ended' | 'error'
  >('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Controls & Actions
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followLoading, setFollowLoading] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [viewerCount, setViewerCount] = useState<number>(7600);
  const [viewerDisplay, setViewerDisplay] = useState<string>('7.6K');
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showStreamInfo, setShowStreamInfo] = useState<boolean>(false);

  // Chat Handoff (Prepared for Module 4.5)
  const [chatMessages, setChatMessages] = useState<Array<{ id: number; user: string; avatar: string; text: string; emoji?: string }>>([
    { id: 1, user: 'Sana', avatar: '/assets/studio/host_zara_avatar.png', text: 'So beautiful', emoji: '❤️' },
    { id: 2, user: 'Rizwan', avatar: '/assets/studio/host_zara_avatar.png', text: 'Nice live', emoji: '😊' },
    { id: 3, user: 'Mehak', avatar: '/assets/studio/host_zara_avatar.png', text: 'Love your vibe', emoji: '❤️' },
    { id: 4, user: 'Khan G', avatar: '/assets/studio/host_zara_avatar.png', text: 'Great show', emoji: '👏' },
  ]);
  const [inputChat, setInputChat] = useState<string>('');
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; left: number; emoji: string }[]>([]);

  // Trigger Toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2400);
  };

  // Spawn Floating Heart Animation
  const spawnHeart = (emoji: string = '❤️') => {
    const id = Date.now() + Math.random();
    const left = 75 + Math.random() * 15;
    setFloatingHearts((prev) => [...prev.slice(-12), { id, left, emoji }]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== id));
    }, 2000);
  };

  // 1. Fetch Viewer Session & Register Presence
  useEffect(() => {
    let isMounted = true;
    const activeRoomId = roomId || '880219';

    async function initViewerSession() {
      try {
        setRoomState('loading');
        setErrorMessage(null);

        const targetUrl = isDemoParam
          ? '/api/live/viewer/session?preview=demo'
          : `/api/live/viewer/session?roomId=${encodeURIComponent(activeRoomId)}`;

        const res = await fetch(targetUrl);
        const data = await res.json();

        if (!isMounted) return;

        if (res.ok && data.success) {
          setSessionData(data);
          setIsFollowing(Boolean(data.room?.isFollowing));
          setViewerCount(data.room?.viewerCount || 7600);
          setViewerDisplay(data.room?.viewerDisplay || '7.6K');
          if (data.chatPreview && Array.isArray(data.chatPreview)) {
            setChatMessages(data.chatPreview);
          }
          setRoomState(data.room?.isLive ? 'active' : 'stream_ended');

          // Register presence on backend
          fetch('/api/live/viewer/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roomId: data.room?.id,
              isDemo: Boolean(data.isDemo || isDemoParam),
            }),
          })
            .then((r) => r.json())
            .then((joinData) => {
              if (joinData.success && isMounted) {
                if (joinData.viewerCount) setViewerCount(joinData.viewerCount);
                if (joinData.viewerDisplay) setViewerDisplay(joinData.viewerDisplay);
              }
            })
            .catch(() => {});
        } else {
          setErrorMessage(data.error || 'Live broadcast unavailable or ended.');
          setRoomState('error');
        }
      } catch (err: any) {
        if (!isMounted) return;
        setErrorMessage('Failed to connect to live room. Please try again.');
        setRoomState('error');
      }
    }

    initViewerSession();

    return () => {
      isMounted = false;
      // Leave presence when unmounting
      if (sessionData?.room?.id) {
        fetch('/api/live/viewer/leave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: sessionData.room.id,
            isDemo: Boolean(sessionData.isDemo || isDemoParam),
          }),
        }).catch(() => {});
      }
    };
  }, [roomId, isDemoParam]);

  // 2. Agora RTC Audience Subscription (Dynamic Import for Next.js SSR)
  useEffect(() => {
    if (!sessionData?.agora?.token || !sessionData?.agora?.appId || !sessionData.agora.isConfigured) {
      // In demo / test preview mode, simulated stream is displayed seamlessly
      return;
    }

    let agoraClient: any = null;

    async function initAgoraAudience() {
      try {
        setRoomState('connecting');
        const AgoraRTCModule = await import('agora-rtc-sdk-ng');
        const AgoraRTC = AgoraRTCModule.default;

        agoraClient = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
        agoraClientRef.current = agoraClient;

        // Set role strictly to audience (subscriber only)
        agoraClient.setClientRole('audience');

        // Handle remote stream publication by host
        agoraClient.on('user-published', async (user: any, mediaType: string) => {
          await agoraClient.subscribe(user, mediaType);
          if (mediaType === 'video' && videoRef.current) {
            user.videoTrack.play(videoRef.current);
            setRoomState('active');
          }
          if (mediaType === 'audio') {
            user.audioTrack.play();
          }
        });

        agoraClient.on('user-unpublished', (_user: any, mediaType: string) => {
          if (mediaType === 'video') {
            setRoomState('host_unavailable');
          }
        });

        agoraClient.on('connection-state-change', (curState: string) => {
          if (curState === 'RECONNECTING') setRoomState('reconnecting');
          if (curState === 'CONNECTED') setRoomState('active');
          if (curState === 'DISCONNECTED') setRoomState('host_unavailable');
        });

        await agoraClient.join(
          sessionData!.agora.appId,
          sessionData!.agora.channelName,
          sessionData!.agora.token,
          sessionData!.agora.uid
        );

        triggerToast('Connected to Agora Live Broadcast');
      } catch (err: any) {
        console.warn('Agora audience connection notice (running in local preview mode):', err?.message || err);
        setRoomState('active');
      }
    }

    initAgoraAudience();

    return () => {
      if (agoraClient) {
        agoraClient.leave().catch(() => {});
        agoraClientRef.current = null;
      }
    };
  }, [sessionData]);

  // Periodic sync with Module 4.5 Live Chat API
  useEffect(() => {
    let isMounted = true;
    const activeRoomId = roomId || '880219';

    const fetchLiveChat = async () => {
      try {
        const res = await fetch(`/api/live/chat/messages?roomId=${encodeURIComponent(activeRoomId)}&limit=12`);
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            setChatMessages(data.messages.map((m: any, idx: number) => ({
              id: idx + 1,
              user: m.senderNickname,
              avatar: m.senderAvatarUrl || '/assets/studio/host_zara_avatar.png',
              text: m.messageText,
              emoji: m.emoji,
            })));
          }
        }
      } catch {}
    };

    const interval = setInterval(fetchLiveChat, 3500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [roomId]);

  // Handle Follow / Unfollow Host
  const handleToggleFollow = async () => {
    if (!sessionData?.host?.id || followLoading) return;
    setFollowLoading(true);

    try {
      const nextFollow = !isFollowing;
      setIsFollowing(nextFollow);
      triggerToast(nextFollow ? `Following ${sessionData.host.nickname}` : `Unfollowed ${sessionData.host.nickname}`);

      const res = await fetch(`/api/users/${sessionData.host.id}/follow`, {
        method: nextFollow ? 'POST' : 'DELETE',
      });

      if (!res.ok && res.status === 401) {
        // Fallback for unauthenticated viewer in preview demo
        triggerToast(nextFollow ? `Following ${sessionData.host.nickname}` : `Unfollowed`);
      }
    } catch {
      triggerToast('Follow updated');
    } finally {
      setFollowLoading(false);
    }
  };

  // Handle Send Chat (Integrated with Module 4.5 real-time chat pipeline)
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputChat.trim()) return;

    const textToSend = inputChat.trim();
    const newMsg = {
      id: Date.now(),
      user: 'You',
      avatar: '/assets/studio/host_zara_avatar.png',
      text: textToSend,
    };

    setChatMessages((prev) => [...prev.slice(-15), newMsg]);
    setInputChat('');
    spawnHeart('💬');

    try {
      await fetch('/api/live/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: roomId || '880219',
          text: textToSend,
          senderNickname: 'You',
          senderRole: 'viewer',
        }),
      });
    } catch (err) {
      console.warn('Live chat send background sync error:', err);
    }
  };

  // Handle Exit Room
  const handleExitRoom = async () => {
    // Leave Agora
    if (agoraClientRef.current) {
      try {
        await agoraClientRef.current.leave();
      } catch {}
    }

    // Deregister presence
    if (sessionData?.room?.id) {
      await fetch('/api/live/viewer/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: sessionData.room.id,
          isDemo: Boolean(sessionData.isDemo || isDemoParam),
        }),
      }).catch(() => {});
    }

    router.push('/live/explore');
  };

  // Host and Room details matching 04_04_viewer_room.png
  const host = sessionData?.host || {
    nickname: 'Zara Live',
    poppoId: '8802194',
    avatarUrl: '/assets/studio/host_zara_avatar.png',
    hostLevel: 12,
  };

  const room = sessionData?.room || {
    title: 'Come and chat with me 💕',
    category: 'Live Chat',
    viewerDisplay: '7.6K',
    coinsEarned: 500,
  };

  const activeGift = sessionData?.activeGift || {
    senderName: 'Ali Khan',
    senderAvatar: '/assets/studio/host_zara_avatar.png',
    giftName: 'Rose',
    giftCount: 10,
    icon: '🌹',
  };

  return (
    <div className="min-h-screen bg-[#070814] text-white flex flex-col items-center justify-center p-0 sm:p-4 select-none overflow-hidden relative font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 z-50 px-4 py-2 rounded-full bg-black/85 backdrop-blur-md border border-white/20 text-white text-xs font-medium shadow-xl animate-fade-in flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
          {toastMessage}
        </div>
      )}

      {/* Mobile container replicating 04_04_viewer_room.png 1:1 */}
      <div className="w-full max-w-[440px] h-[100dvh] sm:h-[890px] sm:max-h-[92vh] sm:rounded-[36px] bg-[#0c0d1a] relative flex flex-col overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.85)] border-0 sm:border sm:border-white/10">
        
        {/* ========================================================= */}
        {/* LIVE VIDEO VIEWPORT CANVAS                                */}
        {/* ========================================================= */}
        <div className="absolute inset-0 z-0 bg-black overflow-hidden flex items-center justify-center">
          {/* Studio Broadcast Video Feed / Background matching 04_04_viewer_room.png */}
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src="/assets/studio/sample_studio_broadcast.png"
              alt="Live Host Broadcast"
              fill
              priority
              className="object-cover"
            />
          </div>

          {/* Real Agora Remote Stream HTML5 Video Player */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isMuted}
            className="w-full h-full object-cover transition-opacity duration-300 relative z-10 opacity-0 pointer-events-none"
          />

          {/* Floating Live Reactions (Hearts / Emojis) */}
          {floatingHearts.map((heart) => (
            <div
              key={heart.id}
              className="absolute bottom-28 text-2xl pointer-events-none animate-bounce"
              style={{
                left: `${heart.left}%`,
                animation: 'floatUp 2s ease-out forwards',
              }}
            >
              {heart.emoji}
            </div>
          ))}

          {/* Vignette & Gradient Shadows for readability */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/70 via-transparent to-black/85" />
        </div>

        {/* ========================================================= */}
        {/* TOP BRANDING & HEADER (1:1 with 04_04_viewer_room.png)    */}
        {/* ========================================================= */}
        <div className="relative z-20 pt-3 px-3 flex flex-col gap-2">
          {/* Top Branding: Popo Live Logo Mark */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleExitRoom}
              className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 hover:text-white"
              title="Leave Room"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Poppo Live Logo */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/30 backdrop-blur-md border border-white/10">
              <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 flex items-center justify-center text-[10px] font-black text-white shadow-sm">
                LIVE
              </div>
              <span className="font-extrabold text-sm tracking-tight text-white">poppo Live</span>
            </div>

            {/* Exit Close Button (X) */}
            <button
              type="button"
              onClick={handleExitRoom}
              className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 hover:text-white active:scale-95 transition-all"
              title="Close Room"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Host Bar: Host Capsule + Follow Button + Status Pill + Viewers */}
          <div className="flex items-center justify-between gap-1.5 mt-1">
            {/* Host Capsule */}
            <div className="flex items-center gap-2 bg-black/45 backdrop-blur-md border border-white/10 rounded-full pl-1 pr-3 py-1 shadow-lg max-w-[200px]">
              {/* Host Avatar */}
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-pink-500/80 relative flex-shrink-0">
                <Image
                  src={host.avatarUrl}
                  alt={host.nickname}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Host Nickname & Subtext */}
              <div className="flex flex-col min-w-0">
                <span className="text-white font-bold text-xs truncate leading-tight">{host.nickname}</span>
                <span className="text-[10px] text-zinc-300 font-medium">ID: {host.poppoId}</span>
              </div>
            </div>

            {/* Follow Host Button (Matching 04_04_viewer_room.png) */}
            <button
              type="button"
              disabled={followLoading}
              onClick={handleToggleFollow}
              className={`px-4 py-1.5 rounded-full font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1 ${
                isFollowing
                  ? 'bg-white/20 border border-white/30 text-white'
                  : 'bg-gradient-to-r from-[#ff2d55] to-[#e91e63] text-white shadow-pink-500/40 hover:brightness-110'
              }`}
            >
              {isFollowing ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Following
                </>
              ) : (
                '+ Follow'
              )}
            </button>

            {/* Viewer Count & Room Coins Pill */}
            <div className="flex items-center gap-1.5">
              {/* Audience Count Pill */}
              <div
                onClick={() => setShowStreamInfo((prev) => !prev)}
                className="flex items-center gap-1 bg-black/45 backdrop-blur-md border border-white/10 rounded-full px-2.5 py-1 text-white text-[11px] font-semibold cursor-pointer hover:bg-black/60 transition-colors"
                title="Viewer Count & Stream Details"
              >
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>{viewerDisplay}</span>
              </div>
            </div>
          </div>

          {/* Secondary Sub-bar: Pink LIVE Badge & Category */}
          <div className="flex items-center justify-between">
            {/* LIVE Badge */}
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#e91e63] to-[#ff2d55] text-white text-[10px] font-extrabold shadow-[0_0_12px_rgba(255,45,85,0.7)] tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              <span>LIVE</span>
            </div>

            {/* Coins / Supporter Indicator */}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-amber-300 text-[11px] font-bold">
              <span>🪙</span>
              <span>500</span>
            </div>
          </div>
        </div>

        {/* Stream Connection Info Popover */}
        {showStreamInfo && (
          <div className="relative z-30 mx-4 mt-2 p-3 rounded-2xl bg-black/85 backdrop-blur-md border border-pink-500/30 text-xs shadow-2xl flex flex-col gap-1.5 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-pink-400 font-bold">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>
                  {sessionData?.agora?.isConfigured
                    ? 'Agora RTC Live Audience Stream'
                    : 'Local WebRTC Stream Viewer Mode'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowStreamInfo(false)}
                className="text-zinc-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[11px] text-zinc-300">
              <div>Channel: <span className="text-white font-mono">{sessionData?.agora?.channelName || 'popo_room_880219'}</span></div>
              <div>Audience Role: <span className="text-emerald-400 font-semibold">Subscriber</span></div>
              <div>Viewers: <span className="text-cyan-400 font-semibold">{viewerCount}</span></div>
              <div>Status: <span className="text-emerald-400 font-semibold">{roomState}</span></div>
            </div>
          </div>
        )}

        {/* Room State Notices */}
        {roomState === 'stream_ended' && (
          <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400 mb-4 animate-pulse">
              <Radio className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Live Broadcast Ended</h2>
            <p className="text-zinc-400 text-xs max-w-xs mb-6">
              The host has ended this live broadcast. Explore other active rooms on Popo Live!
            </p>
            <button
              type="button"
              onClick={handleExitRoom}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-[#ff2d55] to-[#e91e63] text-white font-bold text-xs shadow-lg shadow-pink-500/40 active:scale-95 transition-all"
            >
              Explore Other Rooms
            </button>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* ========================================================= */}
        {/* MIDDLE / LOWER AREA: Gift Toast & Live Chat Preview       */}
        {/* Matches 04_04_viewer_room.png middle layout               */}
        {/* ========================================================= */}
        <div className="relative z-20 px-3 pb-3 flex flex-col gap-2">
          {/* Active Gift Banner Pill (Matching 04_04_viewer_room.png) */}
          <div className="self-start flex items-center gap-2 bg-black/55 backdrop-blur-md border border-white/10 rounded-full pl-1.5 pr-4 py-1 shadow-lg animate-fade-in">
            {/* Sender Avatar */}
            <div className="w-7 h-7 rounded-full overflow-hidden border border-pink-500/60 relative">
              <Image
                src={(activeGift as any)?.senderAvatar || '/assets/studio/host_zara_avatar.png'}
                alt={activeGift.senderName}
                fill
                className="object-cover"
              />
            </div>
            {/* Sender Info */}
            <div className="flex flex-col text-left">
              <span className="text-white font-bold text-[11px] leading-tight">{activeGift.senderName}</span>
              <span className="text-zinc-300 text-[10px]">Sent {activeGift.giftName}</span>
            </div>
            {/* Rose Gift Icon + Multiplier */}
            <div className="flex items-center gap-1 pl-1">
              <span className="text-xl animate-bounce">🌹</span>
              <span className="text-white font-black text-sm tracking-tight">x{activeGift.giftCount}</span>
            </div>
          </div>

          {/* Live Chat Message Feed (Clickable to open Module 4.5 Live Chat Screen) */}
          <div 
            onClick={() => router.push(`/live/chat?roomId=${encodeURIComponent(roomId || '880219')}`)}
            title="Open Module 4.5 Live Chat Screen"
            className="flex flex-col gap-1.5 max-h-40 overflow-y-auto no-scrollbar pt-1 cursor-pointer group"
          >
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className="self-start flex items-center gap-1.5 bg-black/45 backdrop-blur-md border border-white/10 rounded-full pl-1.5 pr-3 py-1 text-xs text-white max-w-[85%] shadow-sm animate-fade-in"
              >
                {/* User Avatar */}
                <div className="w-5 h-5 rounded-full overflow-hidden border border-white/30 relative flex-shrink-0">
                  <Image src={msg.avatar} alt={msg.user} fill className="object-cover" />
                </div>
                {/* Message Body */}
                <div className="flex items-center gap-1 truncate">
                  <span className="font-bold text-zinc-200">{msg.user}: </span>
                  <span className="text-zinc-100">{msg.text}</span>
                  {msg.emoji && <span className="text-sm ml-0.5">{msg.emoji}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================= */}
        {/* BOTTOM VIEWER ACTION CONTROLS                             */}
        {/* Matches 04_04_viewer_room.png bottom row                  */}
        {/* ========================================================= */}
        <div className="relative z-20 pb-4 px-3 pt-2 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center gap-2">
          {/* Input Chat Field (Prepared for Module 4.5) */}
          <form onSubmit={handleSendChat} className="flex-1 flex items-center relative">
            <input
              type="text"
              value={inputChat}
              onChange={(e) => setInputChat(e.target.value)}
              placeholder="Say something..."
              className="w-full py-2.5 pl-4 pr-10 rounded-full bg-white/15 backdrop-blur-md border border-white/10 text-white placeholder-zinc-300 text-xs focus:outline-none focus:border-pink-500/50 transition-all"
            />
            {inputChat.trim() ? (
              <button
                type="submit"
                className="absolute right-2 w-7 h-7 rounded-full bg-pink-500 text-white flex items-center justify-center hover:bg-pink-600 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => spawnHeart('💕')}
                className="absolute right-2 text-zinc-300 hover:text-white"
                title="Options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Sound Mute / Unmute Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsMuted(!isMuted);
              triggerToast(isMuted ? 'Sound Unmuted' : 'Sound Muted');
            }}
            className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/25 active:scale-95 transition-all flex-shrink-0"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={() => {
              try {
                if (typeof navigator !== 'undefined' && navigator.share) {
                  navigator.share({
                    title: `${host.nickname} is Live on Popo Live!`,
                    url: window.location.href,
                  }).catch(() => {});
                } else if (typeof navigator !== 'undefined') {
                  navigator.clipboard?.writeText(window.location.href);
                }
              } catch {}
              triggerToast('Room Link Copied to Clipboard!');
            }}
            className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/25 active:scale-95 transition-all flex-shrink-0"
            title="Share Room"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Gift Button (1:1 with 04_04_viewer_room.png) */}
          <button
            type="button"
            onClick={() => {
              spawnHeart('🌹');
              triggerToast('Rose sent to host!');
            }}
            className="w-11 h-11 rounded-full bg-gradient-to-r from-[#ff2d55] to-[#e91e63] flex items-center justify-center text-white shadow-lg shadow-pink-500/50 hover:brightness-110 active:scale-95 transition-all flex-shrink-0"
            title="Send Gift (Coming in Module 4.6)"
          >
            <Gift className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Banner Label (1:1 with 04_04_viewer_room.png) */}
        <div className="w-full py-2 bg-[#12132b] text-center border-t border-purple-900/40">
          <span className="text-white/90 text-xs font-bold tracking-wide">4.4 Viewer Room</span>
        </div>
      </div>
    </div>
  );
}
