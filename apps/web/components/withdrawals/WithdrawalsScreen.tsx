'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  CreditCard,
  FileSpreadsheet,
  Heart,
  History,
  Info,
  Lock,
  MoreVertical,
  PlusCircle,
  RotateCcw,
  ShieldCheck,
  Wallet,
  X,
} from 'lucide-react';
import { useUnreadNotificationsCount } from '@/components/notifications/useUnreadNotificationsCount';
import { Avatar } from '@/components/ui/Avatar';
import {
  buildWithdrawalTimeline,
  computeWithdrawalSummary,
  createInitialSavedAccounts,
  createInitialWithdrawalRecords,
  DEMO_PAYMENT_METHODS,
  DEMO_WITHDRAWAL_USER,
  formatPts,
  maskDemoAccountIdentifier,
  WITHDRAWALS_TODAY_ISO,
} from './mockWithdrawalsData';
import { AccountDetailsSection, PaymentMethodGrid } from './PaymentMethodCards';
import {
  SavedAccountDetails,
  WithdrawalDraft,
  WithdrawalEmptyKind,
  WithdrawalRecord,
  WithdrawalTab,
} from './types';
import { getWithdrawalStatusStyle, WithdrawalDetailView } from './WithdrawalDetailView';
import { WithdrawalEmptyState } from './WithdrawalEmptyState';
import { HistoryStatusFilter, WithdrawalHistorySection } from './WithdrawalHistorySection';
import {
  WithdrawalConfirmationView,
  WithdrawalRequestFormView,
  WithdrawalReviewView,
} from './WithdrawalRequestFlow';

