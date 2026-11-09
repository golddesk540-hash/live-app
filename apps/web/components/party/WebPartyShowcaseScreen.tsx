'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Globe, Copy, Check, ExternalLink, Sparkles } from 'lucide-react';

export interface WebPartyShowcaseScreenProps {
  roomId?: string;
}

export default function WebPartyShowcaseScreen({
  roomId = '7001',
}: WebPartyShowcaseScreenProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const displayUrl = 'live.popolive.com/party';
  const fullWebUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/party/web/${roomId}`
    : `https://kigolive.com/party/web/${roomId}`;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyUrl = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(fullWebUrl);
      }
      setCopied(true);
      showToast('🎉 Web Party link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      showToast('Link copied: ' + displayUrl);
    }
  };

  return (
    <div
      className="min-h-screen text-white flex flex-col justify-between overflow-x-hidden font-sans relative select-none"
      style={{
        background: 'linear-gradient(180deg, #09061c 0%, #170d38 45%, #0a0620 100%)',
      }}
      data-testid="web-party-showcase-screen"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-[#1F1938]/95 border border-[#8B5CF6] text-white text-xs px-4 py-2.5 rounded-full shadow-lg backdrop-blur-md flex items-center gap-2 animate-fade-in"
          data-testid="showcase-toast"
        >
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container - Mobile Frame matching 05_07_web_party.png */}
      <div className="w-full max-w-[420px] mx-auto flex-1 flex flex-col justify-between px-4 pt-3 pb-6 relative z-10">
        {/* Top Status Bar (9:41, Cellular, Flash, Battery) */}
        <div>
          <div className="flex items-center justify-between text-xs text-white/90 font-medium py-1 px-1">
            <span className="tracking-tight font-semibold">9:41</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px]">📶</span>
              <span className="text-[11px]">⚡</span>
              <span className="text-[11px]">🔋</span>
            </div>
          </div>

          {/* Top Header Row with Back Chevron */}
          <div className="pt-2 pb-1 flex items-center">
            <button
              onClick={() => router.push(`/party/room/${roomId}?preview=demo`)}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-white/90"
              data-action="back"
              aria-label="Back"
            >
              <span className="text-xl leading-none">‹</span>
            </button>
          </div>
        </div>

        {/* Hero Device Graphic (Laptop + Smartphone Cross-Platform Mockup) */}
        <div className="my-auto flex flex-col items-center">
          <div className="w-full max-w-[340px] aspect-[285/225] relative mx-auto drop-shadow-[0_15px_30px_rgba(147,51,234,0.35)]">
            <Image
              src="/assets/party/web_party_devices_hero.png"
              alt="Web Party on Laptop and Smartphone"
              fill
              priority
              className="object-contain"
              unoptimized
            />
          </div>

          {/* Glowing Purple Globe Icon */}
          <div className="mt-4 flex flex-col items-center">
            <div
              className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#7C3AED] via-[#9333EA] to-[#C084FC] p-[1.5px] shadow-lg shadow-[#9333EA]/50 animate-pulse"
              data-testid="globe-icon"
            >
              <div className="w-full h-full rounded-full bg-[#180e38] flex items-center justify-center">
                <Globe className="w-5 h-5 text-[#C084FC]" />
              </div>
            </div>

            {/* Popo Live Badge + "Join on Web" Title */}
            <div
              className="mt-3 flex items-center gap-2"
              data-testid="join-on-web-title"
            >
              <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-[#9333EA] to-[#C084FC] flex items-center justify-center shadow-md shadow-[#9333EA]/40">
                <span className="text-white font-extrabold text-[11px]">P</span>
              </div>
              <h1 className="text-base font-bold text-white tracking-wide">
                Join on Web
              </h1>
            </div>
          </div>

          {/* URL Pill Capsule (live.popolive.com/party) */}
          <div className="w-full max-w-[340px] mt-4">
            <div
              className="flex items-center justify-between px-4 py-3 rounded-2xl border border-[#8B5CF6]/40 bg-[#161033]/90 shadow-xl backdrop-blur-md transition-all hover:border-[#8B5CF6]/70 group cursor-pointer"
              onClick={handleCopyUrl}
              data-testid="web-party-url-capsule"
            >
              <span
                className="text-xs sm:text-sm font-medium text-white/90 tracking-wide font-mono select-all truncate"
                data-testid="web-party-url"
              >
                {displayUrl}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyUrl();
                }}
                className="w-7 h-7 rounded-lg bg-white/10 group-hover:bg-white/20 flex items-center justify-center text-white/80 transition-colors ml-2 flex-shrink-0"
                data-action="copy-url"
                aria-label="Copy Web Party Link"
                title="Copy Link"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-white/90" />
                )}
              </button>
            </div>
          </div>

          {/* Launch Web Party Button */}
          <div className="w-full max-w-[340px] mt-4">
            <Link
              href={`/party/web/${roomId}`}
              data-action="launch-web-party"
              className="w-full py-3.5 rounded-full font-bold text-sm tracking-wide text-white transition-all transform active:scale-95 shadow-xl flex items-center justify-center gap-2 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)',
                boxShadow: '0 8px 24px rgba(147, 51, 234, 0.45)',
              }}
            >
              <span>Launch Web Party</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Footer Reference Banner: 05_07 Web Party */}
        <div
          className="text-center pt-2 text-xs font-semibold text-white/60 tracking-wider"
          data-testid="footer-reference-web-party"
        >
          05_07 Web Party
        </div>
      </div>
    </div>
  );
}
