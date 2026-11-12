export type EarningIdentityStatus =
  | 'not_started'
  | 'incomplete'
  | 'submitted'
  | 'under_review'
  | 'verified'
  | 'rejected';

export type IdentityStepId = 'personal' | 'documents' | 'review' | 'status';

export type IdentityViewMode = 'dashboard' | IdentityStepId;

export type IdentityDocumentType = 'national_id' | 'passport' | 'drivers_license';

export interface UploadedIdentityFile {
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  /** Temporary in-memory preview URL (ObjectURL or SVG data URI). Never uploaded or persisted. */
  previewUrl: string;
  uploadedAtLabel: string;
  isDemoSample?: boolean;
}

export interface PersonalIdentityFormData {
  legalFullName: string;
  countryCode: string;
  countryName: string;
  dateOfBirth: string;
  documentType: IdentityDocumentType;
  documentNumber: string;
  contactPhone: string;
  contactEmail: string;
}

export interface HostIdentityHeaderProfile {
  hostName: string;
  username: string;
  hostId: string;
  avatarUrl: string;
}

export interface EarningIdentityState {
  host: HostIdentityHeaderProfile;
  status: EarningIdentityStatus;
  submittedAtLabel: string | null;
  lastUpdatedLabel: string;
  rejectionReasonPlaceholder: string | null;
  form: PersonalIdentityFormData;
  frontDocument: UploadedIdentityFile | null;
  backDocument: UploadedIdentityFile | null;
}

export interface StatusDisplayMeta {
  id: EarningIdentityStatus;
  label: string;
  badgeText: string;
  headline: string;
  description: string;
  nextActionLabel: string;
  pillClasses: string;
  textAccentClass: string;
  progressPercent: number;
}
