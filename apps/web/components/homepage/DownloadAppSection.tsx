'use client';

import React from 'react';
import { content } from './content';
import { Smartphone, QrCode, ShieldCheck, CheckCircle2 } from 'lucide-react';

export interface DownloadAppSectionProps {
  lang: 'en' | 'ur';
}

export const DownloadAppSection: React.FC<DownloadAppSectionProps> = ({ lang }) => {
  const t = content[lang].download;
  const isUr = lang === 'ur';

  return (
    <section id="download" className="py-20 relative bg-popo-dark-900 border-t border-white/5 overflow-hidden">
      {/* Background radial accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-popo-pink/15 via-purple-600/10 to-popo-cyan/15 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="rounded-3xl bg-gradient-to-br from-popo-dark-850 via-popo-dark-900 to-popo-dark-950 border border-white/10 p-8 sm:p-12 lg:p-16 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Text & Store Badges */}
            <div className={`lg:col-span-7 flex flex-col gap-6 ${isUr ? 'text-right' : 'text-left'}`}>
              <div className={`inline-flex items-center gap-2 ${isUr ? 'self-end' : 'self-start'}`}>
                <span className="text-xs font-bold uppercase tracking-widest text-popo-pink flex items-center gap-1.5 px-3 py-1 rounded-full bg-popo-pink/10 border border-popo-pink/20">
                  <Smartphone className="w-3.5 h-3.5" />
                  {t.tag}
                </span>
              </div>

              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                {t.title}
              </h2>

              <p className="text-sm sm:text-base text-popo-text-secondary leading-relaxed max-w-xl">
                {t.subtitle}
              </p>

              {/* Official Store Buttons */}
              <div className={`flex flex-wrap items-center gap-4 pt-2 ${isUr ? 'justify-end' : 'justify-start'}`}>
                {/* Google Play Store Badge */}
                <a
                  href="/download#android-section"
                  className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-black/60 hover:bg-black/80 border border-white/15 hover:border-white/30 text-white transition-all select-none group shadow-lg"
                >
                  <svg className="w-7 h-7 shrink-0 transition-transform group-hover:scale-105" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M3.609 1.814L13.792 12 3.61 22.186c-.367-.344-.61-.83-.61-1.393V3.207c0-.563.243-1.049.61-1.393z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M17.158 8.634l-3.366 3.366 3.366 3.366 3.793-2.189c1.082-.624 1.082-1.729 0-2.354l-3.793-2.189z"
                    />
                    <path
                      fill="#4285F4"
                      d="M3.609 1.814l10.183 10.186 3.366-3.366L6.505.31c-.933-.538-2.029-.25-2.896.504z"
                    />
                    <path
                      fill="#34A853"
                      d="M3.609 22.186l13.549-7.81-3.366-3.366L3.609 22.186z"
                    />
                  </svg>
                  <div className="text-left flex flex-col">
                    <span className="text-[10px] text-popo-text-muted uppercase tracking-wider leading-none">
                      GET IT ON
                    </span>
                    <span className="text-sm font-bold text-white leading-tight">
                      Google Play
                    </span>
                  </div>
                </a>

                {/* Apple App Store Badge */}
                <a
                  href="/download#ios-section"
                  className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-black/60 hover:bg-black/80 border border-white/15 hover:border-white/30 text-white transition-all select-none group shadow-lg"
                >
                  <svg className="w-7 h-7 fill-white shrink-0 transition-transform group-hover:scale-105" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.47c.64-.78 1.08-1.87.96-2.97-1 .04-2.14.64-2.81 1.42-.58.68-1.09 1.78-.96 2.85 1.12.09 2.19-.55 2.81-1.3" />
                  </svg>
                  <div className="text-left flex flex-col">
                    <span className="text-[10px] text-popo-text-muted uppercase tracking-wider leading-none">
                      Download on the
                    </span>
                    <span className="text-sm font-bold text-white leading-tight">
                      App Store
                    </span>
                  </div>
                </a>
              </div>

              {/* Age & Store Safety Footnote */}
              <div className={`flex items-center gap-2 text-xs text-popo-text-muted pt-2 ${isUr ? 'justify-end' : 'justify-start'}`}>
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{t.ageRule}</span>
              </div>
            </div>

            {/* Right Column: QR Code & Mobile Mockup Preview */}
            <div className="lg:col-span-5 flex flex-col sm:flex-row items-center justify-center gap-6">
              {/* QR Code Container */}
              <div className="p-5 rounded-2xl bg-white text-black flex flex-col items-center text-center shadow-2xl">
                <div className="w-32 h-32 sm:w-36 sm:h-36 bg-neutral-900 rounded-xl p-2 flex items-center justify-center">
                  {/* Stylized QR Vector Graphic */}
                  <div className="w-full h-full bg-white p-2 rounded-lg grid grid-cols-6 grid-rows-6 gap-1">
                    <div className="col-span-2 row-span-2 bg-black rounded-sm" />
                    <div className="col-span-2 row-span-1 bg-black rounded-sm" />
                    <div className="col-span-2 row-span-2 bg-black rounded-sm" />
                    <div className="col-span-1 row-span-2 bg-black rounded-sm" />
                    <div className="col-span-2 row-span-2 bg-popo-pink rounded-sm" />
                    <div className="col-span-1 row-span-2 bg-black rounded-sm" />
                    <div className="col-span-2 row-span-2 bg-black rounded-sm" />
                    <div className="col-span-2 row-span-1 bg-black rounded-sm" />
                    <div className="col-span-2 row-span-2 bg-black rounded-sm" />
                  </div>
                </div>
                <span className="text-[11px] font-bold text-neutral-800 mt-3 max-w-[140px] leading-snug">
                  Scan to Install on Android & iOS
                </span>
              </div>

              {/* Quick Spec Pill List */}
              <div className="flex flex-col gap-2.5 text-xs text-popo-text-secondary">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-popo-cyan shrink-0" />
                  <span>Supports Android 8.0+ & iOS 14+</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-popo-cyan shrink-0" />
                  <span>Ultra-Low Latency Live Streaming</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-popo-cyan shrink-0" />
                  <span>9-Seat Voice Party Rooms</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-popo-cyan shrink-0" />
                  <span>English & Urdu Dual Language</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
