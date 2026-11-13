'use client';

import React, { useMemo, useState } from 'react';
import { PERMISSION_GROUPS } from './mockAdminData';
import { AdminRecord, AdminRoleName, RoleDefinition } from './types';

interface RoleManagementSectionProps {
  roles: RoleDefinition[];
  admins: AdminRecord[];
  onSaveRole: (updatedRole: RoleDefinition) => void;
  onNavigateToPermissionsMatrix?: () => void;
}

const ROLE_COLOR_CONFIG: Record<
  AdminRoleName,
  {
    border: string;
    glow: string;
    accent: string;
    badge: string;
    gradient: string;
  }
> = {
  'Super Admin': {
    border: 'border-pink-500/40',
    glow: 'shadow-[0_0_25px_rgba(255,15,123,0.25)]',
    accent: 'text-pink-400',
    badge: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
    gradient: 'from-pink-500/10 via-purple-900/10 to-transparent',
  },
  Admin: {
    border: 'border-purple-500/40',
    glow: 'shadow-[0_0_25px_rgba(168,85,247,0.2)]',
    accent: 'text-purple-400',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    gradient: 'from-purple-500/10 via-[#160A2D] to-transparent',
  },
  Moderator: {
    border: 'border-blue-500/40',
    glow: 'shadow-[0_0_25px_rgba(59,130,246,0.2)]',
    accent: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    gradient: 'from-blue-500/10 via-[#160A2D] to-transparent',
  },
  'Support Agent': {
    border: 'border-teal-500/40',
    glow: 'shadow-[0_0_25px_rgba(20,184,166,0.2)]',
    accent: 'text-teal-400',
    badge: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    gradient: 'from-teal-500/10 via-[#160A2D] to-transparent',
  },
  'Finance Manager': {
    border: 'border-amber-500/40',
    glow: 'shadow-[0_0_25px_rgba(245,158,11,0.2)]',
    accent: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    gradient: 'from-amber-500/10 via-[#160A2D] to-transparent',
  },
  'Content Manager': {
    border: 'border-emerald-500/40',
    glow: 'shadow-[0_0_25px_rgba(16,185,129,0.2)]',
    accent: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    gradient: 'from-emerald-500/10 via-[#160A2D] to-transparent',
  },
};

