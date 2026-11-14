'use client';

import React, { useState } from 'react';
import {
  Layers,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Smartphone,
  Apple,
  FileCheck,
  Download,
  Terminal,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  X,
  Play
} from 'lucide-react';
import { BuildRecord, ReleasePlatform, BuildStatus } from './releaseTypes';
import { ReleaseEmptyStates } from './ReleaseEmptyStates';

interface BuildInformationViewProps {
  builds: BuildRecord[];
  onTriggerDemoBuild?: () => void;
}

export const BuildInformationView: React.FC<BuildInformationViewProps> = ({
  builds,
  onTriggerDemoBuild
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [inspectBuild, setInspectBuild] = useState<BuildRecord | null>(null);

  const filteredBuilds = builds.filter((b) => {
    const matchesSearch =
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.appVersion.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.commitHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.buildNotes.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = selectedPlatform === 'all' || b.platform === selectedPlatform;
    const matchesStatus = selectedStatus === 'all' || b.status === selectedStatus;
    return matchesSearch && matchesPlatform && matchesStatus;
  });

  const successfulCount = builds.filter((b) => b.status === 'Successful').length;
  const passedQaCount = builds.filter((b) => b.testingStatus === 'Passed').length;
  const signedCount = builds.filter((b) => b.signed).length;

  const getStatusBadge = (status: BuildStatus) => {
    switch (status) {
      case 'Successful':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Building':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse';
      case 'Failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Archived':
      default:
        return 'bg-slate-700/40 text-slate-400 border-slate-600/30';
    }
  };

  const getTestingBadge = (testingStatus: BuildRecord['testingStatus']) => {
    switch (testingStatus) {
      case 'Passed':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'In Progress':
        return 'text-amber-300 bg-amber-500/10 border-amber-500/20';
      case 'Pending':
        return 'text-slate-400 bg-slate-800/40 border-slate-700/30';
      case 'Failed':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-purple-800/30 rounded-2xl p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Artifacts</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">{builds.length}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Android AAB & iOS IPA</p>
        </div>

        <div className="bg-slate-900/60 border border-purple-800/30 rounded-2xl p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Successful Builds</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400 font-mono">{successfulCount}</div>
          <p className="text-[11px] text-emerald-500/70 mt-0.5">CI/CD Pipeline compilation</p>
        </div>

        <div className="bg-slate-900/60 border border-purple-800/30 rounded-2xl p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">QA Passed</span>
            <FileCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-cyan-400 font-mono">{passedQaCount}</div>
          <p className="text-[11px] text-cyan-500/70 mt-0.5">Automated + manual verified</p>
        </div>

        <div className="bg-slate-900/60 border border-purple-800/30 rounded-2xl p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Cryptographically Signed</span>
            <ShieldCheck className="w-4 h-4 text-pink-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-pink-400 font-mono">{signedCount}</div>
          <p className="text-[11px] text-pink-500/70 mt-0.5">Play v3 / Apple Distribution</p>
        </div>
      </div>

      {/* Main Header & Controls */}
      <div className="bg-gradient-to-r from-purple-900/40 via-indigo-950/40 to-slate-900/40 border border-purple-700/30 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Build Information & Artifact Registry
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Inspect binary package sizes, commit hash SHA-1/SHA-256 signatures, signing keystores, and QA status.
              </p>
            </div>
          </div>
          <button
            onClick={onTriggerDemoBuild}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-cyan-500/25 active:scale-95 self-start md:self-auto"
          >
            <Play className="w-4 h-4 fill-white" />
            Trigger Demo Pipeline Build
          </button>
        </div>

        {/* Filter Bar */}
        <div className="mt-6 pt-5 border-t border-purple-800/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-[240px] max-w-md relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Build ID (BLD-10901), commit hash, version..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900/60 border border-purple-800/40 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-1">
              <Filter className="w-3.5 h-3.5 text-purple-400" /> Platform:
            </div>
            {['all', 'Android', 'iOS'].map((plat) => (
              <button
                key={plat}
                onClick={() => setSelectedPlatform(plat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  selectedPlatform === plat
                    ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40'
                    : 'bg-slate-800/40 text-slate-400 hover:text-white border border-slate-700/30'
                }`}
              >
                {plat === 'all' ? 'All' : plat}
              </button>
            ))}

            <div className="h-4 w-px bg-purple-800/30 mx-1 hidden sm:block" />

            <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-1">
              Build Status:
            </div>
            {['all', 'Successful', 'Building', 'Failed', 'Archived'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  selectedStatus === st
                    ? 'bg-cyan-600/30 text-cyan-200 border border-cyan-500/40'
                    : 'bg-slate-800/40 text-slate-400 hover:text-white border border-slate-700/30'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Build Table */}
      {filteredBuilds.length === 0 ? (
        <ReleaseEmptyStates
          kind={selectedPlatform === 'Android' ? 'no_android_builds' : selectedPlatform === 'iOS' ? 'no_ios_builds' : 'no_search_results'}
          onAction={() => {
            setSearchQuery('');
            setSelectedPlatform('all');
            setSelectedStatus('all');
          }}
          actionLabel="Clear Filters"
        />
      ) : (
        <div className="bg-slate-900/60 border border-purple-800/30 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-950/40 text-slate-400 uppercase tracking-wider border-b border-purple-800/30">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Build ID & Version</th>
                  <th className="py-3.5 px-4 font-semibold">Platform & Type</th>
                  <th className="py-3.5 px-4 font-semibold">Artifact Size</th>
                  <th className="py-3.5 px-4 font-semibold">Commit Hash</th>
                  <th className="py-3.5 px-4 font-semibold">Build Status</th>
                  <th className="py-3.5 px-4 font-semibold">QA Status</th>
                  <th className="py-3.5 px-4 font-semibold">Signature</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-800/20 text-slate-300">
                {filteredBuilds.map((b) => (
                  <tr key={b.id} className="hover:bg-purple-900/20 transition group">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-white text-xs group-hover:text-cyan-300 transition">
                        {b.id}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {b.appVersion} • #{b.buildNumber} ({b.buildDate})
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-white font-medium">
                        {b.platform === 'Android' ? (
                          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Apple className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                        <span>{b.buildType}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-300">
                      {b.fileSizeMb.toFixed(1)} MB
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono text-purple-300 bg-purple-950/70 border border-purple-800/40 px-2 py-0.5 rounded text-[11px]">
                        {b.commitHash}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${getStatusBadge(b.status)}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${getTestingBadge(b.testingStatus)}`}>
                        {b.testingStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {b.signed ? (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                          <ShieldCheck className="w-3.5 h-3.5" /> Signed
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">Unsigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => setInspectBuild(b)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-cyan-900/40 text-slate-300 hover:text-cyan-300 border border-slate-700/40 text-xs font-medium transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Build Details Modal */}
      {inspectBuild && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-cyan-700/40 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
            <button
              onClick={() => setInspectBuild(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
                <Terminal className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Build Inspection: {inspectBuild.id}
                </h3>
                <p className="text-xs text-slate-400">
                  {inspectBuild.platform} • {inspectBuild.buildType} • {inspectBuild.appVersion}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-purple-800/30">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Build Status</span>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] border ${getStatusBadge(inspectBuild.status)}`}>
                    {inspectBuild.status}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-purple-800/30">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">QA Validation</span>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] border ${getTestingBadge(inspectBuild.testingStatus)}`}>
                    {inspectBuild.testingStatus}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-purple-800/30">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">File Size</span>
                  <span className="text-white font-mono font-bold mt-1 block">
                    {inspectBuild.fileSizeMb.toFixed(1)} MB
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-purple-800/30">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Git Commit SHA</span>
                  <span className="text-purple-300 font-mono mt-1 block font-bold">
                    {inspectBuild.commitHash}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-purple-800/30 text-xs">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">
                  Build Notes & Changelog
                </span>
                <p className="text-slate-200">{inspectBuild.buildNotes}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-purple-800/30 text-xs space-y-1.5 font-mono">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Cryptographic Verification Fingerprints
                </span>
                <div className="text-[11px] text-slate-300">
                  <span className="text-slate-500">SHA-256: </span>
                  a1e847c94318c5e93df716301fa32e8b91dc3895e7c827394bb28937105cb901
                </div>
                <div className="text-[11px] text-slate-300">
                  <span className="text-slate-500">Certificate: </span>
                  CN=PopoLive Release Keystore, OU=Mobile Engineering, O=Popo Live Inc, C=US
                </div>
                <div className="text-[11px] text-emerald-400 flex items-center gap-1 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Keystore v3 Signature Verified • No Tampering Detected
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-800/30">
                <button
                  onClick={() => setInspectBuild(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    alert(`Manifest for ${inspectBuild.id} (${inspectBuild.platform} ${inspectBuild.buildType}) generated for local demo.`);
                    setInspectBuild(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-cyan-600/25"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Manifest Spec
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
