'use client';

import React, { useState } from 'react';
import {
  Navbar,
  HeroSection,
  MainFeaturesSection,
  PopularLiveHostsSection,
  WhyChooseSection,
  HowItWorksSection,
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
        {/* 2. Hero Section (02_homepage_desktop.png) */}
        <HeroSection lang={lang} />

        {/* 3. Main Features 4-Card Row (02_homepage_desktop.png) */}
        <MainFeaturesSection lang={lang} />

        {/* 4. Popular Live Hosts Carousel (02_homepage_desktop.png) */}
        <PopularLiveHostsSection lang={lang} />

        {/* 5. Why Choose Popo Live */}
        <WhyChooseSection lang={lang} />

        {/* 6. How Popo Live Works */}
        <HowItWorksSection lang={lang} />

        {/* 7. Live Streaming Deep Dive */}
        <LiveExperienceSection lang={lang} />

        {/* 8. Party Rooms (9-Seat Voice Lounges) */}
        <PartyRoomsSection lang={lang} />

        {/* 9. PK Battles (1v1 Arena) */}
        <PKBattlesSection lang={lang} />

        {/* 10. Gifts and Rewards (70% Host Conversion) */}
        <GiftsRewardsSection lang={lang} />

        {/* 11. Creator and Agency */}
        <CreatorAgencySection lang={lang} />

        {/* 12. Join Our Community / Download App CTA */}
        <DownloadAppSection lang={lang} />

        {/* 13. News Highlights */}
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
