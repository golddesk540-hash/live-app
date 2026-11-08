'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { SearchBar } from '@/components/ui/SearchBar';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Tabs } from '@/components/ui/Tabs';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Dropdown } from '@/components/ui/Dropdown';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { LoadingSpinner, SkeletonRoomCard } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';

import { WebHeader } from '@/components/navigation/WebHeader';
import { WebSidebar } from '@/components/navigation/WebSidebar';
import { MobileNavigation } from '@/components/navigation/MobileNavigation';
import { MarketingNav } from '@/components/navigation/MarketingNav';
import { AdminNav } from '@/components/navigation/AdminNav';

import { LiveRoomCard } from '@/components/references/LiveRoomCard';
import { PartyRoomCard } from '@/components/references/PartyRoomCard';
import { NineSeatPartyPreview } from '@/components/references/NineSeatPartyPreview';
import { LiveRoomOverlay } from '@/components/references/LiveRoomOverlay';
import { UserProfileCard } from '@/components/references/UserProfileCard';
import { DesignSystemReferenceCard } from '@/components/references/DesignSystemReferenceCard';

import {
  Palette,
  Type,
  Layers,
  Compass,
  Radio,
  Users,
  Swords,
  Crown,
  Heart,
  Sparkles,
  Check,
  Copy,
  ExternalLink,
  Shield,
  Smartphone,
  Globe,
  Sliders,
} from 'lucide-react';

