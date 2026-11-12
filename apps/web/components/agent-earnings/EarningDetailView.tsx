'use client';

import React from 'react';
import {
  ArrowLeft,
  Calendar,
  FileText,
  Hash,
  Info,
  Layers,
  Sparkles,
  User,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { formatSamplePts } from './mockAgentEarningsData';
import { EarningDetailPayload, EarningRecordStatus } from './types';

interface EarningDetailViewProps {
  detail: EarningDetailPayload;
  onBack: () => void;
}

export function getEarningStatusPillStyle(status: EarningRecordStatus): string {
  switch (status) {
    case 'Completed':
      return 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300';
    case 'Pending':
      return 'bg-amber-400/20 border-amber-300/40 text-amber-200';
    case 'Processing':
      return 'bg-sky-500/20 border-sky-400/40 text-sky-300';
    case 'Cancelled':
      return 'bg-rose-500/20 border-rose-400/40 text-rose-300';
  }
}

export const EarningDetailView: React.FC<EarningDetailViewProps> = ({ detail, onBack }) => {
  return (
    <div className="space-y-4" data-testid="earning-detail-view">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          data-testid="earning-detail-back-btn"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#1D0D34] hover:bg-[#271246] border border-purple-400/25 text-xs font-bold text-purple-100 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Agent Earnings
        </button>

        <span
          data-testid="earning-detail-id"
          className="text-[11px] font-mono px-3 py-1 rounded-full bg-purple-500/15 border border-purple-400/25 text-amber-300"
        >
          Record ID: {detail.recordId}
        </span>
      </div>

      {/* Main Amount & Status Card */}
      <div className="rounded-3xl bg-gradient-to-br from-[#230E3F] via-[#1A0B2E] to-[#130722] border border-purple-400/25 p-5 sm:p-6 shadow-[0_18px_46px_rgba(9,3,22,0.55)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-purple-200/75">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Sample Earning Details
            </div>
            <div
              data-testid="earning-detail-amount"
              className="text-3xl sm:text-4xl font-black text-amber-300 mt-1.5"
            >
              +{formatSamplePts(detail.sampleAmountPts)}{' '}
              <span className="text-base font-bold text-purple-200/80">pts</span>
            </div>
            <p className="text-xs text-purple-200/75 mt-1">Sample points · Demo data only</p>
          </div>

          <span
            data-testid="earning-detail-status"
            className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-bold ${getEarningStatusPillStyle(
              detail.status
            )}`}
          >
            {detail.status}
          </span>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-5 border-t border-white/10 text-xs">
          <div className="rounded-2xl bg-[#120624]/85 border border-purple-400/15 p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-300/65">
              <Layers className="w-3.5 h-3.5 text-[#FF6BA3]" />
              Earning Category
            </div>
            <div className="text-sm font-bold text-white mt-1.5">{detail.category}</div>
          </div>

          <div className="rounded-2xl bg-[#120624]/85 border border-purple-400/15 p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-300/65">
              <Calendar className="w-3.5 h-3.5 text-amber-300" />
              Record Date
            </div>
            <div className="text-sm font-bold text-white mt-1.5">{detail.dateLabel}</div>
          </div>

          <div className="rounded-2xl bg-[#120624]/85 border border-purple-400/15 p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-300/65">
              <User className="w-3.5 h-3.5 text-sky-300" />
              Related Host / Activity
            </div>
            <div className="flex items-center gap-2.5 mt-1.5">
              {detail.hostAvatarUrl && (
                <Avatar src={detail.hostAvatarUrl} alt={detail.relatedHostOrActivity} size="sm" />
              )}
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate">
                  {detail.relatedHostOrActivity}
                </div>
                {(detail.hostHandle || detail.hostId) && (
                  <div className="text-[11px] text-purple-200/70">
                    {detail.hostHandle} {detail.hostId ? `· ${detail.hostId}` : ''}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-[#120624]/85 border border-purple-400/15 p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-300/65">
              <Hash className="w-3.5 h-3.5 text-emerald-300" />
              Sample Reference Code
            </div>
            <div className="text-sm font-mono font-bold text-purple-100 mt-1.5">
              {detail.referenceCode}
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-4 rounded-2xl bg-[#120624]/85 border border-purple-400/15 p-4">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-300/65 mb-1.5">
            <FileText className="w-3.5 h-3.5 text-[#FF6BA3]" />
            Additional Information
          </div>
          <p className="text-xs text-purple-100/90 leading-relaxed">{detail.additionalInfo}</p>
        </div>

        <div className="mt-4 rounded-2xl bg-[#120624]/65 border border-purple-400/15 px-3.5 py-2.5 flex items-start gap-2 text-[11px] text-purple-200/75">
          <Info className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
          <span>
            Displayed amounts are sample demo points only. No real payments, withdrawals, or
            commission percentages are processed here.
          </span>
        </div>
      </div>
    </div>
  );
};
