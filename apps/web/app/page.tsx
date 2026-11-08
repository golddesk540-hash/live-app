'use client';

import React, { useState } from 'react';
import {
  Navbar,
  HeroSection,
  LiveExperienceSection,
  PartyRoomsSection,
  PKBattlesSection,
  GiftsRewardsSection,
  CreatorAgencySection,
  DownloadAppSection,
  NewsSection,
  Footer,
  AuthModal,
} from '@/components/homepage';
import { useLanguage } from '@/lib/languageContext';

export default function HomePage() {
  const { lang, toggleLang, isUr } = useLanguage();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <div
      dir={isUr ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-popo-dark-950 text-popo-text-primary overflow-x-hidden selection:bg-popo-pink selection:text-white ${
        isUr ? 'font-urdu' : 'font-sans'
      }`}
    >
      {/* 1. Header / Navigation */}
      <Navbar
        lang={lang}
        onToggleLang={toggleLang}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      <main className="flex flex-col">
        {/* 2. Hero Section */}
        <HeroSection lang={lang} />

        {/* 3. Live Streaming Experience */}
        <LiveExperienceSection lang={lang} />

        {/* 4. Party Rooms (9-Seat Voice Lounges) */}
        <PartyRoomsSection lang={lang} />

        {/* 5. PK Battles (1v1 Arena) */}
        <PKBattlesSection lang={lang} />

        {/* 6. Gifts and Rewards (70% Host Conversion) */}
        <GiftsRewardsSection lang={lang} />

        {/* 7. Creator and Agency */}
        <CreatorAgencySection lang={lang} />

        {/* 8. Download App */}
        <DownloadAppSection lang={lang} />

        {/* 9. News Preview */}
        <NewsSection lang={lang} />
      </main>

      {/* 10. Footer */}
      <Footer lang={lang} />

      {/* Interactive Auth / Sign-In Modal */}
      <AuthModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        lang={lang}
      />
    </div>
  );
}
