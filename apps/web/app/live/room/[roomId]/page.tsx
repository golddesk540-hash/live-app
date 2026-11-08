'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  Users,
  Coins,
  Heart,
  Share2,
  X,
  Swords,
  ShieldAlert,
  ArrowLeft,
  Sparkles,
  Send,
  Gift,
  Volume2,
  Maximize2,
  Check,
} from 'lucide-react';

interface RoomData {
  id: string;
  roomNumber: string;
  title: string;
  coverUrl: string;
  category: string;
  status: string;
  isLive: boolean;
  isPk: boolean;
  viewerCount: number;
  viewersFormatted: string;
  coinsEarned: number;
  coinsFormatted: string;
  country: string;
  countryCode: string;
  flagEmoji: string;
  tags: string[];
  startedAt: string;
  isFollowing: boolean;
  host: {
    id: string;
    nickname: string;
    poppoId: string;
    avatarUrl: string;
    gender: string;
    hostLevel: number;
    wealthLevel: number;
  };
  pkBattle?: {
    pkId: string;
    title: string;
    status: string;
    votesHost: number;
    votesOpponent: number;
    pointsHost: number;
    pointsOpponent: number;
    opponent?: {
      id: string;
      nickname: string;
      avatarUrl: string;
      poppoId: string;
    } | null;
  } | null;
}

