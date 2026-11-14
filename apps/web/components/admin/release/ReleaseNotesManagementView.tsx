'use client';

import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Globe,
  Save,
  CheckCircle2,
  Copy,
  Layers,
  Sparkles,
  Smartphone,
  Apple
} from 'lucide-react';
import { ReleaseNotesRecord } from './releaseTypes';

interface ReleaseNotesManagementViewProps {
  releaseNotes: ReleaseNotesRecord[];
  onSaveNotes?: (notes: ReleaseNotesRecord) => void;
}

export const ReleaseNotesManagementView: React.FC<ReleaseNotesManagementViewProps> = ({
  releaseNotes,
  onSaveNotes
}) => {
  const [selectedNote, setSelectedNote] = useState<ReleaseNotesRecord>(
    releaseNotes[0] || {
      id: 'RN-100',
      appVersion: 'v1.0.0',
      platform: 'Cross-Platform',
      releaseTitle: 'Phase 10 Gold Master Launch',
      newFeatures: ['Master Admin Suite', 'Live Monitoring', 'Child Safety Console'],
      improvements: ['Agora RTC 45ms latency', 'Dynamic memory caching'],
      bugFixes: ['Fixed notification deep links', 'Resolved audio ducking on incoming call'],
      releaseDate: '2026-11-14',
      status: 'Approved',
      languagesCount: 8
    }
  );

  const [activeLanguage, setActiveLanguage] = useState<string>('English');
  const [newFeatureInput, setNewFeatureInput] = useState('');
  const [newImprovementInput, setNewImprovementInput] = useState('');
  const [newFixInput, setNewFixInput] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const supportedLanguages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' }
  ];

  const handleAddFeature = () => {
    if (!newFeatureInput.trim()) return;
    setSelectedNote({
      ...selectedNote,
      newFeatures: [...selectedNote.newFeatures, newFeatureInput.trim()]
    });
    setNewFeatureInput('');
  };

  const handleRemoveFeature = (idx: number) => {
    setSelectedNote({
      ...selectedNote,
      newFeatures: selectedNote.newFeatures.filter((_, i) => i !== idx)
    });
  };

  const handleAddImprovement = () => {
    if (!newImprovementInput.trim()) return;
    setSelectedNote({
      ...selectedNote,
      improvements: [...selectedNote.improvements, newImprovementInput.trim()]
    });
    setNewImprovementInput('');
  };

  const handleRemoveImprovement = (idx: number) => {
    setSelectedNote({
      ...selectedNote,
      improvements: selectedNote.improvements.filter((_, i) => i !== idx)
    });
  };

  const handleAddFix = () => {
    if (!newFixInput.trim()) return;
    setSelectedNote({
      ...selectedNote,
      bugFixes: [...selectedNote.bugFixes, newFixInput.trim()]
    });
    setNewFixInput('');
  };

  const handleRemoveFix = (idx: number) => {
    setSelectedNote({
      ...selectedNote,
      bugFixes: selectedNote.bugFixes.filter((_, i) => i !== idx)
    });
  };

  const handleSave = () => {
    if (onSaveNotes) {
      onSaveNotes(selectedNote);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900/40 via-indigo-950/40 to-slate-900/40 border border-purple-700/30 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-pink-500/20 border border-pink-500/30 rounded-xl text-pink-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Release Notes & Multi-Language Changelog
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-normal">
                  8 Locales Supported
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Author and review consumer-facing "What's New" release notes for Google Play Store and Apple TestFlight/App Store.
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-pink-500/25 active:scale-95"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                Saved to Local State!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Release Notes
              </>
            )}
          </button>
        </div>

        {/* Language Switcher Bar */}
        <div className="mt-6 pt-5 border-t border-purple-800/20 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <Globe className="w-4 h-4 text-purple-400 shrink-0 mr-1" />
          {supportedLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setActiveLanguage(lang.name)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                activeLanguage === lang.name
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700/40'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Editor & Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor Form */}
        <div className="lg:col-span-7 space-y-5 bg-slate-900/60 border border-purple-800/30 rounded-2xl p-6 backdrop-blur-md">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target App Version
              </label>
              <input
                type="text"
                value={selectedNote.appVersion}
                onChange={(e) => setSelectedNote({ ...selectedNote, appVersion: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950/80 border border-purple-800/40 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Platform Scope
              </label>
              <select
                value={selectedNote.platform}
                onChange={(e) => setSelectedNote({ ...selectedNote, platform: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-950/80 border border-purple-800/40 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
              >
                <option value="Cross-Platform">Cross-Platform</option>
                <option value="Android">Android</option>
                <option value="iOS">iOS</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Release Announcement Headline
            </label>
            <input
              type="text"
              value={selectedNote.releaseTitle}
              onChange={(e) => setSelectedNote({ ...selectedNote, releaseTitle: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950/80 border border-purple-800/40 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
            />
          </div>

          {/* New Features Builder */}
          <div className="space-y-2 pt-2 border-t border-purple-800/20">
            <label className="block text-xs font-semibold text-pink-400">
              ✨ New Features & Capabilities
            </label>
            <div className="space-y-1.5">
              {selectedNote.newFeatures.map((feat, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/60 border border-purple-800/20 text-xs text-slate-200">
                  <span>• {feat}</span>
                  <button
                    onClick={() => handleRemoveFeature(idx)}
                    className="text-slate-500 hover:text-red-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                placeholder="Add new feature bullet..."
                value={newFeatureInput}
                onChange={(e) => setNewFeatureInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                className="flex-1 px-3 py-1.5 bg-slate-950/80 border border-purple-800/40 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
              />
              <button
                onClick={handleAddFeature}
                className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-xs font-semibold transition"
              >
                Add
              </button>
            </div>
          </div>

          {/* Improvements Builder */}
          <div className="space-y-2 pt-2 border-t border-purple-800/20">
            <label className="block text-xs font-semibold text-cyan-400">
              ⚡ Performance & UI Improvements
            </label>
            <div className="space-y-1.5">
              {selectedNote.improvements.map((imp, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/60 border border-purple-800/20 text-xs text-slate-200">
                  <span>• {imp}</span>
                  <button
                    onClick={() => handleRemoveImprovement(idx)}
                    className="text-slate-500 hover:text-red-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                placeholder="Add performance improvement..."
                value={newImprovementInput}
                onChange={(e) => setNewImprovementInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImprovement())}
                className="flex-1 px-3 py-1.5 bg-slate-950/80 border border-purple-800/40 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleAddImprovement}
                className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-xs font-semibold transition"
              >
                Add
              </button>
            </div>
          </div>

          {/* Bug Fixes Builder */}
          <div className="space-y-2 pt-2 border-t border-purple-800/20">
            <label className="block text-xs font-semibold text-emerald-400">
              🛠️ Bug Fixes & Stability Patches
            </label>
            <div className="space-y-1.5">
              {selectedNote.bugFixes.map((fix, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/60 border border-purple-800/20 text-xs text-slate-200">
                  <span>• {fix}</span>
                  <button
                    onClick={() => handleRemoveFix(idx)}
                    className="text-slate-500 hover:text-red-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                placeholder="Add bug fix description..."
                value={newFixInput}
                onChange={(e) => setNewFixInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFix())}
                className="flex-1 px-3 py-1.5 bg-slate-950/80 border border-purple-800/40 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleAddFix}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold transition"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Live Formatted Preview Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-gradient-to-b from-purple-950/40 to-slate-900/60 border border-purple-700/30 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-purple-800/20">
              <span className="text-xs text-slate-400 font-semibold uppercase">
                Storefront What's New Preview ({activeLanguage})
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                {selectedNote.appVersion}
              </span>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <h4 className="font-bold text-white text-sm">
                {selectedNote.releaseTitle}
              </h4>

              {selectedNote.newFeatures.length > 0 && (
                <div>
                  <div className="font-semibold text-pink-400 mb-1">What's New:</div>
                  <ul className="space-y-1 text-slate-300">
                    {selectedNote.newFeatures.map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-pink-400">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedNote.improvements.length > 0 && (
                <div>
                  <div className="font-semibold text-cyan-400 mb-1">Improvements:</div>
                  <ul className="space-y-1 text-slate-300">
                    {selectedNote.improvements.map((m, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-cyan-400">•</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedNote.bugFixes.length > 0 && (
                <div>
                  <div className="font-semibold text-emerald-400 mb-1">Bug Fixes:</div>
                  <ul className="space-y-1 text-slate-300">
                    {selectedNote.bugFixes.map((x, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-400">•</span>
                        <span>{x}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
