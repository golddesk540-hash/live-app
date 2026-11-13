'use client';

import React, { useState } from 'react';
import { PERMISSION_GROUPS } from './mockAdminData';
import { AdminRoleName, RoleDefinition } from './types';

interface PermissionMatrixSectionProps {
  roles: RoleDefinition[];
  onUpdateRolePermissions: (roleName: AdminRoleName, permissionIds: string[]) => void;
}

export const PermissionMatrixSection: React.FC<PermissionMatrixSectionProps> = ({
  roles,
  onUpdateRolePermissions,
}) => {
  const [selectedRoleName, setSelectedRoleName] = useState<AdminRoleName>('Admin');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const activeRole = roles.find((r) => r.name === selectedRoleName) || roles[0];
  const isSuperAdmin = activeRole?.isSystemProtected || activeRole?.name === 'Super Admin';

  const handleToggle = (permId: string) => {
    if (isSuperAdmin || !activeRole) return;

    const currentPerms = activeRole.permissionIds;
    const nextPerms = currentPerms.includes(permId)
      ? currentPerms.filter((id) => id !== permId)
      : [...currentPerms, permId];

    onUpdateRolePermissions(activeRole.name, nextPerms);
    setFeedbackNotice(`Toggled permission "${permId}" for role "${activeRole.name}"`);
    setTimeout(() => setFeedbackNotice(null), 3000);
  };

  const handleEnableAllForRole = () => {
    if (isSuperAdmin || !activeRole) return;
    const allIds = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.id));
    onUpdateRolePermissions(activeRole.name, allIds);
    setFeedbackNotice(`Granted all permissions to role "${activeRole.name}"`);
    setTimeout(() => setFeedbackNotice(null), 3000);
  };

  const handleDisableAllForRole = () => {
    if (isSuperAdmin || !activeRole) return;
    onUpdateRolePermissions(activeRole.name, []);
    setFeedbackNotice(`Cleared all permissions from role "${activeRole.name}"`);
    setTimeout(() => setFeedbackNotice(null), 3000);
  };

  return (
    <section className="space-y-6" id="permission-matrix-section">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_10px_#FF0F7B]" />
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">
              Granular Permission Matrix
            </h2>
          </div>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">
            Authorize administrative capabilities across 6 platform operations groups.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-[#160A2D] border border-purple-500/25">
          {roles.map((r) => {
            const isSelected = r.name === selectedRoleName;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRoleName(r.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-[0_0_12px_rgba(255,15,123,0.4)]'
                    : 'text-zinc-400 hover:text-white hover:bg-purple-950/40'
                }`}
              >
                {r.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Role State Banner */}
      <div className="p-4 rounded-3xl bg-[#160A2D]/80 border border-purple-500/20 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-600/20 border border-purple-500/40 flex items-center justify-center text-pink-400 font-bold">
            {activeRole.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base">{activeRole.name}</span>
              {isSuperAdmin ? (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-lg bg-pink-500/20 text-pink-300 border border-pink-500/40">
                  Protected System Root
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-400 border border-zinc-700">
                  Customizable Matrix
                </span>
              )}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              Active Capabilities: <strong className="text-pink-400">{activeRole.permissionIds.length}</strong> enabled
            </div>
          </div>
        </div>

        {/* Quick Batch Actions */}
        {!isSuperAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleEnableAllForRole}
              className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-semibold border border-purple-500/30 transition-colors"
            >
              Enable All
            </button>
            <button
              onClick={handleDisableAllForRole}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-semibold border border-zinc-700 transition-colors"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {feedbackNotice && (
        <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* 6 Category Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {PERMISSION_GROUPS.map((group) => {
          const enabledCount = group.permissions.filter((p) =>
            activeRole.permissionIds.includes(p.id)
          ).length;

          return (
            <div
              key={group.key}
              className="p-5 rounded-3xl bg-[#160A2D]/80 border border-purple-500/20 backdrop-blur-md shadow-xl flex flex-col justify-between"
            >
              <div>
                {/* Group Title */}
                <div className="flex items-center justify-between pb-3 border-b border-purple-500/15">
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-pink-400" />
                    <span>{group.title}</span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-[#0E061E] text-zinc-400 border border-purple-500/20">
                    {enabledCount} / {group.permissions.length}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-2 mb-3 leading-relaxed">
                  {group.description}
                </p>

                {/* Items */}
                <div className="space-y-2">
                  {group.permissions.map((perm) => {
                    const isChecked = activeRole.permissionIds.includes(perm.id);

                    return (
                      <div
                        key={perm.id}
                        onClick={() => handleToggle(perm.id)}
                        className={`p-3 rounded-2xl border transition-all ${
                          isChecked
                            ? 'bg-purple-900/20 border-purple-500/40 text-white'
                            : 'bg-[#0E061E]/60 border-purple-500/10 text-zinc-400 hover:border-purple-500/25'
                        } ${
                          isSuperAdmin
                            ? 'cursor-default'
                            : 'cursor-pointer active:scale-[0.99]'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isSuperAdmin}
                            onChange={() => {}} // handled by parent div
                            className="mt-0.5 w-4 h-4 rounded text-pink-500 bg-[#0E061E] border-purple-500/40 focus:ring-pink-500 focus:ring-offset-0 cursor-pointer disabled:cursor-not-allowed"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-semibold text-white">
                                {perm.label}
                              </span>
                              {perm.sensitive && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                  RESTRICTED
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                              {perm.description}
                            </div>
                            <div className="text-[10px] font-mono text-zinc-600 mt-1">
                              ID: {perm.id}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Super admin locked notice inside cards */}
              {isSuperAdmin && (
                <div className="mt-4 pt-3 border-t border-purple-500/15 text-[11px] text-pink-300/80 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Permanently granted to Super Admin</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