export default function LiveRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.roomId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [likes, setLikes] = useState(142);
  const [hasLiked, setHasLiked] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatList, setChatList] = useState<Array<{ user: string; text: string; id: number }>>([
    { id: 1, user: 'Ali_99', text: 'Welcome everyone! 👋' },
    { id: 2, user: 'Sara_Fan', text: 'Awesome stream! Keep going 🔥' },
    { id: 3, user: 'CryptoKing', text: 'Sent 100 Rose gifts 🌹' },
  ]);

  useEffect(() => {
    if (!roomId) return;
    let isMounted = true;

    async function fetchRoom() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/discovery/rooms/${roomId}`);
        const data = await res.json();
        if (!isMounted) return;

        if (!res.ok || !data.success || !data.room) {
          setError(data.error || 'This live room is currently unavailable or has ended.');
          setRoom(null);
        } else {
          setRoom(data.room);
          setIsFollowing(Boolean(data.room.isFollowing));
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Network error while connecting to live room.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchRoom();
    return () => {
      isMounted = false;
    };
  }, [roomId]);

  const toggleFollow = async () => {
    if (!room?.host?.id || followLoading) return;
    setFollowLoading(true);
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const res = await fetch(`/api/users/${room.host.id}/follow`, { method });
      if (res.ok) {
        setIsFollowing(!isFollowing);
      } else if (res.status === 401) {
        router.push('/login?redirect=' + encodeURIComponent(`/live/room/${roomId}`));
      }
    } catch (e) {
      console.error('Follow error:', e);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLike = () => {
    setLikes((prev) => prev + 1);
    setHasLiked(true);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    setChatList((prev) => [
      ...prev,
      { id: Date.now(), user: 'You', text: chatMessage.trim() },
    ]);
    setChatMessage('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070814] text-white flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 rounded-full border-4 border-pink-500/20 border-t-pink-500 animate-spin mb-4" />
        <p className="text-zinc-400 text-sm font-medium animate-pulse">Connecting to Live Stream...</p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-[#070814] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10 text-pink-400" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Live Room Unavailable</h1>
        <p className="text-zinc-400 max-w-md mb-8 text-sm leading-relaxed">
          {error || 'This live broadcast has ended or the room was closed by the host.'}
        </p>
        <Link
          href="/live/explore"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold transition-all shadow-lg shadow-pink-500/25"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Live Discovery
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col justify-between overflow-hidden">
      {/* Background Cover Image with Blur */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src={room.coverUrl}
          alt={room.title}
          className="w-full h-full object-cover filter blur-2xl opacity-40 scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />
      </div>

      {/* TOP HEADER */}
      <header className="relative z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
        {/* Host info badge */}
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md p-1.5 pr-3 rounded-full border border-white/10">
          <Link href={`/user/${room.host.id || room.host.poppoId}`} className="relative group/avatar">
            <img
              src={room.host.avatarUrl}
              alt={room.host.nickname}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-pink-500 group-hover/avatar:scale-105 transition-transform"
            />
            <span className="absolute -bottom-1 -right-1 text-xs">{room.flagEmoji}</span>
          </Link>
          <Link href={`/user/${room.host.id || room.host.poppoId}`} className="flex flex-col group/name">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold leading-tight max-w-[110px] truncate group-hover/name:text-pink-300 transition-colors">
                {room.host.nickname}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-semibold border border-pink-500/30">
                Lv.{room.host.hostLevel}
              </span>
            </div>
            <span className="text-[10px] text-zinc-400">ID: {room.host.poppoId}</span>
          </Link>

          <button
            onClick={toggleFollow}
            disabled={followLoading}
            className={`ml-2 px-3 py-1 rounded-full text-xs font-bold transition-all ${
              isFollowing
                ? 'bg-white/20 text-white hover:bg-white/30'
                : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 text-white shadow-md shadow-pink-500/30'
            }`}
          >
            {isFollowing ? (
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3" /> Following
              </span>
            ) : (
              '+ Follow'
            )}
          </button>
        </div>

        {/* Right metrics & Exit */}
        <div className="flex items-center gap-2">
          {/* Viewer count pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Users className="w-3.5 h-3.5 text-zinc-300" />
            <span className="font-bold text-white">{room.viewersFormatted}</span>
          </div>

          {/* Coins pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold">
            <Coins className="w-3.5 h-3.5" />
            <span>{room.coinsFormatted}</span>
          </div>

          {/* Close / Return */}
          <button
            onClick={() => router.push('/live/explore')}
            aria-label="Exit room"
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md hover:bg-white/20 border border-white/10 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* MAIN VIDEO AREA */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center p-4">
        {/* PK Battle Banner if active */}
        {room.isPk && room.pkBattle && (
          <div className="w-full max-w-2xl mb-4 bg-gradient-to-r from-purple-900/80 via-black/80 to-pink-900/80 backdrop-blur-xl border border-pink-500/30 rounded-2xl p-3 shadow-2xl">
            <div className="flex items-center justify-between text-xs font-bold mb-1.5 px-2">
              <span className="text-pink-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> {room.host.nickname} ({(room.pkBattle.pointsHost || 0).toLocaleString()} pts)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-red-600 text-[10px] uppercase tracking-wider animate-pulse flex items-center gap-1">
                <Swords className="w-3 h-3" /> Live PK Battle
              </span>
              <span className="text-cyan-400 flex items-center gap-1">
                {room.pkBattle.opponent?.nickname || 'Challenger'} ({(room.pkBattle.pointsOpponent || 0).toLocaleString()} pts)
              </span>
            </div>
            {/* Split score bar */}
            <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden flex shadow-inner">
              <div
                className="bg-gradient-to-r from-pink-500 to-rose-500 h-full transition-all duration-500"
                style={{ width: `${Math.max(15, Math.min(85, ((room.pkBattle.pointsHost || 1) / ((room.pkBattle.pointsHost || 1) + (room.pkBattle.pointsOpponent || 1))) * 100))}%` }}
              />
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 flex-1 h-full" />
            </div>
          </div>
        )}

        {/* Stream Visual Frame */}
        <div className="relative w-full max-w-3xl aspect-[9/16] sm:aspect-video max-h-[62vh] rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-zinc-950 flex items-center justify-center">
          {room.isPk && room.pkBattle?.opponent ? (
            /* Split PK View */
            <div className="w-full h-full grid grid-cols-2">
              <div className="relative h-full border-r border-pink-500/30">
                <img
                  src={room.coverUrl}
                  alt={room.host.nickname}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-pink-500" />
                  {room.host.nickname}
                </div>
              </div>
              <div className="relative h-full">
                <img
                  src={room.pkBattle.opponent.avatarUrl || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80'}
                  alt={room.pkBattle.opponent.nickname}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  {room.pkBattle.opponent.nickname}
                </div>
              </div>
            </div>
          ) : (
            /* Single Host View */
            <div className="relative w-full h-full">
              <img
                src={room.coverUrl}
                alt={room.title}
                className="w-full h-full object-cover"
              />
              {/* Broadcast Title Badge */}
              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 max-w-sm">
                <p className="text-xs font-bold text-white truncate">{room.title}</p>
                <p className="text-[10px] text-zinc-400">Room #{room.roomNumber} • {room.category.toUpperCase()}</p>
              </div>
            </div>
          )}

          {/* Sound & Fullscreen controls */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70">
              <Volume2 className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Chat overlay (Mobile / Tablet friendly) */}
        <div className="w-full max-w-2xl mt-3 flex flex-col gap-1 max-h-24 overflow-y-auto pointer-events-auto px-2">
          {chatList.slice(-3).map((c) => (
            <div key={c.id} className="text-xs bg-black/40 backdrop-blur-md px-3 py-1 rounded-full w-fit max-w-full truncate border border-white/5">
              <span className="font-bold text-pink-400 mr-1.5">{c.user}:</span>
              <span className="text-zinc-200">{c.text}</span>
            </div>
          ))}
        </div>
      </main>

      {/* BOTTOM ACTION BAR */}
      <footer className="relative z-20 px-4 py-3 bg-gradient-to-t from-black via-black/80 to-transparent">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          {/* Chat input */}
          <form onSubmit={handleSendChat} className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Send a live message..."
              className="w-full px-4 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white placeholder-zinc-400 text-xs focus:outline-none focus:border-pink-500"
            />
            <button
              type="submit"
              disabled={!chatMessage.trim()}
              className="w-10 h-10 rounded-full bg-pink-600 hover:bg-pink-700 disabled:opacity-40 flex items-center justify-center text-white transition-colors flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Gift CTA */}
          <button
            onClick={() => alert('Gift store is active! Select gifts during Phase 3 Prompt 03.4.')}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-black flex items-center justify-center font-bold shadow-lg shadow-amber-500/30 flex-shrink-0 hover:scale-105 transition-transform"
            title="Send Gift"
          >
            <Gift className="w-5 h-5 text-zinc-950" />
          </button>

          {/* Like Heart Button */}
          <button
            onClick={handleLike}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-pink-500 hover:scale-110 active:scale-95 transition-all flex-shrink-0 relative"
            title="Like broadcast"
          >
            <Heart className={`w-5 h-5 ${hasLiked ? 'fill-pink-500 text-pink-500' : ''}`} />
            <span className="absolute -top-1.5 -right-1 text-[9px] bg-pink-500 text-white font-bold px-1.5 py-0.2 rounded-full">
              {likes}
            </span>
          </button>

          {/* Share Button */}
          <button
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
                alert('Room link copied to clipboard!');
              }
            }}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors flex-shrink-0"
            title="Share room"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}
