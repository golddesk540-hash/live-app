'use client';

import React, { useState } from 'react';
import {
  Smartphone,
  Apple,
  CheckCircle2,
  Clock,
  Layers,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Download,
  Info,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Cpu,
  HardDrive,
  KeyRound
} from 'lucide-react';
import { AppVersionRecord, BuildRecord, ReleasePlatform, ReleaseChannel } from './releaseTypes';

interface PlatformReleaseViewProps {
  currentVersion: AppVersionRecord;
  builds: BuildRecord[];
  initialPlatform?: ReleasePlatform;
}

export const PlatformReleaseView: React.FC<PlatformReleaseViewProps> = ({
  currentVersion,
  builds,
  initialPlatform = 'Android'
}) => {
  const [platform, setPlatform] = useState<ReleasePlatform>(
    initialPlatform === 'iOS' ? 'iOS' : 'Android'
  );
  const [selectedChannel, setSelectedChannel] = useState<string>(
    platform === 'Android' ? 'Closed Testing' : 'TestFlight Testing'
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Platform specific active build
  const platformBuild = builds.find(b => b.platform === platform) || builds[0];

  return (
    <div className="space-y-6 text-white animate-fade-in">
      {/* Platform Switcher Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#170836] via-[#120726] to-[#1c0840] border border-purple-800/50 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {platform === 'Android' ? (
              <Smartphone className="w-6 h-6 text-emerald-400" />
            ) : (
              <Apple className="w-6 h-6 text-cyan-400" />
            )}
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {platform === 'Android' ? 'Android Release Management' : 'iOS Release Management'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-purple-300/70 mt-1 max-w-xl">
            {platform === 'Android'
              ? 'Google Play Console release channels, Android App Bundle (AAB) packaging, target API 35 compliance, and Play Integrity.'
              : 'Apple App Store Connect, TestFlight external beta distribution, Xcode 16 signing, and App Tracking Transparency governance.'}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1.5 p-1.5 bg-black/50 rounded-2xl border border-purple-900/50">
          <button
            onClick={() => {
              setPlatform('Android');
              setSelectedChannel('Closed Testing');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              platform === 'Android'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                : 'text-purple-300/80 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Android (Google Play)</span>
          </button>
          <button
            onClick={() => {
              setPlatform('iOS');
              setSelectedChannel('TestFlight Testing');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              platform === 'iOS'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                : 'text-purple-300/80 hover:text-white'
            }`}
          >
            <Apple className="w-4 h-4" />
            <span>iOS (App Store)</span>
          </button>
        </div>
      </div>

      {/* Main Platform Details Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Build Specifications & Release Channel */}
        <div className="lg:col-span-8 space-y-6">
          {/* Release Channel Selector Bar */}
          <div className="p-4 rounded-2xl bg-[#120726]/90 border border-purple-900/40 shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-purple-200">Release Stage Channel</span>
              <span className="text-purple-400 font-mono">
                {platform === 'Android' ? 'Track: Closed Testing' : 'Track: TestFlight External'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(platform === 'Android'
                ? ['Internal Testing', 'Closed Testing', 'Open Testing', 'Production']
                : ['Development', 'Internal Testing', 'TestFlight Preparation', 'TestFlight Testing']
              ).map(channel => (
                <button
                  key={channel}
                  onClick={() => setSelectedChannel(channel)}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex flex-col justify-between ${
                    selectedChannel === channel
                      ? platform === 'Android'
                        ? 'bg-emerald-500/20 border-emerald-500/60 text-white shadow-md shadow-emerald-500/20'
                        : 'bg-cyan-500/20 border-cyan-500/60 text-white shadow-md shadow-cyan-500/20'
                      : 'bg-purple-950/30 border-purple-900/30 text-purple-300/70 hover:text-white hover:bg-purple-900/40'
                  }`}
                >
                  <span className="truncate">{channel}</span>
                  <span className="text-[10px] font-normal text-purple-400 mt-1">
                    {selectedChannel === channel ? 'Active Target' : 'Configured'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Core Technical Specifications Grid */}
          <div className="p-6 rounded-3xl bg-[#120726]/90 border border-purple-900/50 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-purple-900/40">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    platform === 'Android'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  }`}
                >
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Platform Build Specifications</h3>
                  <p className="text-xs text-purple-300/60">Staged binary verification checklist</p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Passed Verification
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-900/30 space-y-1">
                <span className="text-purple-300/60 text-[11px] block">App Version</span>
                <span className="font-bold text-white text-sm">{currentVersion.versionName}</span>
              </div>
              <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-900/30 space-y-1">
                <span className="text-purple-300/60 text-[11px] block">
                  {platform === 'Android' ? 'Version Code' : 'Build Number'}
                </span>
                <span className="font-bold text-white text-sm">
                  {platform === 'Android' ? currentVersion.versionCode : platformBuild.buildNumber}
                </span>
              </div>
              <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-900/30 space-y-1">
                <span className="text-purple-300/60 text-[11px] block">Package Artifact</span>
                <span className="font-bold text-pink-400 text-sm">{platformBuild.buildType}</span>
              </div>
              <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-900/30 space-y-1">
                <span className="text-purple-300/60 text-[11px] block">Minimum OS Supported</span>
                <span className="font-bold text-white text-sm">
                  {platform === 'Android' ? 'Android 8.0 (API 26)' : 'iOS 15.0'}
                </span>
              </div>
              <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-900/30 space-y-1">
                <span className="text-purple-300/60 text-[11px] block">Target OS Version</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {platform === 'Android' ? 'Android 15 (API 35)' : 'iOS 18.1'}
                </span>
              </div>
              <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-900/30 space-y-1">
                <span className="text-purple-300/60 text-[11px] block">Binary File Size</span>
                <span className="font-bold text-white text-sm">{platformBuild.fileSizeMb} MB</span>
              </div>
            </div>

            {/* Cryptographic Signing Status */}
            <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-900/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold text-white">
                    {platform === 'Android' ? 'Google Play App Signing (PEPDK v2)' : 'Apple Distribution Certificate'}
                  </div>
                  <div className="text-[11px] text-purple-300/60">
                    SHA-256 Fingerprint: <code>4B:E8:90:F1:62:3C:A8:12:00:D4:E8:29</code>
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                SIGNED
              </span>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Platform Compliance & Release Notes Preview */}
        <div className="lg:col-span-4 space-y-6">
          {/* Release Readiness Card */}
          <div className="p-6 rounded-3xl bg-[#120726]/90 border border-purple-900/50 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Platform Store Compliance</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              {(platform === 'Android'
                ? [
                    '64-bit native Agora libraries verified',
                    'Target API 35 (Android 15) requirement met',
                    'Google Play Data Safety disclosures match',
                    'Play Asset Delivery bundle under 150MB',
                    'Zero background location permission leaks'
                  ]
                : [
                    'App Tracking Transparency (ATT) sheet staged',
                    'Camera & Microphone NSUsage strings compliant',
                    'StoreKit 2 auto-renewable subscriptions tested',
                    'Export compliance encryption exemption (NO)',
                    'iOS 18.1 Dynamic Island padding confirmed'
                  ]
              ).map((check, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-purple-200">{check}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-purple-900/40">
              <button
                onClick={() => setIsDetailsOpen(true)}
                className="w-full py-2.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700/50 text-xs font-bold text-purple-200 hover:text-white flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Inspect Full Build Log</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Release Notes Highlight */}
          <div className="p-5 rounded-3xl bg-[#120726]/90 border border-purple-900/50 shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-purple-200">
                <FileText className="w-3.5 h-3.5 text-pink-400" /> What's New in this Build
              </span>
              <span className="text-[10px] text-purple-400 font-mono">v1.0.0</span>
            </div>
            <p className="text-xs text-purple-300/80 leading-relaxed">
              Official Phase 10 Gold Master Release with full executive administrative suite, Agora 1080p60 ultra live streaming, PK Battle 6.3, and multi-language support.
            </p>
          </div>
        </div>
      </div>

      {/* FULL BUILD LOG MODAL */}
      {isDetailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-[#130728] border border-purple-800 rounded-3xl p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-purple-900/40">
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-5 h-5 text-pink-400" />
                <h3 className="font-bold text-base">Build Manifest & Pipeline Log &bull; {platformBuild.id}</h3>
              </div>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="p-1 rounded-lg text-purple-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="bg-black/60 rounded-2xl p-4 font-mono text-[11px] text-emerald-300 space-y-1.5 max-h-72 overflow-y-auto custom-scrollbar">
              <div>[BUILD SYSTEM] Gradle 8.7 / Xcode 16.1 Native Toolchain</div>
              <div>[COMMIT] Commit {platformBuild.commitHash} verified on branch origin/main</div>
              <div>[OPTIMIZE] R8 ProGuard code shrinking completed &bull; Saved 14.2 MB</div>
              <div>[PACKAGING] Generated {platformBuild.buildType} ({platformBuild.fileSizeMb} MB)</div>
              <div>[SIGNING] Cryptographic certificate hash verified: OK</div>
              <div>[COMPLIANCE] Target SDK: {platform === 'Android' ? 'API 35' : 'iOS 18.1'} &bull; PASSED</div>
              <div>[INTEGRITY] Zero vulnerable binary dependencies detected &bull; PASSED</div>
              <div className="text-white font-bold pt-2">&gt;&gt; Staging ready for release rehearsal pipeline.</div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-pink-500 hover:bg-pink-600 text-white transition-all"
              >
                Close Manifest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
