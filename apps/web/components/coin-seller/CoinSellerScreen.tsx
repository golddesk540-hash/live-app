'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  FileSpreadsheet,
  Heart,
  Info,
  MoreVertical,
  Package,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  X,
} from 'lucide-react';
import { useUnreadNotificationsCount } from '@/components/notifications/useUnreadNotificationsCount';
import { Avatar } from '@/components/ui/Avatar';
import {
  computeSellerMetrics,
  createInitialCoinOrders,
  createInitialSellerActivity,
  createInitialSellerProfile,
  deriveSalesRecordsFromOrders,
  formatCoinCount,
} from './mockCoinSellerData';
import { getOrderStatusBadgeClasses, OrderDetailView } from './OrderDetailView';
import { OrdersManagementSection, OrdersStatusFilter } from './OrdersManagementSection';
import { SalesHistorySection } from './SalesHistorySection';
import { SalesOverviewSection } from './SalesOverviewSection';
import { SellerActivitySection } from './SellerActivitySection';
import { SellerEmptyState } from './SellerEmptyState';
import { getSellerStatusAccent, SellerProfileSection } from './SellerProfileSection';
import {
  CoinOrderRecord,
  CoinSellerTab,
  OrderStatus,
  SellerAccountStatus,
  SellerActivityItem,
  SellerEmptyKind,
  SellerProfileData,
} from './types';

