import React, { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  Users,
  Mic,
  ChevronLeft,
  Share2,
  MoreHorizontal,
  Sparkles,
  Lock,
  Globe,
  Radio,
  Coffee,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Party Room | Popo Live',
  description: 'Popo Live 9-Seat Party Voice Room',
};

async function getPartyRoom(roomId: string) {
  try {
    const res = await fetch(
      `http://localhost:3000/api/party/${roomId}`,
      { cache: 'no-store' }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.room) {
        return data.room;
      }
    }
  } catch {}

  return {
    id: 'party-demo',
    roomNumber: roomId,
    title: 'Friends Talk Party',
    category: 'Chill & Chat',
    categoryId: 'chill_chat',
    roomType: 'public',
    isPrivate: false,
    hostNickname: 'Zara Live',
    hostAvatar: '/assets/studio/host_zara_avatar.png',
    maxSeats: 9,
    currentMembers: 1,
    status: 'live',
  };
}

export default async function PartyRoomPage({
  params,
  searchParams,
}: {
  params: { roomId: string };
  searchParams: { preview?: string };
}) {
  const room = await getPartyRoom(params.roomId);

  return (
    <main className="min-h-screen bg-[#070817] text-white flex flex-col justify-between max-w-sm sm:max-w-md mx-auto p-4 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/party/create?preview=demo"
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </Link>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/70 border border-purple-500/30 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold text-white">Party #{room.roomNumber}</span>
            <span className="text-zinc-400 text-[10px]">({room.category})</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-zinc-300 hover:text-white">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Party Info Card */}
      <div className="p-4 rounded-3xl bg-[#12132d] border border-[#262854] shadow-xl flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 p-[2px] shadow-md shadow-purple-500/30">
            <div className="w-full h-full rounded-[14px] bg-[#181938] flex items-center justify-center font-bold text-sm text-purple-300">
              🎤
            </div>
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">
              {room.title}
            </h1>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-400">
              <span className="text-pink-400 font-semibold">{room.hostNickname}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-purple-300">
                {room.roomType === 'private' ? (
                  <>
                    <Lock className="w-3 h-3 text-amber-400" /> Private
                  </>
                ) : (
                  <>
                    <Globe className="w-3 h-3 text-cyan-400" /> Public
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-zinc-300">
          1/9
        </div>
      </div>

      {/* 9-Seat Grid Placeholder (Ready for Module 5.2) */}
      <div className="flex-1 p-5 rounded-3xl bg-[#0f1026] border border-[#1e2048] flex flex-col items-center justify-center gap-4 text-center my-2">
        <div className="w-16 h-16 rounded-3xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-xl shadow-purple-600/20">
          <Users className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-white mb-1">
            Party Room Ready
          </h2>
          <p className="text-xs text-zinc-400 max-w-xs">
            Successfully created! The 9-seat interactive voice grid will be powered by <span className="text-purple-400 font-semibold">Module 5.2 (Seat Grid)</span>.
          </p>
        </div>

        {/* 9 Seats Preview Matrix */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] my-2">
          {Array.from({ length: 9 }).map((_, idx) => (
            <div
              key={idx}
              className={`h-16 rounded-2xl border flex flex-col items-center justify-center gap-1 text-[11px] ${
                idx === 0
                  ? 'bg-purple-900/40 border-purple-500 text-purple-200 shadow-sm shadow-purple-500/30'
                  : 'bg-white/5 border-dashed border-white/15 text-zinc-500'
              }`}
            >
              <Mic className={`w-3.5 h-3.5 ${idx === 0 ? 'text-pink-400' : 'text-zinc-600'}`} />
              <span className="font-mono text-[10px]">{idx === 0 ? 'Host' : `Seat ${idx + 1}`}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Footer Actions */}
      <div className="flex items-center gap-3 mt-3">
        <Link
          href="/party/create?preview=demo"
          className="flex-1 py-3.5 rounded-full bg-white/10 hover:bg-white/15 text-center text-xs font-bold text-white transition-colors"
        >
          Create Another Party
        </Link>
        <Link
          href="/party"
          className="flex-1 py-3.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-center text-xs font-bold text-white shadow-lg shadow-purple-600/40 transition-all"
        >
          Party Discovery
        </Link>
      </div>

      <div className="text-center text-[11px] text-zinc-500 mt-2 font-mono">
        Module 5.1 Create Party • Ready for Module 5.2 Seat Grid
      </div>
    </main>
  );
}
