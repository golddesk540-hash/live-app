'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Globe, Download, LogIn } from 'lucide-react';

export interface MarketingNavProps {
  currentLanguage?: 'en' | 'ur';
  onToggleLanguage?: () => void;
  className?: string;
}

export const MarketingNav: React.FC<MarketingNavProps> = ({
  currentLanguage = 'en',
  onToggleLanguage,
  className,
}) => {
  const links = [
    { label: 'Explore', href: '#explore' },
    { label: 'Features', href: '#features' },
    { label: 'Creators', href: '#creators' },
    { label: 'Agency', href: '#agency' },
    { label: 'Policies', href: '#policies' },
  ];

  return (
    <nav
      className={cn(
        'w-full bg-popo-dark-950/80 backdrop-blur-lg border-b border-white/10 px-6 py-4 sticky top-0 z-40',
        className
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-popo-pink via-purple-600 to-popo-cyan p-[2px] shadow-glow-pink">
            <div className="w-full h-full bg-popo-dark-950 rounded-[10px] flex items-center justify-center font-black text-lg text-popo-pink">
              P
            </div>
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">
            POPO <span className="text-popo-pink">LIVE</span>
          </span>
        </div>

        {/* Links (Desktop) */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-semibold text-popo-text-secondary hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-popo-dark-850 hover:bg-popo-dark-800 text-xs font-semibold text-popo-text-secondary hover:text-white border border-white/10 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-popo-cyan" />
            <span>{currentLanguage === 'en' ? 'اردو' : 'English'}</span>
          </button>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<LogIn className="w-3.5 h-3.5" />}
            className="hidden sm:inline-flex"
          >
            Login
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Get App
          </Button>
        </div>
      </div>
    </nav>
  );
};
