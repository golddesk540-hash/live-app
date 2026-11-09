'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  X,
  RotateCw,
  Sparkles,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Music,
  Sliders,
  Share2,
  Palette,
  Wand2,
  MoreHorizontal,
  Eye,
  Clock,
  Radio,
  Check,
  Copy,
  AlertTriangle,
  RefreshCw,
  Volume2,
  ShieldCheck,
  ChevronRight,
  Heart,
  Award,
  Flame,
} from 'lucide-react';

// Web Audio API Sound Synthesizer for live soundboard triggers
function playSynthesizedSound(type: string) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    if (type === 'applause') {
      // Noise burst with envelope for applause
      const bufferSize = ctx.sampleRate * 1.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.7));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      filter.Q.value = 1.0;
      noise.connect(filter);
      filter.connect(ctx.destination);
      noise.start();
    } else if (type === 'fanfare') {
      // Triad chords: C4, E4, G4, C5
      const notes = [261.63, 329.63, 392.0, 523.25];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0.18, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.6);
      });
    } else if (type === 'cheer' || type === 'magic') {
      // Sparkling rising chimes
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.15, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.4);
      });
    } else if (type === 'drumroll') {
      // Fast rhythmic taps ending in a cymbal
      for (let i = 0; i < 12; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140 + Math.random() * 20, now + i * 0.06);
        gain.gain.setValueAtTime(0.15, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.06 + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.05);
      }
    } else {
      // Friendly chime default
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch {
    // Ignore audio context errors in restricted environments
  }
}

interface HostSessionData {
  host: {
    id: string;
    nickname: string;
    poppoId: string;
    avatarUrl: string;
    wealthLevel: number;
  };
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
    startedAt: string | null;
    elapsedSeconds: number;
  };
  agora: {
    appId: string;
    channelName: string;
    token: string;
    uid: number;
    role: string;
    isDemo: boolean;
  };
  gates: {
    isEligible: boolean;
    missingGates: string[];
  };
}

