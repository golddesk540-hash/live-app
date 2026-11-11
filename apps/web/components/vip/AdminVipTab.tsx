'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Crown,
  PlusCircle,
  Power,
  RefreshCw,
  RotateCcw,
  Search,
  Upload,
} from 'lucide-react';
import type { VipBenefitRecord, VipMembershipRecord, VipOrderRecord, VipPlanRecord } from '@/lib/vip';

interface AdminVipTabProps {
  canManage: boolean;
  onStatusMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void;
}

export function AdminVipTab({ canManage, onStatusMessage }: AdminVipTabProps) {
  const [plans, setPlans] = useState<VipPlanRecord[]>([]);
  const [benefits, setBenefits] = useState<VipBenefitRecord[]>([]);
  const [entrances, setEntrances] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<VipMembershipRecord[]>([]);
  const [orders, setOrders] = useState<VipOrderRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  const [userSearch, setUserSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [busy, setBusy] = useState(false);

  // Plan editor state
  const [editingPlanId, setEditingPlanId] = useState('');
  const [planName, setPlanName] = useState('');
  const [planTier, setPlanTier] = useState<'vip_basic' | 'vip_silver' | 'vip_gold' | 'vip_diamond' | 'vip_premium'>('vip_gold');
  const [vipLevel, setVipLevel] = useState('3');
  const [priceAmount, setPriceAmount] = useState('19.99');
  const [renewalPriceAmount, setRenewalPriceAmount] = useState('17.99');
  const [durationDays, setDurationDays] = useState('30');
  const [allowCoinPurchase, setAllowCoinPurchase] = useState(false);
  const [coinPrice, setCoinPrice] = useState('');
  const [badgeLabel, setBadgeLabel] = useState('VIP III');
  const [badgeAssetUrl, setBadgeAssetUrl] = useState('/assets/gifts/07_07_vip.png');
  const [profileFrameAssetUrl, setProfileFrameAssetUrl] = useState('/assets/gifts/entrances/entrance_vip.png');
  const [entranceId, setEntranceId] = useState('ent_vip');
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([
    'vip_profile_badge',
    'premium_profile_frame',
    'special_entrance_animation',
    'special_chat_badge',
    'vip_gift_effects',
  ]);

  const loadAdminVip = useCallback(async () => {
    if (!canManage) return;
    setBusy(true);
    try {
      const qs = new URLSearchParams({ status: statusFilter });
      if (userSearch.trim()) qs.set('userId', userSearch.trim());

      const [plansRes, memRes] = await Promise.all([
        fetch('/api/admin/vip/plans'),
        fetch(`/api/admin/vip/memberships?${qs.toString()}`),
      ]);
      const pData = await plansRes.json().catch(() => ({}));
      const mData = await memRes.json().catch(() => ({}));

      if (plansRes.ok) {
        setPlans(pData.plans || []);
        setBenefits(pData.benefitCatalog || []);
        setEntrances(pData.entranceEffects || []);
      }
      if (memRes.ok) {
        setMemberships(mData.memberships || []);
        setOrders(mData.orders || []);
        setAuditLogs(mData.auditLogs || []);
        setSummary(mData.summary || null);
      }
    } finally {
      setBusy(false);
    }
  }, [canManage, statusFilter, userSearch]);

  useEffect(() => {
    loadAdminVip();
  }, [loadAdminVip]);

  const populatePlan = (p: VipPlanRecord) => {
    setEditingPlanId(p.planId);
    setPlanName(p.planName);
    setPlanTier(p.planTier);
    setVipLevel(String(p.vipLevel));
    setPriceAmount(String(p.priceAmount));
    setRenewalPriceAmount(String(p.renewalPriceAmount));
    setDurationDays(String(p.durationDays));
    setAllowCoinPurchase(Boolean(p.allowCoinPurchase));
    setCoinPrice(p.coinPrice ? String(p.coinPrice) : '');
    setBadgeLabel(p.badgeLabel);
    setBadgeAssetUrl(p.badgeAssetUrl);
    setProfileFrameAssetUrl(p.profileFrameAssetUrl);
    setEntranceId(p.entranceId || 'ent_vip');
    setSelectedBenefits(p.benefitKeys || []);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    onStatusMessage(null);
    try {
      const res = await fetch('/api/admin/vip/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: editingPlanId || undefined,
          planName,
          planTier,
          vipLevel: Number(vipLevel),
          priceAmount: Number(priceAmount),
          renewalPriceAmount: Number(renewalPriceAmount || priceAmount),
          durationDays: Number(durationDays),
          allowCoinPurchase,
          coinPrice: allowCoinPurchase && coinPrice ? Number(coinPrice) : null,
          badgeLabel,
          badgeAssetUrl,
          profileFrameAssetUrl,
          entranceId: entranceId || null,
          benefitKeys: selectedBenefits,
          specialEventAccess: planTier === 'vip_premium' || Number(vipLevel) >= 5,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        onStatusMessage({ type: 'error', text: data.error || 'Failed to save VIP plan.' });
        return;
      }
      onStatusMessage({ type: 'success', text: `Saved VIP plan ${data.plan?.planName}` });
      await loadAdminVip();
    } finally {
      setBusy(false);
    }
  };

  const handleUploadAsset = async (
    file: File | null,
    assetKind: 'badge' | 'frame'
  ) => {
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('assetKind', assetKind);
      const res = await fetch('/api/admin/vip/upload', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        onStatusMessage({ type: 'error', text: data.error || 'Asset upload failed.' });
        return;
      }
      if (assetKind === 'badge') setBadgeAssetUrl(data.asset.fileUrl);
      else setProfileFrameAssetUrl(data.asset.fileUrl);
      onStatusMessage({ type: 'success', text: `Uploaded VIP ${assetKind}: ${data.asset.fileUrl}` });
    } finally {
      setBusy(false);
    }
  };

  const handleTogglePlan = async (plan: VipPlanRecord) => {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/vip/plans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.planId, isActive: !plan.isActive }),
      });
      if (res.ok) {
        onStatusMessage({
          type: 'success',
          text: `${plan.planName} ${plan.isActive ? 'deactivated' : 'activated'}.`,
        });
        await loadAdminVip();
      }
    } finally {
      setBusy(false);
    }
  };

  const handleMembershipAction = async (
    membershipId: string,
    action: 'suspend' | 'expire' | 'cancel' | 'reactivate'
  ) => {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/vip/memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membershipId,
          action,
          reason: `Admin Finance Panel action: ${action}`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        onStatusMessage({ type: 'error', text: data.error || 'Failed to update membership.' });
        return;
      }
      onStatusMessage({ type: 'success', text: `Membership ${membershipId} -> ${action}` });
      await loadAdminVip();
    } finally {
      setBusy(false);
    }
  };

  const handleRefundOrder = async (orderId: string) => {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/vip/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, reason: 'Finance admin refund via panel' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        onStatusMessage({ type: 'error', text: data.error || 'VIP refund failed.' });
        return;
      }
      onStatusMessage({ type: 'success', text: `Refunded VIP order ${orderId} & revoked benefits.` });
      await loadAdminVip();
    } finally {
      setBusy(false);
    }
  };

  if (!canManage) {
    return (
      <div className="rounded-2xl bg-rose-500/10 border border-rose-400/30 p-5 text-sm text-rose-200">
        Only authorized Finance Admins (`finance_admin` / `super_admin`) may configure VIP pricing,
        memberships, or process VIP refunds.
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-vip-tab-panel">
      {/* KPI Strip */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 text-xs">
          {[
            ['Active VIPs', summary.activeCount, 'text-emerald-300'],
            ['Expired', summary.expiredCount, 'text-slate-300'],
            ['Cancelled', summary.cancelledCount, 'text-rose-300'],
            ['Suspended', summary.suspendedCount, 'text-red-300'],
            ['Refunded', summary.refundedCount, 'text-purple-300'],
            ['Verified USD', `$${Number(summary.totalVerifiedUsd || 0).toFixed(2)}`, 'text-amber-300'],
          ].map(([label, val, cls]) => (
            <div key={String(label)} className="rounded-xl bg-[#1A103D] border border-white/10 p-3">
              <div className="text-[10px] text-white/55 uppercase">{label}</div>
              <div className={`text-lg font-black ${cls}`}>{val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit VIP Plan Form */}
      <form
        onSubmit={handleSavePlan}
        className="rounded-2xl bg-[#150D33] border border-amber-400/25 p-4 space-y-3 text-xs"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm text-amber-300 flex items-center gap-1.5">
            <Crown className="w-4 h-4" />
            <span>{editingPlanId ? `Edit Plan: ${editingPlanId}` : 'Create / Update VIP Plan'}</span>
          </h3>
          {editingPlanId && (
            <button
              type="button"
              onClick={() => setEditingPlanId('')}
              className="text-[11px] text-purple-300 underline"
            >
              Reset New
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div>
            <label className="block text-white/60 mb-1">Plan Name</label>
            <input
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="VIP Gold"
              required
              className="w-full px-2.5 py-1.5 rounded-lg bg-black/35 border border-white/15 text-white"
            />
          </div>
          <div>
            <label className="block text-white/60 mb-1">Plan Tier</label>
            <select
              value={planTier}
              onChange={(e) => setPlanTier(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-black/35 border border-white/15 text-white"
            >
              <option value="vip_basic">vip_basic</option>
              <option value="vip_silver">vip_silver</option>
              <option value="vip_gold">vip_gold</option>
              <option value="vip_diamond">vip_diamond</option>
              <option value="vip_premium">vip_premium</option>
            </select>
          </div>
          <div>
            <label className="block text-white/60 mb-1">VIP Level (1-5)</label>
            <input
              type="number"
              min="1"
              max="5"
              value={vipLevel}
              onChange={(e) => setVipLevel(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-black/35 border border-white/15 text-white"
            />
          </div>
          <div>
            <label className="block text-white/60 mb-1">Badge Label</label>
            <input
              value={badgeLabel}
              onChange={(e) => setBadgeLabel(e.target.value)}
              required
              className="w-full px-2.5 py-1.5 rounded-lg bg-black/35 border border-white/15 text-white"
            />
          </div>
          <div>
            <label className="block text-white/60 mb-1">Price (USD)</label>
            <input
              type="number"
              step="0.01"
              value={priceAmount}
              onChange={(e) => setPriceAmount(e.target.value)}
              required
              className="w-full px-2.5 py-1.5 rounded-lg bg-black/35 border border-white/15 text-white"
            />
          </div>
          <div>
            <label className="block text-white/60 mb-1">Renewal Price</label>
            <input
              type="number"
              step="0.01"
              value={renewalPriceAmount}
              onChange={(e) => setRenewalPriceAmount(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-black/35 border border-white/15 text-white"
            />
          </div>
          <div>
            <label className="block text-white/60 mb-1">Duration (Days)</label>
            <input
              type="number"
              min="1"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              required
              className="w-full px-2.5 py-1.5 rounded-lg bg-black/35 border border-white/15 text-white"
            />
          </div>
          <div>
            <label className="block text-white/60 mb-1">Entrance Effect (7.4)</label>
            <select
              value={entranceId}
              onChange={(e) => setEntranceId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-black/35 border border-white/15 text-white"
            >
              {entrances.map((e) => (
                <option key={e.entrance_id} value={e.entrance_id}>
                  {e.entrance_id} ({e.entrance_type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Badge & Frame Uploads */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="flex items-center gap-2">
            <input
              value={badgeAssetUrl}
              onChange={(e) => setBadgeAssetUrl(e.target.value)}
              placeholder="Badge Asset URL"
              className="flex-1 px-2.5 py-1.5 rounded-lg bg-black/35 border border-white/15 text-white"
            />
            <label className="px-2.5 py-1.5 rounded-lg bg-purple-600/30 border border-purple-400/40 cursor-pointer flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" />
              <span>Badge</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleUploadAsset(e.target.files?.[0] || null, 'badge')}
              />
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={profileFrameAssetUrl}
              onChange={(e) => setProfileFrameAssetUrl(e.target.value)}
              placeholder="Profile Frame Asset URL"
              className="flex-1 px-2.5 py-1.5 rounded-lg bg-black/35 border border-white/15 text-white"
            />
            <label className="px-2.5 py-1.5 rounded-lg bg-purple-600/30 border border-purple-400/40 cursor-pointer flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" />
              <span>Frame</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleUploadAsset(e.target.files?.[0] || null, 'frame')}
              />
            </label>
          </div>
        </div>

        {/* Optional Approved Coin Purchase Toggle */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <label className="inline-flex items-center gap-1.5 text-purple-200 cursor-pointer">
            <input
              type="checkbox"
              checked={allowCoinPurchase}
              onChange={(e) => setAllowCoinPurchase(e.target.checked)}
              className="accent-amber-400"
            />
            <span>Approve Coin-Based VIP Purchase</span>
          </label>
          {allowCoinPurchase && (
            <input
              type="number"
              min="1"
              value={coinPrice}
              onChange={(e) => setCoinPrice(e.target.value)}
              placeholder="Approved Coin Price"
              className="w-40 px-2.5 py-1 rounded-lg bg-black/35 border border-amber-400/40 text-amber-200"
            />
          )}
        </div>

        {/* Configured Benefits Checkboxes */}
        <div className="flex flex-wrap gap-1.5">
          {benefits.map((b) => {
            const active = selectedBenefits.includes(b.benefitKey);
            return (
              <button
                key={b.benefitKey}
                type="button"
                onClick={() =>
                  setSelectedBenefits((prev) =>
                    prev.includes(b.benefitKey)
                      ? prev.filter((k) => k !== b.benefitKey)
                      : [...prev, b.benefitKey]
                  )
                }
                className={`px-2 py-1 rounded-full text-[10px] font-bold border ${
                  active
                    ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                    : 'bg-white/5 border-white/10 text-white/60'
                }`}
              >
                {active ? '✓ ' : '+ '}
                {b.title}
              </button>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-[#1D0F03] font-black inline-flex items-center gap-1.5"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>{editingPlanId ? 'Update VIP Plan' : 'Create VIP Plan'}</span>
        </button>
      </form>

      {/* Plans List */}
      <div className="rounded-2xl bg-[#150D33] border border-white/10 p-4 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-white">Configured VIP Plans ({plans.length})</h3>
          <button
            type="button"
            onClick={loadAdminVip}
            className="text-purple-300 hover:text-white inline-flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {plans.map((p) => (
            <div
              key={p.planId}
              className="rounded-xl bg-black/30 border border-white/10 p-3 flex items-center justify-between gap-2"
            >
              <div>
                <div className="font-bold text-white">
                  {p.planName} ({p.badgeLabel}) — ${p.priceAmount.toFixed(2)} / {p.durationDays}d
                </div>
                <div className="text-[10px] text-purple-200/70">
                  ID: {p.planId} • Entrance: {p.entranceId || 'none'} • Status:{' '}
                  {p.isActive ? 'ACTIVE' : 'INACTIVE'}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => populatePlan(p)}
                  className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] font-bold"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleTogglePlan(p)}
                  className="px-2 py-1 rounded bg-pink-500/20 border border-pink-400/35 text-[10px] font-bold flex items-center gap-1"
                >
                  <Power className="w-3 h-3" />
                  <span>{p.isActive ? 'Disable' : 'Enable'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Membership Search, Lifecycle Actions & Refunds */}
      <div className="rounded-2xl bg-[#150D33] border border-white/10 p-4 space-y-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-extrabold text-white">
            VIP Memberships & Refunds ({memberships.length})
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-2" />
              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search User ID / Poppo ID"
                className="pl-7 pr-2.5 py-1 rounded-lg bg-black/35 border border-white/15 text-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1 rounded-lg bg-black/35 border border-white/15 text-white"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
              <option value="suspended">Suspended</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {memberships.map((m) => (
            <div
              key={m.membershipId}
              className="rounded-xl bg-black/30 border border-white/10 p-2.5 flex flex-wrap items-center justify-between gap-2"
            >
              <div>
                <div className="font-bold text-white">
                  {m.nickname || m.userId} ({m.badgeLabel} • {m.planName})
                </div>
                <div className="text-[10px] text-purple-200/70">
                  {m.membershipId} • Status: <strong className="text-amber-300">{m.status}</strong> •{' '}
                  {m.currency} ${m.purchaseAmount.toFixed(2)} • Expires:{' '}
                  {m.expiryDate ? new Date(m.expiryDate).toLocaleDateString() : '—'}
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {m.status === 'active' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleMembershipAction(m.membershipId, 'suspend')}
                      className="px-2 py-1 rounded bg-rose-500/20 text-rose-200 text-[10px] font-bold"
                    >
                      Suspend
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMembershipAction(m.membershipId, 'expire')}
                      className="px-2 py-1 rounded bg-slate-500/25 text-slate-200 text-[10px] font-bold"
                    >
                      Force Expire
                    </button>
                  </>
                )}
                {(m.status === 'suspended' || m.status === 'expired' || m.status === 'cancelled') && (
                  <button
                    type="button"
                    onClick={() => handleMembershipAction(m.membershipId, 'reactivate')}
                    className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-200 text-[10px] font-bold inline-flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Reactivate
                  </button>
                )}
                {m.orderId && m.status !== 'refunded' && (
                  <button
                    type="button"
                    onClick={() => handleRefundOrder(m.orderId!)}
                    className="px-2 py-1 rounded bg-purple-500/25 text-purple-200 text-[10px] font-bold inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Refund Order
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Orders + Audit Logs */}
        {orders.length > 0 && (
          <div className="pt-2 border-t border-white/10">
            <h4 className="font-bold text-purple-200 mb-1.5">Recent Orders ({orders.length})</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto text-[10px]">
              {orders.map((o) => (
                <div key={o.orderId} className="rounded bg-black/25 px-2.5 py-1.5 flex justify-between">
                  <span className="truncate font-mono">{o.orderId} • {o.planId} ({o.orderType})</span>
                  <span className="font-bold text-amber-300">{o.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {auditLogs.length > 0 && (
          <div className="pt-2 border-t border-white/10">
            <h4 className="font-bold text-purple-200 mb-1.5">VIP Audit Trail ({auditLogs.length})</h4>
            <div className="space-y-1 max-h-36 overflow-y-auto text-[10px]">
              {auditLogs.map((a) => (
                <div key={a.audit_id} className="rounded bg-black/25 px-2.5 py-1 flex justify-between gap-2">
                  <span>
                    <strong>{a.action_type}</strong>: {a.reason}
                  </span>
                  <span className="text-white/50 shrink-0">{a.actor_role}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
