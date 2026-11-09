'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  PartyTheme,
  CANONICAL_PARTY_THEMES,
  getPartyThemeById,
} from '@/lib/party';

export interface PartyThemesScreenProps {
  roomId?: string;
  isHost?: boolean;
  initialThemeId?: string;
  onThemeApplied?: (theme: PartyTheme) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export default function PartyThemesScreen({
  roomId = '7001',
  isHost = true,
  initialThemeId = 'default',
  onThemeApplied,
  onClose,
  isModal = false,
}: PartyThemesScreenProps) {
  const router = useRouter();

  // State
  const [themes, setThemes] = useState<PartyTheme[]>(CANONICAL_PARTY_THEMES);
  const [selectedThemeId, setSelectedThemeId] = useState<string>(initialThemeId);
  const [activeThemeId, setActiveThemeId] = useState<string>(initialThemeId);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showExtendedThemes, setShowExtendedThemes] = useState<boolean>(false);

  // Load available themes and active theme from backend
  useEffect(() => {
    let isMounted = true;

    async function loadThemeData() {
      try {
        // 1. Fetch available themes
        const themesRes = await fetch('/api/party/themes');
        if (themesRes.ok) {
          const themesData = await themesRes.json();
          if (themesData.success && Array.isArray(themesData.themes)) {
            if (isMounted) setThemes(themesData.themes);
          }
        }

        // 2. Fetch current active theme for this room
        const activeRes = await fetch(`/api/party/${roomId}/theme`);
        if (activeRes.ok) {
          const activeData = await activeRes.json();
          if (activeData.success && activeData.activeThemeId) {
            if (isMounted) {
              setActiveThemeId(activeData.activeThemeId);
              setSelectedThemeId(activeData.activeThemeId);
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch remote theme data, using canonical defaults:', err);
      }
    }

    loadThemeData();
    return () => {
      isMounted = false;
    };
  }, [roomId]);

  const selectedTheme = themes.find((t) => t.id === selectedThemeId) || getPartyThemeById(selectedThemeId);

  // Show Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handle Theme Selection (Preview immediately without saving)
  const handleSelectTheme = (themeId: string) => {
    setSelectedThemeId(themeId);
    setErrorMessage(null);
  };

  // Handle Apply Theme (Backend validation + persistence)
  const handleApplyTheme = async () => {
    setIsApplying(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/party/${roomId}/theme/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          themeId: selectedThemeId,
          userId: isHost ? 'host_maria' : 'guest_viewer',
          isHostAction: isHost,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to apply theme.');
        showToast(data.error || 'Failed to apply theme');
        setIsApplying(false);
        return;
      }

      setActiveThemeId(data.activeThemeId);
      showToast(`🎉 Theme "${data.theme.name}" applied successfully!`);

      if (onThemeApplied) {
        onThemeApplied(data.theme);
      }

      // If in modal mode, close after brief delay
      if (isModal && onClose) {
        setTimeout(() => onClose(), 800);
      }
    } catch (err: any) {
      console.error('Error applying theme:', err);
      setErrorMessage('Network error while applying theme.');
      showToast('Network error while applying theme.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      router.push(`/party/room/${roomId}?preview=demo`);
    }
  };

  // Primary 6 canonical themes displayed in 05_06_themes.png
  const canonicalSix = themes.slice(0, 6);
  const extendedOptions = themes.slice(6);

  return (
    <div
      className={`relative min-h-screen text-white flex flex-col justify-between overflow-x-hidden ${
        isModal ? 'bg-transparent' : 'bg-[#0B081E]'
      }`}
      style={{
        background: isModal
          ? undefined
          : 'linear-gradient(180deg, #0B081E 0%, #150F38 45%, #0B081E 100%)',
      }}
      data-testid="party-themes-screen"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-[#1F1938]/95 border border-[#8B5CF6] text-white text-xs px-4 py-2.5 rounded-full shadow-lg backdrop-blur-md flex items-center gap-2 animate-fade-in"
          data-testid="theme-toast"
        >
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container - Standard Mobile Viewport matching 05_06 reference */}
      <div className="w-full max-w-[420px] mx-auto flex-1 flex flex-col px-4 pt-2 pb-6">
        {/* Top Status Bar (9:41, Cellular, WiFi, Battery) */}
        {!isModal && (
          <div className="flex items-center justify-between text-xs text-white/90 font-medium py-1 px-1">
            <span className="tracking-tight font-semibold">9:41</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px]">📶</span>
              <span className="text-[11px]">⚡</span>
              <span className="text-[11px]">🔋</span>
            </div>
          </div>
        )}

        {/* Top App Header (Back, Popo Live Logo, Cast Icon) */}
        {!isModal && (
          <div className="flex items-center justify-between py-2.5">
            <button
              onClick={handleBack}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              data-action="back"
              aria-label="Back"
            >
              <span className="text-lg leading-none font-light">‹</span>
            </button>

            {/* Glowing Popo Live Logo */}
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#9333EA] to-[#C084FC] flex items-center justify-center shadow-md shadow-[#9333EA]/40">
                <span className="text-white font-extrabold text-sm tracking-tight">P</span>
              </div>
              <span className="font-bold text-base tracking-wide bg-gradient-to-r from-white via-white/95 to-white/80 bg-clip-text text-transparent">
                Popo Live
              </span>
            </div>

            {/* Headphone / Cast Icon */}
            <button
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 transition-colors"
              data-action="cast"
              aria-label="Audio Cast"
            >
              <span className="text-sm">🎧</span>
            </button>
          </div>
        )}

        {/* Subheader: Party Themes Title Row */}
        <div className="flex items-center justify-between pt-2 pb-4">
          <button
            onClick={handleBack}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-white/80"
            data-action="back-themes"
            aria-label="Back to Party Room"
          >
            <span className="text-xl leading-none">‹</span>
          </button>
          <h1
            className="text-lg font-bold text-white tracking-wide text-center flex-1 pr-8"
            data-testid="heading-party-themes"
          >
            Party Themes
          </h1>
        </div>

        {/* Selected Theme Live Preview Card */}
        <div
          className="mb-4 p-3 rounded-2xl border border-white/10 transition-all duration-300 backdrop-blur-md relative overflow-hidden"
          style={{
            background: selectedTheme.backgroundGradient,
            boxShadow: `0 8px 24px ${selectedTheme.accentColor}25`,
          }}
          data-testid="selected-theme-preview"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full animate-pulse"
                style={{ backgroundColor: selectedTheme.accentColor }}
              />
              <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                Live Preview
              </span>
            </div>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: `${selectedTheme.accentColor}33`,
                color: selectedTheme.accentColor,
              }}
            >
              {selectedTheme.id === activeThemeId ? '● Active in Room' : 'Previewing'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="w-14 h-11 rounded-xl overflow-hidden relative border flex-shrink-0"
              style={{ borderColor: selectedTheme.accentColor }}
            >
              <Image
                src={selectedTheme.thumbnailUrl}
                alt={selectedTheme.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white truncate">{selectedTheme.name}</h3>
              <p className="text-[11px] text-white/70 line-clamp-1">{selectedTheme.description}</p>
            </div>
          </div>
        </div>

        {/* Themes Grid - Exactly 3 columns matching 05_06_themes.png */}
        <div
          className="grid grid-cols-3 gap-2.5 my-auto"
          data-testid="themes-grid"
        >
          {canonicalSix.map((theme) => {
            const isSelected = selectedThemeId === theme.id;
            const isActive = activeThemeId === theme.id;

            return (
              <button
                key={theme.id}
                onClick={() => handleSelectTheme(theme.id)}
                className={`flex flex-col items-center group relative rounded-2xl p-1.5 transition-all duration-200 outline-none ${
                  isSelected
                    ? 'border-2 ring-2 scale-[1.02]'
                    : 'border border-white/5 hover:border-white/20 hover:scale-[1.01]'
                }`}
                style={{
                  borderColor: isSelected ? '#A855F7' : 'rgba(255, 255, 255, 0.08)',
                  backgroundColor: isSelected ? 'rgba(168, 85, 247, 0.15)' : 'rgba(20, 16, 42, 0.6)',
                  boxShadow: isSelected ? '0 0 16px rgba(168, 85, 247, 0.45)' : 'none',
                }}
                data-testid={`theme-card-${theme.id}`}
                data-selected={isSelected ? 'true' : 'false'}
                data-active={isActive ? 'true' : 'false'}
              >
                {/* Thumbnail Container */}
                <div className="w-full aspect-[71/56] rounded-xl overflow-hidden relative bg-[#130E2E] flex items-center justify-center">
                  <Image
                    src={theme.thumbnailUrl}
                    alt={theme.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    unoptimized
                  />

                  {/* Selected Purple Checkmark Badge in bottom-right corner */}
                  {isSelected && (
                    <div
                      className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-gradient-to-tr from-[#9333EA] to-[#C084FC] flex items-center justify-center shadow-md shadow-[#9333EA]/60 z-10"
                      data-testid={`theme-check-${theme.id}`}
                    >
                      <span className="text-[9px] font-bold text-white">✓</span>
                    </div>
                  )}

                  {/* Active Indicator if currently live in room */}
                  {isActive && !isSelected && (
                    <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 shadow-sm" />
                  )}
                </div>

                {/* Theme Name Label */}
                <span
                  className={`mt-1.5 text-xs font-semibold tracking-wide transition-colors ${
                    isSelected ? 'text-white font-bold' : 'text-white/80 group-hover:text-white'
                  }`}
                  data-testid={`theme-name-${theme.id}`}
                >
                  {theme.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Extended Themes Drawer / Toggle */}
        {extendedOptions.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowExtendedThemes(!showExtendedThemes)}
              className="w-full flex items-center justify-between py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/70 hover:text-white transition-colors"
            >
              <span>More Themes ({extendedOptions.length})</span>
              <span>{showExtendedThemes ? '▲' : '▼'}</span>
            </button>

            {showExtendedThemes && (
              <div className="grid grid-cols-3 gap-2.5 mt-2 animate-fade-in">
                {extendedOptions.map((theme) => {
                  const isSelected = selectedThemeId === theme.id;
                  const isActive = activeThemeId === theme.id;

                  return (
                    <button
                      key={theme.id}
                      onClick={() => handleSelectTheme(theme.id)}
                      className={`flex flex-col items-center group relative rounded-2xl p-1.5 transition-all outline-none ${
                        isSelected
                          ? 'border-2 ring-2 scale-[1.02]'
                          : 'border border-white/5 hover:border-white/20'
                      }`}
                      style={{
                        borderColor: isSelected ? theme.accentColor : 'rgba(255, 255, 255, 0.08)',
                        backgroundColor: isSelected ? `${theme.accentColor}25` : 'rgba(20, 16, 42, 0.6)',
                      }}
                      data-testid={`theme-card-${theme.id}`}
                    >
                      <div className="w-full aspect-[71/56] rounded-xl overflow-hidden relative bg-[#130E2E]">
                        <Image
                          src={theme.thumbnailUrl}
                          alt={theme.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        {isSelected && (
                          <div
                            className="absolute bottom-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold shadow-md"
                            style={{ backgroundColor: theme.accentColor }}
                          >
                            ✓
                          </div>
                        )}
                      </div>
                      <span className="mt-1.5 text-xs font-semibold text-white/80 truncate w-full text-center">
                        {theme.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="mt-3 p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs text-center">
            {errorMessage}
          </div>
        )}

        {/* Bottom Action Button: Apply Theme */}
        <div className="pt-6 pb-2">
          <button
            onClick={handleApplyTheme}
            disabled={isApplying}
            className="w-full py-3.5 rounded-full font-bold text-sm tracking-wide text-white transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)',
              boxShadow: '0 8px 24px rgba(147, 51, 234, 0.45)',
            }}
            data-testid="btn-apply-theme"
          >
            {isApplying ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Applying Theme...</span>
              </>
            ) : (
              <span>Apply Theme</span>
            )}
          </button>
        </div>

        {/* Footer Reference Banner: 05_06 Themes */}
        <div
          className="text-center pt-2 text-xs font-semibold text-white/60 tracking-wider"
          data-testid="footer-reference-themes"
        >
          05_06 Themes
        </div>
      </div>
    </div>
  );
}
