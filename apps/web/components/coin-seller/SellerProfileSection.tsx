'use client';

import React, { useState } from 'react';
import {
  BadgeCheck,
  CheckCircle2,
  Coins,
  Edit3,
  Globe,
  Mail,
  MessageSquare,
  Phone,
  Save,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { formatCoinCount } from './mockCoinSellerData';
import { SellerAccountStatus, SellerProfileData } from './types';

export function getSellerStatusAccent(status: SellerAccountStatus): {
  label: string;
  textClass: string;
  pillClass: string;
} {
  switch (status) {
    case 'Active':
      return {
        label: 'Active Seller',
        textClass: 'text-[#34D399]',
        pillClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40',
      };
    case 'Pending':
      return {
        label: 'Pending Seller',
        textClass: 'text-amber-300',
        pillClass: 'bg-amber-500/15 text-amber-300 border-amber-400/40',
      };
    case 'Inactive':
      return {
        label: 'Inactive Seller',
        textClass: 'text-slate-300',
        pillClass: 'bg-slate-500/20 text-slate-300 border-slate-400/40',
      };
    case 'Suspended':
      return {
        label: 'Suspended Seller',
        textClass: 'text-rose-400',
        pillClass: 'bg-rose-500/15 text-rose-300 border-rose-400/40',
      };
  }
}

interface SellerProfileSectionProps {
  profile: SellerProfileData;
  availableDemoBalance: number;
  onStatusPreviewChange: (status: SellerAccountStatus) => void;
  onSaveProfileNote: (updates: Partial<SellerProfileData>) => void;
}

const SELLER_STATUSES: SellerAccountStatus[] = ['Active', 'Pending', 'Inactive', 'Suspended'];

export const SellerProfileSection: React.FC<SellerProfileSectionProps> = ({
  profile,
  availableDemoBalance,
  onStatusPreviewChange,
  onSaveProfileNote,
}) => {
  const [editing, setEditing] = useState(false);
  const [sellerName, setSellerName] = useState(profile.sellerName);
  const [contactEmail, setContactEmail] = useState(profile.contactEmail);
  const [contactPhone, setContactPhone] = useState(profile.contactPhone);
  const [accountNote, setAccountNote] = useState(profile.accountNote);

  const statusMeta = getSellerStatusAccent(profile.status);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfileNote({
      sellerName: sellerName.trim() || profile.sellerName,
      contactEmail: contactEmail.trim() || profile.contactEmail,
      contactPhone: contactPhone.trim() || profile.contactPhone,
      accountNote: accountNote.trim() || profile.accountNote,
    });
    setEditing(false);
  };

  return (
    <section data-testid="coin-seller-profile-section" className="space-y-4">
      {/* Identity Card */}
      <div className="rounded-3xl bg-gradient-to-br from-[#26144A] via-[#1C0F38] to-[#130926] border border-purple-500/30 p-5 md:p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar src={profile.avatar} alt={profile.sellerName} size="xl" ring="vip" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-extrabold text-white">{profile.sellerName}</h2>
                <BadgeCheck className="w-5 h-5 text-amber-300" />
              </div>
              <p className="text-sm text-purple-200/85 mt-0.5">
                {profile.username} ·{' '}
                <span className="font-mono text-xs text-amber-300">Seller ID: {profile.sellerId}</span>
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  data-testid="profile-seller-status-badge"
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${statusMeta.pillClass}`}
                >
                  {statusMeta.label}
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-purple-200/80">
                  {profile.tierLabel}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            data-testid="toggle-edit-seller-profile-btn"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-purple-400/35 text-xs font-bold text-white transition cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-pink-400" />
            {editing ? 'Cancel Edit' : 'Edit Demo Details'}
          </button>
        </div>

        {/* Account Status Frontend Preview Switcher */}
        <div className="mt-5 pt-4 border-t border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-purple-200">
              Demo Seller Account Status Preview
            </p>
            <span className="text-[11px] text-purple-300/75">
              Frontend display state only (no live suspension/approval)
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SELLER_STATUSES.map((st) => {
              const selected = profile.status === st;
              return (
                <button
                  key={st}
                  type="button"
                  data-testid={`seller-status-option-${st.toLowerCase()}`}
                  onClick={() => onStatusPreviewChange(st)}
                  className={`px-3 py-2.5 rounded-2xl border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    selected
                      ? 'bg-gradient-to-r from-[#FF2E93]/25 to-purple-600/30 border-pink-400 text-white shadow-sm'
                      : 'bg-[#140A28]/80 hover:bg-[#1E103A] border-white/10 text-purple-200/80'
                  }`}
                >
                  {selected && <CheckCircle2 className="w-3.5 h-3.5 text-pink-300" />}
                  {st}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contact & Account Details */}
      {editing ? (
        <form
          onSubmit={handleSave}
          className="rounded-3xl bg-[#1A0E33] border border-purple-500/30 p-5 space-y-4"
        >
          <h3 className="text-sm font-bold text-white">Update Demo Seller Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="block space-y-1 text-xs text-purple-200">
              <span>Seller Name (Demo)</span>
              <input
                type="text"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                className="w-full rounded-xl bg-[#120826] border border-purple-500/30 px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-400"
              />
            </label>
            <label className="block space-y-1 text-xs text-purple-200">
              <span>Placeholder Contact Email</span>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full rounded-xl bg-[#120826] border border-purple-500/30 px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-400"
              />
            </label>
            <label className="block space-y-1 text-xs text-purple-200">
              <span>Placeholder Phone</span>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full rounded-xl bg-[#120826] border border-purple-500/30 px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-400"
              />
            </label>
          </div>
          <label className="block space-y-1 text-xs text-purple-200">
            <span>Seller Profile Note (Local State)</span>
            <textarea
              rows={2}
              value={accountNote}
              onChange={(e) => setAccountNote(e.target.value)}
              className="w-full rounded-xl bg-[#120826] border border-purple-500/30 px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-400"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-4 py-2 rounded-full border border-white/15 text-xs font-bold text-purple-200 hover:bg-white/5 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="save-seller-profile-btn"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-to-r from-[#FF2E93] to-[#C026D3] text-xs font-bold text-white cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Save Demo Info
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-3xl bg-[#1A0E33]/90 border border-purple-500/25 p-5 space-y-3.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-pink-400" />
              Seller Contact Information (Placeholder)
            </h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-2 rounded-2xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5">
                <span className="text-xs text-purple-300/80 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-purple-300" />
                  Demo Email
                </span>
                <span className="text-xs font-semibold text-white">{profile.contactEmail}</span>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-2xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5">
                <span className="text-xs text-purple-300/80 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-purple-300" />
                  Placeholder Phone
                </span>
                <span className="text-xs font-semibold text-white">{profile.contactPhone}</span>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-2xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5">
                <span className="text-xs text-purple-300/80 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-purple-300" />
                  Seller Desk Handle
                </span>
                <span className="text-xs font-semibold text-pink-300">{profile.supportHandle}</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-[#1A0E33]/90 border border-purple-500/25 p-5 space-y-3.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-300" />
              Account Information (Demo)
            </h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-2 rounded-2xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5">
                <span className="text-xs text-purple-300/80 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-300" />
                  Desk Region
                </span>
                <span className="text-xs font-semibold text-white">{profile.region}</span>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-2xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5">
                <span className="text-xs text-purple-300/80 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-300" />
                  Available Demo Balance
                </span>
                <span className="text-xs font-bold text-amber-300">
                  {formatCoinCount(availableDemoBalance)} Coins (Demo)
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-2xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5">
                <span className="text-xs text-purple-300/80">Enrolled Since</span>
                <span className="text-xs font-semibold text-white">{profile.joinedDate}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-purple-950/60 border border-purple-400/20 px-4 py-3 flex items-start gap-2.5 text-xs text-purple-200/80">
        <ShieldAlert className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
        <p>{profile.accountNote}</p>
      </div>
    </section>
  );
};
