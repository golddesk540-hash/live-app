'use client';

import React, { useMemo, useState } from 'react';
import { UserHostEmptyStates } from './UserHostEmptyStates';
import { AccountStatus, UserProfileRecord } from './userHostTypes';

interface AllUsersViewProps {
  users: UserProfileRecord[];
  onViewUserDetails: (user: UserProfileRecord) => void;
  onChangeStatusClick: (user: UserProfileRecord) => void;
  onEditProfileClick: (user: UserProfileRecord) => void;
  onBulkChangeStatus: (userIds: string[], nextStatus: AccountStatus) => void;
  initialStatusFilter?: string;
}

export const AllUsersView: React.FC<AllUsersViewProps> = ({
  users,
  onViewUserDetails,
  onChangeStatusClick,
  onEditProfileClick,
  onBulkChangeStatus,
  initialStatusFilter = 'All',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatusFilter);
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [selectedVerification, setSelectedVerification] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'reg_desc' | 'reg_asc' | 'user_asc' | 'wealth_desc'>('reg_desc');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  // Extract distinct countries
  const countries = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => set.add(u.country));
    return Array.from(set).sort();
  }, [users]);

  // Filter & sort logic
  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const inUser = u.username.toLowerCase().includes(q);
          const inId = u.id.toLowerCase().includes(q);
          const inEmail = u.email.toLowerCase().includes(q);
          const inNick = u.nickname.toLowerCase().includes(q);
          if (!inUser && !inId && !inEmail && !inNick) return false;
        }

        if (selectedStatus !== 'All' && u.status !== selectedStatus) return false;
        if (selectedCountry !== 'All' && u.country !== selectedCountry) return false;
        if (selectedVerification !== 'All' && u.verificationStatus !== selectedVerification) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'reg_desc') return b.registrationDate.localeCompare(a.registrationDate);
        if (sortBy === 'reg_asc') return a.registrationDate.localeCompare(b.registrationDate);
        if (sortBy === 'user_asc') return a.username.localeCompare(b.username);
        if (sortBy === 'wealth_desc') return b.wealthLevel - a.wealthLevel;
        return 0;
      });
  }, [users, searchQuery, selectedStatus, selectedCountry, selectedVerification, sortBy]);

  // Pagination slice
  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage]);

  // Bulk selection helpers
  const isAllVisibleSelected =
    paginatedUsers.length > 0 && paginatedUsers.every((u) => selectedUserIds.includes(u.id));

  const handleToggleSelectAllVisible = () => {
    if (isAllVisibleSelected) {
      setSelectedUserIds((prev) => prev.filter((id) => !paginatedUsers.some((u) => u.id === id)));
    } else {
      const toAdd = paginatedUsers.map((u) => u.id).filter((id) => !selectedUserIds.includes(id));
      setSelectedUserIds((prev) => [...prev, ...toAdd]);
    }
  };

  const handleToggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('All');
    setSelectedCountry('All');
    setSelectedVerification('All');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-5" id="all-users-view">
      {/* Search & Filter Toolbar */}
      <div className="p-4 md:p-5 rounded-3xl bg-[#160A2D]/80 border border-purple-500/20 backdrop-blur-md shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-5 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by username, user ID (U10...), email..."
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#0E061E] border border-purple-500/25 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="lg:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-2xl bg-[#0E061E] border border-purple-500/25 text-zinc-200 text-xs focus:outline-none focus:border-pink-500"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          {/* Country Dropdown */}
          <div className="lg:col-span-2">
            <select
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-2xl bg-[#0E061E] border border-purple-500/25 text-zinc-200 text-xs focus:outline-none focus:border-pink-500"
            >
              <option value="All">All Countries ({countries.length})</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="lg:col-span-3">
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl bg-[#0E061E] border border-purple-500/25 text-zinc-200 text-xs focus:outline-none focus:border-pink-500"
            >
              <option value="reg_desc">Newest Registered</option>
              <option value="reg_asc">Oldest Registered</option>
              <option value="user_asc">Username (A - Z)</option>
              <option value="wealth_desc">Highest Wealth Level</option>
            </select>
          </div>
        </div>

        {/* Verification Status Pills & Counts */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-purple-500/15">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400 font-medium mr-1">Verification:</span>
            {['All', 'Verified', 'Pending', 'Unverified'].map((v) => (
              <button
                key={v}
                onClick={() => {
                  setSelectedVerification(v);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                  selectedVerification === v
                    ? 'bg-pink-500 text-white border-pink-400 shadow-[0_0_10px_rgba(255,15,123,0.3)]'
                    : 'bg-[#0E061E]/80 text-zinc-400 border-purple-500/20 hover:border-purple-400 hover:text-white'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <div className="text-xs text-zinc-400">
            Showing <strong className="text-pink-400">{filteredUsers.length}</strong> of{' '}
            {users.length} users
            {(searchQuery || selectedStatus !== 'All' || selectedCountry !== 'All' || selectedVerification !== 'All') && (
              <button
                onClick={handleResetFilters}
                className="ml-3 text-pink-400 hover:text-pink-300 underline font-semibold"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar (Appears when records are selected) */}
      {selectedUserIds.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/90 to-[#160A2D] border border-pink-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
            <span className="text-xs font-bold text-white">
              {selectedUserIds.length} {selectedUserIds.length === 1 ? 'user' : 'users'} selected
            </span>
            <button
              onClick={() => setSelectedUserIds([])}
              className="text-xs text-zinc-400 hover:text-white underline"
            >
              Clear selection
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Bulk demo action:</span>
            <button
              onClick={() => onBulkChangeStatus(selectedUserIds, 'Active')}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-semibold border border-emerald-500/30 transition-colors"
            >
              Set Active
            </button>
            <button
              onClick={() => onBulkChangeStatus(selectedUserIds, 'Suspended')}
              className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-semibold border border-rose-500/30 transition-colors"
            >
              Set Suspended
            </button>
            <button
              onClick={() => onBulkChangeStatus(selectedUserIds, 'Inactive')}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-semibold border border-zinc-700 transition-colors"
            >
              Set Inactive
            </button>
          </div>
        </div>
      )}

      {/* User Records Table / Card List */}
      {filteredUsers.length === 0 ? (
        <UserHostEmptyStates
          kind={searchQuery ? 'no_search_results' : 'no_users'}
          onReset={handleResetFilters}
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-hidden rounded-3xl bg-[#160A2D]/80 border border-purple-500/20 shadow-2xl backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-[#0E061E]/80 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-purple-500/20">
                  <tr>
                    <th scope="col" className="p-4 w-10">
                      <input
                        type="checkbox"
                        checked={isAllVisibleSelected}
                        onChange={handleToggleSelectAllVisible}
                        className="w-4 h-4 rounded text-pink-500 bg-[#0E061E] border-purple-500/40 focus:ring-pink-500"
                      />
                    </th>
                    <th scope="col" className="px-4 py-4">
                      User Profile
                    </th>
                    <th scope="col" className="px-4 py-4">
                      User ID
                    </th>
                    <th scope="col" className="px-4 py-4">
                      Country
                    </th>
                    <th scope="col" className="px-4 py-4">
                      Registered
                    </th>
                    <th scope="col" className="px-4 py-4">
                      Verification
                    </th>
                    <th scope="col" className="px-4 py-4">
                      Status
                    </th>
                    <th scope="col" className="px-5 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/10">
                  {paginatedUsers.map((user) => {
                    const isSelected = selectedUserIds.includes(user.id);

                    return (
                      <tr
                        key={user.id}
                        className={`hover:bg-purple-900/15 transition-colors ${
                          isSelected ? 'bg-purple-950/30' : ''
                        }`}
                      >
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectUser(user.id)}
                            className="w-4 h-4 rounded text-pink-500 bg-[#0E061E] border-purple-500/40 focus:ring-pink-500"
                          />
                        </td>

                        {/* Profile Info */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={user.avatar}
                              alt={user.username}
                              className="w-10 h-10 rounded-2xl object-cover border border-purple-500/40 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white text-xs truncate max-w-[140px]">
                                  {user.username}
                                </span>
                                {user.isHost && (
                                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30 font-bold">
                                    HOST
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-zinc-400 truncate max-w-[160px]">
                                {user.email}
                              </div>
                              <div className="text-[10px] text-pink-400/80 font-mono">
                                Wealth Lv.{user.wealthLevel}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* ID */}
                        <td className="px-4 py-3.5 font-mono text-zinc-300 font-semibold">
                          {user.id}
                        </td>

                        {/* Country */}
                        <td className="px-4 py-3.5 text-zinc-300">
                          <div>{user.country}</div>
                          <div className="text-[10px] text-zinc-500 font-mono">{user.countryCode}</div>
                        </td>

                        {/* Registered Date */}
                        <td className="px-4 py-3.5 text-zinc-400">
                          <div>{user.registrationDate}</div>
                          <div className="text-[10px] text-zinc-500">Active {user.lastActive}</div>
                        </td>

                        {/* Verification */}
                        <td className="px-4 py-3.5">
                          {user.verificationStatus === 'Verified' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                              <span className="w-1 h-1 rounded-full bg-emerald-400" />
                              Verified
                            </span>
                          ) : user.verificationStatus === 'Pending' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-semibold">
                              <span className="w-1 h-1 rounded-full bg-amber-400" />
                              Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px]">
                              Unverified
                            </span>
                          )}
                        </td>

                        {/* Account Status Badge */}
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
                              user.status === 'Active'
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : user.status === 'Suspended'
                                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                : user.status === 'Pending'
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                user.status === 'Active'
                                  ? 'bg-emerald-400 shadow-[0_0_6px_#34D399]'
                                  : user.status === 'Suspended'
                                  ? 'bg-rose-400 shadow-[0_0_6px_#F43F5E]'
                                  : 'bg-amber-400'
                              }`}
                            />
                            {user.status}
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onViewUserDetails(user)}
                              className="px-2.5 py-1 rounded-xl bg-purple-500/15 hover:bg-purple-500/30 text-purple-300 text-xs font-semibold border border-purple-500/25 transition-colors"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => onChangeStatusClick(user)}
                              className="px-2.5 py-1 rounded-xl bg-[#0E061E] hover:bg-purple-900/40 text-pink-300 text-xs font-semibold border border-purple-500/20 transition-colors"
                            >
                              Status
                            </button>
                            <button
                              onClick={() => onEditProfileClick(user)}
                              className="p-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                              title="Edit Demo Profile"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List View (Tablets & Phones) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-3.5">
            {paginatedUsers.map((user) => {
              const isSelected = selectedUserIds.includes(user.id);

              return (
                <div
                  key={user.id}
                  className={`p-4 rounded-3xl bg-[#160A2D]/85 border border-purple-500/20 backdrop-blur-md shadow-lg space-y-3 ${
                    isSelected ? 'border-pink-500/50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectUser(user.id)}
                        className="w-4 h-4 rounded text-pink-500 bg-[#0E061E] border-purple-500/40 focus:ring-pink-500"
                      />
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-12 h-12 rounded-2xl object-cover border border-purple-500/40 flex-shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-sm">{user.username}</span>
                          {user.isHost && (
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-pink-500/20 text-pink-300 font-bold">
                              HOST
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-mono text-zinc-400 mt-0.5">ID: {user.id}</div>
                        <div className="text-[11px] text-zinc-500 truncate max-w-[180px]">
                          {user.email}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border ${
                        user.status === 'Active'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : user.status === 'Suspended'
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          : user.status === 'Pending'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {user.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-300 pt-2 border-t border-purple-500/15">
                    <span>
                      Country: <strong>{user.country}</strong>
                    </span>
                    <span>Joined: {user.registrationDate}</span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-500/15">
                    <button
                      onClick={() => onViewUserDetails(user)}
                      className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/30 text-purple-300 text-xs font-semibold border border-purple-500/25 transition-colors"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => onChangeStatusClick(user)}
                      className="px-3 py-1.5 rounded-xl bg-[#0E061E] hover:bg-purple-900/40 text-pink-300 text-xs font-semibold border border-purple-500/25 transition-colors"
                    >
                      Change Status
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between pt-3 text-xs text-zinc-400">
            <div>
              Page <strong className="text-white">{currentPage}</strong> of{' '}
              <strong className="text-white">{totalPages}</strong> ({filteredUsers.length} total)
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl bg-[#0E061E] hover:bg-purple-950/40 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 border border-purple-500/25 transition-colors"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded-xl text-xs font-bold transition-all ${
                    currentPage === page
                      ? 'bg-pink-500 text-white shadow-[0_0_10px_rgba(255,15,123,0.4)]'
                      : 'bg-[#0E061E] text-zinc-400 hover:text-white border border-purple-500/20'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-xl bg-[#0E061E] hover:bg-purple-950/40 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 border border-purple-500/25 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
