import React from 'react';
import {
  Play,
  Image,
  Star,
  Coins,
  Gift,
  Settings,
  Layers,
  Package,
  Sparkles,
  ArrowRight,
  TrendingUp,
  History,
  ShieldCheck,
  Plus,
  RefreshCw,
} from 'lucide-react';
import {
  ContentRecord,
  GiftRecord,
  CoinPackageRecord,
  VirtualItemRecord,
  EconomyActivityLog,
  EconomyMetrics,
  ContentEconomyNavTab,
} from './contentEconomyTypes';

interface Props {
  metrics: EconomyMetrics;
  recentActivity: EconomyActivityLog[];
  onSelectTab: (tab: ContentEconomyNavTab) => void;
  onOpenNewContent?: () => void;
  onOpenNewGift?: () => void;
  onOpenNewPackage?: () => void;
  onOpenSettings?: () => void;
  onRefresh?: () => void;
}

export const ContentEconomyDashboardView: React.FC<Props> = ({
  metrics,
  recentActivity,
  onSelectTab,
  onOpenNewContent,
  onOpenNewGift,
  onOpenNewPackage,
  onOpenSettings,
  onRefresh,
}) => {
  // 6 Primary Operational Hub Cards matching 10_06_content_and_economy_admin.png
  const hubCards = [
    {
      id: 'live_categories',
      title: 'Live Categories',
      subtitle: `${metrics.totalContentItems} Content Topics Active`,
      icon: Play,
      iconBg: 'bg-gradient-to-tr from-[#FF0F7B] to-[#D90066]',
      iconBorder: 'border-pink-500/40',
      actionTab: 'categories' as ContentEconomyNavTab,
      badge: 'Manage',
    },
    {
      id: 'banners',
      title: 'Banners',
      subtitle: 'Homepage Carousels & Promos',
      icon: Image,
      iconBg: 'bg-gradient-to-tr from-[#FF0F7B] to-[#7928CA]',
      iconBorder: 'border-purple-500/40',
      actionTab: 'content' as ContentEconomyNavTab,
      badge: `${metrics.contentPendingReview} Pending`,
    },
    {
      id: 'events',
      title: 'Events',
      subtitle: 'Leaderboard PK & Tournaments',
      icon: Star,
      iconBg: 'bg-gradient-to-tr from-[#FF0F7B] to-[#FF4500]',
      iconBorder: 'border-rose-500/40',
      actionTab: 'content' as ContentEconomyNavTab,
      badge: 'Tourneys',
    },
    {
      id: 'coin_packages',
      title: 'Coin Packages',
      subtitle: `${metrics.availableCoinPackages} Recharge Tiers`,
      icon: Coins,
      iconBg: 'bg-gradient-to-tr from-[#F59E0B] to-[#D97706]',
      iconBorder: 'border-amber-500/40',
      actionTab: 'packages' as ContentEconomyNavTab,
      badge: 'Coins',
    },
    {
      id: 'gifts',
      title: 'Gifts',
      subtitle: `${metrics.activeGifts} Interactive Animations`,
      icon: Gift,
      iconBg: 'bg-gradient-to-tr from-[#FF0F7B] to-[#EC4899]',
      iconBorder: 'border-pink-500/40',
      actionTab: 'gifts' as ContentEconomyNavTab,
      badge: `${metrics.totalGiftCategories} Categories`,
    },
    {
      id: 'economy_settings',
      title: 'Economy Settings',
      subtitle: 'Commission & Exchange Rules',
      icon: Settings,
      iconBg: 'bg-gradient-to-tr from-[#9333EA] to-[#6366F1]',
      iconBorder: 'border-indigo-500/40',
      actionTab: 'settings' as ContentEconomyNavTab,
      badge: 'Config',
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header with Title & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-[#1E0B38]/90 via-[#160A2D]/80 to-[#120726]/90 border border-purple-500/30 shadow-[0_0_35px_rgba(255,15,123,0.15)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_8px_#FF0F7B] animate-pulse" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-pink-400">
              Module 10.6 · Popo Live Central Engine
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Content & Economy Admin
          </h1>
          <p className="text-xs text-gray-300 mt-0.5">
            Manage live categories, promotional banners, virtual gifts, recharge coin tiers, and platform economics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors"
              title="Refresh telemetry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onSelectTab('overview')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-pink-500/40 transition-all cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5 text-pink-400" />
            <span>Economy Overview</span>
          </button>

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-[0_0_20px_rgba(255,15,123,0.35)] transition-all cursor-pointer active:scale-95"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Primary 6 Hub Cards (Matching 10_06_content_and_economy_admin.png) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-purple-300/80">
            Operational Hubs
          </h2>
          <span className="text-[11px] text-gray-500 font-mono">Select a tile to administer</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {hubCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => onSelectTab(card.actionTab)}
                className="group relative cursor-pointer p-6 rounded-3xl bg-[#160A2D]/85 border border-purple-500/20 hover:border-pink-500/50 hover:bg-[#1E0D3D] shadow-lg transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,15,123,0.25)] hover:-translate-y-1 flex flex-col justify-between min-h-[160px]"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl ${card.iconBg} ${card.iconBorder} border group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="w-7 h-7" />
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 group-hover:text-pink-300 group-hover:border-pink-500/40 transition-colors">
                    {card.badge}
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="text-base font-extrabold text-white group-hover:text-pink-300 transition-colors flex items-center justify-between">
                    <span>{card.title}</span>
                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{card.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Core Metrics KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-[#120726]/90 border border-white/5 space-y-1">
          <div className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-purple-400" /> Content Items
          </div>
          <div className="text-lg font-black text-white">{metrics.totalContentItems}</div>
          <div className="text-[10px] text-gray-500">Banners & Categories</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#120726]/90 border border-white/5 space-y-1">
          <div className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
            <Gift className="w-3.5 h-3.5 text-pink-400" /> Active Gifts
          </div>
          <div className="text-lg font-black text-pink-300">{metrics.activeGifts}</div>
          <div className="text-[10px] text-gray-500">Across {metrics.totalGiftCategories} groups</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#120726]/90 border border-white/5 space-y-1">
          <div className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-amber-400" /> Coin Tiers
          </div>
          <div className="text-lg font-black text-amber-300">{metrics.availableCoinPackages}</div>
          <div className="text-[10px] text-gray-500">Recharge catalog</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#120726]/90 border border-white/5 space-y-1">
          <div className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Virtual Items
          </div>
          <div className="text-lg font-black text-cyan-300">{metrics.virtualItemsCount}</div>
          <div className="text-[10px] text-gray-500">Frames & effects</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#120726]/90 border border-white/5 space-y-1">
          <div className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
            <History className="w-3.5 h-3.5 text-rose-400" /> Under Review
          </div>
          <div className="text-lg font-black text-rose-300">{metrics.contentPendingReview}</div>
          <div className="text-[10px] text-gray-500">Pending approval</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#120726]/90 border border-white/5 space-y-1">
          <div className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-emerald-400" /> Coin Circulation
          </div>
          <div className="text-lg font-black text-emerald-300">
            {(metrics.totalCoinCirculation / 1000000).toFixed(1)}M
          </div>
          <div className="text-[10px] text-gray-500">Demo active balance</div>
        </div>
      </div>

      {/* 4. Quick Actions & Recent Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quick Actions (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-3xl bg-[#160A2D]/80 border border-purple-500/20 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" /> Quick Actions
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => onSelectTab('content')}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-pink-500/30 text-xs font-bold text-white transition-all text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center">
                  <Image className="w-4 h-4" />
                </div>
                <span>Create Banner or Event</span>
              </div>
              <Plus className="w-4 h-4 text-gray-400" />
            </button>

            <button
              onClick={() => onSelectTab('gifts')}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-pink-500/30 text-xs font-bold text-white transition-all text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-pink-500/20 text-pink-300 flex items-center justify-center">
                  <Gift className="w-4 h-4" />
                </div>
                <span>Catalog New Virtual Gift</span>
              </div>
              <Plus className="w-4 h-4 text-gray-400" />
            </button>

            <button
              onClick={() => onSelectTab('packages')}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-pink-500/30 text-xs font-bold text-white transition-all text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
                <span>Configure Coin Package</span>
              </div>
              <Plus className="w-4 h-4 text-gray-400" />
            </button>

            <button
              onClick={() => onSelectTab('virtual_items')}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-pink-500/30 text-xs font-bold text-white transition-all text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span>Manage Avatar Frames</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Recent Activity Log (8 cols) */}
        <div className="lg:col-span-8 p-5 rounded-3xl bg-[#160A2D]/80 border border-purple-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-pink-400" /> Recent Content & Economy Activity
            </h3>
            <button
              onClick={() => onSelectTab('activity')}
              className="text-xs text-pink-400 hover:text-pink-300 font-bold flex items-center gap-1 group"
            >
              <span>View All Logs</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentActivity.slice(0, 4).map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-2xl bg-[#0F0721] border border-white/5 hover:border-pink-500/30 transition-colors flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-pink-500 shrink-0" />
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>{log.title}</span>
                      <span className="font-mono text-[10px] text-gray-400">
                        {log.relatedItemId}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 line-clamp-1">{log.description}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-gray-400 block font-mono">{log.relativeTime}</span>
                  <span className="text-[10px] text-pink-300/80 font-medium">{log.adminName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
