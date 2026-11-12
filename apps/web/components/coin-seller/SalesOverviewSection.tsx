'use client';

import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  PackageCheck,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Wallet,
  XCircle,
} from 'lucide-react';
import { formatCoinCount } from './mockCoinSellerData';
import { CoinOrderRecord, SellerDashboardMetrics } from './types';

type OverviewPeriod = 'today' | 'weekly' | 'monthly' | 'all_time';

interface SalesOverviewSectionProps {
  metrics: SellerDashboardMetrics;
  orders: CoinOrderRecord[];
  onNavigateOrders: (statusFilter: 'All' | 'Pending' | 'Completed' | 'Cancelled') => void;
}

export const SalesOverviewSection: React.FC<SalesOverviewSectionProps> = ({
  metrics,
  orders,
  onNavigateOrders,
}) => {
  const [period, setPeriod] = useState<OverviewPeriod>('today');

  const chartSeries = useMemo(() => {
    if (period === 'today') {
      const completedToday = orders.filter(
        (o) => o.periodTag === 'today' && o.status === 'Completed'
      );
      const morning = completedToday
        .filter((o) => o.orderTimeLabel < '12:00')
        .reduce((s, o) => s + o.coinQuantity, 0);
      const midday = completedToday
        .filter((o) => o.orderTimeLabel >= '12:00' && o.orderTimeLabel < '14:30')
        .reduce((s, o) => s + o.coinQuantity, 0);
      const afternoon = completedToday
        .filter((o) => o.orderTimeLabel >= '14:30')
        .reduce((s, o) => s + o.coinQuantity, 0);
      return [
        { label: '08:00–11:59', value: morning },
        { label: '12:00–14:29', value: midday },
        { label: '14:30–17:00', value: afternoon },
      ];
    }

    if (period === 'weekly') {
      const sumByDate = (dateIso: string) =>
        orders
          .filter((o) => o.orderDateIso === dateIso && o.status === 'Completed')
          .reduce((s, o) => s + o.coinQuantity, 0);
      return [
        { label: 'Nov 09', value: sumByDate('2026-11-09') },
        { label: 'Nov 10', value: sumByDate('2026-11-10') },
        { label: 'Nov 11', value: sumByDate('2026-11-11') },
        { label: 'Nov 12', value: sumByDate('2026-11-12') },
      ];
    }

    if (period === 'monthly') {
      return [
        {
          label: 'Wk 1 (Nov 1-7)',
          value: orders
            .filter(
              (o) =>
                o.orderDateIso >= '2026-11-01' &&
                o.orderDateIso <= '2026-11-07' &&
                o.status === 'Completed'
            )
            .reduce((s, o) => s + o.coinQuantity, 0),
        },
        {
          label: 'Wk 2 (Nov 8-12)',
          value: orders
            .filter(
              (o) =>
                o.orderDateIso >= '2026-11-08' &&
                o.orderDateIso <= '2026-11-12' &&
                o.status === 'Completed'
            )
            .reduce((s, o) => s + o.coinQuantity, 0),
        },
      ];
    }

    return [
      {
        label: 'October (Demo)',
        value: orders
          .filter((o) => o.periodTag === 'last_month' && o.status === 'Completed')
          .reduce((s, o) => s + o.coinQuantity, 0),
      },
      {
        label: 'November (Demo)',
        value: metrics.monthlyCoinSales,
      },
    ];
  }, [orders, period, metrics.monthlyCoinSales]);

  const maxChartVal = Math.max(1, ...chartSeries.map((c) => c.value));

  const overviewCards = [
    {
      id: 'today-coin-sales',
      title: "Today's Coin Sales",
      value: formatCoinCount(metrics.todayCoinSales),
      suffix: 'Coins',
      description: 'Completed demo coin volume today',
      icon: Coins,
      accent: 'text-amber-300 border-amber-400/30 bg-amber-500/15',
      onClick: () => setPeriod('today'),
    },
    {
      id: 'weekly-coin-sales',
      title: 'Weekly Coin Sales',
      value: formatCoinCount(metrics.weeklyCoinSales),
      suffix: 'Coins',
      description: 'Completed sales across this week',
      icon: TrendingUp,
      accent: 'text-pink-300 border-pink-400/30 bg-pink-500/15',
      onClick: () => setPeriod('weekly'),
    },
    {
      id: 'monthly-coin-sales',
      title: 'Monthly Coin Sales',
      value: formatCoinCount(metrics.monthlyCoinSales),
      suffix: 'Coins',
      description: 'Completed demo volume in Nov 2026',
      icon: Calendar,
      accent: 'text-purple-200 border-purple-400/30 bg-purple-500/15',
      onClick: () => setPeriod('monthly'),
    },
    {
      id: 'total-coin-sales',
      title: 'Total Coin Sales',
      value: formatCoinCount(metrics.totalCoinSales),
      suffix: 'Coins',
      description: 'All completed demo coin packages',
      icon: Sparkles,
      accent: 'text-amber-200 border-amber-300/35 bg-amber-500/10',
      onClick: () => setPeriod('all_time'),
    },
    {
      id: 'total-orders',
      title: 'Total Orders',
      value: formatCoinCount(metrics.totalOrdersCount),
      suffix: 'Orders',
      description: `${metrics.todayOrdersCount} placed today · Click to view all`,
      icon: PackageCheck,
      accent: 'text-cyan-300 border-cyan-400/30 bg-cyan-500/15',
      onClick: () => onNavigateOrders('All'),
    },
    {
      id: 'pending-orders',
      title: 'Pending Orders',
      value: formatCoinCount(metrics.pendingOrdersCount),
      suffix: 'Pending',
      description: 'Awaiting local demo verification',
      icon: Clock,
      accent: 'text-amber-300 border-amber-400/30 bg-amber-500/15',
      onClick: () => onNavigateOrders('Pending'),
    },
    {
      id: 'completed-orders',
      title: 'Completed Orders',
      value: formatCoinCount(metrics.completedOrdersCount),
      suffix: 'Done',
      description: 'Finalized sample coin orders',
      icon: CheckCircle2,
      accent: 'text-emerald-300 border-emerald-400/30 bg-emerald-500/15',
      onClick: () => onNavigateOrders('Completed'),
    },
    {
      id: 'available-demo-balance',
      title: 'Available Demo Balance',
      value: formatCoinCount(metrics.availableDemoBalance),
      suffix: 'Demo',
      description: 'Sample seller quota · No real currency',
      icon: Wallet,
      accent: 'text-fuchsia-300 border-fuchsia-400/30 bg-fuchsia-500/15',
      onClick: () => setPeriod('all_time'),
    },
  ];

  return (
    <section data-testid="coin-seller-sales-overview-section" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-white">Sales Overview</h2>
          <p className="text-xs text-purple-200/75">
            Live local metrics derived from sample order records · Demo values only
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-200 font-semibold">
            <RefreshCw className="w-3 h-3" />
            Processing: {metrics.processingOrdersCount}
          </span>
          <button
            type="button"
            onClick={() => onNavigateOrders('Cancelled')}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 text-rose-200 font-semibold transition cursor-pointer"
          >
            <XCircle className="w-3 h-3" />
            Cancelled: {metrics.cancelledOrdersCount}
          </button>
        </div>
      </div>

      {/* 8 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {overviewCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              data-testid={`overview-card-${card.id}`}
              onClick={card.onClick}
              className="text-left rounded-2xl bg-[#1A0E33]/95 hover:bg-[#221242] border border-purple-500/25 hover:border-pink-400/45 p-4 transition shadow-md cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-purple-200/90 group-hover:text-white transition">
                  {card.title}
                </span>
                <span
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${card.accent}`}
                >
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-white tabular-nums">{card.value}</span>
                <span className="text-[11px] font-semibold text-amber-300/90">{card.suffix}</span>
              </div>
              <p className="mt-1 text-[11px] text-purple-300/75">{card.description}</p>
            </button>
          );
        })}
      </div>

      {/* Interactive Period Chart */}
      <div className="rounded-3xl bg-[#1A0E33]/95 border border-purple-500/25 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white">Coin Sales Breakdown (Sample Coins)</h3>
            <p className="text-xs text-purple-300/75">
              Switch period tabs to inspect completed demo coin distribution
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: 'today', label: 'Today' },
                { id: 'weekly', label: 'Weekly' },
                { id: 'monthly', label: 'Monthly' },
                { id: 'all_time', label: 'All Sample' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                data-testid={`overview-period-${tab.id}`}
                onClick={() => setPeriod(tab.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  period === tab.id
                    ? 'bg-gradient-to-r from-[#FF2E93] to-[#C026D3] text-white shadow'
                    : 'bg-[#120826] border border-purple-500/25 text-purple-200 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 pt-1">
          {chartSeries.map((bar) => {
            const pct = Math.max(8, Math.round((bar.value / maxChartVal) * 100));
            return (
              <div key={bar.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-purple-200">{bar.label}</span>
                  <span className="font-bold text-amber-300 tabular-nums">
                    {formatCoinCount(bar.value)} Coins
                  </span>
                </div>
                <div className="h-3 rounded-full bg-[#100622] border border-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 via-[#FF2E93] to-[#A855F7] transition-all duration-300"
                    style={{ width: `${bar.value === 0 ? 4 : pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