export const RoleManagementSection: React.FC<RoleManagementSectionProps> = ({
  roles,
  admins,
  onSaveRole,
  onNavigateToPermissionsMatrix,
}) => {
  const [selectedRole, setSelectedRole] = useState<RoleDefinition | null>(null);
  const [editingDescription, setEditingDescription] = useState<string>('');
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Open role inspector
  const handleOpenRole = (role: RoleDefinition) => {
    setSelectedRole(role);
    setEditingDescription(role.description);
    setEditingPermissions([...role.permissionIds]);
    setHasChanges(false);
    setSaveSuccessNotice(null);
  };

  const handleCloseInspector = () => {
    setSelectedRole(null);
    setHasChanges(false);
    setSaveSuccessNotice(null);
  };

  const handleTogglePermission = (permId: string) => {
    if (!selectedRole || selectedRole.isSystemProtected) return; // Super admin cannot be changed

    setEditingPermissions((prev) => {
      const exists = prev.includes(permId);
      const next = exists ? prev.filter((id) => id !== permId) : [...prev, permId];
      setHasChanges(true);
      return next;
    });
  };

  const handleSaveRoleChanges = () => {
    if (!selectedRole) return;
    const updated: RoleDefinition = {
      ...selectedRole,
      description: editingDescription,
      permissionIds: editingPermissions,
    };
    onSaveRole(updated);
    setSelectedRole(updated);
    setHasChanges(false);
    setSaveSuccessNotice(`Role "${updated.name}" updated successfully.`);
    setTimeout(() => setSaveSuccessNotice(null), 3000);
  };

  // Group admins by role
  const adminsByRole = useMemo(() => {
    const map: Record<string, AdminRecord[]> = {};
    admins.forEach((adm) => {
      if (!map[adm.role]) map[adm.role] = [];
      map[adm.role].push(adm);
    });
    return map;
  }, [admins]);

  // All permissions flat list map for fast lookup
  const permissionMap = useMemo(() => {
    const map = new Map<string, { label: string; groupTitle: string; sensitive?: boolean }>();
    PERMISSION_GROUPS.forEach((g) => {
      g.permissions.forEach((p) => {
        map.set(p.id, { label: p.label, groupTitle: g.title, sensitive: p.sensitive });
      });
    });
    return map;
  }, []);

  return (
    <section className="space-y-6" id="roles-section">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_10px_#A855F7]" />
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">
              Role & Permission Hierarchy
            </h2>
          </div>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">
            Structured administrative tiers with enforced principle-of-least-privilege.
          </p>
        </div>

        {onNavigateToPermissionsMatrix && (
          <button
            onClick={onNavigateToPermissionsMatrix}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#0E061E] hover:bg-purple-950/40 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all"
          >
            <svg className="w-4 h-4 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <span>View Full Permission Matrix</span>
          </button>
        )}
      </div>

      {/* Roles 6-Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {roles.map((role) => {
          const config = ROLE_COLOR_CONFIG[role.name] || ROLE_COLOR_CONFIG.Admin;
          const assignedAdmins = adminsByRole[role.name] || [];

          return (
            <div
              key={role.id}
              className={`relative flex flex-col justify-between p-5 rounded-3xl bg-[#160A2D]/80 border ${config.border} ${config.glow} backdrop-blur-md transition-all hover:translate-y-[-2px]`}
            >
              {/* Background gradient hint */}
              <div
                className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${config.gradient} pointer-events-none opacity-40`}
              />

              <div className="relative space-y-3.5">
                {/* Header row: Name & Protected Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span className={config.accent}>{role.name}</span>
                    </h3>
                    <div className="text-xs text-zinc-400 mt-0.5">
                      {assignedAdmins.length} active {assignedAdmins.length === 1 ? 'member' : 'members'}
                    </div>
                  </div>

                  {role.isSystemProtected ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-pink-500/20 text-pink-300 border border-pink-500/40">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Protected
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                      Configurable
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-300 leading-relaxed line-clamp-3">
                  {role.description}
                </p>

                {/* Permissions Summary Badges */}
                <div className="pt-2 border-t border-purple-500/15">
                  <div className="text-[11px] font-medium text-zinc-400 mb-1.5 flex items-center justify-between">
                    <span>Assigned Permissions:</span>
                    <span className="font-mono text-pink-400 font-bold">
                      {role.permissionIds.length} capabilities
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {role.permissionIds.slice(0, 4).map((pId) => {
                      const meta = permissionMap.get(pId);
                      return (
                        <span
                          key={pId}
                          className="px-2 py-0.5 rounded-lg bg-[#0E061E]/90 text-[10px] text-zinc-300 border border-purple-500/20"
                        >
                          {meta?.label || pId}
                        </span>
                      );
                    })}
                    {role.permissionIds.length > 4 && (
                      <span className="px-2 py-0.5 rounded-lg bg-pink-500/10 text-[10px] text-pink-300 border border-pink-500/20 font-semibold">
                        +{role.permissionIds.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Assigned Admins Avatar Row */}
                {assignedAdmins.length > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex -space-x-2">
                      {assignedAdmins.slice(0, 4).map((adm) => (
                        <img
                          key={adm.id}
                          src={adm.avatar}
                          alt={adm.name}
                          title={`${adm.name} (${adm.username})`}
                          className="w-7 h-7 rounded-full object-cover border-2 border-[#160A2D]"
                        />
                      ))}
                    </div>
                    {assignedAdmins.length > 4 && (
                      <span className="text-[11px] text-zinc-400 font-medium">
                        +{assignedAdmins.length - 4} others
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="relative pt-4 mt-3 border-t border-purple-500/15">
                <button
                  onClick={() => handleOpenRole(role)}
                  className="w-full py-2 px-3 rounded-2xl bg-[#0E061E] hover:bg-purple-950/50 text-white text-xs font-semibold border border-purple-500/25 hover:border-pink-500/50 transition-all flex items-center justify-center gap-2 group"
                >
                  <span>Inspect & Configure Role</span>
                  <svg
                    className="w-3.5 h-3.5 text-pink-400 group-hover:translate-x-0.5 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Role Details Drawer / Modal */}
      {selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-[#160A2D] border border-purple-500/30 shadow-[0_0_50px_rgba(255,15,123,0.3)] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#0E061E]/90 border-b border-purple-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-pink-500 shadow-[0_0_12px_#FF0F7B]" />
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>{selectedRole.name}</span>
                    {selectedRole.isSystemProtected && (
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-lg bg-pink-500/20 text-pink-300 border border-pink-500/40">
                        System Protected
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-zinc-400">Configure role scope and assigned privileges</p>
                </div>
              </div>
              <button
                onClick={handleCloseInspector}
                className="p-2 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
              {saveSuccessNotice && (
                <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{saveSuccessNotice}</span>
                </div>
              )}

              {selectedRole.isSystemProtected && (
                <div className="p-3.5 rounded-2xl bg-pink-500/10 border border-pink-500/30 text-xs text-pink-200 flex items-start gap-3">
                  <svg className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <div className="font-semibold text-pink-300">Root System Role Protected</div>
                    <div className="text-zinc-300 mt-0.5">
                      Super Admin holds immutable root authorization over the Popo Live platform. Permissions cannot be stripped or modified to safeguard operational continuity.
                    </div>
                  </div>
                </div>
              )}

              {/* Description Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Role Operational Scope</label>
                <textarea
                  rows={2}
                  value={editingDescription}
                  onChange={(e) => {
                    setEditingDescription(e.target.value);
                    setHasChanges(true);
                  }}
                  disabled={selectedRole.isSystemProtected}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#0E061E] border border-purple-500/25 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-pink-500 disabled:opacity-70 disabled:cursor-not-allowed"
                />
              </div>

              {/* Assigned Admins */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-semibold text-zinc-300">Assigned Admins</span>
                  <span>{adminsByRole[selectedRole.name]?.length || 0} assigned</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(adminsByRole[selectedRole.name] || []).map((adm) => (
                    <div
                      key={adm.id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#0E061E] border border-purple-500/20 text-xs text-zinc-200"
                    >
                      <img
                        src={adm.avatar}
                        alt={adm.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span className="font-medium text-white">{adm.name}</span>
                      <span className="text-[10px] text-pink-400 font-mono">{adm.id}</span>
                    </div>
                  ))}
                  {(!adminsByRole[selectedRole.name] ||
                    adminsByRole[selectedRole.name].length === 0) && (
                    <div className="text-xs text-zinc-500 italic">No admins currently assigned.</div>
                  )}
                </div>
              </div>

              {/* Permission Checklist by Group */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-300">
                    Granted Permissions ({editingPermissions.length} enabled)
                  </span>
                  {!selectedRole.isSystemProtected && (
                    <span className="text-[11px] text-pink-400">
                      Click items below to toggle access
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {PERMISSION_GROUPS.map((group) => {
                    return (
                      <div
                        key={group.key}
                        className="p-3.5 rounded-2xl bg-[#0E061E]/80 border border-purple-500/20 space-y-2"
                      >
                        <div className="text-xs font-bold text-white flex items-center justify-between">
                          <span>{group.title}</span>
                          <span className="text-[10px] text-zinc-400">
                            {
                              group.permissions.filter((p) => editingPermissions.includes(p.id))
                                .length
                            }{' '}
                            / {group.permissions.length}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {group.permissions.map((perm) => {
                            const isGranted = editingPermissions.includes(perm.id);
                            return (
                              <button
                                key={perm.id}
                                type="button"
                                disabled={selectedRole.isSystemProtected}
                                onClick={() => handleTogglePermission(perm.id)}
                                className={`text-left p-2.5 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                                  isGranted
                                    ? 'bg-purple-900/20 border-purple-500/40 text-zinc-100'
                                    : 'bg-[#0E061E]/50 border-purple-500/10 text-zinc-500 hover:border-purple-500/30'
                                } ${
                                  selectedRole.isSystemProtected
                                    ? 'cursor-default'
                                    : 'cursor-pointer'
                                }`}
                              >
                                <span
                                  className={`w-4 h-4 rounded-md mt-0.5 flex-shrink-0 flex items-center justify-center border transition-colors ${
                                    isGranted
                                      ? 'bg-pink-500 border-pink-400 text-white'
                                      : 'border-zinc-700 bg-zinc-900'
                                  }`}
                                >
                                  {isGranted && (
                                    <svg
                                      className="w-3 h-3"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={3}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  )}
                                </span>
                                <div className="min-w-0">
                                  <div className="font-semibold text-white leading-tight flex items-center gap-1.5">
                                    <span>{perm.label}</span>
                                    {perm.sensitive && (
                                      <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono">
                                        RESTRICTED
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-zinc-400 mt-0.5 leading-tight line-clamp-1">
                                    {perm.description}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-[#0E061E]/90 border-t border-purple-500/20 flex items-center justify-between">
              <span className="text-xs text-zinc-400">
                {hasChanges ? 'Unsaved changes pending' : 'All permissions up to date'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCloseInspector}
                  className="px-4 py-2 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
                >
                  Close
                </button>
                {!selectedRole.isSystemProtected && (
                  <button
                    onClick={handleSaveRoleChanges}
                    disabled={!hasChanges}
                    className="px-5 py-2 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-[0_0_15px_rgba(255,15,123,0.3)] transition-all"
                  >
                    Save Role Changes
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
