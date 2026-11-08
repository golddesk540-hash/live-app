'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/languageContext';
import {
  Search,
  Coins,
  Download,
  Globe,
  Radio,
  Users,
  Heart,
  MessageSquare,
  User,
  Compass,
  Swords,
  Trophy,
  Flame,
  Camera,
  ArrowLeft,
  Sparkles,
  ChevronRight,
  LogOut,
  Settings,
  Shield,
  HelpCircle,
  Eye,
  Loader2,
  X,
  ExternalLink,
} from 'lucide-react';

export type DiscoveryTab = 'explore' | 'following' | 'new' | 'pk';

interface RoomItem {
  id: string;
  roomTitle: string;
  hostId: string;
  hostName: string;
  hostPoppoId: string;
  hostAvatar: string;
  coverImage: string;
  country: string;
  countryCode: string;
  viewers: string;
  viewersRaw: number;
  isLive: boolean;
  isPk: boolean;
  pkOpponent?: string | null;
  category: string;
  tags: string[];
}

interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  tagline: string;
  image: string;
  link: string;
  gradient: string;
}

interface DiscoveryShellProps {
  initialTab?: DiscoveryTab;
}

export function DiscoveryShell({ initialTab = 'explore' }: DiscoveryShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { lang, toggleLang, isUr } = useLanguage();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<DiscoveryTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [user, setUser] = useState<any | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Sync activeTab with pathname if user navigates via browser back/forward
  useEffect(() => {
    if (pathname.includes('/live/following')) setActiveTab('following');
    else if (pathname.includes('/live/new')) setActiveTab('new');
    else if (pathname.includes('/live/pk')) setActiveTab('pk');
    else if (pathname.includes('/live/explore')) setActiveTab('explore');
  }, [pathname]);

  // Fetch session & live discovery data
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);

        // 1. Check user session
        if (!isAuthChecked) {
          const sessRes = await fetch('/api/auth/session').catch(() => null);
          if (sessRes && sessRes.ok) {
            const sessData = await sessRes.json();
            if (isMounted) {
              setUser(sessData.authenticated ? sessData.user : null);
              setIsAuthChecked(true);
            }
          }
        }

        // 2. Fetch rooms for current tab
        const res = await fetch(`/api/live/discovery?tab=${activeTab}&search=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setRooms(data.rooms || []);
            setBanners(data.banners || []);
          }
        }
      } catch (err) {
        console.error('Failed to load discovery rooms:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [activeTab, searchQuery]);

  const handleTabChange = (tab: DiscoveryTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    startTransition(() => {
      router.push(`/live/${tab}`, { scroll: false });
    });
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/account/logout', { method: 'POST' });
      setUser(null);
      setShowUserMenu(false);
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const tabs: { id: DiscoveryTab; label_en: string; label_ur: string }[] = [
    { id: 'explore', label_en: 'Explore', label_ur: 'دریافت' },
    { id: 'following', label_en: 'Following', label_ur: 'فالوئنگ' },
    { id: 'new', label_en: 'New', label_ur: 'نئے' },
    { id: 'pk', label_en: 'PK', label_ur: 'پی کے' },
  ];

  return (
    <div
      className="min-h-screen bg-[#080915] text-white flex flex-col font-sans selection:bg-[#FF2E74] selection:text-white pb-20 lg:pb-0"
      dir={isUr ? 'rtl' : 'ltr'}
    >
      {/* 1. TOP HEADER (Responsive Desktop & Tablet) */}
      <header className="sticky top-0 z-40 bg-[#0c0e1e]/90 backdrop-blur-xl border-b border-white/10 h-14 sm:h-16 px-4 sm:px-8 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Back on Mobile */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
          >
            {/* Popo Live Iconic Gradient Circle Logo */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FF2E74] via-[#A855F7] to-[#3B82F6] p-[2px] shadow-lg shadow-pink-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#120B24] rounded-full flex items-center justify-center font-black text-sm text-transparent bg-clip-text bg-gradient-to-tr from-[#FF2E74] to-yellow-300">
                P
              </div>
            </div>
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white flex items-center gap-1">
              Popo <span className="text-[#FF2E74]">Live</span>
            </span>
          </Link>
        </div>

        {/* Center: Search Bar (Desktop) */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative">
            <Search className={`absolute ${isUr ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 w-4 h-4 text-white/40`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isUr ? 'لائیو براڈکاسٹ، آئی ڈی یا اسٹریمر تلاش کریں...' : 'Search streamers, live rooms, user ID...'}
              className={`w-full ${isUr ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 bg-white/5 hover:bg-white/[0.08] focus:bg-[#15132d] rounded-full text-xs sm:text-sm text-white placeholder-white/35 border border-white/10 focus:border-[#FF2E74] outline-none transition-all`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute ${isUr ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-white/40 hover:text-white`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Action Items */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-semibold shrink-0">
          
          {/* Mobile Search Icon button */}
          <button
            type="button"
            onClick={() => setShowSearchModal(true)}
            className="md:hidden w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Get Coins Shortcut */}
          <Link
            href="/recharge"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all hover:scale-105"
          >
            <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-black text-[9px] font-black shadow-sm">
              💰
            </div>
            <span className="hidden sm:inline text-xs">{isUr ? 'کوائنز حاصل کریں' : 'Get Coins'}</span>
          </Link>

          {/* Get App Shortcut */}
          <Link
            href="/download"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 transition-colors text-xs"
          >
            <Download className="w-3.5 h-3.5 text-pink-400" />
            <span>{isUr ? 'ایپ حاصل کریں' : 'Get App'}</span>
          </Link>

          {/* Language Selector */}
          <button
            type="button"
            onClick={toggleLang}
            className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-xs text-white/70 hover:text-white border border-white/10 transition-colors"
          >
            {isUr ? 'English' : 'اردو'}
          </button>

          {/* User Account State (Logged-In Dropdown vs Guest Login Buttons) */}
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.nickname} className="w-full h-full object-cover" />
                  ) : (
                    user.nickname?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <span className="hidden md:inline text-xs text-white/90 max-w-[80px] truncate">
                  {user.nickname}
                </span>
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div
                  className={`absolute ${isUr ? 'left-0' : 'right-0'} mt-2 w-56 rounded-2xl bg-[#140f2b] border border-white/15 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150`}
                >
                  <div className="p-3 border-b border-white/10 mb-1">
                    <p className="text-xs font-bold text-white truncate">{user.nickname}</p>
                    <p className="text-[10px] text-white/50 font-mono">ID: {user.poppoId}</p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-pink-400" />
                    <span>{isUr ? 'میری پروفائل' : 'My Profile'}</span>
                  </Link>
                  <Link
                    href="/account"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5 text-purple-400" />
                    <span>{isUr ? 'ویب اکاؤنٹ' : 'Web Account'}</span>
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isUr ? 'ترتیبات' : 'Settings'}</span>
                  </Link>
                  <Link
                    href="/help"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isUr ? 'ہیلپ سینٹر' : 'Help Center'}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors mt-1 border-t border-white/5 pt-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{isUr ? 'لاگ آؤٹ' : 'Log Out'}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                {isUr ? 'لاگ ان' : 'Log In'}
              </Link>
              <Link
                href="/signup"
                className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-[#FF2E74] to-[#FF4B8B] text-white shadow-md shadow-pink-500/20 hover:brightness-110 transition-all"
              >
                {isUr ? 'سائن اپ' : 'Sign Up'}
              </Link>
            </div>
          )}

        </div>
      </header>

      {/* 2. BODY LAYOUT: SIDEBAR (Desktop) + MAIN CONTENT CONTAINER */}
      <div className="flex-1 flex max-w-[1720px] w-full mx-auto">
        
        {/* DESKTOP SIDEBAR NAVIGATION */}
        <aside className="hidden lg:flex w-64 xl:w-72 bg-[#0b0c1c] border-r border-white/10 flex-col justify-between shrink-0 p-5 space-y-6">
          <div className="space-y-6">
            
            {/* Get App CTA Button */}
            <Link
              href="/download"
              className="w-full py-3 px-4 bg-gradient-to-r from-[#FF2E74] to-[#A855F7] hover:brightness-110 text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{isUr ? 'پوپو لائیو ایپ ڈاؤن لوڈ کریں' : 'Download Popo Live App'}</span>
            </Link>

            {/* Main Navigation List */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider px-3 block mb-2">
                {isUr ? 'نیویگیشن' : 'Discovery'}
              </span>

              {[
                { id: 'explore', label_en: 'Explore', label_ur: 'دریافت', icon: Compass, href: '/live/explore', count: 'HOT' },
                { id: 'following', label_en: 'Following', label_ur: 'فالوئنگ', icon: Heart, href: '/live/following', count: null },
                { id: 'new', label_en: 'New Streamers', label_ur: 'نئے براڈکاسٹرز', icon: Sparkles, href: '/live/new', count: 'NEW' },
                { id: 'pk', label_en: 'PK Battles', label_ur: 'پی کے مقابلے', icon: Swords, href: '/live/pk', count: 'LIVE' },
              ].map((item) => {
                const isSelected = activeTab === item.id;
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabChange(item.id as DiscoveryTab)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#FF2E74]/20 to-purple-600/20 text-white border border-[#FF2E74]/40 shadow-sm'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className={`w-4 h-4 ${isSelected ? 'text-[#FF2E74]' : 'text-white/50'}`} />
                      <span>{isUr ? item.label_ur : item.label_en}</span>
                    </div>
                    {item.count && (
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                        item.count === 'HOT' ? 'bg-[#FF2E74] text-white' : 'bg-purple-500/20 text-purple-300'
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Community Shortcuts */}
            <div className="space-y-1 pt-2 border-t border-white/5">
              <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider px-3 block mb-2">
                {isUr ? 'پلیٹ فارم' : 'Platform'}
              </span>

              {[
                { label_en: 'Agency Portal', label_ur: 'ایجنسی پورٹل', icon: Trophy, href: '/agency' },
                { label_en: 'Recharge Coins', label_ur: 'کوائنز ریچارج', icon: Coins, href: '/recharge' },
                { label_en: 'Help & Support', label_ur: 'مدد اور سوالات', icon: HelpCircle, href: '/help' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-white/60 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <item.icon className="w-4 h-4 text-white/40" />
                  <span>{isUr ? item.label_ur : item.label_en}</span>
                </Link>
              ))}
            </div>

          </div>

          {/* Sidebar Bottom Banner Card */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-purple-900/40 via-indigo-950/40 to-pink-900/20 border border-white/10 text-center space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF2E74] to-[#A855F7] flex items-center justify-center mx-auto text-white shadow-lg shadow-pink-500/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <h4 className="text-xs font-extrabold text-white">Start Broadcasting</h4>
            <p className="text-[10px] text-white/60 leading-relaxed">
              Go live with one click. Gain fans and monetize your talent.
            </p>
            <Link
              href="/download"
              className="inline-block px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-colors"
            >
              Get Studio App
            </Link>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col min-w-0 px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
          
          {/* MOBILE HERO BANNER (1:1 MATCH WITH 03_01_app_web_shells_tabs.png) */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#4A154B] via-[#7B1FA2] to-[#D81B60] p-5 sm:p-7 shadow-xl shadow-purple-900/20 border border-white/10">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-transparent to-black/30 pointer-events-none" />
            
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-1 sm:space-y-2 max-w-sm sm:max-w-md">
                <span className="inline-block px-2 py-0.5 rounded-md bg-white/20 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-sm">
                  POPULAR
                </span>
                <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                  Popo Live
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-white/90">
                  Live • Party • PK • Chat
                </p>
                <div className="pt-2">
                  <Link
                    href="/download"
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-[#7B1FA2] font-black text-xs shadow-md hover:bg-white/90 transition-transform active:scale-95"
                  >
                    <span>{isUr ? 'ابھی دیکھیں' : 'Watch Live'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Streamer Avatar Cutout Graphic matching reference */}
              <div className="shrink-0 relative w-24 h-24 sm:w-36 sm:h-36">
                <div className="w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden ring-4 ring-white/20 shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80"
                    alt="Featured Host"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-rose-600 text-white font-black text-[9px] shadow-sm animate-pulse">
                  HOT
                </div>
              </div>
            </div>
          </div>

          {/* 4 CATEGORY SHORTCUT BUTTONS (Live, Party, PK, Rank - 1:1 match with 03_01) */}
          <div className="grid grid-cols-4 gap-2 sm:gap-4">
            
            {/* Live */}
            <button
              type="button"
              onClick={() => handleTabChange('explore')}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition-all group active:scale-95"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[#FF2E74] to-[#FF4B8B] flex items-center justify-center text-white shadow-lg shadow-pink-500/20 group-hover:scale-105 transition-transform">
                <Radio className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-white/90">{isUr ? 'لائیو' : 'Live'}</span>
            </button>

            {/* Party */}
            <Link
              href="/live/explore?category=party"
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition-all group active:scale-95"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[#3B82F6] to-[#06B6D4] flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-white/90">{isUr ? 'پارٹی' : 'Party'}</span>
            </Link>

            {/* PK */}
            <button
              type="button"
              onClick={() => handleTabChange('pk')}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition-all group active:scale-95"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[#8B5CF6] to-[#EC4899] flex items-center justify-center text-white shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
                <Swords className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-white/90">{isUr ? 'پی کے' : 'PK'}</span>
            </button>

            {/* Rank */}
            <Link
              href="/agency"
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition-all group active:scale-95"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[#F59E0B] to-[#FBBF24] flex items-center justify-center text-white shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Trophy className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-white/90">{isUr ? 'رینک' : 'Rank'}</span>
            </Link>

          </div>

          {/* MAIN NAVIGATION TABS (Explore, Following, New, PK) */}
          <div className="border-b border-white/10 pb-1">
            <div className="flex items-center gap-6 sm:gap-8">
              {tabs.map((tab) => {
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className={`relative py-3 text-sm sm:text-base font-extrabold transition-colors flex items-center gap-1.5 ${
                      isSelected ? 'text-white' : 'text-white/50 hover:text-white/80'
                    }`}
                  >
                    <span>{isUr ? tab.label_ur : tab.label_en}</span>

                    {/* Active Selected Tab Indicator matching design */}
                    {isSelected && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 rounded-full bg-gradient-to-r from-[#FF2E74] to-[#FF4B8B] shadow-sm shadow-pink-500/50" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* MAIN ROOM CONTENT GRID */}
          <div className="space-y-4">
            
            {/* Header info */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white/60 uppercase tracking-wider">
                {isUr ? `${activeTab.toUpperCase()} کمرے` : `${activeTab.toUpperCase()} ROOMS (${rooms.length})`}
              </span>
              {loading && (
                <div className="flex items-center gap-1.5 text-xs text-pink-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{isUr ? 'لوڈ ہو رہا ہے...' : 'Updating...'}</span>
                </div>
              )}
            </div>

            {/* Room Cards Grid (2-column on mobile matching 03_01, 3-column on tablet, 4-column on desktop) */}
            {loading && rooms.length === 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-[4/5] rounded-3xl bg-white/5 animate-pulse border border-white/5" />
                ))}
              </div>
            ) : rooms.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-white/5 space-y-3">
                <Radio className="w-10 h-10 text-white/30 mx-auto" />
                <h3 className="text-sm font-bold text-white">No active rooms found</h3>
                <p className="text-xs text-white/50 max-w-sm mx-auto">
                  {activeTab === 'following'
                    ? 'You are not following any live streamers yet. Explore popular creators to follow them!'
                    : 'Check back shortly or explore another discovery category.'}
                </p>
                {activeTab === 'following' && (
                  <button
                    type="button"
                    onClick={() => handleTabChange('explore')}
                    className="px-4 py-2 rounded-xl bg-[#FF2E74] text-white text-xs font-bold shadow-md hover:brightness-110"
                  >
                    Go to Explore
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                {rooms.map((room) => (
                  <Link
                    key={room.id}
                    href={`/user/${room.hostPoppoId}`}
                    className="group relative rounded-3xl overflow-hidden aspect-[4/5] bg-[#120e26] border border-white/10 shadow-lg hover:shadow-pink-500/10 hover:border-pink-500/40 transition-all transform hover:-translate-y-1 block"
                  >
                    {/* Cover photo */}
                    <img
                      src={room.coverImage}
                      alt={room.hostName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                    {/* TOP BADGES */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                      {/* LIVE Badge (pink capsule with live indicator) */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-[#FF2E74] to-[#FF4B8B] text-white text-[10px] font-black uppercase shadow-md shadow-pink-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span>LIVE</span>
                      </div>

                      {/* Right Tag (PK or Country) */}
                      {room.isPk ? (
                        <div className="px-2 py-0.5 rounded-full bg-purple-600/80 backdrop-blur-sm text-white text-[9px] font-extrabold flex items-center gap-1 border border-purple-400/30">
                          <Swords className="w-2.5 h-2.5" />
                          <span>PK</span>
                        </div>
                      ) : (
                        <div className="px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm text-white text-[10px] font-medium border border-white/10">
                          {room.countryCode}
                        </div>
                      )}
                    </div>

                    {/* BOTTOM STREAM INFO (Matching 03_01_app_web_shells_tabs.png) */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 space-y-1 z-10">
                      
                      {/* Stream Title */}
                      <p className="text-xs font-bold text-white line-clamp-1 drop-shadow-md">
                        {room.hostName}
                      </p>
                      
                      {/* Host subtext */}
                      <p className="text-[10px] text-white/70 line-clamp-1">
                        {room.roomTitle}
                      </p>

                      {/* Viewers & Stats Bar */}
                      <div className="flex items-center justify-between pt-1">
                        {/* Host avatar & viewers capsule */}
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-[10px] font-semibold text-white/90 border border-white/10">
                          <Eye className="w-3 h-3 text-pink-400" />
                          <span>{room.viewers}</span>
                        </div>

                        {/* ID Tag */}
                        <span className="text-[9px] font-mono text-white/50">
                          ID: {room.hostPoppoId}
                        </span>
                      </div>

                    </div>
                  </Link>
                ))}
              </div>
            )}

          </div>

        </main>

      </div>

      {/* 3. MOBILE BOTTOM NAVIGATION BAR (1:1 MATCH WITH 03_01_app_web_shells_tabs.png) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c0e1e]/95 backdrop-blur-xl border-t border-white/10 px-3 py-2 flex items-center justify-around">
        
        {/* Item 1: Explore (Active with glowing ring indicator matching reference) */}
        <button
          type="button"
          onClick={() => handleTabChange('explore')}
          className="flex flex-col items-center gap-1 relative group"
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            activeTab === 'explore'
              ? 'bg-gradient-to-tr from-[#FF2E74] to-[#A855F7] text-white ring-2 ring-pink-500/50 shadow-md shadow-pink-500/30'
              : 'text-white/50 hover:text-white'
          }`}>
            <Compass className="w-4 h-4" />
          </div>
          <span className={`text-[10px] font-bold ${activeTab === 'explore' ? 'text-[#FF2E74]' : 'text-white/50'}`}>
            {isUr ? 'دریافت' : 'Explore'}
          </span>
        </button>

        {/* Item 2: Following */}
        <button
          type="button"
          onClick={() => handleTabChange('following')}
          className="flex flex-col items-center gap-1 text-white/50 hover:text-white"
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            activeTab === 'following'
              ? 'bg-gradient-to-tr from-[#FF2E74] to-[#A855F7] text-white ring-2 ring-pink-500/50 shadow-md shadow-pink-500/30'
              : 'text-white/50'
          }`}>
            <Heart className="w-4 h-4" />
          </div>
          <span className={`text-[10px] font-bold ${activeTab === 'following' ? 'text-[#FF2E74]' : 'text-white/50'}`}>
            {isUr ? 'فالوئنگ' : 'Following'}
          </span>
        </button>

        {/* Item 3: Center Elevated Pink Camera / Go Live Button (Direct match to reference image) */}
        <Link
          href="/download"
          className="relative -top-3 w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF2E74] via-[#FF3B7F] to-[#FF4B8B] text-white flex items-center justify-center shadow-xl shadow-pink-500/40 ring-4 ring-[#080915] active:scale-95 transition-transform"
        >
          <Camera className="w-6 h-6 stroke-[2.2]" />
        </Link>

        {/* Item 4: Messages */}
        <Link
          href="/help"
          className="flex flex-col items-center gap-1 text-white/50 hover:text-white"
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white/50">
            <MessageSquare className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-white/50">
            {isUr ? 'پیغامات' : 'Messages'}
          </span>
        </Link>

        {/* Item 5: Me / Profile */}
        <Link
          href={user ? '/profile' : '/login'}
          className="flex flex-col items-center gap-1 text-white/50 hover:text-white"
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white/50">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Me" className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <User className="w-4 h-4" />
            )}
          </div>
          <span className="text-[10px] font-bold text-white/50">
            {isUr ? 'پروفائل' : 'Me'}
          </span>
        </Link>

      </nav>

      {/* MOBILE SEARCH MODAL */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center gap-2 pb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search streamers, ID..."
                className="w-full pl-9 pr-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-white text-sm outline-none focus:border-[#FF2E74]"
              />
            </div>
            <button
              onClick={() => setShowSearchModal(false)}
              className="p-2 text-white/70 hover:text-white"
            >
              Cancel
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2">
            <p className="text-xs text-white/40 px-2">Popular searches</p>
            {['PK Battle', 'Music', 'Lahore', 'Manila', 'Singing'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setSearchQuery(tag);
                  setShowSearchModal(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white font-medium"
              >
                🔍 {tag}
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
