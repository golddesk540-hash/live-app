'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  Search,
  Coins,
  Star,
  RotateCcw,
  PlusCircle,
  MinusCircle,
  FileText,
  Lock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Gift,
  Download,
} from 'lucide-react';
import type { WalletBalance, WalletAuditLogRecord } from '@/lib/wallet';

export default function AdminFinancePanel() {
  const [authUser, setAuthUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState<boolean>(false);

  // Quick Auth Sign-In for Admin / Finance Testing
  const [loginEmail, setLoginEmail] = useState<string>('finance@popolive.com');
  const [loginPassword, setLoginPassword] = useState<string>('FinancePass123!');
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Data Tabs
  const [activeTab, setActiveTab] = useState<'wallets' | 'coins' | 'points' | 'gifts' | 'earnings' | 'topup' | 'audit'>('wallets');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [wallets, setWallets] = useState<WalletBalance[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [giftTransactions, setGiftTransactions] = useState<any[]>([]);
  const [earningShares, setEarningShares] = useState<any[]>([]);
  const [earningSummary, setEarningSummary] = useState<any>(null);
  const [topupPackages, setTopupPackages] = useState<any[]>([]);
  const [topupOrders, setTopupOrders] = useState<any[]>([]);
  const [topupSummary, setTopupSummary] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<WalletAuditLogRecord[]>([]);
  const [canAdjust, setCanAdjust] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Adjustment Modal State
  const [adjustModalUser, setAdjustModalUser] = useState<WalletBalance | null>(null);
  const [adjustBalanceType, setAdjustBalanceType] = useState<'coins' | 'points'>('coins');
  const [adjustOp, setAdjustOp] = useState<'credit' | 'debit'>('credit');
  const [adjustAmount, setAdjustAmount] = useState<string>('100');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      setAuthUser(data?.user || null);
      const role = data?.user?.role || '';
      setCanAdjust(role === 'finance_admin' || role === 'super_admin');
    } catch {
      setAuthUser(null);
    } finally {
      setAuthChecked(true);
    }
  }, []);

  const loadTabData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'wallets') {
        const res = await fetch(`/api/admin/finance/wallets?search=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.success) {
          setWallets(data.wallets || []);
          setCanAdjust(Boolean(data.canAdjustBalances));
        }
      } else if (activeTab === 'coins' || activeTab === 'points') {
        const params = new URLSearchParams({
          ledger: activeTab,
          limit: '30',
        });
        if (searchQuery.trim()) {
          if (searchQuery.toUpperCase().startsWith('TXN')) {
            params.set('transactionId', searchQuery.trim());
          } else {
            params.set('userId', searchQuery.trim());
          }
        }
        if (statusFilter !== 'all') params.set('status', statusFilter);

        const res = await fetch(`/api/admin/finance/transactions?${params.toString()}`);
        const data = await res.json();
        if (data.success) setTransactions(data.transactions || []);
      } else if (activeTab === 'gifts') {
        const params = new URLSearchParams({ limit: '30' });
        if (searchQuery.trim()) params.set('search', searchQuery.trim());
        if (statusFilter !== 'all') params.set('status', statusFilter);
        const res = await fetch(`/api/admin/gifts/transactions?${params.toString()}`);
        const data = await res.json();
        if (data.success) setGiftTransactions(data.transactions || []);
      } else if (activeTab === 'earnings') {
        const params = new URLSearchParams({ limit: '40' });
        if (searchQuery.trim()) params.set('search', searchQuery.trim());
        if (statusFilter !== 'all') params.set('status', statusFilter);
        const res = await fetch(`/api/admin/finance/earnings?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setEarningShares(data.records || []);
          setEarningSummary(data.summary || null);
        } else {
          setEarningShares([]);
          setEarningSummary(null);
        }
      } else if (activeTab === 'topup') {
        const params = new URLSearchParams({ limit: '30' });
        if (searchQuery.trim()) params.set('search', searchQuery.trim());
        if (statusFilter !== 'all') params.set('status', statusFilter);
        const [pkgRes, ordRes] = await Promise.all([
          fetch('/api/admin/finance/topup/packages'),
          fetch(`/api/admin/finance/topup/orders?${params.toString()}`),
        ]);
        const [pkgData, ordData] = await Promise.all([pkgRes.json(), ordRes.json()]);
        setTopupPackages(pkgData.success ? pkgData.packages || [] : []);
        setTopupOrders(ordData.success ? ordData.items || [] : []);
        setTopupSummary(ordData.success ? ordData.summary || null : null);
      } else if (activeTab === 'audit') {
        const res = await fetch(`/api/admin/finance/audit-logs?userId=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.success) setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Admin finance load error:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, statusFilter]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (authUser && (authUser.is_staff || ['admin', 'staff', 'finance_admin', 'super_admin'].includes(authUser.role))) {
      loadTabData();
    }
  }, [authUser, loadTabData]);

  const handleFinanceSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      // Ensure consent accepted first
      await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept',
          termsAccepted: true,
          privacyAccepted: true,
          isAdultConfirmed: true,
        }),
      });

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setLoginError(data.error || 'Authentication failed');
      } else {
        await checkSession();
      }
    } catch {
      setLoginError('Network error signing in.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalUser) return;
    setActionMsg(null);
    try {
      const res = await fetch('/api/admin/finance/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: adjustModalUser.userId,
          balanceType: adjustBalanceType,
          operation: adjustOp,
          amount: parseInt(adjustAmount, 10),
          reason: adjustReason,
          idempotencyKey: `ADM_UI_${Date.now()}`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setActionMsg({ type: 'error', text: data.error || 'Adjustment rejected.' });
      } else {
        setActionMsg({
          type: 'success',
          text: `Adjusted ${adjustBalanceType} (${adjustOp} ${adjustAmount}) for ${adjustModalUser.userId}. Audit logged.`,
        });
        setAdjustModalUser(null);
        setAdjustReason('');
        await loadTabData();
      }
    } catch {
      setActionMsg({ type: 'error', text: 'Failed to submit adjustment.' });
    }
  };

  const handleReverseTx = async (transactionId: string, ledgerType: 'coins' | 'points') => {
    const reason = prompt(`Enter mandatory Finance Audit Reason to reverse ${transactionId}:`);
    if (!reason || reason.trim().length < 5) {
      alert('Reversal cancelled: A reason of at least 5 characters is required.');
      return;
    }

    setActionMsg(null);
    try {
      const res = await fetch('/api/admin/finance/reverse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, ledgerType, reason }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setActionMsg({ type: 'error', text: data.error || 'Reversal failed.' });
      } else {
        setActionMsg({
          type: 'success',
          text: `Reversed transaction ${transactionId} cleanly with linked audit trail.`,
        });
        await loadTabData();
      }
    } catch {
      setActionMsg({ type: 'error', text: 'Network error reversing transaction.' });
    }
  };

  const handleReverseGiftTx = async (giftTransactionId: string) => {
    const reason = prompt(`Enter mandatory Finance Audit Reason to reverse ${giftTransactionId}:`);
    if (!reason || reason.trim().length < 4) {
      alert('Reversal cancelled: A reason of at least 4 characters is required.');
      return;
    }

    setActionMsg(null);
    try {
      const res = await fetch(
        `/api/admin/gifts/transactions/${encodeURIComponent(giftTransactionId)}/reverse`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        setActionMsg({ type: 'error', text: data.error || 'Gift reversal failed.' });
      } else {
        setActionMsg({
          type: 'success',
          text: `Reversed gift ${giftTransactionId}: refunded sender coins & deducted host points with full audit.`,
        });
        await loadTabData();
      }
    } catch {
      setActionMsg({ type: 'error', text: 'Network error reversing gift transaction.' });
    }
  };

  const isAnyAdmin =
    authUser &&
    (Boolean(authUser.is_staff) || ['admin', 'staff', 'finance_admin', 'super_admin'].includes(authUser.role));

  return (
    <div className="min-h-screen bg-[#080416] text-white p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-purple-500/20">
        <div className="flex items-center gap-3">
          <Link
            href="/wallet?preview=demo"
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black tracking-tight">
                Admin Finance & Wallet Control
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#ff2d78] text-white">
                P7.1 FINANCE
              </span>
            </div>
            <p className="text-xs text-white/55">
              Authorized Coin & Host Points Inspection, Adjustments, Reversals & Audit Trail
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {authUser && (
            <div className="px-3.5 py-2 rounded-xl bg-[#160d2e] border border-purple-500/30 flex items-center gap-2 text-xs">
              {canAdjust ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-amber-400" />
              )}
              <div>
                <div className="font-bold text-white">{authUser.nickname}</div>
                <div className="text-[10px] text-purple-300 uppercase font-mono">
                  Role: {authUser.role} {canAdjust ? '(Full Finance Write)' : '(Read-Only — Cannot Modify Balances)'}
                </div>
              </div>
            </div>
          )}
          <Link
            href="/admin/gifts"
            className="px-3.5 py-2 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 border border-pink-400/30 text-xs font-bold text-pink-200 inline-flex items-center gap-1.5"
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Gift Catalog Admin</span>
          </Link>
          <Link
            href="/staff"
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold"
          >
            Staff Center
          </Link>
        </div>
      </div>

      {/* Authentication Gate if not Admin */}
      {authChecked && !isAnyAdmin ? (
        <div className="max-w-md mx-auto mt-10 rounded-3xl bg-[#140a2a] border border-purple-500/30 p-6 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-[#ff2d78]/15 border border-[#ff2d78]/30 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-[#ff2d78]" />
          </div>
          <h2 className="text-lg font-extrabold mb-1">Finance Administrator Sign-In Required</h2>
          <p className="text-xs text-white/60 mb-4">
            Only authorized finance administrators can view user ledgers and execute audited wallet adjustments. Ordinary admins cannot alter balances.
          </p>

          {loginError && (
            <div className="mb-3 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300">
              {loginError}
            </div>
          )}

          <form onSubmit={handleFinanceSignIn} className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-white/70 block mb-1">Admin Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-[#0d0520] border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-white/70 block mb-1">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-[#0d0520] border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#ff2d78] to-[#ec4899] font-extrabold text-sm shadow-lg"
            >
              {loginLoading ? 'Authenticating...' : 'Authenticate to Finance Console'}
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* Action Status Banner */}
          {actionMsg && (
            <div
              className={`mb-4 p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
                actionMsg.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              }`}
            >
              {actionMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span>{actionMsg.text}</span>
            </div>
          )}

          {/* Ordinary Admin Read-Only Warning */}
          {authUser && !canAdjust && (
            <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span>
                Signed in as ordinary role (<strong>{authUser.role}</strong>). Wallet balance adjustments and transaction reversals are strictly restricted to <strong>finance_admin</strong> role.
              </span>
            </div>
          )}

          {/* Navigation Tabs & Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-1.5 bg-[#150b2b] p-1 rounded-2xl border border-purple-500/20">
              {(
                [
                  { id: 'wallets', label: 'User Wallets' },
                  { id: 'coins', label: 'Coin Ledger' },
                  { id: 'points', label: 'Points Ledger' },
                  { id: 'gifts', label: 'Gift Transactions' },
                  { id: 'earnings', label: 'Host Shares (70/30)' },
                  { id: 'topup', label: 'Top-up & Packages' },
                  { id: 'audit', label: 'Audit Logs' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                    activeTab === t.id
                      ? 'bg-gradient-to-r from-[#ff2d78] to-[#ec4899] text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-white/40 absolute top-1/2 -translate-y-1/2 left-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search User ID or Transaction ID (TXN_...)..."
                  className="w-full bg-[#150b2b] border border-purple-500/25 rounded-xl pl-9 pr-3 py-2 text-xs text-white"
                />
              </div>

              {(activeTab === 'coins' || activeTab === 'points') && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#150b2b] border border-purple-500/25 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="reversed">Reversed</option>
                  <option value="pending">Pending</option>
                </select>
              )}

              <button
                type="button"
                onClick={loadTabData}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10"
                title="Reload"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Data Table Container */}
          <div className="rounded-3xl bg-[#130927] border border-purple-500/25 overflow-hidden shadow-xl">
            {activeTab === 'wallets' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-purple-950/50 text-purple-200 uppercase text-[10px]">
                    <tr>
                      <th className="p-4">User ID</th>
                      <th className="p-4">Wallet ID</th>
                      <th className="p-4">Coin Balance</th>
                      <th className="p-4">Points Balance</th>
                      <th className="p-4">70% Rule</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/10">
                    {wallets.map((w) => (
                      <tr key={w.userId} className="hover:bg-white/[0.02]">
                        <td className="p-4 font-mono font-bold text-white">{w.userId}</td>
                        <td className="p-4 font-mono text-white/50 text-[11px]">{w.walletId.slice(0, 12)}...</td>
                        <td className="p-4 font-black text-amber-400">
                          <span className="inline-flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5" /> {w.coins.toLocaleString()}
                          </span>
                        </td>
                        <td className="p-4 font-black text-pink-400">
                          <span className="inline-flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-pink-400" /> {w.points.toLocaleString()}
                          </span>
                        </td>
                        <td className="p-4 text-white/60">{w.hostSharePercentage}%</td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            disabled={!canAdjust}
                            onClick={() => {
                              setAdjustModalUser(w);
                              setActionMsg(null);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#ff2d78]/20 hover:bg-[#ff2d78]/40 text-[#ff2d78] font-bold text-[11px] disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            {canAdjust ? 'Adjust Balance' : 'Locked (No Finance Role)'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {(activeTab === 'coins' || activeTab === 'points') && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-purple-950/50 text-purple-200 uppercase text-[10px]">
                    <tr>
                      <th className="p-4">Transaction ID</th>
                      <th className="p-4">User ID</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Prev → New</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Reverse</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/10">
                    {transactions.map((tx) => (
                      <tr key={tx.transactionId} className="hover:bg-white/[0.02]">
                        <td className="p-4 font-mono text-[11px] text-purple-300">{tx.transactionId}</td>
                        <td className="p-4 font-mono text-white/80">{tx.userId || tx.hostUserId}</td>
                        <td className="p-4 uppercase text-[10px] font-bold text-white/70">{tx.transactionType}</td>
                        <td className="p-4 font-black">
                          <span className={tx.direction === 'credit' ? 'text-emerald-400' : 'text-pink-400'}>
                            {tx.direction === 'credit' ? '+' : '-'}
                            {(tx.coinAmount ?? tx.pointsAmount ?? 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-white/60">
                          {tx.previousBalance} → {tx.newBalance}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              tx.status === 'completed'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : tx.status === 'failed'
                                ? 'bg-rose-500/15 text-rose-400'
                                : tx.status === 'reversed'
                                ? 'bg-amber-500/15 text-amber-400'
                                : 'bg-sky-500/15 text-sky-400'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {tx.status === 'completed' && tx.transactionType !== 'reversal' && (
                            <button
                              type="button"
                              disabled={!canAdjust}
                              onClick={() => handleReverseTx(tx.transactionId, activeTab)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 font-bold text-[10px] disabled:opacity-30"
                            >
                              <RotateCcw className="w-3 h-3" /> Reverse
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'gifts' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-purple-950/50 text-purple-200 uppercase text-[10px]">
                    <tr>
                      <th className="p-4">Gift Tx ID</th>
                      <th className="p-4">Sender → Host</th>
                      <th className="p-4">Gift &amp; Qty</th>
                      <th className="p-4">Total Coins</th>
                      <th className="p-4">Host Points (70%)</th>
                      <th className="p-4">Platform (30%)</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Reverse</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/10">
                    {giftTransactions.map((g) => (
                      <tr key={g.giftTransactionId} className="hover:bg-white/[0.02]">
                        <td className="p-4 font-mono text-[11px] text-purple-300">{g.giftTransactionId}</td>
                        <td className="p-4">
                          <div className="font-semibold text-white">{g.senderNickname} → {g.recipientNickname}</div>
                          <div className="text-[10px] font-mono text-white/50">
                            {g.pkBattleId ? `PK ${g.pkBattleId.slice(0, 8)} (${g.pkHostSide || ''})` : `Room ${g.liveRoomId || '-'}`}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-pink-200">
                          {g.giftNameSnapshot} <span className="text-pink-400">x{g.quantity}</span>
                        </td>
                        <td className="p-4 font-black text-amber-300">
                          {Number(g.totalCoinAmount || 0).toLocaleString()}
                        </td>
                        <td className="p-4 font-bold text-emerald-300">
                          +{Number(g.hostPointsCredited || 0).toLocaleString()}
                        </td>
                        <td className="p-4 font-bold text-purple-300">
                          {Number(g.platformShare || 0).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              g.status === 'completed'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : g.status === 'failed'
                                ? 'bg-rose-500/15 text-rose-400'
                                : g.status === 'reversed'
                                ? 'bg-amber-500/15 text-amber-400'
                                : 'bg-sky-500/15 text-sky-400'
                            }`}
                          >
                            {g.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {g.status === 'completed' && (
                            <button
                              type="button"
                              disabled={!canAdjust}
                              onClick={() => handleReverseGiftTx(g.giftTransactionId)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 font-bold text-[10px] disabled:opacity-30"
                            >
                              <RotateCcw className="w-3 h-3" /> Reverse
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {giftTransactions.length === 0 && !loading && (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-white/50">
                          No gift transactions match the current filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-purple-950/50 text-purple-200 uppercase text-[10px]">
                    <tr>
                      <th className="p-4">Time</th>
                      <th className="p-4">Actor (Role)</th>
                      <th className="p-4">Action</th>
                      <th className="p-4">Target User</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Mandatory Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/10">
                    {auditLogs.map((log) => (
                      <tr key={log.auditId} className="hover:bg-white/[0.02]">
                        <td className="p-4 text-[10px] text-white/50">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-white font-bold">{log.actorId.slice(0, 12)}</span>{' '}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                            {log.actorRole}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-amber-300 text-[11px]">{log.actionType}</td>
                        <td className="p-4 font-mono text-white/75">{log.targetUserId}</td>
                        <td className="p-4 font-bold">
                          {log.amount} ({log.balanceType})
                        </td>
                        <td className="p-4 text-white/80 max-w-xs">{log.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'earnings' && (
              <div className="p-4 space-y-4" data-testid="admin-host-earnings-tab">
                {!canAdjust ? (
                  <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-400/30 text-xs text-rose-200 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-rose-300 flex-shrink-0" />
                    <span>
                      Forbidden: Only authorized finance administrators (`finance_admin`) can inspect host share &amp; platform share financial reports or export CSV.
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
                        <div className="rounded-2xl bg-[#1b0b38] border border-purple-400/25 p-3">
                          <div className="text-[10px] font-bold uppercase text-purple-200/70">Total Gift Coins</div>
                          <div className="text-lg font-black text-amber-300 tabular-nums">
                            {(earningSummary?.totalCoinsProcessed ?? 0).toLocaleString()}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-[#1b0b38] border border-emerald-400/25 p-3">
                          <div className="text-[10px] font-bold uppercase text-purple-200/70">Host Points (70%)</div>
                          <div className="text-lg font-black text-emerald-300 tabular-nums">
                            {(earningSummary?.totalHostPointsCredited ?? 0).toLocaleString()}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-[#1b0b38] border border-pink-400/25 p-3">
                          <div className="text-[10px] font-bold uppercase text-purple-200/70">Platform Share (30%)</div>
                          <div className="text-lg font-black text-pink-300 tabular-nums">
                            {(earningSummary?.totalPlatformShare ?? 0).toLocaleString()}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-[#1b0b38] border border-purple-400/25 p-3">
                          <div className="text-[10px] font-bold uppercase text-purple-200/70">Credited / Reversed</div>
                          <div className="text-lg font-black text-white tabular-nums">
                            {earningSummary?.creditedCount ?? 0} / {earningSummary?.reversedCount ?? 0}
                          </div>
                        </div>
                      </div>

                      <a
                        href={`/api/admin/finance/earnings/export?search=${encodeURIComponent(searchQuery)}`}
                        data-testid="export-earnings-csv-btn"
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#ff2d78] to-[#a855f7] text-xs font-extrabold text-white inline-flex items-center gap-2 shadow-lg hover:opacity-90"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export CSV Report</span>
                      </a>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-purple-950/50 text-purple-200 uppercase text-[10px]">
                          <tr>
                            <th className="p-3">Earning / Gift Tx</th>
                            <th className="p-3">Host</th>
                            <th className="p-3">Sender</th>
                            <th className="p-3">Gift</th>
                            <th className="p-3">Coins</th>
                            <th className="p-3">Host Pts (70%)</th>
                            <th className="p-3">Platform (30%)</th>
                            <th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-purple-500/10">
                          {earningShares.map((row: any) => (
                            <tr key={row.earningId} className="hover:bg-white/[0.02]">
                              <td className="p-3 font-mono text-[11px] text-white/80">
                                <div>{row.earningId}</div>
                                <div className="text-[10px] text-white/45">{row.giftTransactionId}</div>
                              </td>
                              <td className="p-3">
                                <div className="font-bold text-white">{row.hostNickname}</div>
                                <div className="font-mono text-[10px] text-white/50">{row.hostUserId.slice(0, 12)}</div>
                              </td>
                              <td className="p-3 text-white/80">{row.senderNickname}</td>
                              <td className="p-3 font-bold text-white">
                                {row.giftName} x{row.giftQuantity}
                              </td>
                              <td className="p-3 font-black text-amber-300 tabular-nums">{row.originalCoinAmount}</td>
                              <td className="p-3 font-black text-emerald-300 tabular-nums">+{row.pointsCredited}</td>
                              <td className="p-3 font-bold text-pink-300 tabular-nums">{row.platformShareAmount}</td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    row.status === 'credited'
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : 'bg-rose-500/20 text-rose-300'
                                  }`}
                                >
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {earningShares.length === 0 && !loading && (
                            <tr>
                              <td colSpan={8} className="p-6 text-center text-white/50">
                                No host share records match current filters.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
            {activeTab === 'topup' && (
              <div data-testid="admin-topup-tab" className="p-4 space-y-5">
                {!canAdjust ? (
                  <div className="rounded-2xl bg-rose-950/40 border border-rose-500/30 p-6 text-center text-xs text-rose-200">
                    Authorized Finance Admin role (`finance_admin`) is required to manage Coin Packages, Top-up Orders & Refunds.
                  </div>
                ) : (
                  <>
                    {topupSummary && (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="rounded-2xl bg-[#16082f] border border-purple-500/20 p-3.5">
                          <div className="text-[10px] uppercase font-bold text-purple-300/75">Total Orders</div>
                          <div className="text-xl font-black text-white mt-1 tabular-nums">{topupSummary.totalOrders}</div>
                        </div>
                        <div className="rounded-2xl bg-[#16082f] border border-emerald-500/25 p-3.5">
                          <div className="text-[10px] uppercase font-bold text-emerald-300/80">Verified Revenue</div>
                          <div className="text-xl font-black text-emerald-300 mt-1 tabular-nums">
                            ${Number(topupSummary.successfulRevenueUsd || 0).toFixed(2)}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-[#16082f] border border-amber-500/25 p-3.5">
                          <div className="text-[10px] uppercase font-bold text-amber-300/80">Coins Credited</div>
                          <div className="text-xl font-black text-amber-300 mt-1 tabular-nums">
                            {(topupSummary.totalCoinsCredited || 0).toLocaleString()}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-[#16082f] border border-pink-500/25 p-3.5">
                          <div className="text-[10px] uppercase font-bold text-pink-300/80">Successful / Refunded</div>
                          <div className="text-xl font-black text-pink-300 mt-1 tabular-nums">
                            {topupSummary.successfulOrders} / {topupSummary.refundedOrders}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Coin Packages Management */}
                    <div className="rounded-2xl bg-[#15082c] border border-purple-500/20 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-white">Configured Coin Packages</h3>
                        <span className="text-[11px] text-purple-300/70">Backend Pricing & Bonus Control</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-purple-950/60 text-purple-200 uppercase text-[10px]">
                            <tr>
                              <th className="p-3">Package ID</th>
                              <th className="p-3">Name</th>
                              <th className="p-3">Base</th>
                              <th className="p-3">Bonus</th>
                              <th className="p-3">Total</th>
                              <th className="p-3">Price</th>
                              <th className="p-3">Status</th>
                              <th className="p-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-purple-500/10">
                            {topupPackages.map((p) => (
                              <tr key={p.packageId}>
                                <td className="p-3 font-mono text-purple-200">{p.packageId}</td>
                                <td className="p-3 font-bold text-white">{p.packageName}</td>
                                <td className="p-3 text-white">{p.baseCoins.toLocaleString()}</td>
                                <td className="p-3 text-amber-300">+{p.bonusCoins.toLocaleString()}</td>
                                <td className="p-3 font-bold text-emerald-300">{p.totalCoins.toLocaleString()}</td>
                                <td className="p-3 font-bold text-pink-300">${Number(p.priceAmount).toFixed(2)}</td>
                                <td className="p-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      p.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                                    }`}
                                  >
                                    {p.isActive ? 'active' : 'disabled'}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const res = await fetch('/api/admin/finance/topup/packages', {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ packageId: p.packageId, isActive: !p.isActive }),
                                      });
                                      if (res.ok) await loadTabData();
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white"
                                  >
                                    {p.isActive ? 'Disable' : 'Enable'}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Top-up Orders Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-purple-950/60 text-purple-200 uppercase text-[10px]">
                          <tr>
                            <th className="p-3">Order / Receipt</th>
                            <th className="p-3">User ID</th>
                            <th className="p-3">Package</th>
                            <th className="p-3">Provider</th>
                            <th className="p-3">Coins</th>
                            <th className="p-3">Paid</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Refund</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-purple-500/10">
                          {topupOrders.map((ord) => (
                            <tr key={ord.orderId} className="hover:bg-white/[0.02]">
                              <td className="p-3">
                                <div className="font-mono text-[11px] text-purple-300">{ord.orderId}</div>
                                <div className="font-mono text-[10px] text-white/45">{ord.receiptId || 'No receipt'}</div>
                              </td>
                              <td className="p-3 font-mono text-white/80">{ord.userId}</td>
                              <td className="p-3 font-bold text-white">{ord.packageName}</td>
                              <td className="p-3 text-purple-200">{ord.providerKey}</td>
                              <td className="p-3 font-black text-amber-300">+{ord.totalCoins.toLocaleString()}</td>
                              <td className="p-3 font-bold text-pink-300">${Number(ord.amount).toFixed(2)}</td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    ord.status === 'successful'
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : ord.status === 'refunded'
                                      ? 'bg-cyan-500/20 text-cyan-300'
                                      : 'bg-rose-500/20 text-rose-300'
                                  }`}
                                >
                                  {ord.status}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                {ord.status === 'successful' ? (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const reason = prompt(`Mandatory Audit Reason to refund ${ord.orderId}:`);
                                      if (!reason || reason.trim().length < 5) return;
                                      const res = await fetch('/api/admin/finance/topup/refund', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ orderId: ord.orderId, reason }),
                                      });
                                      const d = await res.json();
                                      setActionMsg({
                                        type: res.ok && d.success ? 'success' : 'error',
                                        text: d.success ? `Refunded ${ord.orderId} cleanly.` : d.error || 'Refund rejected.',
                                      });
                                      await loadTabData();
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 text-rose-300 text-[10px] font-bold"
                                  >
                                    Refund Coins
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-white/30">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Balance Adjustment Modal */}
      {adjustModalUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#160b2e] border border-[#ff2d78]/40 p-6 shadow-2xl">
            <h3 className="text-lg font-black mb-1 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#ff2d78]" /> Audited Wallet Adjustment
            </h3>
            <p className="text-xs text-white/60 mb-4">
              Target User: <strong className="text-white">{adjustModalUser.userId}</strong>
            </p>

            <form onSubmit={handleAdjustSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustBalanceType('coins')}
                  className={`py-2 rounded-xl text-xs font-bold border ${
                    adjustBalanceType === 'coins'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-white/5 border-white/10 text-white/60'
                  }`}
                >
                  Coins ({adjustModalUser.coins})
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustBalanceType('points')}
                  className={`py-2 rounded-xl text-xs font-bold border ${
                    adjustBalanceType === 'points'
                      ? 'bg-pink-500/20 border-pink-400 text-pink-300'
                      : 'bg-white/5 border-white/10 text-white/60'
                  }`}
                >
                  Points ({adjustModalUser.points})
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustOp('credit')}
                  className={`py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 ${
                    adjustOp === 'credit'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : 'bg-white/5 border-white/10 text-white/60'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Credit (+)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustOp('debit')}
                  className={`py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 ${
                    adjustOp === 'debit'
                      ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                      : 'bg-white/5 border-white/10 text-white/60'
                  }`}
                >
                  <MinusCircle className="w-3.5 h-3.5" /> Debit (-)
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-white/70 block mb-1">Amount</label>
                <input
                  type="number"
                  min={1}
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full bg-[#0d0520] border border-purple-500/30 rounded-xl px-3.5 py-2 text-sm text-white"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-white/70 block mb-1">
                  Mandatory Audit Reason
                </label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Specify ticket ID or verified finance adjustment reason..."
                  rows={2}
                  minLength={5}
                  required
                  className="w-full bg-[#0d0520] border border-purple-500/30 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalUser(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#ff2d78] to-[#ec4899] text-xs font-extrabold"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
