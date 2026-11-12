'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  FileImage,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  DOCUMENT_TYPE_OPTIONS,
  MAX_DOCUMENT_FILE_SIZE_BYTES,
  buildSampleDocumentPreview,
  formatFileSize,
  getDocumentTypeLabel,
} from './mockEarningIdentityData';
import { IdentityDocumentType, UploadedIdentityFile } from './types';

interface IdentityDocumentSectionProps {
  documentType: IdentityDocumentType;
  frontDocument: UploadedIdentityFile | null;
  backDocument: UploadedIdentityFile | null;
  onChangeDocumentType: (docType: IdentityDocumentType) => void;
  onUpdateDocument: (side: 'front' | 'back', file: UploadedIdentityFile | null) => void;
  onBack: () => void;
  onContinueToReview: () => void;
}

export const IdentityDocumentSection: React.FC<IdentityDocumentSectionProps> = ({
  documentType,
  frontDocument,
  backDocument,
  onChangeDocumentType,
  onUpdateDocument,
  onBack,
  onContinueToReview,
}) => {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const frontInputRef = useRef<HTMLInputElement | null>(null);
  const backInputRef = useRef<HTMLInputElement | null>(null);

  const activeDocMeta =
    DOCUMENT_TYPE_OPTIONS.find((item) => item.id === documentType) || DOCUMENT_TYPE_OPTIONS[0];

  const handleFilePicked = (side: 'front' | 'back', fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;

    if (!(ALLOWED_DOCUMENT_MIME_TYPES as readonly string[]).includes(file.type)) {
      setValidationError(
        `${file.name}: unsupported format. Please select a JPG, PNG, or WebP image for local preview.`
      );
      return;
    }

    if (file.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
      setValidationError(
        `${file.name} (${formatFileSize(file.size)}) exceeds the 5 MB preview limit.`
      );
      return;
    }

    setValidationError(null);
    const objectUrl = URL.createObjectURL(file);
    onUpdateDocument(side, {
      fileName: file.name,
      fileSizeBytes: file.size,
      mimeType: file.type,
      previewUrl: objectUrl,
      uploadedAtLabel: 'Local preview ready',
      isDemoSample: false,
    });
  };

  const handleRemove = (side: 'front' | 'back') => {
    const existing = side === 'front' ? frontDocument : backDocument;
    if (existing?.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(existing.previewUrl);
    }
    onUpdateDocument(side, null);
    if (side === 'front' && frontInputRef.current) frontInputRef.current.value = '';
    if (side === 'back' && backInputRef.current) backInputRef.current.value = '';
  };

  const handleUseSample = (side: 'front' | 'back') => {
    setValidationError(null);
    const sample = buildSampleDocumentPreview(
      side === 'front' ? 'Front' : 'Back',
      getDocumentTypeLabel(documentType)
    );
    onUpdateDocument(side, sample);
  };

  const handleContinue = () => {
    if (!frontDocument) {
      setValidationError('Please select or preview the front side of your identity document first.');
      return;
    }
    if (activeDocMeta.requiresBackSide && !backDocument) {
      setValidationError(
        `Please select or preview the back side for ${activeDocMeta.label} before continuing.`
      );
      return;
    }
    setValidationError(null);
    onContinueToReview();
  };

  const renderSlot = (
    side: 'front' | 'back',
    title: string,
    docFile: UploadedIdentityFile | null,
    inputRef: React.RefObject<HTMLInputElement>
  ) => (
    <div
      data-testid={`document-slot-${side}`}
      className="rounded-2xl bg-[#180A33] border border-purple-400/20 p-4 space-y-3"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileImage className="w-4 h-4 text-[#FF4D8D] shrink-0" />
          <span className="text-sm font-extrabold text-white truncate">{title}</span>
        </div>
        <span
          data-testid={`document-status-${side}`}
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${
            docFile
              ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-300'
              : 'bg-purple-500/15 border-purple-400/30 text-purple-200/75'
          }`}
        >
          {docFile ? docFile.uploadedAtLabel : 'Not Uploaded'}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        data-testid={`document-input-${side}`}
        className="hidden"
        onChange={(e) => handleFilePicked(side, e.target.files)}
      />

      {!docFile ? (
        <div className="rounded-2xl border-2 border-dashed border-purple-400/30 bg-[#120624]/80 p-5 text-center space-y-3">
          <div className="w-11 h-11 rounded-2xl bg-[#FF1A6C]/15 border border-[#FF1A6C]/35 flex items-center justify-center text-[#FF4D8D] mx-auto">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Select local image for {title.toLowerCase()}</p>
            <p className="text-[11px] text-purple-200/60 mt-0.5">
              JPG, PNG, or WebP up to 5 MB · Stays in memory only (never uploaded)
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              data-testid={`document-choose-${side}-btn`}
              onClick={() => inputRef.current?.click()}
              className="px-4 py-2 rounded-full bg-[#FF1A6C] hover:brightness-110 text-white text-xs font-extrabold shadow-glow-pink transition-all"
            >
              Choose Local File
            </button>
            <button
              type="button"
              data-testid={`document-sample-${side}-btn`}
              onClick={() => handleUseSample(side)}
              className="px-3.5 py-2 rounded-full bg-[#241046] hover:bg-[#31175F] border border-purple-400/30 text-purple-100 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Use Sample Preview</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden border border-purple-400/30 bg-[#0D031B]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={docFile.previewUrl}
              alt={`${title} preview`}
              data-testid={`document-preview-img-${side}`}
              className="w-full h-44 sm:h-48 object-contain bg-[#0D031B]"
            />
            <span className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-black/75 border border-white/10 text-[10px] font-bold text-white inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Local Preview Only
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 text-[11px] text-purple-200/75 px-1">
            <span className="truncate font-mono">{docFile.fileName}</span>
            <span className="shrink-0">{formatFileSize(docFile.fileSizeBytes)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid={`document-replace-${side}-btn`}
              onClick={() => inputRef.current?.click()}
              className="flex-1 py-2 px-3 rounded-full bg-[#25124A] hover:bg-[#331966] border border-purple-400/25 text-xs font-bold text-white inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#FF4D8D]" />
              <span>Replace</span>
            </button>
            <button
              type="button"
              data-testid={`document-remove-${side}-btn`}
              onClick={() => handleRemove(side)}
              className="py-2 px-3.5 rounded-full bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/35 text-xs font-bold text-rose-200 inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <section
      data-testid="identity-document-section"
      className="rounded-3xl bg-[#130728]/95 border border-purple-400/20 p-4 sm:p-6 space-y-5 shadow-xl"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-white">Identity Document Section</h2>
          <p className="text-xs text-purple-200/65 mt-0.5">
            Local file selection &amp; temporary image previews only — zero server uploads or permanent storage
          </p>
        </div>

        {(frontDocument || backDocument) && (
          <button
            type="button"
            data-testid="document-open-preview-modal-btn"
            onClick={() => setPreviewModalOpen(true)}
            className="px-3.5 py-1.5 rounded-full bg-[#231045] hover:bg-[#2F165C] border border-purple-400/30 text-xs font-bold text-amber-200 inline-flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview Submission</span>
          </button>
        )}
      </div>

      {/* Temporary Preview Privacy Callout */}
      <div className="rounded-2xl bg-[#1B0C37] border border-amber-400/25 p-3.5 flex items-start gap-2.5 text-xs">
        <ShieldAlert className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
        <p className="text-purple-100/80 leading-relaxed">
          <strong className="text-amber-200">Privacy Note:</strong> Selected files stay exclusively in
          your browser memory for this frontend preview and are discarded when you remove them or close the tab.
        </p>
      </div>

      {/* Document Type Selection */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-purple-200/70">
          Select Document Type
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {DOCUMENT_TYPE_OPTIONS.map((opt) => {
            const active = documentType === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                data-testid={`doc-type-card-${opt.id}`}
                onClick={() => {
                  onChangeDocumentType(opt.id);
                  setValidationError(null);
                }}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  active
                    ? 'bg-[#280F50] border-[#FF1A6C] shadow-glow-pink'
                    : 'bg-[#180A33] border-white/10 hover:border-purple-400/35'
                }`}
              >
                <div className="text-xs font-extrabold text-white">{opt.label}</div>
                <div className="text-[11px] text-purple-200/60 mt-0.5">{opt.subtitle}</div>
              </button>
            );
          })}
        </div>
      </div>

      {validationError && (
        <div
          data-testid="document-validation-error"
          className="rounded-2xl bg-rose-500/15 border border-rose-400/40 px-4 py-3 text-xs font-semibold text-rose-200 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Front & Back Slots */}
      <div className={`grid grid-cols-1 ${activeDocMeta.requiresBackSide ? 'md:grid-cols-2' : ''} gap-4`}>
        {renderSlot('front', `Front Side · ${activeDocMeta.label}`, frontDocument, frontInputRef)}
        {activeDocMeta.requiresBackSide ? (
          renderSlot('back', `Back Side · ${activeDocMeta.label}`, backDocument, backInputRef)
        ) : (
          <div className="rounded-2xl bg-[#170931] border border-white/10 p-4 text-xs text-purple-200/70 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Back side upload is not needed when Passport bio page is selected.</span>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="pt-3 border-t border-white/10 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <Button
          type="button"
          variant="ghost"
          size="md"
          data-testid="document-back-personal-btn"
          onClick={onBack}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          className="border border-white/10 bg-[#1B0B38]/60 hover:bg-[#27124C]"
        >
          Back to Personal Info
        </Button>

        <Button
          type="button"
          variant="primary"
          size="md"
          data-testid="document-continue-review-btn"
          onClick={handleContinue}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Review &amp; Preview Submission
        </Button>
      </div>

      {/* Document Submission Preview Modal */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title="Document Submission Preview"
        subtitle={`${activeDocMeta.label} · Temporary Local Session Preview`}
        maxWidth="lg"
        className="bg-[#120726] border-purple-400/25"
      >
        <div data-testid="document-submission-preview-modal" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {frontDocument && (
              <div className="rounded-2xl bg-[#1A0D35] border border-white/10 p-3 space-y-2">
                <div className="text-xs font-bold text-white">Front Document Preview</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={frontDocument.previewUrl}
                  alt="Front document full preview"
                  className="w-full h-44 object-contain rounded-xl bg-[#0D031B]"
                />
                <div className="text-[11px] text-purple-200/70 truncate">{frontDocument.fileName}</div>
              </div>
            )}
            {activeDocMeta.requiresBackSide && backDocument && (
              <div className="rounded-2xl bg-[#1A0D35] border border-white/10 p-3 space-y-2">
                <div className="text-xs font-bold text-white">Back Document Preview</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={backDocument.previewUrl}
                  alt="Back document full preview"
                  className="w-full h-44 object-contain rounded-xl bg-[#0D031B]"
                />
                <div className="text-[11px] text-purple-200/70 truncate">{backDocument.fileName}</div>
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="primary"
            className="w-full"
            onClick={() => setPreviewModalOpen(false)}
          >
            Close Preview
          </Button>
        </div>
      </Modal>
    </section>
  );
};
