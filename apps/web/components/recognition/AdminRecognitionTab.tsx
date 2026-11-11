'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Crown,
  Flame,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Upload,
  XCircle,
} from 'lucide-react';
import type {
  HonorRecognitionFactor,
  RecognitionBenefitItem,
  RecognitionCategory,
  RecognitionLevelTier,
  RecognitionSystemRules,
} from '@/lib/recognition';

interface AdminRecognitionTabProps {
  canManage: boolean;
  onStatusMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void;
}

export function AdminRecognitionTab({ canManage, onStatusMessage }: AdminRecognitionTabProps) {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<RecognitionCategory>('wealth');
  const [levelsByCat, setLevelsByCat] = useState<Record<RecognitionCategory, RecognitionLevelTier[]>>({
    wealth: [],
    shining: [],
    honor: [],
  });
  const [benefits, setBenefits] = useState<RecognitionBenefitItem[]>([]);
  const [honorFactors, setHonorFactors] = useState<HonorRecognitionFactor[]>([]);
  const [rules, setRules] = useState<RecognitionSystemRules | null>(null);
  const [stats, setStats] = useState<Record<string, any>>({});
  const [honorRequests, setHonorRequests] = useState<any[]>([]);
  const [recentTransitions, setRecentTransitions] = useState<any[]>([]);
  const [suspiciousAlerts, setSuspiciousAlerts] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Level Upsert Editor State
  const [editingLevelId, setEditingLevelId] = useState('');
  const [lvlNumber, setLvlNumber] = useState('3');
  const [lvlName, setLvlName] = useState('');
  const [lvlNameUr, setLvlNameUr] = useState('');
  const [lvlThreshold, setLvlThreshold] = useState('500');
  const [lvlBadgeUrl, setLvlBadgeUrl] = useState('/assets/gifts/07_08_wealth_shining_and_honor.png');
  const [lvlWingStyle, setLvlWingStyle] = useState('neon_magenta');
  const [lvlBorderColor, setLvlBorderColor] = useState('#EC248F');
  const [lvlBenefits, setLvlBenefits] = useState<string[]>(['rec_special_profile_badge']);
  const [lvlActive, setLvlActive] = useState(true);
  const [lvlSaving, setLvlSaving] = useState(false);

  // Honor Direct Award Form
  const [awardUserId, setAwardUserId] = useState('');
  const [awardFactorKey, setAwardFactorKey] = useState('official_platform_recognition');
  const [awardPoints, setAwardPoints] = useState('250');
  const [awardReason, setAwardReason] = useState('');

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/recognition/overview?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data?.success) {
        setLevelsByCat(data.catalog?.levelsByCategory || { wealth: [], shining: [], honor: [] });
        setBenefits(data.catalog?.benefits || []);
        setHonorFactors(data.catalog?.honorFactors || []);
        setRules(data.catalog?.rules || null);
        setStats(data.stats || {});
        setHonorRequests(data.honorRequests || []);
        setRecentTransitions(data.recentTransitions || []);
        setSuspiciousAlerts(data.suspiciousAlerts || []);
        setAuditLogs(data.auditLogs || []);
      }
    } catch {
      onStatusMessage({ type: 'error', text: 'Failed to load Wealth, Shining & Honor admin overview.' });
    } finally {
      setLoading(false);
    }
  }, [onStatusMessage, search]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const selectLevelForEdit = (tier: RecognitionLevelTier) => {
    setActiveCategory(tier.category);
    setEditingLevelId(tier.levelId);
    setLvlNumber(String(tier.levelNumber));
    setLvlName(tier.levelName);
    setLvlNameUr(tier.levelNameUr);
    setLvlThreshold(String(tier.requiredThreshold));
    setLvlBadgeUrl(tier.badgeImageUrl);
    setLvlWingStyle(tier.wingStyle);
    setLvlBorderColor(tier.borderColor);
    setLvlBenefits(tier.benefitKeys);
    setLvlActive(tier.isActive);
  };

  const handleSaveLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    setLvlSaving(true);
    try {
      const id =
        editingLevelId.trim() || `${activeCategory}_lv_${parseInt(lvlNumber, 10) || Date.now()}`;
      const res = await fetch('/api/admin/recognition/levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          levelId: id,
          category: activeCategory,
          levelNumber: Number(lvlNumber),
          levelName: lvlName,
          levelNameUr: lvlNameUr || lvlName,
          requiredThreshold: Number(lvlThreshold),
          badgeImageUrl: lvlBadgeUrl,
          wingStyle: lvlWingStyle,
          borderColor: lvlBorderColor,
          benefitKeys: lvlBenefits,
          displayOrder: Number(lvlNumber),
          isActive: lvlActive,
          reason: `Admin saved ${activeCategory} level ${lvlName} (Lv.${lvlNumber})`,
        }),
      });
      const data = await res.json();
      if (!data?.success) {
        onStatusMessage({ type: 'error', text: data?.error || 'Failed to save level tier.' });
        return;
      }
      onStatusMessage({ type: 'success', text: `Saved ${activeCategory} level '${data.level.levelName}' cleanly.` });
      setEditingLevelId('');
      setLvlName('');
      await loadOverview();
    } finally {
      setLvlSaving(false);
    }
  };

  const handleToggleRulePromo = async () => {
    if (!canManage || !rules) return;
    const nextVal = !rules.allowPromoCoinsForWealth;
    const reason = prompt(
      `Audit Reason for changing allow_promo_coins_for_wealth to ${nextVal}:`,
      'Finance policy verification'
    );
    if (!reason || reason.trim().length < 5) return;

    const res = await fetch('/api/admin/recognition/rules', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allowPromoCoinsForWealth: nextVal, reason }),
    });
    const data = await res.json();
    if (data?.success) {
      setRules(data.rules);
      onStatusMessage({ type: 'success', text: `Updated allowPromoCoinsForWealth = ${nextVal} (audited).` });
      await loadOverview();
    } else {
      onStatusMessage({ type: 'error', text: data?.error || 'Rule update failed.' });
    }
  };

  const handleBadgeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canManage) return;
    const form = new FormData();
    form.append('file', file);
    form.append('category', activeCategory);
    const res = await fetch('/api/admin/recognition/upload', { method: 'POST', body: form });
    const data = await res.json();
    if (data?.success && data.asset?.url) {
      setLvlBadgeUrl(data.asset.url);
      onStatusMessage({ type: 'success', text: `Uploaded badge image: ${data.asset.url}` });
    } else {
      onStatusMessage({ type: 'error', text: data?.error || 'Badge upload failed.' });
    }
  };

  const handleReviewHonor = async (requestId: string, decision: 'approved' | 'rejected') => {
    if (!canManage) return;
    const reason = prompt(`Mandatory Audit Reason to ${decision} Honor request ${requestId}:`);
    if (!reason || reason.trim().length < 5) return;
    const res = await fetch('/api/admin/recognition/honor/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, decision, reason }),
    });
    const data = await res.json();
    if (data?.success) {
      onStatusMessage({ type: 'success', text: `Honor request ${requestId} ${decision}.` });
      await loadOverview();
    } else {
      onStatusMessage({ type: 'error', text: data?.error || 'Honor review failed.' });
    }
  };

  const handleDirectHonorAward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    const res = await fetch('/api/admin/recognition/honor/award', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetUserId: awardUserId.trim(),
        factorKey: awardFactorKey,
        points: Number(awardPoints),
        reason: awardReason.trim(),
      }),
    });
    const data = await res.json();
    if (data?.success) {
      onStatusMessage({
        type: 'success',
        text: `Granted ${awardPoints} Honor pts to ${awardUserId} (now Lv.${data.result?.newLevelNumber}).`,
      });
      setAwardReason('');
      await loadOverview();
    } else {
      onStatusMessage({ type: 'error', text: data?.error || 'Honor award failed.' });
    }
  };

  const currentLevels = levelsByCat[activeCategory] || [];

  return (
    <div dir="ltr" className="space-y-6" data-testid="admin-recognition-tab">
      {/* 1. Three Strictly Separate System KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {(['wealth', 'shining', 'honor'] as RecognitionCategory[]).map((cat) => {
          const st = stats[cat] || { totalUsers: 0, leveledUsers: 0, topLevel: 1, totalScore: 0 };
          return (
            <div
              key={cat}
              className="rounded-2xl bg-[#160B30] border border-purple-500/25 p-4 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-purple-200/80">
                  {cat} System
                </span>
                {cat === 'wealth' ? (
                  <Crown className="w-4 h-4 text-amber-400" />
                ) : cat === 'shining' ? (
                  <Star className="w-4 h-4 text-pink-400" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xl font-black text-white">{Number(st.totalScore || 0).toLocaleString()} pts</span>
                <span className="text-[11px] font-bold text-amber-300">Peak Lv.{st.topLevel || 1}</span>
              </div>
              <p className="text-[11px] text-white/50 mt-1">
                {st.totalUsers || 0} tracked users • {st.leveledUsers || 0} Lv.2+
              </p>
            </div>
          );
        })}

        <div className="rounded-2xl bg-[#160B30] border border-pink-500/30 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-pink-200">Promo Coins Rule</span>
            <Sparkles className="w-4 h-4 text-pink-400" />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs font-bold text-white">
              {rules?.allowPromoCoinsForWealth ? 'Included in Wealth' : 'Excluded (Paid Only)'}
            </span>
            {canManage && (
              <button
                type="button"
                onClick={handleToggleRulePromo}
                className="px-2.5 py-1 rounded-lg bg-[#FF2E74]/20 hover:bg-[#FF2E74]/35 text-pink-200 text-[10px] font-extrabold border border-pink-400/30"
              >
                Toggle
              </button>
            )}
          </div>
          <p className="text-[11px] text-white/50 mt-1">
            Spike threshold: {Number(rules?.fraudDailySpikeThreshold || 250000).toLocaleString()}/24h
          </p>
        </div>
      </div>

      {/* 2. Configurable Level Tiers Table & Editor (Wealth / Shining / Honor Kept Separate) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-[#140A2B] border border-purple-500/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5 bg-[#0D0520] p-1 rounded-xl border border-purple-500/20">
              {(['wealth', 'shining', 'honor'] as RecognitionCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold capitalize transition ${
                    activeCategory === cat
                      ? 'bg-gradient-to-r from-[#FF2E74] to-[#EC4899] text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {cat} Levels ({(levelsByCat[cat] || []).length})
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search user transitions..."
                className="bg-[#0D0520] border border-purple-500/25 rounded-lg px-2.5 py-1 text-xs text-white"
              />
              <button
                type="button"
                onClick={loadOverview}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase tracking-wider text-white/50 border-b border-white/10">
                <tr>
                  <th className="py-2 pr-2">Level</th>
                  <th className="py-2 pr-2">Name (EN / UR)</th>
                  <th className="py-2 pr-2">Threshold</th>
                  <th className="py-2 pr-2">Wing Style</th>
                  <th className="py-2 pr-2">Benefits</th>
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {currentLevels.map((lvl) => (
                  <tr key={lvl.levelId} className="hover:bg-white/[0.02]">
                    <td className="py-2 pr-2 font-black text-amber-300">Lv.{lvl.levelNumber}</td>
                    <td className="py-2 pr-2">
                      <div className="font-bold text-white">{lvl.levelName}</div>
                      <div className="text-[10px] text-white/50">{lvl.levelNameUr}</div>
                    </td>
                    <td className="py-2 pr-2 font-mono text-pink-200">
                      {lvl.requiredThreshold.toLocaleString()}
                    </td>
                    <td className="py-2 pr-2 text-[10px] text-purple-200">{lvl.wingStyle}</td>
                    <td className="py-2 pr-2 text-[10px] text-white/70">{lvl.benefitKeys.length} perks</td>
                    <td className="py-2 pr-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          lvl.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/50'
                        }`}
                      >
                        {lvl.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => selectLevelForEdit(lvl)}
                        className="px-2 py-1 rounded bg-purple-500/25 hover:bg-purple-500/40 text-purple-100 text-[10px] font-bold"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create / Edit Level Form */}
        <div className="rounded-2xl bg-[#140A2B] border border-purple-500/20 p-4">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-pink-300 mb-3 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>{editingLevelId ? `Edit ${editingLevelId}` : `Create / Update ${activeCategory} Level`}</span>
          </h4>
          <form onSubmit={handleSaveLevel} className="space-y-2.5 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <label className="block space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-white/55 font-bold">Level #</span>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={lvlNumber}
                  onChange={(e) => setLvlNumber(e.target.value)}
                  placeholder="Level #"
                  required
                  className="w-full bg-[#0D0520] border border-white/15 rounded-lg px-2.5 py-1.5 text-white"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-white/55 font-bold">Threshold</span>
                <input
                  type="number"
                  min={0}
                  value={lvlThreshold}
                  onChange={(e) => setLvlThreshold(e.target.value)}
                  placeholder="Threshold"
                  required
                  className="w-full bg-[#0D0520] border border-white/15 rounded-lg px-2.5 py-1.5 text-white"
                />
              </label>
            </div>
            <input
              type="text"
              value={lvlName}
              onChange={(e) => setLvlName(e.target.value)}
              placeholder="Level Name (English)"
              required
              className="w-full bg-[#0D0520] border border-white/15 rounded-lg px-2.5 py-1.5 text-white"
            />
            <input
              type="text"
              value={lvlNameUr}
              onChange={(e) => setLvlNameUr(e.target.value)}
              placeholder="Level Name (Urdu)"
              className="w-full bg-[#0D0520] border border-white/15 rounded-lg px-2.5 py-1.5 text-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={lvlWingStyle}
                onChange={(e) => setLvlWingStyle(e.target.value)}
                className="bg-[#0D0520] border border-white/15 rounded-lg px-2 py-1.5 text-white"
              >
                <option value="imperial_gold_wings">Imperial Gold Wings</option>
                <option value="sapphire_violet_wings">Sapphire Violet Wings</option>
                <option value="rose_bronze_wings">Rose Bronze Wings</option>
                <option value="neon_magenta">Neon Magenta</option>
                <option value="emerald_wings">Emerald Wings</option>
              </select>
              <label className="flex items-center justify-center gap-1.5 bg-[#0D0520] border border-white/15 rounded-lg px-2 py-1.5 cursor-pointer text-white/80 hover:text-white">
                <Upload className="w-3.5 h-3.5 text-pink-400" />
                <span>Upload Badge</span>
                <input type="file" accept="image/png,image/webp,image/jpeg" className="hidden" onChange={handleBadgeUpload} />
              </label>
            </div>
            <div className="max-h-28 overflow-y-auto bg-[#0D0520] border border-white/10 rounded-lg p-2 space-y-1">
              {benefits.map((b) => (
                <label key={b.benefitKey} className="flex items-center gap-2 text-[11px] text-white/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lvlBenefits.includes(b.benefitKey)}
                    onChange={(e) =>
                      setLvlBenefits((prev) =>
                        e.target.checked ? [...prev, b.benefitKey] : prev.filter((k) => k !== b.benefitKey)
                      )
                    }
                  />
                  <span>{b.title}</span>
                </label>
              ))}
            </div>
            <label className="flex items-center gap-2 text-white/80">
              <input type="checkbox" checked={lvlActive} onChange={(e) => setLvlActive(e.target.checked)} />
              <span>Level Active</span>
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!canManage || lvlSaving}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#FF2E74] to-[#EC4899] text-white font-extrabold disabled:opacity-50"
              >
                {lvlSaving ? 'Saving...' : 'Save Level Config'}
              </button>
              {editingLevelId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingLevelId('');
                    setLvlName('');
                  }}
                  className="px-3 py-2 rounded-xl bg-white/10 text-white/75 font-bold"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* 3. Honor Recognition Review Queue + Direct Official Honor Grant */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-[#140A2B] border border-emerald-500/25 p-4">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-300 mb-3 flex items-center gap-1.5">
            <Award className="w-4 h-4" />
            <span>Honor Recognition Requests Queue ({honorRequests.length})</span>
          </h4>
          {honorRequests.length === 0 ? (
            <p className="text-xs text-white/50">No Honor recognition requests found.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {honorRequests.map((hr) => (
                <div
                  key={hr.requestId}
                  className="rounded-xl bg-[#0D0520] border border-white/10 p-3 flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="font-bold text-white">
                      {hr.nickname} <span className="text-white/40 font-mono text-[10px]">({hr.userId})</span>
                    </div>
                    <div className="text-[11px] text-emerald-300 font-semibold">
                      {hr.factorTitle} (+{hr.pointsRequested} Honor pts)
                    </div>
                    <p className="text-[11px] text-white/65 mt-0.5">{hr.evidenceSummary}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {hr.status === 'pending' && canManage ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleReviewHonor(hr.requestId, 'approved')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 font-bold flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviewHonor(hr.requestId, 'rejected')}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 text-rose-300 font-bold flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    ) : (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          hr.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : hr.status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {hr.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Direct Authorized Honor Grant */}
        <div className="rounded-2xl bg-[#140A2B] border border-emerald-500/25 p-4">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-300 mb-3 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Official Honor Recognition Award</span>
          </h4>
          <form onSubmit={handleDirectHonorAward} className="space-y-2.5 text-xs">
            <input
              type="text"
              value={awardUserId}
              onChange={(e) => setAwardUserId(e.target.value)}
              placeholder="Target User ID (UUID or user_wallet_demo_701)"
              required
              className="w-full bg-[#0D0520] border border-white/15 rounded-lg px-2.5 py-1.5 text-white"
            />
            <select
              value={awardFactorKey}
              onChange={(e) => setAwardFactorKey(e.target.value)}
              className="w-full bg-[#0D0520] border border-white/15 rounded-lg px-2.5 py-1.5 text-white"
            >
              {honorFactors.map((f) => (
                <option key={f.factorKey} value={f.factorKey}>
                  {f.title} (default {f.defaultPoints})
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={100000}
              value={awardPoints}
              onChange={(e) => setAwardPoints(e.target.value)}
              placeholder="Honor Points"
              required
              className="w-full bg-[#0D0520] border border-white/15 rounded-lg px-2.5 py-1.5 text-white"
            />
            <textarea
              value={awardReason}
              onChange={(e) => setAwardReason(e.target.value)}
              placeholder="Mandatory verified recognition reason (min 5 chars)..."
              rows={2}
              required
              className="w-full bg-[#0D0520] border border-white/15 rounded-lg px-2.5 py-1.5 text-white"
            />
            <button
              type="submit"
              disabled={!canManage}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold disabled:opacity-50"
            >
              Grant Verified Honor Points
            </button>
          </form>
        </div>
      </div>

      {/* 4. Suspicious Velocity Alerts, User Transition History & Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-[#140A2B] border border-amber-500/20 p-4">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-300 mb-2 flex items-center gap-1.5">
            <Flame className="w-4 h-4" />
            <span>Recent Level Transitions ({recentTransitions.length})</span>
          </h4>
          <div className="space-y-1.5 max-h-52 overflow-y-auto text-xs">
            {recentTransitions.map((t) => (
              <div key={t.historyId} className="rounded-xl bg-[#0D0520] px-3 py-2 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white">{t.nickname}</span>{' '}
                  <span className="text-[10px] uppercase text-pink-300">[{t.category}]</span>
                  <div className="text-[11px] text-white/60">
                    Lv.{t.previousLevelNumber} → <strong className="text-amber-300">Lv.{t.newLevelNumber}</strong> ({t.changeReason})
                  </div>
                </div>
                <span className="text-[10px] font-mono text-white/50">{t.scoreAtChange.toLocaleString()} pts</span>
              </div>
            ))}
            {recentTransitions.length === 0 && <p className="text-white/40">No transitions recorded yet.</p>}
          </div>
        </div>

        <div className="rounded-2xl bg-[#140A2B] border border-rose-500/20 p-4">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-300 mb-2 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" />
            <span>Suspicious Activity & Admin Audit Logs ({suspiciousAlerts.length} alerts / {auditLogs.length} audits)</span>
          </h4>
          <div className="space-y-1.5 max-h-52 overflow-y-auto text-xs">
            {auditLogs.map((log) => (
              <div key={log.audit_id} className="rounded-xl bg-[#0D0520] px-3 py-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-extrabold uppercase ${
                      log.action_type === 'suspicious_activity_flagged' ? 'text-rose-400' : 'text-cyan-300'
                    }`}
                  >
                    {log.action_type}
                  </span>
                  <span className="text-[10px] text-white/40">{log.actor_id}</span>
                </div>
                <p className="text-[11px] text-white/75 mt-0.5">{log.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
