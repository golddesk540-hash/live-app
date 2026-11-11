'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Shield,
  ShieldAlert,
  Radio,
  Users,
  Swords,
  Eye,
  Plus,
  RefreshCw,
  CheckCircle,
  Clock,
  Archive,
  Compass,
  Lock,
  LogIn,
  AlertTriangle,
  Sparkles,
  Wallet,
  Gift,
} from 'lucide-react';
import { useLanguage } from '@/lib/languageContext';

export interface TestRoomItem {
  id: string;
  testRoomId: string;
  title: string;
  hostNickname: string;
  hostPoppoId: string;
  hostAvatarUrl: string;
  thumbnailUrl: string;
  category: 'live' | 'party' | 'pk' | 'audio';
  status: 'draft' | 'testing' | 'ready' | 'archived';
  environment: 'staging' | 'sandbox' | 'local';
  description?: string;
  viewerSimulationCount: number;
  createdAt: string;
  isTestData: true;
}

interface StaffPreviewToolProps {
  initialUser?: any;
}

export default function StaffPreviewTool({ initialUser }: StaffPreviewToolProps) {
  const router = useRouter();
  const { isUr } = useLanguage();

  const [currentView, setCurrentView] = useState<'home' | 'list' | 'create' | 'preview'>('home');
  const [selectedRoom, setSelectedRoom] = useState<TestRoomItem | null>(null);
  const [rooms, setRooms] = useState<TestRoomItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Authentication & Staff Access State
  const [user, setUser] = useState<any>(initialUser || null);
  const [isStaff, setIsStaff] = useState<boolean>(
    Boolean(initialUser?.is_staff || initialUser?.role === 'staff' || initialUser?.role === 'admin')
  );
  const [authChecking, setAuthChecking] = useState(!initialUser);

  // Create form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'live' | 'party' | 'pk'>('live');
  const [newHost, setNewHost] = useState('Staff Tester');
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

  // Fetch current user & verify staff status
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            const staffFlag = Boolean(
              data.user.is_staff || data.user.role === 'staff' || data.user.role === 'admin'
            );
            setIsStaff(staffFlag);
          }
        }
      } catch (err) {
        console.error('Staff auth check error:', err);
      } finally {
        setAuthChecking(false);
      }
    }

    if (!initialUser) {
      checkAuth();
    } else {
      setAuthChecking(false);
    }
  }, [initialUser]);

  // Load test rooms from backend
  const loadTestRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/staff/test-rooms?preview=demo');
      const data = await res.json();
      if (res.ok && data.success) {
        setRooms(data.rooms || []);
      } else {
        setError(data.error || 'Failed to load test rooms');
      }
    } catch (err: any) {
      setError(err.message || 'Network error while loading test rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTestRooms();
  }, []);

  const handleOpenTestRooms = () => {
    setCurrentView('list');
  };

  const handleCreateTestRoom = () => {
    setCurrentView('create');
  };

  const handleManageTestRooms = () => {
    setCurrentView('list');
  };

  const handlePreviewRoom = (room: TestRoomItem) => {
    setSelectedRoom(room);
    setCurrentView('preview');
  };

  const submitCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/staff/test-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          hostNickname: newHost.trim() || 'Staff Tester',
          status: 'ready',
          environment: 'staging',
        }),
      });
      if (res.ok) {
        setCreateSuccess(true);
        setNewTitle('');
        await loadTestRooms();
        setTimeout(() => {
          setCreateSuccess(false);
          setCurrentView('list');
        }, 1200);
      }
    } finally {
      setCreating(false);
    }
  };

  // ---------------------------------------------------------------------------
  // ACCESS DENIED SCREEN (When user is not authorized staff)
  // ---------------------------------------------------------------------------
  if (!authChecking && !isStaff && !user) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-5 text-rose-400 shadow-xl shadow-rose-500/10">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
          Staff Authorization Required
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto mb-6 leading-relaxed">
          The Staff Preview Tool is strictly restricted to authorized Popo Live internal testers, QA engineers, and platform administrators.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/login?redirect=/staff"
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white text-xs font-bold shadow-lg shadow-pink-500/25 hover:brightness-110 flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Staff Log In</span>
          </Link>
          <Link
            href="/live/explore"
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-semibold border border-white/10 flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4" />
            <span>Return to Discovery</span>
          </Link>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW 1: STAFF PREVIEW HOME SCREEN (1:1 with 03_10_staff_preview_test_rooms.png)
  // ---------------------------------------------------------------------------
  if (currentView === 'home') {
    return (
      <div
        data-testid="staff-preview-home-screen"
        className="min-h-[82vh] w-full flex flex-col justify-between items-center px-4 sm:px-6 py-3 max-w-sm sm:max-w-md mx-auto"
      >
        {/* TOP BAR: Back Navigation + Popo Live Branding */}
        <div className="w-full flex items-center justify-between py-2">
          <button
            type="button"
            onClick={() => router.push('/live/explore')}
            aria-label="Back to Explore"
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Centered Popo Live Brand with ambient purple backlight */}
          <div className="flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-pink-500/30 rounded-full blur-md" />
              <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF2E74] via-[#A855F7] to-[#3B82F6] p-[2px] shadow-lg shadow-pink-500/20">
                <div className="w-full h-full bg-[#120B24] rounded-full flex items-center justify-center font-black text-xs text-transparent bg-clip-text bg-gradient-to-tr from-[#FF2E74] to-yellow-300">
                  P
                </div>
              </div>
            </div>
            <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1">
              Popo <span className="text-[#FF2E74]">Live</span>
            </span>
          </div>

          <Link
            href="/admin/finance"
            aria-label="Admin Finance Controls"
            title="Admin Finance Controls"
            className="w-9 h-9 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/25 flex items-center justify-center text-amber-300 hover:text-amber-200 transition-colors"
          >
            <Wallet className="w-4 h-4" />
          </Link>
        </div>

        {/* CENTER CONTENT: Shield Icon + Headings */}
        <div className="flex flex-col items-center text-center my-auto py-8 space-y-4">
          {/* Centered Purple Shield Icon (1:1 with 03_10 reference) */}
          <div className="relative group">
            <div className="absolute inset-0 bg-purple-600/30 rounded-full blur-2xl transform scale-125" />
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
              <img
                src="/assets/staff/staff_shield@2x.png"
                alt="Staff Preview Shield"
                className="w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(168,85,247,0.4)]"
              />
            </div>
          </div>

          {/* Headings */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Staff Preview
            </h1>
            <p className="text-lg sm:text-xl font-bold text-white/90">
              (Test Rooms)
            </p>
            <p className="text-xs sm:text-sm text-zinc-400 font-normal pt-1">
              For internal testing and review only.
            </p>
          </div>
        </div>

        {/* BOTTOM ACTIONS: 3 Pill Buttons strictly matching 03_10 */}
        <div className="w-full space-y-3 pb-6">
          {/* 1. Open Test Rooms (Bright magenta pill) */}
          <button
            type="button"
            onClick={handleOpenTestRooms}
            className="w-full py-3.5 sm:py-4 rounded-full bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600 hover:brightness-110 active:scale-[0.98] text-white font-extrabold text-sm sm:text-base shadow-xl shadow-fuchsia-900/40 transition-all cursor-pointer"
          >
            Open Test Rooms
          </button>

          {/* 2. Create Test Room (Dark translucent pill) */}
          <button
            type="button"
            onClick={handleCreateTestRoom}
            className="w-full py-3.5 sm:py-4 rounded-full bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.98] text-white font-extrabold text-sm sm:text-base border border-white/10 transition-all cursor-pointer"
          >
            Create Test Room
          </button>

          {/* 3. Manage Test Rooms (Dark translucent pill) */}
          <button
            type="button"
            onClick={handleManageTestRooms}
            className="w-full py-3.5 sm:py-4 rounded-full bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.98] text-white font-extrabold text-sm sm:text-base border border-white/10 transition-all cursor-pointer"
          >
            Manage Test Rooms
          </button>

          {/* Module 7.1 Finance Admin Controls shortcut */}
          <Link
            href="/admin/finance"
            className="w-full py-3 rounded-full bg-purple-950/50 hover:bg-purple-900/50 text-amber-300 font-bold text-xs sm:text-sm border border-amber-400/25 flex items-center justify-center gap-2 transition-all"
          >
            <Wallet className="w-4 h-4" />
            <span>Finance Admin Controls (Coins &amp; Points)</span>
          </Link>

          {/* Module 7.2 - 7.7 Gift Catalog, Sending Stage, Animations, Host Earnings, Top-up & VIP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5">
            <Link
              href="/gifts?preview=demo"
              className="py-3 rounded-full bg-pink-950/50 hover:bg-pink-900/50 text-pink-200 font-bold text-xs sm:text-sm border border-pink-400/30 flex items-center justify-center gap-2 transition-all"
            >
              <Gift className="w-4 h-4 text-pink-400" />
              <span>Gift Catalog</span>
            </Link>
            <Link
              href="/gifts/send?preview=demo"
              className="py-3 rounded-full bg-fuchsia-950/50 hover:bg-fuchsia-900/50 text-fuchsia-200 font-bold text-xs sm:text-sm border border-fuchsia-400/30 flex items-center justify-center gap-2 transition-all"
            >
              <Gift className="w-4 h-4 text-fuchsia-400" />
              <span>Live Gift Stage (7.3)</span>
            </Link>
            <Link
              href="/animations?preview=demo"
              className="py-3 rounded-full bg-amber-950/40 hover:bg-amber-900/50 text-amber-200 font-bold text-xs sm:text-sm border border-amber-400/30 flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Animations (7.4)</span>
            </Link>
            <Link
              href="/earnings?preview=demo"
              className="py-3 rounded-full bg-emerald-950/45 hover:bg-emerald-900/50 text-emerald-200 font-bold text-xs sm:text-sm border border-emerald-400/30 flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>Host Earnings (7.5)</span>
            </Link>
            <Link
              href="/recharge?preview=demo"
              className="py-3 rounded-full bg-cyan-950/45 hover:bg-cyan-900/50 text-cyan-200 font-bold text-xs sm:text-sm border border-cyan-400/30 flex items-center justify-center gap-2 transition-all"
            >
              <Wallet className="w-4 h-4 text-cyan-300" />
              <span>Top-up Coins (7.6)</span>
            </Link>
            <Link
              href="/vip?preview=demo"
              className="py-3 rounded-full bg-amber-950/45 hover:bg-amber-900/50 text-amber-200 font-bold text-xs sm:text-sm border border-amber-400/30 flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>VIP Club (7.7)</span>
            </Link>
            <Link
              href="/admin/gifts"
              className="py-3 rounded-full bg-purple-950/50 hover:bg-purple-900/50 text-purple-200 font-bold text-xs sm:text-sm border border-purple-400/30 flex items-center justify-center gap-2 transition-all"
            >
              <Shield className="w-4 h-4 text-purple-300" />
              <span>Gift Admin</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW 2: TEST ROOMS LIST VIEW (Cards Grid with Preview Action)
  // ---------------------------------------------------------------------------
  if (currentView === 'list') {
    return (
      <div data-testid="staff-test-rooms-list" className="w-full max-w-4xl mx-auto px-4 py-4 space-y-5">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentView('home')}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Return to Staff Menu"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">Staff Test Rooms</h2>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black border border-purple-500/30">
                  {rooms.length} TEST ROOMS
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Isolated sandbox testing environment • Staging servers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadTestRooms}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              title="Refresh Test Rooms"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-pink-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('create')}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white text-xs font-bold hover:brightness-110 flex items-center gap-1.5 shadow-md shadow-pink-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Room</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && rooms.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-44 rounded-3xl bg-white/[0.03] animate-pulse border border-white/5" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-white/5 space-y-3">
            <Radio className="w-10 h-10 text-white/20 mx-auto" />
            <h3 className="text-sm font-bold text-white">No test rooms currently registered</h3>
            <p className="text-xs text-white/50 max-w-sm mx-auto">
              Create a simulated test room to test video playback, voice latency, and room cards.
            </p>
            <button
              type="button"
              onClick={() => setCurrentView('create')}
              className="px-4 py-2 rounded-full bg-pink-600 text-white text-xs font-bold shadow-md hover:brightness-110"
            >
              Create First Test Room
            </button>
          </div>
        ) : (
          /* Test Room Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rooms.map((room) => (
              <div
                key={room.testRoomId}
                data-testid={`test-room-card-${room.testRoomId}`}
                className="relative flex flex-col justify-between p-4 rounded-3xl bg-[#121324] border border-white/[0.06] hover:border-pink-500/30 transition-all shadow-xl shadow-black/40 group"
              >
                {/* Header: Environment & Status Badges */}
                <div className="flex items-center justify-between pb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                      TEST DATA
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase border border-blue-500/30">
                      {room.environment}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      room.status === 'ready'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : room.status === 'testing'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700/40'
                    }`}
                  >
                    {room.status}
                  </span>
                </div>

                {/* Body: Thumbnail & Host Info */}
                <div className="flex items-start gap-3.5 my-2">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 bg-zinc-900 border border-white/10">
                    <img
                      src={room.thumbnailUrl}
                      alt={room.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[9px] font-black uppercase text-pink-400">
                      {room.category}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-pink-300 transition-colors">
                      {room.title}
                    </h3>

                    <div className="flex items-center gap-2 pt-0.5">
                      <img
                        src={room.hostAvatarUrl}
                        alt={room.hostNickname}
                        className="w-4 h-4 rounded-full object-cover ring-1 ring-white/30"
                      />
                      <span className="text-xs text-zinc-300 font-medium truncate">
                        {room.hostNickname}
                      </span>
                    </div>

                    <p className="text-[10px] text-zinc-500 font-mono">
                      ID: {room.testRoomId} • Sim Viewers: {room.viewerSimulationCount}
                    </p>
                  </div>
                </div>

                {/* Footer: Preview Action Button */}
                <div className="pt-3 border-t border-white/[0.05] flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500">
                    Zero camera/mic • Safe preview
                  </span>

                  <button
                    type="button"
                    onClick={() => handlePreviewRoom(room)}
                    className="px-4 py-1.5 rounded-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:brightness-110 active:scale-95 text-white text-xs font-bold shadow-md shadow-pink-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW 3: CREATE TEST ROOM FORM
  // ---------------------------------------------------------------------------
  if (currentView === 'create') {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-4 space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-white/10">
          <button
            type="button"
            onClick={() => setCurrentView('list')}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-lg font-black text-white">Create Test Room</h2>
            <p className="text-[11px] text-zinc-400">Register new sandbox broadcast simulation</p>
          </div>
        </div>

        {createSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Test room created successfully! Redirecting...</span>
          </div>
        )}

        <form onSubmit={submitCreateRoom} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white/80 block">Test Room Title *</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. 60FPS Video Codec Stress Test"
              required
              className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white text-xs focus:border-pink-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white/80 block">Simulated Host Nickname</label>
            <input
              type="text"
              value={newHost}
              onChange={(e) => setNewHost(e.target.value)}
              placeholder="e.g. Staff Tester"
              className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white text-xs focus:border-pink-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white/80 block">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {(['live', 'party', 'pk'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setNewCategory(cat)}
                  className={`py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                    newCategory === cat
                      ? 'bg-pink-600 text-white shadow-md'
                      : 'bg-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed">
            All records created here are strictly segregated from public discovery feeds and clearly marked with [TEST DATA].
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:brightness-110 active:scale-95 text-white font-extrabold text-sm shadow-lg shadow-pink-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>{creating ? 'Registering Room...' : 'Register Test Room'}</span>
          </button>
        </form>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW 4: ROOM PREVIEW SCREEN (Safe preview: zero mic, zero camera, zero broadcast)
  // ---------------------------------------------------------------------------
  if (currentView === 'preview' && selectedRoom) {
    return (
      <div data-testid="staff-room-preview-screen" className="w-full max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <button
            type="button"
            onClick={() => setCurrentView('list')}
            className="flex items-center gap-1.5 text-xs font-bold text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Test Rooms</span>
          </button>

          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/30">
            TEST ENVIRONMENT
          </span>
        </div>

        {/* Safety Banner */}
        <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-xs flex items-start gap-2.5 shadow-lg">
          <Shield className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-white">Staff Inspection Mode Active</p>
            <p className="text-[11px] text-indigo-300/80">
              Camera and microphone are disabled. Live streaming engine, wallet deduction, and audience broadcasting are completely inactive.
            </p>
          </div>
        </div>

        {/* Room Card Preview */}
        <div className="rounded-3xl bg-[#121324] border border-white/10 overflow-hidden shadow-2xl">
          {/* Cover Media Simulation */}
          <div className="relative aspect-video w-full bg-zinc-950 flex items-center justify-center overflow-hidden">
            <img
              src={selectedRoom.thumbnailUrl}
              alt={selectedRoom.title}
              className="w-full h-full object-cover filter brightness-75"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121324] via-transparent to-black/60 pointer-events-none" />

            <div className="absolute top-3 left-3 flex items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-full bg-[#FF2E74] text-white text-[11px] font-black uppercase tracking-wider shadow-md">
                {selectedRoom.category} PREVIEW
              </span>
              <span className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold">
                {selectedRoom.status.toUpperCase()}
              </span>
            </div>

            <div className="absolute bottom-3 left-3 right-3 space-y-1">
              <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                {selectedRoom.title}
              </h2>
              <p className="text-xs text-white/70">
                {selectedRoom.description || 'Test environment parameters simulated successfully.'}
              </p>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-5 space-y-4">
            {/* Host Details */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-3">
                <img
                  src={selectedRoom.hostAvatarUrl}
                  alt={selectedRoom.hostNickname}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-pink-500/60"
                />
                <div>
                  <p className="text-sm font-bold text-white">{selectedRoom.hostNickname}</p>
                  <p className="text-xs text-zinc-400">Host Poppo ID: {selectedRoom.hostPoppoId}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-black text-pink-400">
                  {selectedRoom.viewerSimulationCount}
                </span>
                <p className="text-[10px] text-zinc-500">Simulated Viewers</p>
              </div>
            </div>

            {/* Test Metadata Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <span className="text-zinc-500 block text-[10px] uppercase font-bold">Room Identifier</span>
                <span className="font-mono text-white font-bold">{selectedRoom.testRoomId}</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <span className="text-zinc-500 block text-[10px] uppercase font-bold">Server Environment</span>
                <span className="text-emerald-400 font-bold uppercase">{selectedRoom.environment}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCurrentView('list')}
              className="w-full py-3 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Close Room Preview
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
