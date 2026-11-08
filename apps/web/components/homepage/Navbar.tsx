'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Globe, Download, LogIn, Menu, X, Sparkles } from 'lucide-react';
import { content } from './content';
import { useLanguage } from '@/lib/languageContext';

export interface NavbarProps {
  lang?: 'en' | 'ur';
  onToggleLang?: () => void;
  onOpenLogin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang: propLang,
  onToggleLang: propToggle,
  onOpenLogin,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { lang: contextLang, toggleLang: contextToggle } = useLanguage();

  const lang = propLang || contextLang || 'en';
  const onToggle = propToggle || contextToggle;
  const t = content[lang].nav;
  const isUr = lang === 'ur';

  const navLinks = [
    { label: t.home, href: '/' },
    { label: t.news, href: '/news' },
    { label: t.about, href: '/about' },
    { label: t.agency, href: '/agency' },
    { label: t.contact, href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-popo-dark-950/90 backdrop-blur-xl border-b border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-popo-pink via-purple-600 to-popo-cyan p-[2px] shadow-glow-pink transition-transform duration-300 group-hover:scale-105">
            <div className="w-full h-full bg-popo-dark-950 rounded-[14px] flex items-center justify-center font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-popo-pink to-amber-400">
              P
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tight text-white flex items-center gap-1">
              POPO <span className="text-popo-pink">LIVE</span>
            </span>
            <span className="text-[10px] font-bold text-popo-text-muted uppercase tracking-widest hidden sm:block">
              {isUr ? 'لائیو اسٹریمنگ پلیٹ فارم' : 'Live Social Hub'}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`text-sm font-semibold transition-colors relative py-1 group ${
                  isActive ? 'text-white' : 'text-popo-text-secondary hover:text-white'
                }`}
              >
                <span>{link.label}</span>
                <span
                  className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-popo-pink to-popo-cyan rounded-full transition-all duration-300 ${
                    isActive ? 'w-full shadow-glow-pink' : 'w-0 group-hover:w-full'
                  }`}
                />
              </Link>
            );
          })}
          <Link
            href="/design-system"
            target="_blank"
            className="text-xs font-bold text-popo-cyan hover:text-white transition-colors px-2.5 py-1 rounded-full bg-popo-cyan/10 border border-popo-cyan/25 flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            <span>Tokens</span>
          </Link>
        </nav>

        {/* Right CTA Actions */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          {/* Language Switcher */}
          <button
            type="button"
            onClick={onToggle}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-popo-dark-850 hover:bg-popo-dark-800 text-xs font-bold text-popo-text-secondary hover:text-white border border-white/10 transition-all select-none active:scale-95"
            aria-label="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-popo-cyan" />
            <span>{t.language}</span>
          </button>

          {/* Login Button */}
          <Link href="/login">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<LogIn className="w-3.5 h-3.5" />}
            >
              {t.login}
            </Button>
          </Link>

          {/* Download App Button */}
          <Link href="/download">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              {t.download}
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="p-2 rounded-xl bg-popo-dark-850 text-popo-cyan border border-white/10 text-xs font-bold"
          >
            {t.language}
          </button>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl bg-popo-dark-850 text-white border border-white/10"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-popo-dark-900/98 border-b border-white/10 px-5 py-6 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-base font-semibold py-1 ${
                    isActive ? 'text-popo-pink font-bold' : 'text-popo-text-secondary hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/design-system"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-semibold text-popo-cyan py-1 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Design System Preview</span>
            </Link>
          </nav>

          <div className="flex flex-col gap-2.5 pt-4 border-t border-white/10">
            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
              <Button
                variant="secondary"
                size="md"
                className="w-full"
                leftIcon={<LogIn className="w-4 h-4" />}
              >
                {t.login}
              </Button>
            </Link>
            <Link href="/download" onClick={() => setIsMobileMenuOpen(false)}>
              <Button
                variant="primary"
                size="md"
                className="w-full"
                leftIcon={<Download className="w-4 h-4" />}
              >
                {t.download}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
