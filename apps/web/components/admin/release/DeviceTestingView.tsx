'use client';

import React, { useState } from 'react';
import {
  Smartphone,
  Tablet,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Monitor,
  Apple,
  RotateCcw
} from 'lucide-react';
import { DeviceTestRecord } from './releaseTypes';
import { ReleaseEmptyStates } from './ReleaseEmptyStates';

interface DeviceTestingViewProps {
  deviceTests: DeviceTestRecord[];
}

export const DeviceTestingView: React.FC<DeviceTestingViewProps> = ({ deviceTests }) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDevices = deviceTests.filter((dev) => {
    const matchesPlatform = selectedPlatform === 'all' || dev.platform === selectedPlatform;
    const matchesSearch =
      dev.deviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.operatingSystem.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.screenSize.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.testNotes.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  const getStatusBadge = (status: DeviceTestRecord['testStatus']) => {
    switch (status) {
      case 'Passed':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Passed with Minor':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'In Progress':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 animate-pulse';
      case 'Pending':
      default:
        return 'bg-slate-700/40 text-slate-400 border-slate-600/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900/40 via-indigo-950/40 to-slate-900/40 border border-purple-700/30 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Device Compatibility Matrix
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-normal">
                  8 Device Baselines Tested
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Verified responsive rendering, notch/dynamic island safe areas, and performance across Android and iOS form factors.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 pt-5 border-t border-purple-800/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-[240px] max-w-md relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search devices (Pixel 8, iPhone 16 Pro Max, OS...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900/60 border border-purple-800/40 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-1">
              <Filter className="w-3.5 h-3.5 text-purple-400" /> Platform:
            </div>
            {['all', 'Android', 'iOS'].map((plat) => (
              <button
                key={plat}
                onClick={() => setSelectedPlatform(plat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  selectedPlatform === plat
                    ? 'bg-cyan-600/30 text-cyan-200 border border-cyan-500/40'
                    : 'bg-slate-800/40 text-slate-400 hover:text-white border border-slate-700/30'
                }`}
              >
                {plat === 'all' ? 'All Devices' : plat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Devices */}
      {filteredDevices.length === 0 ? (
        <ReleaseEmptyStates
          kind="no_search_results"
          onAction={() => {
            setSelectedPlatform('all');
            setSearchQuery('');
          }}
          actionLabel="Clear Device Filters"
          customMessage="No physical or simulated devices match your query."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {filteredDevices.map((dev) => (
            <div
              key={dev.id}
              className="p-5 bg-slate-900/60 border border-purple-800/30 hover:border-purple-600/50 rounded-2xl backdrop-blur-md transition group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {dev.deviceCategory.includes('Tablet') || dev.deviceCategory === 'iPad' ? (
                      <Tablet className="w-4 h-4 text-purple-400" />
                    ) : (
                      <Smartphone className="w-4 h-4 text-cyan-400" />
                    )}
                    <span className="font-mono text-xs text-slate-400">{dev.id}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusBadge(dev.testStatus)}`}>
                    {dev.testStatus}
                  </span>
                </div>

                <div className="mt-3">
                  <h3 className="font-bold text-white text-sm group-hover:text-cyan-300 transition">
                    {dev.deviceName}
                  </h3>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {dev.operatingSystem} • {dev.deviceCategory}
                  </div>
                </div>

                <div className="mt-3 p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/20 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Display:</span>
                    <span className="text-white font-mono">{dev.screenSize}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Platform:</span>
                    <span className="text-purple-300 font-medium flex items-center gap-1">
                      {dev.platform === 'Android' ? (
                        <Smartphone className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Apple className="w-3 h-3 text-cyan-400" />
                      )}
                      {dev.platform}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mt-3 line-clamp-3 leading-relaxed">
                  {dev.testNotes}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-purple-800/20 text-[10px] text-slate-500 font-mono flex items-center justify-between">
                <span>Verified: {dev.lastTestDate}</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Safe Area Valid
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
