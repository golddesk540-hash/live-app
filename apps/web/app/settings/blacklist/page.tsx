'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/languageContext';
import {
  ArrowLeft,
  Search,
  Slash,
  ShieldCheck,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
  Check,
} from 'lucide-react';

interface BlockedUserItem {
  id: string;
  poppoId: string;
  nickname: string;
  avatarUrl: string;
  country: string;
  countryCode: string;
  blockedAt: string;
}

function BlacklistContent() {
  const router = useRouter();
  const { lang, isUr } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Unblock confirmation modal state
  const [unblockTarget, setUnblockTarget] = useState<BlockedUserItem | null>(null);
  const [isUnblocking, setIsUnblocking] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchBlacklist = async (pageNum = 1, search = '') => {
    try {
      setLoading(true);
      const q = new URLSearchParams({
        page: String(pageNum),
        limit: '15',
      });
      if (search) q.set('search', search);

      const res = await fetch(`/api/users/me/blacklist?${q.toString()}`);
      if (res.status === 401) {
        router.push('/login?redirect=/settings/blacklist');
        return;
      }

      const data = await res.json();
      setBlockedUsers(data.blockedUsers || []);
      setTotalCount(data.totalCount || 0);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Error fetching blacklist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlacklist(1, searchQuery);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBlacklist(1, searchQuery);
  };

  const handleConfirmUnblock = async () => {
    if (!unblockTarget) return;

    try {
      setIsUnblocking(true);
      const res = await fetch(`/api/users/me/blacklist/${unblockTarget.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        setToastMessage(data.error || 'Failed to unblock user.');
        return;
      }

      setToastMessage(isUr ? `${unblockTarget.nickname} کو ان بلاک کر دیا گیا۔` : `${unblockTarget.nickname} has been unblocked.`);
      setUnblockTarget(null);
      // Refresh list
      fetchBlacklist(page, searchQuery);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      setToastMessage('Error unblocking user.');
    } finally {
      setIsUnblocking(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#070514] text-white flex justify-center py-0 sm:py-8 px-0 sm:px-4">
      <div className="w-full sm:max-w-md bg-gradient-to-b from-[#180E35] via-[#0E0922] to-[#070514] sm:rounded-[40px] sm:border-[8px] sm:border-[#22173F] sm:shadow-[0_0_80px_rgba(168,85,247,0.25)] flex flex-col min-h-screen sm:min-h-[860px] overflow-hidden relative">

        {/* Toast */}
        {toastMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#FF2E74] text-white text-xs font-bold shadow-lg shadow-[#FF2E74]/40 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Check className="w-3.5 h-3.5" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="pt-4 px-5 pb-3 flex items-center justify-between border-b border-white/10 z-10 bg-black/20">
          <Link
            href="/settings"
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="text-center">
            <h1 className="text-sm font-bold text-white">
              {isUr ? 'بلیک لسٹ' : 'Blacklist'}
            </h1>
            <p className="text-[10px] text-white/50">
              {totalCount} {isUr ? 'بلاک شدہ صارفین' : 'Blocked users'}
            </p>
          </div>

          <div className="w-9" />
        </div>

        {/* Search Bar */}
        <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02]">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isUr ? 'نام یا یوزر آئی ڈی سے تلاش کریں...' : 'Search by nickname or User ID...'}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF2E74] transition-colors"
            />
          </form>
        </div>

        {/* Content List */}
        <div className="flex-1 px-5 py-3 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-[#FF2E74]" />
              <p className="text-xs text-white/50">{isUr ? 'بلیک لسٹ لوڈ ہو رہی ہے...' : 'Loading blacklist...'}</p>
            </div>
          ) : blockedUsers.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-white/5 mx-auto flex items-center justify-center text-white/30">
                <Slash className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-white/70">
                {searchQuery
                  ? (isUr ? 'کوئی بلاک شدہ صارف نہیں ملا' : 'No blocked users match your search')
                  : (isUr ? 'بلیک لسٹ خالی ہے' : 'Your blacklist is empty')}
              </p>
              <p className="text-[11px] text-white/40 max-w-xs mx-auto">
                {isUr
                  ? 'جب آپ کسی صارف کو بلاک کریں گے، وہ یہاں نظر آئیں گے۔'
                  : 'Users you block will be listed here. You can unblock them at any time.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {blockedUsers.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative w-11 h-11 rounded-full overflow-hidden border border-white/10 shrink-0 bg-[#160E30]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.avatarUrl || '/avatars/default.png'}
                        alt={item.nickname}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-white truncate block max-w-[140px]">
                        {item.nickname}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-white/50">
                        <span className="font-mono">ID: {item.poppoId}</span>
                        <span>•</span>
                        <span>{item.country}</span>
                      </div>
                      <span className="text-[9px] text-white/40 block mt-0.5">
                        {isUr ? 'بلاک کیا گیا:' : 'Blocked:'} {new Date(item.blockedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setUnblockTarget(item)}
                    className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white text-xs font-bold border border-white/10 transition-colors"
                  >
                    {isUr ? 'ان بلاک' : 'Unblock'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-white/10 bg-black/20 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => fetchBlacklist(page - 1, searchQuery)}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors disabled:opacity-30 flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>{isUr ? 'پچھلا' : 'Previous'}</span>
            </button>

            <span className="text-[11px] text-white/50 font-mono">
              {page} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => fetchBlacklist(page + 1, searchQuery)}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors disabled:opacity-30 flex items-center gap-1"
            >
              <span>{isUr ? 'اگلا' : 'Next'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>

      {/* UNBLOCK CONFIRMATION MODAL */}
      {unblockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#181135] border border-white/15 p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 mx-auto mb-3 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              {isUr ? `${unblockTarget.nickname} کو ان بلاک کریں؟` : `Unblock ${unblockTarget.nickname}?`}
            </h3>
            <p className="text-xs text-white/60 mb-5 leading-relaxed">
              {isUr
                ? 'ان بلاک کرنے کے بعد یہ صارف آپ کے عوامی لائیو سٹریمز اور رومز دیکھ سکے گا۔ پرانے فالو تعلقات خودکار طور پر بحال نہیں ہوں گے۔'
                : 'After unblocking, this user will be able to view your public profile and streams. Note that previous follow relationships are not automatically restored.'}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setUnblockTarget(null)}
                className="w-1/2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors"
              >
                {isUr ? 'منسوخ' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmUnblock}
                disabled={isUnblocking}
                className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isUnblocking ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>{isUr ? 'ان بلاک کریں' : 'Confirm Unblock'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

export default function BlacklistPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070514] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF2E74]" />
        </div>
      }
    >
      <BlacklistContent />
    </Suspense>
  );
}
