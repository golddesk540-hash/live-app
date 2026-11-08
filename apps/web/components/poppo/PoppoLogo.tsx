'use client';

import React from 'react';
import Link from 'next/link';

export interface PoppoLogoProps {
  className?: string;
  isDark?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const PoppoLogo: React.FC<PoppoLogoProps> = ({ 
  className = '', 
  isDark = false,
  size = 'md'
}) => {
  const boxDimensions = size === 'lg' ? 'w-10 h-10 rounded-xl' : size === 'sm' ? 'w-7 h-7 rounded-md' : 'w-8 h-8 rounded-lg';
  const innerRound = size === 'lg' ? 'rounded-[10px]' : size === 'sm' ? 'rounded-[5px]' : 'rounded-[6.5px]';
  const poSize = size === 'lg' ? 'text-sm' : size === 'sm' ? 'text-[10px]' : 'text-xs';
  const textMainSize = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-lg' : 'text-xl';
  const liveSize = size === 'lg' ? 'text-base' : size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
      {/* Colorful Gradient Box Icon with "po." */}
      <div className={`${boxDimensions} bg-gradient-to-tr from-[#FF1A6C] via-[#FFB800] via-[#00E5FF] to-[#5653FE] p-[1.5px] shadow-sm transition-transform duration-200 group-hover:scale-105`}>
        <div className={`w-full h-full bg-gradient-to-br from-[#FF1A6C] to-[#5653FE] ${innerRound} flex items-center justify-center text-white font-black ${poSize} tracking-tighter`}>
          po.
        </div>
      </div>

      {/* Brand Text: "poppo LIVE" */}
      <div className="flex items-baseline gap-1">
        <span className={`font-black ${textMainSize} tracking-tight leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>
          poppo
        </span>
        <span className={`font-bold ${liveSize} tracking-widest uppercase leading-none ${isDark ? 'text-white/80' : 'text-gray-900'}`}>
          LIVE
        </span>
      </div>
    </Link>
  );
};
