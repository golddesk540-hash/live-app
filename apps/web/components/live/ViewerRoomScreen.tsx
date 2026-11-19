'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  X,
  ChevronLeft,
  Radio,
  Eye,
  Heart,
  Send,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Share2,
  Shield,
  Sparkles,
  Gift,
  Coins,
  Check,
  AlertCircle,
  ExternalLink,
  Plus,
  Search,
  Smile,
  Trophy,
  Flame,
  RefreshCw,
  Copy,
  Swords,
  MessageCircle,
  Clock,
} from 'lucide-react';
import {
  DesignFixtures,
  FixtureLiveRoom,
  FixtureGift,
  FixtureLiveChatMessage,
  FixtureCoinPackage,
} from '@/lib/design/designFixtures';
import SafetyToolsScreen from './SafetyToolsScreen';

export interface ViewerRoomScreenProps {
  roomId?: string;
}

interface ChatMessageItem {
  id: string;
  senderNickname: string;
  senderAvatar: string;
  senderLevel: number;
  isVip: boolean;
  content: string;
  timestamp: string;
  isGift?: boolean;
  giftDetails?: {
    name: string;
    icon: string;
    count: number;
    coins: number;
  };
}

interface SentGiftBanner {
  id: string;
  giftName: string;
  giftIcon: string;
  sender: string;
  recipient: string;
  count: number;
  coins: number;
}

const LOCAL_FALLBACK_COVERS: Record<string, string> = {
  room_001: '/assets/viewer/sample_viewer_broadcast.png',
  room_002: '/assets/following/sana_khan.png',
  room_003: '/assets/following/mehak.png',
  room_004: '/assets/following/alina.png',
  room_005: '/assets/following/zara_live.png',
  room_006: '/assets/following/mehak@2x.png',
  room_007: '/assets/following/alina@2x.png',
  room_008: '/assets/following/sana_khan@2x.png',
};

const GIFT_EMOJIS: Record<string, string> = {
  gift_01: '🌹',
  gift_02: '☕',
  gift_03: '🚀',
  gift_04: '🏎️',
  gift_05: '👑',
  gift_06: '🦄',
  gift_07: '🦁',
  gift_08: '🛥️',
};

const QUICK_EMOJIS = ['❤️', '👏', '🔥', '🎉', '🌹', '✨', '☕', '👑'];

const INITIAL_CHATS_BY_ROOM: Record<string, ChatMessageItem[]> = {
  room_001: [
    {
      id: 'lmsg_01',
      senderNickname: 'Sana Ali',
      senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      senderLevel: 14,
      isVip: true,
      content: 'Sing the acoustic version of Karachi Nights again please! ❤️',
      timestamp: '10:02 AM',
    },
    {
      id: 'lmsg_02',
      senderNickname: 'Bilal Ahmed',
      senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      senderLevel: 22,
      isVip: true,
      content: 'Sent a Super Sports Car 🏎️💨 keep rocking!',
      timestamp: '10:04 AM',
      isGift: true,
      giftDetails: {
        name: 'Super Sports Car',
        icon: '🏎️',
        count: 1,
        coins: 1500,
      },
    },
    {
      id: 'lmsg_03',
      senderNickname: 'Hamza Tariq',
      senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      senderLevel: 9,
      isVip: false,
      content: 'Greetings from Lahore! Brilliant voice Amina.',
      timestamp: '10:05 AM',
    },
  ],
  room_002: [
    {
      id: 'lmsg_02_1',
      senderNickname: 'Amina Noor',
      senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      senderLevel: 32,
      isVip: true,
      content: 'Chai pe charcha! Loving the chill midnight vibe ☕🌙',
      timestamp: '10:01 AM',
    },
    {
      id: 'lmsg_02_2',
      senderNickname: 'Faizan Sheikh',
      senderAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
      senderLevel: 18,
      isVip: false,
      content: 'Good luck in the upcoming PK battle! Let us win this! 🔥',
      timestamp: '10:03 AM',
    },
    {
      id: 'lmsg_02_3',
      senderNickname: 'Tariq Jamil',
      senderAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
      senderLevel: 11,
      isVip: false,
      content: 'Hello everyone from Islamabad! Great live show.',
      timestamp: '10:06 AM',
    },
  ],
  room_003: [
    {
      id: 'lmsg_03_1',
      senderNickname: 'Hamza Tariq',
      senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      senderLevel: 9,
      isVip: false,
      content: 'That clutch victory in round 3 was totally insane! 🎮🔥',
      timestamp: '10:01 AM',
    },
    {
      id: 'lmsg_03_2',
      senderNickname: 'Zainab Khan',
      senderAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
      senderLevel: 16,
      isVip: true,
      content: 'Sent Rose Flower 🌹 keep the win streak going Bilal!',
      timestamp: '10:04 AM',
      isGift: true,
      giftDetails: {
        name: 'Rose Flower',
        icon: '🌹',
        count: 5,
        coins: 50,
      },
    },
  ],
};

