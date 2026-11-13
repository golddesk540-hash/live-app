'use client';

import React, { useCallback, useState } from 'react';
import { AdminActivitySection } from './AdminActivitySection';
import { AdminHeader } from './AdminHeader';
import { AdminManagementSection } from './AdminManagementSection';
import { AdminModalForm } from './AdminModalForm';
import { AdminSidebar } from './AdminSidebar';
import {
  INITIAL_ADMIN_PROFILE,
  INITIAL_PLATFORM_STATS,
  createInitialActivity,
  createInitialAdmins,
  createInitialRoles,
} from './mockAdminData';
import { PermissionMatrixSection } from './PermissionMatrixSection';
import { PlatformOverviewChart } from './PlatformOverviewChart';
import { PlatformStatisticsCards } from './PlatformStatisticsCards';
import { QuickActionsSection } from './QuickActionsSection';
import { RoleManagementSection } from './RoleManagementSection';
import { AdminSettingsSection } from './AdminSettingsSection';
import { UserHostAdminModule } from './user-host/UserHostAdminModule';
import {
  AdminActivityItem,
  AdminNavSection,
  AdminProfileData,
  AdminRecord,
  AdminRoleName,
  AdminStatus,
  RoleDefinition,
} from './types';

export const AdminHomeScreen: React.FC = () => {
  // Navigation & Layout State
  const [activeNav, setActiveNav] = useState<AdminNavSection>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Core Data State (in-memory React state)
  const [admins, setAdmins] = useState<AdminRecord[]>(createInitialAdmins());
  const [roles, setRoles] = useState<RoleDefinition[]>(createInitialRoles());
  const [activityLogs, setActivityLogs] = useState<AdminActivityItem[]>(createInitialActivity());
  const [platformStats, setPlatformStats] = useState(INITIAL_PLATFORM_STATS);
  const [adminProfile, setAdminProfile] = useState<AdminProfileData>(INITIAL_ADMIN_PROFILE);

  // Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit' | 'details';
    admin?: AdminRecord | null;
  }>({
    isOpen: false,
    mode: 'add',
    admin: null,
  });

  // Coming Soon Modal State
  const [comingSoonModal, setComingSoonModal] = useState<{
    isOpen: boolean;
    title: string;
    phaseModule: string;
  }>({
    isOpen: false,
    title: '',
    phaseModule: '',
  });

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  }, []);

  // Helper to append to activity log
  const logActivity = useCallback(
    (
      actionTitle: string,
      details: string,
      category: AdminActivityItem['category'] = 'roles'
    ) => {
      const newLog: AdminActivityItem = {
        id: `ACT-${Date.now()}`,
        adminName: adminProfile.name,
        adminRole: adminProfile.role,
        adminAvatar: adminProfile.avatar,
        actionTitle,
        details,
        dateLabel: 'Today',
        timeLabel: 'Just now',
        category,
        status: 'Completed',
      };
      setActivityLogs((prev) => [newLog, ...prev]);
    },
    [adminProfile]
  );

  // Role names list for dropdowns
  const roleNames: AdminRoleName[] = [
    'Super Admin',
    'Admin',
    'Moderator',
    'Support Agent',
    'Finance Manager',
    'Content Manager',
  ];

  // Admin CRUD Handlers
  const handleOpenCreateAdmin = () => {
    setModalState({
      isOpen: true,
      mode: 'add',
      admin: null,
    });
  };

  const handleOpenEditAdmin = (admin: AdminRecord) => {
    setModalState({
      isOpen: true,
      mode: 'edit',
      admin,
    });
  };

  const handleOpenViewAdmin = (admin: AdminRecord) => {
    setModalState({
      isOpen: true,
      mode: 'details',
      admin,
    });
  };

  const handleCloseModal = () => {
    setModalState({ isOpen: false, mode: 'add', admin: null });
  };

  const handleSaveAdmin = (
    data: Omit<AdminRecord, 'id' | 'createdAt' | 'lastActive'> & { id?: string }
  ) => {
    if (modalState.mode === 'add' || !data.id) {
      const newAdmin: AdminRecord = {
        ...data,
        id: `ADM-${String(admins.length + 1).padStart(3, '0')}`,
        createdAt: new Date().toISOString().split('T')[0],
        lastActive: 'Just now',
      };
      setAdmins((prev) => [newAdmin, ...prev]);
      logActivity(
        `Added new admin "${newAdmin.name}"`,
        `Assigned role ${newAdmin.role} in ${newAdmin.department} (${newAdmin.email}).`,
        'profile'
      );
      showToast(`Admin account "${newAdmin.name}" created successfully.`);
    } else {
      setAdmins((prev) =>
        prev.map((adm) =>
          adm.id === data.id
            ? {
                ...adm,
                ...data,
                lastActive: 'Just now',
              }
            : adm
        )
      );
      logActivity(
        `Updated admin profile "${data.name}"`,
        `Modified details for ${data.id}: role ${data.role}, status ${data.status}.`,
        'profile'
      );
      showToast(`Admin account "${data.name}" updated successfully.`);
    }
    handleCloseModal();
  };

  const handleToggleAdminStatus = (adminId: string, nextStatus: AdminStatus) => {
    setAdmins((prev) =>
      prev.map((adm) => {
        if (adm.id === adminId) {
          logActivity(
            `Status change for admin "${adm.name}"`,
            `Changed status from ${adm.status} to ${nextStatus}.`,
            'status'
          );
          return { ...adm, status: nextStatus };
        }
        return adm;
      })
    );
    showToast(`Admin status updated to ${nextStatus}.`);
  };

  const handleDeleteAdmin = (adminId: string) => {
    const target = admins.find((a) => a.id === adminId);
    if (!target) return;

    if (target.role === 'Super Admin') {
      showToast('Cannot delete protected Super Admin account.');
      return;
    }

    setAdmins((prev) => prev.filter((a) => a.id !== adminId));
    logActivity(
      `Removed admin "${target.name}"`,
      `Deleted staff account ${target.id} (${target.email}).`,
      'status'
    );
    showToast(`Admin account "${target.name}" removed.`);
  };

  // Reset Demo handler
  const handleResetDemo = () => {
    setAdmins(createInitialAdmins());
    setRoles(createInitialRoles());
    setActivityLogs(createInitialActivity());
    setPlatformStats(INITIAL_PLATFORM_STATS);
    setAdminProfile(INITIAL_ADMIN_PROFILE);
    showToast('Platform demo state restored to baseline defaults.');
  };

  // Role & Permission Handlers
  const handleSaveRole = (updatedRole: RoleDefinition) => {
    setRoles((prev) => prev.map((r) => (r.id === updatedRole.id ? updatedRole : r)));
    logActivity(
      `Modified role definition: ${updatedRole.name}`,
      `Updated role description and permissions checklist (${updatedRole.permissionIds.length} capabilities).`,
      'roles'
    );
    showToast(`Role "${updatedRole.name}" configuration saved.`);
  };

  const handleUpdateRolePermissions = (roleName: AdminRoleName, permissionIds: string[]) => {
    setRoles((prev) =>
      prev.map((r) => {
        if (r.name === roleName) {
          return { ...r, permissionIds };
        }
        return r;
      })
    );
    logActivity(
      `Updated permissions matrix for: ${roleName}`,
      `Assigned ${permissionIds.length} granular capabilities to role.`,
      'permissions'
    );
    showToast(`Permissions updated for role "${roleName}".`);
  };

  // Quick Action Dispatcher
  const handleQuickAction = (section: AdminNavSection, title: string) => {
    if (section === 'users') {
      setActiveNav('users');
    } else {
      const modLabels: Record<string, string> = {
        live_monitor: 'Module 10.3 Live Stream Monitor',
        reports: 'Module 10.4 Reports & Safety Queue',
        content: 'Module 10.7 Content Management',
      };
      setComingSoonModal({
        isOpen: true,
        title,
        phaseModule: modLabels[section] || 'Phase 10 Future Module',
      });
    }
  };

  // Sidebar navigation handler
  const handleSelectNav = (section: AdminNavSection) => {
    setIsMobileMenuOpen(false);
    // Future module routing checks (Module 10.2 Users and Hosts are now active)
    if (
      ['live_monitor', 'reports', 'safety', 'economy', 'agency', 'content'].includes(
        section
      )
    ) {
      const titles: Record<string, { title: string; mod: string }> = {
        live_monitor: {
          title: 'Agora Live Video Monitor',
          mod: 'Module 10.3 Live Stream Monitor',
        },
        reports: {
          title: 'User Safety & Moderation Queue',
          mod: 'Module 10.4 Reports & Safety Queue',
        },
        safety: {
          title: 'Trust & Safety Policies',
          mod: 'Module 10.4 Reports & Safety Queue',
        },
        economy: {
          title: 'Platform Coins & Ledger',
          mod: 'Module 10.5 Economy & Coin Management',
        },
        agency: { title: 'Agency Guild Center', mod: 'Module 10.6 Agency Management Center' },
        content: { title: 'Banners & Virtual Gifts CMS', mod: 'Module 10.7 Content Management' },
      };
      const info = titles[section] || { title: section, mod: 'Phase 10 Future Module' };
      setComingSoonModal({
        isOpen: true,
        title: info.title,
        phaseModule: info.mod,
      });
      return;
    }
    setActiveNav(section);
  };

  return (
    <div className="min-h-screen bg-[#0B0516] text-white flex flex-col selection:bg-pink-500 selection:text-white">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 max-w-md p-4 rounded-2xl bg-[#160A2D] border border-pink-500/50 text-white shadow-[0_0_25px_rgba(255,15,123,0.4)] flex items-center gap-3 animate-fadeIn">
          <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div className="text-xs font-semibold leading-snug">{toastMessage}</div>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-auto text-zinc-400 hover:text-white p-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Top Header */}
      <AdminHeader
        profile={adminProfile}
        onOpenMobileSidebar={() => setIsMobileMenuOpen(true)}
        onResetDemo={handleResetDemo}
        onOpenProfile={() => setActiveNav('settings')}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex w-full max-w-[1920px] mx-auto overflow-hidden">
        {/* Left Sidebar */}
        <AdminSidebar
          currentSection={activeNav}
          onSelectSection={handleSelectNav}
          collapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          mobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Content Viewport */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-8 custom-scrollbar">
          {/* View: Dashboard Overview */}
          {activeNav === 'dashboard' && (
            <div className="space-y-8 animate-fadeIn">
              {/* Section 1: Platform Statistics 4-Cards */}
              <PlatformStatisticsCards stats={platformStats} />

              {/* Section 2: Platform Overview Chart (Interactive SVG Neon Line Chart) */}
              <PlatformOverviewChart />

              {/* Section 3: Quick Actions */}
              <QuickActionsSection onSelectAction={handleQuickAction} />

              {/* Section 4: Quick Preview of Admins & Roles */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left 7 cols: Admin Management Preview */}
                <div className="lg:col-span-7">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_8px_#FF0F7B]" />
                      <span>Admin User Staff ({admins.length})</span>
                    </h3>
                    <button
                      onClick={() => setActiveNav('admins')}
                      className="text-xs text-pink-400 hover:text-pink-300 font-semibold flex items-center gap-1 group"
                    >
                      <span>Manage All Admins</span>
                      <svg
                        className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-3">
                    {admins.slice(0, 4).map((adm) => (
                      <div
                        key={adm.id}
                        className="p-3.5 rounded-2xl bg-[#160A2D]/80 border border-purple-500/20 flex items-center justify-between gap-3 hover:border-pink-500/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={adm.avatar}
                            alt={adm.name}
                            className="w-9 h-9 rounded-xl object-cover border border-purple-500/30"
                          />
                          <div>
                            <div className="text-xs font-bold text-white">{adm.name}</div>
                            <div className="text-[11px] text-zinc-400 font-mono">
                              {adm.email}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg bg-purple-500/15 text-purple-300 text-[10px] font-semibold border border-purple-500/30">
                            {adm.role}
                          </span>
                          <button
                            onClick={() => handleOpenViewAdmin(adm)}
                            className="px-2.5 py-1 rounded-xl bg-[#0E061E] hover:bg-purple-900/40 text-[11px] text-zinc-300 border border-purple-500/20"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right 5 cols: Latest Activity Preview */}
                <div className="lg:col-span-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_#A855F7]" />
                      <span>Recent Audit Events</span>
                    </h3>
                    <button
                      onClick={() => setActiveNav('activity')}
                      className="text-xs text-pink-400 hover:text-pink-300 font-semibold flex items-center gap-1 group"
                    >
                      <span>Full Audit Log</span>
                      <svg
                        className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-3">
                    {activityLogs.slice(0, 4).map((log) => (
                      <div
                        key={log.id}
                        className="p-3.5 rounded-2xl bg-[#160A2D]/80 border border-purple-500/20 space-y-1 hover:border-purple-500/40 transition-colors"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-white truncate max-w-[150px]">
                            {log.actionTitle}
                          </span>
                          <span className="text-zinc-500 font-mono">{log.timeLabel}</span>
                        </div>
                        <div className="text-[11px] text-zinc-400 line-clamp-1">
                          {log.details}
                        </div>
                        <div className="flex items-center gap-2 pt-1 text-[10px] text-zinc-500">
                          <span>By {log.adminName}</span>
                          <span>•</span>
                          <span className="uppercase text-pink-400/80 font-mono">
                            {log.category}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* View: Staff Admins List */}
          {activeNav === 'admins' && (
            <div className="animate-fadeIn">
              <AdminManagementSection
                admins={admins}
                roles={roleNames}
                onAddAdminClick={handleOpenCreateAdmin}
                onEditAdminClick={handleOpenEditAdmin}
                onViewAdminClick={handleOpenViewAdmin}
                onToggleStatus={handleToggleAdminStatus}
                onDeleteAdmin={handleDeleteAdmin}
              />
            </div>
          )}

          {/* View: User and Host Admin Module 10.2 */}
          {activeNav === 'users' && (
            <div className="animate-fadeIn">
              <UserHostAdminModule initialTab="users" onLogActivity={logActivity} />
            </div>
          )}

          {activeNav === 'hosts' && (
            <div className="animate-fadeIn">
              <UserHostAdminModule initialTab="hosts" onLogActivity={logActivity} />
            </div>
          )}

          {/* View: Roles */}
          {activeNav === 'roles' && (
            <div className="animate-fadeIn">
              <RoleManagementSection
                roles={roles}
                admins={admins}
                onSaveRole={handleSaveRole}
                onNavigateToPermissionsMatrix={() => setActiveNav('permissions')}
              />
            </div>
          )}

          {/* View: Granular Permission Matrix */}
          {activeNav === 'permissions' && (
            <div className="animate-fadeIn">
              <PermissionMatrixSection
                roles={roles}
                onUpdateRolePermissions={handleUpdateRolePermissions}
              />
            </div>
          )}

          {/* View: Activity History */}
          {activeNav === 'activity' && (
            <div className="animate-fadeIn">
              <AdminActivitySection activityLogs={activityLogs} />
            </div>
          )}

          {/* View: Platform Governance & Settings */}
          {activeNav === 'settings' && (
            <div className="animate-fadeIn">
              <AdminSettingsSection
                profile={adminProfile}
                onUpdateProfile={(updated) => {
                  setAdminProfile(updated);
                  logActivity(
                    'Updated administrative security preferences',
                    `Configured 2FA=${updated.twoFactorEnabled}, session timeout=${updated.sessionTimeoutMinutes}m.`,
                    'security'
                  );
                  showToast('Security preferences updated.');
                }}
                onOpenComingSoon={(title, mod) =>
                  setComingSoonModal({ isOpen: true, title, phaseModule: mod })
                }
              />
            </div>
          )}
        </main>
      </div>

      {/* Admin Create / Edit / View Modal */}
      <AdminModalForm
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        initialAdmin={modalState.admin}
        onClose={handleCloseModal}
        onSave={handleSaveAdmin}
      />

      {/* Coming Soon Modal */}
      {comingSoonModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#160A2D] border border-purple-500/30 shadow-[0_0_40px_rgba(255,15,123,0.3)] text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-3xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
              <svg
                className="w-7 h-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {comingSoonModal.phaseModule}
              </span>
              <h3 className="text-lg font-bold text-white mt-2">
                {comingSoonModal.title}
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                This administrative module is scheduled for implementation in the next Phase 10
                development sprint.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setComingSoonModal({ isOpen: false, title: '', phaseModule: '' })}
                className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold text-xs shadow-lg transition-all"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
