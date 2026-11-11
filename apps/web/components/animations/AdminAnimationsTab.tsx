'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ClipboardList,
  Crown,
  Eye,
  Play,
  RefreshCw,
  Sliders,
  Sparkles,
  Upload,
  Volume2,
} from 'lucide-react';
import type {
  AnimationAuditLogRecord,
  AnimationPriorityConfigItem,
  AnimationTier,
  EntranceType,
  GiftAnimationConfigItem,
  HostEntranceEffectItem,
  PKEffectStyle,
  PriorityCategory,
} from '@/lib/animations';

export default function AdminAnimationsTab() {
  const [giftAnimations, setGiftAnimations] = useState<GiftAnimationConfigItem[]>([]);
  const [entrances, setEntrances] = useState<HostEntranceEffectItem[]>([]);
  const [priorityConfigs, setPriorityConfigs] = useState<AnimationPriorityConfigItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AnimationAuditLogRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Selected gift animation editor state
  const [selectedGiftId, setSelectedGiftId] = useState<string>('gift_castle');
  const [animTier, setAnimTier] = useState<AnimationTier>('luxury');
  const [priorityCat, setPriorityCat] = useState<PriorityCategory>('luxury');
  const [priorityWeight, setPriorityWeight] = useState<string>('92');
  const [durationMs, setDurationMs] = useState<string>('4800');
  const [loopCount, setLoopCount] = useState<string>('1');
  const [pkEffectStyle, setPkEffectStyle] = useState<PKEffectStyle>('cross_arena');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(true);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [animationUrl, setAnimationUrl] = useState<string>('/assets/gifts/animations/castle.json');
  const [assetType, setAssetType] = useState<string>('lottie');
  const [soundUrl, setSoundUrl] = useState<string>('/assets/gifts/sfx/sfx_luxury_grand.wav');

  // Host entrance editor state
  const [entType, setEntType] = useState<EntranceType>('vip');
  const [entName, setEntName] = useState<string>('Royal VIP Sovereign Entrance');
  const [entRequiredVip, setEntRequiredVip] = useState<string>('2');
  const [entDuration, setEntDuration] = useState<string>('4000');
  const [entBadge, setEntBadge] = useState<string>('VIP III');
  const [entSound, setEntSound] = useState<string>('/assets/gifts/sfx/sfx_entrance_vip.wav');
  const [entActive, setEntActive] = useState<boolean>(true);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/animations', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load admin animations config.');
      }
      setGiftAnimations(data.giftAnimations || []);
      setEntrances(data.entranceEffects || []);
      setPriorityConfigs(data.priorityConfigs || []);
      setAuditLogs(data.auditLogs || []);
    } catch (e: any) {
      setError(e?.message || 'Error loading animation settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectGift = (item: GiftAnimationConfigItem) => {
    setSelectedGiftId(item.giftId);
    setAnimTier(item.animationTier);
    setPriorityCat(item.priorityCategory);
    setPriorityWeight(String(item.priorityWeight));
    setDurationMs(String(item.durationMs));
    setLoopCount(String(item.loopCount));
    setPkEffectStyle(item.pkEffectStyle);
    setIsFullscreen(item.isFullscreen);
    setIsActive(item.isActive);
    setAnimationUrl(item.animationUrl || '');
    setAssetType(item.assetType || 'lottie');
    setSoundUrl(item.soundUrl || '');
  };

  const handleSelectEntrance = (eff: HostEntranceEffectItem) => {
    setEntType(eff.entranceType);
    setEntName(eff.name);
    setEntRequiredVip(String(eff.requiredVipLevel));
    setEntDuration(String(eff.durationMs));
    setEntBadge(eff.vipBadgeLabel || '');
    setEntSound(eff.soundUrl || '');
    setEntActive(eff.isActive);
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'animation' | 'sound'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    setNotice(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/admin/animations/upload', {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Asset upload failed');
      }
      if (target === 'sound' || data.asset.assetType === 'audio') {
        setSoundUrl(data.asset.fileUrl);
      } else {
        setAnimationUrl(data.asset.fileUrl);
        setAssetType(data.asset.assetType);
      }
      setNotice(`Uploaded ${data.asset.fileName} (${data.asset.assetType.toUpperCase()})`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveGiftAnimation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/animations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upsert_gift_animation',
          giftId: selectedGiftId,
          animationTier: animTier,
          priorityCategory: priorityCat,
          priorityWeight: Number(priorityWeight),
          durationMs: Number(durationMs),
          loopCount: Number(loopCount),
          isFullscreen,
          pkEffectStyle,
          isActive,
          animationUrl: animationUrl || null,
          assetType,
          soundUrl: soundUrl || null,
          reason: `Admin configured ${selectedGiftId} -> ${animTier}`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update gift animation.');
      }
      setNotice(`Saved animation mapping for ${data.animation?.giftName || selectedGiftId}`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Save error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEntrance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/animations/entrances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entranceType: entType,
          name: entName,
          requiredVipLevel: Number(entRequiredVip),
          durationMs: Number(entDuration),
          vipBadgeLabel: entBadge || null,
          soundUrl: entSound || null,
          isActive: entActive,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update entrance effect.');
      }
      setNotice(`Updated host entrance tier "${entType}"`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to save entrance effect');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePriority = async (cfg: AnimationPriorityConfigItem, nextWeight: number, nextMax: number) => {
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/animations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_priority',
          configKey: cfg.configKey,
          priorityWeight: nextWeight,
          maxConcurrent: nextMax,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update priority');
      }
      setNotice(`Updated priority rule "${cfg.configKey}"`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Priority save error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-testid="admin-animations-tab" className="space-y-6">
      {notice && (
        <div className="rounded-2xl bg-emerald-950/60 border border-emerald-500/40 px-4 py-3 text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notice}</span>
        </div>
      )}
      {error && (
        <div className="rounded-2xl bg-rose-950/70 border border-rose-500/50 px-4 py-3 text-xs text-rose-200">
          {error}
        </div>
      )}

      {/* Top quick links */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#190934] border border-[#3e1a76] px-4 py-3 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#ff2e93]" />
          <span className="font-bold">
            Module 7.4 Animations, Priority Queue & Host Entrance Controls
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/animations?preview=demo"
            className="px-3 py-1 rounded-full bg-pink-600/25 border border-pink-400/50 text-pink-200 font-bold flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" /> Live Stage Preview
          </Link>
          <button
            type="button"
            onClick={loadData}
            className="px-3 py-1 rounded-full bg-[#241046] border border-[#42207a] text-purple-200 font-bold flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* 1. Gift Animation Config & Upload */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <form
          onSubmit={handleSaveGiftAnimation}
          className="lg:col-span-5 rounded-3xl bg-[#15072e] border border-[#38186c] p-5 space-y-3 text-xs"
        >
          <h3 className="text-sm font-extrabold flex items-center gap-1.5">
            <Play className="w-4 h-4 text-pink-400" />
            Configure Gift Animation & Audio
          </h3>

          <div>
            <label className="block text-purple-200 mb-1">Catalog Gift</label>
            <select
              value={selectedGiftId}
              onChange={(e) => {
                const match = giftAnimations.find((g) => g.giftId === e.target.value);
                if (match) handleSelectGift(match);
                else setSelectedGiftId(e.target.value);
              }}
              data-testid="admin-anim-gift-select"
              className="w-full rounded-xl bg-[#0e0420] border border-[#3e1d74] px-3 py-2 text-white"
            >
              {giftAnimations.map((g) => (
                <option key={g.giftId} value={g.giftId}>
                  {g.giftName} ({g.coinPrice} coins) — {g.animationTier}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-purple-200 mb-1">Animation Tier</label>
              <select
                value={animTier}
                onChange={(e) => setAnimTier(e.target.value as AnimationTier)}
                className="w-full rounded-xl bg-[#0e0420] border border-[#3e1d74] px-2.5 py-2 text-white"
              >
                <option value="small_floating">small_floating</option>
                <option value="medium_animated">medium_animated</option>
                <option value="large_fullscreen">large_fullscreen</option>
                <option value="luxury">luxury</option>
                <option value="special_event">special_event</option>
                <option value="pk_effect">pk_effect</option>
              </select>
            </div>
            <div>
              <label className="block text-purple-200 mb-1">Priority Category</label>
              <select
                value={priorityCat}
                onChange={(e) => setPriorityCat(e.target.value as PriorityCategory)}
                className="w-full rounded-xl bg-[#0e0420] border border-[#3e1d74] px-2.5 py-2 text-white"
              >
                <option value="standard">standard</option>
                <option value="premium">premium</option>
                <option value="luxury">luxury</option>
                <option value="special_event">special_event</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-purple-200 mb-1">Weight</label>
              <input
                type="number"
                min={1}
                max={1000}
                value={priorityWeight}
                onChange={(e) => setPriorityWeight(e.target.value)}
                className="w-full rounded-xl bg-[#0e0420] border border-[#3e1d74] px-2.5 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-purple-200 mb-1">Duration (ms)</label>
              <input
                type="number"
                min={800}
                max={15000}
                value={durationMs}
                data-testid="admin-anim-duration-input"
                onChange={(e) => setDurationMs(e.target.value)}
                className="w-full rounded-xl bg-[#0e0420] border border-[#3e1d74] px-2.5 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-purple-200 mb-1">PK Placement</label>
              <select
                value={pkEffectStyle}
                onChange={(e) => setPkEffectStyle(e.target.value as PKEffectStyle)}
                className="w-full rounded-xl bg-[#0e0420] border border-[#3e1d74] px-2 py-2 text-white"
              >
                <option value="side_float">side_float</option>
                <option value="side_burst">side_burst</option>
                <option value="center_stage">center_stage</option>
                <option value="cross_arena">cross_arena</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <label className="flex items-center justify-between rounded-xl bg-[#1b0a3a] border border-[#3e1a76] px-3 py-2 cursor-pointer">
              <span className="flex items-center gap-1.5 text-purple-200">
                <Upload className="w-3.5 h-3.5 text-pink-400" />
                {uploading ? 'Uploading...' : 'Upload Animation (PNG/WebP/GIF/Lottie/MP4)'}
              </span>
              <input
                type="file"
                accept=".png,.webp,.gif,.json,.mp4,.webm"
                onChange={(e) => handleFileUpload(e, 'animation')}
                className="hidden"
              />
            </label>
            <input
              type="text"
              value={animationUrl}
              onChange={(e) => setAnimationUrl(e.target.value)}
              placeholder="Animation asset URL"
              className="w-full rounded-xl bg-[#0e0420] border border-[#3e1d74] px-3 py-1.5 text-white"
            />

            <label className="flex items-center justify-between rounded-xl bg-[#1b0a3a] border border-[#3e1a76] px-3 py-2 cursor-pointer">
              <span className="flex items-center gap-1.5 text-purple-200">
                <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                Upload Sound Effect (WAV/MP3/OGG)
              </span>
              <input
                type="file"
                accept=".wav,.mp3,.ogg"
                onChange={(e) => handleFileUpload(e, 'sound')}
                className="hidden"
              />
            </label>
            <input
              type="text"
              value={soundUrl}
              onChange={(e) => setSoundUrl(e.target.value)}
              placeholder="Sound URL (/assets/gifts/sfx/...)"
              className="w-full rounded-xl bg-[#0e0420] border border-[#3e1d74] px-3 py-1.5 text-white"
            />
          </div>

          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isFullscreen}
                onChange={(e) => setIsFullscreen(e.target.checked)}
                className="accent-[#ff007f]"
              />
              <span>Full-Screen Effect</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="accent-[#ff007f]"
              />
              <span>Animation Active</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            data-testid="save-admin-anim-btn"
            className="w-full rounded-2xl bg-gradient-to-r from-[#ff007f] to-[#9333ea] py-2.5 font-extrabold text-white"
          >
            {saving ? 'Saving...' : 'Save Gift Animation'}
          </button>
        </form>

        {/* Right: Configured Animations List & Preview */}
        <div className="lg:col-span-7 rounded-3xl bg-[#15072e] border border-[#38186c] p-5 space-y-3 text-xs">
          <h3 className="text-sm font-extrabold">
            Configured Gift Animations ({giftAnimations.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[430px] overflow-y-auto pr-1">
            {giftAnimations.map((item) => (
              <div
                key={item.animationId}
                onClick={() => handleSelectGift(item)}
                className={`cursor-pointer rounded-2xl border p-3 flex items-center gap-2.5 transition ${
                  selectedGiftId === item.giftId
                    ? 'bg-[#280f52] border-[#ff007f]'
                    : 'bg-[#1b0a3a] border-[#3c1b70] hover:border-pink-400/50'
                }`}
              >
                <img
                  src={item.imageUrl || '/assets/gifts/fallback_gift.png'}
                  alt={item.giftName}
                  onError={(e) => {
                    e.currentTarget.src = '/assets/gifts/fallback_gift.png';
                  }}
                  className="w-10 h-10 object-contain flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white truncate">
                    {item.giftName}{' '}
                    <span className="text-amber-300 font-normal">({item.coinPrice})</span>
                  </p>
                  <p className="text-[11px] text-purple-300 truncate">
                    {item.animationTier} • wt {item.priorityWeight} • {item.durationMs}ms
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    item.isActive
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {item.isActive ? 'ON' : 'OFF'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Host Entrance Effects + Priority Queue Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
        <form
          onSubmit={handleSaveEntrance}
          className="lg:col-span-6 rounded-3xl bg-[#15072e] border border-[#38186c] p-5 space-y-3"
        >
          <h3 className="text-sm font-extrabold flex items-center gap-1.5">
            <Crown className="w-4 h-4 text-amber-300" />
            Host Entrance Effects & VIP Rules
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {entrances.map((eff) => (
              <button
                key={eff.entranceId}
                type="button"
                onClick={() => handleSelectEntrance(eff)}
                className={`rounded-xl px-2.5 py-2 border font-bold text-left ${
                  entType === eff.entranceType
                    ? 'bg-[#ff007f]/25 border-[#ff007f] text-white'
                    : 'bg-[#1d0b3e] border-[#3d1c74] text-purple-200'
                }`}
              >
                {eff.entranceType}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-purple-200 mb-1">Display Name</label>
              <input
                type="text"
                value={entName}
                onChange={(e) => setEntName(e.target.value)}
                className="w-full rounded-xl bg-[#0e0420] border border-[#3e1d74] px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-purple-200 mb-1">VIP Badge Label</label>
              <input
                type="text"
                value={entBadge}
                onChange={(e) => setEntBadge(e.target.value)}
                className="w-full rounded-xl bg-[#0e0420] border border-[#3e1d74] px-3 py-2 text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-purple-200 mb-1">Required VIP Level</label>
              <input
                type="number"
                min={0}
                max={10}
                value={entRequiredVip}
                onChange={(e) => setEntRequiredVip(e.target.value)}
                className="w-full rounded-xl bg-[#0e0420] border border-[#3e1d74] px-2.5 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-purple-200 mb-1">Duration (ms)</label>
              <input
                type="number"
                min={1000}
                max={15000}
                value={entDuration}
                onChange={(e) => setEntDuration(e.target.value)}
                className="w-full rounded-xl bg-[#0e0420] border border-[#3e1d74] px-2.5 py-2 text-white"
              />
            </div>
            <label className="flex items-center gap-2 pt-5 cursor-pointer">
              <input
                type="checkbox"
                checked={entActive}
                onChange={(e) => setEntActive(e.target.checked)}
                className="accent-[#ff007f]"
              />
              <span>Enabled</span>
            </label>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-pink-600 py-2.5 font-extrabold text-white"
          >
            Update Entrance Effect
          </button>
        </form>

        <div className="lg:col-span-6 rounded-3xl bg-[#15072e] border border-[#38186c] p-5 space-y-2.5">
          <h3 className="text-sm font-extrabold flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-pink-400" />
            Backend Queue Priority & Concurrency Limits
          </h3>
          {priorityConfigs.map((cfg) => (
            <div
              key={cfg.configKey}
              className="flex items-center justify-between gap-2 rounded-2xl bg-[#1b0a3a] border border-[#3b1970] px-3 py-2.5"
            >
              <div>
                <p className="font-bold text-white">{cfg.displayLabel}</p>
                <p className="text-[11px] text-purple-300">
                  key: <code>{cfg.configKey}</code> • weight: {cfg.priorityWeight} • max concurrent:{' '}
                  {cfg.maxConcurrent}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleSavePriority(cfg, cfg.priorityWeight, cfg.maxConcurrent)
                }
                className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 font-bold"
              >
                Sync Rule
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Admin Audit Trail */}
      <div className="rounded-3xl bg-[#15072e] border border-[#38186c] p-5 space-y-2 text-xs">
        <h3 className="text-sm font-extrabold flex items-center gap-1.5">
          <ClipboardList className="w-4 h-4 text-amber-300" />
          Animation & Entrance Audit Log ({auditLogs.length})
        </h3>
        {auditLogs.map((log) => (
          <div
            key={log.auditId}
            className="rounded-2xl bg-[#1b0a3b] border border-[#38186c] p-3 flex flex-wrap items-center justify-between gap-2"
          >
            <div>
              <span className="font-bold text-pink-300">{log.actionType}</span>{' '}
              <span className="text-purple-200">
                on {log.targetType} <code>{log.targetId}</code>
              </span>
              {log.reason && <p className="text-purple-300 mt-0.5">{log.reason}</p>}
            </div>
            <div className="text-right text-purple-300">
              <p>
                {log.actorId} ({log.actorRole})
              </p>
              <p>{new Date(log.createdAt).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
