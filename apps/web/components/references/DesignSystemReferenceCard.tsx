'use client';

import React from 'react';
import { Home, Video, Trophy, MessageCircle, User } from 'lucide-react';

export const DesignSystemReferenceCard: React.FC = () => {
  return (
    <div className="w-full max-w-sm mx-auto rounded-3xl bg-[#0B0E17] border border-[#FF1A6C]/30 p-6 shadow-2xl flex flex-col gap-6 text-white font-sans relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#FF1A6C]/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-[#7038FF]/20 rounded-full blur-2xl pointer-events-none" />

      {/* Brand Identity Header */}
      <div className="flex items-center gap-4 relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF1A6C] to-[#7038FF] p-[2px] shadow-lg shadow-[#FF1A6C]/30 flex-shrink-0">
          <div className="w-full h-full bg-[#0B0E17]/60 backdrop-blur-sm rounded-[14px] flex items-center justify-center relative">
            <span className="text-3xl font-black text-white tracking-tighter">P</span>
            <div className="absolute bottom-3 right-3 w-2.5 h-2.5 bg-white transform rotate-45" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold leading-tight">Popo Live</h2>
          <p className="text-lg font-semibold text-white/90">Design System</p>
        </div>
      </div>

      {/* 1. Color Palette */}
      <div className="flex flex-col gap-2 relative z-10">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">Color Palette</h3>
        <div className="grid grid-cols-5 gap-2">
          {/* Primary */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-full aspect-square rounded-xl bg-[#FF1A6C] shadow-md shadow-[#FF1A6C]/30 border border-white/10" />
            <span className="text-[10px] text-white/80 font-medium truncate w-full text-center">Primary</span>
          </div>
          {/* Secondary */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-full aspect-square rounded-xl bg-[#7038FF] shadow-md shadow-[#7038FF]/30 border border-white/10" />
            <span className="text-[10px] text-white/80 font-medium truncate w-full text-center">Secondary</span>
          </div>
          {/* Background */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-full aspect-square rounded-xl bg-[#0B0E17] border border-white/10" />
            <span className="text-[10px] text-white/80 font-medium truncate w-full text-center">Background</span>
          </div>
          {/* Surface */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-full aspect-square rounded-xl bg-[#131A2B] border border-white/10" />
            <span className="text-[10px] text-white/80 font-medium truncate w-full text-center">Surface</span>
          </div>
          {/* Text */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-full aspect-square rounded-xl bg-white border border-white/10" />
            <span className="text-[10px] text-white/80 font-medium truncate w-full text-center">Text</span>
          </div>
        </div>
      </div>

      {/* 2. Typography */}
      <div className="flex flex-col gap-2 relative z-10">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">Typography</h3>
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-xl bg-[#131A2B] border border-white/5 flex flex-col items-center text-center">
            <span className="text-2xl font-black text-white">Aa</span>
            <span className="text-[10px] text-white/70 mt-1 font-bold">Poppins Bold</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#131A2B] border border-white/5 flex flex-col items-center text-center">
            <span className="text-2xl font-semibold text-white">Aa</span>
            <span className="text-[10px] text-white/70 mt-1 font-semibold">Poppins Semi</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#131A2B] border border-white/5 flex flex-col items-center text-center">
            <span className="text-2xl font-normal text-white">Pk</span>
            <span className="text-[10px] text-white/70 mt-1">Poppins Reg</span>
          </div>
        </div>
      </div>

      {/* 3. Buttons */}
      <div className="flex flex-col gap-2 relative z-10">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">Buttons</h3>
        <div className="grid grid-cols-2 gap-2.5">
          <button className="h-10 px-4 rounded-full bg-[#FF1A6C] hover:bg-[#E0125C] text-white text-xs font-bold shadow-lg shadow-[#FF1A6C]/30 transition-all active:scale-95">
            Primary Button
          </button>
          <button className="h-10 px-4 rounded-full bg-transparent hover:bg-[#FF1A6C]/10 text-white text-xs font-bold border-2 border-[#FF1A6C] transition-all active:scale-95">
            Secondary
          </button>
        </div>
      </div>

      {/* 4. Icons (Sample) */}
      <div className="flex flex-col gap-2 relative z-10">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">Icons (Sample)</h3>
        <div className="grid grid-cols-5 gap-1 py-2 px-1 rounded-2xl bg-[#131A2B] border border-white/5">
          <div className="flex flex-col items-center gap-1 text-white/80 hover:text-[#FF1A6C] transition-colors cursor-pointer">
            <Home className="w-5 h-5" />
            <span className="text-[9px]">Home</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-white/80 hover:text-[#FF1A6C] transition-colors cursor-pointer">
            <Video className="w-5 h-5" />
            <span className="text-[9px]">Live</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-white/80 hover:text-[#FF1A6C] transition-colors cursor-pointer">
            <Trophy className="w-5 h-5" />
            <span className="text-[9px]">Party</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-white/80 hover:text-[#FF1A6C] transition-colors cursor-pointer">
            <MessageCircle className="w-5 h-5" />
            <span className="text-[9px]">Message</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-white/80 hover:text-[#FF1A6C] transition-colors cursor-pointer">
            <User className="w-5 h-5" />
            <span className="text-[9px]">Me</span>
          </div>
        </div>
      </div>

      {/* Reference Bottom Pill */}
      <div className="mt-2 text-center relative z-10">
        <span className="inline-block px-6 py-2 rounded-full bg-[#8E0B3E] text-white text-xs font-bold tracking-wide shadow-md">
          01. Design System
        </span>
      </div>
    </div>
  );
};
