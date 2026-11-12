'use client';

import React, { useRef } from 'react';
import {
  ImagePlus,
  Video,
  X,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Film,
  Sparkles,
  FileWarning,
  CheckCircle2,
} from 'lucide-react';
import {
  SAMPLE_CREATE_PHOTOS,
  SAMPLE_CREATE_VIDEO_POSTER,
  SelectedPhotoItem,
  SelectedVideoItem,
} from './types';

const MAX_PHOTOS = 6;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB
const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return 'Demo preset';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '00:18';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

interface PhotoAttachmentEditorProps {
  photos: SelectedPhotoItem[];
  mediaError: string | null;
  onAddPhotoFiles: (files: FileList) => void;
  onAddSamplePhotos: (count: number) => void;
  onRemovePhoto: (id: string) => void;
  onReorderPhoto: (index: number, direction: -1 | 1) => void;
  onClearAllPhotos: () => void;
}

export const PhotoAttachmentEditor: React.FC<PhotoAttachmentEditorProps> = ({
  photos,
  mediaError,
  onAddPhotoFiles,
  onAddSamplePhotos,
  onRemovePhoto,
  onReorderPhoto,
  onClearAllPhotos,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div
      data-testid="create-photo-editor"
      className="rounded-3xl bg-[#130628]/95 border border-purple-400/20 p-4 sm:p-5 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-extrabold text-white">Photo Attachments</h3>
          <p className="text-xs text-purple-200/65">
            Select up to {MAX_PHOTOS} images (JPG, PNG, WEBP, GIF • max 10 MB each). Drag-free reorder arrows included.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={SUPPORTED_IMAGE_TYPES.join(',')}
            multiple
            data-testid="create-photo-file-input"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onAddPhotoFiles(e.target.files);
              }
              e.target.value = '';
            }}
          />
          <button
            type="button"
            data-testid="create-add-photos-btn"
            disabled={photos.length >= MAX_PHOTOS}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gradient-to-r from-[#FF1A6C] to-[#EC4899] text-white text-xs font-extrabold shadow-glow-pink hover:brightness-110 disabled:opacity-45 transition-all"
          >
            <ImagePlus className="w-3.5 h-3.5" />
            <span>Add Photos ({photos.length}/{MAX_PHOTOS})</span>
          </button>

          {photos.length > 0 && (
            <button
              type="button"
              data-testid="create-clear-photos-btn"
              onClick={onClearAllPhotos}
              className="px-3 py-2 rounded-full bg-[#1F0F3D] hover:bg-red-500/15 border border-white/10 text-xs font-bold text-red-300 transition-colors"
            >
              Remove All
            </button>
          )}
        </div>
      </div>

      {mediaError && (
        <div
          data-testid="create-media-error"
          className="rounded-2xl bg-red-500/15 border border-red-400/40 px-3.5 py-2.5 flex items-start gap-2 text-xs text-red-200"
        >
          <FileWarning className="w-4 h-4 text-red-300 shrink-0 mt-0.5" />
          <span>{mediaError}</span>
        </div>
      )}

      {photos.length === 0 ? (
        <div
          data-testid="create-photo-empty"
          className="rounded-2xl border-2 border-dashed border-purple-400/25 bg-[#0D041E]/75 p-6 text-center space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#271149] text-[#FF4D8D] mx-auto flex items-center justify-center">
            <ImagePlus className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">No photos selected yet</p>
            <p className="text-xs text-purple-200/60 mt-0.5">
              Choose single or multiple photos from your device for local preview — nothing is uploaded to a server.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-4 py-1.5 rounded-full bg-[#FF1A6C] text-white text-xs font-bold hover:brightness-110 transition-all"
            >
              Choose Device Photos
            </button>
            <button
              type="button"
              data-testid="create-use-sample-photos-btn"
              onClick={() => onAddSamplePhotos(2)}
              className="px-4 py-1.5 rounded-full bg-[#211042] hover:bg-[#2E175A] border border-purple-400/25 text-purple-100 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FF4D8D]" />
              <span>Try Sample Gallery ({SAMPLE_CREATE_PHOTOS.length} available)</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          data-testid="create-photo-grid"
          className={`grid gap-3 ${
            photos.length === 1 ? 'grid-cols-1 max-w-md' : 'grid-cols-2 sm:grid-cols-3'
          }`}
        >
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              data-testid={`create-photo-item-${index}`}
              className="group relative rounded-2xl overflow-hidden bg-[#0E051E] border border-purple-400/25 shadow-lg"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.objectUrl}
                alt={photo.name}
                className={`w-full object-cover ${photos.length === 1 ? 'h-64' : 'h-40'}`}
              />

              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[10px] font-black text-white border border-white/15">
                #{index + 1}
              </span>

              <button
                type="button"
                data-testid={`create-remove-photo-${index}`}
                onClick={() => onRemovePhoto(photo.id)}
                aria-label={`Remove ${photo.name}`}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/80 hover:bg-[#FF1A6C] text-white flex items-center justify-center border border-white/20 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="px-2.5 py-2 bg-[#110624]/95 border-t border-white/10 flex items-center justify-between gap-1.5">
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-white truncate">{photo.name}</div>
                  <div className="text-[10px] text-purple-200/55">{formatBytes(photo.sizeBytes)}</div>
                </div>

                {photos.length > 1 && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      data-testid={`create-reorder-left-${index}`}
                      disabled={index === 0}
                      onClick={() => onReorderPhoto(index, -1)}
                      aria-label={`Move ${photo.name} earlier`}
                      className="p-1 rounded-full bg-white/5 hover:bg-white/15 disabled:opacity-30 text-purple-100"
                    >
                      <ArrowLeft className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      data-testid={`create-reorder-right-${index}`}
                      disabled={index === photos.length - 1}
                      onClick={() => onReorderPhoto(index, 1)}
                      aria-label={`Move ${photo.name} later`}
                      className="p-1 rounded-full bg-white/5 hover:bg-white/15 disabled:opacity-30 text-purple-100"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface VideoAttachmentEditorProps {
  video: SelectedVideoItem | null;
  mediaError: string | null;
  onSelectVideoFile: (file: File) => void;
  onUseSampleVideo: () => void;
  onUpdateVideoTitle: (title: string) => void;
  onRemoveVideo: () => void;
}

export const VideoAttachmentEditor: React.FC<VideoAttachmentEditorProps> = ({
  video,
  mediaError,
  onSelectVideoFile,
  onUseSampleVideo,
  onUpdateVideoTitle,
  onRemoveVideo,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div
      data-testid="create-video-editor"
      className="rounded-3xl bg-[#130628]/95 border border-purple-400/20 p-4 sm:p-5 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-extrabold text-white">Video Attachment</h3>
          <p className="text-xs text-purple-200/65">
            MP4, WebM, or MOV under 100 MB. Local browser playback & poster preview only.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={SUPPORTED_VIDEO_TYPES.join(',')}
            data-testid="create-video-file-input"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onSelectVideoFile(file);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            data-testid="create-select-video-btn"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gradient-to-r from-[#FF1A6C] to-[#EC4899] text-white text-xs font-extrabold shadow-glow-pink hover:brightness-110 transition-all"
          >
            <Video className="w-3.5 h-3.5" />
            <span>{video ? 'Replace Video' : 'Select Video'}</span>
          </button>

          {video && (
            <button
              type="button"
              data-testid="create-remove-video-btn"
              onClick={onRemoveVideo}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-[#1F0F3D] hover:bg-red-500/15 border border-white/10 text-xs font-bold text-red-300 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Video</span>
            </button>
          )}
        </div>
      </div>

      {mediaError && (
        <div
          data-testid="create-media-error"
          className="rounded-2xl bg-red-500/15 border border-red-400/40 px-3.5 py-2.5 flex items-start gap-2 text-xs text-red-200"
        >
          <FileWarning className="w-4 h-4 text-red-300 shrink-0 mt-0.5" />
          <span>{mediaError}</span>
        </div>
      )}

      {!video ? (
        <div
          data-testid="create-video-empty"
          className="rounded-2xl border-2 border-dashed border-purple-400/25 bg-[#0D041E]/75 p-6 text-center space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#271149] text-[#FF4D8D] mx-auto flex items-center justify-center">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">No video selected yet</p>
            <p className="text-xs text-purple-200/60 mt-0.5">
              Select a short clip from your device to inspect file details, thumbnail, and local video player.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-4 py-1.5 rounded-full bg-[#FF1A6C] text-white text-xs font-bold hover:brightness-110 transition-all"
            >
              Select Device Video
            </button>
            <button
              type="button"
              data-testid="create-use-sample-video-btn"
              onClick={onUseSampleVideo}
              className="px-4 py-1.5 rounded-full bg-[#211042] hover:bg-[#2E175A] border border-purple-400/25 text-purple-100 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FF4D8D]" />
              <span>Load Demo Stage Clip</span>
            </button>
          </div>
        </div>
      ) : (
        <div data-testid="create-video-preview-card" className="space-y-3">
          {/* Playable Video Player or Poster Preview */}
          <div className="overflow-hidden rounded-2xl border border-purple-400/30 bg-black relative">
            {video.objectUrl && !video.objectUrl.startsWith('poster-demo://') ? (
              <video
                data-testid="create-video-player"
                src={video.objectUrl}
                poster={video.posterDataUrl}
                controls
                playsInline
                className="w-full max-h-72 object-contain bg-black"
              />
            ) : (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={video.posterDataUrl || SAMPLE_CREATE_VIDEO_POSTER}
                  alt={video.title}
                  className="w-full h-56 object-cover brightness-90"
                />
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1.5 text-white">
                  <div className="px-3.5 py-1.5 rounded-full bg-[#FF1A6C] text-xs font-extrabold shadow-glow-pink inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Demo Stage Clip Ready ({video.durationFormatted})</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* File Info Badges */}
          <div
            data-testid="create-video-file-info"
            className="rounded-2xl bg-[#1A0D35] border border-white/10 p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs"
          >
            <div>
              <div className="text-[10px] uppercase tracking-wider text-purple-200/50 font-bold">File Name</div>
              <div className="font-bold text-white truncate mt-0.5">{video.name}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-purple-200/50 font-bold">Format</div>
              <div className="font-bold text-purple-100 truncate mt-0.5">{video.mimeType}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-purple-200/50 font-bold">File Size</div>
              <div className="font-bold text-emerald-300 mt-0.5">{formatBytes(video.sizeBytes)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-purple-200/50 font-bold">Duration / Res</div>
              <div className="font-bold text-amber-300 mt-0.5">
                {video.durationFormatted} {video.resolution ? `• ${video.resolution}` : ''}
              </div>
            </div>
          </div>

          {/* Optional Clip Title */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-purple-200/65 mb-1">
              Clip Title (Optional)
            </label>
            <input
              type="text"
              value={video.title}
              maxLength={80}
              data-testid="create-video-title-input"
              onChange={(e) => onUpdateVideoTitle(e.target.value)}
              placeholder="Give your highlight clip a title..."
              className="w-full bg-[#0C041C] text-white placeholder:text-purple-200/40 text-xs sm:text-sm rounded-2xl px-3.5 py-2.5 border border-purple-400/20 focus:border-[#FF1A6C] outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const PHOTO_VALIDATION = { MAX_PHOTOS, MAX_PHOTO_BYTES, SUPPORTED_IMAGE_TYPES };
export const VIDEO_VALIDATION = { MAX_VIDEO_BYTES, SUPPORTED_VIDEO_TYPES };
