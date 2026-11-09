'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import SafetyToolsScreen from './SafetyToolsScreen';

interface ChatMessage {
  id: string;
  senderNickname: string;
  senderAvatarUrl?: string;
  senderRole?: string;
  messageText: string;
  emoji?: string;
  createdAt: string;
}

interface RoomItem {
  id: string;
  roomNumber: string;
  title: string;
  coverUrl: string;
  viewerCount: number;
  viewerDisplay: string;
  category: string;
  host: {
    nickname: string;
    avatarUrl: string;
    poppoId: string;
    level: number;
  };
}

const QUICK_EMOJIS = ['💕', '😊', '❤️', '👏', '🔥', '🎉', '✨', '👍', '🌹', '👑', '💃', '🎵'];

interface WebWatchStudioProps {
  defaultMode?: 'watch' | 'studio';
}

export default function WebWatchStudioScreen({ defaultMode }: WebWatchStudioProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mode: 'watch' (Viewer) or 'studio' (Host broadcaster)
  const initialMode = defaultMode || (searchParams.get('mode') === 'studio' ? 'studio' : 'watch');
  const [activeMode, setActiveMode] = useState<'watch' | 'studio'>(initialMode);
  const roomId = searchParams.get('roomId') || '880219';

  // Video and Streaming state
  const viewerVideoRef = useRef<HTMLVideoElement | null>(null);
  const studioVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const agoraClientRef = useRef<any>(null);

  // Room & Host info
  const [roomData, setRoomData] = useState<any>({
    roomNumber: '880219',
    title: 'Come and chat with me 💕',
    category: 'Live Chat',
    viewerDisplay: '7.6K',
    viewerCount: 7600,
    coverUrl: '/assets/viewer/sample_viewer_broadcast.png',
  });

  const [hostData, setHostData] = useState<any>({
    id: 'demo-host-zara',
    nickname: 'Zara Live',
    poppoId: '8802194',
    avatarUrl: '/assets/studio/host_zara_avatar.png',
    level: 12,
  });

  // Watch Mode State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(85);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'idle'>('connected');
  const [showRoomPicker, setShowRoomPicker] = useState<boolean>(false);
  const [availableRooms, setAvailableRooms] = useState<RoomItem[]>([]);

  // Studio Mode State
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [cameraEnabled, setCameraEnabled] = useState<boolean>(true);
  const [micEnabled, setMicEnabled] = useState<boolean>(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [streamDuration, setStreamDuration] = useState<number>(868); // 14m 28s

  // Chat & Right Panel State
  const [activeTab, setActiveTab] = useState<'chat' | 'audience' | 'top_fans'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());
  const [mutedUserIds, setMutedUserIds] = useState<Set<string>>(new Set());
  const [showSafetyTools, setShowSafetyTools] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Trigger Toast Notification
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2800);
  };

  // 1. Fetch Session Info & Available Rooms
  useEffect(() => {
    fetch(`/api/live/web-watch/session?roomId=${encodeURIComponent(roomId)}&preview=demo`)
      .then((r) => r.json())
      .then((d) => {
        if (d.room) setRoomData(d.room);
        if (d.host) setHostData(d.host);
      })
      .catch(console.error);

    fetch('/api/live/web-watch/rooms')
      .then((r) => r.json())
      .then((d) => {
        if (d.rooms) setAvailableRooms(d.rooms);
      })
      .catch(console.error);

    // Fetch active safety blocks & mutes
    fetch('/api/live/safety/block')
      .then((r) => r.json())
      .then((d) => {
        if (d.blockedUserIds) setBlockedUserIds(new Set(d.blockedUserIds));
      })
      .catch(() => {});

    fetch(`/api/live/safety/mute?roomId=${encodeURIComponent(roomId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.mutedUserIds) setMutedUserIds(new Set(d.mutedUserIds));
      })
      .catch(() => {});
  }, [roomId]);

  // 2. Fetch Chat Messages & Polling (Module 4.5 Integration)
  useEffect(() => {
    let isMounted = true;
    const fetchChat = async () => {
      try {
        const res = await fetch(`/api/live/chat/messages?roomId=${encodeURIComponent(roomId)}&preview=demo`);
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.messages) {
            setMessages(data.messages);
          }
        }
      } catch {}
    };

    fetchChat();
    const interval = setInterval(fetchChat, 2500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [roomId]);

  // 3. Studio Mode: Request Real Camera & Microphone
  useEffect(() => {
    if (activeMode !== 'studio') {
      // Stop local media stream if switching out of studio
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      return;
    }

    let isCancelled = false;
    async function startCamera() {
      try {
        setPermissionError(null);
        if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true,
          });

          if (!isCancelled) {
            mediaStreamRef.current = stream;
            if (studioVideoRef.current) {
              studioVideoRef.current.srcObject = stream;
              studioVideoRef.current.play().catch(() => {});
            }
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.warn('Web Studio camera access notice:', err?.message || err);
          setPermissionError('Camera or microphone permission not granted. Running in studio preview mode.');
        }
      }
    }

    startCamera();

    return () => {
      isCancelled = true;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [activeMode, facingMode]);

  // Studio Timer Interval
  useEffect(() => {
    if (!isBroadcasting) return;
    const timer = setInterval(() => setStreamDuration((d) => d + 1), 1000);
    return () => clearInterval(timer);
  }, [isBroadcasting]);

  // Format Duration seconds into HH:MM:SS
  const formatDuration = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Toggle Camera Track
  const handleToggleCamera = () => {
    if (mediaStreamRef.current) {
      const videoTracks = mediaStreamRef.current.getVideoTracks();
      videoTracks.forEach((t) => (t.enabled = !cameraEnabled));
    }
    setCameraEnabled(!cameraEnabled);
    triggerToast(cameraEnabled ? 'Camera turned OFF' : 'Camera turned ON');
  };

  // Toggle Microphone Track
  const handleToggleMic = () => {
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      audioTracks.forEach((t) => (t.enabled = !micEnabled));
    }
    setMicEnabled(!micEnabled);
    triggerToast(micEnabled ? 'Microphone muted' : 'Microphone unmuted');
  };

  // Flip Camera
  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
    triggerToast('Camera flipped');
  };

  // Toggle Broadcast Action (Publish to Agora / DB)
  const handleToggleBroadcast = async () => {
    const nextState = !isBroadcasting;
    setIsBroadcasting(nextState);

    try {
      const res = await fetch('/api/live/web-watch/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          title: roomData.title,
          category: roomData.category,
          action: nextState ? 'start' : 'stop',
        }),
      });

      const data = await res.json();
      if (data.success) {
        triggerToast(nextState ? '🔴 Broadcasting Live to Web & Mobile!' : 'Broadcast ended.');
        if (!nextState) {
          setTimeout(() => {
            router.push(`/live/end-screen?roomId=${roomId}`);
          }, 800);
        }
      }
    } catch {
      triggerToast(nextState ? 'Broadcast active (local mode)' : 'Broadcast ended');
      if (!nextState) {
        setTimeout(() => {
          router.push(`/live/end-screen?roomId=${roomId}`);
        }, 800);
      }
    }
  };

  // Send Chat Message (Module 4.5 Pipeline)
  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const textToSend = chatInput.trim();
    if (!textToSend) return;

    const newMsg: ChatMessage = {
      id: `web-${Date.now()}`,
      senderNickname: activeMode === 'studio' ? hostData.nickname : 'You',
      senderRole: activeMode === 'studio' ? 'host' : 'viewer',
      messageText: textToSend,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setChatInput('');
    setShowEmojiPicker(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    try {
      await fetch('/api/live/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          text: textToSend,
          senderNickname: activeMode === 'studio' ? hostData.nickname : 'You',
          senderRole: activeMode === 'studio' ? 'host' : 'viewer',
        }),
      });
    } catch {}
  };

  // Filter messages based on Module 4.6 Safety blocks/mutes
  const visibleMessages = messages.filter(
    (m) => !blockedUserIds.has(m.senderNickname) && !mutedUserIds.has(m.senderNickname)
  );

  return (
    <div className="min-h-screen bg-[#070817] text-white flex flex-col font-sans selection:bg-pink-500 selection:text-white">
      {/* ======================================================== */}
      {/* 1. TOP HEADER & GLOBAL NAVIGATION                        */}
      {/* ======================================================== */}
      <header className="h-14 px-4 sm:px-6 bg-[#0a0c24]/90 backdrop-blur-md border-b border-white/10 flex items-center justify-between sticky top-0 z-40">
        {/* Left: Popo Live Branding */}
        <div className="flex items-center gap-6">
          <Link href="/live/explore" className="flex items-center gap-1.5 group">
            <span className="font-extrabold text-xl tracking-tight text-white font-sans">
              poppo <span className="text-[#a855f7] font-semibold text-lg">Live</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 text-xs sm:text-sm font-medium">
            <Link href="/live/explore" className="text-white/60 hover:text-white transition">Explore</Link>
            <Link href="/live/following" className="text-white/60 hover:text-white transition">Following</Link>
            <button
              onClick={() => setActiveMode('watch')}
              className={`transition font-semibold ${activeMode === 'watch' ? 'text-pink-400 border-b-2 border-pink-500 pb-0.5' : 'text-white/60 hover:text-white'}`}
            >
              Web Watch
            </button>
            <button
              onClick={() => setActiveMode('studio')}
              className={`transition font-semibold ${activeMode === 'studio' ? 'text-pink-400 border-b-2 border-pink-500 pb-0.5' : 'text-white/60 hover:text-white'}`}
            >
              Web Studio
            </button>
            <Link href="/safety" className="text-white/60 hover:text-white transition">Safety</Link>
          </nav>
        </div>

        {/* Center / Mode Switcher Pill */}
        <div className="bg-[#141630] rounded-full p-1 border border-white/10 flex items-center">
          <button
            data-mode="watch"
            onClick={() => setActiveMode('watch')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
              activeMode === 'watch'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/25'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <span>👁️</span>
            <span className="hidden sm:inline">Web Watch</span>
          </button>
          <button
            data-mode="studio"
            onClick={() => setActiveMode('studio')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
              activeMode === 'studio'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/25'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <span>🎥</span>
            <span className="hidden sm:inline">Web Studio</span>
          </button>
        </div>

        {/* Right Actions: Wealth Level & Go-Live */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 bg-[#171936] border border-white/10 rounded-full px-2.5 py-1 text-xs">
            <span className="bg-amber-400 text-black font-extrabold text-[10px] px-1.5 py-0.2 rounded">Lv.12</span>
            <span className="text-white/70">🪙 500</span>
          </div>

          <button
            onClick={() => setActiveMode(activeMode === 'watch' ? 'studio' : 'watch')}
            className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#ff2a54] to-[#f43f5e] hover:brightness-110 text-white font-bold text-xs shadow-md shadow-pink-500/30 transition active:scale-95"
          >
            {activeMode === 'watch' ? '+ Go Live (Studio)' : 'Watch Streams'}
          </button>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs rounded-full shadow-xl shadow-pink-500/30 animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. MAIN WORKSPACE (SPLIT LAYOUT: 65% VIDEO + 35% CHAT)   */}
      {/* ======================================================== */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative max-w-7xl w-full mx-auto p-2 sm:p-4 gap-3 sm:gap-4">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: LIVE VIDEO PLAYER OR STUDIO BROADCASTER    */}
        {/* ======================================================== */}
        <div className="flex-[2] flex flex-col bg-[#0b0d26] rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative group">
          
          {/* Top Video Overlay Bar */}
          <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
            {/* Host Profile Info */}
            <div className="flex items-center gap-2.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-2.5 py-1.5">
              <img
                src={hostData.avatarUrl || '/assets/studio/host_zara_avatar.png'}
                alt={hostData.nickname}
                className="w-8 h-8 rounded-full object-cover border border-pink-500"
              />
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-bold text-xs sm:text-sm">{hostData.nickname}</span>
                  <span className="bg-amber-400 text-black text-[9px] font-bold px-1 rounded">Lv.{hostData.level}</span>
                </div>
                <span className="text-[10px] text-white/60">ID: {hostData.poppoId}</span>
              </div>

              {/* Follow Button */}
              {activeMode === 'watch' && (
                <button
                  onClick={() => {
                    setIsFollowing(!isFollowing);
                    triggerToast(isFollowing ? 'Unfollowed' : `Following ${hostData.nickname}`);
                  }}
                  className={`ml-1 px-3 py-1 rounded-full text-xs font-bold transition ${
                    isFollowing ? 'bg-white/20 text-white' : 'bg-pink-500 hover:bg-pink-600 text-white shadow-sm'
                  }`}
                >
                  {isFollowing ? '✓ Followed' : '+ Follow'}
                </button>
              )}
            </div>

            {/* Live Indicator & Viewers */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-extrabold shadow-lg shadow-pink-500/40">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>{activeMode === 'studio' ? (isBroadcasting ? 'LIVE BROADCAST' : 'STUDIO PREVIEW') : 'LIVE'}</span>
              </div>

              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white text-xs font-semibold">
                <span>👁️</span>
                <span>{roomData.viewerDisplay || '7.6K'}</span>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* VIDEO CANVAS / STREAM DISPLAY                            */}
          {/* ======================================================== */}
          <div className="flex-1 min-h-[340px] sm:min-h-[460px] bg-black relative flex items-center justify-center overflow-hidden">
            {activeMode === 'watch' ? (
              /* WEB WATCH: REMOTE HOST STREAM */
              <div className="w-full h-full relative flex items-center justify-center">
                {/* Background Video / Simulated Host Stream */}
                <img
                  src={roomData.coverUrl || '/assets/viewer/sample_viewer_broadcast.png'}
                  alt="Live Broadcast"
                  className="w-full h-full object-cover filter brightness-95"
                />
                
                {/* Agora Remote Stream Video container */}
                <video
                  ref={viewerVideoRef}
                  autoPlay
                  playsInline
                  muted={isMuted}
                  className="absolute inset-0 w-full h-full object-cover opacity-90"
                />

                {/* Ambient glow effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d26] via-transparent to-black/30 pointer-events-none" />
              </div>
            ) : (
              /* WEB STUDIO: LOCAL CAMERA PREVIEW */
              <div className="w-full h-full relative flex items-center justify-center bg-zinc-950">
                {/* Real Browser Webcam Track */}
                <video
                  ref={studioVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraEnabled ? 'block' : 'hidden'} ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                />

                {/* If camera turned off */}
                {!cameraEnabled && (
                  <div className="flex flex-col items-center gap-2 text-white/50">
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-3xl">
                      📷
                    </div>
                    <p className="text-sm">Camera is turned OFF</p>
                  </div>
                )}

                {/* Permission Alert Notice */}
                {permissionError && (
                  <div className="absolute top-20 left-4 right-4 p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-200 text-xs backdrop-blur-md">
                    {permissionError}
                  </div>
                )}

                {/* Studio On-Air Badge */}
                <div className="absolute top-16 left-4 px-3 py-1 bg-black/60 backdrop-blur rounded-full text-xs font-mono font-bold text-pink-400 border border-pink-500/30">
                  ⏱️ {formatDuration(streamDuration)}
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* BOTTOM PLAYER / STUDIO CONTROLS BAR                      */}
          {/* ======================================================== */}
          <div className="p-3 bg-[#0e102e] border-t border-white/10 flex items-center justify-between gap-2 z-20">
            {activeMode === 'watch' ? (
              /* Watch Controls */
              <>
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Play/Pause */}
                  <button
                    onClick={() => {
                      setIsPlaying(!isPlaying);
                      triggerToast(isPlaying ? 'Stream Paused' : 'Stream Resumed');
                    }}
                    className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? '⏸️' : '▶️'}
                  </button>

                  {/* Volume / Mute */}
                  <div className="flex items-center gap-1.5 group/vol">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? '🔇' : '🔊'}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        setVolume(Number(e.target.value));
                        setIsMuted(false);
                      }}
                      className="w-16 sm:w-20 accent-pink-500 h-1 bg-white/20 rounded cursor-pointer"
                    />
                  </div>

                  {/* Stream Stats / Quality & Cost Guard Link (Module 4.9) */}
                  <Link
                    href={`/live/quality?roomId=${roomId}`}
                    title="Stream Quality & Cost Guard Settings (Module 4.9)"
                    className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-[11px] text-white/60 hover:text-white font-mono transition border border-white/5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>1080p 60fps | 24ms</span>
                  </Link>
                </div>

                <div className="flex items-center gap-2">
                  {/* Safety Tools Shield Trigger (Module 4.6) */}
                  <button
                    data-action="safety"
                    onClick={() => setShowSafetyTools(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition"
                    title="Safety Tools (Report, Block, Mute)"
                  >
                    <span>🛡️</span>
                    <span className="hidden sm:inline">Safety</span>
                  </button>

                  {/* Browse Rooms Drawer */}
                  <button
                    data-action="rooms"
                    onClick={() => setShowRoomPicker(!showRoomPicker)}
                    className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition flex items-center gap-1"
                  >
                    <span>📺</span>
                    <span className="hidden sm:inline">Rooms</span>
                  </button>
                </div>
              </>
            ) : (
              /* Studio Host Controls */
              <>
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Camera Toggle */}
                  <button
                    onClick={handleToggleCamera}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                      cameraEnabled ? 'bg-white/15 text-white' : 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    <span>📷</span>
                    <span>{cameraEnabled ? 'Cam ON' : 'Cam OFF'}</span>
                  </button>

                  {/* Microphone Toggle */}
                  <button
                    onClick={handleToggleMic}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                      micEnabled ? 'bg-white/15 text-white' : 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    <span>🎤</span>
                    <span>{micEnabled ? 'Mic ON' : 'Mic MUTED'}</span>
                  </button>

                  {/* Flip Camera */}
                  <button
                    onClick={handleFlipCamera}
                    className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition"
                    title="Flip camera"
                  >
                    🔄
                  </button>
                </div>

                {/* Broadcast Start / Stop Button */}
                <button
                  onClick={handleToggleBroadcast}
                  className={`px-4 py-2 rounded-full font-bold text-xs shadow-lg transition active:scale-95 flex items-center gap-2 ${
                    isBroadcasting
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/40'
                      : 'bg-gradient-to-r from-[#ff2a54] to-[#f43f5e] hover:brightness-110 text-white shadow-pink-500/40'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span>{isBroadcasting ? 'End Broadcast' : 'Start Live Broadcast'}</span>
                </button>
              </>
            )}
          </div>

          {/* Room Selector Drawer */}
          {showRoomPicker && (
            <div className="absolute bottom-14 left-3 right-3 p-3 bg-[#131533]/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl z-30">
              <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
                <span className="font-bold text-white">Active Live Rooms</span>
                <button onClick={() => setShowRoomPicker(false)} className="text-white/60 hover:text-white">✕</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 max-h-48 overflow-y-auto pr-1">
                {availableRooms.map((r) => (
                  <button
                    key={r.roomNumber}
                    onClick={() => {
                      router.push(`/live/web-watch?roomId=${r.roomNumber}`);
                      setShowRoomPicker(false);
                    }}
                    className="p-2 rounded-xl bg-[#1b1e42] hover:bg-pink-500/20 border border-white/5 hover:border-pink-500/30 text-left transition flex items-center gap-2"
                  >
                    <img src={r.host.avatarUrl} alt={r.host.nickname} className="w-7 h-7 rounded-full object-cover" />
                    <div className="truncate text-xs">
                      <span className="font-bold text-white block truncate">{r.host.nickname}</span>
                      <span className="text-[10px] text-pink-400">{r.viewerDisplay} viewers</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: INTERACTIVE CHAT & AUDIENCE PANEL          */}
        {/* ======================================================== */}
        <div className="flex-1 flex flex-col bg-[#0b0d26] rounded-2xl border border-white/10 shadow-2xl overflow-hidden min-h-[380px] sm:min-h-[460px]">
          
          {/* Segmented Control: Chat / Audience / Top Fans */}
          <div className="p-3 bg-[#0f1133] border-b border-white/10 flex items-center justify-between">
            <div className="bg-[#17193c] rounded-full p-1 flex items-center w-full border border-white/5">
              <button
                data-tab="chat"
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-1 rounded-full text-xs font-semibold transition text-center ${
                  activeTab === 'chat'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Live Chat
              </button>
              <button
                data-tab="audience"
                onClick={() => setActiveTab('audience')}
                className={`flex-1 py-1 rounded-full text-xs font-semibold transition text-center ${
                  activeTab === 'audience'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Audience (7.6K)
              </button>
              <button
                data-tab="topfans"
                onClick={() => setActiveTab('top_fans')}
                className={`flex-1 py-1 rounded-full text-xs font-semibold transition text-center ${
                  activeTab === 'top_fans'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Top Fans
              </button>
            </div>
          </div>

          {/* TAB 1: LIVE CHAT STREAM */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden relative">
              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {visibleMessages.map((msg) => (
                  <div key={msg.id} className="flex items-start gap-2.5">
                    <img
                      src={msg.senderAvatarUrl || '/assets/studio/host_zara_avatar.png'}
                      alt={msg.senderNickname}
                      className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-white/10"
                    />
                    <div className="leading-snug text-xs sm:text-[13px] pt-0.5">
                      {msg.senderRole === 'host' && (
                        <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full mr-1.5">
                          HOST
                        </span>
                      )}
                      <span className="text-[#a0a5ba] font-medium mr-1">{msg.senderNickname}:</span>
                      <span className="text-white font-normal break-words">{msg.messageText}</span>
                      {msg.emoji && <span className="ml-1">{msg.emoji}</span>}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} className="h-1" />
              </div>

              {/* Quick Emoji Tray */}
              {showEmojiPicker && (
                <div className="absolute bottom-16 left-3 right-3 bg-[#17193d] border border-white/10 rounded-2xl p-2.5 shadow-2xl z-20 backdrop-blur-md">
                  <div className="grid grid-cols-6 gap-2 text-center text-xl">
                    {QUICK_EMOJIS.map((e) => (
                      <button
                        key={e}
                        onClick={() => setChatInput((cur) => cur + e)}
                        className="p-1 hover:bg-white/10 rounded-lg transition active:scale-125"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Chat Input Form */}
              <div className="p-3 bg-[#0d0f2b] border-t border-white/10">
                <form onSubmit={handleSendChat} className="flex items-center gap-2">
                  <div className="flex-1 flex items-center bg-[#171938] border border-white/10 rounded-full px-3.5 py-2 focus-within:border-pink-500/50 transition">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Say something..."
                      maxLength={300}
                      className="flex-1 bg-transparent text-white placeholder-white/40 text-xs sm:text-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="text-white/70 hover:text-white p-0.5 ml-1 transition hover:scale-110"
                    >
                      😊
                    </button>
                  </div>

                  {chatInput.trim().length > 0 ? (
                    <button
                      type="submit"
                      className="w-9 h-9 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white text-xs font-bold hover:scale-105 active:scale-95 transition flex-shrink-0"
                    >
                      ➤
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => triggerToast('Rose sent to host! 🌹')}
                      className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#ff2a54] to-[#ff638b] shadow-md shadow-pink-500/30 flex items-center justify-center text-white flex-shrink-0 hover:scale-105 active:scale-95 transition"
                    >
                      🎁
                    </button>
                  )}
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: AUDIENCE LIST */}
          {activeTab === 'audience' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              <div className="text-xs text-white/60 pb-2 border-b border-white/5 flex items-center justify-between">
                <span>Viewers Online: <strong className="text-pink-400">7.6K</strong></span>
                <span>Active Status</span>
              </div>
              {['Sana Khan 🇵🇰 (Lv.15)', 'Rizwan Ahmad 🇦🇪 (Lv.12)', 'Mehak Noor 🇹🇷 (Lv.9)', 'Khan G 🇵🇰 (Lv.18)', 'Ayesha Malik 🇸🇦 (Lv.7)', 'Bilal Tariq 🇬🇧 (Lv.11)'].map((u, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-[#141635] border border-white/5">
                  <span className="text-xs font-semibold text-white">{u}</span>
                  <button className="px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-bold">
                    Viewer
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: TOP FANS */}
          {activeTab === 'top_fans' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              <div className="text-xs text-white/60 pb-2 border-b border-white/5">
                Top Diamond Contributors
              </div>
              {[
                { rank: '🥇', name: 'Khan G Official', coins: '45,000' },
                { rank: '🥈', name: 'Sana Khan', coins: '28,500' },
                { rank: '🥉', name: 'Rizwan Ahmad', coins: '14,200' },
                { rank: '#4', name: 'Bilal Tariq', coins: '8,900' },
              ].map((f, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-[#141635] border border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{f.rank}</span>
                    <span className="text-xs font-semibold text-white">{f.name}</span>
                  </div>
                  <span className="text-xs font-bold text-pink-400 font-mono">💎 {f.coins}</span>
                </div>
              ))}
            </div>
          )}

        </div>

      </main>

      {/* Safety Tools Modal Overlay (Module 4.6 Integration) */}
      {showSafetyTools && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="w-full max-w-[420px] rounded-3xl overflow-hidden shadow-2xl">
            <SafetyToolsScreen
              roomId={roomId}
              hostName={hostData.nickname}
              hostAvatar={hostData.avatarUrl}
              hostId={hostData.id}
              userRole="viewer"
              onClose={() => setShowSafetyTools(false)}
              onBlockSuccess={(blockedId) => {
                setBlockedUserIds((prev) => {
                  const next = new Set(prev);
                  next.add(blockedId);
                  return next;
                });
                triggerToast(`${hostData.nickname} has been blocked.`);
                setShowSafetyTools(false);
              }}
              onMuteSuccess={(mutedId) => {
                setMutedUserIds((prev) => {
                  const next = new Set(prev);
                  next.add(mutedId);
                  return next;
                });
                triggerToast('Participant muted in chat.');
              }}
            />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. BOTTOM FOOTER BANNER: "4.7 Web Watch and Web Studio"  */}
      {/* ======================================================== */}
      <footer className="h-9 bg-[#1a163a] border-t border-white/10 flex items-center justify-center z-30">
        <span className="text-white/90 text-xs sm:text-[13px] font-medium tracking-wide">
          4.7 Web Watch and Web Studio
        </span>
      </footer>
    </div>
  );
}