export default function DesignSystemPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeFeedTab, setActiveFeedTab] = useState('explore');
  const [mobileNavTab, setMobileNavTab] = useState('live');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedColor(text);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const navTabs = [
    { id: 'overview', label: '1. Brand & Colors', icon: <Palette className="w-4 h-4" /> },
    { id: 'typography', label: '2. Typography', icon: <Type className="w-4 h-4" /> },
    { id: 'components', label: '3. UI Components', icon: <Layers className="w-4 h-4" /> },
    { id: 'navigation', label: '4. Navigation Patterns', icon: <Compass className="w-4 h-4" /> },
    { id: 'references', label: '5. Core Screen References', icon: <Radio className="w-4 h-4" /> },
  ];

  const colorTokens = [
    { name: 'Popo Pink (Primary)', hex: '#FF1A6C', desc: 'Main branding, CTAs, follow & live accents', glow: 'shadow-glow-pink' },
    { name: 'Electric Purple', hex: '#7928CA', desc: 'Party rooms, VIP accents, gradient bridges' },
    { name: 'PK Cyan (Secondary)', hex: '#00E5FF', desc: 'PK Battle Blue corner, active speaker waves', glow: 'shadow-glow-cyan' },
    { name: 'Imperial Gold (VIP)', hex: '#FFB800', desc: 'Coins, wealth levels, donor crowns', glow: 'shadow-glow-gold' },
    { name: 'Live Red (Broadcast)', hex: '#FF2B44', desc: 'Active broadcast indicator dot & badges' },
    { name: 'Obsidian Dark 950', hex: '#0B0B10', desc: 'Main app dark background' },
    { name: 'Slate Dark 900', hex: '#111118', desc: 'Elevated navigation and dialogs' },
    { name: 'Container Dark 850', hex: '#171722', desc: 'Card backgrounds and inputs' },
    { name: 'Border Subtle', hex: 'rgba(255,255,255,0.08)', desc: 'Standard card & input strokes' },
    { name: 'Emerald Success', hex: '#10B981', desc: 'Online presence & approved status' },
  ];

  return (
    <div className="min-h-screen bg-popo-dark-950 text-popo-text-primary pb-24">
      {/* Top Banner / System Title */}
      <div className="border-b border-white/10 bg-gradient-to-r from-popo-dark-950 via-popo-dark-900 to-popo-dark-950 px-6 py-6 sticky top-0 z-30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-popo-pink via-purple-600 to-popo-cyan p-[2px] shadow-glow-pink">
              <div className="w-full h-full bg-popo-dark-950 rounded-[14px] flex items-center justify-center font-black text-xl text-popo-pink">
                P
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                  POPO LIVE <span className="text-popo-pink">DESIGN SYSTEM</span>
                </h1>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-popo-pink/20 text-popo-pink border border-popo-pink/30">
                  v1.0 Ready
                </span>
              </div>
              <p className="text-xs text-popo-text-secondary">
                Unified live streaming component library, design tokens & responsive foundation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-popo-text-muted hidden sm:inline">
              Source: Poppo Live Specification
            </span>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Globe className="w-3.5 h-3.5" />}
              onClick={() => setSelectedLanguage(selectedLanguage === 'en' ? 'ur' : 'en')}
            >
              {selectedLanguage === 'en' ? 'اردو پریویو' : 'English Preview'}
            </Button>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-4 pt-2">
          <Tabs items={navTabs} activeId={activeTab} onChange={setActiveTab} variant="pills" />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-12">
        {/* =====================================================================
            SECTION 1: BRAND IDENTITY & COLOR PALETTE
        ===================================================================== */}
        {activeTab === 'overview' && (
          <section className="flex flex-col gap-8 animate-in fade-in duration-300">
            {/* Direct Reference Image Comparison & Identity Hero */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Identity Narrative */}
              <div className="lg:col-span-7 relative rounded-3xl bg-gradient-to-br from-popo-dark-900 via-popo-dark-850 to-popo-dark-900 p-8 border border-white/10 shadow-2xl overflow-hidden h-full flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-96 h-96 bg-popo-pink/15 blur-3xl rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-popo-purple/15 blur-3xl rounded-full pointer-events-none" />

                <div className="relative z-10 flex flex-col gap-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-popo-pink flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> 1. Brand Identity & Visual Language
                  </span>
                  <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    Popo Live Design System Foundation
                  </h2>
                  <p className="text-sm md:text-base text-popo-text-secondary leading-relaxed">
                    Popo Live is built on a high-contrast dark obsidian foundation accented with electric neon pink (`#FF1A6C`), vibrant purple (`#7038FF`), and deep slate surfaces (`#131A2B`). Every component is designed strictly following the 01_design_system.png specification.
                  </p>

                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-1">
                      <span className="text-[11px] text-popo-text-muted">Primary Accent</span>
                      <span className="text-sm font-bold text-popo-pink">#FF1A6C (Neon Pink)</span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-1">
                      <span className="text-[11px] text-popo-text-muted">Secondary Accent</span>
                      <span className="text-sm font-bold text-purple-400">#7038FF (Purple)</span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-1">
                      <span className="text-[11px] text-popo-text-muted">Main Background</span>
                      <span className="text-sm font-bold text-white">#0B0E17 (Dark Navy)</span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-1">
                      <span className="text-[11px] text-popo-text-muted">Surface Containers</span>
                      <span className="text-sm font-bold text-white">#131A2B (Slate Navy)</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-white/10 relative z-10">
                  <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-3 py-1.5 rounded-full text-xs text-white">
                    <Shield className="w-3.5 h-3.5 text-popo-cyan" />
                    <span>Single Shared Backend</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-3 py-1.5 rounded-full text-xs text-white">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>70% Host Share</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-3 py-1.5 rounded-full text-xs text-white">
                    <Users className="w-3.5 h-3.5 text-popo-purple-light" />
                    <span>9-Seat Rooms</span>
                  </div>
                </div>
              </div>

              {/* Direct 01_design_system.png Interactive Component */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-bold text-popo-pink uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" /> 01_design_system.png Live Replica
                  </span>
                  <span className="text-[11px] text-popo-text-muted">Pixel-Precise Matching</span>
                </div>
                <DesignSystemReferenceCard />
              </div>
            </div>

            {/* Color Palette Grid */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Centralized Color Tokens</h3>
                  <p className="text-xs text-popo-text-secondary">
                    Click any swatch to copy the token hex code directly.
                  </p>
                </div>
                {copiedColor && (
                  <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    Copied {copiedColor}!
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {colorTokens.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => copyToClipboard(c.hex)}
                    className="flex flex-col p-4 rounded-2xl bg-popo-dark-850 border border-white/10 hover:border-white/20 transition-all text-left hover:scale-[1.02] group"
                  >
                    <div
                      className="w-full h-20 rounded-xl mb-3 flex items-end justify-end p-2 transition-transform group-hover:scale-95"
                      style={{ background: c.hex }}
                    >
                      <Copy className="w-3.5 h-3.5 text-white/70 group-hover:text-white" />
                    </div>
                    <span className="text-xs font-bold text-white group-hover:text-popo-pink transition-colors">
                      {c.name}
                    </span>
                    <span className="text-[11px] font-mono text-popo-text-muted mt-0.5">{c.hex}</span>
                    <span className="text-[11px] text-popo-text-secondary mt-1 line-clamp-2">{c.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* =====================================================================
            SECTION 2: TYPOGRAPHY SYSTEM
        ===================================================================== */}
        {activeTab === 'typography' && (
          <section className="flex flex-col gap-8 animate-in fade-in duration-300">
            <div>
              <h3 className="text-lg font-bold text-white">Bilingual Typography Hierarchy</h3>
              <p className="text-xs text-popo-text-secondary">
                Designed for English (Latin) and Urdu (Nastaliq) dual-language launch requirements.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* English Scale */}
              <Card variant="default" padding="lg" className="flex flex-col gap-6">
                <span className="text-xs font-bold uppercase tracking-wider text-popo-pink">
                  English Font Stack (Inter / Poppins)
                </span>

                <div className="flex flex-col gap-4 border-t border-white/5 pt-4">
                  <div>
                    <span className="text-[11px] font-mono text-popo-text-muted">Display 5XL (48px / Extrabold)</span>
                    <h1 className="text-4xl font-extrabold text-white mt-1">Live Without Limits</h1>
                  </div>

                  <div>
                    <span className="text-[11px] font-mono text-popo-text-muted">Section Title 3XL (30px / Bold)</span>
                    <h2 className="text-2xl font-bold text-white mt-1">9-Seat Interactive Party Rooms</h2>
                  </div>

                  <div>
                    <span className="text-[11px] font-mono text-popo-text-muted">Card Heading 2XL (24px / SemiBold)</span>
                    <h3 className="text-xl font-semibold text-white mt-1">Daily Creator Tasks & Streak Bonuses</h3>
                  </div>

                  <div>
                    <span className="text-[11px] font-mono text-popo-text-muted">Body Base (16px / Regular)</span>
                    <p className="text-sm md:text-base text-popo-text-secondary mt-1 leading-relaxed">
                      Send luxury animated gifts to your favorite broadcasters. 70% of gift coin values convert directly into withdrawable points.
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-mono text-popo-text-muted">Micro-Copy / Badges (11px / Uppercase)</span>
                    <p className="text-[11px] uppercase tracking-wider font-extrabold text-amber-400 mt-1">
                      👑 VIP LEVEL 5 • ⚔️ PK BATTLE READY • 🔴 LIVE NOW
                    </p>
                  </div>
                </div>
              </Card>

              {/* Urdu Scale */}
              <Card variant="default" padding="lg" className="flex flex-col gap-6 text-right">
                <span className="text-xs font-bold uppercase tracking-wider text-popo-cyan text-left">
                  Urdu Localization Stack (اردو فونٹ)
                </span>

                <div className="flex flex-col gap-5 border-t border-white/5 pt-4">
                  <div>
                    <span className="text-[11px] font-mono text-popo-text-muted text-left block">Urdu Heading (36px)</span>
                    <h1 className="text-3xl font-extrabold text-white mt-1 leading-normal">
                      پوپو لائیو کے ساتھ دنیا سے جڑیں
                    </h1>
                  </div>

                  <div>
                    <span className="text-[11px] font-mono text-popo-text-muted text-left block">Urdu Subheading (24px)</span>
                    <h2 className="text-xl font-bold text-white mt-1">
                      ۹ سیٹوں والے وائس اور ویڈیو پارٹی رومز
                    </h2>
                  </div>

                  <div>
                    <span className="text-[11px] font-mono text-popo-text-muted text-left block">Urdu Body Text (16px)</span>
                    <p className="text-sm md:text-base text-popo-text-secondary mt-1 leading-relaxed">
                      اپنے پسندیدہ ہوسٹس کو شاندار ورچوئل تحائف بھیجیں اور لائیو اسٹریمز سے فوری انعامات حاصل کریں۔
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-mono text-popo-text-muted text-left block">Urdu Action Badges</span>
                    <p className="text-xs font-bold text-popo-pink mt-1">
                      🔴 لائیو جاری ہے • 🎙️ مائیک پر تشریف لائیں • 💰 سکے جمع کریں
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </section>
        )}

        {/* =====================================================================
            SECTION 3: REUSABLE UI COMPONENTS
        ===================================================================== */}
        {activeTab === 'components' && (
          <section className="flex flex-col gap-10 animate-in fade-in duration-300">
            {/* 3.1 Buttons Matrix */}
            <Card variant="default" padding="lg" className="flex flex-col gap-6">
              <div>
                <h3 className="text-lg font-bold text-white">Buttons & Actions</h3>
                <p className="text-xs text-popo-text-secondary">
                  Complete variant scale: Primary, Secondary, Outline, Ghost, VIP/Gold, Cyan & Danger.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" size="md">
                  Primary Action
                </Button>
                <Button variant="secondary" size="md">
                  Secondary
                </Button>
                <Button variant="vip" size="md" leftIcon={<Crown className="w-4 h-4 fill-black" />}>
                  VIP Upgrade
                </Button>
                <Button variant="cyan" size="md" leftIcon={<Swords className="w-4 h-4" />}>
                  PK Challenge
                </Button>
                <Button variant="outline" size="md">
                  Outline Pink
                </Button>
                <Button variant="ghost" size="md">
                  Ghost Button
                </Button>
                <Button variant="danger" size="md">
                  End Stream
                </Button>
                <Button variant="primary" size="md" isLoading>
                  Loading...
                </Button>
              </div>

              {/* Button Sizes */}
              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/5">
                <Button variant="primary" size="xs">XS Button</Button>
                <Button variant="primary" size="sm">SM Button</Button>
                <Button variant="primary" size="md">MD Standard</Button>
                <Button variant="primary" size="lg">LG Hero CTA</Button>
                <IconButton variant="pink" size="md">
                  <Heart className="w-4 h-4" />
                </IconButton>
                <IconButton variant="glass" size="md">
                  <ExternalLink className="w-4 h-4" />
                </IconButton>
              </div>
            </Card>

            {/* 3.2 Badges & Status Indicators */}
            <Card variant="default" padding="lg" className="flex flex-col gap-6">
              <div>
                <h3 className="text-lg font-bold text-white">Badges, Levels & Status Indicators</h3>
                <p className="text-xs text-popo-text-secondary">
                  Wealth levels (Lv.1 to Lv.99), VIP ranks, live stream status, and party indicators.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="live">LIVE</Badge>
                  <Badge variant="party">9-SEAT PARTY</Badge>
                  <Badge variant="vip">VIP 5</Badge>
                  <Badge variant="host">OFFICIAL HOST</Badge>
                  <Badge variant="success">ONLINE</Badge>
                  <Badge variant="category">🎵 Music</Badge>
                  <Badge variant="category">⚔️ PK Arena</Badge>
                </div>

                {/* Wealth Level Scale */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="text-xs text-popo-text-muted mr-2">Wealth Scale:</span>
                  <Badge variant="level" level={5} size="sm" />
                  <Badge variant="level" level={15} size="sm" />
                  <Badge variant="level" level={32} size="sm" />
                  <Badge variant="level" level={55} size="sm" />
                  <Badge variant="level" level={88} size="sm" />
                </div>

                {/* Status Indicator Animations */}
                <div className="flex items-center gap-6 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-2 text-xs text-popo-text-secondary">
                    <StatusIndicator type="live-pulse" />
                    <span>Live Pulse Wave</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-popo-text-secondary">
                    <StatusIndicator type="audio-wave" />
                    <span>Active Audio Equalizer</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-popo-text-secondary">
                    <StatusIndicator type="presence" status="online" />
                    <span>Online Status</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* 3.3 Avatars & User Presence */}
            <Card variant="default" padding="lg" className="flex flex-col gap-6">
              <div>
                <h3 className="text-lg font-bold text-white">Avatars & Frames</h3>
                <p className="text-xs text-popo-text-secondary">
                  Live broadcasting rings, VIP golden crowns, and active party seat rings.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div className="flex flex-col items-center gap-1.5">
                  <Avatar
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                    size="xl"
                    ring="live"
                    status="live"
                    level={42}
                  />
                  <span className="text-[11px] text-popo-pink font-bold">Live Ring</span>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <Avatar
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
                    size="xl"
                    ring="vip"
                    isVIP={true}
                    status="online"
                    level={68}
                  />
                  <span className="text-[11px] text-amber-400 font-bold">VIP Crown</span>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <Avatar
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
                    size="xl"
                    ring="seat"
                    level={24}
                  />
                  <span className="text-[11px] text-popo-cyan font-bold">Party Seat</span>
                </div>

                {/* Size Matrix */}
                <div className="flex items-center gap-3 ml-auto">
                  <Avatar size="xs" fallback="XS" />
                  <Avatar size="sm" fallback="SM" />
                  <Avatar size="md" fallback="MD" />
                  <Avatar size="lg" fallback="LG" />
                </div>
              </div>
            </Card>

            {/* 3.4 Inputs & Search */}
            <Card variant="default" padding="lg" className="flex flex-col gap-6">
              <div>
                <h3 className="text-lg font-bold text-white">Inputs & Search Bar</h3>
                <p className="text-xs text-popo-text-secondary">
                  Category tags, floating labels, validation states, and clear buttons.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SearchBar
                  categories={['All', 'Music', 'Chat', 'Dance', 'Gaming', 'PK Arena']}
                  activeCategory="Music"
                />
                <Input
                  label="Room Title"
                  placeholder="Enter your live room broadcast title..."
                  defaultValue="Late Night Urdu Karaoke & Chill"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Creator ID" placeholder="e.g. 884210" />
                <Input label="With Error" defaultValue="Invalid Room" error="Room title exceeds limit" />
                <Dropdown
                  label="Language Select"
                  options={[
                    { value: 'en', label: 'English (US / UK)' },
                    { value: 'ur', label: 'Urdu (اردو)' },
                    { value: 'ar', label: 'Arabic (العربية)' },
                  ]}
                  value="en"
                  onChange={() => {}}
                />
              </div>
            </Card>

            {/* 3.5 Interactive Modals & States */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card variant="default" padding="lg" className="flex flex-col gap-4">
                <h4 className="text-sm font-bold text-white">Interactive Modal Preview</h4>
                <p className="text-xs text-popo-text-secondary leading-relaxed">
                  Accessible dialog modal with backdrop blur, keyboard ESC support, and animated zoom.
                </p>
                <div>
                  <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
                    Trigger Demo Modal
                  </Button>
                </div>

                <Modal
                  isOpen={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                  title="Send Virtual Gift"
                  subtitle="Support the streamer and level up your wealth badge"
                  footer={
                    <>
                      <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setIsModalOpen(false)}>
                        Confirm Send
                      </Button>
                    </>
                  }
                >
                  <div className="flex flex-col gap-3 text-sm text-popo-text-secondary">
                    <p>
                      Gifts trigger animated full-screen SVGA effects on the streamer room and credit 70% directly into host points.
                    </p>
                    <div className="p-3 rounded-xl bg-popo-dark-850 border border-white/5 flex items-center justify-between">
                      <span className="font-bold text-white">🚀 Luxury Rocket</span>
                      <span className="text-amber-400 font-extrabold">5,000 Coins</span>
                    </div>
                  </div>
                </Modal>
              </Card>

              <Card variant="default" padding="lg" className="flex flex-col gap-4">
                <h4 className="text-sm font-bold text-white">Loading & Empty States</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-popo-dark-850 border border-white/5">
                    <LoadingSpinner size="md" variant="pink" />
                    <span className="text-xs text-popo-text-muted mt-2">Loading Streams...</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-popo-dark-850 border border-white/5">
                    <LoadingSpinner size="md" variant="gold" />
                    <span className="text-xs text-amber-400 mt-2">Processing Wallet...</span>
                  </div>
                </div>
              </Card>
            </div>
          </section>
        )}

        {/* =====================================================================
            SECTION 4: NAVIGATION DESIGN PATTERNS
        ===================================================================== */}
        {activeTab === 'navigation' && (
          <section className="flex flex-col gap-8 animate-in fade-in duration-300">
            <div>
              <h3 className="text-lg font-bold text-white">Platform Navigation Patterns</h3>
              <p className="text-xs text-popo-text-secondary">
                Reusable navigation patterns for Mobile App, Web Header/Sidebar, Marketing Site, and Admin Console.
              </p>
            </div>

            {/* 4.1 Web App Header */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-popo-pink">
                A. Desktop Web App Header (Live Experience)
              </span>
              <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                <WebHeader />
              </div>
            </div>

            {/* 4.2 Marketing Website Nav */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-popo-cyan">
                B. Public Marketing Landing Navigation
              </span>
              <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                <MarketingNav />
              </div>
            </div>

            {/* 4.3 Sidebars (Web & Admin) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  C. Web App Sidebar (Desktop Feeds & Creator List)
                </span>
                <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-popo-dark-900 max-h-[500px] overflow-y-auto">
                  <WebSidebar />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  D. Admin Console Sidebar (Safety, Live Monitor & Payouts)
                </span>
                <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-popo-dark-950 max-h-[500px] overflow-y-auto">
                  <AdminNav />
                </div>
              </div>
            </div>

            {/* 4.4 Mobile App Bottom Tab Bar */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-popo-pink">
                E. Mobile App 5-Tab Navigation (Android & iOS Flutter Blueprint)
              </span>
              <div className="relative p-6 rounded-2xl bg-popo-dark-900 border border-white/10 flex justify-center">
                <div className="w-full max-w-sm rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative min-h-[140px] bg-popo-dark-950 flex flex-col justify-end">
                  <div className="p-4 text-center text-xs text-popo-text-muted">
                    Mobile Screen Viewport (390 x 844)
                  </div>
                  <MobileNavigation
                    activeId={mobileNavTab}
                    onChange={setMobileNavTab}
                    className="relative"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =====================================================================
            SECTION 5: CORE SCREEN REFERENCE COMPONENTS
        ===================================================================== */}
        {activeTab === 'references' && (
          <section className="flex flex-col gap-10 animate-in fade-in duration-300">
            <div>
              <h3 className="text-lg font-bold text-white">Poppo Live Core Reference Previews</h3>
              <p className="text-xs text-popo-text-secondary">
                Studied directly from reference screenshots: Explore Feed, Solo Live Overlay, 9-Seat Party Room & User Profile.
              </p>
            </div>

            {/* 5.1 Explore Feed & Room Cards */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <Compass className="w-4 h-4 text-popo-pink" /> Reference 1: Explore Discovery Feed
                  </h4>
                  <p className="text-xs text-popo-text-secondary">
                    3:4 Room cards with live pulses, viewer count pill, country flag, and wealth level.
                  </p>
                </div>
                <div className="hidden sm:block">
                  <Tabs
                    items={[
                      { id: 'explore', label: 'Explore' },
                      { id: 'pk', label: 'PK Arena' },
                      { id: 'party', label: 'Party' },
                    ]}
                    activeId={activeFeedTab}
                    onChange={setActiveFeedTab}
                    variant="chips"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <LiveRoomCard
                  id="1"
                  title="🔥 Top PK Battle Pakistan vs India"
                  hostName="Ayesha Noor"
                  hostAvatar="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
                  coverImage="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80"
                  viewerCount="4.2k"
                  category="⚔️ PK Battle"
                  level={45}
                  isPK={true}
                />
                <LiveRoomCard
                  id="2"
                  title="Urdu Ghazal Night 🌙 Relaxing"
                  hostName="Hamza Ali"
                  hostAvatar="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
                  coverImage="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80"
                  viewerCount="1.8k"
                  category="🎵 Music"
                  level={28}
                />
                <LiveRoomCard
                  id="3"
                  title="New Talents Welcome! Gift Party"
                  hostName="Zoya Khan"
                  hostAvatar="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
                  coverImage="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&auto=format&fit=crop&q=80"
                  viewerCount="950"
                  category="💬 Chat"
                  level={18}
                />
                <SkeletonRoomCard />
              </div>
            </div>

            {/* 5.2 Party Rooms Grid Preview & Live Overlay Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Reference 2: 9-Seat Party Room Layout */}
              <div className="flex flex-col gap-3">
                <div className="text-left">
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-popo-purple-light" /> Reference 2: Nine-Seat Party Room (Phase 5)
                  </h4>
                  <p className="text-xs text-popo-text-secondary">
                    1 Host seat + 8 Guest speaker seats with active mic equalization and seat states.
                  </p>
                </div>
                <NineSeatPartyPreview />
              </div>

              {/* Reference 3: Live Streaming Room Overlay */}
              <div className="flex flex-col gap-3">
                <div className="text-left">
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <Radio className="w-4 h-4 text-popo-pink" /> Reference 3: Live Stream Video Room (Phase 4)
                  </h4>
                  <p className="text-xs text-popo-text-secondary">
                    Real-time video overlay with streamer capsule, live chat feed, and glowing gift button.
                  </p>
                </div>
                <LiveRoomOverlay />
              </div>
            </div>

            {/* 5.3 User Profile Card Reference */}
            <div className="flex flex-col gap-3">
              <div className="text-left">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Heart className="w-4 h-4 text-amber-400" /> Reference 4: User Profile & Personal Center (Phase 2)
                </h4>
                <p className="text-xs text-popo-text-secondary">
                  Unique User ID, one-click copy, wealth levels, VIP badge, follower stats, and action buttons.
                </p>
              </div>
              <UserProfileCard />
            </div>
          </section>
        )}
      </main>

      {/* Footer Documentation / Future Reuse Guidance */}
      <footer className="max-w-7xl mx-auto px-4 md:px-8 pt-8 mt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-popo-text-secondary">
        <div>
          <span>Popo Live Design System v1.0 • Built with Next.js, TypeScript & Tailwind CSS</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-popo-pink font-bold">100% Phase-1 Scope Compliant</span>
          <span>•</span>
          <span>Zero Backend / Mocked UI Only</span>
        </div>
      </footer>
    </div>
  );
}
