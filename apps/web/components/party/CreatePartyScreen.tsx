'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronLeft,
  ChevronDown,
  Globe,
  Lock,
  Check,
  Sparkles,
  Coffee,
  Music,
  Gamepad2,
  Heart,
  Award,
  Users,
  Loader2,
  X,
} from 'lucide-react';
import { CANONICAL_PARTY_CATEGORIES, PartyCategoryItem, RoomType } from '@/lib/party';

const CATEGORY_ICON_MAP: Record<string, React.ReactNode> = {
  chill_chat: <Coffee className="w-4 h-4 text-amber-400" />,
  music: <Music className="w-4 h-4 text-pink-400" />,
  entertainment: <Sparkles className="w-4 h-4 text-cyan-400" />,
  gaming: <Gamepad2 className="w-4 h-4 text-purple-400" />,
  lifestyle: <Heart className="w-4 h-4 text-rose-400" />,
  talent: <Award className="w-4 h-4 text-yellow-400" />,
  friendship: <Users className="w-4 h-4 text-emerald-400" />,
};

interface CreatePartyScreenProps {
  onPartyCreated?: (party: any) => void;
  onBack?: () => void;
  initialTitle?: string;
  initialCategory?: string;
  initialRoomType?: RoomType;
}

export default function CreatePartyScreen({
  onPartyCreated,
  onBack,
  initialTitle = 'Friends Talk Party',
  initialCategory = 'chill_chat',
  initialRoomType = 'public',
}: CreatePartyScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-fill or query override
  const queryPreview = searchParams.get('preview') === 'demo';
  const queryTitle = searchParams.get('title') || initialTitle;

  // Form States (Matching 05_01_create_a_party.png)
  const [title, setTitle] = useState<string>(queryTitle);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(initialCategory);
  const [roomType, setRoomType] = useState<RoomType>(initialRoomType);

  // Categories list state
  const [categories, setCategories] = useState<PartyCategoryItem[]>(CANONICAL_PARTY_CATEGORIES);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState<boolean>(false);

  // Validation & UI States
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch available categories from server
  useEffect(() => {
    let isMounted = true;
    async function loadCategories() {
      try {
        const res = await fetch('/api/party/categories');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && data.categories?.length > 0) {
            setCategories(data.categories);
          }
        }
      } catch (err) {
        console.warn('Category load note:', err);
      }
    }
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  // Submit Handler (Section 6 of Prompt)
  const handleCreateParty = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setErrorMessage('Please enter a party title.');
      showToast('Party title cannot be empty');
      return;
    }
    if (cleanTitle.length > 50) {
      setErrorMessage('Party title cannot exceed 50 characters.');
      showToast('Party title is too long');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/party/create?preview=demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: cleanTitle,
          categoryId: selectedCategoryId,
          roomType,
          preview: 'demo',
        }),
      });

      const data = await res.json();

      if (data.success && data.party) {
        showToast('Party created successfully!');
        if (onPartyCreated) {
          onPartyCreated(data.party);
        } else {
          // Navigate to Module 5.2 Seat Grid room URL
          setTimeout(() => {
            router.push(`/party/room/${data.party.roomNumber}?preview=demo`);
          }, 500);
        }
      } else {
        setErrorMessage(data.error || 'Failed to create party');
        showToast(data.error || 'Failed to create party');
      }
    } catch (err) {
      console.error('Create party error:', err);
      setErrorMessage('Network error while creating party.');
      showToast('Network error while creating party');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory =
    categories.find((c) => c.id === selectedCategoryId) || categories[0];

  return (
    <div
      data-testid="create-party-screen"
      className="relative w-full max-w-sm sm:max-w-md mx-auto min-h-screen bg-[#070817] text-white flex flex-col justify-between overflow-x-hidden font-sans select-none"
      style={{
        backgroundImage:
          'radial-gradient(circle at 50% 12%, rgba(139, 92, 246, 0.24) 0%, rgba(124, 58, 237, 0.08) 45%, transparent 70%), linear-gradient(180deg, #070817 0%, #0d0f2b 50%, #070817 100%)',
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 bg-[#7c3aed] text-white font-semibold text-xs px-4 py-2 rounded-full shadow-lg shadow-purple-600/40 animate-in fade-in zoom-in duration-200 whitespace-nowrap">
          {toastMessage}
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 flex flex-col px-4 pt-3 pb-4">
        {/* TOP STATUS BAR (9:41, Cellular, WiFi, Battery matching 05_01) */}
        <div className="w-full flex items-center justify-between text-zinc-300 text-xs px-2 mb-2 font-medium tracking-tight">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            {/* Cellular signal bars */}
            <div className="flex items-end gap-[1.5px] h-3">
              <span className="w-[3px] h-1 bg-white rounded-xs" />
              <span className="w-[3px] h-1.5 bg-white rounded-xs" />
              <span className="w-[3px] h-2 bg-white rounded-xs" />
              <span className="w-[3px] h-3 bg-white rounded-xs" />
            </div>
            {/* WiFi icon */}
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
              <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98C20.93 5.9 16.69 4 12 4zm0 3c3.78 0 7.22 1.48 9.77 3.9L12 18.66 2.23 10.9C4.78 8.48 8.22 7 12 7z" />
            </svg>
            {/* Battery icon */}
            <div className="w-5 h-2.5 rounded-sm border border-white/70 p-[1px] flex items-center">
              <div className="h-full w-full bg-white rounded-xs" />
            </div>
          </div>
        </div>

        {/* TOP BRAND HEADER (< Popo Live) */}
        <div className="flex items-center gap-2 mb-3">
          <button
            type="button"
            data-action="back"
            onClick={handleBack}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            title="Back"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Popo Live Logo with glowing gradient P letter */}
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-purple-500 via-fuchsia-400 to-indigo-400 flex items-center justify-center shadow-md shadow-purple-500/40 font-black text-white text-xs">
              P
            </div>
            <span className="text-lg font-bold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(168,85,247,0.4)]">
              Popo <span className="font-extrabold">Live</span>
            </span>
          </div>
        </div>

        {/* INNER ROUNDED CARD CONTAINER (Matching 05_01_create_a_party.png) */}
        <div
          data-testid="party-card-container"
          className="relative w-full bg-[#12132d] border border-[#262854] rounded-[28px] p-5 pt-4 pb-6 shadow-2xl shadow-black/60 flex flex-col mb-auto"
        >
          {/* Top-left small back chevron inside card */}
          <button
            type="button"
            data-action="card-back"
            onClick={handleBack}
            className="self-start text-zinc-400 hover:text-white mb-1 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* PARTY CREATION ICON (Neon violet microphone + capsule with headphone glow) */}
          <div className="flex flex-col items-center justify-center mb-3">
            <div className="relative w-20 h-20 flex items-center justify-center">
              {/* Soft purple radial halo */}
              <div className="absolute inset-0 rounded-full bg-[#a855f7]/30 blur-xl animate-pulse" />

              {/* 3D Stylized Neon Capsule & Headphone SVG matching 05_01 */}
              <svg
                viewBox="0 0 80 80"
                className="w-16 h-16 relative z-10 drop-shadow-[0_0_16px_rgba(168,85,247,0.8)]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="neonPurple" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#e879f9" />
                    <stop offset="50%" stopColor="#c084fc" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                  <linearGradient id="capsuleGrad" x1="20%" y1="0%" x2="80%" y2="100%">
                    <stop offset="0%" stopColor="#c084fc" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#4c1d95" />
                  </linearGradient>
                </defs>

                {/* Outer orbital headphone / audio ring */}
                <path
                  d="M18 42C16 32 24 20 40 18C56 16 66 26 64 42"
                  stroke="url(#neonPurple)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <circle cx="18" cy="46" r="5" fill="url(#neonPurple)" />
                <circle cx="64" cy="46" r="5" fill="url(#neonPurple)" />

                {/* Diagonal Microphone / Sound Capsule (rotated 45deg) */}
                <rect
                  x="28"
                  y="24"
                  width="24"
                  height="34"
                  rx="12"
                  transform="rotate(45 40 41)"
                  fill="url(#capsuleGrad)"
                  stroke="url(#neonPurple)"
                  strokeWidth="3.5"
                />

                {/* Capsule acoustic grille lines */}
                <line
                  x1="36"
                  y1="29"
                  x2="48"
                  y2="41"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  opacity="0.85"
                />
                <line
                  x1="31"
                  y1="34"
                  x2="43"
                  y2="46"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  opacity="0.5"
                />
              </svg>
            </div>

            {/* HEADING: Create a Party */}
            <h1 className="text-xl font-bold tracking-tight text-white text-center mt-1">
              Create a Party
            </h1>
          </div>

          <form onSubmit={handleCreateParty} className="flex flex-col gap-4">
            {/* FIELD 1: PARTY TITLE */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <label className="text-sm font-semibold text-zinc-200">
                  Party Title
                </label>
                <span className="text-[11px] font-mono text-zinc-400">
                  {title.length}/50
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  data-testid="party-title-input"
                  value={title}
                  maxLength={50}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Enter party title..."
                  className="w-full bg-[#1a1b38] border border-[#2b2d5c] focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] text-white font-medium text-sm rounded-2xl px-4 py-3.5 pr-10 outline-none transition-all placeholder:text-zinc-500"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              {errorMessage && (
                <span className="text-[11px] text-red-400 mt-1 px-1">
                  {errorMessage}
                </span>
              )}
            </div>

            {/* FIELD 2: CATEGORY DROPDOWN */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-zinc-200 mb-1.5 px-0.5">
                Category
              </label>

              <div
                data-testid="category-selector"
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className="w-full bg-[#1a1b38] border border-[#2b2d5c] hover:border-[#7c3aed]/60 cursor-pointer rounded-2xl px-4 py-3.5 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="p-1 rounded-lg bg-white/5">
                    {CATEGORY_ICON_MAP[selectedCategory.id] || (
                      <Sparkles className="w-4 h-4 text-purple-400" />
                    )}
                  </span>
                  <span className="text-white font-medium text-sm">
                    {selectedCategory.name}
                  </span>
                </div>

                <ChevronDown
                  className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                    isCategoryDropdownOpen ? 'rotate-180 text-purple-400' : ''
                  }`}
                />
              </div>

              {/* DROPDOWN MENU / DRAWER FOR CATEGORIES */}
              {isCategoryDropdownOpen && (
                <div
                  data-testid="category-dropdown-menu"
                  className="mt-2 p-2 rounded-2xl bg-[#161738] border border-[#2e3164] shadow-2xl flex flex-col gap-1 max-h-56 overflow-y-auto z-30 animate-in fade-in zoom-in-95 duration-150"
                >
                  {categories.map((cat) => {
                    const isSelected = cat.id === selectedCategoryId;
                    return (
                      <div
                        key={cat.id}
                        data-category-id={cat.id}
                        onClick={() => {
                          setSelectedCategoryId(cat.id);
                          setIsCategoryDropdownOpen(false);
                        }}
                        className={`px-3 py-2.5 rounded-xl flex items-center justify-between cursor-pointer text-xs font-semibold transition-colors ${
                          isSelected
                            ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                            : 'hover:bg-white/5 text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {CATEGORY_ICON_MAP[cat.id] || (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                          <span>{cat.name}</span>
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-purple-400" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* FIELD 3: ROOM TYPE (Public / Private) */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-zinc-200 mb-1.5 px-0.5">
                Room Type
              </label>

              <div className="grid grid-cols-2 gap-3">
                {/* 1. PUBLIC BUTTON */}
                <button
                  type="button"
                  data-room-type="public"
                  onClick={() => setRoomType('public')}
                  className={`py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2.5 font-bold text-sm transition-all duration-200 ${
                    roomType === 'public'
                      ? 'bg-gradient-to-r from-[#6b21a8] to-[#7c3aed] text-white border border-[#a855f7] shadow-lg shadow-purple-600/30 scale-[1.01]'
                      : 'bg-[#181a38] border border-white/5 text-zinc-400 hover:text-white hover:bg-[#1f2145]'
                  }`}
                >
                  <Globe
                    className={`w-4 h-4 ${
                      roomType === 'public' ? 'text-white' : 'text-zinc-400'
                    }`}
                  />
                  <span>Public</span>
                </button>

                {/* 2. PRIVATE BUTTON */}
                <button
                  type="button"
                  data-room-type="private"
                  onClick={() => setRoomType('private')}
                  className={`py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2.5 font-bold text-sm transition-all duration-200 ${
                    roomType === 'private'
                      ? 'bg-gradient-to-r from-[#6b21a8] to-[#7c3aed] text-white border border-[#a855f7] shadow-lg shadow-purple-600/30 scale-[1.01]'
                      : 'bg-[#181a38] border border-white/5 text-zinc-400 hover:text-white hover:bg-[#1f2145]'
                  }`}
                >
                  <Lock
                    className={`w-4 h-4 ${
                      roomType === 'private' ? 'text-white' : 'text-zinc-400'
                    }`}
                  />
                  <span>Private</span>
                </button>
              </div>
            </div>

            {/* ACTION BUTTON: Create Party */}
            <button
              type="submit"
              data-action="create-party"
              disabled={isSubmitting || !title.trim()}
              className={`w-full py-4 mt-2 rounded-full font-bold text-base tracking-wide text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-xl ${
                isSubmitting || !title.trim()
                  ? 'bg-zinc-700/60 text-zinc-400 cursor-not-allowed shadow-none'
                  : 'bg-[#7c3aed] hover:bg-[#6d28d9] active:scale-[0.98] shadow-purple-600/40 hover:shadow-purple-600/60 cursor-pointer'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating Party...</span>
                </>
              ) : (
                <span>Create Party</span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* OFFICIAL MODULE BOTTOM BANNER (Matching 05_01_create_a_party.png) */}
      <footer className="w-full bg-[#120f2b] border-t border-[#1e1b40] py-3.5 px-4 text-center mt-auto">
        <span className="text-sm font-bold text-white tracking-wide">
          05_01 Create a Party
        </span>
      </footer>
    </div>
  );
}
