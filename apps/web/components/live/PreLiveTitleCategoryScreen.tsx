'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Camera,
  Edit3,
  MessageCircle,
  Music,
  Sparkles,
  Coffee,
  Gamepad2,
  Award,
  BookOpen,
  Check,
  RefreshCw,
  AlertCircle,
  X,
  Upload,
  Radio,
  Sliders,
  Smile,
  ShieldAlert,
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  description: string;
  iconName: string;
}

export default function PreLiveTitleCategoryScreen() {
  const router = useRouter();

  // Pre-live form state
  const [title, setTitle] = useState('Come and chat with me 💕');
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem>({
    id: 'live_chat',
    name: 'Live Chat',
    description: 'Casual conversation, social interaction & daily talks',
    iconName: 'message-circle',
  });
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [coverUrl, setCoverUrl] = useState<string>('/assets/pre-live/sample_cover_model.png');

  // Gating & user state from Module 4.1
  const [isEligible, setIsEligible] = useState<boolean>(true);
  const [missingGates, setMissingGates] = useState<string[]>([]);
  const [user, setUser] = useState<{ id?: string; nickname?: string; poppoId?: string; wealthLevel?: number } | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCategoryDrawer, setShowCategoryDrawer] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cover image upload state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Quick camera controls state (aesthetic simulation)
  const [isCameraFlipped, setIsCameraFlipped] = useState(false);
  const [filterActive, setFilterActive] = useState(true);

  // 1. Fetch config & existing setup from server
  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/live/pre-live/config');
      const data = await res.json();

      if (data.success) {
        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories);
        }
        if (data.savedSetup) {
          if (data.savedSetup.title) setTitle(data.savedSetup.title);
          if (data.savedSetup.coverUrl) setCoverUrl(data.savedSetup.coverUrl);
          if (data.savedSetup.categoryId && data.categories) {
            const matched = data.categories.find((c: CategoryItem) => c.id === data.savedSetup.categoryId);
            if (matched) setSelectedCategory(matched);
          }
        }
        if (data.gates) {
          setIsEligible(data.gates.isEligible);
          setMissingGates(data.gates.missingGates || []);
        }
        if (data.user) {
          setUser(data.user);
        }
      } else if (res.status === 401) {
        // Fallback for demo preview
        const demoRes = await fetch('/api/live/pre-live/config?preview=demo');
        const demoData = await demoRes.json();
        if (demoData.success) {
          setCategories(demoData.categories);
          if (demoData.savedSetup) {
            setTitle(demoData.savedSetup.title);
            setCoverUrl(demoData.savedSetup.coverUrl);
          }
          setUser(demoData.user);
        }
      } else {
        setError(data.error || 'Failed to load pre-live configuration.');
      }
    } catch (err) {
      console.error('Error fetching pre-live config:', err);
      setError('Network error while loading pre-live setup.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Category Icon Resolver
  const renderCategoryIcon = (iconName: string, className = 'w-5 h-5') => {
    switch (iconName) {
      case 'music':
        return <Music className={className} />;
      case 'sparkles':
        return <Sparkles className={className} />;
      case 'coffee':
        return <Coffee className={className} />;
      case 'gamepad-2':
        return <Gamepad2 className={className} />;
      case 'award':
        return <Award className={className} />;
      case 'book-open':
        return <BookOpen className={className} />;
      case 'message-circle':
      default:
        return <MessageCircle className={className} />;
    }
  };

  // -------------------------------------------------------------
  // Cover Image Upload Handlers
  // -------------------------------------------------------------
  const handleCoverFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setCoverError('Please select a JPG, PNG, or WebP image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setCoverError('Image size exceeds the 5MB maximum limit.');
      return;
    }

    setIsUploadingCover(true);
    setCoverError(null);
    setUploadProgress(30);

    try {
      const formData = new FormData();
      formData.append('file', file);
      setUploadProgress(65);

      const res = await fetch('/api/live/gates/cover-upload', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(90);
      const data = await res.json();

      if (res.ok && data.success) {
        setUploadProgress(100);
        setCoverUrl(data.coverUrl);
        setTimeout(() => {
          setShowCoverModal(false);
          setIsUploadingCover(false);
        }, 400);
      } else {
        setCoverError(data.error || 'Failed to upload new cover image.');
        setIsUploadingCover(false);
      }
    } catch (err) {
      setCoverError('Network error while uploading image.');
      setIsUploadingCover(false);
    }
  };

  // Quick Emoji adder
  const handleAddEmoji = (emoji: string) => {
    if ((title + emoji).length <= 60) {
      setTitle((prev) => prev + emoji);
    }
  };

  // -------------------------------------------------------------
  // Go Live Button Action (Authoritative Validation)
  // -------------------------------------------------------------
  const handleGoLive = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Live title cannot be empty.');
      return;
    }
    if (trimmedTitle.length > 60) {
      setError('Live title cannot exceed 60 characters.');
      return;
    }
    if (!selectedCategory?.id) {
      setError('Please select a category for your stream.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/live/pre-live/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trimmedTitle,
          categoryId: selectedCategory.id,
          coverUrl,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setShowStudioModal(true);
      } else if (res.status === 403) {
        setError(data.reasons ? data.reasons.join(' • ') : data.error || 'Go-Live gates validation failed.');
        setIsEligible(false);
        setMissingGates(data.missingGates || []);
      } else {
        setError(data.error || 'Failed to initialize live session.');
      }
    } catch (err) {
      console.error('Error in handleGoLive:', err);
      setError('Network error while initiating live session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080915] text-white flex flex-col justify-between selection:bg-[#ff2465] selection:text-white relative overflow-hidden font-sans">
      {/* Ambient background glow (matching 04_02 reference) */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-0 w-64 h-64 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main container constrained for mobile reference parity */}
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-between px-5 pt-4 pb-6 z-10">
        {/* Top Header */}
        <div className="w-full flex flex-col items-center">
          {/* Popo Live Logo */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-400 via-pink-500 to-yellow-400 p-[1.5px] shadow-[0_0_12px_rgba(255,46,116,0.3)]">
              <div className="w-full h-full bg-[#121324] rounded-[6px] flex items-center justify-center">
                <span className="text-[10px] font-black tracking-tighter bg-gradient-to-r from-pink-400 to-cyan-300 bg-clip-text text-transparent">
                  LIVE
                </span>
              </div>
            </div>
            <span className="font-extrabold text-lg tracking-tight text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.2)]">
              poppo <span className="text-white font-normal">Live</span>
            </span>
          </div>

          {/* Navigation & Screen Heading */}
          <div className="w-full flex items-center justify-between relative py-2">
            <button
              onClick={() => router.push('/live/setup')}
              aria-label="Back to Setup"
              className="w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <h1 className="text-xl font-bold text-white tracking-tight text-center">
              Go Live
            </h1>

            {/* Symmetrical spacer */}
            <div className="w-10 h-10" />
          </div>
        </div>

        {/* Gate Incomplete Warning Banner (if user bypassed Module 4.1) */}
        {!isEligible && (
          <div className="my-2 p-3 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Gating requirements incomplete (Module 4.1).</span>
            </div>
            <Link
              href="/live/setup"
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 font-bold text-amber-300"
            >
              Verify Gates
            </Link>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="my-2 p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{error}</div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* Card 1: Cover Image Preview & Edit (1:1 with 04_02)       */}
        {/* ========================================================= */}
        <div className="w-full flex flex-col my-auto py-2 space-y-4">
          <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-[26px] overflow-hidden bg-[#161836] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.4)] group">
            <img
              src={coverUrl}
              alt="Live Cover"
              className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                isCameraFlipped ? 'scale-x-[-1]' : ''
              }`}
              onError={(e) => {
                // Fallback to sample model crop if URL fails
                (e.target as HTMLImageElement).src = '/assets/pre-live/sample_cover_model.png';
              }}
            />

            {/* Ambient top vignette for contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

            {/* Floating Top-Right Quick Action Buttons (Flip camera, Beauty filters) */}
            <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
              <button
                type="button"
                onClick={() => setIsCameraFlipped((prev) => !prev)}
                title="Flip Camera"
                className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 hover:text-white hover:bg-black/60 active:scale-90 transition-all shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setFilterActive((prev) => !prev)}
                title="Beauty Filter"
                className={`w-8 h-8 rounded-full backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-90 transition-all shadow-md ${
                  filterActive ? 'bg-pink-600/60 text-white' : 'bg-black/40 text-white/70 hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom "Edit Cover" pill button with Camera Icon (1:1 with 04_02 reference) */}
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowCoverModal(true)}
                className="w-full py-2.5 px-4 rounded-2xl bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/15 flex items-center justify-between text-white active:scale-[0.98] transition-all shadow-lg"
              >
                <span className="text-sm font-semibold tracking-wide ml-auto mr-2">
                  Edit Cover
                </span>
                <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Camera className="w-4 h-4 text-white" />
                </div>
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* Card 2: Live Title Input Section (1:1 with 04_02)         */}
          {/* ========================================================= */}
          <div className="w-full p-4 rounded-[22px] bg-[#141630]/90 border border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col gap-2.5">
            {/* Top row: Pencil icon + Label + Character Counter */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-zinc-300">
                <Edit3 className="w-4 h-4 text-white/80" />
                <span className="text-[15px] font-bold text-white tracking-tight">
                  Live Title
                </span>
              </div>
              <span
                className={`text-[11px] font-medium ${
                  title.length >= 55 ? 'text-rose-400 font-bold' : 'text-zinc-500'
                }`}
              >
                {title.length}/60
              </span>
            </div>

            {/* Title Text Input Field */}
            <div className="relative w-full">
              <input
                type="text"
                value={title}
                maxLength={60}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Come and chat with me 💕"
                className="w-full bg-transparent border-0 text-white font-medium text-[15px] placeholder-zinc-500 focus:outline-none focus:ring-0 px-0 py-1"
              />
            </div>

            {/* Quick Emoji Bar */}
            <div className="flex items-center gap-1.5 pt-1 border-t border-white/5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-zinc-500 flex items-center gap-1 mr-1">
                <Smile className="w-3 h-3" /> Quick:
              </span>
              {['💕', '🎙️', '✨', '🎵', '🔥', '👑', '🎉', '💖'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleAddEmoji(emoji)}
                  className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs active:scale-90 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* ========================================================= */}
          {/* Card 3: Category Selection Section (1:1 with 04_02)       */}
          {/* ========================================================= */}
          <div
            onClick={() => setShowCategoryDrawer(true)}
            role="button"
            tabIndex={0}
            className="w-full p-4 rounded-[22px] bg-[#141630]/90 border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col gap-2.5 active:scale-[0.99]"
          >
            {/* Top row: Category icon + "Category" label */}
            <div className="flex items-center gap-2.5 text-pink-400">
              <div className="w-5 h-5 rounded-md bg-pink-500/20 flex items-center justify-center text-pink-400">
                <Radio className="w-3.5 h-3.5" />
              </div>
              <span className="text-[15px] font-bold text-white tracking-tight">
                Category
              </span>
            </div>

            {/* Bottom row: Selected category icon + Category name + Right Chevron */}
            <div className="flex items-center justify-between pt-0.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 flex-shrink-0">
                  {renderCategoryIcon(selectedCategory?.iconName || 'message-circle', 'w-4 h-4')}
                </div>
                <span className="text-[15px] font-semibold text-white tracking-tight">
                  {selectedCategory?.name || 'Live Chat'}
                </span>
              </div>

              <ChevronRight className="w-5 h-5 text-zinc-400" />
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* Bottom Action: Pink Pill Button (Go Live)                 */}
        {/* ========================================================= */}
        <div className="w-full pt-4 pb-2 flex flex-col items-center">
          <button
            type="button"
            onClick={handleGoLive}
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-full text-center font-bold text-[17px] tracking-wide bg-gradient-to-r from-[#e91e63] via-[#ff2d55] to-[#f06292] text-white shadow-[0_4px_25px_rgba(255,45,85,0.45)] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" /> Preparing Studio...
              </span>
            ) : (
              'Go Live'
            )}
          </button>

          {/* Reference footer slide title */}
          <div className="mt-4 pt-2 text-[12px] font-bold text-zinc-500 tracking-wider">
            4.2 Pre-Live Title & Category
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DRAWER / MODAL: Category Selector                         */}
      {/* ========================================================= */}
      {showCategoryDrawer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-[#13152c] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] p-5 flex flex-col max-h-[85vh] shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-400">
                  <Radio className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Select Broadcast Category
                </h3>
              </div>
              <button
                onClick={() => setShowCategoryDrawer(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category list */}
            <div className="overflow-y-auto no-scrollbar py-3 space-y-2 flex-1">
              {(categories.length > 0
                ? categories
                : [
                    { id: 'live_chat', name: 'Live Chat', description: 'Social & daily talks', iconName: 'message-circle' },
                    { id: 'music', name: 'Music', description: 'Singing & instruments', iconName: 'music' },
                    { id: 'entertainment', name: 'Entertainment', description: 'Comedy & dance', iconName: 'sparkles' },
                    { id: 'lifestyle', name: 'Lifestyle', description: 'Fashion & travel', iconName: 'coffee' },
                    { id: 'gaming', name: 'Gaming', description: 'Gaming & esports', iconName: 'gamepad-2' },
                    { id: 'talent', name: 'Talent', description: 'Magic & art', iconName: 'award' },
                    { id: 'education', name: 'Education', description: 'Language & learning', iconName: 'book-open' },
                  ]
              ).map((cat) => {
                const isSelected = selectedCategory?.id === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setShowCategoryDrawer(false);
                    }}
                    role="button"
                    tabIndex={0}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-pink-500/15 border-pink-500/50 shadow-[0_0_15px_rgba(255,46,116,0.2)]'
                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isSelected ? 'bg-pink-500 text-white' : 'bg-white/10 text-pink-400'
                        }`}
                      >
                        {renderCategoryIcon(cat.iconName, 'w-4 h-4')}
                      </div>
                      <div className="flex flex-col text-left">
                        <span className={`text-sm font-bold ${isSelected ? 'text-pink-300' : 'text-white'}`}>
                          {cat.name}
                        </span>
                        <span className="text-[11px] text-zinc-400 mt-0.5">
                          {cat.description}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center text-white">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowCategoryDrawer(false)}
              className="w-full mt-2 py-3 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: Replace Cover Image                                */}
      {/* ========================================================= */}
      {showCoverModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#121326] border border-white/10 rounded-[28px] p-5 flex flex-col items-center text-center relative shadow-2xl">
            <button
              onClick={() => setShowCoverModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-pink-600/20 border border-pink-500/30 flex items-center justify-center mb-3 text-pink-400">
              <Camera className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white tracking-tight">
              Update Live Cover
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
              Upload an appealing, clear cover representing your stream. Max size: 5MB.
            </p>

            {coverError && (
              <div className="w-full my-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-left text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="flex-1">{coverError}</span>
              </div>
            )}

            <div className="relative w-48 h-32 rounded-2xl overflow-hidden bg-black/50 border border-white/10 my-4 flex items-center justify-center shadow-inner">
              <img src={coverUrl} alt="Cover preview" className="w-full h-full object-cover" />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleCoverFileSelected}
              className="hidden"
            />

            {isUploadingCover && (
              <div className="w-full my-2">
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-pink-500 to-purple-500 h-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-[10px] text-zinc-400 mt-1 block">
                  Uploading image... {uploadProgress}%
                </span>
              </div>
            )}

            <div className="w-full flex flex-col gap-2 mt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingCover}
                className="w-full py-3 rounded-full bg-gradient-to-r from-[#e91e63] to-[#ff2d55] text-white font-bold text-sm shadow-lg shadow-pink-500/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" /> Choose from Device
              </button>

              <button
                type="button"
                onClick={() => setShowCoverModal(false)}
                className="w-full py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: Transition Hook to Module 4.3 (Host Studio)        */}
      {/* ========================================================= */}
      {showStudioModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#121326] border border-pink-500/30 rounded-[28px] p-6 flex flex-col items-center text-center relative shadow-[0_0_50px_rgba(255,45,85,0.25)]">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#e91e63] to-[#ff2d55] flex items-center justify-center mb-4 text-white shadow-lg shadow-pink-500/50 animate-pulse">
              <Radio className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-extrabold text-white tracking-tight">
              Pre-Live Setup Complete!
            </h3>
            <p className="text-xs text-zinc-400 mt-2 max-w-xs leading-relaxed">
              Your stream title and category have been verified and staged on the server.
            </p>

            <div className="w-full my-4 p-3.5 bg-white/5 rounded-2xl border border-white/5 flex flex-col gap-2 text-xs text-left">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Live Title:</span>
                <span className="text-white font-bold truncate max-w-[180px]">{title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Category:</span>
                <span className="text-pink-400 font-bold">{selectedCategory.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Gating Status:</span>
                <span className="text-green-400 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> All Gates Cleared
                </span>
              </div>
            </div>

            <div className="w-full flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowStudioModal(false);
                  router.push('/live/studio');
                }}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#e91e63] to-[#ff2d55] text-white font-bold text-sm shadow-lg shadow-pink-500/40 hover:brightness-110 active:scale-95 transition-all"
              >
                Proceed to Module 4.3 (Host Studio)
              </button>

              <button
                type="button"
                onClick={() => setShowStudioModal(false)}
                className="w-full py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs transition-colors"
              >
                Stay on Pre-Live Screen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
