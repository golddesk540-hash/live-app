import {
  EarningIdentityState,
  EarningIdentityStatus,
  IdentityDocumentType,
  StatusDisplayMeta,
  UploadedIdentityFile,
} from './types';

export const ALLOWED_DOCUMENT_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_DOCUMENT_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB client preview cap

export const DOCUMENT_TYPE_OPTIONS: {
  id: IdentityDocumentType;
  label: string;
  subtitle: string;
  requiresBackSide: boolean;
}[] = [
  {
    id: 'national_id',
    label: 'National ID Card',
    subtitle: 'Front & back document previews',
    requiresBackSide: true,
  },
  {
    id: 'passport',
    label: 'Passport',
    subtitle: 'Photo bio-page preview only',
    requiresBackSide: false,
  },
  {
    id: 'drivers_license',
    label: "Driver's License",
    subtitle: 'Front & back document previews',
    requiresBackSide: true,
  },
];

export const STATUS_METADATA_MAP: Record<EarningIdentityStatus, StatusDisplayMeta> = {
  not_started: {
    id: 'not_started',
    label: 'Not Started',
    badgeText: 'NOT STARTED',
    headline: 'Identity information has not been started yet',
    description:
      'Add your basic personal details and preview your identity document locally when you are ready to prepare your host earning profile.',
    nextActionLabel: 'Start Identity Setup',
    pillClasses: 'bg-purple-500/15 border-purple-400/35 text-purple-200',
    textAccentClass: 'text-purple-200',
    progressPercent: 10,
  },
  incomplete: {
    id: 'incomplete',
    label: 'Incomplete',
    badgeText: 'PENDING REVIEW',
    headline: 'Some required information is still missing',
    description:
      'Your profile has partial host details saved locally. Complete your date of birth, document number, and document previews to prepare for submission.',
    nextActionLabel: 'Continue Verification',
    pillClasses: 'bg-amber-500/15 border-amber-400/35 text-amber-300',
    textAccentClass: 'text-amber-300',
    progressPercent: 40,
  },
  submitted: {
    id: 'submitted',
    label: 'Submitted',
    badgeText: 'DEMO SUBMITTED',
    headline: 'Local demo verification request submitted',
    description:
      'Your sample identity details and temporary previews were submitted in this frontend session only. No real server upload or real KYC check has occurred.',
    nextActionLabel: 'View Submitted Summary',
    pillClasses: 'bg-cyan-500/15 border-cyan-400/35 text-cyan-300',
    textAccentClass: 'text-cyan-300',
    progressPercent: 85,
  },
  under_review: {
    id: 'under_review',
    label: 'Under Review',
    badgeText: 'UNDER REVIEW',
    headline: 'Sample review state in progress',
    description:
      'This frontend display state illustrates how a host profile looks while awaiting manual review once official verification workflows are approved.',
    nextActionLabel: 'Review Details',
    pillClasses: 'bg-amber-400/20 border-amber-300/45 text-amber-200',
    textAccentClass: 'text-amber-200',
    progressPercent: 90,
  },
  verified: {
    id: 'verified',
    label: 'Verified',
    badgeText: 'VERIFIED (SAMPLE)',
    headline: 'Sample verified display state',
    description:
      'Visual preview of a completed host earning identity profile. Note: this is a frontend sample state only and does not represent real KYC verification.',
    nextActionLabel: 'View Verified Profile',
    pillClasses: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300',
    textAccentClass: 'text-emerald-300',
    progressPercent: 100,
  },
  rejected: {
    id: 'rejected',
    label: 'Rejected',
    badgeText: 'ACTION REQUIRED',
    headline: 'Sample review feedback received',
    description:
      'Example rejection state showing how a host is guided to update unclear document previews or mismatched information before resubmitting.',
    nextActionLabel: 'Edit & Resubmit Demo',
    pillClasses: 'bg-rose-500/20 border-rose-400/45 text-rose-300',
    textAccentClass: 'text-rose-300',
    progressPercent: 55,
  },
};

/**
 * Generates an inline local SVG sample document preview purely in memory
 * so reviewers can test front/back preview states without external storage.
 */
