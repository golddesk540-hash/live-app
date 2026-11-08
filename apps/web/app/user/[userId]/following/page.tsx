'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/languageContext';
import {
  ArrowLeft,
  Search,
  Users,
  UserCheck,
  UserPlus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';

interface FollowingItem {
  id: string;
  poppoId: string;
  nickname: string;
  avatarUrl: string;
  country: string;
  countryCode: string;
  bio: string;
  hostLevel: number;
  wealthLevel: number;
  isAdultVerified: boolean;
  followedAt: string;
  isFollowing: boolean;
  isSelf: boolean;
}

function FollowingListContent() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const { lang, isUr } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [targetUser, setTargetUser] = useState<{ id: string; poppoId: string; nickname: string } | null>(null);
  const [following, setFollowing] = useState<FollowingItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [followActionLoading, setFollowActionLoading] = useState<{ [id: string]: boolean }>({});

  const fetchFollowing = async (pageNum = 1, search = '') => {
    try {
      setLoading(true);
      const q = new URLSearchParams({
        page: String(pageNum),
        limit: '15',
      });
      if (search) q.set('search', search);

      const res = await fetch(`/api/users/${encodeURIComponent(userId)}/following?${q.toString()}`);
      if (!res.ok) {
        if (res.status === 404) {
          router.push('/');
          return;
        }
        return;
      }

      const data = await res.json();
      setTargetUser(data.targetUser);
      setFollowing(data.following || []);
      setTotalCount(data.totalCount || 0);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Error fetching following:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchFollowing(1, searchQuery);
    }
  }, [userId]);

  // Handle follow/unfollow toggle
  const handleFollowToggle = async (item: FollowingItem) => {
    if (item.isSelf) return;

    try {
      setFollowActionLoading((prev) => ({ ...prev, [item.id]: true }));
      const method = item.isFollowing ? 'DELETE' : 'POST';
      const res = await fetch(`/api/users/${encodeURIComponent(item.id)}/follow`, { method });

      if (res.status === 401) {
        router.push(`/login?redirect=/user/${userId}/following`);
        return;
      }

      const data = await res.json();
      if (res.ok) {
        setFollowing((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, isFollowing: data.isFollowing } : f))
        );
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    } finally {
      setFollowActionLoading((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFollowing(1, searchQuery);
  };

  return (
    <main className="min-h-screen bg-[#070514] text-white flex justify-center py-0 sm:py-8 px-0 sm:px-4">
      <div className="w-full sm:max-w-md bg-gradient-to-b from-[#180E35] via-[#0E0922] to-[#070514] sm:rounded-[40px] sm:border-[8px] sm:border-[#22173F] sm:shadow-[0_0_80px_rgba(168,85,247,0.25)] flex flex-col min-h-screen sm:min-h-[860px] overflow-hidden relative">

        {/* Top Header */}
        <div className="pt-4 px-5 pb-3 flex items-center justify-between border-b border-white/10 z-10 bg-black/20">
          <Link
            href={`/user/${userId}`}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="text-center">
            <h1 className="text-sm font-bold text-white">
              {isUr ? 'فالوئنگ' : 'Following'}
            </h1>
            <p className="text-[10px] text-white/50">
              {targetUser?.nickname ? `${targetUser.nickname} • ${totalCount}` : totalCount}
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
              <p className="text-xs text-white/50">{isUr ? 'لوڈ ہو رہا ہے...' : 'Loading following...'}</p>
            </div>
          ) : following.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-white/5 mx-auto flex items-center justify-center text-white/30">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-white/70">
                {searchQuery
                  ? (isUr ? 'کوئی صارف نہیں ملا' : 'No followed streamers found matching search')
                  : (isUr ? 'کسی صارف کو فالو نہیں کیا گیا' : 'Not following anyone yet')}
              </p>
              <p className="text-[11px] text-white/40 max-w-xs mx-auto">
                {isUr
                  ? 'جب یہ صارف دوسرے سٹریمرز کو فالو کریں گے، وہ یہاں دکھائی دیں گے۔'
                  : 'Streamers followed by this user will be listed here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {following.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 flex items-center justify-between gap-3 transition-colors"
                >
                  <Link
                    href={`/user/${item.poppoId}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <div className="relative w-11 h-11 rounded-full overflow-hidden border border-[#FF2E74]/40 shrink-0 bg-[#160E30]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.avatarUrl || '/avatars/default.png'}
                        alt={item.nickname}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate max-w-[130px]">
                          {item.nickname}
                        </span>
                        {item.hostLevel > 1 && (
                          <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                            Lv.{item.hostLevel}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-white/50">
                        <span className="font-mono">ID: {item.poppoId}</span>
                        <span>•</span>
                        <span>{item.country}</span>
                      </div>
                    </div>
                  </Link>

                  {/* Follow / Following Action Button */}
                  <div>
                    {item.isSelf ? (
                      <span className="px-3 py-1.5 rounded-xl bg-white/5 text-[10px] font-bold text-white/40">
                        You
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleFollowToggle(item)}
                        disabled={followActionLoading[item.id]}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 disabled:opacity-50 ${
                          item.isFollowing
                            ? 'bg-white/10 text-white/80 hover:bg-white/15 border border-white/10'
                            : 'bg-gradient-to-r from-[#FF2E74] to-[#A855F7] text-white shadow-sm hover:brightness-110'
                        }`}
                      >
                        {followActionLoading[item.id] ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : item.isFollowing ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>{isUr ? 'فالو کیا' : 'Following'}</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3 h-3" />
                            <span>{isUr ? 'فالو' : 'Follow'}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
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
              onClick={() => fetchFollowing(page - 1, searchQuery)}
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
              onClick={() => fetchFollowing(page + 1, searchQuery)}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors disabled:opacity-30 flex items-center gap-1"
            >
              <span>{isUr ? 'اگلا' : 'Next'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>
    </main>
  );
}

export default function FollowingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070514] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF2E74]" />
        </div>
      }
    >
      <FollowingListContent />
    </Suspense>
  );
}
