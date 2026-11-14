'use client';

import React, { useState } from 'react';
import {
  Tag,
  Search,
  Filter,
  Plus,
  Edit2,
  Eye,
  CheckCircle,
  Clock,
  Layers,
  Smartphone,
  Apple,
  ExternalLink,
  ChevronRight,
  X,
  AlertCircle
} from 'lucide-react';
import { AppVersionRecord, ReleasePlatform, ReleaseChannel } from './releaseTypes';
import { ReleaseEmptyStates } from './ReleaseEmptyStates';

interface AppVersionManagementViewProps {
  versions: AppVersionRecord[];
  onUpdateVersion?: (version: AppVersionRecord) => void;
  onCreateVersion?: (version: AppVersionRecord) => void;
}

export const AppVersionManagementView: React.FC<AppVersionManagementViewProps> = ({
  versions,
  onUpdateVersion,
  onCreateVersion
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedVersion, setSelectedVersion] = useState<AppVersionRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Edit/Create form state
  const [formData, setFormData] = useState<Partial<AppVersionRecord>>({});

  const filteredVersions = versions.filter((v) => {
    const matchesSearch =
      v.versionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.releaseNotes.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = selectedPlatform === 'all' || v.platform === selectedPlatform;
    const matchesStatus = selectedStatus === 'all' || v.status === selectedStatus;
    return matchesSearch && matchesPlatform && matchesStatus;
  });

  const handleOpenEdit = (v: AppVersionRecord) => {
    setSelectedVersion(v);
    setFormData({ ...v });
    setIsEditing(true);
  };

  const handleOpenCreate = () => {
    const nextCode = Math.max(...versions.map((v) => v.versionCode), 100) + 1;
    const newVer: Partial<AppVersionRecord> = {
      id: `VER-${nextCode}`,
      versionName: `v1.0.${nextCode - 100}`,
      versionCode: nextCode,
      platform: 'Cross-Platform',
      buildNumber: 105,
      releaseDate: new Date().toISOString().split('T')[0],
      status: 'Alpha',
      channel: 'Internal Testing',
      releaseNotes: 'Incremental sprint build with stability improvements and security patches.',
      minOsVersion: 'Android 8.0 / iOS 15.0',
      targetOsVersion: 'Android 15 / iOS 18.1'
    };
    setFormData(newVer);
    setIsCreating(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.versionName || !formData.versionCode) return;

    if (isEditing && selectedVersion) {
      const updated: AppVersionRecord = {
        ...selectedVersion,
        ...formData
      } as AppVersionRecord;
      if (onUpdateVersion) onUpdateVersion(updated);
      setIsEditing(false);
      setSelectedVersion(null);
    } else if (isCreating) {
      const created: AppVersionRecord = {
        id: formData.id || `VER-${Date.now().toString().slice(-4)}`,
        versionName: formData.versionName || 'v1.0.1',
        versionCode: Number(formData.versionCode) || 105,
        platform: formData.platform || 'Cross-Platform',
        buildNumber: Number(formData.buildNumber) || 105,
        releaseDate: formData.releaseDate || new Date().toISOString().split('T')[0],
        status: (formData.status as any) || 'Alpha',
        channel: (formData.channel as any) || 'Internal Testing',
        releaseNotes: formData.releaseNotes || 'New release draft.',
        minOsVersion: formData.minOsVersion || 'Android 8.0 / iOS 15.0',
        targetOsVersion: formData.targetOsVersion || 'Android 15 / iOS 18.1'
      };
      if (onCreateVersion) onCreateVersion(created);
      setIsCreating(false);
    }
  };

  const getStatusBadge = (status: AppVersionRecord['status']) => {
    switch (status) {
      case 'Production':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Staged':
        return 'bg-pink-500/20 text-pink-400 border-pink-500/30 font-semibold shadow-sm shadow-pink-500/20';
      case 'Beta':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'Alpha':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Archived':
      default:
        return 'bg-slate-700/40 text-slate-400 border-slate-600/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-purple-900/40 via-indigo-950/40 to-slate-900/40 border border-purple-700/30 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-pink-500/20 border border-pink-500/30 rounded-xl text-pink-400">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                App Version Management
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-normal">
                  {versions.length} Versions Registered
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Maintain semantic version milestones, target SDK baselines, deployment channels, and changelog records.
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-pink-500/25 active:scale-95 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            Create Version Milestone
          </button>
        </div>

        {/* Filter Bar */}
        <div className="mt-6 pt-5 border-t border-purple-800/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-[240px] max-w-md relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by version (v1.0.0), code, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900/60 border border-purple-800/40 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-pink-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-1">
              <Filter className="w-3.5 h-3.5 text-purple-400" /> Platform:
            </div>
            {['all', 'Cross-Platform', 'Android', 'iOS'].map((plat) => (
              <button
                key={plat}
                onClick={() => setSelectedPlatform(plat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  selectedPlatform === plat
                    ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40'
                    : 'bg-slate-800/40 text-slate-400 hover:text-white border border-slate-700/30'
                }`}
              >
                {plat === 'all' ? 'All Platforms' : plat}
              </button>
            ))}

            <div className="h-4 w-px bg-purple-800/30 mx-1 hidden sm:block" />

            <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-1">
              Status:
            </div>
            {['all', 'Staged', 'Production', 'Beta', 'Alpha', 'Archived'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  selectedStatus === st
                    ? 'bg-pink-600/30 text-pink-200 border border-pink-500/40'
                    : 'bg-slate-800/40 text-slate-400 hover:text-white border border-slate-700/30'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Versions Table / List */}
      {filteredVersions.length === 0 ? (
        <ReleaseEmptyStates
          kind="no_release_records"
          onAction={() => {
            setSearchQuery('');
            setSelectedPlatform('all');
            setSelectedStatus('all');
          }}
          actionLabel="Clear Filters"
          customMessage="No application versions match your search criteria. Try modifying your search or resetting filters."
        />
      ) : (
        <div className="bg-slate-900/60 border border-purple-800/30 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-950/40 text-slate-400 uppercase tracking-wider border-b border-purple-800/30">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Version & Build</th>
                  <th className="py-3.5 px-4 font-semibold">Platform & OS Target</th>
                  <th className="py-3.5 px-4 font-semibold">Channel</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Release Date</th>
                  <th className="py-3.5 px-4 font-semibold">Changelog Preview</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-800/20 text-slate-300">
                {filteredVersions.map((v) => (
                  <tr
                    key={v.id}
                    className="hover:bg-purple-900/20 transition group"
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center font-mono font-bold text-pink-400 text-xs">
                          {v.versionCode}
                        </div>
                        <div>
                          <span className="font-bold text-white text-sm group-hover:text-pink-300 transition">
                            {v.versionName}
                          </span>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {v.id} • Build #{v.buildNumber}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium text-white">
                        {v.platform === 'Android' && <Smartphone className="w-3.5 h-3.5 text-emerald-400" />}
                        {v.platform === 'iOS' && <Apple className="w-3.5 h-3.5 text-cyan-400" />}
                        {v.platform === 'Cross-Platform' && <Layers className="w-3.5 h-3.5 text-purple-400" />}
                        {v.platform}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {v.targetOsVersion} (Min: {v.minOsVersion})
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-800/40 text-purple-300 text-[11px] font-mono">
                        {v.channel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${getStatusBadge(v.status)}`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 font-mono">
                      {v.releaseDate}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-400 text-xs" title={v.releaseNotes}>
                      {v.releaseNotes}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(v)}
                          className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-purple-900/40 text-slate-300 hover:text-white border border-slate-700/40 transition"
                          title="Edit Version"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit / Create Version Modal */}
      {(isEditing || isCreating) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-purple-700/40 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setIsEditing(false);
                setIsCreating(false);
              }}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 rounded-xl bg-pink-500/20 border border-pink-500/30 text-pink-400">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {isCreating ? 'Create App Version Milestone' : `Edit Version: ${selectedVersion?.versionName}`}
                </h3>
                <p className="text-xs text-slate-400">
                  Update build metadata, target OS compatibility, and production notes.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Version Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.versionName || ''}
                    onChange={(e) => setFormData({ ...formData, versionName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950/80 border border-purple-800/40 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
                    placeholder="e.g. v1.0.1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Version Code *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.versionCode || ''}
                    onChange={(e) => setFormData({ ...formData, versionCode: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950/80 border border-purple-800/40 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
                    placeholder="e.g. 101"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Platform
                  </label>
                  <select
                    value={formData.platform || 'Cross-Platform'}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value as ReleasePlatform })}
                    className="w-full px-3 py-2 bg-slate-950/80 border border-purple-800/40 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="Cross-Platform">Cross-Platform</option>
                    <option value="Android">Android</option>
                    <option value="iOS">iOS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Build Number
                  </label>
                  <input
                    type="number"
                    value={formData.buildNumber || 104}
                    onChange={(e) => setFormData({ ...formData, buildNumber: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950/80 border border-purple-800/40 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Release Channel
                  </label>
                  <select
                    value={formData.channel || 'Closed Testing'}
                    onChange={(e) => setFormData({ ...formData, channel: e.target.value as ReleaseChannel })}
                    className="w-full px-3 py-2 bg-slate-950/80 border border-purple-800/40 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="Internal Testing">Internal Testing</option>
                    <option value="Closed Testing">Closed Testing</option>
                    <option value="Open Testing">Open Testing</option>
                    <option value="Production">Production</option>
                    <option value="TestFlight Preparation">TestFlight Preparation</option>
                    <option value="TestFlight Testing">TestFlight Testing</option>
                    <option value="App Store Preparation">App Store Preparation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Milestone Status
                  </label>
                  <select
                    value={formData.status || 'Alpha'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950/80 border border-purple-800/40 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="Staged">Staged</option>
                    <option value="Production">Production</option>
                    <option value="Beta">Beta</option>
                    <option value="Alpha">Alpha</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Min OS Compatibility
                  </label>
                  <input
                    type="text"
                    value={formData.minOsVersion || ''}
                    onChange={(e) => setFormData({ ...formData, minOsVersion: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950/80 border border-purple-800/40 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
                    placeholder="e.g. Android 8.0 / iOS 15.0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Target OS Version
                  </label>
                  <input
                    type="text"
                    value={formData.targetOsVersion || ''}
                    onChange={(e) => setFormData({ ...formData, targetOsVersion: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950/80 border border-purple-800/40 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
                    placeholder="e.g. Android 15 / iOS 18.1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Release Notes & Changelog Summary
                </label>
                <textarea
                  rows={3}
                  value={formData.releaseNotes || ''}
                  onChange={(e) => setFormData({ ...formData, releaseNotes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-purple-800/40 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500 resize-none"
                  placeholder="Detail primary features, bug fixes, or performance enhancements included in this version..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-800/30">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setIsCreating(false);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-pink-500/25"
                >
                  {isCreating ? 'Save Version' : 'Update Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
