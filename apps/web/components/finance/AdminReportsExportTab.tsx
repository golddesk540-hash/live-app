'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Coins,
  Star,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface AdminReportsExportTabProps {
  canManage: boolean;
  onStatusMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void;
}

export function AdminReportsExportTab({ canManage, onStatusMessage }: AdminReportsExportTabProps) {
  const [preset, setPreset] = useState<string>('last_30d');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'payments' | 'host_earnings' | 'refunds' | 'exports'>('payments');

  const [dashboard, setDashboard] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [hostEarnings, setHostEarnings] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [exportJobs, setExportJobs] = useState<any[]>([]);
  const [exportAudits, setExportAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [generating, setGenerating] = useState<string | null>(null);

  const [reportTypeToExport, setReportTypeToExport] = useState<
    'transactions' | 'payments' | 'host_earnings' | 'refunds_reversals' | 'executive_summary'
  >('transactions');

  const buildFilterQs = useCallback(() => {
    const qs = new URLSearchParams({ preset });
    if (fromDate) qs.set('fromDate', fromDate);
    if (toDate) qs.set('toDate', toDate);
    if (statusFilter !== 'all') qs.set('status', statusFilter);
    if (currencyFilter !== 'ALL') qs.set('currency', currencyFilter);
    if (search.trim()) qs.set('search', search.trim());
    return qs.toString();
  }, [preset, fromDate, toDate, statusFilter, currencyFilter, search]);

  const loadReports = useCallback(async () => {
    if (!canManage) return;
    setLoading(true);
    try {
      const qs = buildFilterQs();
      const [dashRes, payRes, hostRes, refRes, expRes] = await Promise.all([
        fetch(`/api/admin/finance/reports/dashboard?${qs}`, { cache: 'no-store' }),
        fetch(`/api/admin/finance/reports/payments?${qs}`, { cache: 'no-store' }),
        fetch(`/api/admin/finance/reports/host-earnings?${qs}`, { cache: 'no-store' }),
        fetch(`/api/admin/finance/reports/refunds?${qs}`, { cache: 'no-store' }),
        fetch('/api/admin/finance/exports?limit=25', { cache: 'no-store' }),
      ]);

      const [dashD, payD, hostD, refD, expD] = await Promise.all([
        dashRes.json(),
        payRes.json(),
        hostRes.json(),
        refRes.json(),
        expRes.json(),
      ]);

      if (dashD.success) setDashboard(dashD);
      if (payD.success) setPayments(payD.payments || []);
      if (hostD.success) setHostEarnings(hostD.hosts || []);
      if (refD.success) setRefunds(refD.records || []);
      if (expD.success) {
        setExportJobs(expD.exports || []);
        setExportAudits(expD.auditLogs || []);
      }
    } catch {
      onStatusMessage({ type: 'error', text: 'Failed to load Finance Reports.' });
    } finally {
      setLoading(false);
    }
  }, [canManage, buildFilterQs, onStatusMessage]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const triggerExport = async (exportFormat: 'csv' | 'xlsx' | 'pdf') => {
    if (!canManage) {
      onStatusMessage({ type: 'error', text: 'Only finance_admin role may generate exports.' });
      return;
    }
    setGenerating(exportFormat);
    onStatusMessage(null);
    try {
      const res = await fetch('/api/admin/finance/exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: reportTypeToExport,
          exportFormat,
          filters: {
            preset,
            fromDate: fromDate || null,
            toDate: toDate || null,
            status: statusFilter,
            currency: currencyFilter,
            search: search.trim() || null,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        onStatusMessage({ type: 'error', text: data.error || 'Export generation failed.' });
      } else {
        onStatusMessage({
          type: 'success',
          text: `${exportFormat.toUpperCase()} generated (${data.exportJob.recordCount} records) — Private expiring link issued!`,
        });
        await loadReports();
      }
    } catch {
      onStatusMessage({ type: 'error', text: 'Network error triggering export.' });
    } finally {
      setGenerating(null);
    }
  };

  if (!canManage) {
    return (
      <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-6 text-center text-xs text-amber-200">
        Access Restricted: Financial reports and accounting exports require an authenticated <strong>finance_admin</strong> or <strong>super_admin</strong> role.
      </div>
    );
  }

  const sel = dashboard?.selected;

  return (
    <div className="space-y-5" data-testid="admin-reports-export-tab">
      {/* Filter & Date Range Bar */}
      <div className="rounded-2xl bg-[#0e0522] border border-purple-500/25 p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="text-[10px] font-bold text-white/55 block mb-1">Period Preset</label>
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
            className="bg-[#180c34] border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-white"
          >
            <option value="today">Daily (Today UTC)</option>
            <option value="yesterday">Yesterday</option>
            <option value="last_7d">Weekly (Last 7 Days)</option>
            <option value="last_30d">Last 30 Days</option>
            <option value="this_month">Monthly (This Month)</option>
            <option value="previous_month">Previous Month</option>
            <option value="all">All Time</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-white/55 block mb-1">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setPreset('custom');
              setFromDate(e.target.value);
            }}
            className="bg-[#180c34] border border-purple-500/30 rounded-xl px-2.5 py-1.5 text-xs text-white"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-white/55 block mb-1">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setPreset('custom');
              setToDate(e.target.value);
            }}
            className="bg-[#180c34] border border-purple-500/30 rounded-xl px-2.5 py-1.5 text-xs text-white"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-white/55 block mb-1">Currency</label>
          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            className="bg-[#180c34] border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-white"
          >
            <option value="ALL">All Currencies</option>
            <option value="USD">USD</option>
            <option value="PKR">PKR</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-white/55 block mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#180c34] border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-white"
          >
            <option value="all">All</option>
            <option value="successful">Successful</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
            <option value="reversed">Reversed</option>
          </select>
        </div>

        <div className="flex-1 min-w-[160px]">
          <label className="text-[10px] font-bold text-white/55 block mb-1">Search User / Tx ID</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="User ID, Order ID, Host..."
            className="w-full bg-[#180c34] border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-white"
          />
        </div>

        <button
          type="button"
          onClick={loadReports}
          className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold inline-flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Separated Finance KPIs */}
      {sel && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="rounded-2xl bg-[#180c34] border border-emerald-500/30 p-3.5">
            <div className="text-[10px] font-bold text-emerald-300 uppercase flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Verified Cash Revenue</span>
            </div>
            <div className="mt-1 space-y-0.5">
              {sel.verifiedTopupRevenueByCurrency?.length ? (
                sel.verifiedTopupRevenueByCurrency.map((c: any) => (
                  <div key={c.currency} className="text-sm font-black text-white">
                    {c.currency} {Number(c.combinedVerifiedCashTotal).toFixed(2)}
                  </div>
                ))
              ) : (
                <div className="text-sm font-black text-white/50">0.00</div>
              )}
            </div>
            <div className="text-[10px] text-white/50 mt-1">Top-up + VIP cash kept separate by currency</div>
          </div>

          <div className="rounded-2xl bg-[#180c34] border border-amber-500/30 p-3.5">
            <div className="text-[10px] font-bold text-amber-300 uppercase flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" />
              <span>Top-up Coins Credited</span>
            </div>
            <div className="text-lg font-black text-white mt-1">
              {Number(sel.totalCoinsCredited || 0).toLocaleString()} Coins
            </div>
            <div className="text-[10px] text-white/50 mt-1">
              {sel.verifiedTopupCount} orders • Gift Vol: {Number(sel.totalGiftCoinTransactionsVolume || 0).toLocaleString()}
            </div>
          </div>

          <div className="rounded-2xl bg-[#180c34] border border-pink-500/30 p-3.5">
            <div className="text-[10px] font-bold text-pink-300 uppercase flex items-center gap-1">
              <Star className="w-3.5 h-3.5" />
              <span>Host Points (70% Non-Cash)</span>
            </div>
            <div className="text-lg font-black text-white mt-1">
              {Number(sel.totalHostPointsCredited || 0).toLocaleString()} Pts
            </div>
            <div className="text-[10px] text-white/50 mt-1">
              Platform Share (30%): {Number(sel.totalPlatformShareCoins || 0).toLocaleString()} Coins
            </div>
          </div>

          <div className="rounded-2xl bg-[#180c34] border border-purple-500/30 p-3.5">
            <div className="text-[10px] font-bold text-purple-300 uppercase">VIP & Store Activity</div>
            <div className="text-sm font-black text-white mt-1">
              VIP: {sel.vipPurchasesCount} | Store: {sel.storePurchasesCount}
            </div>
            <div className="text-[10px] text-white/50 mt-1">
              Store Spend: {Number(sel.totalStoreCoinsSpent || 0).toLocaleString()} Coins
            </div>
          </div>

          <div className="rounded-2xl bg-[#180c34] border border-rose-500/30 p-3.5">
            <div className="text-[10px] font-bold text-rose-300 uppercase flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Exceptions & Refunds</span>
            </div>
            <div className="text-sm font-black text-white mt-1">
              Refunds: {sel.totalRefundsCount} | Rev: {sel.totalReversalsCount}
            </div>
            <div className="text-[10px] text-white/50 mt-1">
              Pending: {sel.pendingPaymentsCount} | Failed: {sel.failedPaymentsCount}
            </div>
          </div>
        </div>
      )}

      {/* Accounting Export Generator Box */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1b0d38] to-[#130829] border border-[#ff2d78]/35 p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#ff2d78]" />
            <span>Generate Private Financial Export (CSV / Excel .xlsx / PDF)</span>
          </h3>
          <p className="text-[11px] text-white/60 mt-0.5">
            Files are written to private storage outside the public web root with SHA-256 checksum & 15-minute expiring signed URLs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={reportTypeToExport}
            onChange={(e) => setReportTypeToExport(e.target.value as any)}
            className="bg-[#0e0522] border border-purple-500/30 rounded-xl px-3 py-2 text-xs font-bold text-white"
          >
            <option value="transactions">Complete Transactions Report</option>
            <option value="payments">Payment & Top-up Report</option>
            <option value="host_earnings">Host Earnings (70/30) Report</option>
            <option value="refunds_reversals">Refunds & Reversals Report</option>
            <option value="executive_summary">Multi-Sheet Executive Workbook</option>
          </select>

          <button
            type="button"
            disabled={Boolean(generating)}
            onClick={() => triggerExport('csv')}
            data-testid="btn-export-csv"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-xs font-extrabold text-emerald-200"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{generating === 'csv' ? 'Exporting...' : 'Export CSV'}</span>
          </button>

          <button
            type="button"
            disabled={Boolean(generating)}
            onClick={() => triggerExport('xlsx')}
            data-testid="btn-export-xlsx"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-xs font-extrabold text-amber-200"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{generating === 'xlsx' ? 'Building XLSX...' : 'Export Excel (.xlsx)'}</span>
          </button>

          <button
            type="button"
            disabled={Boolean(generating)}
            onClick={() => triggerExport('pdf')}
            data-testid="btn-export-pdf"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#ff2d78] to-[#ec4899] text-xs font-extrabold text-white shadow-lg"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{generating === 'pdf' ? 'Rendering PDF...' : 'Export PDF'}</span>
          </button>
        </div>
      </div>

      {/* Report Sub-tabs */}
      <div className="flex flex-wrap gap-1.5 bg-[#0e0522] p-1.5 rounded-2xl border border-purple-500/20">
        {(
          [
            { id: 'payments', label: `Payments (${payments.length})` },
            { id: 'host_earnings', label: `Host Earnings 70/30 (${hostEarnings.length})` },
            { id: 'refunds', label: `Refunds & Reversals (${refunds.length})` },
            { id: 'exports', label: `Export Files & Audits (${exportJobs.length})` },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveSubTab(t.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
              activeSubTab === t.id ? 'bg-[#ff2d78] text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Report Tables */}
      {activeSubTab === 'payments' && (
        <div className="overflow-x-auto rounded-2xl border border-purple-500/20">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-white/60 uppercase text-[10px]">
              <tr>
                <th className="p-3">Order ID</th>
                <th className="p-3">User</th>
                <th className="p-3">Type</th>
                <th className="p-3">Cash Amount</th>
                <th className="p-3">Coins (+Bonus)</th>
                <th className="p-3">Method / Masked Ref</th>
                <th className="p-3">Status</th>
                <th className="p-3">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payments.map((p) => (
                <tr key={p.orderId} className="hover:bg-white/[0.02]">
                  <td className="p-3 font-mono text-[11px]">{p.orderId}</td>
                  <td className="p-3">{p.userNickname || p.userId}</td>
                  <td className="p-3 font-bold uppercase text-[10px]">{p.txCategory}</td>
                  <td className="p-3 font-bold">
                    {p.paymentAmount > 0 ? `${p.currency} ${Number(p.paymentAmount).toFixed(2)}` : '—'}
                  </td>
                  <td className="p-3 text-amber-300 font-bold">
                    {p.coinQuantity.toLocaleString()} {p.bonusCoinQuantity > 0 ? `(+${p.bonusCoinQuantity})` : ''}
                  </td>
                  <td className="p-3 text-white/70">
                    {p.paymentMethod} {p.providerReferenceMasked ? `• ${p.providerReferenceMasked}` : ''}
                  </td>
                  <td className="p-3 font-extrabold uppercase text-[10px]">{p.status}</td>
                  <td className="p-3 font-mono text-[11px] text-amber-300">{p.receiptNumber || 'NOT_ISSUED'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeSubTab === 'host_earnings' && (
        <div className="overflow-x-auto rounded-2xl border border-purple-500/20">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-white/60 uppercase text-[10px]">
              <tr>
                <th className="p-3">Host</th>
                <th className="p-3">Gift Coins Vol</th>
                <th className="p-3">Gross Host Pts (70%)</th>
                <th className="p-3">Reversed Pts</th>
                <th className="p-3">Net Host Points</th>
                <th className="p-3">Platform Share (30%)</th>
                <th className="p-3">Shares</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {hostEarnings.map((h) => (
                <tr key={h.hostUserId} className="hover:bg-white/[0.02]">
                  <td className="p-3 font-bold">
                    {h.hostNickname} <span className="text-white/45 font-mono text-[10px]">({h.hostUserId.slice(0, 12)})</span>
                  </td>
                  <td className="p-3 text-amber-200">{h.grossGiftCoinsReceived.toLocaleString()} Coins</td>
                  <td className="p-3 text-emerald-300 font-bold">{h.grossHostPointsCredited.toLocaleString()} Pts</td>
                  <td className="p-3 text-rose-300">{h.reversedHostPoints.toLocaleString()} Pts</td>
                  <td className="p-3 text-yellow-300 font-black">{h.netHostPoints.toLocaleString()} Pts</td>
                  <td className="p-3 text-purple-300">{h.platformShareCoins.toLocaleString()} Coins</td>
                  <td className="p-3">{h.totalSharesCount} ({h.reversedCount} rev)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeSubTab === 'refunds' && (
        <div className="overflow-x-auto rounded-2xl border border-purple-500/20">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-white/60 uppercase text-[10px]">
              <tr>
                <th className="p-3">Record ID</th>
                <th className="p-3">Category</th>
                <th className="p-3">User</th>
                <th className="p-3">Coins / Cash / Points</th>
                <th className="p-3">Status</th>
                <th className="p-3">Reason / Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {refunds.map((r) => (
                <tr key={`${r.sourceTable}:${r.recordId}`} className="hover:bg-white/[0.02]">
                  <td className="p-3 font-mono text-[11px]">{r.recordId}</td>
                  <td className="p-3 font-bold uppercase text-[10px]">{r.txCategory}</td>
                  <td className="p-3">{r.userNickname || r.userId}</td>
                  <td className="p-3">
                    {r.paymentAmount > 0 ? `${r.currency} ${Number(r.paymentAmount).toFixed(2)} • ` : ''}
                    {r.coinQuantity > 0 ? `${r.coinQuantity} Coins ` : ''}
                    {r.pointsQuantity > 0 ? `${r.pointsQuantity} Pts` : ''}
                  </td>
                  <td className="p-3 text-amber-300 font-bold uppercase text-[10px]">{r.status}</td>
                  <td className="p-3 text-white/75">{r.reasonOrDescription}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeSubTab === 'exports' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-purple-500/20">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-white/60 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Export ID</th>
                  <th className="p-3">Report / Format</th>
                  <th className="p-3">Records & Size</th>
                  <th className="p-3">SHA-256</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Secure Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {exportJobs.map((j) => (
                  <tr key={j.exportId} className="hover:bg-white/[0.02]">
                    <td className="p-3 font-mono text-[11px]">{j.exportId}</td>
                    <td className="p-3 font-bold">
                      {j.reportType} ({String(j.exportFormat).toUpperCase()})
                    </td>
                    <td className="p-3">
                      {j.recordCount} rows • {Math.max(1, Math.round((j.fileSizeBytes || 0) / 1024))} KB
                    </td>
                    <td className="p-3 font-mono text-[10px] text-white/55">
                      {String(j.sha256Checksum || '').slice(0, 14)}...
                    </td>
                    <td className="p-3 font-bold uppercase text-[10px]">{j.status}</td>
                    <td className="p-3">
                      {j.downloadUrl ? (
                        <a
                          href={j.downloadUrl}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#ff2d78]/20 hover:bg-[#ff2d78]/35 text-[#ff9ec1] font-bold"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </a>
                      ) : (
                        <span className="text-white/35 text-[10px]">Expired</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl bg-[#0e0522] border border-purple-500/20 p-3">
            <h4 className="text-xs font-extrabold text-white/80 mb-2 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
              <span>Export Security Audit Logs</span>
            </h4>
            <div className="space-y-1.5 max-h-56 overflow-y-auto text-[11px]">
              {exportAudits.map((a) => (
                <div key={a.auditId} className="flex flex-wrap items-center justify-between gap-2 py-1.5 border-b border-white/5">
                  <div>
                    <span className="font-bold text-pink-300">{a.actionType}</span>{' '}
                    <span className="text-white/75">— {a.details}</span>
                  </div>
                  <div className="text-white/45 font-mono text-[10px]">
                    {a.actorRole} • {new Date(a.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
