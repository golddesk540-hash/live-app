'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Coins,
  Download,
  Monitor,
  X,
  User,
  HelpCircle,
  Settings,
  LogOut,
  Shield,
  ChevronDown,
  Globe,
  Bell,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { DesignFixtures } from '@/lib/design/designFixtures';

export interface WebTopNavProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSearchSubmit?: (query: string) => void;
  onOpenAppModal?: () => void;
  onOpenDesktopModal?: () => void;
  isUr?: boolean;
  onToggleLang?: () => void;
  className?: string;
}

export const WebTopNav: React.FC<WebTopNavProps> = ({
  searchQuery = '',
  onSearchChange,
  onSearchSubmit,
  onOpenAppModal,
  onOpenDesktopModal,
  isUr = false,
  onToggleLang,
  className = '',
}) => {
  const router = useRouter();
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync internal search state with external prop
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Click outside listener for user dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Use DesignFixtures for deterministic current user & wallet data
  const user = DesignFixtures.currentUserProfile;
  const coinBalance = DesignFixtures.wallet.coinBalance;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const q = localSearch.trim();
      if (onSearchSubmit) {
        onSearchSubmit(q);
      } else if (q) {
        router.push(`/search?q=${encodeURIComponent(q)}`);
      }
    }
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    if (onSearchChange) onSearchChange('');
  };

  return (
    <header
      className={`sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/80 h-16 px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-3 shadow-xs ${className}`}
      dir={isUr ? 'rtl' : 'ltr'}
    >
      {/* 1. BRAND LOGO */}
      <div className="flex items-center gap-3 shrink-0">
        <Link href="/live" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#FF1A6C] via-purple-600 to-[#00E5FF] p-[2px] shadow-sm group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center font-black text-base text-transparent bg-clip-text bg-gradient-to-tr from-[#FF1A6C] to-amber-500">
              P
            </div>
          </div>
          <span className="font-extrabold text-lg sm:text-xl tracking-tight text-gray-900 flex items-center gap-1">
            Popo <span className="text-[#FF1A6C]">Live</span>
          </span>
        </Link>
      </div>

      {/* 2. CENTER SEARCH CONTROL (Desktop & Tablet) */}
      <div className="flex-1 max-w-md mx-2 sm:mx-4 hidden md:block">
        <div className="relative">
          <Search
            className={`absolute ${
              isUr ? 'right-3.5' : 'left-3.5'
            } top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`}
          />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              if (onSearchChange) onSearchChange(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              isUr
                ? 'اسٹریمرز، لائیو رومز یا آئی ڈی تلاش کریں...'
                : 'Search streamers, live rooms, user ID...'
            }
            className={`w-full ${
              isUr ? 'pr-10 pl-9' : 'pl-10 pr-9'
            } py-2 bg-gray-100 hover:bg-gray-200/60 focus:bg-white text-sm text-gray-900 placeholder-gray-400 border border-transparent focus:border-[#FF1A6C] focus:ring-2 focus:ring-pink-100 rounded-full outline-none transition-all`}
          />
          {localSearch && (
            <button
              type="button"
              onClick={handleClearSearch}
              className={`absolute ${
                isUr ? 'left-3' : 'right-3'
              } top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700`}
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. RIGHT ACTIONS: GET COINS, GET THE APP, DESKTOP ICON, USER AVATAR */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Search Trigger Button */}
        <button
          type="button"
          onClick={() => setShowMobileSearch(!showMobileSearch)}
          className="md:hidden w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Action: Get Coins */}
        <Link
          href="/recharge"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 border border-amber-200/80 text-amber-800 text-xs font-bold shadow-xs transition-all"
          title="Top up coins"
        >
          <Coins className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
          <span className="hidden sm:inline">{isUr ? 'کوائنز لیں' : 'Get Coins'}</span>
          <span className="font-extrabold text-amber-900">{coinBalance.toLocaleString()}</span>
        </Link>

        {/* Action: Get the App */}
        <button
          type="button"
          onClick={onOpenAppModal}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100 border border-pink-200/80 text-[#FF1A6C] text-xs font-bold shadow-xs transition-all"
        >
          <Download className="w-3.5 h-3.5 text-[#FF1A6C]" />
          <span>{isUr ? 'ایپ حاصل کریں' : 'Get the App'}</span>
        </button>

        {/* Action: Desktop Icon */}
        <button
          type="button"
          onClick={onOpenDesktopModal || onOpenAppModal}
          className="hidden sm:flex w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 items-center justify-center transition-colors"
          title="Popo Live Desktop Client"
          aria-label="Desktop App"
        >
          <Monitor className="w-4 h-4 text-gray-700" />
        </button>

        {/* Language Toggle */}
        {onToggleLang && (
          <button
            type="button"
            onClick={onToggleLang}
            className="px-2.5 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-[11px] font-bold text-gray-700 transition-colors border border-gray-200/60"
            title="Toggle language"
          >
            {isUr ? 'English' : 'اردو'}
          </button>
        )}

        {/* User Avatar with VIP Badge & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-1.5 p-0.5 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
            aria-expanded={showUserDropdown}
            aria-label="User Profile Menu"
          >
            <div className="relative">
              <img
                src={user.avatarUrl}
                alt={user.nickname}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-[#FF1A6C]/50"
              />
              {/* Online Green Indicator */}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>

            {/* Nickname & VIP badge on desktop */}
            <div className="hidden lg:flex items-center gap-1.5 pl-1">
              <span className="text-xs font-bold text-gray-800 max-w-[85px] truncate">
                {user.nickname}
              </span>
              <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-2xs">
                VIP {user.vipLevel}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </div>
          </button>

          {/* User Dropdown Menu */}
          {showUserDropdown && (
            <div
              className={`absolute ${
                isUr ? 'left-0' : 'right-0'
              } mt-2 w-64 rounded-2xl bg-white border border-gray-200 shadow-2xl p-2 z-50 text-xs space-y-1 animate-in fade-in slide-in-from-top-2 duration-150`}
            >
              {/* Profile Card Header */}
              <div className="p-3 bg-gradient-to-br from-pink-50/50 to-purple-50/30 rounded-xl border border-pink-100/60 mb-1">
                <div className="flex items-center gap-2.5">
                  <img
                    src={user.avatarUrl}
                    alt={user.nickname}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-[#FF1A6C]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-gray-900 truncate">{user.nickname}</p>
                    <p className="text-[10px] text-gray-500">ID: {user.poppoId}</p>
                  </div>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                    VIP {user.vipLevel}
                  </span>
                </div>
                <div className="mt-2.5 pt-2 border-t border-pink-100 flex items-center justify-between text-[11px]">
                  <span className="text-gray-500">{isUr ? 'سکے بیلنس' : 'Coin Balance'}:</span>
                  <span className="font-extrabold text-amber-600 flex items-center gap-1">
                    <Coins className="w-3 h-3" />
                    {coinBalance.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Menu Links */}
              <Link
                href="/profile"
                onClick={() => setShowUserDropdown(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors font-medium"
              >
                <User className="w-4 h-4 text-[#FF1A6C]" />
                <span>{isUr ? 'میری پروفائل' : 'My Profile'}</span>
              </Link>

              <Link
                href="/recharge"
                onClick={() => setShowUserDropdown(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors font-medium"
              >
                <Coins className="w-4 h-4 text-amber-500" />
                <span>{isUr ? 'کوائنز ریچارج' : 'Recharge Coins'}</span>
              </Link>

              <Link
                href="/help"
                onClick={() => setShowUserDropdown(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors font-medium"
              >
                <HelpCircle className="w-4 h-4 text-blue-500" />
                <span>{isUr ? 'ہیلپ سینٹر' : 'Help Center'}</span>
              </Link>

              <Link
                href="/settings"
                onClick={() => setShowUserDropdown(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors font-medium"
              >
                <Settings className="w-4 h-4 text-purple-500" />
                <span>{isUr ? 'سیٹنگز' : 'Settings'}</span>
              </Link>

              <div className="pt-1 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserDropdown(false);
                    router.push('/login');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors font-bold text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{isUr ? 'لاگ آؤٹ' : 'Log Out'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. EXPANDABLE MOBILE SEARCH BAR */}
      {showMobileSearch && (
        <div className="absolute top-16 inset-x-0 bg-white border-b border-gray-200 p-3 shadow-md md:hidden z-50">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              autoFocus
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                if (onSearchChange) onSearchChange(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setShowMobileSearch(false);
                  handleKeyDown(e);
                }
              }}
              placeholder="Search streamers, rooms, ID..."
              className="w-full pl-10 pr-9 py-2 bg-gray-100 text-sm text-gray-900 rounded-full border border-gray-200 outline-none focus:border-[#FF1A6C]"
            />
            <button
              type="button"
              onClick={() => setShowMobileSearch(false)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default WebTopNav;