export const WithdrawalsScreen: React.FC = () => {
  const unreadNotifications = useUnreadNotificationsCount();
  const user = DEMO_WITHDRAWAL_USER;

  const [records, setRecords] = useState<WithdrawalRecord[]>(createInitialWithdrawalRecords);
  const [savedAccounts, setSavedAccounts] = useState<Record<string, SavedAccountDetails>>(
    createInitialSavedAccounts
  );

  const [activeTab, setActiveTab] = useState<WithdrawalTab>('dashboard');
  const [historyFilter, setHistoryFilter] = useState<HistoryStatusFilter>('All');
  const [selectedRecord, setSelectedRecord] = useState<WithdrawalRecord | null>(null);
  const [lastConfirmedRecord, setLastConfirmedRecord] = useState<WithdrawalRecord | null>(null);

  const defaultAccount = savedAccounts[DEMO_PAYMENT_METHODS[0].id];
  const [draft, setDraft] = useState<WithdrawalDraft>({
    amountInput: '',
    methodId: DEMO_PAYMENT_METHODS[0].id,
    accountHolderName: defaultAccount.accountHolderName,
    accountIdentifier: defaultAccount.rawAccountIdentifier,
    extraField: defaultAccount.extraField,
    additionalNote: '',
  });

  const [quickError, setQuickError] = useState<string | null>(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [forcedEmptyKind, setForcedEmptyKind] = useState<WithdrawalEmptyKind | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const summary = useMemo(
    () => computeWithdrawalSummary(records, user.baseAvailableDemoBalance),
    [records, user.baseAvailableDemoBalance]
  );

  const selectedMethod = useMemo(
    () => DEMO_PAYMENT_METHODS.find((m) => m.id === draft.methodId) ?? DEMO_PAYMENT_METHODS[0],
    [draft.methodId]
  );

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  };

  const navigateTab = (tab: WithdrawalTab, nextHistoryFilter?: HistoryStatusFilter) => {
    setForcedEmptyKind(null);
    setSelectedRecord(null);
    setQuickError(null);
    if (nextHistoryFilter) {
      setHistoryFilter(nextHistoryFilter);
    }
    setActiveTab(tab);
    scrollToTop();
  };

  const handleSelectMethodSyncAccount = (methodId: string) => {
    const saved = savedAccounts[methodId];
    setDraft((prev) => ({
      ...prev,
      methodId,
      accountHolderName: saved?.accountHolderName ?? prev.accountHolderName,
      accountIdentifier: saved?.rawAccountIdentifier ?? '',
      extraField: saved?.extraField ?? '',
    }));
  };

  const handleSaveAccountDetails = (methodId: string, updated: SavedAccountDetails) => {
    setSavedAccounts((prev) => ({ ...prev, [methodId]: updated }));
    if (draft.methodId === methodId) {
      setDraft((prev) => ({
        ...prev,
        accountHolderName: updated.accountHolderName,
        accountIdentifier: updated.rawAccountIdentifier,
        extraField: updated.extraField,
        additionalNote: updated.additionalNote,
      }));
    }
    setToastMessage('Saved placeholder account details in local frontend state.');
  };

  const handleQuickDashboardReview = () => {
    const trimmed = draft.amountInput.trim();
    const numeric = Number(trimmed);
    if (!trimmed) {
      setQuickError('Enter a demo withdrawal amount to continue to Review Request.');
      return;
    }
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setQuickError('Withdrawal amount must be greater than zero.');
      return;
    }
    if (numeric > summary.availableDemoBalance) {
      setQuickError(
        `Amount cannot exceed available demo balance (${formatPts(summary.availableDemoBalance)} pts).`
      );
      return;
    }
    if (!draft.accountHolderName.trim() || !draft.accountIdentifier.trim()) {
      navigateTab('request_form');
      return;
    }
    setQuickError(null);
    navigateTab('review');
  };

  const handleConfirmDemoRequest = () => {
    const numericAmount = Math.round(Number(draft.amountInput));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      navigateTab('request_form');
      return;
    }

    const nextNum = 1025 + records.filter((r) => !r.id.startsWith('WD101') && r.id !== 'WD1020' && r.id !== 'WD1021' && r.id !== 'WD1022' && r.id !== 'WD1023' && r.id !== 'WD1024').length;
    const newId = `WD${nextNum}`;
    const masked = maskDemoAccountIdentifier(draft.accountIdentifier);
    const dateLabel = 'Today · Nov 12, 2026';
    const timeLabel = 'Just now';

    const newRecord: WithdrawalRecord = {
      id: newId,
      userId: user.userId,
      amount: numericAmount,
      unitLabel: 'pts',
      paymentMethodId: selectedMethod.id,
      paymentMethodName: selectedMethod.name,
      maskedAccountDetails: masked,
      accountHolderName: draft.accountHolderName.trim(),
      requestDateLabel: dateLabel,
      requestDateIso: WITHDRAWALS_TODAY_ISO,
      requestTimeLabel: timeLabel,
      status: 'Pending',
      demoTxRef: `DEMO-WD-${nextNum}${Date.now().toString().slice(-3)}`,
      note:
        draft.additionalNote.trim() ||
        'Submitted locally via Withdrawals frontend demonstration form.',
      timeline: buildWithdrawalTimeline('Pending', dateLabel, timeLabel),
    };

    setRecords((prev) => [newRecord, ...prev]);
    setLastConfirmedRecord(newRecord);
    setDraft((prev) => ({ ...prev, amountInput: '', additionalNote: '' }));
    setToastMessage(`Demo request #${newRecord.id} created locally (${formatPts(numericAmount)} pts).`);
    navigateTab('confirmation');
  };

  const handleResetDemo = () => {
    const freshAccounts = createInitialSavedAccounts();
    const first = freshAccounts[DEMO_PAYMENT_METHODS[0].id];
    setRecords(createInitialWithdrawalRecords());
    setSavedAccounts(freshAccounts);
    setDraft({
      amountInput: '',
      methodId: DEMO_PAYMENT_METHODS[0].id,
      accountHolderName: first.accountHolderName,
      accountIdentifier: first.rawAccountIdentifier,
      extraField: first.extraField,
      additionalNote: '',
    });
    setSelectedRecord(null);
    setLastConfirmedRecord(null);
    setForcedEmptyKind(null);
    setHistoryFilter('All');
    setQuickError(null);
    setShowOptionsMenu(false);
    setActiveTab('dashboard');
    setToastMessage('Restored all Withdrawals demo balances and sample records.');
  };

  const recentPreviewRecords = useMemo(() => {
    const wd1024 = records.find((r) => r.id === 'WD1024');
    const wd1018 = records.find((r) => r.id === 'WD1018');
    const extras = records.filter((r) => r.id !== 'WD1024' && r.id !== 'WD1018').slice(0, 2);
    const list: WithdrawalRecord[] = [];
    if (records[0] && records[0].id !== 'WD1024') list.push(records[0]);
    if (wd1024) list.push(wd1024);
    if (wd1018) list.push(wd1018);
    for (const item of extras) {
      if (list.length < 4 && !list.some((x) => x.id === item.id)) list.push(item);
    }
    return list;
  }, [records]);

  const navTabs: Array<{
    id: WithdrawalTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: Wallet },
    { id: 'request_form', label: 'New Withdrawal', icon: PlusCircle },
    { id: 'payment_methods', label: 'Payment Methods', icon: CreditCard },
    { id: 'account_details', label: 'Account Details', icon: Lock },
    { id: 'history', label: 'History', icon: History, badge: summary.totalRequestsCount },
  ];

  return (
    <div
      data-testid="withdrawals-page"
      className="min-h-screen bg-gradient-to-b from-[#17092E] via-[#110623] to-[#0B0418] text-white pb-16"
    >
      {/* Top App Bar matching 09_10_withdrawals.png */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#15082B]/90 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/earnings"
              data-testid="withdrawals-back-earnings"
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
              href="/wallet"
              className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-purple-100 transition"
              title="Wallet"
            >
              <Heart className="w-4 h-4" />
            </Link>

            <button
              type="button"
              data-testid="withdrawals-options-btn"
              onClick={() => setShowOptionsMenu((v) => !v)}
              className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-purple-100 transition cursor-pointer"
              title="Demo Tools & Empty States"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showOptionsMenu && (
              <div
                data-testid="withdrawals-options-menu"
                className="absolute right-0 top-11 w-64 rounded-2xl bg-[#1F103D] border border-purple-400/30 shadow-2xl p-2 z-50 space-y-1 text-xs"
              >
                <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-300">
                  Demo Controls
                </p>
                <button
                  type="button"
                  onClick={handleResetDemo}
                  className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/10 text-white font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
                  Reset Demo Balances & Records
                </button>
                <div className="border-t border-white/10 my-1" />
                <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-300">
                  Preview Empty States
                </p>
                {(
                  [
                    ['no_requests', 'Empty: No Withdrawal Requests'],
                    ['no_pending', 'Empty: No Pending Requests'],
                    ['no_completed', 'Empty: No Completed Requests'],
                    ['no_rejected', 'Empty: No Rejected Requests'],
                    ['no_search_results', 'Empty: No Search Results'],
                    ['no_payment_methods', 'Empty: No Payment Methods'],
                  ] as const
                ).map(([kind, label]) => (
                  <button
                    key={kind}
                    type="button"
                    data-testid={`preview-wd-empty-${kind}`}
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
                  href="/coin-seller"
                  className="block px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-purple-200"
                >
                  Open Coin Seller
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
        {/* Page Header + User Identity */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Withdrawals
            </h1>
            <p className="text-sm text-purple-200/80 mt-0.5">Manage withdrawal requests</p>
          </div>

          <div
            data-testid="withdrawals-user-card"
            className="flex items-center gap-3 rounded-2xl bg-[#1E103A]/90 border border-purple-500/30 px-3.5 py-2 self-start md:self-auto"
          >
            <Avatar src={user.avatar} alt={user.displayName} size="sm" ring="vip" />
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                {user.displayName}
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300">
                  Demo Account
                </span>
              </p>
              <p className="text-[11px] text-purple-300/80">
                {user.username} · ID {user.userId}
              </p>
            </div>
          </div>
        </div>

        {/* Toast confirmation banner */}
        {toastMessage && (
          <div
            data-testid="withdrawals-toast"
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

        {/* Navigation Tabs */}
        <nav
          aria-label="Withdrawals sections"
          className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar"
        >
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id && !selectedRecord && !forcedEmptyKind;
            return (
              <button
                key={tab.id}
                type="button"
                data-testid={`withdrawals-tab-${tab.id}`}
                onClick={() => navigateTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border whitespace-nowrap transition cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-[#FF2E93] to-[#C026D3] border-pink-400 text-white shadow-lg shadow-pink-500/20'
                    : 'bg-[#190D30] hover:bg-[#241445] border-purple-500/25 text-purple-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {typeof tab.badge === 'number' && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      active ? 'bg-black/25 text-white' : 'bg-white/10 text-purple-200'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Empty preview / Selected record Detail / Tab Views */}
        {forcedEmptyKind ? (
          <WithdrawalEmptyState
            kind={forcedEmptyKind}
            onReset={() => setForcedEmptyKind(null)}
            resetLabel="Exit Empty Preview & Restore Data"
          />
        ) : selectedRecord ? (
          <WithdrawalDetailView
            record={selectedRecord}
            onBack={() => setSelectedRecord(null)}
          />
        ) : activeTab === 'request_form' ? (
          <WithdrawalRequestFormView
            draft={draft}
            availableBalance={summary.availableDemoBalance}
            methods={DEMO_PAYMENT_METHODS}
            onChangeDraft={setDraft}
            onProceedToReview={() => navigateTab('review')}
            onCancel={() => navigateTab('dashboard')}
          />
        ) : activeTab === 'review' ? (
          <WithdrawalReviewView
            draft={draft}
            availableBalance={summary.availableDemoBalance}
            method={selectedMethod}
            onConfirmDemoRequest={handleConfirmDemoRequest}
            onEditRequest={() => navigateTab('request_form')}
            onCancel={() => navigateTab('dashboard')}
          />
        ) : activeTab === 'confirmation' && lastConfirmedRecord ? (
          <WithdrawalConfirmationView
            record={lastConfirmedRecord}
            onViewRequest={(rec) => setSelectedRecord(rec)}
            onBackToDashboard={() => navigateTab('dashboard')}
          />
        ) : activeTab === 'payment_methods' || activeTab === 'account_details' ? (
          <AccountDetailsSection
            methods={DEMO_PAYMENT_METHODS}
            selectedMethodId={draft.methodId}
            savedAccounts={savedAccounts}
            onSelectMethod={handleSelectMethodSyncAccount}
            onSaveAccountDetails={handleSaveAccountDetails}
          />
        ) : activeTab === 'history' ? (
          <WithdrawalHistorySection
            records={records}
            statusFilter={historyFilter}
            onStatusFilterChange={setHistoryFilter}
            onOpenDetail={(rec) => {
              setSelectedRecord(rec);
              scrollToTop();
            }}
          />
        ) : (
          /* DASHBOARD VIEW matching 09_10_withdrawals.png */
          <div
            data-testid="withdrawals-dashboard-view"
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
          >
            {/* Primary Column matching 09_10_withdrawals.png */}
            <div className="lg:col-span-6 space-y-5">
              {/* Hero AVAILABLE BALANCE Card */}
              <div
                data-testid="available-balance-hero-card"
                className="rounded-3xl bg-gradient-to-br from-[#2C1557] via-[#210F43] to-[#170932] border border-purple-400/25 p-5 md:p-6 shadow-xl space-y-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-purple-200/80">
                    AVAILABLE BALANCE
                  </p>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300">
                    Approved Unit: pts
                  </span>
                </div>

                <div>
                  <p
                    data-testid="dashboard-available-balance"
                    className="text-4xl font-extrabold text-white tracking-tight tabular-nums"
                  >
                    {formatPts(summary.availableDemoBalance)}{' '}
                    <span className="text-base font-bold text-amber-300">pts</span>
                  </p>
                  <p className="text-xs text-purple-200/75 mt-1">Demo balance · Not real funds</p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => navigateTab('history', 'Pending')}
                    className="rounded-2xl bg-[#130926]/80 hover:bg-[#1B0D35] border border-white/10 p-2.5 text-left transition cursor-pointer"
                  >
                    <p className="text-[10px] text-purple-300">Pending</p>
                    <p
                      data-testid="dashboard-pending-amount"
                      className="text-xs font-extrabold text-amber-300 mt-0.5 tabular-nums"
                    >
                      {formatPts(summary.pendingAmount)} pts
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTab('history', 'Completed')}
                    className="rounded-2xl bg-[#130926]/80 hover:bg-[#1B0D35] border border-white/10 p-2.5 text-left transition cursor-pointer"
                  >
                    <p className="text-[10px] text-purple-300">Completed</p>
                    <p
                      data-testid="dashboard-completed-amount"
                      className="text-xs font-extrabold text-emerald-300 mt-0.5 tabular-nums"
                    >
                      {formatPts(summary.completedAmount)} pts
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTab('history', 'All')}
                    className="rounded-2xl bg-[#130926]/80 hover:bg-[#1B0D35] border border-white/10 p-2.5 text-left transition cursor-pointer"
                  >
                    <p className="text-[10px] text-purple-300">Total Requests</p>
                    <p
                      data-testid="dashboard-total-requests"
                      className="text-xs font-extrabold text-white mt-0.5 tabular-nums"
                    >
                      {summary.totalRequestsCount}
                    </p>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    data-testid="withdraw-now-btn"
                    onClick={() => navigateTab('request_form')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-bold text-white cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-pink-300" />
                    Withdraw Now
                  </button>
                  <button
                    type="button"
                    data-testid="dashboard-history-btn"
                    onClick={() => navigateTab('history', 'All')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-purple-400/30 text-xs font-bold text-purple-100 cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5 text-amber-300" />
                    Withdrawal History ({summary.totalRequestsCount})
                  </button>
                </div>
              </div>

              {/* Quick Withdrawal details block matching 09_10_withdrawals.png */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-white">Withdrawal details</h2>
                  <button
                    type="button"
                    onClick={() => navigateTab('request_form')}
                    className="text-xs font-bold text-pink-300 hover:text-pink-200 cursor-pointer"
                  >
                    Full Request Form →
                  </button>
                </div>

                {quickError && (
                  <div
                    data-testid="dashboard-quick-error"
                    className="rounded-2xl bg-rose-500/15 border border-rose-400/35 px-3.5 py-2.5 text-xs font-semibold text-rose-200"
                  >
                    {quickError}
                  </div>
                )}

                <div className="space-y-2.5">
                  <label className="block rounded-2xl bg-[#1B0E36] border border-purple-500/25 px-4 py-3.5 focus-within:border-pink-400 transition">
                    <span className="block text-sm font-bold text-white">Withdrawal amount</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={draft.amountInput}
                      onChange={(e) => {
                        setQuickError(null);
                        setDraft((prev) => ({ ...prev, amountInput: e.target.value }));
                      }}
                      data-testid="dashboard-quick-amount-input"
                      placeholder="Enter amount (pts)"
                      className="w-full bg-transparent text-sm text-purple-100 placeholder:text-purple-300/60 focus:outline-none mt-1"
                    />
                  </label>

                  <button
                    type="button"
                    data-testid="dashboard-select-method-card"
                    onClick={() => navigateTab('payment_methods')}
                    className="w-full text-left rounded-2xl bg-[#1B0E36] hover:bg-[#231247] border border-purple-500/25 px-4 py-3.5 flex items-center justify-between gap-3 transition cursor-pointer"
                  >
                    <div>
                      <p className="text-sm font-bold text-white">Payment method</p>
                      <p className="text-xs text-purple-200/80 mt-0.5">{selectedMethod.name}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-purple-300 shrink-0" />
                  </button>

                  <button
                    type="button"
                    data-testid="dashboard-account-details-card"
                    onClick={() => navigateTab('account_details')}
                    className="w-full text-left rounded-2xl bg-[#1B0E36] hover:bg-[#231247] border border-purple-500/25 px-4 py-3.5 flex items-center justify-between gap-3 transition cursor-pointer"
                  >
                    <div>
                      <p className="text-sm font-bold text-white">Account details</p>
                      <p className="text-xs text-purple-200/80 mt-0.5">
                        {draft.accountHolderName} · {maskDemoAccountIdentifier(draft.accountIdentifier)}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-purple-300 shrink-0" />
                  </button>
                </div>

                {/* Vivid Magenta Review Request CTA matching 09_10_withdrawals.png */}
                <button
                  type="button"
                  data-testid="dashboard-review-request-cta"
                  onClick={handleQuickDashboardReview}
                  className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#FF0F7B] via-[#FF1E8E] to-[#E11D84] hover:brightness-110 active:scale-[0.99] text-white text-sm font-extrabold shadow-xl shadow-pink-600/30 transition cursor-pointer"
                >
                  Review Request
                </button>
              </div>

              {/* Recent requests list matching 09_10_withdrawals.png */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-white">Recent requests</h3>
                  <button
                    type="button"
                    onClick={() => navigateTab('history', 'All')}
                    className="text-xs font-bold text-pink-300 hover:text-pink-200 cursor-pointer"
                  >
                    See All ({records.length})
                  </button>
                </div>

                <div className="space-y-2">
                  {recentPreviewRecords.map((rec) => {
                    const textStatusColor =
                      rec.status === 'Approved' || rec.status === 'Completed'
                        ? 'text-emerald-300'
                        : rec.status === 'Pending'
                        ? 'text-amber-300'
                        : rec.status === 'Rejected'
                        ? 'text-rose-300'
                        : 'text-sky-300';
                    return (
                      <button
                        key={rec.id}
                        type="button"
                        data-testid={`recent-request-row-${rec.id}`}
                        onClick={() => {
                          setSelectedRecord(rec);
                          scrollToTop();
                        }}
                        className="w-full text-left rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 px-4 py-3 flex items-center justify-between gap-3 transition cursor-pointer"
                      >
                        <div>
                          <p className="text-xs font-bold text-white">
                            Request #{rec.id}{' '}
                            <span className="text-purple-300/80 font-normal">
                              · {formatPts(rec.amount)} {rec.unitLabel}
                            </span>
                          </p>
                          <p className="text-[11px] text-purple-300/70 mt-0.5">
                            {rec.paymentMethodName} · {rec.requestDateLabel}
                          </p>
                        </div>
                        <span className={`text-xs font-extrabold shrink-0 ${textStatusColor}`}>
                          {rec.status}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Secondary Column (Desktop/Tablet): Payment Methods, Status Summary & Guardrails */}
            <div className="lg:col-span-6 space-y-5">
              <div className="rounded-3xl bg-[#1A0E33]/95 border border-purple-500/25 p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-white">
                      Placeholder Payment Methods
                    </h3>
                    <p className="text-[11px] text-purple-300/75">
                      Select a demo payout destination for new requests
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateTab('account_details')}
                    className="text-xs font-bold text-pink-300 hover:text-pink-200 cursor-pointer"
                  >
                    Edit Masked Details
                  </button>
                </div>

                <PaymentMethodGrid
                  methods={DEMO_PAYMENT_METHODS}
                  selectedMethodId={draft.methodId}
                  onSelectMethod={handleSelectMethodSyncAccount}
                />
              </div>

              <div className="rounded-3xl bg-[#1A0E33]/95 border border-purple-500/25 p-5 space-y-3.5">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-amber-300" />
                  Withdrawal Status Overview
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  {(
                    [
                      ['Pending', summary.pendingCount, summary.pendingAmount],
                      ['Processing', summary.processingCount, summary.processingAmount],
                      ['Approved', summary.approvedCount, summary.approvedAmount],
                      ['Completed', summary.completedCount, summary.completedAmount],
                      ['Rejected', summary.rejectedCount, summary.rejectedAmount],
                    ] as const
                  ).map(([status, count, amt]) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => navigateTab('history', status)}
                      className="rounded-2xl bg-[#130926] hover:bg-[#1D0F38] border border-white/10 p-3 text-left transition cursor-pointer space-y-1"
                    >
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-bold ${getWithdrawalStatusStyle(status)}`}
                      >
                        {status}
                      </span>
                      <p className="text-sm font-extrabold text-white tabular-nums pt-0.5">
                        {count} {count === 1 ? 'Request' : 'Requests'}
                      </p>
                      <p className="text-[11px] text-purple-300/75 tabular-nums">
                        {formatPts(amt)} pts (Demo)
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl bg-[#1A0E33]/95 border border-purple-500/25 p-5 space-y-2.5 text-xs text-purple-200/80">
                <div className="flex items-center gap-2 font-bold text-white">
                  <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>Frontend-Only Demo Notice</span>
                </div>
                <p>
                  All withdrawal balances, payment methods, masked identifiers, and request timelines
                  shown here are frontend sample data. No real payouts, bank transfers, fees, or
                  currency conversions occur.
                </p>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-amber-200/90">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>Minimum/maximum payout thresholds remain unconfigured pending product rules.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
