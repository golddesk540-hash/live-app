'use client';

import React, { useEffect, useState } from 'react';
import { COUNTRIES_LIST } from '@/lib/countries';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  ArrowRight,
  Calendar,
  CreditCard,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Mail,
  Phone,
  Save,
  User,
  X,
} from 'lucide-react';
import { DOCUMENT_TYPE_OPTIONS } from './mockEarningIdentityData';
import { IdentityDocumentType, PersonalIdentityFormData } from './types';

interface PersonalIdentityFormProps {
  initialData: PersonalIdentityFormData;
  onSave: (updated: PersonalIdentityFormData, goToDocuments?: boolean) => void;
  onCancel: () => void;
}

type FormErrors = Partial<Record<keyof PersonalIdentityFormData, string>>;

export const PersonalIdentityForm: React.FC<PersonalIdentityFormProps> = ({
  initialData,
  onSave,
  onCancel,
}) => {
  const [draft, setDraft] = useState<PersonalIdentityFormData>(initialData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showDocNumber, setShowDocNumber] = useState(false);

  useEffect(() => {
    setDraft(initialData);
    setErrors({});
  }, [initialData]);

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!draft.legalFullName.trim() || draft.legalFullName.trim().length < 3) {
      nextErrors.legalFullName = 'Please enter your full name (at least 3 characters).';
    }
    if (!draft.countryCode) {
      nextErrors.countryCode = 'Please select your country.';
    }
    if (!draft.dateOfBirth) {
      nextErrors.dateOfBirth = 'Please select your date of birth.';
    } else {
      const parsed = new Date(draft.dateOfBirth);
      if (Number.isNaN(parsed.getTime()) || parsed > new Date()) {
        nextErrors.dateOfBirth = 'Please enter a valid past date of birth.';
      }
    }
    if (!draft.documentNumber.trim() || draft.documentNumber.trim().length < 5) {
      nextErrors.documentNumber = 'Enter a sample document number (minimum 5 characters).';
    }
    if (!draft.contactPhone.trim() || draft.contactPhone.trim().length < 6) {
      nextErrors.contactPhone = 'Enter a valid contact phone number.';
    }
    if (draft.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.contactEmail.trim())) {
      nextErrors.contactEmail = 'Please enter a valid contact email format.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (goToDocuments: boolean) => {
    if (!validate()) return;
    onSave(
      {
        ...draft,
        legalFullName: draft.legalFullName.trim(),
        documentNumber: draft.documentNumber.trim(),
        contactPhone: draft.contactPhone.trim(),
        contactEmail: draft.contactEmail.trim(),
      },
      goToDocuments
    );
  };

  const handleCountryChange = (code: string) => {
    const matched = COUNTRIES_LIST.find((c) => c.code === code);
    setDraft((prev) => ({
      ...prev,
      countryCode: code,
      countryName: matched ? matched.name : prev.countryName,
    }));
    setErrors((prev) => ({ ...prev, countryCode: undefined }));
  };

  return (
    <section
      data-testid="personal-identity-form"
      className="rounded-3xl bg-[#130728]/95 border border-purple-400/20 p-4 sm:p-6 space-y-5 shadow-xl"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-white">Personal Information</h2>
          <p className="text-xs text-purple-200/65 mt-0.5">
            Sample frontend profile form · Masked in summaries &amp; stored only in this session
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-400/30 text-[11px] font-bold text-purple-200 self-start sm:self-auto">
          <Lock className="w-3 h-3 text-[#FF4D8D]" />
          <span>Masked Summary Protection</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Legal Full Name */}
        <Input
          label="Legal Full Name *"
          data-testid="identity-legal-name-input"
          placeholder="e.g. Ayesha Khan"
          value={draft.legalFullName}
          onChange={(e) => {
            setDraft((prev) => ({ ...prev, legalFullName: e.target.value }));
            setErrors((prev) => ({ ...prev, legalFullName: undefined }));
          }}
          error={errors.legalFullName}
          leftIcon={<User className="w-4 h-4" />}
          className="bg-[#1B0B38] border-purple-400/25 focus:border-[#FF1A6C]"
        />

        {/* 2. Country Selector */}
        <div className="w-full flex flex-col gap-1.5 text-left">
          <label
            htmlFor="identity-country-select"
            className="text-xs font-semibold uppercase tracking-wider text-popo-text-secondary"
          >
            Country *
          </label>
          <div className="relative flex items-center">
            <Globe className="w-4 h-4 text-popo-text-muted absolute left-3.5 pointer-events-none" />
            <select
              id="identity-country-select"
              data-testid="identity-country-select"
              value={draft.countryCode}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full bg-[#1B0B38] text-white text-sm rounded-xl pl-10 pr-4 py-2.5 border border-purple-400/25 outline-none focus:border-[#FF1A6C] focus:ring-2 focus:ring-[#FF1A6C]/20 appearance-none"
            >
              {COUNTRIES_LIST.map((country) => (
                <option key={country.code} value={country.code} className="bg-[#15062B] text-white">
                  {country.flag} {country.name}
                </option>
              ))}
            </select>
          </div>
          {errors.countryCode && (
            <span className="text-xs font-medium text-popo-state-error">{errors.countryCode}</span>
          )}
        </div>

        {/* 3. Date of Birth */}
        <Input
          label="Date of Birth *"
          type="date"
          data-testid="identity-dob-input"
          value={draft.dateOfBirth}
          onChange={(e) => {
            setDraft((prev) => ({ ...prev, dateOfBirth: e.target.value }));
            setErrors((prev) => ({ ...prev, dateOfBirth: undefined }));
          }}
          error={errors.dateOfBirth}
          helperText="Displayed masked (•• / •• / YYYY) in dashboard summary views"
          leftIcon={<Calendar className="w-4 h-4" />}
          className="bg-[#1B0B38] border-purple-400/25 focus:border-[#FF1A6C] [color-scheme:dark]"
        />

        {/* 4. Identity Document Type */}
        <div className="w-full flex flex-col gap-1.5 text-left">
          <label
            htmlFor="identity-doc-type-select"
            className="text-xs font-semibold uppercase tracking-wider text-popo-text-secondary"
          >
            Identity Document Type *
          </label>
          <div className="relative flex items-center">
            <CreditCard className="w-4 h-4 text-popo-text-muted absolute left-3.5 pointer-events-none" />
            <select
              id="identity-doc-type-select"
              data-testid="identity-doc-type-select"
              value={draft.documentType}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  documentType: e.target.value as IdentityDocumentType,
                }))
              }
              className="w-full bg-[#1B0B38] text-white text-sm rounded-xl pl-10 pr-4 py-2.5 border border-purple-400/25 outline-none focus:border-[#FF1A6C] focus:ring-2 focus:ring-[#FF1A6C]/20 appearance-none"
            >
              {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-[#15062B] text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <span className="text-xs text-popo-text-muted">
            Demo display types only; country rules depend on final approved policy
          </span>
        </div>

        {/* 5. Identity Document Number (Masked input with reveal toggle) */}
        <Input
          label="Identity Document Number *"
          type={showDocNumber ? 'text' : 'password'}
          data-testid="identity-doc-number-input"
          placeholder="Sample ID e.g. 42101-7654321-8"
          value={draft.documentNumber}
          onChange={(e) => {
            setDraft((prev) => ({ ...prev, documentNumber: e.target.value }));
            setErrors((prev) => ({ ...prev, documentNumber: undefined }));
          }}
          error={errors.documentNumber}
          helperText="Kept hidden by default and masked in all summary views"
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button
              type="button"
              data-testid="identity-toggle-doc-visibility"
              onClick={() => setShowDocNumber((v) => !v)}
              aria-label={showDocNumber ? 'Mask document number' : 'Show document number'}
              className="p-1 text-purple-200/70 hover:text-white transition-colors"
            >
              {showDocNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          className="bg-[#1B0B38] border-purple-400/25 focus:border-[#FF1A6C]"
        />

        {/* 6. Contact Information */}
        <Input
          label="Contact Phone *"
          type="tel"
          data-testid="identity-contact-phone-input"
          placeholder="e.g. +92 300 5550210"
          value={draft.contactPhone}
          onChange={(e) => {
            setDraft((prev) => ({ ...prev, contactPhone: e.target.value }));
            setErrors((prev) => ({ ...prev, contactPhone: undefined }));
          }}
          error={errors.contactPhone}
          leftIcon={<Phone className="w-4 h-4" />}
          className="bg-[#1B0B38] border-purple-400/25 focus:border-[#FF1A6C]"
        />

        <div className="md:col-span-2">
          <Input
            label="Contact Email (Optional Demo Contact)"
            type="email"
            data-testid="identity-contact-email-input"
            placeholder="host@example.com"
            value={draft.contactEmail}
            onChange={(e) => {
              setDraft((prev) => ({ ...prev, contactEmail: e.target.value }));
              setErrors((prev) => ({ ...prev, contactEmail: undefined }));
            }}
            error={errors.contactEmail}
            leftIcon={<Mail className="w-4 h-4" />}
            className="bg-[#1B0B38] border-purple-400/25 focus:border-[#FF1A6C]"
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="pt-3 border-t border-white/10 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <Button
          type="button"
          variant="ghost"
          size="md"
          data-testid="identity-personal-cancel-btn"
          onClick={onCancel}
          leftIcon={<X className="w-4 h-4" />}
          className="border border-white/10 bg-[#1B0B38]/60 hover:bg-[#27124C]"
        >
          Cancel
        </Button>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <Button
            type="button"
            variant="secondary"
            size="md"
            data-testid="identity-personal-save-btn"
            onClick={() => handleSubmit(false)}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Changes
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            data-testid="identity-personal-continue-btn"
            onClick={() => handleSubmit(true)}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Save &amp; Continue
          </Button>
        </div>
      </div>
    </section>
  );
};
