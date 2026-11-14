'use client';

import React, { useState } from 'react';
import {
  Smartphone,
  Apple,
  Star,
  Download,
  Share2,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Radio,
  Users,
  Gift,
  Trophy,
  MessageCircle,
  Eye,
  Info
} from 'lucide-react';
import { MOCK_STORE_PREVIEW } from './mockReleaseData';

export const StoreListingPreviewView: React.FC = () => {
  const [activeStore, setActiveStore] = useState<'google_play' | 'apple_appstore'>('google_play');
  const [activeScreenshotIndex, setActiveScreenshotIndex] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const { googlePlay, appleAppStore } = MOCK_STORE_PREVIEW;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900/40 via-indigo-950/40 to-slate-900/40 border border-purple-700/30 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-pink-500/20 border border-pink-500/30 rounded-xl text-pink-400">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Store Listing Preview & Metadata Studio
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Visual inspection simulator for Google Play Store and Apple App Store listings before official submission.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveStore('google_play')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeStore === 'google_play'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700/40'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Google Play Store
            </button>
            <button
              onClick={() => setActiveStore('apple_appstore')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeStore === 'apple_appstore'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700/40'
              }`}
            >
              <Apple className="w-4 h-4" />
              Apple App Store
            </button>
          </div>
        </div>
      </div>

      {/* Main Preview Container */}
      {activeStore === 'google_play' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Simulated Mobile Device Frame */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-[340px] bg-slate-950 border-4 border-slate-700/80 rounded-[40px] p-4 shadow-2xl relative overflow-hidden">
              {/* Android Punch Hole Camera */}
              <div className="w-3.5 h-3.5 bg-black rounded-full mx-auto mb-3 border border-slate-800" />

              {/* Play Store App Header */}
              <div className="flex items-start gap-3.5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-600 to-cyan-400 p-0.5 shadow-lg shrink-0">
                  <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center font-bold text-white text-xl tracking-wider">
                    POPO
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-white text-base leading-tight">
                    {googlePlay.appName}
                  </h3>
                  <div className="text-emerald-400 text-xs font-semibold mt-0.5">
                    {googlePlay.developer}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Contains ads • In-app purchases
                  </div>
                </div>
              </div>

              {/* Play Store Rating & Download Badges */}
              <div className="grid grid-cols-3 gap-1 py-3 my-3 border-y border-slate-800 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1 text-white font-bold text-xs">
                    4.8 <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="text-[10px] text-slate-400">12K reviews</div>
                </div>
                <div className="border-x border-slate-800">
                  <div className="text-white font-bold text-xs">1M+</div>
                  <div className="text-[10px] text-slate-400">Downloads</div>
                </div>
                <div>
                  <div className="px-1.5 py-0.5 rounded bg-slate-800 text-white font-bold text-[10px] inline-block">
                    {googlePlay.contentRating}
                  </div>
                  <div className="text-[10px] text-slate-400">Rated for 18+</div>
                </div>
              </div>

              {/* Install Button */}
              <button className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-full text-xs shadow-md transition">
                Install
              </button>

              {/* Feature Graphic Simulator */}
              <div className="mt-3.5 rounded-xl overflow-hidden border border-purple-800/30 bg-gradient-to-r from-purple-900/60 to-pink-900/60 p-3 text-center">
                <div className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  {googlePlay.featureGraphicTitle}
                </div>
                <div className="text-[10px] text-purple-200 mt-0.5">
                  Watch live streaming, join multi-room parties & send virtual gifts!
                </div>
              </div>

              {/* Screenshots Carousel */}
              <div className="mt-4">
                <div className="text-[11px] font-semibold text-slate-300 mb-2">Screenshots</div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {googlePlay.screenshots.map((s: { title: string; tagline: string }, idx: number) => (
                    <div
                      key={idx}
                      onClick={() => setActiveScreenshotIndex(idx)}
                      className={`min-w-[110px] h-[190px] rounded-xl border p-2 flex flex-col justify-between cursor-pointer transition ${
                        activeScreenshotIndex === idx
                          ? 'border-pink-500 bg-purple-950/60 shadow-md shadow-pink-500/20'
                          : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-[10px] font-bold text-pink-400">{s.title}</div>
                      <div className="flex-1 my-2 rounded-lg bg-slate-950/80 border border-purple-800/20 flex flex-col items-center justify-center p-2 text-center">
                        {idx === 0 && <Radio className="w-6 h-6 text-pink-400" />}
                        {idx === 1 && <Users className="w-6 h-6 text-cyan-400" />}
                        {idx === 2 && <Gift className="w-6 h-6 text-amber-400" />}
                        {idx === 3 && <Trophy className="w-6 h-6 text-purple-400" />}
                        {idx === 4 && <MessageCircle className="w-6 h-6 text-emerald-400" />}
                        <span className="text-[9px] text-slate-300 mt-2 font-medium">{s.tagline}</span>
                      </div>
                      <div className="text-[8px] text-slate-400 text-center font-mono">1080x2400</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Short Description */}
              <div className="mt-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                  Short Description (80 chars max)
                </span>
                {googlePlay.shortDescription}
              </div>
            </div>
          </div>

          {/* Store Metadata Inspection Panel */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 bg-slate-900/60 border border-purple-800/30 rounded-2xl backdrop-blur-md">
              <h3 className="font-bold text-white text-base flex items-center gap-2 mb-3">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                Google Play Store Listing Specifications
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-purple-800/20">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                    Package ID / Application ID
                  </span>
                  <span className="text-emerald-400 font-mono font-bold">{googlePlay.packageId}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-purple-800/20">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                    Target SDK & Minimum OS
                  </span>
                  <span className="text-white font-mono">{googlePlay.targetSdk} (Min: {googlePlay.minSdk})</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-purple-800/20">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                    Full Description ({googlePlay.fullDescription.length} characters)
                  </span>
                  <p className="text-slate-300 mt-1 whitespace-pre-line leading-relaxed">
                    {isDescriptionExpanded
                      ? googlePlay.fullDescription
                      : `${googlePlay.fullDescription.slice(0, 320)}...`}
                  </p>
                  <button
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="text-pink-400 font-semibold text-xs mt-2 hover:underline"
                  >
                    {isDescriptionExpanded ? 'Collapse Full Text' : 'Read Full Description'}
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-purple-800/20">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                    Content Rating & Parental Advisory
                  </span>
                  <span className="text-amber-300 font-medium">{googlePlay.contentRating} — Mature 17+ Content</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Includes user interactions, live video streaming, unmoderated user comments, and simulated virtual gifting.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Simulated iPhone Frame */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-[340px] bg-slate-950 border-4 border-slate-700/80 rounded-[44px] p-4 shadow-2xl relative overflow-hidden">
              {/* Dynamic Island */}
              <div className="w-24 h-5 bg-black rounded-full mx-auto mb-3 border border-slate-800 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-800" />
              </div>

              {/* App Store Header */}
              <div className="flex items-start gap-3.5">
                <div className="w-16 h-16 rounded-[18px] bg-gradient-to-tr from-pink-500 via-purple-600 to-cyan-400 p-0.5 shadow-lg shrink-0">
                  <div className="w-full h-full bg-slate-900 rounded-[16px] flex items-center justify-center font-bold text-white text-xl tracking-wider">
                    POPO
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-white text-base leading-tight">
                    {appleAppStore.appName}
                  </h3>
                  <div className="text-slate-400 text-xs mt-0.5">
                    {appleAppStore.subtitle}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {appleAppStore.developer}
                  </div>
                </div>
              </div>

              {/* Get Button */}
              <div className="flex items-center justify-between my-3 pt-2">
                <button className="px-5 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold rounded-full text-xs shadow-md transition">
                  GET
                </button>
                <div className="text-[10px] text-slate-400">In-App Purchases</div>
              </div>

              {/* App Store Details Bar */}
              <div className="grid grid-cols-3 gap-1 py-2.5 my-2 border-y border-slate-800 text-center">
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Ratings</div>
                  <div className="flex items-center justify-center gap-1 text-white font-bold text-xs mt-0.5">
                    4.9 <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </div>
                </div>
                <div className="border-x border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Age</div>
                  <div className="text-white font-bold text-xs mt-0.5">{appleAppStore.ageRating}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Category</div>
                  <div className="text-cyan-400 font-bold text-xs mt-0.5">{appleAppStore.primaryCategory}</div>
                </div>
              </div>

              {/* Promotional Text Box */}
              <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/30 text-xs text-purple-200">
                <span className="text-[10px] text-pink-400 font-bold uppercase block mb-0.5">
                  Promotional Highlight
                </span>
                {appleAppStore.promotionalText}
              </div>

              {/* iOS Screenshots Preview */}
              <div className="mt-4">
                <div className="text-[11px] font-semibold text-slate-300 mb-2">App Preview & Screenshots</div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {appleAppStore.screenshots.map((s: { title: string; tagline: string }, idx: number) => (
                    <div
                      key={idx}
                      onClick={() => setActiveScreenshotIndex(idx)}
                      className={`min-w-[110px] h-[190px] rounded-2xl border p-2 flex flex-col justify-between cursor-pointer transition ${
                        activeScreenshotIndex === idx
                          ? 'border-cyan-400 bg-purple-950/60 shadow-md shadow-cyan-400/20'
                          : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-[10px] font-bold text-cyan-400">{s.title}</div>
                      <div className="flex-1 my-2 rounded-xl bg-slate-950/80 border border-cyan-800/20 flex flex-col items-center justify-center p-2 text-center">
                        {idx === 0 && <Radio className="w-6 h-6 text-cyan-400" />}
                        {idx === 1 && <Users className="w-6 h-6 text-pink-400" />}
                        {idx === 2 && <Gift className="w-6 h-6 text-amber-400" />}
                        {idx === 3 && <Trophy className="w-6 h-6 text-purple-400" />}
                        {idx === 4 && <MessageCircle className="w-6 h-6 text-emerald-400" />}
                        <span className="text-[9px] text-slate-300 mt-2 font-medium">{s.tagline}</span>
                      </div>
                      <div className="text-[8px] text-slate-400 text-center font-mono">1290x2796</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* iOS App Store Metadata Specs */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 bg-slate-900/60 border border-purple-800/30 rounded-2xl backdrop-blur-md">
              <h3 className="font-bold text-white text-base flex items-center gap-2 mb-3">
                <Apple className="w-4 h-4 text-cyan-400" />
                Apple App Store Listing Specifications
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-purple-800/20">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                    iOS Bundle Identifier
                  </span>
                  <span className="text-cyan-400 font-mono font-bold">{appleAppStore.bundleId}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-purple-800/20">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                    Target Deployment & Architecture
                  </span>
                  <span className="text-white font-mono">{appleAppStore.targetIos} (Min: {appleAppStore.minIos})</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-purple-800/20">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                    App Store Keywords (100 characters max)
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {appleAppStore.keywords.map((kw: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-800/40 text-purple-300 text-[11px]">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-purple-800/20">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                    Full Description
                  </span>
                  <p className="text-slate-300 mt-1 whitespace-pre-line leading-relaxed">
                    {isDescriptionExpanded
                      ? appleAppStore.fullDescription
                      : `${appleAppStore.fullDescription.slice(0, 320)}...`}
                  </p>
                  <button
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="text-cyan-400 font-semibold text-xs mt-2 hover:underline"
                  >
                    {isDescriptionExpanded ? 'Collapse Full Text' : 'Read Full Description'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
