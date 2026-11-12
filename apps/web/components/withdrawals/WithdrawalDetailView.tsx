'use client';

import React from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  Hash,
  Lock,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { formatPts, getWithdrawalStatusExplanation } from './mockWithdrawalsData';
import { WithdrawalRecord, WithdrawalStatus } from './types';

export function getWithdrawalStatusStyle(status: WithdrawalStatus): string {
  switch (status) {
    case 'Completed':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-400/35';
    case 'Approved':
      return 'bg-teal-500/15 text-teal-300 border-teal-400/35';
    case 'Processing':
      return 'bg-sky-500/15 text-sky-300 border-sky-400/35';
    case 'Pending':
      return 'bg-amber-500/15 text-amber-300 border-amber-400/35';
    case 'Rejected':
      return 'bg-rose-500/15 text-rose-300 border-rose-400/35';
  }
}

export const WithdrawalStatusIcon: React.FC<{ status: WithdrawalStatus; className?: string }> = ({
  status,
  className = 'w-3.5 h-3.5',
}) => {
  switch (status) {
    case 'Completed':
      return <CheckCircle2 className={className} />;
    case 'Approved':
      return <ShieldCheck className={className} />;
    case 'Processing':
      return <RefreshCw className={className} />;
    case 'Pending':
      return <Clock className={className} />;
    case 'Rejected':
      return <XCircle className={className} />;
  }
};

interface WithdrawalDetailViewProps {
  record: WithdrawalRecord;
  onBack: () => void;
}

export const WithdrawalDetailView: React.FC<WithdrawalDetailViewProps> = ({ record, onBack }) => {
  return (
    <section
      data-testid="withdrawal-detail-view"
      className="space-y-4 animate-in fade-in duration-200"
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          data-testid="withdrawal-detail-back-btn"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1B1033] hover:bg-[#26164A] border border-purple-500/30 text-sm font-semibold text-white cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-pink-400" />
          Back
        </button>

        <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-200">
          Demo Withdrawal Details
        </span>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-[#26144A] via-[#1B0E35] to-[#130926] border border-purple-500/30 p-5 md:p-6 space-y-5 shadow-xl">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-white/10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-300">
              Request Reference
            </p>
            <h2
              data-testid="withdrawal-detail-id"
              className="text-2xl font-extrabold text-white tracking-tight mt-0.5 font-mono"
            >
              #{record.id}
            </h2>
            <p className="text-xs text-purple-200/80 mt-1">
              Demo Tx Ref: <span className="font-mono text-white">{record.demoTxRef}</span>
            </p>
          </div>

          <div className="text-right space-y-1.5">
            <span
              data-testid="withdrawal-detail-status-badge"
              className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border text-xs font-bold ${getWithdrawalStatusStyle(record.status)}`}
            >
              <WithdrawalStatusIcon status={record.status} />
              {record.status}
            </span>
            <p className="text-[11px] text-purple-200/75 max-w-xs">
              {getWithdrawalStatusExplanation(record.status)}
            </p>
          </div>
        </div>

        {/* Highlighted Amount */}
        <div className="rounded-2xl bg-[#130926] border border-amber-400/30 p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300/85">
              Requested Demo Amount
            </p>
            <p className="text-2xl font-extrabold text-white mt-1 tabular-nums">
              {formatPts(record.amount)}{' '}
              <span className="text-sm font-bold text-amber-300">{record.unitLabel} (Demo)</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-400/35 flex items-center justify-center shrink-0">
            <Coins className="w-5 h-5 text-amber-300" />
          </div>
        </div>

        {/* Structured Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3.5">
            <p className="text-xs text-purple-300/80 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-pink-400" />
              Payment Method
            </p>
            <p className="text-sm font-bold text-white mt-1">{record.paymentMethodName}</p>
          </div>

          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3.5">
            <p className="text-xs text-purple-300/80 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-300" />
              Masked Account Details
            </p>
            <p className="text-sm font-mono font-bold text-amber-300 mt-1">
              {record.maskedAccountDetails} · {record.accountHolderName}
            </p>
          </div>

          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3.5">
            <p className="text-xs text-purple-300/80 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-300" />
              Request Date & Time
            </p>
            <p className="text-sm font-bold text-white mt-1">
              {record.requestDateLabel} · {record.requestTimeLabel}
            </p>
          </div>

          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3.5">
            <p className="text-xs text-purple-300/80 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-emerald-300" />
              Additional Demo Information
            </p>
            <p className="text-sm font-semibold text-purple-100 mt-1">{record.note}</p>
          </div>
        </div>

        {/* Status Timeline */}
        <div data-testid="withdrawal-status-timeline" className="pt-2 border-t border-white/10 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-purple-200">
            Status Timeline (Frontend Preview)
          </h3>

          <div className="space-y-3">
            {record.timeline.map((step) => {
              const dotClass =
                step.state === 'done'
                  ? 'bg-emerald-400 border-emerald-200'
                  : step.state === 'current'
                  ? 'bg-amber-400 border-amber-200'
                  : step.state === 'rejected'
                  ? 'bg-rose-400 border-rose-200'
                  : 'bg-slate-600 border-slate-400';
              return (
                <div
                  key={step.step}
                  className="rounded-2xl bg-[#130926]/90 border border-white/10 p-3.5 flex items-start gap-3"
                >
                  <span className={`w-3 h-3 rounded-full border mt-1 shrink-0 ${dotClass}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-extrabold text-white">{step.title}</p>
                      <span className="text-[11px] font-semibold text-purple-300/80">
                        {step.timestampLabel}
                      </span>
                    </div>
                    <p className="text-xs text-purple-200/80 mt-0.5">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-purple-950/60 border border-purple-400/20 px-4 py-3 flex items-center gap-2 text-xs text-purple-200/80">
          <ShieldAlert className="w-4 h-4 text-amber-300 shrink-0" />
          <span>
            This screen presents demo withdrawal records only. No real funds or payouts are
            executed.
          </span>
        </div>
      </div>
    </section>
  );
};
