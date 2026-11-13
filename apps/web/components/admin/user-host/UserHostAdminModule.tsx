'use client';

import React, { useCallback, useState } from 'react';
import { AllHostsView } from './AllHostsView';
import { AllUsersView } from './AllUsersView';
import { EditUserModal } from './EditUserModal';
import { HostDetailsView } from './HostDetailsView';
import { HostManagementDashboard } from './HostManagementDashboard';
import { createInitialHosts, createInitialUsers } from './mockUserHostData';
import { StatusManagementModal } from './StatusManagementModal';
import { UserDetailsView } from './UserDetailsView';
import { UserManagementDashboard } from './UserManagementDashboard';
import {
  AccountStatus,
  HostProfileRecord,
  UserHostActiveTab,
  UserHostSubView,
  UserProfileRecord,
} from './userHostTypes';

interface UserHostAdminModuleProps {
  initialTab?: UserHostActiveTab;
  onLogActivity?: (action: string, details: string, category: any) => void;
}

export const UserHostAdminModule: React.FC<UserHostAdminModuleProps> = ({
  initialTab = 'users',
  onLogActivity,
}) => {
  // Data State
  const [users, setUsers] = useState<UserProfileRecord[]>(createInitialUsers());
  const [hosts, setHosts] = useState<HostProfileRecord[]>(createInitialHosts());

  // View State
  const [activeTab, setActiveTab] = useState<UserHostActiveTab>(initialTab);
  const [userSubView, setUserSubView] = useState<UserHostSubView>('dashboard');
  const [hostSubView, setHostSubView] = useState<UserHostSubView>('dashboard');
  const [selectedUser, setSelectedUser] = useState<UserProfileRecord | null>(null);
  const [selectedHost, setSelectedHost] = useState<HostProfileRecord | null>(null);

  // Filter pass-through state
  const [passedUserStatusFilter, setPassedUserStatusFilter] = useState<string>('All');
  const [passedHostStatusFilter, setPassedHostStatusFilter] = useState<string>('All');
  const [passedHostActivityFilter, setPassedHostActivityFilter] = useState<string>('All');

  // Status Modal State
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    targetType: 'user' | 'host';
    targetId: string;
    targetName: string;
    targetAvatar: string;
    currentStatus: AccountStatus;
  }>({
    isOpen: false,
    targetType: 'user',
    targetId: '',
    targetName: '',
    targetAvatar: '',
    currentStatus: 'Active',
  });

  // Edit User Modal State
  const [editUserModal, setEditUserModal] = useState<{
    isOpen: boolean;
    user: UserProfileRecord | null;
  }>({
    isOpen: false,
    user: null,
  });

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((c) => (c === msg ? null : c));
    }, 3500);
  }, []);

  // Handlers for User Actions
  const handleViewUserDetails = (user: UserProfileRecord) => {
    setSelectedUser(user);
    setUserSubView('details');
  };

  const handleOpenUserStatusModal = (user: UserProfileRecord) => {
    setStatusModal({
      isOpen: true,
      targetType: 'user',
      targetId: user.id,
      targetName: user.username,
      targetAvatar: user.avatar,
      currentStatus: user.status,
    });
  };

  const handleOpenEditUserModal = (user: UserProfileRecord) => {
    setEditUserModal({
      isOpen: true,
      user,
    });
  };

  const handleSaveUserStatus = (
    userId: string,
    nextStatus: AccountStatus,
    reason: string
  ) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const auditEntry = {
            id: `AL-${Date.now()}`,
            previousStatus: u.status,
            newStatus: nextStatus,
            changedBy: 'Super Admin (Ayesha Noor)',
            reason,
            timestamp: 'Just now',
          };
          const actEntry = {
            id: `UA-${Date.now()}`,
            action: `Status Change: ${nextStatus}`,
            timestamp: 'Just now',
            details: `Status set to ${nextStatus}. Reason: ${reason}`,
            category: 'security' as const,
          };
          const updated: UserProfileRecord = {
            ...u,
            status: nextStatus,
            accountAuditLog: [auditEntry, ...u.accountAuditLog],
            activityHistory: [actEntry, ...u.activityHistory],
          };
          if (selectedUser?.id === userId) setSelectedUser(updated);
          return updated;
        }
        return u;
      })
    );

    onLogActivity?.(
      `User Status Change (${userId})`,
      `Changed standing to ${nextStatus}. Reason: ${reason}`,
      'status'
    );
    showToast(`User ${userId} standing changed to ${nextStatus}.`);
  };

  const handleBulkChangeUserStatus = (userIds: string[], nextStatus: AccountStatus) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (userIds.includes(u.id)) {
          return {
            ...u,
            status: nextStatus,
            accountAuditLog: [
              {
                id: `AL-${Date.now()}-${u.id}`,
                previousStatus: u.status,
                newStatus: nextStatus,
                changedBy: 'Super Admin (Ayesha Noor)',
                reason: `Bulk administrative update to ${nextStatus}`,
                timestamp: 'Just now',
              },
              ...u.accountAuditLog,
            ],
          };
        }
        return u;
      })
    );

    onLogActivity?.(
      `Bulk User Status Change (${userIds.length} users)`,
      `Bulk updated status to ${nextStatus}`,
      'status'
    );
    showToast(`Applied ${nextStatus} standing to ${userIds.length} users.`);
  };

  const handleSaveUserProfile = (updatedUser: UserProfileRecord) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    if (selectedUser?.id === updatedUser.id) setSelectedUser(updatedUser);
    onLogActivity?.(
      `User Profile Edit (${updatedUser.id})`,
      `Updated profile attributes for @${updatedUser.username}`,
      'profile'
    );
    showToast(`Profile for @${updatedUser.username} updated.`);
  };

  // Handlers for Host Actions
  const handleViewHostDetails = (host: HostProfileRecord) => {
    setSelectedHost(host);
    setHostSubView('details');
  };

  const handleOpenHostStatusModal = (host: HostProfileRecord) => {
    setStatusModal({
      isOpen: true,
      targetType: 'host',
      targetId: host.id,
      targetName: host.username,
      targetAvatar: host.avatar,
      currentStatus: host.hostStatus,
    });
  };

  const handleSaveHostStatus = (
    hostId: string,
    nextStatus: AccountStatus,
    reason: string
  ) => {
    setHosts((prev) =>
      prev.map((h) => {
        if (h.id === hostId) {
          const auditEntry = {
            id: `HAL-${Date.now()}`,
            previousStatus: h.hostStatus,
            newStatus: nextStatus,
            changedBy: 'Super Admin (Ayesha Noor)',
            reason,
            timestamp: 'Just now',
          };
          const actEntry = {
            id: `HA-${Date.now()}`,
            action: `Host Standing: ${nextStatus}`,
            timestamp: 'Just now',
            details: `Host standing changed to ${nextStatus}. Reason: ${reason}`,
            category: 'status' as const,
          };
          const updated: HostProfileRecord = {
            ...h,
            hostStatus: nextStatus,
            hostAuditLog: [auditEntry, ...h.hostAuditLog],
            activityHistory: [actEntry, ...h.activityHistory],
          };
          if (selectedHost?.id === hostId) setSelectedHost(updated);
          return updated;
        }
        return h;
      })
    );

    onLogActivity?.(
      `Host Status Change (${hostId})`,
      `Changed creator standing to ${nextStatus}. Reason: ${reason}`,
      'status'
    );
    showToast(`Host ${hostId} standing changed to ${nextStatus}.`);
  };

  const handleBulkChangeHostStatus = (hostIds: string[], nextStatus: AccountStatus) => {
    setHosts((prev) =>
      prev.map((h) => {
        if (hostIds.includes(h.id)) {
          return {
            ...h,
            hostStatus: nextStatus,
            hostAuditLog: [
              {
                id: `HAL-${Date.now()}-${h.id}`,
                previousStatus: h.hostStatus,
                newStatus: nextStatus,
                changedBy: 'Super Admin (Ayesha Noor)',
                reason: `Bulk creator status update to ${nextStatus}`,
                timestamp: 'Just now',
              },
              ...h.hostAuditLog,
            ],
          };
        }
        return h;
      })
    );

    onLogActivity?.(
      `Bulk Host Status Change (${hostIds.length} creators)`,
      `Bulk updated host standing to ${nextStatus}`,
      'status'
    );
    showToast(`Applied ${nextStatus} standing to ${hostIds.length} hosts.`);
  };

  const handleViewLinkedUserFromHost = (userId: string) => {
    const userTarget = users.find((u) => u.id === userId);
    if (userTarget) {
      setActiveTab('users');
      setSelectedUser(userTarget);
      setUserSubView('details');
    } else {
      showToast(`Linked user ${userId} not found in current directory.`);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="user-host-admin-module">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 max-w-md p-4 rounded-2xl bg-[#160A2D] border border-pink-500/50 text-white shadow-[0_0_25px_rgba(255,15,123,0.4)] flex items-center gap-3 animate-fadeIn">
          <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-xs font-semibold leading-snug">{toastMessage}</div>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-auto text-zinc-400 hover:text-white p-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Top Bar: Title & 10_02 Segmented Pill Tabs (Users vs Hosts) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-[#160A2D]/85 border border-purple-500/25 shadow-xl backdrop-blur-md">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-pink-500 shadow-[0_0_12px_#FF0F7B]" />
            <span>User & Host Admin</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Module 10.2 · Comprehensive account directories, creator tiers & standing governance
          </p>
        </div>

        {/* 10_02 Pill Segmented Control */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#0E061E] border border-purple-500/30">
          <button
            onClick={() => {
              setActiveTab('users');
            }}
            data-testid="tab-users-toggle"
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-[0_0_15px_rgba(255,15,123,0.4)]'
                : 'text-zinc-400 hover:text-white hover:bg-purple-950/40'
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('hosts');
            }}
            data-testid="tab-hosts-toggle"
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'hosts'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'text-zinc-400 hover:text-white hover:bg-purple-950/40'
            }`}
          >
            Hosts ({hosts.length})
          </button>
        </div>
      </div>

      {/* Secondary Sub-View Switcher (Dashboard vs All Records) */}
      {activeTab === 'users' && userSubView !== 'details' && (
        <div className="flex items-center justify-between gap-3 border-b border-purple-500/20 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUserSubView('dashboard')}
              data-testid="users-subview-dashboard"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                userSubView === 'dashboard'
                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Dashboard Overview
            </button>
            <button
              onClick={() => {
                setPassedUserStatusFilter('All');
                setUserSubView('list');
              }}
              data-testid="users-subview-all"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                userSubView === 'list'
                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All Users Table
            </button>
          </div>
        </div>
      )}

      {activeTab === 'hosts' && hostSubView !== 'details' && (
        <div className="flex items-center justify-between gap-3 border-b border-purple-500/20 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHostSubView('dashboard')}
              data-testid="hosts-subview-dashboard"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                hostSubView === 'dashboard'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Host Dashboard
            </button>
            <button
              onClick={() => {
                setPassedHostStatusFilter('All');
                setPassedHostActivityFilter('All');
                setHostSubView('list');
              }}
              data-testid="hosts-subview-all"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                hostSubView === 'list'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All Creators Directory
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area based on Tab and SubView */}
      {activeTab === 'users' && (
        <>
          {userSubView === 'dashboard' && (
            <UserManagementDashboard
              users={users}
              onNavigateToAllUsers={() => {
                setPassedUserStatusFilter('All');
                setUserSubView('list');
              }}
              onFilterByStatus={(st) => {
                setPassedUserStatusFilter(st);
                setUserSubView('list');
              }}
              onViewUserDetails={handleViewUserDetails}
            />
          )}

          {userSubView === 'list' && (
            <AllUsersView
              users={users}
              initialStatusFilter={passedUserStatusFilter}
              onViewUserDetails={handleViewUserDetails}
              onChangeStatusClick={handleOpenUserStatusModal}
              onEditProfileClick={handleOpenEditUserModal}
              onBulkChangeStatus={handleBulkChangeUserStatus}
            />
          )}

          {userSubView === 'details' && selectedUser && (
            <UserDetailsView
              user={selectedUser}
              onBack={() => setUserSubView('list')}
              onChangeStatusClick={handleOpenUserStatusModal}
              onEditProfileClick={handleOpenEditUserModal}
            />
          )}
        </>
      )}

      {activeTab === 'hosts' && (
        <>
          {hostSubView === 'dashboard' && (
            <HostManagementDashboard
              hosts={hosts}
              onNavigateToAllHosts={() => {
                setPassedHostStatusFilter('All');
                setPassedHostActivityFilter('All');
                setHostSubView('list');
              }}
              onFilterByStatus={(st) => {
                setPassedHostStatusFilter(st);
                setHostSubView('list');
              }}
              onFilterByActivity={(act) => {
                setPassedHostActivityFilter(act);
                setHostSubView('list');
              }}
              onViewHostDetails={handleViewHostDetails}
            />
          )}

          {hostSubView === 'list' && (
            <AllHostsView
              hosts={hosts}
              initialStatusFilter={passedHostStatusFilter}
              initialActivityFilter={passedHostActivityFilter}
              onViewHostDetails={handleViewHostDetails}
              onChangeHostStatusClick={handleOpenHostStatusModal}
              onBulkChangeHostStatus={handleBulkChangeHostStatus}
            />
          )}

          {hostSubView === 'details' && selectedHost && (
            <HostDetailsView
              host={selectedHost}
              onBack={() => setHostSubView('list')}
              onChangeHostStatusClick={handleOpenHostStatusModal}
              onViewLinkedUser={handleViewLinkedUserFromHost}
            />
          )}
        </>
      )}

      {/* Status Management Modal */}
      <StatusManagementModal
        isOpen={statusModal.isOpen}
        targetType={statusModal.targetType}
        targetId={statusModal.targetId}
        targetName={statusModal.targetName}
        targetAvatar={statusModal.targetAvatar}
        currentStatus={statusModal.currentStatus}
        onClose={() => setStatusModal((prev) => ({ ...prev, isOpen: false }))}
        onSaveStatus={(id, st, r) => {
          if (statusModal.targetType === 'user') {
            handleSaveUserStatus(id, st, r);
          } else {
            handleSaveHostStatus(id, st, r);
          }
        }}
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={editUserModal.isOpen}
        user={editUserModal.user}
        onClose={() => setEditUserModal({ isOpen: false, user: null })}
        onSave={handleSaveUserProfile}
      />
    </div>
  );
};
