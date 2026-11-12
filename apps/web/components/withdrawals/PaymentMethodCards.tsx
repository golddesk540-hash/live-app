'use client';

import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  CreditCard,
  Edit3,
  Info,
  Lock,
  Save,
  Wallet,
} from 'lucide-react';
import { maskDemoAccountIdentifier } from './mockWithdrawalsData';
import { DemoPaymentMethod, SavedAccountDetails } from './types';
import { WithdrawalEmptyState } from './WithdrawalEmptyState';

interface PaymentMethodGridProps {
  methods: DemoPaymentMethod[];
  selectedMethodId: string;
  onSelectMethod: (methodId: string) => void;
  onRestoreMethods?: () => void;
}

export const PaymentMethodGrid: React.FC<PaymentMethodGridProps> = ({
  methods,
  selectedMethodId,
  onSelectMethod,
  onRestoreMethods,
}) => {
  if (methods.length === 0) {
    return (
      <WithdrawalEmptyState
        kind="no_payment_methods"
        onReset={onRestoreMethods}
        resetLabel="Restore Demo Payment Methods"
      />
    );
  }

  return (
    <div data-testid="payment-method-selection-grid" className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {methods.map((method) => {
        const selected = method.id === selectedMethodId;
        const Icon =
          method.iconKey === 'bank'
            ? Building2
            : method.iconKey === 'wallet'
            ? Wallet
            : CreditCard;

        return (
          <button
            key={method.id}
            type="button"
            data-testid={`payment-method-card-${method.id}`}
            onClick={() => onSelectMethod(method.id)}
            className={`text-left rounded-2xl p-4 border transition cursor-pointer flex flex-col justify-between gap-3 ${
              selected
                ? 'bg-gradient-to-br from-[#2F165D] via-[#241148] to-[#1A0C36] border-pink-400 shadow-lg shadow-pink-500/15'
                : 'bg-[#1A0E33]/95 hover:bg-[#231245] border-purple-500/25'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                  selected
                    ? 'bg-pink-500/20 border-pink-400/50 text-pink-200'
                    : 'bg-white/5 border-white/10 text-amber-300'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>

              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  selected
                    ? 'bg-pink-500/25 border-pink-400 text-white'
                    : 'bg-white/5 border-white/10 text-purple-300'
                }`}
              >
                {selected && <CheckCircle2 className="w-3 h-3 text-emerald-300" />}
                {selected ? 'Selected' : 'Select'}
              </span>
            </div>

            <div>
              <p className="text-sm font-extrabold text-white">{method.name}</p>
              <p className="text-xs text-purple-200/75 mt-1">{method.description}</p>
            </div>

            <div className="pt-1 border-t border-white/10 flex items-center justify-between text-[10px] text-amber-300/90 font-semibold">
              <span>Placeholder Option</span>
              <span>Not Connected</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

interface AccountDetailsSectionProps {
  methods: DemoPaymentMethod[];
  selectedMethodId: string;
  savedAccounts: Record<string, SavedAccountDetails>;
  onSelectMethod: (methodId: string) => void;
  onSaveAccountDetails: (methodId: string, updated: SavedAccountDetails) => void;
}

export const AccountDetailsSection: React.FC<AccountDetailsSectionProps> = ({
  methods,
  selectedMethodId,
  savedAccounts,
  onSelectMethod,
  onSaveAccountDetails,
}) => {
  const activeMethod = methods.find((m) => m.id === selectedMethodId) ?? methods[0];
  const saved = savedAccounts[activeMethod.id];

  const [editing, setEditing] = useState(false);
  const [holderName, setHolderName] = useState(saved?.accountHolderName ?? '');
  const [identifier, setIdentifier] = useState(saved?.rawAccountIdentifier ?? '');
  const [extraField, setExtraField] = useState(saved?.extraField ?? '');
  const [additionalNote, setAdditionalNote] = useState(saved?.additionalNote ?? '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openEditorForMethod = (methodId: string) => {
    const rec = savedAccounts[methodId];
    onSelectMethod(methodId);
    setHolderName(rec?.accountHolderName ?? '');
    setIdentifier(rec?.rawAccountIdentifier ?? '');
    setExtraField(rec?.extraField ?? '');
    setAdditionalNote(rec?.additionalNote ?? '');
    setErrorMsg(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holderName.trim() || !identifier.trim() || !extraField.trim()) {
      setErrorMsg('Please fill all placeholder account fields before saving.');
      return;
    }
    onSaveAccountDetails(activeMethod.id, {
      methodId: activeMethod.id,
      accountHolderName: holderName.trim(),
      rawAccountIdentifier: identifier.trim(),
      extraField: extraField.trim(),
      additionalNote: additionalNote.trim(),
      updatedAtLabel: 'Updated today · Nov 12, 2026',
    });
    setErrorMsg(null);
    setEditing(false);
  };

  return (
    <section data-testid="withdrawal-account-details-section" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-extrabold text-white">
            Payment Methods & Placeholder Account Details
          </h2>
          <p className="text-xs text-purple-200/75">
            Sensitive demo identifiers are masked automatically · Do not enter real bank data
          </p>
        </div>
        <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/25 text-amber-200">
          Masked Demo Values
        </span>
      </div>

      <PaymentMethodGrid
        methods={methods}
        selectedMethodId={activeMethod.id}
        onSelectMethod={openEditorForMethod}
      />

      <div className="rounded-3xl bg-[#1A0E33]/95 border border-purple-500/30 p-5 space-y-4 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300/90">
              Selected Placeholder Method
            </p>
            <h3 className="text-base font-extrabold text-white mt-0.5">{activeMethod.name}</h3>
          </div>

          <button
            type="button"
            data-testid="edit-account-details-btn"
            onClick={() => {
              if (!editing && saved) {
                setHolderName(saved.accountHolderName);
                setIdentifier(saved.rawAccountIdentifier);
                setExtraField(saved.extraField);
                setAdditionalNote(saved.additionalNote);
              }
              setErrorMsg(null);
              setEditing((v) => !v);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-purple-400/35 text-xs font-bold text-white transition cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-pink-400" />
            {editing ? 'Cancel Edit' : 'Edit Account Details'}
          </button>
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="space-y-3.5">
            {errorMsg && (
              <div className="rounded-xl bg-rose-500/15 border border-rose-400/35 px-3 py-2 text-xs text-rose-200 font-semibold">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block space-y-1 text-xs text-purple-200">
                <span>Account Holder Name (Fake Placeholder)</span>
                <input
                  type="text"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  data-testid="account-holder-input"
                  className="w-full rounded-xl bg-[#120826] border border-purple-500/30 px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-400"
                />
              </label>

              <label className="block space-y-1 text-xs text-purple-200">
                <span>{activeMethod.identifierLabel}</span>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={activeMethod.identifierPlaceholder}
                  data-testid="account-identifier-input"
                  className="w-full rounded-xl bg-[#120826] border border-purple-500/30 px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-400"
                />
              </label>

              <label className="block space-y-1 text-xs text-purple-200">
                <span>{activeMethod.extraFieldLabel}</span>
                <input
                  type="text"
                  value={extraField}
                  onChange={(e) => setExtraField(e.target.value)}
                  placeholder={activeMethod.extraFieldPlaceholder}
                  data-testid="account-extra-input"
                  className="w-full rounded-xl bg-[#120826] border border-purple-500/30 px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-400"
                />
              </label>

              <label className="block space-y-1 text-xs text-purple-200">
                <span>Demo Note (Optional)</span>
                <input
                  type="text"
                  value={additionalNote}
                  onChange={(e) => setAdditionalNote(e.target.value)}
                  className="w-full rounded-xl bg-[#120826] border border-purple-500/30 px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-400"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="submit"
                data-testid="save-account-details-btn"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#FF2E93] to-[#C026D3] text-xs font-bold text-white cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-[#130926] border border-white/10 p-3.5">
              <p className="text-xs text-purple-300/80">Account Holder Name</p>
              <p className="text-sm font-bold text-white mt-0.5">{saved?.accountHolderName}</p>
            </div>

            <div className="rounded-2xl bg-[#130926] border border-white/10 p-3.5">
              <p className="text-xs text-purple-300/80 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-300" />
                Masked Account Identifier
              </p>
              <p
                data-testid="masked-account-identifier"
                className="text-sm font-mono font-bold text-amber-300 mt-0.5"
              >
                {maskDemoAccountIdentifier(saved?.rawAccountIdentifier ?? '')}
              </p>
            </div>

            <div className="rounded-2xl bg-[#130926] border border-white/10 p-3.5">
              <p className="text-xs text-purple-300/80">{activeMethod.extraFieldLabel}</p>
              <p className="text-sm font-bold text-white mt-0.5">{saved?.extraField}</p>
            </div>

            <div className="rounded-2xl bg-[#130926] border border-white/10 p-3.5">
              <p className="text-xs text-purple-300/80">Additional Info</p>
              <p className="text-sm font-semibold text-purple-100 mt-0.5">
                {saved?.additionalNote || 'Placeholder destination ready for frontend preview'}
              </p>
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-purple-950/60 border border-purple-400/20 px-3.5 py-2.5 flex items-center gap-2 text-xs text-purple-200/80">
          <Info className="w-4 h-4 text-amber-300 shrink-0" />
          <span>
            Placeholder demo account details only. Do not submit real banking credentials or personal
            card numbers.
          </span>
        </div>
      </div>
    </section>
  );
};