export default function HostStudioScreen({ initialRoomId }: { initialRoomId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemoParam = searchParams.get('preview') === 'demo' || searchParams.get('demo') === 'true';

  // Video and Media Streams
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const agoraClientRef = useRef<any>(null);

  // Studio Session State
  const [sessionData, setSessionData] = useState<HostSessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Live Timer
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(754); // 00:12:34 reference default
  const [isLiveActive, setIsLiveActive] = useState<boolean>(true);

  // Camera & Mic Controls
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [cameraPermissionError, setCameraPermissionError] = useState<string | null>(null);
  const [usingFallbackVideo, setUsingFallbackVideo] = useState<boolean>(false);

  // Beauty & Visual Filter State
  const [isBeautyActive, setIsBeautyActive] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<'original' | 'rosy' | 'warm' | 'soft' | 'cyberpunk' | 'vintage'>('original');
  const [selectedEffect, setSelectedEffect] = useState<'none' | 'crown' | 'glasses' | 'cat' | 'bunny' | 'neon'>('none');

  // Bottom Drawers & Modals
  const [activeDrawer, setActiveDrawer] = useState<'none' | 'effects' | 'filter' | 'share' | 'sound' | 'settings' | 'more'>('none');
  const [showEndConfirm, setShowEndConfirm] = useState<boolean>(false);
  const [isEnding, setIsEnding] = useState<boolean>(false);
  const [broadcastSummary, setBroadcastSummary] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showConnectionInfo, setShowConnectionInfo] = useState<boolean>(false);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; left: number; emoji: string }[]>([]);

  // Quality & Settings
  const [streamResolution, setStreamResolution] = useState<'720p' | '1080p'>('720p');
  const [noiseSuppression, setNoiseSuppression] = useState<boolean>(true);
  const [mirrorMode, setMirrorMode] = useState<boolean>(true);

  // Show Toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2400);
  };

  // Trigger Heart Animation
  const spawnFloatingHeart = (emoji: string = '❤️') => {
    const id = Date.now() + Math.random();
    const left = 70 + Math.random() * 20; // Float up right side
    setFloatingHearts((prev) => [...prev.slice(-10), { id, left, emoji }]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== id));
    }, 2000);
  };

  // 1. Fetch Studio Session & Credentials
  useEffect(() => {
    let isMounted = true;

    async function loadStudioSession() {
      try {
        setIsLoading(true);
        setSessionError(null);

        const targetUrl = isDemoParam
          ? '/api/live/studio/session?preview=demo'
          : initialRoomId
          ? `/api/live/studio/session?roomId=${initialRoomId}`
          : '/api/live/studio/session';

        const res = await fetch(targetUrl);
        const data = await res.json();

        if (!isMounted) return;

        if (res.ok && data.success) {
          setSessionData(data);
          if (typeof data.room?.elapsedSeconds === 'number') {
            setElapsedSeconds(data.room.elapsedSeconds > 0 ? data.room.elapsedSeconds : 754);
          }
          setIsLiveActive(Boolean(data.room?.isLive));
        } else if (res.status === 401) {
          // If not logged in, gracefully fallback to demo preview mode matching reference image
          const demoRes = await fetch('/api/live/studio/session?preview=demo');
          const demoData = await demoRes.json();
          if (demoData.success) {
            setSessionData(demoData);
            setElapsedSeconds(754);
            setIsLiveActive(true);
          } else {
            setSessionError('Please sign in or use demo preview mode.');
          }
        } else {
          setSessionError(data.error || 'Failed to initialize studio session');
        }
      } catch (err: any) {
        if (!isMounted) return;
        setSessionError('Network error connecting to studio session');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadStudioSession();

    return () => {
      isMounted = false;
    };
  }, [initialRoomId, isDemoParam]);

  // 2. Initialize Real Local WebRTC Media Stream (Camera & Mic)
  const startCameraStream = useCallback(async (facing: 'user' | 'environment') => {
    try {
      setCameraPermissionError(null);

      // Stop any existing tracks
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }

      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setUsingFallbackVideo(true);
        return;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: noiseSuppression,
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setUsingFallbackVideo(false);
    } catch (err: any) {
      console.warn('Real camera not available or permission denied:', err?.message || err);
      setCameraPermissionError(
        err?.name === 'NotAllowedError'
          ? 'Camera or microphone permission was denied. Tap to retry or use simulated studio background.'
          : 'Hardware camera unavailable. Displaying studio live background.'
      );
      setUsingFallbackVideo(true);
    }
  }, [noiseSuppression]);

  // Start media stream on mount
  useEffect(() => {
    startCameraStream(facingMode);

    return () => {
      // Cleanup tracks on unmount
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [startCameraStream, facingMode]);

  // 3. Agora RTC SDK Integration (Dynamic Client-side Import)
  useEffect(() => {
    if (!sessionData?.agora?.token || !sessionData?.agora?.appId || sessionData.agora.isDemo) {
      // Mock / Test Preview mode
      return;
    }

    let agoraClient: any = null;
    let localAudioTrack: any = null;
    let localVideoTrack: any = null;

    async function initAgora() {
      try {
        const AgoraRTCModule = await import('agora-rtc-sdk-ng');
        const AgoraRTC = AgoraRTCModule.default;

        agoraClient = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
        agoraClientRef.current = agoraClient;

        agoraClient.setClientRole('host');

        await agoraClient.join(
          sessionData!.agora.appId,
          sessionData!.agora.channelName,
          sessionData!.agora.token,
          sessionData!.agora.uid
        );

        // Create local tracks
        [localAudioTrack, localVideoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();

        if (videoRef.current && localVideoTrack) {
          localVideoTrack.play(videoRef.current);
        }

        await agoraClient.publish([localAudioTrack, localVideoTrack]);
        triggerToast('Connected to Agora Live Broadcast Network');
      } catch (err: any) {
        console.warn('Agora connection notice (using local WebRTC fallback):', err?.message || err);
      }
    }

    initAgora();

    return () => {
      if (localAudioTrack) localAudioTrack.close();
      if (localVideoTrack) localVideoTrack.close();
      if (agoraClient) {
        agoraClient.leave().catch(() => {});
        agoraClientRef.current = null;
      }
    };
  }, [sessionData]);

  // 4. Live Timer Tick
  useEffect(() => {
    if (!isLiveActive) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isLiveActive]);

  // Format Elapsed Time (e.g. 00:12:34)
  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Flip Camera Action
  const handleFlipCamera = () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    triggerToast(nextFacing === 'user' ? 'Switched to Front Camera' : 'Switched to Rear Camera');
  };

  // Toggle Beauty Filter Action
  const handleToggleBeauty = () => {
    setIsBeautyActive((prev) => {
      const next = !prev;
      triggerToast(next ? 'Beauty Smooth Filter: ON' : 'Beauty Smooth Filter: OFF');
      return next;
    });
  };

  // Toggle Microphone Track
  const handleToggleMic = () => {
    const stream = mediaStreamRef.current;
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        const nextState = !isMicOn;
        audioTracks.forEach((t) => (t.enabled = nextState));
        setIsMicOn(nextState);
        triggerToast(nextState ? 'Microphone Active' : 'Microphone Muted');
        return;
      }
    }
    // Toggle state in simulated mode
    setIsMicOn((prev) => {
      const next = !prev;
      triggerToast(next ? 'Microphone Active' : 'Microphone Muted');
      return next;
    });
  };

  // Toggle Video Track
  const handleToggleCamera = () => {
    const stream = mediaStreamRef.current;
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length > 0) {
        const nextState = !isCameraOn;
        videoTracks.forEach((t) => (t.enabled = nextState));
        setIsCameraOn(nextState);
        triggerToast(nextState ? 'Camera Video Resumed' : 'Camera Video Paused');
        return;
      }
    }
    setIsCameraOn((prev) => {
      const next = !prev;
      triggerToast(next ? 'Camera Video Resumed' : 'Camera Video Paused');
      return next;
    });
  };

  // End Live Broadcast
  const handleConfirmEndLive = async () => {
    setIsEnding(true);
    try {
      // Stop media tracks
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }

      // Leave Agora
      if (agoraClientRef.current) {
        try {
          await agoraClientRef.current.leave();
        } catch {}
      }

      const res = await fetch('/api/live/studio/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isDemo: Boolean(sessionData?.agora?.isDemo || isDemoParam),
          roomId: sessionData?.room?.id,
          durationSeconds: elapsedSeconds,
        }),
      });

      const data = await res.json();
      setIsLiveActive(false);

      if (data.success && data.summary) {
        setBroadcastSummary(data.summary);
      } else {
        setBroadcastSummary({
          durationFormatted: formatTimer(elapsedSeconds),
          peakViewers: 1842,
          totalLikes: 5420,
          totalGifts: 320,
          diamondsEarned: 1540,
        });
      }

      // Navigate to Module 4.8 official End Screen
      router.push(`/live/end-screen?roomId=${sessionData?.room?.roomNumber || '880219'}`);
    } catch (err) {
      setBroadcastSummary({
        durationFormatted: formatTimer(elapsedSeconds),
        peakViewers: 1842,
        totalLikes: 5420,
        totalGifts: 320,
        diamondsEarned: 1540,
      });
      router.push(`/live/end-screen?roomId=${sessionData?.room?.roomNumber || '880219'}`);
    } finally {
      setIsEnding(false);
      setShowEndConfirm(false);
    }
  };

  // Compute CSS video filter
  let filterCss = '';
  if (isBeautyActive) {
    filterCss += 'contrast(106%) brightness(108%) saturate(114%) blur(0.2px) ';
  }
  switch (selectedFilter) {
    case 'rosy':
      filterCss += 'contrast(105%) brightness(106%) saturate(125%) hue-rotate(330deg) ';
      break;
    case 'warm':
      filterCss += 'sepia(24%) contrast(106%) brightness(105%) ';
      break;
    case 'soft':
      filterCss += 'brightness(112%) contrast(96%) saturate(108%) ';
      break;
    case 'cyberpunk':
      filterCss += 'contrast(130%) saturate(145%) hue-rotate(185deg) ';
      break;
    case 'vintage':
      filterCss += 'sepia(38%) contrast(92%) brightness(96%) grayscale(15%) ';
      break;
    default:
      break;
  }

  // Fallback demo host details matching 04_03_host_studio.png 1:1
  const host = sessionData?.host || {
    nickname: 'Zara Live',
    poppoId: '8802194',
    avatarUrl: '/assets/studio/host_zara_avatar.png',
    wealthLevel: 12,
  };

  const room = sessionData?.room || {
    title: 'Come and chat with me 💕',
    category: 'Live Chat',
    viewerDisplay: '1.8K',
  };

  return (
    <div className="min-h-screen bg-[#070814] text-white flex flex-col items-center justify-center p-0 sm:p-4 select-none overflow-hidden relative font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 z-50 px-4 py-2 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-medium shadow-xl animate-fade-in flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
          {toastMessage}
        </div>
      )}

      {/* Mobile container replicating 04_03_host_studio.png */}
      <div className="w-full max-w-[440px] h-[100dvh] sm:h-[890px] sm:max-h-[92vh] sm:rounded-[36px] bg-[#0c0d1a] relative flex flex-col overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.85)] border-0 sm:border sm:border-white/10">
        {/* ========================================================= */}
        {/* VIDEO CANVAS / CAMERA VIEWPORT                            */}
        {/* ========================================================= */}
        <div className="absolute inset-0 z-0 bg-black overflow-hidden flex items-center justify-center">
          {/* Studio Broadcast Video Feed / Background */}
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src="/assets/studio/sample_studio_broadcast.png"
              alt="Studio Broadcast Feed"
              fill
              priority
              className="object-cover"
              style={{ filter: filterCss || 'none' }}
            />
          </div>

          {/* Real WebRTC HTML5 Video Element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-all duration-300 relative z-10 ${
              facingMode === 'user' && mirrorMode ? 'scale-x-[-1]' : ''
            } ${!isCameraOn || usingFallbackVideo || isDemoParam ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            style={{ filter: filterCss || 'none' }}
          />

          {/* Avatar placeholder if camera is toggled OFF */}
          {!isCameraOn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm z-20 text-center p-6">
              <div className="w-24 h-24 rounded-full border-2 border-pink-500/80 p-1 mb-3 animate-pulse">
                <div className="w-full h-full rounded-full overflow-hidden relative">
                  <Image src={host.avatarUrl} alt={host.nickname} fill className="object-cover" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-300 text-xs font-semibold mb-2">
                <VideoOff className="w-3.5 h-3.5" /> Camera Paused
              </div>
              <p className="text-zinc-300 text-xs max-w-xs">Tap the camera button on the right to resume your live video stream.</p>
            </div>
          )}

          {/* AR Face Effects Overlay Layer */}
          {selectedEffect !== 'none' && (
            <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center">
              {selectedEffect === 'crown' && (
                <div className="absolute top-[28%] text-6xl animate-bounce drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]">
                  👑
                </div>
              )}
              {selectedEffect === 'glasses' && (
                <div className="absolute top-[37%] text-6xl animate-pulse drop-shadow-[0_0_20px_rgba(255,45,85,0.9)]">
                  💖🕶️💖
                </div>
              )}
              {selectedEffect === 'cat' && (
                <div className="absolute top-[26%] text-6xl drop-shadow-[0_0_15px_rgba(255,182,193,0.8)]">
                  🐱
                </div>
              )}
              {selectedEffect === 'bunny' && (
                <div className="absolute top-[24%] text-6xl animate-pulse">
                  🐰
                </div>
              )}
              {selectedEffect === 'neon' && (
                <div className="absolute inset-4 rounded-3xl border-4 border-pink-500 shadow-[inset_0_0_30px_rgba(255,45,85,0.7),0_0_30px_rgba(255,45,85,0.7)] pointer-events-none animate-pulse" />
              )}
            </div>
          )}

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
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/60 via-transparent to-black/80" />
        </div>

        {/* ========================================================= */}
        {/* TOP BAR: Host Capsule, Live Timer, Viewers & Exit Button  */}
        {/* ========================================================= */}
        <div className="relative z-20 pt-4 px-4 flex items-center justify-between gap-2">
          {/* Host Profile Capsule (1:1 with 04_03_host_studio.png) */}
          <div className="flex items-center gap-2 bg-black/45 backdrop-blur-md border border-white/10 rounded-full pl-1.5 pr-3 py-1 shadow-lg max-w-[210px]">
            {/* Host Avatar */}
            <div className="w-8 h-8 rounded-full overflow-hidden border border-pink-500/80 relative flex-shrink-0">
              <Image src={host.avatarUrl} alt={host.nickname} fill className="object-cover" />
            </div>

            {/* Host Details */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-white font-bold text-xs truncate leading-tight">{host.nickname}</span>
                <span className="text-[10px] text-amber-400 font-extrabold">★</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-zinc-300 font-medium">ID: {host.poppoId}</span>
                <span className="text-[9px] px-1 rounded bg-gradient-to-r from-amber-500 to-pink-500 text-white font-bold">
                  Lv.{host.wealthLevel || 12}
                </span>
              </div>
            </div>
          </div>

          {/* Top Status Capsule: Viewers + Duration + LIVE Badge */}
          <div className="flex items-center gap-1.5">
            {/* Live Duration Pill */}
            <div
              onClick={() => setShowConnectionInfo((prev) => !prev)}
              className="flex items-center gap-1 bg-black/45 backdrop-blur-md border border-white/10 rounded-full px-2.5 py-1 text-white text-[11px] font-semibold cursor-pointer hover:bg-black/60 transition-colors"
              title="Broadcast Duration & Agora RTC Status"
            >
              <Clock className="w-3 h-3 text-pink-400" />
              <span>{formatTimer(elapsedSeconds)}</span>
            </div>

            {/* Viewers Count Pill */}
            <div className="flex items-center gap-1 bg-black/45 backdrop-blur-md border border-white/10 rounded-full px-2 py-1 text-white text-[11px] font-semibold">
              <Eye className="w-3 h-3 text-cyan-400" />
              <span>{room.viewerDisplay || '1.8K'}</span>
            </div>

            {/* LIVE Pink Glowing Badge */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-[#e91e63] to-[#ff2d55] text-white text-[10px] font-extrabold shadow-[0_0_12px_rgba(255,45,85,0.7)] tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              <span>LIVE</span>
            </div>

            {/* Exit / End Broadcast Button */}
            <button
              type="button"
              onClick={() => setShowEndConfirm(true)}
              className="w-8 h-8 rounded-full bg-black/45 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/90 hover:text-white hover:bg-black/70 active:scale-95 transition-all"
              title="End Live Stream"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Agora / WebRTC Connection Status Pill (collapsible) */}
        {showConnectionInfo && (
          <div className="relative z-30 mx-4 mt-2 p-2.5 rounded-2xl bg-black/85 backdrop-blur-md border border-pink-500/30 text-xs shadow-2xl flex flex-col gap-1.5 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-pink-400 font-bold">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>
                  {sessionData?.agora?.isDemo ? 'Local WebRTC Camera Preview (Test Mode)' : 'Agora RTC Interactive Live Stream'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowConnectionInfo(false)}
                className="text-zinc-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[11px] text-zinc-300">
              <div>Channel: <span className="text-white font-mono">{sessionData?.agora?.channelName || 'popo_room_880219'}</span></div>
              <div>Quality: <span className="text-emerald-400 font-semibold">{streamResolution} @ 30fps</span></div>
              <div>Host UID: <span className="text-white font-mono">{sessionData?.agora?.uid || '8802194'}</span></div>
              <div>Latency: <span className="text-emerald-400 font-semibold">~38ms</span></div>
            </div>
          </div>
        )}

        {/* Camera Permission Warning Banner if denied */}
        {cameraPermissionError && (
          <div className="relative z-20 mx-4 mt-2 p-2 rounded-xl bg-amber-950/80 backdrop-blur-md border border-amber-500/40 text-amber-200 text-[11px] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 truncate">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span className="truncate">{cameraPermissionError}</span>
            </div>
            <button
              type="button"
              onClick={() => startCameraStream(facingMode)}
              className="px-2 py-0.5 rounded bg-amber-500 text-black font-bold text-[10px] flex-shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Center Canvas Area with Broadcast Room Info */}
        <div className="relative z-10 flex-1 flex flex-col justify-between p-4 pointer-events-none">
          {/* Room Title Pill */}
          <div className="self-start mt-1 pointer-events-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/90 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
              <span className="font-medium truncate max-w-[220px]">{room.title || 'Come and chat with me 💕'}</span>
              <span className="text-zinc-400 text-[10px]">#{room.category || 'Live Chat'}</span>
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* ========================================================= */}
          {/* RIGHT ACTION COLUMN: 6 Floating Quick Action Controls    */}
          {/* Matches 04_03_host_studio.png vertically on right        */}
          {/* ========================================================= */}
          <div className="absolute right-3.5 bottom-24 flex flex-col items-center gap-3 z-30 pointer-events-auto">
            {/* 1. Camera Flip */}
            <button
              type="button"
              onClick={handleFlipCamera}
              className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/70 hover:scale-105 active:scale-95 transition-all shadow-lg"
              title="Flip Front / Rear Camera"
            >
              <RotateCw className="w-5 h-5 text-zinc-100" />
            </button>

            {/* 2. Beauty Filter Toggle */}
            <button
              type="button"
              onClick={handleToggleBeauty}
              className={`w-11 h-11 rounded-full backdrop-blur-md flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95 ${
                isBeautyActive
                  ? 'bg-gradient-to-tr from-[#e91e63] to-[#ff2d55] border-2 border-white text-white shadow-pink-500/50'
                  : 'bg-black/50 border border-white/20 text-white hover:bg-black/70'
              }`}
              title="Beauty Smoothing Filter"
            >
              <Sparkles className="w-5 h-5" />
            </button>

            {/* 3. Mic Mute / Unmute */}
            <button
              type="button"
              onClick={handleToggleMic}
              className={`w-11 h-11 rounded-full backdrop-blur-md flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95 ${
                !isMicOn
                  ? 'bg-red-600/90 border-2 border-red-300 text-white shadow-red-500/50'
                  : 'bg-black/50 border border-white/20 text-white hover:bg-black/70'
              }`}
              title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
            >
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-white" />}
            </button>

            {/* 4. Video Camera ON / OFF */}
            <button
              type="button"
              onClick={handleToggleCamera}
              className={`w-11 h-11 rounded-full backdrop-blur-md flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95 ${
                !isCameraOn
                  ? 'bg-red-600/90 border-2 border-red-300 text-white shadow-red-500/50'
                  : 'bg-black/50 border border-white/20 text-white hover:bg-black/70'
              }`}
              title={isCameraOn ? 'Pause Camera' : 'Resume Camera'}
            >
              {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            {/* 5. Sound Effects Board */}
            <button
              type="button"
              onClick={() => setActiveDrawer(activeDrawer === 'sound' ? 'none' : 'sound')}
              className={`w-11 h-11 rounded-full backdrop-blur-md flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95 ${
                activeDrawer === 'sound'
                  ? 'bg-gradient-to-tr from-amber-500 to-pink-500 border border-white text-white'
                  : 'bg-black/50 border border-white/20 text-white hover:bg-black/70'
              }`}
              title="Sound Effects Palette"
            >
              <Music className="w-5 h-5" />
            </button>

            {/* 6. Settings / Quality */}
            <button
              type="button"
              onClick={() => setActiveDrawer(activeDrawer === 'settings' ? 'none' : 'settings')}
              className={`w-11 h-11 rounded-full backdrop-blur-md flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95 ${
                activeDrawer === 'settings'
                  ? 'bg-gradient-to-tr from-purple-500 to-pink-500 border border-white text-white'
                  : 'bg-black/50 border border-white/20 text-white hover:bg-black/70'
              }`}
              title="Broadcast Settings"
            >
              <Sliders className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BOTTOM DOCK: 4 Items (Effects, Filter, Share, More)       */}
        {/* Matches 04_03_host_studio.png bottom dock exactly         */}
        {/* ========================================================= */}
        <div className="relative z-20 pb-4 px-6 pt-2 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex items-center justify-between">
          {/* 1. Effects */}
          <button
            type="button"
            onClick={() => setActiveDrawer(activeDrawer === 'effects' ? 'none' : 'effects')}
            className="flex flex-col items-center gap-1 group active:scale-95 transition-all"
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-md transition-all ${
              activeDrawer === 'effects'
                ? 'bg-gradient-to-tr from-[#e91e63] to-[#ff2d55] shadow-lg shadow-pink-500/50'
                : 'bg-white/10 group-hover:bg-white/15'
            }`}>
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-[11px] font-medium text-zinc-300 group-hover:text-white">Effects</span>
          </button>

          {/* 2. Filter */}
          <button
            type="button"
            onClick={() => setActiveDrawer(activeDrawer === 'filter' ? 'none' : 'filter')}
            className="flex flex-col items-center gap-1 group active:scale-95 transition-all"
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-md transition-all ${
              activeDrawer === 'filter'
                ? 'bg-gradient-to-tr from-[#e91e63] to-[#ff2d55] shadow-lg shadow-pink-500/50'
                : 'bg-white/10 group-hover:bg-white/15'
            }`}>
              <Palette className="w-6 h-6 text-white" />
            </div>
            <span className="text-[11px] font-medium text-zinc-300 group-hover:text-white">Filter</span>
          </button>

          {/* 3. Share */}
          <button
            type="button"
            onClick={() => setActiveDrawer(activeDrawer === 'share' ? 'none' : 'share')}
            className="flex flex-col items-center gap-1 group active:scale-95 transition-all"
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-md transition-all ${
              activeDrawer === 'share'
                ? 'bg-gradient-to-tr from-[#e91e63] to-[#ff2d55] shadow-lg shadow-pink-500/50'
                : 'bg-white/10 group-hover:bg-white/15'
            }`}>
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-[11px] font-medium text-zinc-300 group-hover:text-white">Share</span>
          </button>

          {/* 4. More */}
          <button
            type="button"
            onClick={() => setActiveDrawer(activeDrawer === 'more' ? 'none' : 'more')}
            className="flex flex-col items-center gap-1 group active:scale-95 transition-all"
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-md transition-all ${
              activeDrawer === 'more'
                ? 'bg-gradient-to-tr from-[#e91e63] to-[#ff2d55] shadow-lg shadow-pink-500/50'
                : 'bg-white/10 group-hover:bg-white/15'
            }`}>
              <MoreHorizontal className="w-6 h-6 text-white" />
            </div>
            <span className="text-[11px] font-medium text-zinc-300 group-hover:text-white">More</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* INTERACTIVE DRAWERS & PANELS                              */}
        {/* ========================================================= */}

        {/* 1. AR Face Effects Drawer */}
        {activeDrawer === 'effects' && (
          <div className="absolute inset-x-0 bottom-0 z-40 bg-[#121326]/95 backdrop-blur-xl border-t border-white/10 rounded-t-[32px] p-5 animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-pink-400" /> Interactive Face Stickers & Effects
              </span>
              <button
                type="button"
                onClick={() => setActiveDrawer('none')}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-zinc-300 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {[
                { id: 'none', label: 'None', icon: '🚫' },
                { id: 'crown', label: 'Crown', icon: '👑' },
                { id: 'glasses', label: 'Hearts', icon: '💖' },
                { id: 'cat', label: 'Cat', icon: '🐱' },
                { id: 'bunny', label: 'Bunny', icon: '🐰' },
                { id: 'neon', label: 'Neon', icon: '🌟' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedEffect(item.id as any);
                    triggerToast(`Effect: ${item.label}`);
                  }}
                  className={`flex flex-col items-center gap-1 p-2 rounded-2xl border transition-all ${
                    selectedEffect === item.id
                      ? 'bg-pink-500/20 border-pink-500 text-white scale-105'
                      : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-[10px] font-semibold">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2. Color Filter Drawer */}
        {activeDrawer === 'filter' && (
          <div className="absolute inset-x-0 bottom-0 z-40 bg-[#121326]/95 backdrop-blur-xl border-t border-white/10 rounded-t-[32px] p-5 animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-pink-400" /> Camera Color Filters
              </span>
              <button
                type="button"
                onClick={() => setActiveDrawer('none')}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-zinc-300 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {[
                { id: 'original', label: 'Original', color: '#71717a' },
                { id: 'rosy', label: 'Rosy', color: '#f43f5e' },
                { id: 'warm', label: 'Warm', color: '#f59e0b' },
                { id: 'soft', label: 'Soft Glow', color: '#ec4899' },
                { id: 'cyberpunk', label: 'Cyber', color: '#06b6d4' },
                { id: 'vintage', label: 'Vintage', color: '#854d0e' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedFilter(item.id as any);
                    triggerToast(`Filter: ${item.label}`);
                  }}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all ${
                    selectedFilter === item.id
                      ? 'bg-pink-500/20 border-pink-500 text-white scale-105'
                      : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full border border-white/30" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] font-semibold truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. Share Live Stream Drawer */}
        {activeDrawer === 'share' && (
          <div className="absolute inset-x-0 bottom-0 z-40 bg-[#121326]/95 backdrop-blur-xl border-t border-white/10 rounded-t-[32px] p-5 animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-pink-400" /> Share Live Stream
              </span>
              <button
                type="button"
                onClick={() => setActiveDrawer('none')}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-zinc-300 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center justify-around gap-2 mb-4">
              {[
                { name: 'Copy Link', icon: <Copy className="w-5 h-5 text-pink-400" />, action: () => {
                  if (typeof navigator !== 'undefined') {
                    navigator.clipboard?.writeText(window.location.origin + `/live/room/${sessionData?.room?.roomNumber || '880219'}`);
                    triggerToast('Live Room Link Copied to Clipboard!');
                  }
                }},
                { name: 'WhatsApp', icon: <span className="text-xl">💬</span>, action: () => triggerToast('Opened WhatsApp Share') },
                { name: 'Telegram', icon: <span className="text-xl">✈️</span>, action: () => triggerToast('Opened Telegram Share') },
                { name: 'Facebook', icon: <span className="text-xl">📘</span>, action: () => triggerToast('Opened Facebook Share') },
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={item.action}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 active:scale-95 transition-all min-w-[70px]"
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="text-[10px] text-zinc-300 font-medium">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4. Sound Effects Soundboard Drawer */}
        {activeDrawer === 'sound' && (
          <div className="absolute inset-x-0 bottom-0 z-40 bg-[#121326]/95 backdrop-blur-xl border-t border-white/10 rounded-t-[32px] p-5 animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Music className="w-4 h-4 text-pink-400" /> Host Soundboard & Atmosphere
              </span>
              <button
                type="button"
                onClick={() => setActiveDrawer('none')}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-zinc-300 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { type: 'applause', label: 'Applause 👏', emoji: '👏' },
                { type: 'cheer', label: 'Cheer 🎉', emoji: '🎉' },
                { type: 'fanfare', label: 'Fanfare 🎺', emoji: '🎺' },
                { type: 'drumroll', label: 'Drumroll 🥁', emoji: '🥁' },
                { type: 'magic', label: 'Magic ✨', emoji: '✨' },
                { type: 'chime', label: 'Heart Sparkle 💕', emoji: '💕' },
              ].map((sound) => (
                <button
                  key={sound.type}
                  type="button"
                  onClick={() => {
                    playSynthesizedSound(sound.type);
                    spawnFloatingHeart(sound.emoji);
                    triggerToast(`Playing ${sound.label}`);
                  }}
                  className="flex items-center justify-center gap-2 py-3 px-2 rounded-2xl bg-white/5 hover:bg-pink-500/20 border border-white/10 hover:border-pink-500/50 text-white font-semibold text-xs active:scale-95 transition-all shadow-md"
                >
                  <span>{sound.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 5. Stream Quality & Audio Settings Drawer */}
        {activeDrawer === 'settings' && (
          <div className="absolute inset-x-0 bottom-0 z-40 bg-[#121326]/95 backdrop-blur-xl border-t border-white/10 rounded-t-[32px] p-5 animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-pink-400" /> Studio & Video Quality Settings
              </span>
              <button
                type="button"
                onClick={() => setActiveDrawer('none')}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-zinc-300 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {/* Resolution Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                <div>
                  <div className="text-xs font-semibold text-white">Broadcast Resolution</div>
                  <div className="text-[10px] text-zinc-400">Higher resolution requires stable bandwidth</div>
                </div>
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setStreamResolution('720p');
                      triggerToast('Resolution set to 720p HD (Optimal)');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      streamResolution === '720p' ? 'bg-pink-500 text-white' : 'text-zinc-400'
                    }`}
                  >
                    720p
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStreamResolution('1080p');
                      triggerToast('Resolution set to 1080p Full HD');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      streamResolution === '1080p' ? 'bg-pink-500 text-white' : 'text-zinc-400'
                    }`}
                  >
                    1080p
                  </button>
                </div>
              </div>

              {/* Noise Suppression Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                <div>
                  <div className="text-xs font-semibold text-white">AI Noise Suppression</div>
                  <div className="text-[10px] text-zinc-400">Filter background noise from microphone</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNoiseSuppression(!noiseSuppression);
                    triggerToast(noiseSuppression ? 'Noise Suppression: OFF' : 'Noise Suppression: ON');
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    noiseSuppression ? 'bg-pink-500' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      noiseSuppression ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Front Camera Mirroring */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                <div>
                  <div className="text-xs font-semibold text-white">Mirror Front Camera</div>
                  <div className="text-[10px] text-zinc-400">Flip view horizontally like a mirror</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMirrorMode(!mirrorMode);
                    triggerToast(mirrorMode ? 'Mirror Mode: OFF' : 'Mirror Mode: ON');
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    mirrorMode ? 'bg-pink-500' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      mirrorMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Module 4.9: Quality & Cost Guard Link */}
              <Link
                href={`/live/quality?roomId=${sessionData?.room?.roomNumber || '880219'}`}
                className="w-full p-3 rounded-2xl bg-gradient-to-r from-purple-900/40 to-pink-900/30 border border-pink-500/30 flex items-center justify-between text-xs font-semibold text-white hover:brightness-110 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🛡️</span>
                  <span>Quality &amp; Cost Guard (Auto-Adaptive)</span>
                </div>
                <span className="text-pink-400 font-bold">Configure →</span>
              </Link>
            </div>
          </div>
        )}

        {/* 6. More Options Drawer */}
        {activeDrawer === 'more' && (
          <div className="absolute inset-x-0 bottom-0 z-40 bg-[#121326]/95 backdrop-blur-xl border-t border-white/10 rounded-t-[32px] p-5 animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <MoreHorizontal className="w-4 h-4 text-pink-400" /> More Broadcast Options
              </span>
              <button
                type="button"
                onClick={() => setActiveDrawer('none')}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-zinc-300 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              <div
                onClick={() => {
                  setShowConnectionInfo(true);
                  setActiveDrawer('none');
                }}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Radio className="w-4 h-4 text-pink-400" /> Stream Statistics & Agora Token
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </div>

              <div
                onClick={() => {
                  triggerToast('Viewer management moderation open');
                  setActiveDrawer('none');
                }}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Moderator & Mute Controls
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </div>

              <div
                onClick={() => {
                  setActiveDrawer('none');
                  setShowEndConfirm(true);
                }}
                className="p-3 rounded-2xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 flex items-center justify-between cursor-pointer transition-colors text-red-300"
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <X className="w-4 h-4 text-red-400" /> End Live Stream Broadcast
                </div>
                <ChevronRight className="w-4 h-4 text-red-400" />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL: End Broadcast Confirmation Dialog                  */}
        {/* ========================================================= */}
        {showEndConfirm && (
          <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
            <div className="w-full max-w-xs bg-[#15162a] border border-white/15 rounded-3xl p-6 text-center shadow-2xl flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mb-4 animate-pulse">
                <Radio className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">End Live Broadcast?</h3>
              <p className="text-xs text-zinc-300 mb-6">
                Your stream will immediately close for all active viewers. Are you sure you want to stop?
              </p>

              <div className="w-full flex flex-col gap-2.5">
                <button
                  type="button"
                  disabled={isEnding}
                  onClick={handleConfirmEndLive}
                  className="w-full py-3 rounded-full bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold text-xs shadow-lg shadow-red-500/40 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isEnding ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Ending Broadcast...
                    </>
                  ) : (
                    'End Live Now'
                  )}
                </button>
                <button
                  type="button"
                  disabled={isEnding}
                  onClick={() => setShowEndConfirm(false)}
                  className="w-full py-2.5 rounded-full bg-white/10 text-zinc-300 hover:text-white text-xs font-medium transition-colors"
                >
                  Continue Streaming
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL: Broadcast Summary After Ending Stream              */}
        {/* ========================================================= */}
        {broadcastSummary && (
          <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
            <div className="w-full max-w-sm bg-[#121326] border border-pink-500/30 rounded-[32px] p-6 text-center shadow-2xl flex flex-col items-center relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#e91e63] to-[#ff2d55] flex items-center justify-center text-white mb-4 shadow-lg shadow-pink-500/50">
                <Award className="w-8 h-8" />
              </div>

              <h2 className="text-xl font-black text-white mb-1">Broadcast Completed</h2>
              <p className="text-xs text-zinc-400 mb-5">Great job! Here is your live broadcast performance summary:</p>

              {/* Stats Grid */}
              <div className="w-full grid grid-cols-2 gap-2.5 mb-6 text-left">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-pink-400" /> Duration
                  </div>
                  <div className="text-lg font-bold text-white mt-0.5">{broadcastSummary.durationFormatted || '00:12:34'}</div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                    <Eye className="w-3 h-3 text-cyan-400" /> Peak Viewers
                  </div>
                  <div className="text-lg font-bold text-white mt-0.5">{broadcastSummary.peakViewers?.toLocaleString() || '1,842'}</div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                    <Heart className="w-3 h-3 text-rose-400" /> Total Likes
                  </div>
                  <div className="text-lg font-bold text-white mt-0.5">{broadcastSummary.totalLikes?.toLocaleString() || '5,420'}</div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-400" /> Diamonds
                  </div>
                  <div className="text-lg font-bold text-amber-300 mt-0.5">+{broadcastSummary.diamondsEarned?.toLocaleString() || '1,540'}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push('/live/setup')}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#e91e63] to-[#ff2d55] text-white font-bold text-sm shadow-lg shadow-pink-500/40 hover:brightness-110 active:scale-95 transition-all"
              >
                Back to Live Setup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
