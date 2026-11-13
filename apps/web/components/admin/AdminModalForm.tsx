'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  Save,
  Shield,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { AdminRecord, AdminRoleName, AdminStatus } from './types';

const ROLE_OPTIONS: AdminRoleName[] = [
  'Super Admin',
  'Admin',
  'Moderator',
  'Support Agent',
  'Finance Manager',
  'Content Manager',
];

const STATUS_OPTIONS: AdminStatus[] = ['Active', 'Pending', 'Inactive', 'Suspended'];

interface AdminModalFormProps {
  isOpen: boolean;
  mode: 'add' | 'edit' | 'details';
  initialAdmin?: AdminRecord | null;
  onClose: () => void;
  onSave: (adminData: Omit<AdminRecord, 'id' | 'createdAt' | 'lastActive'> & { id?: string }) => void;
}

export function getAdminStatusBadgeClasses(status: AdminStatus): string {
  switch (status) {
    case 'Active':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-400/35';
    case 'Pending':
      return 'bg-amber-500/15 text-amber-300 border-amber-400/35';
    case 'Inactive':
      return 'bg-slate-500/20 text-slate-300 border-slate-400/35';
    case 'Suspended':
      return 'bg-rose-500/15 text-rose-300 border-rose-400/35';
  }
}

export function getRoleBadgeClasses(role: AdminRoleName): string {
  switch (role) {
    case 'Super Admin':
      return 'bg-gradient-to-r from-pink-500/25 to-purple-500/25 text-pink-300 border-pink-400/40';
    case 'Admin':
      return 'bg-purple-500/20 text-purple-200 border-purple-400/35';
    case 'Moderator':
      return 'bg-sky-500/20 text-sky-200 border-sky-400/35';
    case 'Support Agent':
      return 'bg-amber-500/15 text-amber-200 border-amber-400/35';
    case 'Finance Manager':
      return 'bg-emerald-500/20 text-emerald-200 border-emerald-400/35';
    case 'Content Manager':
      return 'bg-indigo-500/20 text-indigo-200 border-indigo-400/35';
  }
}

