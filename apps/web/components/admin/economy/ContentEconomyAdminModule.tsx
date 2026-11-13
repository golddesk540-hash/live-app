'use client';

import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Layers,
  Gift,
  Coins,
  TrendingUp,
  Sparkles,
  FolderTree,
  ShoppingBag,
  History,
  Settings,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  ContentRecord,
  GiftRecord,
  CoinPackageRecord,
  VirtualItemRecord,
  ContentCategoryRecord,
  StoreContentRecord,
  EconomyActivityLog,
  EconomySettingsConfig,
  ContentEconomyNavTab,
} from './contentEconomyTypes';
import {
  INITIAL_CONTENT_RECORDS,
  INITIAL_GIFT_RECORDS,
  INITIAL_COIN_PACKAGES,
  INITIAL_VIRTUAL_ITEMS,
  INITIAL_CONTENT_CATEGORIES,
  INITIAL_STORE_CONTENT,
  INITIAL_ECONOMY_ACTIVITY,
  INITIAL_ECONOMY_SETTINGS,
  computeEconomyMetrics,
} from './mockContentEconomyData';
import { ContentEconomyDashboardView } from './ContentEconomyDashboardView';
import { ContentManagementView } from './ContentManagementView';
import { GiftManagementView } from './GiftManagementView';
import { CoinPackageManagementView } from './CoinPackageManagementView';
import { EconomyOverviewView } from './EconomyOverviewView';
import { VirtualItemManagementView } from './VirtualItemManagementView';
import { ContentCategoriesView } from './ContentCategoriesView';
import { StoreContentView } from './StoreContentView';
import { EconomyActivityHistoryView } from './EconomyActivityHistoryView';
import { ContentPreviewModal } from './ContentPreviewModal';
import { GiftEditorModal } from './GiftEditorModal';
import { CoinPackageEditorModal } from './CoinPackageEditorModal';
import { CategoryEditorModal } from './CategoryEditorModal';
import { VirtualItemEditorModal } from './VirtualItemEditorModal';
import { EconomySettingsModal } from './EconomySettingsModal';

interface Props {
  initialTab?: ContentEconomyNavTab;
  onLogActivity?: (title: string, desc: string, group?: any) => void;
}

