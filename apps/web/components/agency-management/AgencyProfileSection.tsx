'use client';

import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Edit3,
  Globe,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  AGENCY_LOGO_PRESETS,
  getAgencyLogoSvg,
  makeAgencyCoverSvg,
} from './mockAgencyData';
import { AgencyEmptyState } from './AgencyEmptyState';
import { AgencyLogoPresetId, AgencyProfileData } from './types';

interface AgencyProfileSectionProps {
  profile: AgencyProfileData | null;
  totalHosts: number;
  activeHosts: number;
  initialEditing?: boolean;
  onSaveProfile: (updated: AgencyProfileData) => void;
  onRestoreProfile: () => void;
  onCancelEditNotice?: () => void;
}

export const AgencyProfileSection: React.FC<AgencyProfileSectionProps> = ({
  profile,
  totalHosts,
  activeHosts,
  initialEditing = false,
  onSaveProfile,
  onRestoreProfile,
  onCancelEditNotice,
}) => {
  const [isEditing, setIsEditing] = useState(initialEditing);
  const [agencyName, setAgencyName] = useState(profile?.agencyName ?? '');
  const [description, setDescription] = useState(profile?.description ?? '');
  const [ownerName, setOwnerName] = useState(profile?.ownerName ?? '');
  const [contactEmail, setContactEmail] = useState(profile?.contactEmail ?? '');
  const [contactPhone, setContactPhone] = useState(profile?.contactPhone ?? '');
  const [country, setCountry] = useState(profile?.country ?? '');
  const [logoPreset, setLogoPreset] = useState<AgencyLogoPresetId>(
    profile?.logoPreset ?? 'gold_orbit'
  );
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setIsEditing(initialEditing);
  }, [initialEditing]);

  useEffect(() => {
    if (!profile) return;
    setAgencyName(profile.agencyName);
    setDescription(profile.description);
    setOwnerName(profile.ownerName);
    setContactEmail(profile.contactEmail);
    setContactPhone(profile.contactPhone);
    setCountry(profile.country);
    setLogoPreset(profile.logoPreset);
  }, [profile]);

  if (!profile) {
    return <AgencyEmptyState kind="no_agency_info" onAction={onRestoreProfile} />;
  }

  const handleStartEdit = () => {
    setFormError(null);
    setAgencyName(profile.agencyName);
    setDescription(profile.description);
    setOwnerName(profile.ownerName);
    setContactEmail(profile.contactEmail);
    setContactPhone(profile.contactPhone);
    setCountry(profile.country);
    setLogoPreset(profile.logoPreset);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormError(null);
    setAgencyName(profile.agencyName);
    setDescription(profile.description);
    setOwnerName(profile.ownerName);
    setContactEmail(profile.contactEmail);
    setContactPhone(profile.contactPhone);
    setCountry(profile.country);
    setLogoPreset(profile.logoPreset);
    setIsEditing(false);
    onCancelEditNotice?.();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyName.trim() || agencyName.trim().length < 3) {
      setFormError('Agency name must be at least 3 characters.');
      return;
    }
    if (!description.trim() || description.trim().length < 12) {
      setFormError('Agency description must be at least 12 characters.');
      return;
    }
    if (!contactEmail.trim() || !/^\S+@\S+\.\S+$/.test(contactEmail.trim())) {
      setFormError('Please provide a valid sample contact email address.');
      return;
    }
    setFormError(null);
    onSaveProfile({
      ...profile,
      agencyName: agencyName.trim(),
      description: description.trim(),
      ownerName: ownerName.trim() || profile.ownerName,
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim() || profile.contactPhone,
      country: country.trim() || profile.country,
      logoPreset,
    });
    setIsEditing(false);
  };

  const coverSrc = makeAgencyCoverSvg(isEditing ? agencyName || profile.agencyName : profile.agencyName);
  const logoSrc = getAgencyLogoSvg(isEditing ? logoPreset : profile.logoPreset);

  return (
    <div className="space-y-4" data-testid="agency-profile-section">
      {/* Cover + Profile Identity Card */}
      <div className="rounded-3xl overflow-hidden bg-[#1A0B2E] border border-purple-400/20 shadow-[0_18px_46px_rgba(9,3,22,0.55)]">
        <div className="relative h-36 sm:h-44 w-full overflow-hidden">
          <img
            src={coverSrc}
            alt={`${profile.agencyName} cover`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A0B2E] via-transparent to-black/25" />
          <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/35 text-[11px] font-bold text-emerald-300 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {profile.status}
            </span>
            {!isEditing && (
              <Button
                type="button"
                size="sm"
                onClick={handleStartEdit}
                data-testid="edit-agency-profile-btn"
                className="rounded-full bg-[#FF2E93] hover:bg-[#ff429e] text-white border-0 shadow-[0_6px_20px_rgba(255,46,147,0.35)]"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        <div className="px-4 sm:px-6 pb-6 -mt-10 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-3.5">
              <img
                src={logoSrc}
                alt={`${profile.agencyName} logo`}
                className="w-20 h-20 rounded-full border-4 border-[#1A0B2E] bg-[#251042] shadow-[0_10px_25px_rgba(251,191,36,0.22)] shrink-0"
              />
              <div className="pb-1 min-w-0">
                <h2
                  data-testid="agency-profile-name"
                  className="text-xl sm:text-2xl font-black text-white truncate"
                >
                  {profile.agencyName}
                </h2>
                <p className="text-xs text-purple-200/75 mt-0.5">
                  Agency ID: <span className="font-mono text-amber-300">{profile.agencyId}</span> ·{' '}
                  {totalHosts} hosts ({activeHosts} active)
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/15 border border-purple-400/25 text-[11px] font-semibold text-purple-200 self-start sm:self-auto">
              <Calendar className="w-3.5 h-3.5 text-[#FF6BA3]" />
              Created: {profile.createdDateLabel}
            </div>
          </div>

          {!isEditing ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-[#120624]/85 border border-purple-400/15 p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-purple-300/65 mb-1.5">
                  Agency Description
                </div>
                <p
                  data-testid="agency-profile-description"
                  className="text-sm text-purple-100/90 leading-relaxed"
                >
                  {profile.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Owner Info Card */}
                <div className="rounded-2xl bg-[#120624]/85 border border-purple-400/15 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-purple-300/65 mb-3">
                    Agency Owner Information (Demo)
                  </div>
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={profile.ownerAvatarUrl}
                      alt={profile.ownerName}
                      size="md"
                      ring="vip"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-bold text-white truncate">
                          {profile.ownerName}
                        </span>
                        <Badge variant="vip" className="text-[10px] px-2 py-0.5 whitespace-nowrap">
                          Owner
                        </Badge>
                      </div>
                      <p className="text-xs text-purple-200/70 truncate">
                        {profile.ownerHandle} · {profile.ownerRole}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Info Card */}
                <div className="rounded-2xl bg-[#120624]/85 border border-purple-400/15 p-4 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-purple-300/65 mb-1">
                    Agency Information & Contact
                  </div>
                  <div className="flex items-center gap-2 text-xs text-purple-100">
                    <Mail className="w-3.5 h-3.5 text-[#FF6BA3] shrink-0" />
                    <span data-testid="agency-profile-email" className="truncate">
                      {profile.contactEmail}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-purple-100">
                    <Phone className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>{profile.contactPhone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-purple-100">
                    <Globe className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                    <span>{profile.country}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-[#120624]/85 border border-purple-400/15 p-4">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-300/65 mb-2.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Agency Highlights
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {profile.highlights.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-2 rounded-xl bg-white/[0.03] border border-white/5 px-3 py-2 text-xs text-purple-100/85"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              data-testid="agency-edit-form"
              className="mt-5 rounded-2xl bg-[#120624]/95 border border-[#FF2E93]/35 p-4 sm:p-5 space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black text-white">Edit Agency Information</h3>
                  <p className="text-[11px] text-purple-200/70">
                    Updates apply to local frontend demo state only.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-400/25 text-purple-200">
                  {profile.agencyId}
                </span>
              </div>

              {formError && (
                <div
                  data-testid="agency-edit-error"
                  className="rounded-xl bg-rose-500/15 border border-rose-400/35 px-3.5 py-2.5 text-xs font-semibold text-rose-200"
                >
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-purple-200/85 mb-2">
                  Agency Emblem Style
                </label>
                <div className="flex flex-wrap gap-2">
                  {AGENCY_LOGO_PRESETS.map((preset) => {
                    const active = logoPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setLogoPreset(preset.id)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                          active
                            ? 'bg-[#FF2E93]/20 border-[#FF2E93] text-white'
                            : 'bg-[#1D0D34] border-purple-400/25 text-purple-200 hover:border-purple-300/45'
                        }`}
                      >
                        <img
                          src={getAgencyLogoSvg(preset.id)}
                          alt={preset.label}
                          className="w-4 h-4 rounded-full"
                        />
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Input
                  label="Agency Name"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  data-testid="agency-input-name"
                  placeholder="Enter agency name"
                  className="bg-[#1D0D34] border-purple-400/30 text-white"
                />
                <Input
                  label="Owner Display Name"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  data-testid="agency-input-owner"
                  placeholder="Enter owner name"
                  className="bg-[#1D0D34] border-purple-400/30 text-white"
                />
                <Input
                  label="Sample Contact Email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  data-testid="agency-input-email"
                  placeholder="team@example.com"
                  className="bg-[#1D0D34] border-purple-400/30 text-white"
                />
                <Input
                  label="Sample Phone / Support Handle"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  data-testid="agency-input-phone"
                  placeholder="+92 300 000 0000"
                  className="bg-[#1D0D34] border-purple-400/30 text-white"
                />
                <Input
                  label="Region / Coverage"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  data-testid="agency-input-country"
                  placeholder="Pakistan & Global"
                  className="bg-[#1D0D34] border-purple-400/30 text-white sm:col-span-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Agency Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  data-testid="agency-input-description"
                  className="w-full rounded-xl bg-[#1D0D34] border border-purple-400/30 px-3.5 py-2.5 text-sm text-white placeholder:text-purple-300/45 focus:outline-none focus:border-[#FF2E93]"
                  placeholder="Describe your agency focus and creator support..."
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleCancel}
                  data-testid="agency-cancel-edit-btn"
                  className="rounded-full bg-white/10 hover:bg-white/15 text-purple-100 border border-purple-400/25"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  data-testid="agency-save-edit-btn"
                  className="rounded-full bg-[#FF2E93] hover:bg-[#ff429e] text-white border-0 shadow-[0_6px_20px_rgba(255,46,147,0.35)]"
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Scope safeguard card */}
      <div className="rounded-2xl bg-[#160929] border border-purple-400/15 px-4 py-3 flex items-center gap-2.5 text-xs text-purple-200/80">
        <User className="w-4 h-4 text-amber-300 shrink-0" />
        <span>
          Agency Profile & Information uses local demo state only. Official registration rules and
          real financial commissions are not connected here.
        </span>
      </div>
    </div>
  );
};