export const AdminModalForm: React.FC<AdminModalFormProps> = ({
  isOpen,
  mode,
  initialAdmin,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(initialAdmin?.name ?? '');
  const [username, setUsername] = useState(initialAdmin?.username ?? '');
  const [email, setEmail] = useState(initialAdmin?.email ?? '');
  const [role, setRole] = useState<AdminRoleName>(initialAdmin?.role ?? 'Moderator');
  const [status, setStatus] = useState<AdminStatus>(initialAdmin?.status ?? 'Active');
  const [department, setDepartment] = useState(initialAdmin?.department ?? 'Trust & Safety');
  const [phoneMasked, setPhoneMasked] = useState(initialAdmin?.phoneMasked ?? '+1 (555) ***-0000');
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];

    if (!name.trim()) errs.push('Admin name is required.');
    if (!email.trim() || !email.includes('@')) errs.push('Valid admin email is required.');
    if (!username.trim()) errs.push('Admin username handle is required.');

    if (errs.length > 0) {
      setErrors(errs);
      return;
    }

    setErrors([]);
    onSave({
      id: initialAdmin?.id,
      name: name.trim(),
      username: username.startsWith('@') ? username.trim() : `@${username.trim()}`,
      email: email.trim(),
      avatar:
        initialAdmin?.avatar ??
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
      role,
      status,
      department: department.trim() || 'General Administration',
      phoneMasked: phoneMasked.trim() || '+1 (555) ***-0000',
    });
    onClose();
  };

  return (
    <div
      data-testid="admin-modal-overlay"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        data-testid="admin-modal-container"
        className="w-full max-w-lg rounded-3xl bg-[#180C34] border border-purple-500/35 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="text-lg font-extrabold text-white">
              {mode === 'add' && 'Add New Admin (Demo)'}
              {mode === 'edit' && `Edit Admin — ${initialAdmin?.name}`}
              {mode === 'details' && `Admin Details — ${initialAdmin?.name}`}
            </h3>
            <p className="text-xs text-purple-200/70">
              {mode === 'details'
                ? 'Read-only profile inspection and assigned permissions'
                : 'Local frontend state simulation only · No real credentials issued'}
            </p>
          </div>
          <button
            type="button"
            data-testid="admin-modal-close-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* View Details Mode */}
        {mode === 'details' && initialAdmin && (
          <div className="space-y-4">
            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
              <Avatar src={initialAdmin.avatar} alt={initialAdmin.name} size="lg" ring="pink" />
              <div>
                <h4 className="text-base font-extrabold text-white">{initialAdmin.name}</h4>
                <p className="text-xs text-purple-300 font-mono">
                  {initialAdmin.username} · ID: {initialAdmin.id}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getRoleBadgeClasses(
                      initialAdmin.role
                    )}`}
                  >
                    {initialAdmin.role}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getAdminStatusBadgeClasses(
                      initialAdmin.status
                    )}`}
                  >
                    {initialAdmin.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="rounded-2xl bg-[#120726] border border-white/10 p-3">
                <p className="text-purple-300/70">Mock Email</p>
                <p className="font-semibold text-white truncate mt-0.5">{initialAdmin.email}</p>
              </div>
              <div className="rounded-2xl bg-[#120726] border border-white/10 p-3">
                <p className="text-purple-300/70">Department</p>
                <p className="font-semibold text-white truncate mt-0.5">{initialAdmin.department}</p>
              </div>
              <div className="rounded-2xl bg-[#120726] border border-white/10 p-3">
                <p className="text-purple-300/70">Created Date</p>
                <p className="font-semibold text-white mt-0.5">{initialAdmin.createdAt}</p>
              </div>
              <div className="rounded-2xl bg-[#120726] border border-white/10 p-3">
                <p className="text-purple-300/70">Last Active</p>
                <p className="font-semibold text-emerald-400 mt-0.5">{initialAdmin.lastActive}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-purple-950/60 border border-purple-400/20 p-3 flex items-start gap-2 text-xs text-purple-200/80">
              <ShieldCheck className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
              <span>
                Administrative privileges for this demo profile are governed by the assigned{' '}
                <strong>{initialAdmin.role}</strong> permission matrix.
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-bold text-white cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        )}

        {/* Add / Edit Form Mode */}
        {(mode === 'add' || mode === 'edit') && (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {errors.length > 0 && (
              <div className="rounded-2xl bg-rose-500/15 border border-rose-400/40 p-3 space-y-1 text-xs text-rose-200">
                <div className="font-bold flex items-center gap-1.5 text-rose-100">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Please correct the following:
                </div>
                <ul className="list-disc pl-5">
                  {errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block space-y-1 text-xs text-purple-200">
                <span>Admin Full Name *</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maria Khan"
                  data-testid="admin-form-name-input"
                  className="w-full rounded-xl bg-[#120726] border border-purple-500/35 px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-400"
                />
              </label>

              <label className="block space-y-1 text-xs text-purple-200">
                <span>Username Handle *</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. @maria_admin"
                  data-testid="admin-form-username-input"
                  className="w-full rounded-xl bg-[#120726] border border-purple-500/35 px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-400"
                />
              </label>

              <label className="block space-y-1 text-xs text-purple-200 sm:col-span-2">
                <span>Mock Admin Email *</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. maria.khan@admin.popolive.local"
                  data-testid="admin-form-email-input"
                  className="w-full rounded-xl bg-[#120726] border border-purple-500/35 px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-400"
                />
              </label>

              <label className="block space-y-1 text-xs text-purple-200">
                <span>Assigned Role *</span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as AdminRoleName)}
                  data-testid="admin-form-role-select"
                  className="w-full rounded-xl bg-[#120726] border border-purple-500/35 px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-400 cursor-pointer"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1 text-xs text-purple-200">
                <span>Account Status *</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AdminStatus)}
                  data-testid="admin-form-status-select"
                  className="w-full rounded-xl bg-[#120726] border border-purple-500/35 px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-400 cursor-pointer"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1 text-xs text-purple-200 sm:col-span-2">
                <span>Department / Assignment</span>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Trust & Safety, Host Operations"
                  data-testid="admin-form-department-input"
                  className="w-full rounded-xl bg-[#120726] border border-purple-500/35 px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-400"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-purple-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                data-testid="admin-form-submit-btn"
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#FF0F7B] via-[#FF1E8E] to-[#E11D84] hover:brightness-110 text-xs font-extrabold text-white shadow-lg shadow-pink-500/25 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                {mode === 'add' ? 'Add Admin (Demo)' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