export const ContentEconomyAdminModule: React.FC<Props> = ({
  initialTab = 'dashboard',
  onLogActivity,
}) => {
  const [activeTab, setActiveTab] = useState<ContentEconomyNavTab>(initialTab);

  // Core Data States
  const [contentItems, setContentItems] = useState<ContentRecord[]>(INITIAL_CONTENT_RECORDS);
  const [gifts, setGifts] = useState<GiftRecord[]>(INITIAL_GIFT_RECORDS);
  const [packages, setPackages] = useState<CoinPackageRecord[]>(INITIAL_COIN_PACKAGES);
  const [virtualItems, setVirtualItems] = useState<VirtualItemRecord[]>(INITIAL_VIRTUAL_ITEMS);
  const [categories, setCategories] = useState<ContentCategoryRecord[]>(INITIAL_CONTENT_CATEGORIES);
  const [storeItems, setStoreItems] = useState<StoreContentRecord[]>(INITIAL_STORE_CONTENT);
  const [activityLogs, setActivityLogs] = useState<EconomyActivityLog[]>(INITIAL_ECONOMY_ACTIVITY);
  const [economySettings, setEconomySettings] = useState<EconomySettingsConfig>(INITIAL_ECONOMY_SETTINGS);

  // Modals
  const [previewContent, setPreviewContent] = useState<ContentRecord | null>(null);
  const [editGift, setEditGift] = useState<GiftRecord | null>(null);
  const [editPackage, setEditPackage] = useState<CoinPackageRecord | null>(null);
  const [categoryModal, setCategoryModal] = useState<{
    isOpen: boolean;
    category: ContentCategoryRecord | null;
  }>({ isOpen: false, category: null });
  const [virtualItemModal, setVirtualItemModal] = useState<VirtualItemRecord | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Metrics calculation
  const metrics = useMemo(
    () => computeEconomyMetrics(contentItems, gifts, packages, virtualItems, storeItems),
    [contentItems, gifts, packages, virtualItems, storeItems]
  );

  // Handlers for Content
  const handleSaveContent = (updated: ContentRecord) => {
    setContentItems((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    showToast(`Content item "${updated.title}" updated.`);
    if (onLogActivity) {
      onLogActivity(`Updated content ${updated.id}`, updated.title, 'content');
    }
  };

  // Handlers for Gifts
  const handleSaveGift = (updated: GiftRecord) => {
    setGifts((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    const newLog: EconomyActivityLog = {
      id: `ACT-EC-${Date.now().toString().slice(-4)}`,
      title: 'Updated Gift Record',
      adminName: 'Admin Sarah',
      activityType: 'gift_updated',
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      relativeTime: 'Just now',
      relatedItemId: updated.id,
      description: `Saved changes to "${updated.name}" (${updated.coinValue} demo coins).`,
    };
    setActivityLogs((prev) => [newLog, ...prev]);
    showToast(`Gift "${updated.name}" updated successfully.`);
    if (onLogActivity) {
      onLogActivity(`Updated gift ${updated.id}`, updated.name, 'economy');
    }
  };

  // Handlers for Coin Packages
  const handleSavePackage = (updated: CoinPackageRecord) => {
    setPackages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    const newLog: EconomyActivityLog = {
      id: `ACT-EC-${Date.now().toString().slice(-4)}`,
      title: 'Configured Coin Package',
      adminName: 'Admin Tariq',
      activityType: 'coin_package_edited',
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      relativeTime: 'Just now',
      relatedItemId: updated.id,
      description: `Adjusted "${updated.name}" to ${updated.totalCoins} coins ($${updated.demoPriceUsd}).`,
    };
    setActivityLogs((prev) => [newLog, ...prev]);
    showToast(`Coin Package "${updated.name}" saved.`);
    if (onLogActivity) {
      onLogActivity(`Updated package ${updated.id}`, updated.name, 'economy');
    }
  };

  // Handlers for Categories
  const handleSaveCategory = (updated: ContentCategoryRecord) => {
    setCategories((prev) => {
      const exists = prev.some((c) => c.id === updated.id);
      if (exists) {
        return prev.map((c) => (c.id === updated.id ? updated : c));
      }
      return [updated, ...prev];
    });
    showToast(`Category "${updated.name}" saved.`);
  };

  const handleToggleCategoryStatus = (catId: string) => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id === catId) {
          const next = c.status === 'Active' ? 'Inactive' : 'Active';
          showToast(`Category ${c.name} status: ${next}`);
          return { ...c, status: next };
        }
        return c;
      })
    );
  };

  // Handlers for Virtual Items
  const handleSaveVirtualItem = (updated: VirtualItemRecord) => {
    setVirtualItems((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
    // Also update in store items if present
    setStoreItems((prev) =>
      prev.map((s) =>
        s.id === updated.id
          ? {
              ...s,
              name: updated.name,
              coinPrice: updated.coinValue,
              status: updated.status,
              duration: updated.durationLabel,
              isFeatured: Boolean(updated.isFeatured),
            }
          : s
      )
    );
    showToast(`Virtual asset "${updated.name}" updated.`);
  };

  // Handlers for Economy Settings
  const handleSaveSettings = (updated: EconomySettingsConfig) => {
    setEconomySettings(updated);
    showToast('Platform economy configuration saved.');
  };

  const handleResetSettings = () => {
    setEconomySettings(INITIAL_ECONOMY_SETTINGS);
    showToast('Platform economy settings restored to default baseline.');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#1A103C] border border-pink-500/50 text-white text-xs shadow-[0_0_25px_rgba(255,15,123,0.35)] animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-gray-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Module Subnav Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 overflow-x-auto scrollbar-none gap-2">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            data-testid="content-economy-tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-[0_0_15px_rgba(255,15,123,0.25)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            data-testid="content-economy-tab-content"
            onClick={() => setActiveTab('content')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'content'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Content ({metrics.totalContentItems})</span>
          </button>

          <button
            data-testid="content-economy-tab-gifts"
            onClick={() => setActiveTab('gifts')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'gifts'
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-[0_0_15px_rgba(255,15,123,0.25)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>Gifts ({metrics.activeGifts})</span>
          </button>

          <button
            data-testid="content-economy-tab-packages"
            onClick={() => setActiveTab('packages')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'packages'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Coin Packages ({metrics.availableCoinPackages})</span>
          </button>

          <button
            data-testid="content-economy-tab-overview"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Economy Overview</span>
          </button>

          <button
            data-testid="content-economy-tab-virtual_items"
            onClick={() => setActiveTab('virtual_items')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'virtual_items'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Virtual Items ({metrics.virtualItemsCount})</span>
          </button>

          <button
            data-testid="content-economy-tab-categories"
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'categories'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.25)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>Categories ({categories.length})</span>
          </button>

          <button
            data-testid="content-economy-tab-store"
            onClick={() => setActiveTab('store')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'store'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Store ({storeItems.length})</span>
          </button>

          <button
            data-testid="content-economy-tab-activity"
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'activity'
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-[0_0_15px_rgba(255,15,123,0.25)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Activity History</span>
          </button>

          <button
            data-testid="content-economy-tab-settings"
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <Settings className="w-4 h-4" />
            <span>Economy Settings</span>
          </button>
        </div>
      </div>

      {/* Main View Switching */}
      {activeTab === 'dashboard' && (
        <ContentEconomyDashboardView
          metrics={metrics}
          recentActivity={activityLogs}
          onSelectTab={setActiveTab}
          onOpenNewContent={() => setActiveTab('content')}
          onOpenNewGift={() => setActiveTab('gifts')}
          onOpenNewPackage={() => setActiveTab('packages')}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onRefresh={() => showToast('Content & economy state refreshed.')}
        />
      )}

      {activeTab === 'content' && (
        <ContentManagementView
          contentItems={contentItems}
          onPreview={(c) => setPreviewContent(c)}
          onEdit={(c) => {
            setPreviewContent(c);
          }}
          onAddNew={() => {
            const newItem: ContentRecord = {
              id: `CNT-${Date.now().toString().slice(-4)}`,
              title: 'New Promotional Live Banner',
              thumbnailUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=500&q=80',
              category: 'Promotions',
              type: 'Banner',
              description: 'Freshly created promotional banner ready for editorial review.',
              createdDate: new Date().toISOString().split('T')[0],
              updatedDate: 'Just now',
              status: 'Draft',
              viewsCount: 0,
              clicksCount: 0,
              priorityOrder: contentItems.length + 1,
            };
            setContentItems((prev) => [newItem, ...prev]);
            showToast('New draft content record created.');
          }}
        />
      )}

      {activeTab === 'gifts' && (
        <GiftManagementView
          gifts={gifts}
          onPreview={(g) => setEditGift(g)}
          onEdit={(g) => setEditGift(g)}
          onAddNew={() => {
            const newGift: GiftRecord = {
              id: `GFT-DEMO-${Date.now().toString().slice(-4)}`,
              name: 'Golden Starlight Chime',
              imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&q=80',
              thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=100&q=80',
              category: 'Special',
              coinValue: 500,
              description: 'Charming melodic bells ringing in live chat rooms.',
              status: 'Draft',
              createdDate: new Date().toISOString().split('T')[0],
              updatedDate: 'Just now',
              usageCount: 0,
            };
            setGifts((prev) => [newGift, ...prev]);
            setEditGift(newGift);
          }}
        />
      )}

      {activeTab === 'packages' && (
        <CoinPackageManagementView
          packages={packages}
          onEdit={(p) => setEditPackage(p)}
          onAddNew={() => {
            const newPkg: CoinPackageRecord = {
              id: `PKG-${Date.now().toString().slice(-4)}`,
              name: 'Special Gifter Tier',
              coinQuantity: 2500,
              bonusCoins: 350,
              totalCoins: 2850,
              demoPriceUsd: 29.99,
              demoPricePkr: 8400,
              category: 'Popular',
              status: 'Active',
              isFeatured: true,
              createdDate: new Date().toISOString().split('T')[0],
              salesCount: 0,
            };
            setPackages((prev) => [newPkg, ...prev]);
            setEditPackage(newPkg);
          }}
        />
      )}

      {activeTab === 'overview' && <EconomyOverviewView metrics={metrics} />}

      {activeTab === 'virtual_items' && (
        <VirtualItemManagementView
          items={virtualItems}
          onEdit={(v) => setVirtualItemModal(v)}
          onPreview={(v) => setVirtualItemModal(v)}
          onAddNew={() => {
            const newItem: VirtualItemRecord = {
              id: `VRT-NEW-${Date.now().toString().slice(-4)}`,
              name: 'Sapphire Dragon Aura',
              imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&q=80',
              category: 'profile_frame',
              categoryLabel: 'Profile Frame',
              coinValue: 750,
              status: 'Draft',
              durationLabel: '30 Days',
              slotKey: 'profile_frame',
              createdDate: new Date().toISOString().split('T')[0],
              soldCount: 0,
              description: 'Glowing sapphire dragon wings surrounding the user avatar.',
            };
            setVirtualItems((prev) => [newItem, ...prev]);
            setVirtualItemModal(newItem);
          }}
        />
      )}

      {activeTab === 'categories' && (
        <ContentCategoriesView
          categories={categories}
          onAddCategory={() => setCategoryModal({ isOpen: true, category: null })}
          onEditCategory={(c) => setCategoryModal({ isOpen: true, category: c })}
          onToggleStatus={handleToggleCategoryStatus}
        />
      )}

      {activeTab === 'store' && (
        <StoreContentView
          storeItems={storeItems}
          onEdit={(v) => setVirtualItemModal(v)}
          onPreview={(v) => setVirtualItemModal(v)}
        />
      )}

      {activeTab === 'activity' && <EconomyActivityHistoryView activityLogs={activityLogs} />}

      {/* Modals */}
      <ContentPreviewModal
        content={previewContent}
        isOpen={Boolean(previewContent)}
        onClose={() => setPreviewContent(null)}
        onEdit={(c) => {
          handleSaveContent(c);
        }}
      />

      <GiftEditorModal
        gift={editGift}
        isOpen={Boolean(editGift)}
        onClose={() => setEditGift(null)}
        onSave={handleSaveGift}
      />

      <CoinPackageEditorModal
        pkg={editPackage}
        isOpen={Boolean(editPackage)}
        onClose={() => setEditPackage(null)}
        onSave={handleSavePackage}
      />

      <CategoryEditorModal
        category={categoryModal.category}
        isOpen={categoryModal.isOpen}
        onClose={() => setCategoryModal({ isOpen: false, category: null })}
        onSave={handleSaveCategory}
      />

      <VirtualItemEditorModal
        item={virtualItemModal}
        isOpen={Boolean(virtualItemModal)}
        onClose={() => setVirtualItemModal(null)}
        onSave={handleSaveVirtualItem}
      />

      <EconomySettingsModal
        settings={economySettings}
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={handleSaveSettings}
        onReset={handleResetSettings}
      />
    </div>
  );
};
