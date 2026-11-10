'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Sparkles, Globe, ArrowLeft, Check, Users, Flame, Heart } from 'lucide-react';
import { PKBattleResult } from '@/lib/pk';

interface PKResultScreenProps {
  battleId?: string;
  resultData?: PKBattleResult | null;
  onClose?: () => void;
  initialLanguage?: 'en' | 'ur';
}

export default function PKResultScreen({
  battleId = '00000000-0000-0000-0000-000000000604',
  resultData: initialResultData,
  onClose,
  initialLanguage = 'en',
}: PKResultScreenProps) {
  const [lang, setLang] = useState<'en' | 'ur'>(initialLanguage);
  const [result, setResult] = useState<PKBattleResult | null>(initialResultData || null);
  const [loading, setLoading] = useState(!initialResultData);

  const isRtl = lang === 'ur';

  useEffect(() => {
    if (!initialResultData) {
      fetch(`/api/pk/battle/${battleId}/result`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.result) {
            setResult(data.result);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [battleId, initialResultData]);

  // Fallback Canonical Result (matching 06_04_result.png)
  const currentResult: PKBattleResult = result || {
    id: 'canonical-0604',
    battleId,
    battleType: '1v1',
    hostAId: '00000000-0000-0000-0000-000000088201',
    hostANickname: 'Sara Live',
    hostAAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    hostAScore: 24860,
    hostBId: '00000000-0000-0000-0000-000000088202',
    hostBNickname: 'Ayesha',
    hostBAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
    hostBScore: 18320,
    resultType: 'winner_declared',
    winnerHostId: '00000000-0000-0000-0000-000000088201',
    winnerNickname: 'Sara Live',
    winnerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    winnerScore: 24860,
    loserHostId: '00000000-0000-0000-0000-000000088202',
    loserNickname: 'Ayesha',
    loserAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
    loserScore: 18320,
    scoreDiff: 6540,
    durationSeconds: 300,
    startedAt: new Date(Date.now() - 300000).toISOString(),
    endedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  const isDraw = currentResult.resultType === 'draw';
  const winnerScoreFormatted = (currentResult.winnerScore ?? currentResult.hostAScore).toLocaleString();
  const loserScoreFormatted = (currentResult.loserScore ?? currentResult.hostBScore).toLocaleString();

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="relative w-full max-w-md mx-auto min-h-screen bg-[#0d081e] text-white flex flex-col justify-between overflow-hidden shadow-2xl font-sans select-none border-x border-[#231b3d]"
    >
      {/* Background Glow Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1c0f38] via-[#0d081e] to-[#070412] pointer-events-none" />

      {/* TOP HEADER */}
      <div className="relative z-30 pt-6 pb-2 px-5 flex items-center justify-between">
        {onClose ? (
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-5" />
        )}

        <h1 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-md">
          {isRtl ? 'پی کے نتیجہ' : 'PK Result'}
        </h1>

        {/* Language Switcher */}
        <button
          onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
          className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 flex items-center gap-1 shadow-sm"
          title="Toggle Language"
        >
          <Globe className="w-3.5 h-3.5 text-[#ff2d78]" />
          <span>{lang === 'en' ? 'اردو' : 'EN'}</span>
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-6 py-4">
        {!isDraw ? (
          /* WINNER VIEW (Exact match to 06_04_result.png) */
          <div className="relative flex flex-col items-center animate-fade-in w-full">
            {/* Radiant Sunburst Glow Behind Avatar */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-gradient-to-tr from-[#9333ea]/30 via-[#f59e0b]/20 to-transparent blur-2xl pointer-events-none" />

            {/* Winner Trophy / Laurel Crown Container */}
            <div className="relative mb-3 flex items-center justify-center">
              {/* Crown Icon Above Avatar */}
              <div className="absolute -top-7 z-30 drop-shadow-[0_4px_12px_rgba(245,158,11,0.8)] animate-bounce-subtle">
                <div className="relative">
                  {/* SVG Crown matching reference */}
                  <svg className="w-12 h-10 text-[#f59e0b]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                  </svg>
                  {/* Gem highlights */}
                  <div className="absolute top-2 left-1.5 w-1.5 h-1.5 rounded-full bg-cyan-300" />
                  <div className="absolute top-1 left-5 w-2 h-2 rounded-full bg-red-400" />
                  <div className="absolute top-2 right-1.5 w-1.5 h-1.5 rounded-full bg-cyan-300" />
                </div>
              </div>

              {/* Laurel Wreath Wings (SVG hugging left and right) */}
              <div className="absolute -inset-x-8 -inset-y-4 pointer-events-none flex justify-between items-center z-10">
                {/* Left Laurel Branch */}
                <svg className="w-12 h-24 text-[#f59e0b] drop-shadow-md" viewBox="0 0 40 80" fill="currentColor">
                  <path d="M35 10 C 20 25, 10 50, 20 75 C 22 70, 20 55, 30 35 C 32 30, 36 20, 35 10 Z" opacity="0.9" />
                  <circle cx="28" cy="18" r="3" />
                  <circle cx="22" cy="30" r="3.5" />
                  <circle cx="18" cy="45" r="3.5" />
                  <circle cx="20" cy="60" r="3" />
                </svg>
                {/* Right Laurel Branch */}
                <svg className="w-12 h-24 text-[#f59e0b] drop-shadow-md transform scale-x-[-1]" viewBox="0 0 40 80" fill="currentColor">
                  <path d="M35 10 C 20 25, 10 50, 20 75 C 22 70, 20 55, 30 35 C 32 30, 36 20, 35 10 Z" opacity="0.9" />
                  <circle cx="28" cy="18" r="3" />
                  <circle cx="22" cy="30" r="3.5" />
                  <circle cx="18" cy="45" r="3.5" />
                  <circle cx="20" cy="60" r="3" />
                </svg>
              </div>

              {/* Circular Avatar of Winner */}
              <div className="relative z-20 rounded-full p-1 bg-gradient-to-b from-[#fcd34d] via-[#f59e0b] to-[#b45309] shadow-[0_0_35px_rgba(245,158,11,0.5)]">
                <img
                  src={currentResult.winnerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500'}
                  alt={currentResult.winnerNickname || 'Winner'}
                  className="w-36 h-36 rounded-full object-cover border-4 border-[#ffedd5]"
                />
              </div>

              {/* Golden Folded WINNER Ribbon / Banner (Overlapping bottom of avatar) */}
              <div className="absolute -bottom-4 z-30">
                <div className="relative px-8 py-1.5 bg-gradient-to-r from-[#d97706] via-[#fcd34d] to-[#d97706] rounded-md shadow-lg border border-amber-200">
                  {/* Left ribbon tail */}
                  <div className="absolute -left-2.5 top-1.5 w-3 h-4 bg-[#b45309] -skew-y-12 -z-10 rounded-sm" />
                  {/* Right ribbon tail */}
                  <div className="absolute -right-2.5 top-1.5 w-3 h-4 bg-[#b45309] skew-y-12 -z-10 rounded-sm" />

                  <span className="text-base font-black tracking-widest text-[#1a1325] drop-shadow-sm">
                    {isRtl ? 'فاتح' : 'WINNER'}
                  </span>
                </div>
              </div>
            </div>

            {/* Winner Nickname */}
            <div className="mt-6 text-center">
              <h2 className="text-2xl font-black text-white tracking-tight drop-shadow">
                {isRtl && currentResult.winnerNickname === 'Sara Live' ? 'سارہ لائیو' : currentResult.winnerNickname}
              </h2>
              <div className="flex items-center justify-center gap-1.5 mt-0.5 text-xs text-white/70">
                <span>🇵🇰</span>
                <span>ID: {currentResult.winnerHostId?.slice(-5) || '88201'}</span>
              </div>
            </div>

            {/* Final Scores Comparison (24,860 Vs 18,320) */}
            <div className="mt-8 flex items-center justify-center gap-4 text-white">
              {/* Winner Score */}
              <span className="text-2xl font-black tracking-wide text-white drop-shadow-md">
                {winnerScoreFormatted}
              </span>

              {/* Slanted Stylized Italic Vs */}
              <span className="text-xl italic font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ff2d78] to-[#ff5388] px-2">
                Vs
              </span>

              {/* Loser Score */}
              <span className="text-2xl font-black tracking-wide text-white/90 drop-shadow-md">
                {loserScoreFormatted}
              </span>
            </div>

            {/* Score Difference Badge */}
            <div className="mt-2 text-[11px] font-semibold text-amber-300/80 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              {isRtl
                ? `+${currentResult.scoreDiff.toLocaleString()} پوائنٹس کی سبقت`
                : `+${currentResult.scoreDiff.toLocaleString()} pts lead`}
            </div>
          </div>
        ) : (
          /* DRAW VIEW (Equal Scores) */
          <div className="relative flex flex-col items-center animate-fade-in w-full">
            <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-3 border border-purple-400/40">
              <Trophy className="w-8 h-8 text-purple-300" />
            </div>

            {/* Dual Avatars for Draw */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex flex-col items-center">
                <img
                  src={currentResult.hostAAvatar}
                  alt={currentResult.hostANickname}
                  className="w-20 h-20 rounded-full object-cover border-2 border-purple-400 shadow-lg"
                />
                <span className="text-xs font-bold text-white mt-1.5">{currentResult.hostANickname}</span>
              </div>

              <div className="px-3 py-1 bg-white/10 rounded-full font-black text-xs text-white/70 italic">
                {isRtl ? 'بمقابلہ' : 'VS'}
              </div>

              <div className="flex flex-col items-center">
                <img
                  src={currentResult.hostBAvatar}
                  alt={currentResult.hostBNickname}
                  className="w-20 h-20 rounded-full object-cover border-2 border-purple-400 shadow-lg"
                />
                <span className="text-xs font-bold text-white mt-1.5">{currentResult.hostBNickname}</span>
              </div>
            </div>

            {/* DRAW Banner */}
            <div className="px-8 py-1.5 bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-700 rounded-md shadow-lg border border-purple-300/40">
              <span className="text-base font-black tracking-widest text-white drop-shadow-sm">
                {isRtl ? 'برابری' : 'DRAW'}
              </span>
            </div>

            {/* Equal Final Scores */}
            <div className="mt-6 flex items-center justify-center gap-4 text-white">
              <span className="text-2xl font-black">{currentResult.hostAScore.toLocaleString()}</span>
              <span className="text-lg italic text-[#ff2d78] font-black">Vs</span>
              <span className="text-2xl font-black">{currentResult.hostBScore.toLocaleString()}</span>
            </div>

            <div className="mt-2 text-xs text-white/60">
              {isRtl ? 'دونوں میزبانوں کا اسکور برابر رہا!' : 'Both hosts concluded with equal scores!'}
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM BUTTONS & WATERMARK BADGE */}
      <div className="relative z-30 px-6 pb-6 pt-2 flex flex-col items-center gap-4">
        {/* Neon Pink OK Button */}
        <button
          onClick={onClose || (() => (window.location.href = '/party/room/7001'))}
          className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#e91e63] via-[#ff2d78] to-[#e6005c] hover:brightness-110 active:scale-98 text-white font-black text-base tracking-wider shadow-[0_4px_20px_rgba(255,45,120,0.5)] transition-all flex items-center justify-center"
        >
          <span>{isRtl ? 'ٹھیک ہے' : 'OK'}</span>
        </button>

        {/* 6.4 Result Watermark Pill (Exact match to reference design) */}
        <div className="w-full py-3 rounded-2xl bg-[#8c1b64] text-white text-center font-extrabold text-sm tracking-wide shadow-lg border border-[#a82a7a]/50">
          <span>{isRtl ? '6.4 نتیجہ' : '6.4 Result'}</span>
        </div>
      </div>
    </div>
  );
}
