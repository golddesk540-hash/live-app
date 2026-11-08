'use client';

import React from 'react';
import { useLanguage } from '@/lib/languageContext';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LanguageSelectorProps {
  className?: string;
  variant?: 'pill' | 'dropdown' | 'compact';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className,
  variant = 'pill',
}) => {
  const { lang, setLang, toggleLang, isUr } = useLanguage();

  if (variant === 'compact') {
    return (
      <button
        onClick={toggleLang}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-popo-dark-850 hover:bg-popo-dark-800 text-popo-text-secondary hover:text-white border border-white/10 transition-all duration-200',
          className
        )}
        title={isUr ? 'Switch to English' : 'اردو میں تبدیل کریں'}
        aria-label="Toggle language"
      >
        <Globe className="w-3.5 h-3.5 text-popo-pink" />
        <span>{isUr ? 'English' : 'اردو'}</span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center p-0.5 rounded-full bg-popo-dark-850 border border-white/10 text-xs font-medium',
        className
      )}
      role="group"
      aria-label="Language selection"
    >
      <button
        onClick={() => setLang('en')}
        className={cn(
          'px-3 py-1 rounded-full transition-all duration-200 flex items-center gap-1.5',
          lang === 'en'
            ? 'bg-popo-pink text-white font-bold shadow-glow-pink'
            : 'text-popo-text-secondary hover:text-white'
        )}
      >
        <span>English</span>
      </button>
      <button
        onClick={() => setLang('ur')}
        className={cn(
          'px-3 py-1 rounded-full transition-all duration-200 font-urdu',
          lang === 'ur'
            ? 'bg-popo-pink text-white font-bold shadow-glow-pink'
            : 'text-popo-text-secondary hover:text-white'
        )}
      >
        <span>اردو</span>
      </button>
    </div>
  );
};
