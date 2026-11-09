'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export type QualityOption = 'auto' | '1080p' | '720p' | '480p';

interface QualityItem {
  id: QualityOption;
  title: string;
  subtitle: string;
  resolution: string;
  fps: number;
  bitrateKbps: number;
  hourlyMb: number;
}

const QUALITY_OPTIONS: QualityItem[] = [
  {
    id: 'auto',
    title: 'Auto (Recommended)',
    subtitle: 'Balance quality and data',
    resolution: '1280x720 (Adaptive)',
    fps: 30,
    bitrateKbps: 2000,
    hourlyMb: 900,
  },
  {
    id: '1080p',
    title: 'HD 1080p',
    subtitle: 'High quality, more data',
    resolution: '1920x1080',
    fps: 30,
    bitrateKbps: 3000,
    hourlyMb: 1350,
  },
  {
    id: '720p',
    title: 'HD 720p',
    subtitle: 'Good quality, less data',
    resolution: '1280x720',
    fps: 30,
    bitrateKbps: 1800,
    hourlyMb: 810,
  },
  {
    id: '480p',
    title: 'SD 480p',
    subtitle: 'Save data, more stable',
    resolution: '854x480',
    fps: 24,
    bitrateKbps: 800,
    hourlyMb: 360,
  },
];

interface QualityCostGuardProps {
  onSaved?: (quality: QualityOption, costGuard: boolean) => void;
  onBack?: () => void;
  initialQuality?: QualityOption;
  initialCostGuard?: boolean;
}

