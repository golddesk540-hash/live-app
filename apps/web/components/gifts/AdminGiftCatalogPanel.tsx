'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ClipboardList,
  Edit3,
  Eye,
  FolderPlus,
  Gift,
  LogIn,
  PlusCircle,
  Power,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Upload,
  Wallet,
} from 'lucide-react';
import AdminAnimationsTab from '../animations/AdminAnimationsTab';
import type {
  GiftAuditLogRecord,
  GiftCatalogItem,
  GiftCategoryRecord,
} from '@/lib/giftCatalog';
import GiftAnimationPreview, {
  DEFAULT_FALLBACK_GIFT_IMAGE,
  type GiftAssetType,
} from './GiftAnimationPreview';

interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function AdminGiftCatalogPanel() {
  const [authUser, setAuthUser] = useState<SessionUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loginEmail, setLoginEmail] = useState('ordinaryadmin@popolive.com');
  const [loginPassword, setLoginPassword] = useState('AdminPass123!');
  const [loginBusy, setLoginBusy] = useState(false);

  const [tab, setTab] = useState<'gifts' | 'categories' | 'animations' | 'audit'>('gifts');
  const [gifts, setGifts] = useState<GiftCatalogItem[]>([]);
  const [categories, setCategories] = useState<GiftCategoryRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<GiftAuditLogRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Create / Edit gift form state
  const [editingGiftId, setEditingGiftId] = useState<string | null>(null);
  const [giftName, setGiftName] = useState('');
  const [giftNameUr, setGiftNameUr] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionUr, setDescriptionUr] = useState('');
  const [coinPrice, setCoinPrice] = useState('100');
  const [categoryId, setCategoryId] = useState('luxury');
  const [giftType, setGiftType] = useState('standard');
  const [assetType, setAssetType] = useState<GiftAssetType>('png');
  const [imageUrl, setImageUrl] = useState('/assets/gifts/rose.png');
  const [thumbnailUrl, setThumbnailUrl] = useState('/assets/gifts/thumbs/rose.png');
  const [animationUrl, setAnimationUrl] = useState('/assets/gifts/animations/rose.json');
  const [displayOrder, setDisplayOrder] = useState('25');
  const [isPopular, setIsPopular] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const [savingGift, setSavingGift] = useState(false);

  // Category form state
  const [catName, setCatName] = useState('');
  const [catNameUr, setCatNameUr] = useState('');
  const [catShortName, setCatShortName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catOrder, setCatOrder] = useState('15');
  const [savingCat, setSavingCat] = useState(false);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [giftsRes, catsRes, logsRes] = await Promise.all([
        fetch('/api/admin/gifts?limit=100', { cache: 'no-store' }),
        fetch('/api/admin/gifts/categories', { cache: 'no-store' }),
        fetch('/api/admin/gifts/audit-logs?limit=50', { cache: 'no-store' }),
      ]);

      if (giftsRes.status === 403 || giftsRes.status === 401) {
        setAuthUser(null);
        setAuthChecked(true);
        return;
      }

      const [gData, cData, lData] = await Promise.all([
        giftsRes.json(),
        catsRes.json(),
        logsRes.json(),
      ]);

      if (gData.success) setGifts(gData.gifts || []);
      if (cData.success) setCategories(cData.categories || []);
      if (lData.success) setAuditLogs(lData.logs || []);
      if (gData.success && (!authUser || !authChecked)) {
        setAuthUser({ id: 'admin', email: loginEmail, name: 'Admin', role: 'admin' });
      }
      setAuthChecked(true);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to fetch admin gift data'
      );
      setAuthChecked(true);
    } finally {
      setLoading(false);
    }
  }, [authUser, authChecked, loginEmail]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Sign-in failed');
      }
      setAuthUser(data.user);
      setStatusMessage(`Signed in as ${data.user.email} (${data.user.role})`);
      await loadAdminData();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoginBusy(false);
    }
  };

  const resetGiftForm = () => {
    setEditingGiftId(null);
    setGiftName('');
    setGiftNameUr('');
    setDescription('');
    setDescriptionUr('');
    setCoinPrice('100');
    setGiftType('standard');
    setAssetType('png');
    setImageUrl('/assets/gifts/rose.png');
    setThumbnailUrl('/assets/gifts/thumbs/rose.png');
    setAnimationUrl('/assets/gifts/animations/rose.json');
    setDisplayOrder('25');
    setIsPopular(false);
    setIsNew(true);
    setIsFeatured(false);
  };

  const startEditGift = (item: GiftCatalogItem) => {
    setEditingGiftId(item.giftId);
    setGiftName(item.name);
    setGiftNameUr(item.nameUr || '');
    setDescription(item.description || '');
    setDescriptionUr(item.descriptionUr || '');
    setCoinPrice(String(item.coinPrice));
    setCategoryId(String(item.categoryId));
    setGiftType(item.giftType || 'standard');
    setAssetType(item.assetType || 'png');
    setImageUrl(item.imageUrl);
    setThumbnailUrl(item.thumbnailUrl);
    setAnimationUrl(item.animationUrl || '');
    setDisplayOrder(String(item.displayOrder));
    setIsPopular(item.isPopular);
    setIsNew(item.isNew);
    setIsFeatured(item.isFeatured);
    setTab('gifts');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAsset(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/admin/gifts/upload', {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Asset upload failed');
      }
      const asset = data.asset;
      if (asset.assetType !== 'audio') {
        setAssetType(asset.assetType);
      }
      if (asset.assetType === 'lottie' || asset.assetType === 'video' || asset.assetType === 'gif') {
        setAnimationUrl(asset.fileUrl);
      }
      if (asset.assetType === 'png' || asset.assetType === 'webp' || asset.assetType === 'gif') {
        setImageUrl(asset.fileUrl);
        setThumbnailUrl(asset.thumbnailUrl || asset.fileUrl);
      }
      setStatusMessage(`Uploaded ${asset.fileName} (${asset.assetType.toUpperCase()})`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Upload error');
    } finally {
      setUploadingAsset(false);
    }
  };

  const handleSaveGift = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGift(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const payload = {
        name: giftName,
        nameUr: giftNameUr || giftName,
        description: description || `${giftName} virtual gift`,
        descriptionUr: descriptionUr || description || giftName,
        coinPrice: Number(coinPrice),
        categoryId,
        giftType,
        assetType,
        imageUrl,
        thumbnailUrl: thumbnailUrl || imageUrl,
        animationUrl: animationUrl || null,
        displayOrder: Number(displayOrder) || 10,
        isPopular,
        isNew,
        isFeatured,
        reason: editingGiftId ? 'Admin catalog edit' : 'Admin catalog publish',
      };

      const url = editingGiftId
        ? `/api/admin/gifts/${encodeURIComponent(editingGiftId)}`
        : '/api/admin/gifts';
      const method = editingGiftId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save gift');
      }
      setStatusMessage(
        editingGiftId
          ? `Updated gift "${data.gift.name}" (${data.gift.coinPrice} coins)`
          : `Published new gift "${data.gift.name}" (${data.gift.coinPrice} coins)`
      );
      resetGiftForm();
      await loadAdminData();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Save error');
    } finally {
      setSavingGift(false);
    }
  };

  const handleToggleGiftStatus = async (item: GiftCatalogItem) => {
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const res = await fetch(
        `/api/admin/gifts/${encodeURIComponent(item.giftId)}/status`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isActive: !item.isActive,
            reason: !item.isActive ? 'Admin enabled gift' : 'Admin disabled gift',
          }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Status toggle failed');
      }
      setStatusMessage(
        `${item.name} is now ${!item.isActive ? 'ACTIVE' : 'DISABLED'}`
      );
      await loadAdminData();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Status update failed');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCat(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/admin/gifts/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: catName,
          nameUr: catNameUr || catName,
          shortName: catShortName || catName,
          slug: catSlug || catName.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
          displayOrder: Number(catOrder) || 15,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Category creation failed');
      }
      setStatusMessage(`Created category "${data.category.name}"`);
      setCatName('');
      setCatNameUr('');
      setCatShortName('');
      setCatSlug('');
      await loadAdminData();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Category error');
    } finally {
      setSavingCat(false);
    }
  };

  const handleToggleCategory = async (cat: GiftCategoryRecord) => {
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/gifts/categories/${cat.categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !cat.isActive }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update category');
      }
      setStatusMessage(
        `Category "${cat.name}" is now ${!cat.isActive ? 'ACTIVE' : 'DISABLED'}`
      );
      await loadAdminData();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Category update error');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#080312] text-white p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-gradient-to-r from-[#1b093b] to-[#120529] border border-[#3e1e73] p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ff007f] to-[#7c3aed] flex items-center justify-center shadow-[0_0_20px_rgba(255,0,127,0.4)]">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold">
                Popo Live — Gift Catalog Admin
              </h1>
              <p className="text-xs text-purple-300">
                Manage official virtual gifts, categories, animations & prices
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Link
              href="/gifts?preview=demo"
              className="inline-flex items-center gap-1.5 rounded-full bg-pink-600/20 border border-pink-400/50 px-3 py-1.5 font-semibold text-pink-200 hover:bg-pink-600 hover:text-white transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Public Catalog</span>
            </Link>
            <Link
              href="/admin/wallet"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#241046] border border-[#42207a] px-3 py-1.5 font-semibold text-purple-200 hover:border-pink-400"
            >
              <Wallet className="w-3.5 h-3.5 text-amber-300" />
              <span>Admin Finance</span>
            </Link>
            <button
              type="button"
              onClick={loadAdminData}
              className="inline-flex items-center gap-1 rounded-full bg-[#241046] border border-[#42207a] px-3 py-1.5 font-semibold text-purple-200 hover:border-pink-400"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </header>

        {/* Auth Gate */}
        {authChecked && !authUser && (
          <form
            onSubmit={handleLogin}
            data-testid="admin-gift-login-form"
            className="mx-auto max-w-md rounded-3xl bg-[#160830] border border-pink-500/40 p-6 space-y-4 shadow-[0_0_30px_rgba(236,72,153,0.18)]"
          >
            <div className="flex items-center gap-2 text-pink-300">
              <LogIn className="w-5 h-5" />
              <h2 className="text-base font-bold text-white">
                Admin Sign In Required
              </h2>
            </div>
            <p className="text-xs text-purple-300">
              Only authorized admin or finance staff can publish, upload, price, or
              disable virtual gifts.
            </p>
            <div className="space-y-2">
              <label className="block text-xs text-purple-200">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className="w-full rounded-xl bg-[#0e0420] border border-[#3e1d74] px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs text-purple-200">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="w-full rounded-xl bg-[#0e0420] border border-[#3e1d74] px-3 py-2 text-sm text-white"
              />
            </div>
            {errorMessage && (
              <p className="text-xs text-rose-300 font-semibold">{errorMessage}</p>
            )}
            <button
              type="submit"
              disabled={loginBusy}
              className="w-full rounded-xl bg-gradient-to-r from-[#ff007f] to-[#9333ea] py-2.5 text-sm font-bold text-white"
            >
              {loginBusy ? 'Signing In...' : 'Sign In as Catalog Admin'}
            </button>
          </form>
        )}

        {statusMessage && (
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-950/70 border border-emerald-400/50 px-4 py-2.5 text-xs text-emerald-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
        {errorMessage && authUser && (
          <div className="rounded-2xl bg-rose-950/70 border border-rose-400/50 px-4 py-2.5 text-xs text-rose-200">
            {errorMessage}
          </div>
        )}

        {authUser && (
          <>
            {/* Navigation Tabs */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTab('gifts')}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold ${
                  tab === 'gifts'
                    ? 'bg-gradient-to-r from-[#ff007f] to-[#ec4899] text-white'
                    : 'bg-[#1a0a36] border border-[#3a1a70] text-purple-200'
                }`}
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Gifts ({gifts.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('categories')}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold ${
                  tab === 'categories'
                    ? 'bg-gradient-to-r from-[#ff007f] to-[#ec4899] text-white'
                    : 'bg-[#1a0a36] border border-[#3a1a70] text-purple-200'
                }`}
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Categories ({categories.length})</span>
              </button>
              <button
                type="button"
                data-testid="admin-tab-animations"
                onClick={() => setTab('animations')}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold ${
                  tab === 'animations'
                    ? 'bg-gradient-to-r from-[#ff007f] to-[#ec4899] text-white'
                    : 'bg-[#1a0a36] border border-[#3a1a70] text-purple-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Animations &amp; Entrances</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('audit')}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold ${
                  tab === 'audit'
                    ? 'bg-gradient-to-r from-[#ff007f] to-[#ec4899] text-white'
                    : 'bg-[#1a0a36] border border-[#3a1a70] text-purple-200'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Audit Logs ({auditLogs.length})</span>
              </button>
            </div>

            {tab === 'gifts' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Create / Edit Gift Form + Live Preview */}
                <form
                  onSubmit={handleSaveGift}
                  className="lg:col-span-5 rounded-3xl bg-[#15072e] border border-[#38186c] p-5 space-y-3.5"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-extrabold flex items-center gap-1.5">
                      <PlusCircle className="w-4 h-4 text-pink-400" />
                      <span>
                        {editingGiftId
                          ? `Edit Gift (${editingGiftId})`
                          : 'Publish New Virtual Gift'}
                      </span>
                    </h2>
                    {editingGiftId && (
                      <button
                        type="button"
                        onClick={resetGiftForm}
                        className="text-[11px] text-pink-300 hover:underline"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  {/* Live Preview before Publish */}
                  <div className="rounded-2xl bg-[#0e0420] border border-[#2f145c] p-3 flex items-center gap-4">
                    <GiftAnimationPreview
                      name={giftName || 'Preview Gift'}
                      imageUrl={imageUrl}
                      animationUrl={animationUrl}
                      fallbackImageUrl={DEFAULT_FALLBACK_GIFT_IMAGE}
                      assetType={assetType}
                      size="md"
                      playing
                    />
                    <div className="min-w-0 text-xs space-y-1">
                      <p className="font-bold text-white truncate">
                        {giftName || 'Gift Name Preview'}
                      </p>
                      <p className="text-amber-300 font-bold">
                        {Number(coinPrice || 0).toLocaleString()} Coins
                      </p>
                      <p className="text-[11px] text-purple-300 uppercase">
                        Asset: {assetType}
                      </p>
                    </div>
                  </div>

                  {/* Asset Upload */}
                  <div className="rounded-2xl bg-[#1b0b3c] border border-dashed border-pink-400/50 p-3">
                    <label className="flex items-center justify-between gap-2 text-xs cursor-pointer">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-pink-200">
                        <Upload className="w-4 h-4 text-pink-400" />
                        <span>
                          {uploadingAsset
                            ? 'Uploading & validating...'
                            : 'Upload Gift Asset (PNG, WebP, GIF, Lottie JSON, Video)'}
                        </span>
                      </span>
                      <input
                        type="file"
                        accept=".png,.webp,.gif,.json,.mp4,.webm"
                        onChange={handleAssetUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div>
                      <label className="block text-purple-300 mb-1">Name (EN)*</label>
                      <input
                        type="text"
                        required
                        value={giftName}
                        onChange={(e) => setGiftName(e.target.value)}
                        className="w-full rounded-xl bg-[#0e0420] border border-[#371968] px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-purple-300 mb-1">Name (UR)</label>
                      <input
                        type="text"
                        value={giftNameUr}
                        onChange={(e) => setGiftNameUr(e.target.value)}
                        className="w-full rounded-xl bg-[#0e0420] border border-[#371968] px-3 py-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 text-xs">
                    <div>
                      <label className="block text-purple-300 mb-1">Coin Price*</label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={coinPrice}
                        onChange={(e) => setCoinPrice(e.target.value)}
                        className="w-full rounded-xl bg-[#0e0420] border border-[#371968] px-3 py-2 text-amber-300 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-purple-300 mb-1">Category*</label>
                      <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full rounded-xl bg-[#0e0420] border border-[#371968] px-2 py-2 text-white"
                      >
                        {categories
                          .filter((c) => !c.isVirtualFilter)
                          .map((cat) => (
                            <option key={cat.categoryId} value={cat.categoryId}>
                              {cat.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-purple-300 mb-1">Order</label>
                      <input
                        type="number"
                        value={displayOrder}
                        onChange={(e) => setDisplayOrder(e.target.value)}
                        className="w-full rounded-xl bg-[#0e0420] border border-[#371968] px-3 py-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div>
                      <label className="block text-purple-300 mb-1">Gift Type</label>
                      <input
                        type="text"
                        value={giftType}
                        onChange={(e) => setGiftType(e.target.value)}
                        className="w-full rounded-xl bg-[#0e0420] border border-[#371968] px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-purple-300 mb-1">Asset Type</label>
                      <select
                        value={assetType}
                        onChange={(e) => setAssetType(e.target.value as GiftAssetType)}
                        className="w-full rounded-xl bg-[#0e0420] border border-[#371968] px-2 py-2 text-white"
                      >
                        <option value="png">PNG</option>
                        <option value="webp">WebP</option>
                        <option value="gif">GIF</option>
                        <option value="lottie">Lottie JSON</option>
                        <option value="video">Video</option>
                      </select>
                    </div>
                  </div>

                  <div className="text-xs space-y-2">
                    <label className="block text-purple-300">Image URL</label>
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full rounded-xl bg-[#0e0420] border border-[#371968] px-3 py-2 text-white"
                    />
                    <label className="block text-purple-300">
                      Animation URL (Optional)
                    </label>
                    <input
                      type="text"
                      value={animationUrl}
                      onChange={(e) => setAnimationUrl(e.target.value)}
                      className="w-full rounded-xl bg-[#0e0420] border border-[#371968] px-3 py-2 text-white"
                    />
                    <label className="block text-purple-300">Description</label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full rounded-xl bg-[#0e0420] border border-[#371968] px-3 py-2 text-white"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs pt-1">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                      />
                      <span>Featured</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPopular}
                        onChange={(e) => setIsPopular(e.target.checked)}
                      />
                      <span>Popular</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isNew}
                        onChange={(e) => setIsNew(e.target.checked)}
                      />
                      <span>New Arrival</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={savingGift}
                    className="w-full rounded-2xl bg-gradient-to-r from-[#ff007f] to-[#9333ea] py-2.5 text-sm font-extrabold text-white hover:brightness-110"
                  >
                    {savingGift
                      ? 'Saving...'
                      : editingGiftId
                        ? 'Save Gift Changes'
                        : 'Publish Gift to Catalog'}
                  </button>
                </form>

                {/* Existing Gifts Table */}
                <div className="lg:col-span-7 rounded-3xl bg-[#15072e] border border-[#38186c] p-5 overflow-x-auto">
                  <h2 className="text-sm font-extrabold mb-3">
                    Catalog Items ({gifts.length})
                  </h2>
                  <div className="space-y-2.5">
                    {gifts.map((item) => (
                      <div
                        key={item.giftId}
                        className={`flex items-center justify-between gap-3 rounded-2xl border p-3 ${
                          item.isActive
                            ? 'bg-[#1b0a3b] border-[#3d1c73]'
                            : 'bg-[#120726]/70 border-rose-500/30 opacity-70'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={
                              item.thumbnailUrl ||
                              item.imageUrl ||
                              DEFAULT_FALLBACK_GIFT_IMAGE
                            }
                            alt={item.name}
                            className="w-11 h-11 rounded-xl bg-[#0e0420] p-1 object-contain shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">
                              {item.name}{' '}
                              <span className="text-xs font-normal text-purple-300">
                                ({item.categoryName})
                              </span>
                            </p>
                            <p className="text-xs text-amber-300 font-bold">
                              {item.coinPrice.toLocaleString()} Coins •{' '}
                              <span className="text-purple-300 uppercase">
                                {item.assetType}
                              </span>{' '}
                              •{' '}
                              <span
                                className={
                                  item.isActive ? 'text-emerald-300' : 'text-rose-300'
                                }
                              >
                                {item.isActive ? 'ACTIVE' : 'DISABLED'}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditGift(item)}
                            className="inline-flex items-center gap-1 rounded-xl bg-[#27104e] px-2.5 py-1.5 text-xs font-semibold text-purple-100 hover:bg-pink-600 hover:text-white"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleGiftStatus(item)}
                            className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold ${
                              item.isActive
                                ? 'bg-rose-950/80 border border-rose-500/40 text-rose-200 hover:bg-rose-700'
                                : 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-700'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span>{item.isActive ? 'Disable' : 'Enable'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'categories' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <form
                  onSubmit={handleCreateCategory}
                  className="lg:col-span-4 rounded-3xl bg-[#15072e] border border-[#38186c] p-5 space-y-3 text-xs"
                >
                  <h2 className="text-sm font-extrabold">Add Gift Category</h2>
                  <div>
                    <label className="block text-purple-300 mb-1">Category Name*</label>
                    <input
                      required
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      className="w-full rounded-xl bg-[#0e0420] border border-[#371968] px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-purple-300 mb-1">Urdu Name</label>
                    <input
                      value={catNameUr}
                      onChange={(e) => setCatNameUr(e.target.value)}
                      className="w-full rounded-xl bg-[#0e0420] border border-[#371968] px-3 py-2 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-purple-300 mb-1">Short Tab Name</label>
                      <input
                        value={catShortName}
                        onChange={(e) => setCatShortName(e.target.value)}
                        className="w-full rounded-xl bg-[#0e0420] border border-[#371968] px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-purple-300 mb-1">Order</label>
                      <input
                        type="number"
                        value={catOrder}
                        onChange={(e) => setCatOrder(e.target.value)}
                        className="w-full rounded-xl bg-[#0e0420] border border-[#371968] px-3 py-2 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-purple-300 mb-1">Slug</label>
                    <input
                      value={catSlug}
                      onChange={(e) => setCatSlug(e.target.value)}
                      placeholder="auto-generated-from-name"
                      className="w-full rounded-xl bg-[#0e0420] border border-[#371968] px-3 py-2 text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingCat}
                    className="w-full rounded-2xl bg-gradient-to-r from-[#ff007f] to-[#9333ea] py-2.5 text-sm font-bold text-white"
                  >
                    {savingCat ? 'Creating...' : 'Create Category'}
                  </button>
                </form>

                <div className="lg:col-span-8 rounded-3xl bg-[#15072e] border border-[#38186c] p-5 space-y-2.5">
                  <h2 className="text-sm font-extrabold mb-2">
                    Configured Categories ({categories.length})
                  </h2>
                  {categories.map((cat) => (
                    <div
                      key={cat.categoryId}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-[#1b0a3b] border border-[#3d1c73] px-4 py-3 text-xs"
                    >
                      <div>
                        <p className="font-bold text-sm text-white">
                          #{cat.displayOrder} {cat.name}{' '}
                          <span className="text-purple-300">({cat.slug})</span>
                        </p>
                        <p className="text-purple-300">
                          {cat.nameUr} • {cat.giftCount ?? 0} active gifts
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleCategory(cat)}
                        className={`rounded-xl px-3 py-1.5 font-semibold ${
                          cat.isActive
                            ? 'bg-rose-950/80 border border-rose-500/40 text-rose-200'
                            : 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200'
                        }`}
                      >
                        {cat.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'animations' && <AdminAnimationsTab />}

            {tab === 'audit' && (
              <div className="rounded-3xl bg-[#15072e] border border-[#38186c] p-5 space-y-2.5">
                <h2 className="text-sm font-extrabold">
                  Gift Catalog Audit Trail ({auditLogs.length})
                </h2>
                {auditLogs.map((log) => (
                  <div
                    key={log.auditId}
                    className="rounded-2xl bg-[#1b0a3b] border border-[#38186c] p-3 text-xs flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-bold text-pink-300">{log.actionType}</span>{' '}
                      <span className="text-purple-200">
                        on {log.targetType} <code>{log.targetId}</code>
                      </span>
                      {log.reason && (
                        <p className="text-purple-300 mt-0.5">{log.reason}</p>
                      )}
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
            )}
          </>
        )}
      </div>
    </div>
  );
}
