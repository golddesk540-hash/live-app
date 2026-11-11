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
  const [activeTab, setActiveTab] = useState<'wallets' | 'coins' | 'points' | 'audit'>('wallets');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [wallets, setWallets] = useState<WalletBalance[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
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
