'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  PlusCircle,
  Upload,
  RotateCcw,
  CheckCircle2,
  Eye,
  Power,
  Layers,
  Tag,
  ShieldAlert,
} from 'lucide-react';
import type {
  StoreCategoryRecord,
  StoreDurationType,
  StoreEquipSlot,
  StoreItemRecord,
  StorePurchaseRecord,
  UserStoreInventoryRecord,
} from '@/lib/store';

interface AdminStoreTabProps {
  canManage: boolean;
  onStatusMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void;
}

export function AdminStoreTab({ canManage, onStatusMessage }: AdminStoreTabProps) {
  const [subTab, setSubTab] = useState<'items' | 'categories' | 'purchases' | 'inventory' | 'audits'>('items');
  const [search, setSearch] = useState('');
  const [summary, setSummary] = useState<any>(null);
  const [categories, setCategories] = useState<StoreCategoryRecord[]>([]);
  const [items, setItems] = useState<StoreItemRecord[]>([]);
  const [purchases, setPurchases] = useState<StorePurchaseRecord[]>([]);
  const [inventory, setInventory] = useState<UserStoreInventoryRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewItem, setPreviewItem] = useState<StoreItemRecord | null>(null);

  // Category Form State
  const [catId, setCatId] = useState('');
  const [catName, setCatName] = useState('');
  const [catShort, setCatShort] = useState('');
  const [catSlot, setCatSlot] = useState<StoreEquipSlot>('profile_frame');
  const [catOrder, setCatOrder] = useState('20');

  // Item Form State
  const [itemId, setItemId] = useState('');
  const [itemCatId, setItemCatId] = useState('profile_frames');
  const [itemName, setItemName] = useState('');
  const [itemNameUr, setItemNameUr] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemThumb, setItemThumb] = useState('/assets/store/frame_golden_feather.png');
  const [itemAnim, setItemAnim] = useState('');
  const [itemPrice, setItemPrice] = useState('500');
  const [itemDurType, setItemDurType] = useState<StoreDurationType>('limited_duration');
  const [itemDurVal, setItemDurVal] = useState('30');
  const [itemDurUnit, setItemDurUnit] = useState<'days' | 'hours' | 'seconds' | 'permanent' | 'event' | 'vip'>('days');
  const [itemSlot, setItemSlot] = useState<StoreEquipSlot>('profile_frame');
  const [itemVipOnly, setItemVipOnly] = useState(false);
  const [itemReqVip, setItemReqVip] = useState('0');
  const [itemMinWealth, setItemMinWealth] = useState('1');
  const [itemMinShining, setItemMinShining] = useState('1');
  const [itemMinHonor, setItemMinHonor] = useState('1');
  const [itemUsageLimit, setItemUsageLimit] = useState('');
  const [itemFeatured, setItemFeatured] = useState(false);
  const [itemPopular, setItemPopular] = useState(false);
  const [itemNew, setItemNew] = useState(true);
  const [itemOrder, setItemOrder] = useState('20');
  const [uploading, setUploading] = useState(false);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/store/overview?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary || null);
        setCategories(data.categories || []);
        setItems(data.items || []);
        setPurchases(data.purchases || []);
        setInventory(data.inventory || []);
        setAuditLogs(data.auditLogs || []);
      }
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const handleUploadAsset = async (e: React.ChangeEvent<HTMLInputElement>, target: 'thumbnail' | 'animation') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('kind', target);
      const res = await fetch('/api/admin/store/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || !data.success) {
        onStatusMessage({ type: 'error', text: data.error || 'Asset upload failed.' });
      } else {
        const url = data.asset?.url || data.asset?.fileUrl;
        if (target === 'thumbnail') setItemThumb(url);
        else setItemAnim(url);
        onStatusMessage({ type: 'success', text: `Uploaded ${target} asset: ${url}` });
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    onStatusMessage(null);
    const res = await fetch('/api/admin/store/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoryId: catId || catName.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        name: catName,
        shortLabel: catShort || catName,
        defaultEquipSlot: catSlot,
        displayOrder: Number(catOrder || 20),
        isApproved: true,
        isActive: true,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      onStatusMessage({ type: 'error', text: data.error || 'Failed to save category.' });
    } else {
      onStatusMessage({ type: 'success', text: `Saved store category "${data.category.name}".` });
      setCatId('');
      setCatName('');
      setCatShort('');
      await loadOverview();
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    onStatusMessage(null);
    const res = await fetch('/api/admin/store/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemId: itemId.trim() || undefined,
        categoryId: itemCatId,
        name: itemName,
        nameUr: itemNameUr || itemName,
        description: itemDesc,
        thumbnailUrl: itemThumb,
        previewImageUrl: itemThumb,
        animationAssetUrl: itemAnim.trim() || null,
        coinPrice: Number(itemPrice || 0),
        durationType: itemDurType,
        durationValue: itemDurType === 'permanent' ? null : Number(itemDurVal || 30),
        durationUnit: itemDurType === 'permanent' ? 'permanent' : itemDurUnit,
        equipSlot: itemSlot,
        isEquippable: itemSlot !== 'none',
        usageLimitPerUser: itemUsageLimit ? Number(itemUsageLimit) : null,
        vipOnly: itemVipOnly,
        requiredVipLevel: Number(itemReqVip || 0),
        minWealthLevel: Number(itemMinWealth || 1),
        minShiningLevel: Number(itemMinShining || 1),
        minHonorLevel: Number(itemMinHonor || 1),
        isFeatured: itemFeatured,
        isPopular: itemPopular,
        isNewArrival: itemNew,
        displayOrder: Number(itemOrder || 20),
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      onStatusMessage({ type: 'error', text: data.error || 'Failed to save store item.' });
    } else {
      onStatusMessage({ type: 'success', text: `Saved store item "${data.item.name}" (${data.item.coinPrice} Coins).` });
      setItemId('');
      setItemName('');
      setItemNameUr('');
      setItemDesc('');
      await loadOverview();
    }
  };

  const handleToggleItem = async (item: StoreItemRecord) => {
    onStatusMessage(null);
    const res = await fetch('/api/admin/store/items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: item.itemId, isActive: !item.isActive }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      onStatusMessage({ type: 'error', text: data.error || 'Toggle failed.' });
    } else {
      onStatusMessage({
        type: 'success',
        text: `${data.item.name} is now ${data.item.isActive ? 'ACTIVE' : 'DISABLED'}.`,
      });
      await loadOverview();
    }
  };

  const handleRefundPurchase = async (purchaseId: string) => {
    const reason = prompt(`Mandatory Finance Audit Reason to refund ${purchaseId}:`);
    if (!reason || reason.trim().length < 5) return;
    onStatusMessage(null);
    const res = await fetch('/api/admin/store/refund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purchaseId, reason }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      onStatusMessage({ type: 'error', text: data.error || 'Store refund failed.' });
    } else {
      onStatusMessage({
        type: 'success',
        text: `Refunded ${data.refundedCoins} coins for ${purchaseId} & revoked inventory cleanly.`,
      });
      await loadOverview();
    }
  };

  const loadItemIntoForm = (it: StoreItemRecord) => {
    setItemId(it.itemId);
    setItemCatId(it.categoryId);
    setItemName(it.name);
    setItemNameUr(it.nameUr);
    setItemDesc(it.description);
    setItemThumb(it.thumbnailUrl);
    setItemAnim(it.animationAssetUrl || '');
    setItemPrice(String(it.coinPrice));
    setItemDurType(it.durationType);
    setItemDurVal(String(it.durationValue || 30));
    setItemDurUnit(it.durationUnit);
    setItemSlot(it.equipSlot);
    setItemVipOnly(it.vipOnly);
    setItemReqVip(String(it.requiredVipLevel));
    setItemMinWealth(String(it.minWealthLevel));
    setItemMinShining(String(it.minShiningLevel));
    setItemMinHonor(String(it.minHonorLevel));
    setItemUsageLimit(it.usageLimitPerUser !== null ? String(it.usageLimitPerUser) : '');
    setItemFeatured(it.isFeatured);
    setItemPopular(it.isPopular);
    setItemNew(it.isNewArrival);
    setItemOrder(String(it.displayOrder));
    setSubTab('items');
  };

  return (
    <div dir="ltr" className="space-y-4 text-left" data-testid="admin-store-tab">
      {/* KPI Strip */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Active Categories', val: summary.activeCategories },
            { label: 'Approved Items', val: summary.activeItems },
            { label: 'Completed Orders', val: summary.completedPurchases },
            { label: 'Coins Spent (Store)', val: `${Number(summary.totalCoinsSpent).toLocaleString()} Coins` },
            { label: 'Active Inventory', val: summary.activeInventoryItems },
          ].map((k) => (
            <div key={k.label} className="rounded-2xl bg-[#190b33] border border-purple-500/25 p-3">
              <div className="text-[10px] font-bold uppercase text-purple-200/70">{k.label}</div>
              <div className="text-lg font-black text-white mt-0.5 tabular-nums">{k.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Sub-navigation & Search */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: 'items', label: `Catalog Items (${items.length})` },
              { id: 'categories', label: `Categories (${categories.length})` },
              { id: 'purchases', label: `Purchases (${purchases.length})` },
              { id: 'inventory', label: `User Inventory (${inventory.length})` },
              { id: 'audits', label: `Audit Logs (${auditLogs.length})` },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border ${
                subTab === t.id
                  ? 'bg-[#ff2e74] border-pink-400 text-white'
                  : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search item ID, user ID, purchase ID..."
          className="bg-[#0d0520] border border-purple-500/30 rounded-xl px-3 py-1.5 text-xs text-white w-64"
        />
      </div>

      {!canManage && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-xs text-amber-200 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          <span>Read-only access: finance_admin or super_admin required to modify store catalog or issue refunds.</span>
        </div>
      )}

      {/* ITEMS SUB-TAB */}
      {subTab === 'items' && (
        <div className="space-y-4">
          {canManage && (
            <form
              onSubmit={handleSaveItem}
              className="rounded-2xl bg-[#160a2d] border border-purple-500/25 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-[#ff2e74]" />
                  <span>{itemId ? `Edit Store Item (${itemId})` : 'Add New Store Item'}</span>
                </h3>
                {itemId && (
                  <button
                    type="button"
                    onClick={() => setItemId('')}
                    className="text-xs text-pink-300 underline font-bold"
                  >
                    + New Item Mode
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-white/60 block mb-1">CATEGORY</label>
                  <select
                    value={itemCatId}
                    onChange={(e) => setItemCatId(e.target.value)}
                    className="w-full bg-[#0c041e] border border-purple-500/30 rounded-xl px-2.5 py-2 text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.categoryId} value={c.categoryId}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-white/60 block mb-1">ITEM NAME (EN)</label>
                  <input
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g. Royal Neon Frame"
                    required
                    className="w-full bg-[#0c041e] border border-purple-500/30 rounded-xl px-2.5 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-white/60 block mb-1">ITEM NAME (URDU)</label>
                  <input
                    value={itemNameUr}
                    onChange={(e) => setItemNameUr(e.target.value)}
                    placeholder="Optional Urdu title"
                    className="w-full bg-[#0c041e] border border-purple-500/30 rounded-xl px-2.5 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-white/60 block mb-1">COIN PRICE</label>
                  <input
                    type="number"
                    min={0}
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    required
                    className="w-full bg-[#0c041e] border border-purple-500/30 rounded-xl px-2.5 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-white/60 block mb-1">EQUIP SLOT</label>
                  <select
                    value={itemSlot}
                    onChange={(e) => setItemSlot(e.target.value as StoreEquipSlot)}
                    className="w-full bg-[#0c041e] border border-purple-500/30 rounded-xl px-2.5 py-2 text-white"
                  >
                    <option value="profile_frame">profile_frame</option>
                    <option value="name_decoration">name_decoration</option>
                    <option value="chat_decoration">chat_decoration</option>
                    <option value="entrance_effect">entrance_effect</option>
                    <option value="theme">theme</option>
                    <option value="special_badge">special_badge</option>
                    <option value="accessory">accessory</option>
                    <option value="none">none (collectible)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-white/60 block mb-1">DURATION TYPE</label>
                  <select
                    value={itemDurType}
                    onChange={(e) => setItemDurType(e.target.value as StoreDurationType)}
                    className="w-full bg-[#0c041e] border border-purple-500/30 rounded-xl px-2.5 py-2 text-white"
                  >
                    <option value="limited_duration">limited_duration</option>
                    <option value="permanent">permanent</option>
                    <option value="event_based">event_based</option>
                    <option value="membership_based">membership_based</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-white/60 block mb-1">DURATION VALUE</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      min={1}
                      disabled={itemDurType === 'permanent'}
                      value={itemDurVal}
                      onChange={(e) => setItemDurVal(e.target.value)}
                      className="w-20 bg-[#0c041e] border border-purple-500/30 rounded-xl px-2 py-2 text-white"
                    />
                    <select
                      disabled={itemDurType === 'permanent'}
                      value={itemDurUnit}
                      onChange={(e) => setItemDurUnit(e.target.value as any)}
                      className="flex-1 bg-[#0c041e] border border-purple-500/30 rounded-xl px-2 py-2 text-white"
                    >
                      <option value="days">days</option>
                      <option value="hours">hours</option>
                      <option value="seconds">seconds</option>
                      <option value="vip">vip</option>
                      <option value="event">event</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-white/60 block mb-1">USAGE LIMIT / ORDER</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      min={1}
                      placeholder="Unlimited"
                      value={itemUsageLimit}
                      onChange={(e) => setItemUsageLimit(e.target.value)}
                      className="flex-1 bg-[#0c041e] border border-purple-500/30 rounded-xl px-2 py-2 text-white"
                    />
                    <input
                      type="number"
                      value={itemOrder}
                      onChange={(e) => setItemOrder(e.target.value)}
                      title="Display Order"
                      className="w-16 bg-[#0c041e] border border-purple-500/30 rounded-xl px-2 py-2 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-white/60 block mb-1">REQ VIP LEVEL (0=ANY)</label>
                  <input
                    type="number"
                    min={0}
                    value={itemReqVip}
                    onChange={(e) => setItemReqVip(e.target.value)}
                    className="w-full bg-[#0c041e] border border-purple-500/30 rounded-xl px-2.5 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-white/60 block mb-1">MIN WEALTH LV</label>
                  <input
                    type="number"
                    min={1}
                    value={itemMinWealth}
                    onChange={(e) => setItemMinWealth(e.target.value)}
                    className="w-full bg-[#0c041e] border border-purple-500/30 rounded-xl px-2.5 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-white/60 block mb-1">MIN SHINING LV</label>
                  <input
                    type="number"
                    min={1}
                    value={itemMinShining}
                    onChange={(e) => setItemMinShining(e.target.value)}
                    className="w-full bg-[#0c041e] border border-purple-500/30 rounded-xl px-2.5 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-white/60 block mb-1">MIN HONOR LV</label>
                  <input
                    type="number"
                    min={1}
                    value={itemMinHonor}
                    onChange={(e) => setItemMinHonor(e.target.value)}
                    className="w-full bg-[#0c041e] border border-purple-500/30 rounded-xl px-2.5 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-white/60 block mb-1">THUMBNAIL URL & UPLOAD</label>
                  <div className="flex gap-2">
                    <input
                      value={itemThumb}
                      onChange={(e) => setItemThumb(e.target.value)}
                      required
                      className="flex-1 bg-[#0c041e] border border-purple-500/30 rounded-xl px-2.5 py-2 text-white"
                    />
                    <label className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 cursor-pointer flex items-center gap-1 font-bold">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploading ? '...' : 'Upload'}</span>
                      <input type="file" accept="image/*" hidden onChange={(e) => handleUploadAsset(e, 'thumbnail')} />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-white/60 block mb-1">ANIMATION ASSET (OPTIONAL)</label>
                  <div className="flex gap-2">
                    <input
                      value={itemAnim}
                      onChange={(e) => setItemAnim(e.target.value)}
                      placeholder="/assets/store/..."
                      className="flex-1 bg-[#0c041e] border border-purple-500/30 rounded-xl px-2.5 py-2 text-white"
                    />
                    <label className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 cursor-pointer flex items-center gap-1 font-bold">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                      <input type="file" accept="image/*" hidden onChange={(e) => handleUploadAsset(e, 'animation')} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" checked={itemVipOnly} onChange={(e) => setItemVipOnly(e.target.checked)} />
                    <span>VIP-Only</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" checked={itemFeatured} onChange={(e) => setItemFeatured(e.target.checked)} />
                    <span>Featured</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" checked={itemPopular} onChange={(e) => setItemPopular(e.target.checked)} />
                    <span>Popular</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" checked={itemNew} onChange={(e) => setItemNew(e.target.checked)} />
                    <span>New Arrival</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#ff2e74] to-[#ec4899] text-white text-xs font-black shadow-lg"
                >
                  Save Store Item
                </button>
              </div>
            </form>
          )}

          {/* Catalog Table */}
          <div className="overflow-x-auto rounded-2xl border border-purple-500/20">
            <table className="w-full text-xs text-left">
              <thead className="bg-purple-950/50 text-purple-200 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Item</th>
                  <th className="p-3">Category / Slot</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Duration / Eligibility</th>
                  <th className="p-3">Sold</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/15">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-white/50">
                      Loading store items...
                    </td>
                  </tr>
                ) : (
                  items.map((it) => (
                    <tr key={it.itemId} className="hover:bg-white/[0.02]">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={it.thumbnailUrl} alt={it.name} className="w-9 h-9 rounded-lg object-contain bg-[#0c041e]" />
                          <div>
                            <div className="font-extrabold text-white">{it.name}</div>
                            <div className="font-mono text-[10px] text-white/45">{it.itemId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-purple-200">{it.categoryName}</div>
                        <div className="font-mono text-[10px] text-white/50">{it.equipSlot}</div>
                      </td>
                      <td className="p-3 font-black text-amber-300 tabular-nums">{it.coinPrice.toLocaleString()}</td>
                      <td className="p-3 text-[11px]">
                        <div>{it.durationLabel}</div>
                        <div className="text-white/50 text-[10px]">
                          {it.vipOnly ? `VIP Lv.${Math.max(1, it.requiredVipLevel)}+ • ` : ''}
                          W{it.minWealthLevel}/S{it.minShiningLevel}/H{it.minHonorLevel}
                        </div>
                      </td>
                      <td className="p-3 font-mono">{it.soldCount}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            it.isActive && it.isApproved
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {it.isActive ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setPreviewItem(it)}
                          className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> Preview
                        </button>
                        {canManage && (
                          <>
                            <button
                              type="button"
                              onClick={() => loadItemIntoForm(it)}
                              className="px-2 py-1 rounded-lg bg-purple-500/25 hover:bg-purple-500/40 text-purple-200 text-[10px] font-bold"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleItem(it)}
                              className="px-2 py-1 rounded-lg bg-pink-500/20 hover:bg-pink-500/35 text-pink-200 text-[10px] font-bold inline-flex items-center gap-1"
                            >
                              <Power className="w-3 h-3" /> {it.isActive ? 'Disable' : 'Enable'}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CATEGORIES SUB-TAB */}
      {subTab === 'categories' && (
        <div className="space-y-4">
          {canManage && (
            <form onSubmit={handleSaveCategory} className="rounded-2xl bg-[#160a2d] border border-purple-500/25 p-4 grid grid-cols-1 md:grid-cols-5 gap-3 text-xs items-end">
              <div>
                <label className="text-[10px] font-bold text-white/60 block mb-1">CATEGORY ID</label>
                <input
                  value={catId}
                  onChange={(e) => setCatId(e.target.value)}
                  placeholder="e.g. vip_gifts"
                  required
                  className="w-full bg-[#0c041e] border border-purple-500/30 rounded-xl px-2.5 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/60 block mb-1">CATEGORY NAME</label>
                <input
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Display name"
                  required
                  className="w-full bg-[#0c041e] border border-purple-500/30 rounded-xl px-2.5 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/60 block mb-1">SHORT TAB LABEL</label>
                <input
                  value={catShort}
                  onChange={(e) => setCatShort(e.target.value)}
                  placeholder="Pill label"
                  className="w-full bg-[#0c041e] border border-purple-500/30 rounded-xl px-2.5 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/60 block mb-1">DEFAULT EQUIP SLOT / ORDER</label>
                <div className="flex gap-1">
                  <select
                    value={catSlot}
                    onChange={(e) => setCatSlot(e.target.value as StoreEquipSlot)}
                    className="flex-1 bg-[#0c041e] border border-purple-500/30 rounded-xl px-2 py-2 text-white"
                  >
                    <option value="profile_frame">profile_frame</option>
                    <option value="name_decoration">name_decoration</option>
                    <option value="chat_decoration">chat_decoration</option>
                    <option value="entrance_effect">entrance_effect</option>
                    <option value="theme">theme</option>
                    <option value="special_badge">special_badge</option>
                    <option value="accessory">accessory</option>
                    <option value="none">none</option>
                  </select>
                  <input
                    type="number"
                    value={catOrder}
                    onChange={(e) => setCatOrder(e.target.value)}
                    className="w-14 bg-[#0c041e] border border-purple-500/30 rounded-xl px-2 py-2 text-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="py-2 rounded-xl bg-gradient-to-r from-[#ff2e74] to-[#ec4899] text-white font-black"
              >
                Save Category
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <div key={cat.categoryId} className="rounded-2xl bg-[#160a2d] border border-purple-500/20 p-3 text-xs flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-white flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-pink-400" />
                    <span>{cat.name}</span>
                  </div>
                  <div className="text-[10px] text-white/50 font-mono mt-0.5">
                    {cat.categoryId} • slot: {cat.defaultEquipSlot} • #{cat.displayOrder}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 font-bold text-[10px]">
                  {cat.itemCount ?? 0} items
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PURCHASES SUB-TAB */}
      {subTab === 'purchases' && (
        <div className="overflow-x-auto rounded-2xl border border-purple-500/20">
          <table className="w-full text-xs text-left">
            <thead className="bg-purple-950/50 text-purple-200 uppercase text-[10px]">
              <tr>
                <th className="p-3">Purchase ID</th>
                <th className="p-3">User ID</th>
                <th className="p-3">Item</th>
                <th className="p-3">Coins</th>
                <th className="p-3">Status</th>
                <th className="p-3">Created</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-500/15">
              {purchases.map((p) => (
                <tr key={p.purchaseId}>
                  <td className="p-3 font-mono text-[11px] text-white">{p.purchaseId}</td>
                  <td className="p-3 font-mono text-[11px] text-white/75">{p.userId}</td>
                  <td className="p-3 font-bold text-white">{p.itemNameSnapshot}</td>
                  <td className="p-3 font-black text-amber-300">{p.totalCoins.toLocaleString()}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        p.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : p.status === 'refunded' || p.status === 'reversed'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3 text-[10px] text-white/55">{new Date(p.createdAt).toLocaleString()}</td>
                  <td className="p-3 text-right">
                    {canManage && p.status === 'completed' ? (
                      <button
                        type="button"
                        onClick={() => handleRefundPurchase(p.purchaseId)}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 text-rose-200 text-[10px] font-bold inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Refund Coins
                      </button>
                    ) : (
                      <span className="text-[10px] text-white/30">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* INVENTORY SUB-TAB */}
      {subTab === 'inventory' && (
        <div className="overflow-x-auto rounded-2xl border border-purple-500/20">
          <table className="w-full text-xs text-left">
            <thead className="bg-purple-950/50 text-purple-200 uppercase text-[10px]">
              <tr>
                <th className="p-3">Inventory ID</th>
                <th className="p-3">User ID</th>
                <th className="p-3">Item / Slot</th>
                <th className="p-3">Status</th>
                <th className="p-3">Equipped</th>
                <th className="p-3">Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-500/15">
              {inventory.map((inv) => (
                <tr key={inv.inventoryId}>
                  <td className="p-3 font-mono text-[11px] text-white">{inv.inventoryId}</td>
                  <td className="p-3 font-mono text-[11px] text-white/75">{inv.userId}</td>
                  <td className="p-3">
                    <div className="font-bold text-white">{inv.itemName}</div>
                    <div className="font-mono text-[10px] text-purple-300">{inv.equipSlot}</div>
                  </td>
                  <td className="p-3 uppercase font-black text-[10px] text-emerald-300">{inv.status}</td>
                  <td className="p-3">{inv.isEquipped ? 'YES' : 'NO'}</td>
                  <td className="p-3 text-[10px] text-white/60">
                    {inv.expiresAt ? new Date(inv.expiresAt).toLocaleString() : 'Permanent'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* AUDITS SUB-TAB */}
      {subTab === 'audits' && (
        <div className="space-y-2">
          {auditLogs.map((a) => (
            <div key={a.audit_id} className="rounded-xl bg-[#160a2d] border border-purple-500/20 p-3 text-xs flex items-center justify-between">
              <div>
                <div className="font-bold text-white">
                  <span className="text-pink-300 font-mono">{a.action_type}</span> → {a.target_id}
                </div>
                <div className="text-[11px] text-white/60">{a.reason}</div>
              </div>
              <div className="text-right text-[10px] text-white/50 font-mono">
                <div>{a.admin_id} ({a.actor_role})</div>
                <div>{new Date(a.created_at).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#170933] border border-pink-500/40 p-5 text-center space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-pink-300">Admin Store Preview</span>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="text-xs text-white/60 hover:text-white font-bold"
              >
                Close
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewItem.previewImageUrl} alt={previewItem.name} className="w-32 h-32 mx-auto object-contain" />
            <div className="text-base font-black text-white">{previewItem.name}</div>
            <div className="text-xs text-white/65">{previewItem.description}</div>
            <div className="text-sm font-black text-amber-300">{previewItem.coinPrice.toLocaleString()} Coins • {previewItem.durationLabel}</div>
          </div>
        </div>
      )}
    </div>
  );
}