export default function QualityCostGuardScreen({
  onSaved,
  onBack,
  initialQuality = 'auto',
  initialCostGuard = true,
}: QualityCostGuardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId') || '880219';
  const simulateParam = searchParams.get('simulate');

  // Quality selection state matching 04_09_quality_cost_guard.png (Auto selected by default)
  const [selectedQuality, setSelectedQuality] = useState<QualityOption>(initialQuality);
  
  // Data Cost Guard toggle matching 04_09 (ON / green switch by default)
  const [costGuardEnabled, setCostGuardEnabled] = useState<boolean>(initialCostGuard);

  // Telemetry & Network Stats state
  const [networkQuality, setNetworkQuality] = useState<'excellent' | 'good' | 'poor'>('excellent');
  const [rttMs, setRttMs] = useState<number>(24);
  const [packetLoss, setPacketLoss] = useState<string>('0.1%');
  const [activeWarning, setActiveWarning] = useState<string | null>(null);

  // Saving & Feedback state
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch initial stored settings from API
  useEffect(() => {
    let isMounted = true;
    async function loadSettings() {
      try {
        const res = await fetch(`/api/live/quality/settings?roomId=${roomId}&preview=demo`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && data.settings) {
            if (data.settings.preferredQuality) {
              setSelectedQuality(data.settings.preferredQuality);
            }
            if (typeof data.settings.costGuardEnabled === 'boolean') {
              setCostGuardEnabled(data.settings.costGuardEnabled);
            }
          }
        }
      } catch (err) {
        console.warn('Quality settings load notice:', err);
      }
    }
    loadSettings();
    return () => {
      isMounted = false;
    };
  }, [roomId]);

  // Network Telemetry Monitoring (Section 3 of prompt)
  useEffect(() => {
    let isMounted = true;
    async function checkNetwork() {
      try {
        const simQuery = simulateParam ? `&simulate=${encodeURIComponent(simulateParam)}` : '';
        const res = await fetch(`/api/live/quality/network-stats?roomId=${roomId}&preview=demo${simQuery}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && data.telemetry) {
            setNetworkQuality(data.telemetry.networkQuality || 'excellent');
            setRttMs(data.telemetry.rttMs || 24);
            setPacketLoss(data.telemetry.packetLossRate || '0.1%');
            if (data.telemetry.warnings && data.telemetry.warnings.length > 0) {
              setActiveWarning(data.telemetry.warnings[0].message);
            }
          }
        }
      } catch {}
    }
    checkNetwork();
    const interval = setInterval(checkNetwork, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [roomId, simulateParam]);

  const triggerToast = (msg: string) => {
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/live/quality/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferredQuality: selectedQuality,
          costGuardEnabled,
          roomId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        triggerToast('Quality settings saved successfully!');
        if (onSaved) {
          onSaved(selectedQuality, costGuardEnabled);
        } else {
          setTimeout(() => {
            router.push(`/live/room/${roomId}`);
          }, 600);
        }
      } else {
        triggerToast(data.error || 'Failed to save settings');
      }
    } catch {
      triggerToast('Settings applied locally');
      if (onSaved) onSaved(selectedQuality, costGuardEnabled);
    } finally {
      setIsSaving(false);
    }
  };

  const activeProfile = QUALITY_OPTIONS.find((q) => q.id === selectedQuality) || QUALITY_OPTIONS[0];

  return (
    <div className="min-h-screen bg-[#070817] text-white flex flex-col justify-between relative overflow-x-hidden selection:bg-pink-500 selection:text-white">
      {/* Background Gradients & Glows */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#090a23] via-[#070817] to-[#04040d] pointer-events-none" />
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-pink-600/15 via-purple-600/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-0 w-72 h-72 bg-gradient-to-tr from-purple-800/15 to-transparent blur-3xl pointer-events-none" />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#1f2247] border border-pink-500/40 text-white px-4 py-2.5 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Wrapper (Fixed mobile aspect ratio strictly matching 04_09) */}
      <div className="relative z-10 w-full max-w-[360px] sm:max-w-[400px] mx-auto flex-1 flex flex-col justify-between px-5 pt-6 pb-4">
        
        {/* Top Section: Header & Heading */}
        <div>
          {/* Header Row: Back Chevron & Brand */}
          <div className="flex items-center justify-between mb-6">
            <button
              data-action="back"
              type="button"
              onClick={handleBack}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition"
              title="Back"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            {/* Poppo Live Logo */}
            <div className="flex items-center gap-1.5 pr-8">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#ff007f] via-[#7928ca] to-[#0070f3] p-0.5 flex items-center justify-center shadow-md shadow-purple-500/20">
                <div className="w-full h-full bg-[#12082b] rounded-[6px] flex items-center justify-center text-[9px] font-black text-white">
                  Po
                </div>
              </div>
              <span className="text-lg font-extrabold tracking-tight text-white flex items-center">
                Poppo<span className="text-[#ff2a85] ml-0.5">Live</span>
              </span>
            </div>

            <div className="w-8" />
          </div>

          {/* Heading: Live Quality */}
          <h1 className="text-2xl font-black tracking-wide text-white mb-4 text-left">
            Live Quality
          </h1>

          {/* Network Health Indicator Pill */}
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/5 mb-4 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${networkQuality === 'poor' ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
              <span className="text-white/60">Network Status:</span>
              <span className="font-bold text-white capitalize">{networkQuality}</span>
            </div>
            <div className="text-white/40 font-mono">
              {rttMs}ms • {packetLoss} loss
            </div>
          </div>

          {/* Quality Options Group Card (Single rounded navy card matching 04_09) */}
          <div className="bg-[#121533]/85 backdrop-blur-xl rounded-[26px] border border-white/10 shadow-2xl overflow-hidden">
            {QUALITY_OPTIONS.map((opt, idx) => {
              const isSelected = selectedQuality === opt.id;
              const isLast = idx === QUALITY_OPTIONS.length - 1;

              return (
                <div
                  key={opt.id}
                  data-quality={opt.id}
                  onClick={() => setSelectedQuality(opt.id)}
                  className={`relative flex items-center justify-between p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#181b40]/90'
                      : 'hover:bg-white/[0.02]'
                  } ${!isLast ? 'border-b border-white/[0.07]' : ''}`}
                >
                  {/* Left Active Highlight Bar */}
                  {isSelected && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-[#ff1361] to-[#ff2a85]" />
                  )}

                  {/* Left Text */}
                  <div className="pl-1">
                    <h3 className="text-sm font-bold text-white block">
                      {opt.title}
                    </h3>
                    <p className="text-xs text-white/50 block mt-0.5">
                      {opt.subtitle}
                    </p>
                  </div>

                  {/* Right Custom Radio Indicator */}
                  <div className="flex items-center justify-center">
                    {isSelected ? (
                      // Glowing Magenta/Pink Circle with White Center Dot (Exact 04_09 Reference)
                      <div className="w-5 h-5 rounded-full p-[2px] bg-gradient-to-tr from-[#ff1361] to-[#ff2a85] shadow-[0_0_12px_rgba(255,42,133,0.7)] flex items-center justify-center">
                        <div className="w-2 h-2 rounded-[2px] bg-white rotate-45" />
                      </div>
                    ) : (
                      // Unselected Outline Circle
                      <div className="w-5 h-5 rounded-full border-2 border-white/30 transition-colors" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Data Cost Guard Container (Bottom Card matching 04_09) */}
          <div className="bg-[#121533]/85 backdrop-blur-xl rounded-[22px] p-4 border border-white/10 shadow-xl flex items-center justify-between mt-4">
            <div className="pr-3">
              <h3 className="text-sm font-bold text-white block">
                Data Cost Guard
              </h3>
              <p className="text-xs text-white/50 block mt-0.5">
                Auto lower quality on weak network
              </p>
            </div>

            {/* iOS-Style Mint Green Toggle Switch */}
            <button
              data-action="toggle-cost-guard"
              type="button"
              role="switch"
              aria-checked={costGuardEnabled}
              onClick={() => setCostGuardEnabled(!costGuardEnabled)}
              className={`relative w-12 h-7 rounded-full transition-colors duration-300 focus:outline-none ${
                costGuardEnabled ? 'bg-[#10b981]' : 'bg-white/20'
              }`}
            >
              <span
                className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-md transition-transform duration-300 ease-in-out ${
                  costGuardEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Live Estimated Data Usage Snippet */}
          <div className="mt-3 px-3 flex items-center justify-between text-[11px] text-white/40">
            <span>Estimated Data Usage:</span>
            <span className="font-semibold text-white/70">
              ~{activeProfile.hourlyMb} MB / hour ({activeProfile.resolution})
            </span>
          </div>

          {/* Active Network Warning (if any) */}
          {activeWarning && (
            <div className="mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>{activeWarning}</span>
            </div>
          )}
        </div>

        {/* Bottom Save Button */}
        <div className="w-full mt-6 mb-2">
          <button
            data-action="save"
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="w-full py-3.5 sm:py-4 rounded-full bg-[#ff206e] hover:bg-[#ff1165] active:scale-95 text-white font-bold text-sm sm:text-base shadow-lg shadow-pink-500/40 hover:shadow-pink-500/60 transition-all text-center flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save</span>
            )}
          </button>
        </div>
      </div>

      {/* Official Bottom Footer Banner Matching Reference */}
      <footer className="w-full bg-gradient-to-r from-[#170e33] via-[#24134d] to-[#170e33] border-t border-purple-500/20 py-2.5 px-4 text-center z-20">
        <p className="text-xs sm:text-sm font-bold text-white tracking-wide">
          4.9 Quality &amp; Cost Guard
        </p>
      </footer>
    </div>
  );
}