export default function ViewerRoomScreen({ roomId }: ViewerRoomScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. Resolve selected live room from DesignFixtures
  const activeRoomId = roomId || searchParams.get('roomId') || 'room_001';

  const room: FixtureLiveRoom = useMemo(() => {
    const found = DesignFixtures.liveRooms.find(
      (r) =>
        r.id === activeRoomId ||
        r.roomNumber === activeRoomId ||
        r.id === `room_${activeRoomId}` ||
        `88390${r.id.split('_')[1]}` === activeRoomId
    );
    return found || DesignFixtures.liveRooms[0];
  }, [activeRoomId]);

  // Fallback cover source
  const [coverSource, setCoverSource] = useState<string>(
    LOCAL_FALLBACK_COVERS[room.id] || room.coverUrl
  );

  useEffect(() => {
    setCoverSource(LOCAL_FALLBACK_COVERS[room.id] || room.coverUrl);
  }, [room]);

  // Host Details
  const host = useMemo(() => {
    return {
      id: `host_${room.roomNumber}`,
      nickname: room.hostNickname,
      avatarUrl: room.hostAvatar,
      poppoId: room.roomNumber,
      country: room.country,
      flagEmoji: room.flagEmoji,
      category: room.category,
      viewerCount: room.viewerCount,
    };
  }, [room]);

  // State Management
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [theatreMode, setTheatreMode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showSafetyTools, setShowSafetyTools] = useState(false);

  // Coin Balance (Initialized from DesignFixtures.currentCoinBalance)
  const [coinBalance, setCoinBalance] = useState<number>(() => DesignFixtures.currentCoinBalance);

  // Synchronize coin balance on mount
  useEffect(() => {
    setCoinBalance(DesignFixtures.currentCoinBalance);
  }, []);

  // Live Chat Stream
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>(() => {
    const key = room.id in INITIAL_CHATS_BY_ROOM ? room.id : 'room_001';
    return INITIAL_CHATS_BY_ROOM[key] || [];
  });
  const [inputChat, setInputChat] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Floating Reactions
  const [floatingHearts, setFloatingHearts] = useState<
    Array<{ id: number; left: number; emoji: string }>
  >([]);

  // Active Gift Banner Announcement on Stage
  const [sentGiftBanner, setSentGiftBanner] = useState<SentGiftBanner | null>(null);

  // Gift Sheet State
  const [showGiftSheet, setShowGiftSheet] = useState(false);
  const [giftCategoryTab, setGiftCategoryTab] = useState<'All' | 'Popular' | 'Luxury' | 'Special'>('All');
  const [selectedGiftId, setSelectedGiftId] = useState<string>('gift_04'); // default: Super Sports Car
  const [giftMultiplier, setGiftMultiplier] = useState<number>(1);
  const [insufficientBalanceNotice, setInsufficientBalanceNotice] = useState<string | null>(null);

  // Get Coins / Top-Up Modal State
  const [showGetCoinsModal, setShowGetCoinsModal] = useState(false);

  // Trigger Toast helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2800);
  };

  // Spawn floating heart or emoji on stage
  const spawnReaction = (emoji: string = '❤️') => {
    const id = Date.now() + Math.random();
    const left = 30 + Math.random() * 55;
    setFloatingHearts((prev) => [...prev.slice(-15), { id, left, emoji }]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== id));
    }, 2200);
  };

  // Handle Follow / Unfollow
  const handleToggleFollow = () => {
    const next = !isFollowing;
    setIsFollowing(next);
    triggerToast(next ? `Following ${host.nickname}!` : `Unfollowed ${host.nickname}`);
  };

  // Handle Send Chat
  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputChat.trim()) return;

    const newMsg: ChatMessageItem = {
      id: `chat_${Date.now()}`,
      senderNickname: 'Amina Noor',
      senderAvatar: DesignFixtures.currentUserProfile.avatarUrl,
      senderLevel: 14,
      isVip: true,
      content: inputChat.trim(),
      timestamp: 'Just now',
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setInputChat('');
    spawnReaction('💬');
  };

  // Handle Gift Selection
  const allGifts = useMemo(() => DesignFixtures.gifts, []);

  const filteredGifts = useMemo(() => {
    if (giftCategoryTab === 'All') return allGifts;
    return allGifts.filter((g) => g.category.toLowerCase() === giftCategoryTab.toLowerCase());
  }, [allGifts, giftCategoryTab]);

  const selectedGift = useMemo(() => {
    return allGifts.find((g) => g.id === selectedGiftId) || allGifts[0];
  }, [allGifts, selectedGiftId]);

  const totalGiftCost = useMemo(() => {
    return (selectedGift?.priceCoins || 0) * giftMultiplier;
  }, [selectedGift, giftMultiplier]);

  // Check balance whenever gift or multiplier changes
  useEffect(() => {
    if (totalGiftCost > coinBalance) {
      const deficit = totalGiftCost - coinBalance;
      setInsufficientBalanceNotice(
        `Insufficient Coins: You need ${deficit.toLocaleString()} more coins.`
      );
    } else {
      setInsufficientBalanceNotice(null);
    }
  }, [totalGiftCost, coinBalance]);

  // Handle Send Gift
  const handleSendGift = () => {
    if (!selectedGift) return;

    // 1. Check fixture balance
    if (coinBalance < totalGiftCost) {
      const deficit = totalGiftCost - coinBalance;
      setInsufficientBalanceNotice(
        `Insufficient balance! You need ${deficit.toLocaleString()} more coins to send this gift.`
      );
      triggerToast('⚠️ Insufficient coin balance!');
      return;
    }

    // 2. Deduct from DesignFixtures
    const success = DesignFixtures.deductCoins(totalGiftCost);
    if (!success) {
      triggerToast('⚠️ Transaction failed: Insufficient balance.');
      return;
    }

    // 3. Update local visible coin balance
    const updatedBalance = DesignFixtures.currentCoinBalance;
    setCoinBalance(updatedBalance);
    setInsufficientBalanceNotice(null);

    const giftEmoji = GIFT_EMOJIS[selectedGift.id] || '🎁';

    // 4. Trigger stage visual banner
    setSentGiftBanner({
      id: Date.now().toString(),
      giftName: selectedGift.name,
      giftIcon: giftEmoji,
      sender: 'Amina Noor',
      recipient: host.nickname,
      count: giftMultiplier,
      coins: totalGiftCost,
    });

    // 5. Append gift announcement to chat stream
    const giftChatMessage: ChatMessageItem = {
      id: `gift_msg_${Date.now()}`,
      senderNickname: 'Amina Noor',
      senderAvatar: DesignFixtures.currentUserProfile.avatarUrl,
      senderLevel: 14,
      isVip: true,
      content: `Sent ${selectedGift.name} x${giftMultiplier} to ${host.nickname}! 💖`,
      timestamp: 'Just now',
      isGift: true,
      giftDetails: {
        name: selectedGift.name,
        icon: giftEmoji,
        count: giftMultiplier,
        coins: totalGiftCost,
      },
    };

    setChatMessages((prev) => [...prev, giftChatMessage]);

    // 6. Spawn burst of reactions on stage
    for (let i = 0; i < 4; i++) {
      setTimeout(() => spawnReaction(giftEmoji), i * 200);
    }

    triggerToast(`🎉 Sent ${selectedGift.name} x${giftMultiplier} to ${host.nickname}!`);

    // Auto-dismiss banner after 4.5 seconds
    setTimeout(() => {
      setSentGiftBanner((cur) => (cur?.giftName === selectedGift.name ? null : cur));
    }, 4500);
  };

  // Handle Share Room Link
  const handleShare = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href);
        triggerToast('Live room link copied to clipboard!');
      } else {
        triggerToast('Link ready to share!');
      }
    } catch {
      triggerToast('Live room link copied!');
    }
  };

  // Close Viewer & Return to Live Discovery
  const handleCloseViewer = () => {
    router.push('/live');
  };

  // Test Top-Up Coins Helper (Restores 50,000 coins for interactive testing)
  const handleTestTopUp = (amount: number = 50000) => {
    DesignFixtures.addCoins(amount);
    setCoinBalance(DesignFixtures.currentCoinBalance);
    setInsufficientBalanceNotice(null);
    triggerToast(`Added ${amount.toLocaleString()} Coins to test wallet!`);
  };

  return (
    <div
      data-testid="web-live-viewer-screen"
      className="min-h-screen bg-[#070814] text-white flex flex-col select-none overflow-hidden font-sans relative"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-black/90 backdrop-blur-md border border-pink-500/40 text-white text-xs font-semibold shadow-2xl animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FF1A6C] animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP HEADER / VIEWER NAVIGATION BAR                                     */}
      {/* ========================================================================= */}
      <header className="h-14 sm:h-16 px-3 sm:px-6 bg-[#0c0d1a]/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between z-30 shrink-0">
        {/* Left: Return to Live Discovery & Popo Live Brand */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={handleCloseViewer}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1 shrink-0"
            title="Return to Live Discovery"
          >
            <ChevronLeft className="w-4 h-4 text-pink-400" />
            <span className="hidden sm:inline">Live Discovery</span>
          </button>

          {/* Popo Live Brand Pill */}
          <Link href="/live" className="flex items-center gap-2 group shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-[#FF1A6C] via-[#FF4D8D] to-[#FF80AB] flex items-center justify-center text-white text-xs font-black shadow-md shadow-pink-500/20 group-hover:scale-105 transition-transform">
              P
            </div>
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-white hidden xl:inline">
              Popo Live
            </span>
          </Link>

          {/* Room Title & Category Sub-bar (Desktop) */}
          <div className="hidden lg:flex items-center gap-2 border-l border-white/10 pl-3 min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-gray-100 truncate max-w-xs xl:max-w-md">
              {room.title}
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300">
              {room.category}
            </span>
            <span className="text-xs">{room.flagEmoji}</span>
          </div>
        </div>

        {/* Center: Live Pulse & Audience Count */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-[#FF1A6C] to-[#E0125C] text-white text-[10px] sm:text-xs font-black shadow-lg shadow-pink-500/30">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>LIVE</span>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-white text-xs font-semibold">
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>{host.viewerCount.toLocaleString()}</span>
          </div>

          {room.isPkActive && (
            <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-600/30 border border-purple-500/50 text-purple-300 text-[10px] font-black">
              <Swords className="w-3 h-3 text-purple-400" />
              <span>PK BATTLE</span>
            </div>
          )}
        </div>

        {/* Right: Host Capsule, Coin Balance, Safety & Exit */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Host Info Capsule */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full pl-1 pr-2.5 sm:pr-3 py-1 shadow-sm">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden relative ring-2 ring-[#FF1A6C]/70">
              <Image src={host.avatarUrl} alt={host.nickname} fill className="object-cover" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-white font-bold text-xs truncate max-w-[80px] sm:max-w-[110px]">
                {host.nickname}
              </span>
              <span className="text-[10px] text-zinc-400 leading-none">ID: {host.poppoId}</span>
            </div>

            {/* Follow / Following Toggle Button */}
            <button
              type="button"
              onClick={handleToggleFollow}
              className={`ml-1 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-extrabold transition-all shadow-sm ${
                isFollowing
                  ? 'bg-white/20 text-white hover:bg-white/30'
                  : 'bg-gradient-to-r from-[#FF1A6C] to-[#E0125C] text-white hover:brightness-110'
              }`}
            >
              {isFollowing ? 'Following' : '+ Follow'}
            </button>
          </div>

          {/* User Coin Balance Pill */}
          <button
            type="button"
            onClick={() => setShowGetCoinsModal(true)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold hover:brightness-125 transition"
            title="Click to view Coin Packages or Top Up"
          >
            <span>🪙</span>
            <span>{coinBalance.toLocaleString()}</span>
            <Plus className="w-3 h-3 text-amber-400 ml-0.5" />
          </button>

          {/* Safety Tools Shield */}
          <button
            type="button"
            onClick={() => setShowSafetyTools(true)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition"
            title="Safety Tools (Report, Mute, Rules)"
          >
            <Shield className="w-4 h-4" />
          </button>

          {/* Close Viewer X */}
          <button
            type="button"
            onClick={handleCloseViewer}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-zinc-300 flex items-center justify-center transition"
            title="Exit Room"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN VIEWER STAGE & CHAT LAYOUT                                       */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* LEFT / CENTER: VIDEO BROADCAST STAGE */}
        <div className="flex-1 relative bg-black flex flex-col justify-between overflow-hidden">
          {/* Broadcaster Stage Cover / Graphic Canvas */}
          <div className="absolute inset-0 z-0">
            <Image
              src={coverSource}
              alt={room.title}
              fill
              priority
              className="object-cover opacity-85 filter brightness-95"
              onError={() => {
                const fallback = LOCAL_FALLBACK_COVERS[room.id] || LOCAL_FALLBACK_COVERS['room_001'];
                if (coverSource !== fallback) setCoverSource(fallback);
              }}
            />
            {/* Cinematic Gradient Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/60 pointer-events-none" />
            <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/70 pointer-events-none" />
          </div>

          {/* STAGE TOP BAR OVERLAYS */}
          <div className="relative z-10 p-3 sm:p-5 flex items-start justify-between">
            {/* Room Heat & Category Badges */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white text-xs font-bold flex items-center gap-1 shadow-md">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span>{room.heatScore ? `${(room.heatScore / 1000).toFixed(1)}k Heat` : 'Top Live'}</span>
                </span>
                <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-pink-300 text-xs font-semibold">
                  {room.category}
                </span>
              </div>
              <h2 className="text-white text-sm sm:text-base font-extrabold drop-shadow-md lg:hidden max-w-xs truncate">
                {room.title}
              </h2>
            </div>

            {/* Stage Controls: Mute, Theatre Mode, Share */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsMuted(!isMuted);
                  triggerToast(isMuted ? 'Audio Unmuted 🔊' : 'Audio Muted 🔇');
                }}
                className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-black/80 flex items-center justify-center transition shadow-md"
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTheatreMode(!theatreMode);
                  triggerToast(theatreMode ? 'Standard View' : 'Theatre Mode');
                }}
                className="hidden sm:flex w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-black/80 items-center justify-center transition shadow-md"
                title={theatreMode ? 'Exit Theatre Mode' : 'Theatre Mode'}
              >
                {theatreMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-black/80 flex items-center justify-center transition shadow-md"
                title="Share Room Link"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* STAGE CENTER: LIVE SOUNDWAVE & HOST SHOWCASE */}
          <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none my-auto p-4 text-center">
            {/* Host Glowing Center Ring */}
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full overflow-hidden relative ring-4 ring-[#FF1A6C] shadow-[0_0_35px_rgba(255,26,108,0.6)] mb-3">
              <Image src={host.avatarUrl} alt={host.nickname} fill className="object-cover" />
            </div>

            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/20 px-3.5 py-1.5 rounded-full shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white tracking-wide">
                Broadcasting Live: {host.nickname}
              </span>
            </div>

            {/* Simulated Live Audio Soundwaves */}
            <div className="flex items-center gap-1.5 mt-3 h-5">
              {[40, 70, 95, 60, 85, 100, 45, 80, 50, 90, 65, 35].map((height, idx) => (
                <div
                  key={idx}
                  className="w-1 rounded-full bg-gradient-to-t from-[#FF1A6C] to-pink-300 animate-pulse"
                  style={{
                    height: `${height}%`,
                    animationDuration: `${0.4 + (idx % 4) * 0.2}s`,
                    animationDelay: `${idx * 0.05}s`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* ACTIVE SENT GIFT BANNER OVERLAY ON STAGE */}
          {sentGiftBanner && (
            <div className="absolute top-20 left-4 sm:left-8 z-30 animate-in fade-in slide-in-from-left-4 duration-300 pointer-events-none">
              <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-black/90 via-purple-950/90 to-pink-950/90 border border-pink-500/60 shadow-[0_0_30px_rgba(255,26,108,0.5)]">
                <div className="w-10 h-10 rounded-full overflow-hidden relative ring-2 ring-amber-400 shrink-0">
                  <Image
                    src={DesignFixtures.currentUserProfile.avatarUrl}
                    alt={sentGiftBanner.sender}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-extrabold text-xs">
                    {sentGiftBanner.sender}{' '}
                    <span className="text-amber-400 text-[10px] font-bold">VIP 3</span>
                  </span>
                  <span className="text-zinc-200 text-[11px]">
                    Sent <span className="text-pink-300 font-bold">{sentGiftBanner.giftName}</span>
                  </span>
                </div>
                <div className="flex items-center gap-1 pl-2">
                  <span className="text-2xl animate-bounce">{sentGiftBanner.giftIcon}</span>
                  <span className="text-amber-300 font-black text-sm tracking-tight">
                    x{sentGiftBanner.count}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* FLOATING REACTION HEARTS / EMOJIS ON STAGE */}
          {floatingHearts.map((item) => (
            <div
              key={item.id}
              className="absolute bottom-20 text-3xl pointer-events-none transition-all"
              style={{
                left: `${item.left}%`,
                animation: 'floatUp 2.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
              }}
            >
              {item.emoji}
            </div>
          ))}

          {/* STAGE BOTTOM BAR: Quick Emojis, Floating Gift Trigger & Mobile Chat Input */}
          <div className="relative z-10 p-3 sm:p-4 bg-gradient-to-t from-black via-black/85 to-transparent flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              {/* Quick Reaction Emojis Strip */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => spawnReaction(emoji)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-125 transition flex items-center justify-center text-sm shadow-sm"
                    title={`Send ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* PRIMARY GIFT BUTTON */}
              <button
                type="button"
                onClick={() => setShowGiftSheet(true)}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-[#FF1A6C] via-[#FF4D8D] to-[#F59E0B] hover:brightness-110 active:scale-95 text-white font-black text-xs sm:text-sm shadow-lg shadow-pink-500/40 flex items-center gap-2 shrink-0 transition-transform"
                title="Open Gift Sheet"
              >
                <Gift className="w-4 h-4 text-white animate-bounce" />
                <span>Gift</span>
              </button>
            </div>

            {/* Mobile-only In-Stage Chat Input */}
            <form onSubmit={handleSendChat} className="flex lg:hidden items-center gap-2">
              <input
                type="text"
                value={inputChat}
                onChange={(e) => setInputChat(e.target.value)}
                placeholder="Say something to host..."
                className="flex-1 py-2 px-3 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white placeholder-zinc-400 text-xs focus:outline-none focus:border-pink-500/70"
              />
              <button
                type="submit"
                disabled={!inputChat.trim()}
                className="w-8 h-8 rounded-full bg-[#FF1A6C] disabled:bg-white/20 text-white flex items-center justify-center shrink-0 transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: LIVE CHAT STREAM & COMPOSER (DESKTOP)                      */}
        {/* ========================================================================= */}
        <div
          className={`${
            theatreMode ? 'hidden' : 'flex'
          } w-full lg:w-[380px] xl:w-[420px] h-[340px] lg:h-auto bg-[#0c0d1a] border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col shrink-0`}
        >
          {/* Chat Panel Header */}
          <div className="p-3 sm:px-4 sm:py-3 bg-white/5 border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-pink-400" />
              <h3 className="text-xs sm:text-sm font-bold text-white">Live Stream Chat</h3>
            </div>
            <span className="text-[11px] text-zinc-400 font-semibold">
              {chatMessages.length} comments
            </span>
          </div>

          {/* Stream Notice Pill */}
          <div className="px-3 py-1.5 bg-pink-500/10 border-b border-pink-500/20 text-[11px] text-pink-300 font-medium flex items-center gap-1.5 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-pink-400 shrink-0" />
            <span className="truncate">
              Welcome to {room.title}! Follow community guidelines 💖
            </span>
          </div>

          {/* Scrollable Chat Stream */}
          <div
            ref={chatScrollRef}
            className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs text-zinc-100"
          >
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-2 rounded-xl transition ${
                  msg.isGift
                    ? 'bg-gradient-to-r from-pink-950/60 to-purple-950/60 border border-pink-500/40 shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 border border-white/5'
                }`}
              >
                {/* Sender Header */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-5 h-5 rounded-full overflow-hidden relative shrink-0 ring-1 ring-white/20">
                      <Image
                        src={msg.senderAvatar}
                        alt={msg.senderNickname}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="font-bold text-zinc-200 truncate">{msg.senderNickname}</span>

                    {/* Level Badge */}
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300">
                      Lv.{msg.senderLevel}
                    </span>

                    {/* VIP Badge */}
                    {msg.isVip && (
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300">
                        VIP
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-zinc-500">{msg.timestamp}</span>
                </div>

                {/* Message Content */}
                {msg.isGift && msg.giftDetails ? (
                  <div className="flex items-center gap-2 mt-1 text-pink-200 font-semibold text-xs">
                    <span className="text-lg">{msg.giftDetails.icon}</span>
                    <span>
                      Sent {msg.giftDetails.name} x{msg.giftDetails.count} (🪙{' '}
                      {msg.giftDetails.coins.toLocaleString()})
                    </span>
                  </div>
                ) : (
                  <p className="text-zinc-200 break-words leading-relaxed">{msg.content}</p>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Chat Composer */}
          <div className="p-3 bg-white/5 border-t border-white/10 shrink-0">
            <form onSubmit={handleSendChat} className="flex items-center gap-2">
              <input
                type="text"
                value={inputChat}
                onChange={(e) => setInputChat(e.target.value)}
                placeholder="Say something in live chat..."
                className="flex-1 py-2 px-3.5 rounded-full bg-white/10 border border-white/15 text-white placeholder-zinc-400 text-xs focus:outline-none focus:border-pink-500/70"
              />
              <button
                type="submit"
                disabled={!inputChat.trim()}
                className="w-9 h-9 rounded-full bg-gradient-to-r from-[#FF1A6C] to-[#E0125C] disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition active:scale-95 shadow-md shadow-pink-500/30"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. COMPLETE POP-UP GIFT SELECTION SHEET (MODAL / DRAWER)                  */}
      {/* ========================================================================= */}
      {showGiftSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 p-0 sm:p-4">
          <div className="w-full sm:max-w-xl bg-[#0f1124] border border-pink-500/30 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Sheet Header */}
            <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    Send Gift to {host.nickname}
                  </h3>
                  <p className="text-[10px] text-zinc-400">
                    Supports host and triggers stage animation
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowGiftSheet(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Wallet Balance & Get Coins Bar */}
            <div className="px-4 py-2.5 bg-gradient-to-r from-pink-950/40 via-purple-950/40 to-black border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-zinc-200">
                <span>Coin Balance:</span>
                <span className="font-extrabold text-amber-300 flex items-center gap-1">
                  <span>🪙</span>
                  <span>{coinBalance.toLocaleString()}</span>
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowGetCoinsModal(true)}
                className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-[11px] font-black hover:brightness-110 active:scale-95 transition"
              >
                + Get Coins
              </button>
            </div>

            {/* Category Tabs */}
            <div className="px-4 pt-3 pb-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
              {(['All', 'Popular', 'Luxury', 'Special'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setGiftCategoryTab(tab)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                    giftCategoryTab === tab
                      ? 'bg-[#FF1A6C] text-white shadow-sm'
                      : 'bg-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* 8-Gift Catalog Grid */}
            <div className="p-4 grid grid-cols-4 gap-2.5 sm:gap-3 overflow-y-auto max-h-64">
              {filteredGifts.map((gift) => {
                const isSelected = selectedGiftId === gift.id;
                const emoji = GIFT_EMOJIS[gift.id] || '🎁';

                return (
                  <div
                    key={gift.id}
                    data-gift-id={gift.id}
                    onClick={() => setSelectedGiftId(gift.id)}
                    className={`p-2 sm:p-2.5 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition relative group ${
                      isSelected
                        ? 'bg-gradient-to-b from-pink-600/30 to-purple-600/30 border-2 border-[#FF1A6C] shadow-[0_0_15px_rgba(255,26,108,0.4)]'
                        : 'bg-white/5 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {/* Selected Badge */}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#FF1A6C] text-white flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}

                    {/* Gift Icon Display */}
                    <div className="w-12 h-12 flex items-center justify-center text-3xl mb-1 group-hover:scale-110 transition-transform">
                      {emoji}
                    </div>

                    {/* Gift Title */}
                    <span className="text-white font-bold text-[11px] truncate w-full leading-tight">
                      {gift.name}
                    </span>

                    {/* Gift Price */}
                    <span className="text-amber-300 font-extrabold text-[10px] flex items-center gap-0.5 mt-0.5">
                      <span>🪙</span>
                      <span>{gift.priceCoins.toLocaleString()}</span>
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Multiplier / Quantity Selector */}
            <div className="px-4 py-2 bg-white/5 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-zinc-300 font-medium">Quantity:</span>
              <div className="flex items-center gap-1.5">
                {[1, 5, 10, 99].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setGiftMultiplier(qty)}
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold transition ${
                      giftMultiplier === qty
                        ? 'bg-[#FF1A6C] text-white'
                        : 'bg-white/10 text-zinc-300 hover:text-white'
                    }`}
                  >
                    x{qty}
                  </button>
                ))}
              </div>
            </div>

            {/* Insufficient Balance Notice Banner */}
            {insufficientBalanceNotice && (
              <div className="px-4 py-2 bg-red-950/60 border-t border-red-500/40 text-red-200 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="truncate">{insufficientBalanceNotice}</span>
              </div>
            )}

            {/* Sheet Footer Action */}
            <div className="p-4 bg-white/5 border-t border-white/10 flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-400">Total Price:</span>
                <span className="text-sm font-extrabold text-amber-300 flex items-center gap-1">
                  <span>🪙</span>
                  <span>{totalGiftCost.toLocaleString()} Coins</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                {totalGiftCost > coinBalance ? (
                  <button
                    type="button"
                    onClick={() => setShowGetCoinsModal(true)}
                    className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-black shadow-lg shadow-amber-500/30 hover:brightness-110 active:scale-95 transition"
                  >
                    Get Coins
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendGift}
                    className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#FF1A6C] to-[#E0125C] text-white text-xs font-black shadow-lg shadow-pink-500/40 hover:brightness-110 active:scale-95 transition flex items-center gap-1.5"
                  >
                    <Gift className="w-4 h-4" />
                    <span>Send Gift</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. GET COINS / TOP-UP PACKAGES MODAL                                     */}
      {/* ========================================================================= */}
      {showGetCoinsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="w-full max-w-md bg-[#0f1124] border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🪙</span>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Top Up Coins</h3>
                  <p className="text-[10px] text-zinc-400">
                    Current Balance: {coinBalance.toLocaleString()} Coins
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGetCoinsModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Coin Packages Grid */}
            <div className="p-4 grid grid-cols-2 gap-2.5 max-h-72 overflow-y-auto">
              {DesignFixtures.coinPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => handleTestTopUp(pkg.coins)}
                  className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col justify-between cursor-pointer transition active:scale-95"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">🪙</span>
                    {pkg.badgeLabel && (
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-pink-500/20 text-pink-300">
                        {pkg.badgeLabel}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-black text-white">
                    {pkg.coins.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-bold text-amber-300 mt-1">
                    ${pkg.priceUsd.toFixed(2)} / Rs {pkg.pricePkr}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick Test Recharge Action */}
            <div className="p-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-zinc-400">Design Fixture Testing:</span>
              <button
                type="button"
                onClick={() => handleTestTopUp(50000)}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-black shadow-md hover:brightness-110 active:scale-95 transition"
              >
                + Add 50,000 Test Coins
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SAFETY TOOLS SCREEN MODAL                                             */}
      {/* ========================================================================= */}
      {showSafetyTools && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="w-full max-w-md bg-[#0f1124] rounded-3xl overflow-hidden shadow-2xl">
            <SafetyToolsScreen
              roomId={room.roomNumber}
              hostName={host.nickname}
              hostAvatar={host.avatarUrl}
              hostId={host.id}
              userRole="viewer"
              onClose={() => setShowSafetyTools(false)}
              onBlockSuccess={() => {
                triggerToast(`${host.nickname} blocked.`);
                setShowSafetyTools(false);
              }}
              onMuteSuccess={() => {
                triggerToast('Participant muted.');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
