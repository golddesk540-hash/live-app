import React, { useState } from 'react';
import {
  TrendingUp,
  Coins,
  Gift,
  ShoppingBag,
  CreditCard,
  Calendar,
  AlertCircle,
  PieChart,
  BarChart3,
  ArrowUpRight,
} from 'lucide-react';
import {
  EconomyMetrics,
  EconomyPeriod,
  EconomyChartDataPoint,
} from './contentEconomyTypes';
import {
  DAILY_CHART_DATA,
  WEEKLY_CHART_DATA,
  MONTHLY_CHART_DATA,
} from './mockContentEconomyData';

interface Props {
  metrics: EconomyMetrics;
}

export const EconomyOverviewView: React.FC<Props> = ({ metrics }) => {
  const [period, setPeriod] = useState<EconomyPeriod>('daily');

  const chartData: EconomyChartDataPoint[] =
    period === 'daily'
      ? DAILY_CHART_DATA
      : period === 'weekly'
      ? WEEKLY_CHART_DATA
      : MONTHLY_CHART_DATA;

  const maxVolume = Math.max(...chartData.map((d) => d.giftVolume), 1);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Top Header Banner & Disclaimer */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-[#1B0B36]/90 via-[#160A2D]/80 to-[#120726]/90 border border-purple-500/30 shadow-[0_0_35px_rgba(255,15,123,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
              Macroeconomic Telemetry & Circulation
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white">
            Platform Economy Overview
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Real-time simulated liquidity, gift transaction volume, and recharge trends across Popo Live.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center p-1 rounded-2xl bg-white/5 border border-white/10 text-xs self-start sm:self-auto">
          {(['daily', 'weekly', 'monthly'] as EconomyPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-xl font-bold capitalize transition-all ${
                period === p
                  ? 'bg-pink-500 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Safety Notice */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs leading-relaxed">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          <strong>Simulated Financial Data:</strong> Values displayed reflect demo activity and local mock calculations. This interface does not calculate real taxable income, exchange gain/loss, or bank transfers.
        </span>
      </div>

      {/* 2. Key Circulation & Velocity Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-[#160A2D]/80 border border-purple-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Total Coin Circulation
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {metrics.totalCoinCirculation.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> +4.2% healthy circulation
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#160A2D]/80 border border-purple-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              24h Gift Volume
            </span>
            <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-pink-300">
            {metrics.dailyCoinVolume.toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-400">Across 8,420 gift sending bursts</div>
        </div>

        <div className="p-5 rounded-3xl bg-[#160A2D]/80 border border-purple-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Weekly Purchases
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-300">
            {metrics.weeklyCoinVolume.toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-400">Recharge packages purchased</div>
        </div>

        <div className="p-5 rounded-3xl bg-[#160A2D]/80 border border-purple-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Virtual Store Velocity
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-cyan-300">
            {metrics.activeStoreItems * 12400} Coins
          </div>
          <div className="text-[11px] text-gray-400">Frames, themes & entrances</div>
        </div>
      </div>

      {/* 3. Bar Chart Activity Breakdown */}
      <div className="p-6 rounded-3xl bg-[#160A2D]/80 border border-purple-500/20 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-pink-400" />
              <span>Gift Sending Velocity & Recharge Activity ({period.toUpperCase()})</span>
            </h3>
            <p className="text-xs text-gray-400">
              Interactive distribution of coin expenditure across live rooms and party streams.
            </p>
          </div>
          <span className="text-xs font-mono text-pink-400 font-bold">
            Peak: {maxVolume.toLocaleString()} Coins
          </span>
        </div>

        {/* Visual Bar Chart */}
        <div className="space-y-3 pt-2">
          {chartData.map((item, idx) => {
            const pct = Math.round((item.giftVolume / maxVolume) * 100);
            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-gray-400 font-semibold">{item.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-gray-300">
                      Recharges: {item.purchasesCount} orders
                    </span>
                    <span className="font-mono font-bold text-pink-400">
                      {item.giftVolume.toLocaleString()} Coins
                    </span>
                  </div>
                </div>

                <div className="w-full h-3 rounded-full bg-black/40 overflow-hidden border border-white/5 flex">
                  <div
                    style={{ width: `${pct}%` }}
                    className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-amber-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(255,15,123,0.4)]"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Category Breakdown Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-[#120726]/90 border border-white/5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <PieChart className="w-3.5 h-3.5 text-pink-400" /> Gift Volume By Category
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Popular (Rose, Fireworks):</span>
              <span className="font-mono font-bold text-white">45%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Luxury (Yachts, Supercars):</span>
              <span className="font-mono font-bold text-pink-400">28%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Special (Dragons, Lions):</span>
              <span className="font-mono font-bold text-amber-400">18%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Romantic & Seasonal:</span>
              <span className="font-mono font-bold text-purple-400">9%</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#120726]/90 border border-white/5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Coins className="w-3.5 h-3.5 text-amber-400" /> Host Cashout Status
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Host Earnings Credited:</span>
              <span className="font-mono font-bold text-emerald-400">70% standard</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Platform Reserves:</span>
              <span className="font-mono font-bold text-white">30% share</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Avg Cashout Turnaround:</span>
              <span className="font-mono font-bold text-blue-400">14 minutes</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Settlement Verification:</span>
              <span className="font-mono font-bold text-emerald-400">100% Automated</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#120726]/90 border border-white/5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <ShoppingBag className="w-3.5 h-3.5 text-cyan-400" /> Virtual Item Adoption
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Active Avatar Frames:</span>
              <span className="font-mono font-bold text-cyan-300">23,800 active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Entrance Animations:</span>
              <span className="font-mono font-bold text-white">4,040 equipped</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Message Chat Bubbles:</span>
              <span className="font-mono font-bold text-white">34,000 equipped</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Room Theme Presets:</span>
              <span className="font-mono font-bold text-purple-400">3,470 rooms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