export const CoinSellerScreen: React.FC = () => {
  const unreadNotifications = useUnreadNotificationsCount();

  const [profile, setProfile] = useState<SellerProfileData>(createInitialSellerProfile);
  const [orders, setOrders] = useState<CoinOrderRecord[]>(createInitialCoinOrders);
  const [activityItems, setActivityItems] = useState<SellerActivityItem[]>(
    createInitialSellerActivity
  );

  const [activeTab, setActiveTab] = useState<CoinSellerTab>('dashboard');
  const [ordersFilter, setOrdersFilter] = useState<OrdersStatusFilter>('All');
  const [selectedOrder, setSelectedOrder] = useState<CoinOrderRecord | null>(null);

  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [forcedEmptyKind, setForcedEmptyKind] = useState<SellerEmptyKind | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const salesRecords = useMemo(() => deriveSalesRecordsFromOrders(orders), [orders]);
  const metrics = useMemo(
    () => computeSellerMetrics(orders, profile.baseDemoQuota),
    [orders, profile.baseDemoQuota]
  );

  const statusMeta = getSellerStatusAccent(profile.status);

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  };

  const handleNavigateTab = (tab: CoinSellerTab, nextOrdersFilter?: OrdersStatusFilter) => {
    setForcedEmptyKind(null);
    setSelectedOrder(null);
    if (nextOrdersFilter) {
      setOrdersFilter(nextOrdersFilter);
    }
    setActiveTab(tab);
    scrollToTop();
  };

  const handleOpenOrderDetail = (order: CoinOrderRecord) => {
    const latest = orders.find((o) => o.id === order.id) ?? order;
    setForcedEmptyKind(null);
    setSelectedOrder(latest);
    scrollToTop();
  };

  const handleUpdateOrderStatus = (orderId: string, nextStatus: OrderStatus) => {
    if (profile.status !== 'Active') {
      setToastMessage('Switch Demo Seller Status to Active in Seller Profile to test updates.');
      return;
    }

    const target = orders.find((o) => o.id === orderId);
    if (!target || target.status === nextStatus) return;

    const updatedOrders = orders.map((o) =>
      o.id === orderId
        ? {
            ...o,
            status: nextStatus,
            note: `Local demo state updated from ${target.status} to ${nextStatus}.`,
          }
        : o
    );

    setOrders(updatedOrders);
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({
        ...target,
        status: nextStatus,
        note: `Local demo state updated from ${target.status} to ${nextStatus}.`,
      });
    }

    const activityKind: SellerActivityItem['kind'] =
      nextStatus === 'Completed'
        ? 'completed_order'
        : nextStatus === 'Cancelled'
        ? 'cancelled_order'
        : nextStatus === 'Pending'
        ? 'new_order'
        : 'record_update';

    const newLog: SellerActivityItem = {
      id: `ACT-${Date.now().toString().slice(-4)}`,
      kind: activityKind,
      title: `Demo Order Marked ${nextStatus}`,
      description: `Order ${target.id} (${target.buyerUsername} · ${formatCoinCount(
        target.coinQuantity
      )} coins) changed from ${target.status} to ${nextStatus}.`,
      dateLabel: 'Today · Nov 12, 2026',
      dateIso: '2026-11-12',
      timeLabel: 'Just now',
      status: nextStatus,
      orderId: target.id,
      coinQuantity: target.coinQuantity,
    };

    setActivityItems((prev) => [newLog, ...prev]);
    setToastMessage(
      `Demo order ${target.id} marked as ${nextStatus}. Dashboard totals updated locally.`
    );
  };

  const handleStatusPreviewChange = (nextStatus: SellerAccountStatus) => {
    setProfile((prev) => ({ ...prev, status: nextStatus }));
    setToastMessage(`Previewing frontend seller status: ${nextStatus} Seller (Demo).`);
  };

  const handleSaveProfileNote = (updates: Partial<SellerProfileData>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
    setToastMessage('Demo seller profile details updated in local state.');
  };

  const handleResetDemo = () => {
    setProfile(createInitialSellerProfile());
    setOrders(createInitialCoinOrders());
    setActivityItems(createInitialSellerActivity());
    setSelectedOrder(null);
    setForcedEmptyKind(null);
    setOrdersFilter('All');
    setShowOptionsMenu(false);
    setToastMessage('Restored all Coin Seller sample records and dashboard metrics.');
  };

  const navTabs: Array<{
    id: CoinSellerTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: Coins },
    { id: 'orders', label: 'Orders', icon: Package, badge: metrics.pendingOrdersCount },
    { id: 'sales_history', label: 'Sales History', icon: FileSpreadsheet },
    { id: 'sales_overview', label: 'Sales Overview', icon: TrendingUp },
    { id: 'profile', label: 'Seller Profile', icon: UserCheck },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];

  return (
    <div
      data-testid="coin-seller-page"
      className="min-h-screen bg-gradient-to-b from-[#17092E] via-[#110623] to-[#0B0418] text-white pb-16"
    >
      {/* Top App Bar matching 09_09_coin_seller.png */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#15082B]/90 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/earnings"
              data-testid="coin-seller-back-earnings"
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition"
              title="Back to Earnings & Creator Center"
            >
              <ArrowLeft className="w-4 h-4 text-purple-100" />
            </Link>

            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-white" />
              </span>
              <span className="text-base font-extrabold tracking-tight text-white">Popo Live</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 relative">
            <Link
              href="/notifications"
              className="relative w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-purple-100 transition"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-pink-500" />
              )}
            </Link>

            <Link
              href="/agent-earnings"
              className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-purple-100 transition"
              title="Agent Earnings"
            >
              <Heart className="w-4 h-4" />
            </Link>

            <button
              type="button"
              data-testid="coin-seller-options-btn"
              onClick={() => setShowOptionsMenu((v) => !v)}
              className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-purple-100 transition cursor-pointer"
              title="More Options & Demo Controls"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showOptionsMenu && (
              <div
                data-testid="coin-seller-options-menu"
                className="absolute right-0 top-11 w-64 rounded-2xl bg-[#1F103D] border border-purple-400/30 shadow-2xl p-2 z-50 space-y-1 text-xs"
              >
                <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-300">
                  Demo Tools & Empty States
                </p>
                <button
                  type="button"
                  onClick={handleResetDemo}
                  className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/10 text-white font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
                  Reset Demo Seller Data
                </button>
                <div className="border-t border-white/10 my-1" />
                <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-300">
                  Preview Empty States
                </p>
                {(
                  [
                    ['no_sales', 'Empty: No Sales Records'],
                    ['no_orders', 'Empty: No Orders'],
                    ['no_pending_orders', 'Empty: No Pending Orders'],
                    ['no_completed_orders', 'Empty: No Completed Orders'],
                    ['no_cancelled_orders', 'Empty: No Cancelled Orders'],
                    ['no_search_results', 'Empty: No Search Results'],
                    ['no_seller_activity', 'Empty: No Seller Activity'],
                  ] as const
                ).map(([kind, label]) => (
                  <button
                    key={kind}
                    type="button"
                    data-testid={`preview-empty-${kind}`}
                    onClick={() => {
                      setForcedEmptyKind(kind);
                      setShowOptionsMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-purple-100 cursor-pointer"
                  >
                    {label}
                  </button>
                ))}
                <div className="border-t border-white/10 my-1" />
                <Link
                  href="/agency-management"
                  className="block px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-purple-200"
                >
                  Open Agency Management
                </Link>
                <Link
                  href="/agent-earnings"
                  className="block px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-purple-200"
                >
                  Open Agent Earnings
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        {/* Page Header + Compact Seller Identity */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Coin Seller
            </h1>
            <p className="text-sm text-purple-200/80 mt-0.5">Seller account overview</p>
          </div>

          <button
            type="button"
            onClick={() => handleNavigateTab('profile')}
            data-testid="header-seller-identity-btn"
            className="flex items-center gap-3 rounded-2xl bg-[#1E103A]/90 hover:bg-[#27154B] border border-purple-500/30 px-3.5 py-2 text-left transition cursor-pointer self-start md:self-auto"
          >
            <Avatar src={profile.avatar} alt={profile.sellerName} size="sm" ring="vip" />
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                {profile.sellerName}
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300">
                  Demo Data
                </span>
              </p>
              <p className="text-[11px] text-purple-300/80">
                {profile.username} · ID {profile.sellerId}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-purple-300" />
          </button>
        </div>

        {/* Toast confirmation banner */}
        {toastMessage && (
          <div
            data-testid="coin-seller-toast"
            className="rounded-2xl bg-emerald-500/15 border border-emerald-400/35 px-4 py-3 flex items-center justify-between gap-3 text-xs font-semibold text-emerald-200"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="p-1 rounded-full hover:bg-white/10 text-emerald-200 cursor-pointer"
              aria-label="Dismiss message"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Section Tabs */}
        <nav
          aria-label="Coin Seller sections"
          className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar"
        >
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id && !selectedOrder;
            return (
              <button
                key={tab.id}
                type="button"
                data-testid={`coin-seller-tab-${tab.id}`}
                onClick={() => handleNavigateTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border whitespace-nowrap transition cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-[#FF2E93] to-[#C026D3] border-pink-400 text-white shadow-lg shadow-pink-500/20'
                    : 'bg-[#190D30] hover:bg-[#241445] border-purple-500/25 text-purple-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      active ? 'bg-black/25 text-white' : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Forced Empty State Preview */}
        {forcedEmptyKind ? (
          <SellerEmptyState
            kind={forcedEmptyKind}
            onReset={() => setForcedEmptyKind(null)}
            resetLabel="Exit Empty Preview & Restore Data"
          />
        ) : selectedOrder ? (
          <OrderDetailView
            order={selectedOrder}
            sellerStatus={profile.status}
            onBack={() => setSelectedOrder(null)}
            onUpdateStatus={handleUpdateOrderStatus}
          />
        ) : (
          <>
            {/* MAIN DASHBOARD (09_09_coin_seller.png reference + interactive overview) */}
            {activeTab === 'dashboard' && (
              <div
                data-testid="coin-seller-dashboard-view"
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
              >
                {/* Left / Main Mobile-Matched Column */}
                <div className="lg:col-span-5 space-y-5">
                  {/* Hero Seller Status Card matching 09_09_coin_seller.png */}
                  <div
                    data-testid="coin-seller-hero-status-card"
                    className="rounded-3xl bg-gradient-to-br from-[#2C1557] via-[#221044] to-[#190B35] border border-purple-400/25 p-5 shadow-xl"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-purple-200/75">
                        SELLER STATUS
                      </p>
                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-purple-200/80">
                        Frontend Demo
                      </span>
                    </div>

                    <p
                      data-testid="hero-seller-status-label"
                      className={`text-2xl font-extrabold mt-2.5 ${statusMeta.textClass}`}
                    >
                      {statusMeta.label}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-medium text-purple-200/80">
                        Seller ID: <span className="font-mono text-white">{profile.sellerId}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => handleNavigateTab('profile')}
                        className="text-[11px] font-bold text-pink-300 hover:text-pink-200 underline cursor-pointer"
                      >
                        Manage Profile & Status
                      </button>
                    </div>
                  </div>

                  {/* Seller dashboard cards matching 09_09_coin_seller.png */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-extrabold text-white">Seller dashboard</h2>
                      <span className="text-[11px] text-amber-300/90 font-semibold">
                        Sample coin values
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div
                        data-testid="dashboard-metric-coin-sales-today"
                        className="rounded-2xl bg-[#1B0E36] border border-purple-500/25 px-4 py-3.5 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-bold text-white">Coin sales today</p>
                          <p
                            data-testid="dashboard-value-coin-sales-today"
                            className="text-sm font-semibold text-purple-200/85 tabular-nums mt-0.5"
                          >
                            {formatCoinCount(metrics.todayCoinSales)}
                          </p>
                        </div>
                        <Coins className="w-5 h-5 text-amber-300 shrink-0" />
                      </div>

                      <div
                        data-testid="dashboard-metric-orders-today"
                        className="rounded-2xl bg-[#1B0E36] border border-purple-500/25 px-4 py-3.5 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-bold text-white">Orders today</p>
                          <p
                            data-testid="dashboard-value-orders-today"
                            className="text-sm font-semibold text-purple-200/85 tabular-nums mt-0.5"
                          >
                            {formatCoinCount(metrics.todayOrdersCount)}
                          </p>
                        </div>
                        <Package className="w-5 h-5 text-pink-300 shrink-0" />
                      </div>

                      <button
                        type="button"
                        data-testid="dashboard-metric-pending-orders"
                        onClick={() => handleNavigateTab('orders', 'Pending')}
                        className="w-full text-left rounded-2xl bg-[#1B0E36] hover:bg-[#231247] border border-purple-500/25 hover:border-amber-400/40 px-4 py-3.5 flex items-center justify-between transition cursor-pointer"
                      >
                        <div>
                          <p className="text-sm font-bold text-white">Pending orders</p>
                          <p
                            data-testid="dashboard-value-pending-orders"
                            className="text-sm font-semibold text-amber-300 tabular-nums mt-0.5"
                          >
                            {formatCoinCount(metrics.pendingOrdersCount)}
                          </p>
                        </div>
                        <Clock className="w-5 h-5 text-amber-300 shrink-0" />
                      </button>

                      <div
                        data-testid="dashboard-metric-available-balance"
                        className="rounded-2xl bg-[#1B0E36] border border-purple-500/25 px-4 py-3.5 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-bold text-white">Available balance</p>
                          <p
                            data-testid="dashboard-value-available-balance"
                            className="text-sm font-semibold text-emerald-300 tabular-nums mt-0.5"
                          >
                            {formatCoinCount(metrics.availableDemoBalance)}
                          </p>
                        </div>
                        <ShieldCheck className="w-5 h-5 text-emerald-300 shrink-0" />
                      </div>
                    </div>

                    {/* Additional required totals from Section 3 */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleNavigateTab('sales_overview')}
                        className="rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 p-2.5 text-center transition cursor-pointer"
                      >
                        <p className="text-[10px] text-purple-300">Total coin sales</p>
                        <p
                          data-testid="dashboard-value-total-coin-sales"
                          className="text-xs font-extrabold text-amber-300 mt-0.5 tabular-nums"
                        >
                          {formatCoinCount(metrics.totalCoinSales)}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNavigateTab('orders', 'All')}
                        className="rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 p-2.5 text-center transition cursor-pointer"
                      >
                        <p className="text-[10px] text-purple-300">Total orders</p>
                        <p
                          data-testid="dashboard-value-total-orders"
                          className="text-xs font-extrabold text-white mt-0.5 tabular-nums"
                        >
                          {formatCoinCount(metrics.totalOrdersCount)}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNavigateTab('orders', 'Completed')}
                        className="rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 p-2.5 text-center transition cursor-pointer"
                      >
                        <p className="text-[10px] text-purple-300">Completed</p>
                        <p
                          data-testid="dashboard-value-completed-orders"
                          className="text-xs font-extrabold text-emerald-300 mt-0.5 tabular-nums"
                        >
                          {formatCoinCount(metrics.completedOrdersCount)}
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Primary Magenta CTA Button matching 09_09_coin_seller.png */}
                  <div className="space-y-2.5 pt-1">
                    <button
                      type="button"
                      data-testid="view-sales-history-cta"
                      onClick={() => handleNavigateTab('sales_history')}
                      className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#FF0F7B] via-[#FF1E8E] to-[#E11D84] hover:brightness-110 active:scale-[0.99] text-white text-sm font-extrabold shadow-xl shadow-pink-600/30 transition cursor-pointer"
                    >
                      View Sales History
                    </button>

                    <p className="text-center text-[11px] text-purple-300/70">Demo values only</p>
                  </div>
                </div>

                {/* Right / Secondary Column: Quick Order Queue, Coin Sales Records Preview, & Recent Sales Activity */}
                <div className="lg:col-span-7 space-y-5">
                  {/* Quick Action Navigation Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      data-testid="quick-open-orders-btn"
                      onClick={() => handleNavigateTab('orders', 'Pending')}
                      className="rounded-2xl bg-[#1A0E33] hover:bg-[#231247] border border-purple-500/25 p-4 text-left flex items-center justify-between gap-3 transition cursor-pointer"
                    >
                      <div>
                        <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          Pending Orders Queue
                        </p>
                        <p className="text-sm font-extrabold text-white mt-1">
                          {metrics.pendingOrdersCount} Pending · {metrics.processingOrdersCount}{' '}
                          Processing
                        </p>
                        <p className="text-[11px] text-purple-300/75 mt-0.5">
                          Update demo order states locally
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-purple-300 shrink-0" />
                    </button>

                    <button
                      type="button"
                      data-testid="quick-open-overview-btn"
                      onClick={() => handleNavigateTab('sales_overview')}
                      className="rounded-2xl bg-[#1A0E33] hover:bg-[#231247] border border-purple-500/25 p-4 text-left flex items-center justify-between gap-3 transition cursor-pointer"
                    >
                      <div>
                        <p className="text-xs font-bold text-pink-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          Weekly & Monthly Volume
                        </p>
                        <p className="text-sm font-extrabold text-white mt-1">
                          {formatCoinCount(metrics.monthlyCoinSales)} Coins This Month
                        </p>
                        <p className="text-[11px] text-purple-300/75 mt-0.5">
                          {formatCoinCount(metrics.weeklyCoinSales)} this week (Demo)
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-purple-300 shrink-0" />
                    </button>
                  </div>

                  {/* Coin Sales Records Preview */}
                  <div className="rounded-3xl bg-[#1A0E33]/95 border border-purple-500/25 p-5 space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-extrabold text-white">
                          Recent Coin Sales Records
                        </h3>
                        <p className="text-[11px] text-purple-300/75">
                          {salesRecords.length} sample sales records available
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleNavigateTab('sales_history')}
                        className="text-xs font-bold text-pink-300 hover:text-pink-200 cursor-pointer"
                      >
                        View All ({salesRecords.length})
                      </button>
                    </div>

                    <div className="space-y-2">
                      {orders.slice(0, 4).map((order) => (
                        <button
                          key={order.id}
                          type="button"
                          onClick={() => handleOpenOrderDetail(order)}
                          className="w-full text-left rounded-2xl bg-[#130926]/90 hover:bg-[#1B0E35] border border-white/10 px-3.5 py-2.5 flex items-center justify-between gap-3 transition cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar src={order.buyerAvatar} alt={order.buyerUsername} size="sm" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">
                                {order.buyerUsername}{' '}
                                <span className="font-mono text-amber-300 ml-1">{order.id}</span>
                              </p>
                              <p className="text-[11px] text-purple-300/75 truncate">
                                {order.salesId} · {order.orderDateLabel}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-xs font-extrabold text-amber-300 tabular-nums">
                              +{formatCoinCount(order.coinQuantity)} Coins
                            </p>
                            <span
                              className={`inline-block mt-0.5 px-2 py-0.5 rounded-full border text-[10px] font-bold ${getOrderStatusBadgeClasses(order.status)}`}
                            >
                              {order.status}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recent Sales Activity Feed */}
                  <div className="rounded-3xl bg-[#1A0E33]/95 border border-purple-500/25 p-5 space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-extrabold text-white">Recent sales activity</h3>
                        <p className="text-[11px] text-purple-300/75">
                          Latest demo order arrivals and completions
                        </p>
                      </div>
                      <button
                        type="button"
                        data-testid="view-all-seller-activity-btn"
                        onClick={() => handleNavigateTab('activity')}
                        className="text-xs font-bold text-pink-300 hover:text-pink-200 cursor-pointer"
                      >
                        Activity Log
                      </button>
                    </div>

                    <div className="space-y-2">
                      {activityItems.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{item.title}</p>
                            <p className="text-[11px] text-purple-200/80 truncate">
                              {item.description}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full border text-[10px] font-bold shrink-0 ${getOrderStatusBadgeClasses(item.status)}`}
                          >
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-2xl bg-purple-950/60 border border-purple-400/20 px-3.5 py-2.5 flex items-center gap-2 text-[11px] text-purple-200/80">
                      <Info className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span>
                        Frontend-only Coin Seller module. No real coin transfers, currency rates, or
                        payment processing.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <SellerProfileSection
                profile={profile}
                availableDemoBalance={metrics.availableDemoBalance}
                onStatusPreviewChange={handleStatusPreviewChange}
                onSaveProfileNote={handleSaveProfileNote}
              />
            )}

            {activeTab === 'sales_overview' && (
              <SalesOverviewSection
                metrics={metrics}
                orders={orders}
                onNavigateOrders={(filter) => handleNavigateTab('orders', filter)}
              />
            )}

            {activeTab === 'orders' && (
              <OrdersManagementSection
                orders={orders}
                sellerStatus={profile.status}
                statusFilter={ordersFilter}
                onStatusFilterChange={setOrdersFilter}
                onOpenOrderDetail={handleOpenOrderDetail}
                onUpdateOrderStatus={handleUpdateOrderStatus}
              />
            )}

            {activeTab === 'sales_history' && (
              <SalesHistorySection
                salesRecords={salesRecords}
                orders={orders}
                onOpenOrderDetail={handleOpenOrderDetail}
              />
            )}

            {activeTab === 'activity' && (
              <SellerActivitySection
                items={activityItems}
                orders={orders}
                onOpenOrderDetail={handleOpenOrderDetail}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};
