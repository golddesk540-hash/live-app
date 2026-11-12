'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Coins,
  Edit3,
  Info,
  ShieldCheck,
} from 'lucide-react';
import {
  formatPts,
  maskDemoAccountIdentifier,
  WITHDRAWAL_DEMO_CONFIG,
} from './mockWithdrawalsData';
import { PaymentMethodGrid } from './PaymentMethodCards';
import { DemoPaymentMethod, WithdrawalDraft, WithdrawalRecord } from './types';

interface WithdrawalFormProps {
  draft: WithdrawalDraft;
  availableBalance: number;
  methods: DemoPaymentMethod[];
  onChangeDraft: (next: WithdrawalDraft) => void;
  onProceedToReview: () => void;
  onCancel: () => void;
}

export const WithdrawalRequestFormView: React.FC<WithdrawalFormProps> = ({
  draft,
  availableBalance,
  methods,
  onChangeDraft,
  onProceedToReview,
  onCancel,
}) => {
  const [errors, setErrors] = useState<string[]>([]);

  const selectedMethod = methods.find((m) => m.id === draft.methodId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];

    const trimmedAmount = draft.amountInput.trim();
    const numericAmount = Number(trimmedAmount);

    if (!trimmedAmount) {
      errs.push('Please enter a demo withdrawal amount.');
    } else if (!Number.isFinite(numericAmount) || Number.isNaN(numericAmount)) {
      errs.push('Withdrawal amount must be a valid number.');
    } else if (numericAmount <= 0) {
      errs.push('Withdrawal amount must be greater than zero.');
    } else if (numericAmount > availableBalance) {
      errs.push(
        `Requested amount cannot exceed available demo balance (${formatPts(availableBalance)} pts).`
      );
    } else if (
      WITHDRAWAL_DEMO_CONFIG.minDemoAmount !== null &&
      numericAmount < WITHDRAWAL_DEMO_CONFIG.minDemoAmount
    ) {
      errs.push(`Minimum configurable demo amount is ${WITHDRAWAL_DEMO_CONFIG.minDemoAmount} pts.`);
    } else if (
      WITHDRAWAL_DEMO_CONFIG.maxDemoAmount !== null &&
      numericAmount > WITHDRAWAL_DEMO_CONFIG.maxDemoAmount
    ) {
      errs.push(`Maximum configurable demo amount is ${WITHDRAWAL_DEMO_CONFIG.maxDemoAmount} pts.`);
    }

    if (!draft.methodId || !selectedMethod) {
      errs.push('Please select a placeholder payment method.');
    }

    if (!draft.accountHolderName.trim()) {
      errs.push('Please enter an account holder name (fake placeholder).');
    }

    if (!draft.accountIdentifier.trim()) {
      errs.push('Please enter the required demo account identifier.');
    }

    if (!draft.extraField.trim()) {
      errs.push(`Please complete "${selectedMethod?.extraFieldLabel ?? 'Method Info'}".`);
    }

    if (errs.length > 0) {
      setErrors(errs);
      return;
    }

    setErrors([]);
    onProceedToReview();
  };

  return (
    <section data-testid="withdrawal-request-form-view" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-extrabold text-white">New Demo Withdrawal Request</h2>
          <p className="text-xs text-purple-200/75">
            Enter sample withdrawal amount and placeholder destination details · No real funds moved
          </p>
        </div>

        <div className="rounded-2xl bg-[#1A0E33] border border-amber-400/35 px-3.5 py-2 text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300/85">
            Available Demo Balance
          </p>
          <p
            data-testid="form-available-balance"
            className="text-sm font-extrabold text-white tabular-nums"
          >
            {formatPts(availableBalance)} pts
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="rounded-3xl bg-[#1A0E33]/95 border border-purple-500/30 p-5 md:p-6 space-y-5 shadow-xl"
      >
        {errors.length > 0 && (
          <div
            data-testid="withdrawal-form-errors"
            className="rounded-2xl bg-rose-500/15 border border-rose-400/40 p-3.5 space-y-1 text-xs text-rose-200"
          >
            <div className="font-bold flex items-center gap-1.5 text-rose-100">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Please resolve the following before reviewing:
            </div>
            <ul className="list-disc pl-5 space-y-0.5">
              {errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Amount Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="withdrawal-amount-input"
              className="text-xs font-bold uppercase tracking-wider text-purple-200"
            >
              Withdrawal Amount (Demo pts)
            </label>
            <div className="flex items-center gap-1.5">
              {[500, 1000, 2500].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() =>
                    onChangeDraft({
                      ...draft,
                      amountInput: String(Math.min(preset, availableBalance)),
                    })
                  }
                  className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-amber-300 cursor-pointer"
                >
                  {formatPts(preset)}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Coins className="w-4 h-4 text-amber-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="withdrawal-amount-input"
              type="number"
              min="1"
              step="1"
              value={draft.amountInput}
              onChange={(e) => onChangeDraft({ ...draft, amountInput: e.target.value })}
              data-testid="withdrawal-amount-input"
              placeholder="Enter amount (e.g. 1000)"
              className="w-full rounded-2xl bg-[#120826] border border-purple-500/35 pl-10 pr-16 py-3 text-base font-bold text-white placeholder:text-purple-300/45 focus:outline-none focus:border-pink-400"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-300">
              pts (Demo)
            </span>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-purple-200">
            Select Payment Method (Placeholder Options)
          </p>
          <PaymentMethodGrid
            methods={methods}
            selectedMethodId={draft.methodId}
            onSelectMethod={(methodId) => onChangeDraft({ ...draft, methodId })}
          />
        </div>

        {/* Account Information */}
        <div className="space-y-3 pt-1 border-t border-white/10">
          <p className="text-xs font-bold uppercase tracking-wider text-purple-200">
            Account Information (Placeholder Values Only)
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block space-y-1 text-xs text-purple-200">
              <span>Account Holder Name</span>
              <input
                type="text"
                value={draft.accountHolderName}
                onChange={(e) => onChangeDraft({ ...draft, accountHolderName: e.target.value })}
                data-testid="form-holder-name-input"
                placeholder="e.g. Zara Creator (Demo)"
                className="w-full rounded-2xl bg-[#120826] border border-purple-500/30 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-pink-400"
              />
            </label>

            <label className="block space-y-1 text-xs text-purple-200">
              <span>{selectedMethod?.identifierLabel ?? 'Account Identifier (Placeholder)'}</span>
              <input
                type="text"
                value={draft.accountIdentifier}
                onChange={(e) => onChangeDraft({ ...draft, accountIdentifier: e.target.value })}
                data-testid="form-identifier-input"
                placeholder={selectedMethod?.identifierPlaceholder ?? 'e.g. DEMO-004821'}
                className="w-full rounded-2xl bg-[#120826] border border-purple-500/30 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-pink-400"
              />
            </label>

            <label className="block space-y-1 text-xs text-purple-200">
              <span>{selectedMethod?.extraFieldLabel ?? 'Provider Label (Placeholder)'}</span>
              <input
                type="text"
                value={draft.extraField}
                onChange={(e) => onChangeDraft({ ...draft, extraField: e.target.value })}
                data-testid="form-extra-field-input"
                placeholder={selectedMethod?.extraFieldPlaceholder ?? 'e.g. Sample Demo Provider'}
                className="w-full rounded-2xl bg-[#120826] border border-purple-500/30 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-pink-400"
              />
            </label>

            <label className="block space-y-1 text-xs text-purple-200">
              <span>Additional Demo Note (Optional)</span>
              <input
                type="text"
                value={draft.additionalNote}
                onChange={(e) => onChangeDraft({ ...draft, additionalNote: e.target.value })}
                data-testid="form-note-input"
                placeholder="Optional note for local history entry"
                className="w-full rounded-2xl bg-[#120826] border border-purple-500/30 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-pink-400"
              />
            </label>
          </div>
        </div>

        <div className="rounded-2xl bg-purple-950/60 border border-purple-400/20 px-3.5 py-2.5 flex items-center gap-2 text-xs text-purple-200/80">
          <Info className="w-4 h-4 text-amber-300 shrink-0" />
          <span>
            Frontend preview only: official limits, payout fees, and real bank transfers are not
            active here.
          </span>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-2">
          <button
            type="button"
            data-testid="form-cancel-btn"
            onClick={onCancel}
            className="px-5 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-purple-100 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            data-testid="form-review-request-btn"
            className="px-7 py-3 rounded-full bg-gradient-to-r from-[#FF0F7B] via-[#FF1E8E] to-[#E11D84] hover:brightness-110 text-xs font-extrabold text-white shadow-lg shadow-pink-500/25 cursor-pointer"
          >
            Review Request
          </button>
        </div>
      </form>
    </section>
  );
};

interface WithdrawalReviewProps {
  draft: WithdrawalDraft;
  availableBalance: number;
  method?: DemoPaymentMethod;
  onConfirmDemoRequest: () => void;
  onEditRequest: () => void;
  onCancel: () => void;
}

export const WithdrawalReviewView: React.FC<WithdrawalReviewProps> = ({
  draft,
  availableBalance,
  method,
  onConfirmDemoRequest,
  onEditRequest,
  onCancel,
}) => {
  const numericAmount = Number(draft.amountInput) || 0;
  const remainingDemo = Math.max(0, availableBalance - numericAmount);

  return (
    <section data-testid="withdrawal-review-view" className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onEditRequest}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1A0E33] hover:bg-[#26164A] border border-purple-500/30 text-xs font-bold text-white cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-pink-400" />
          Edit Request
        </button>

        <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/35 text-amber-200">
          Step 2 · Withdrawal Review
        </span>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-[#27134D] via-[#1B0E35] to-[#140A28] border border-purple-500/35 p-5 md:p-6 space-y-5 shadow-xl">
        <div className="text-center pb-4 border-b border-white/10">
          <p className="text-xs font-bold uppercase tracking-widest text-purple-200/75">
            Requested Demo Amount
          </p>
          <p
            data-testid="review-requested-amount"
            className="text-3xl md:text-4xl font-extrabold text-amber-300 mt-1 tabular-nums"
          >
            {formatPts(numericAmount)}{' '}
            <span className="text-base font-bold text-white">pts (Demo)</span>
          </p>
          <p className="text-xs text-purple-200/80 mt-1">
            Available Balance: {formatPts(availableBalance)} pts → Projected Demo Balance:{' '}
            <strong className="text-white">{formatPts(remainingDemo)} pts</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-[#130926] border border-white/10 p-3.5">
            <p className="text-xs text-purple-300/80">Selected Payment Method</p>
            <p className="text-sm font-bold text-white mt-0.5">
              {method?.name ?? 'Placeholder Method'}
            </p>
          </div>

          <div className="rounded-2xl bg-[#130926] border border-white/10 p-3.5">
            <p className="text-xs text-purple-300/80">Masked Account Details</p>
            <p className="text-sm font-mono font-bold text-amber-300 mt-0.5">
              {maskDemoAccountIdentifier(draft.accountIdentifier)} ({draft.extraField})
            </p>
          </div>

          <div className="rounded-2xl bg-[#130926] border border-white/10 p-3.5">
            <p className="text-xs text-purple-300/80">Account Holder</p>
            <p className="text-sm font-bold text-white mt-0.5">{draft.accountHolderName}</p>
          </div>

          <div className="rounded-2xl bg-[#130926] border border-white/10 p-3.5">
            <p className="text-xs text-purple-300/80">Request Information</p>
            <p className="text-sm font-semibold text-purple-100 mt-0.5">
              {draft.additionalNote || 'Frontend demonstration request · Pending initial status'}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-amber-500/10 border border-amber-400/35 px-4 py-3 flex items-start gap-2.5 text-xs text-amber-100">
          <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          <p>
            <strong>Frontend Demonstration Notice:</strong> No real money will be transferred and no
            payment gateway is connected. Confirming adds a sample request entry to local history.
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-1">
          <button
            type="button"
            data-testid="review-cancel-btn"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-purple-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="review-edit-btn"
            onClick={onEditRequest}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-[#241347] hover:bg-[#30195D] border border-purple-400/35 text-xs font-bold text-white cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Request
          </button>
          <button
            type="button"
            data-testid="confirm-demo-withdrawal-btn"
            onClick={onConfirmDemoRequest}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#FF0F7B] via-[#FF1E8E] to-[#E11D84] hover:brightness-110 text-xs font-extrabold text-white shadow-lg shadow-pink-500/25 cursor-pointer"
          >
            Confirm Demo Request
          </button>
        </div>
      </div>
    </section>
  );
};

interface RequestConfirmationProps {
  record: WithdrawalRecord;
  onViewRequest: (record: WithdrawalRecord) => void;
  onBackToDashboard: () => void;
}

export const WithdrawalConfirmationView: React.FC<RequestConfirmationProps> = ({
  record,
  onViewRequest,
  onBackToDashboard,
}) => {
  return (
    <section
      data-testid="withdrawal-confirmation-view"
      className="rounded-3xl bg-gradient-to-br from-[#231244] via-[#1A0E33] to-[#120825] border border-emerald-400/35 p-6 md:p-8 text-center space-y-5 shadow-xl"
    >
      <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/45 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-300" />
      </div>

      <div>
        <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-200">
          Demo Request Logged Locally
        </span>
        <h2 className="text-xl md:text-2xl font-extrabold text-white mt-3">
          Withdrawal Request Created (Demo)
        </h2>
        <p className="text-xs text-purple-200/80 max-w-md mx-auto mt-1">
          A local demonstration request reference was generated. No actual funds or payouts have been
          sent.
        </p>
      </div>

      <div className="max-w-lg mx-auto rounded-2xl bg-[#130926] border border-white/10 p-4 grid grid-cols-2 gap-3 text-left text-xs">
        <div>
          <p className="text-purple-300/75">Request Reference</p>
          <p
            data-testid="confirmation-request-id"
            className="font-mono text-sm font-extrabold text-amber-300 mt-0.5"
          >
            {record.id}
          </p>
        </div>
        <div>
          <p className="text-purple-300/75">Requested Amount</p>
          <p className="text-sm font-extrabold text-white mt-0.5 tabular-nums">
            {formatPts(record.amount)} {record.unitLabel} (Demo)
          </p>
        </div>
        <div>
          <p className="text-purple-300/75">Payment Method</p>
          <p className="font-bold text-white mt-0.5">{record.paymentMethodName}</p>
        </div>
        <div>
          <p className="text-purple-300/75">Date & Initial Status</p>
          <p className="font-bold text-amber-200 mt-0.5">
            {record.requestDateLabel} · {record.status}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
        <button
          type="button"
          data-testid="confirmation-view-request-btn"
          onClick={() => onViewRequest(record)}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-[#FF0F7B] via-[#FF1E8E] to-[#E11D84] hover:brightness-110 text-xs font-extrabold text-white shadow-lg shadow-pink-500/25 cursor-pointer"
        >
          View Request
        </button>
        <button
          type="button"
          data-testid="confirmation-back-dashboard-btn"
          onClick={onBackToDashboard}
          className="px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-white cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>
    </section>
  );
};