export function buildSampleDocumentPreview(side: 'Front' | 'Back', docType: string): UploadedIdentityFile {
  const accent = side === 'Front' ? '#FF1A6C' : '#A855F7';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="380" viewBox="0 0 640 380">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1E0B3B"/>
        <stop offset="100%" stop-color="#0D031B"/>
      </linearGradient>
    </defs>
    <rect width="640" height="380" rx="28" fill="url(#bg)" stroke="${accent}" stroke-width="4"/>
    <rect x="36" y="34" width="120" height="28" rx="14" fill="${accent}" fill-opacity="0.22"/>
    <text x="96" y="53" fill="#FFFFFF" font-family="Arial,sans-serif" font-size="13" font-weight="bold" text-anchor="middle">${side.toUpperCase()} PREVIEW</text>
    <text x="596" y="53" fill="#C4B5FD" font-family="Arial,sans-serif" font-size="13" text-anchor="end">POPO LIVE DEMO DOC</text>
    <rect x="36" y="92" width="132" height="164" rx="16" fill="#2A1250" stroke="#7E22CE" stroke-opacity="0.5"/>
    <circle cx="102" cy="152" r="30" fill="#FF4D8D" fill-opacity="0.35"/>
    <rect x="66" y="196" width="72" height="36" rx="18" fill="#FF4D8D" fill-opacity="0.25"/>
    <text x="196" y="118" fill="#E9D5FF" font-family="Arial,sans-serif" font-size="18" font-weight="bold">${docType}</text>
    <rect x="196" y="140" width="280" height="16" rx="8" fill="#FFFFFF" fill-opacity="0.22"/>
    <rect x="196" y="172" width="220" height="14" rx="7" fill="#FFFFFF" fill-opacity="0.14"/>
    <rect x="196" y="204" width="250" height="14" rx="7" fill="#FFFFFF" fill-opacity="0.14"/>
    <rect x="36" y="290" width="568" height="54" rx="12" fill="#14072A" stroke="#FFFFFF" stroke-opacity="0.08"/>
    <text x="320" y="322" fill="#FDE68A" font-family="monospace" font-size="15" text-anchor="middle">SAMPLE FRONTEND PREVIEW ONLY · NOT REAL KYC</text>
  </svg>`;

  return {
    fileName: `sample_${docType.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${side.toLowerCase()}.svg`,
    fileSizeBytes: 184320,
    mimeType: 'image/png',
    previewUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    uploadedAtLabel: 'Local preview ready',
    isDemoSample: true,
  };
}

export function createInitialEarningIdentityState(): EarningIdentityState {
  return {
    host: {
      hostName: 'Ayesha Khan',
      username: '@ayesha.live',
      hostId: '20845176',
      avatarUrl:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=180&auto=format&fit=crop&q=80',
    },
    status: 'incomplete',
    submittedAtLabel: null,
    lastUpdatedLabel: 'Updated in local session',
    rejectionReasonPlaceholder: null,
    form: {
      legalFullName: 'Ayesha Khan',
      countryCode: 'PK',
      countryName: 'Pakistan',
      dateOfBirth: '',
      documentType: 'national_id',
      documentNumber: '',
      contactPhone: '+92 300 5550210',
      contactEmail: 'ayesha.demo@kigolive.com',
    },
    frontDocument: null,
    backDocument: null,
  };
}

export function createPresetIdentityState(status: EarningIdentityStatus): EarningIdentityState {
  const base = createInitialEarningIdentityState();

  if (status === 'not_started') {
    return {
      ...base,
      status: 'not_started',
      submittedAtLabel: null,
      rejectionReasonPlaceholder: null,
      form: {
        ...base.form,
        legalFullName: '',
        dateOfBirth: '',
        documentNumber: '',
        contactPhone: '',
      },
      frontDocument: null,
      backDocument: null,
    };
  }

  if (status === 'incomplete') {
    return base;
  }

  const completedForm = {
    ...base.form,
    legalFullName: 'Ayesha Khan',
    countryCode: 'PK',
    countryName: 'Pakistan',
    dateOfBirth: '1998-06-14',
    documentType: 'national_id' as IdentityDocumentType,
    documentNumber: '42101-7654321-8',
    contactPhone: '+92 300 5550210',
    contactEmail: 'ayesha.demo@kigolive.com',
  };

  return {
    ...base,
    status,
    submittedAtLabel: 'Nov 12, 2026 · 11:45 AM (Sample)',
    rejectionReasonPlaceholder:
      status === 'rejected'
        ? 'Placeholder note: Sample document preview appears slightly cropped on the bottom edge. Re-select a clear, uncropped preview and update your personal info to resubmit in demo mode.'
        : null,
    form: completedForm,
    frontDocument: buildSampleDocumentPreview('Front', 'National ID Card'),
    backDocument: buildSampleDocumentPreview('Back', 'National ID Card'),
  };
}

export function maskDocumentNumber(docNumber: string): string {
  const cleaned = docNumber.trim();
  if (!cleaned) return 'Not provided';
  if (cleaned.length <= 4) return '••••';
  const visibleTail = cleaned.slice(-3);
  return `${'•'.repeat(Math.min(10, Math.max(4, cleaned.length - 3)))}${visibleTail}`;
}

export function maskDateOfBirth(dob: string): string {
  const cleaned = dob.trim();
  if (!cleaned) return '•• / •• / ••••';
  const parts = cleaned.split('-');
  if (parts.length === 3) {
    return `•• / •• / ${parts[0]}`;
  }
  return '•• / •• / ••••';
}

export function maskContactPhone(phone: string): string {
  const cleaned = phone.trim();
  if (!cleaned) return 'Not provided';
  if (cleaned.length <= 4) return '••••';
  return `${cleaned.slice(0, 4)} ••••• ${cleaned.slice(-3)}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function getDocumentTypeLabel(docType: IdentityDocumentType): string {
  return DOCUMENT_TYPE_OPTIONS.find((item) => item.id === docType)?.label || 'Identity Document';
}
