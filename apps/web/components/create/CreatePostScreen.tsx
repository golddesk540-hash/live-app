'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Pencil,
  Image as ImageIcon,
  Video as VideoIcon,
  Globe,
  Users,
  Lock,
  Smile,
  Trash2,
  Eye,
  Send,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Crown,
  Radio,
  AlertCircle,
  Hash,
  Home,
  Compass,
  MessageCircle,
  User,
} from 'lucide-react';
import { SQUARE_CREATORS } from '@/components/square/mockSquareData';
import { SquarePostCard } from '@/components/square/SquarePostCard';
import { SquarePostItem } from '@/components/square/types';
import {
  createFallbackCardPoster,
  extractHashtags,
  fileToCompactDataUrl,
  saveLocalSquarePost,
} from '@/components/square/squareLocalStore';
import { Button } from '@/components/ui/Button';
import {
  CreateAudience,
  CreatePostType,
  SAMPLE_CREATE_PHOTOS,
  SAMPLE_CREATE_VIDEO_POSTER,
  SelectedPhotoItem,
  SelectedVideoItem,
} from './types';
import {
  formatDuration,
  PHOTO_VALIDATION,
  PhotoAttachmentEditor,
  VIDEO_VALIDATION,
  VideoAttachmentEditor,
} from './MediaAttachmentEditors';

const MAX_CAPTION_CHARS = 500;
const EMOJI_PALETTE = ['✨', '🔥', '💜', '🎤', '👑', '🎉', '🎵', '💫', '🥳', '👏', '❤️', '📸'];
const QUICK_HASHTAGS = ['#PopoLive', '#PopoFamily', '#AcousticNight', '#LiveLounge', '#SquareMoments'];

const POST_TYPE_OPTIONS: {
  id: CreatePostType;
  title: string;
  subtitle: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'text', title: 'Text post', subtitle: 'Share an update', Icon: Pencil },
  { id: 'photo', title: 'Photo post', subtitle: 'Add photos to your post', Icon: ImageIcon },
  { id: 'video', title: 'Video post', subtitle: 'Share a short video', Icon: VideoIcon },
];

const AUDIENCE_OPTIONS: {
  id: CreateAudience;
  label: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'Public', label: 'Public', description: 'Visible on Popo Square', Icon: Globe },
  { id: 'Following', label: 'Following', description: 'Visible to followers', Icon: Users },
  { id: 'Private', label: 'Private', description: 'Local draft (Only me)', Icon: Lock },
];

export const CreatePostScreen: React.FC = () => {
  const activeUser = SQUARE_CREATORS.ayesha;

  const [postType, setPostType] = useState<CreatePostType>('text');
  const [caption, setCaption] = useState('');
  const [audience, setAudience] = useState<CreateAudience>('Public');
  const [photos, setPhotos] = useState<SelectedPhotoItem[]>([]);
  const [video, setVideo] = useState<SelectedVideoItem | null>(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'published'>('edit');
  const [publishedPost, setPublishedPost] = useState<SquarePostItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const captionRef = useRef<HTMLTextAreaElement | null>(null);
  const activeBlobUrlsRef = useRef<Set<string>>(new Set());

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const registerBlobUrl = (url: string) => {
    if (url.startsWith('blob:')) {
      activeBlobUrlsRef.current.add(url);
    }
  };

  const revokeBlobUrl = (url?: string) => {
    if (!url || !url.startsWith('blob:')) return;
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore invalid object URL errors
    }
    activeBlobUrlsRef.current.delete(url);
  };

  // Release any remaining object URLs cleanly on unmount
  useEffect(() => {
    const tracked = activeBlobUrlsRef.current;
    return () => {
      tracked.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      });
      tracked.clear();
    };
  }, []);

  const handleSelectPostType = (nextType: CreatePostType) => {
    setPostType(nextType);
    setValidationError(null);
    setMediaError(null);
  };

  const handleAppendEmoji = (emoji: string) => {
    setCaption((prev) => {
      const next = `${prev}${emoji}`;
      return next.slice(0, MAX_CAPTION_CHARS + 50);
    });
    setValidationError(null);
  };

  const handleAppendHashtag = (tag: string) => {
    setCaption((prev) => {
      if (prev.toLowerCase().includes(tag.toLowerCase())) return prev;
      const sep = prev.trim().length > 0 && !prev.endsWith(' ') ? ' ' : '';
      return `${prev}${sep}${tag}`.slice(0, MAX_CAPTION_CHARS + 50);
    });
    setValidationError(null);
  };

  const handleAddPhotoFiles = async (fileList: FileList) => {
    setMediaError(null);
    setValidationError(null);
    const incoming = Array.from(fileList);
    if (incoming.length === 0) return;

    const remainingSlots = PHOTO_VALIDATION.MAX_PHOTOS - photos.length;
    if (remainingSlots <= 0) {
      setMediaError(`Maximum ${PHOTO_VALIDATION.MAX_PHOTOS} photos allowed per post.`);
      return;
    }

    const accepted: SelectedPhotoItem[] = [];
    const errors: string[] = [];

    for (const file of incoming.slice(0, remainingSlots)) {
      if (!PHOTO_VALIDATION.SUPPORTED_IMAGE_TYPES.includes(file.type)) {
        errors.push(`${file.name}: unsupported image format.`);
        continue;
      }
      if (file.size > PHOTO_VALIDATION.MAX_PHOTO_BYTES) {
        errors.push(`${file.name}: exceeds 10 MB limit.`);
        continue;
      }

      const objectUrl = URL.createObjectURL(file);
      registerBlobUrl(objectUrl);
      const compactDataUrl = await fileToCompactDataUrl(file);
      accepted.push({
        id: `photo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        sizeBytes: file.size,
        mimeType: file.type,
        objectUrl,
        compactDataUrl: compactDataUrl || undefined,
      });
    }

    if (incoming.length > remainingSlots) {
      errors.push(`Only ${remainingSlots} additional photo(s) were added (max ${PHOTO_VALIDATION.MAX_PHOTOS}).`);
    }

    if (errors.length > 0) {
      setMediaError(errors.join(' '));
    }
    if (accepted.length > 0) {
      setPhotos((prev) => [...prev, ...accepted]);
      setPostType('photo');
      showToast(`Added ${accepted.length} photo${accepted.length > 1 ? 's' : ''}`);
    }
  };

  const handleAddSamplePhotos = (count: number) => {
    setMediaError(null);
    setValidationError(null);
    const remainingSlots = PHOTO_VALIDATION.MAX_PHOTOS - photos.length;
    if (remainingSlots <= 0) {
      setMediaError(`Maximum ${PHOTO_VALIDATION.MAX_PHOTOS} photos already attached.`);
      return;
    }

    const candidates = SAMPLE_CREATE_PHOTOS.filter(
      (sample) => !photos.some((existing) => existing.objectUrl === sample.url)
    ).slice(0, Math.min(count, remainingSlots));

    const toAdd = (candidates.length > 0 ? candidates : SAMPLE_CREATE_PHOTOS.slice(0, Math.min(count, remainingSlots))).map(
      (sample, idx) => ({
        id: `sample_${Date.now()}_${idx}`,
        name: sample.name,
        sizeBytes: 0,
        mimeType: 'image/jpeg',
        objectUrl: sample.url,
        compactDataUrl: sample.url,
      })
    );

    if (toAdd.length > 0) {
      setPhotos((prev) => [...prev, ...toAdd]);
      setPostType('photo');
      showToast(`Loaded ${toAdd.length} sample gallery photo${toAdd.length > 1 ? 's' : ''}`);
    }
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) revokeBlobUrl(target.objectUrl);
      return prev.filter((p) => p.id !== id);
    });
    setMediaError(null);
  };

  const handleReorderPhoto = (index: number, direction: -1 | 1) => {
    setPhotos((prev) => {
      const targetIdx = index + direction;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(targetIdx, 0, moved);
      return copy;
    });
  };

  const handleClearAllPhotos = () => {
    photos.forEach((p) => revokeBlobUrl(p.objectUrl));
    setPhotos([]);
    setMediaError(null);
  };

  const handleSelectVideoFile = (file: File) => {
    setMediaError(null);
    setValidationError(null);

    if (!VIDEO_VALIDATION.SUPPORTED_VIDEO_TYPES.includes(file.type)) {
      setMediaError('Unsupported video format. Please choose an MP4, WebM, or MOV video file.');
      return;
    }

    if (file.size > VIDEO_VALIDATION.MAX_VIDEO_BYTES) {
      setMediaError('Video file exceeds the 100 MB local preview limit. Please choose a smaller clip.');
      return;
    }

    if (video) {
      revokeBlobUrl(video.objectUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    registerBlobUrl(objectUrl);
    const fallbackPoster = createFallbackCardPoster(activeUser.name, file.name);
    const initialTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
    const videoId = `vid_${Date.now()}`;

    const item: SelectedVideoItem = {
      id: videoId,
      name: file.name,
      sizeBytes: file.size,
      mimeType: file.type,
      objectUrl,
      posterDataUrl: fallbackPoster,
      durationFormatted: '00:15',
      title: initialTitle,
    };

    setVideo(item);
    setPostType('video');
    showToast(`Selected video: ${file.name}`);

    // Probe browser <video> metadata & first frame thumbnail asynchronously if codec decodes
    try {
      const probe = document.createElement('video');
      probe.preload = 'metadata';
      probe.muted = true;
      probe.src = objectUrl;
      probe.onloadedmetadata = () => {
        const formatted = formatDuration(probe.duration);
        const res = probe.videoWidth && probe.videoHeight ? `${probe.videoWidth}x${probe.videoHeight}` : undefined;
        setVideo((curr) => (curr && curr.id === videoId ? { ...curr, durationFormatted: formatted, resolution: res } : curr));
        if (probe.duration > 0) {
          probe.currentTime = Math.min(0.25, probe.duration / 2);
        }
      };
      probe.onseeked = () => {
        try {
          if (!probe.videoWidth || !probe.videoHeight) return;
          const canvas = document.createElement('canvas');
          const scale = Math.min(1, 720 / probe.videoWidth);
          canvas.width = Math.max(1, Math.round(probe.videoWidth * scale));
          canvas.height = Math.max(1, Math.round(probe.videoHeight * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(probe, 0, 0, canvas.width, canvas.height);
          const poster = canvas.toDataURL('image/jpeg', 0.8);
          if (poster.length > 64) {
            setVideo((curr) => (curr && curr.id === videoId ? { ...curr, posterDataUrl: poster } : curr));
          }
        } catch {
          // keep generated fallback poster
        }
      };
    } catch {
      // keep default metadata
    }
  };

  const handleUseSampleVideo = () => {
    setMediaError(null);
    setValidationError(null);
    if (video) revokeBlobUrl(video.objectUrl);

    setVideo({
      id: `sample_vid_${Date.now()}`,
      name: 'evening_lounge_clip.mp4',
      sizeBytes: 4.8 * 1024 * 1024,
      mimeType: 'video/mp4',
      objectUrl: 'poster-demo://stage-clip',
      posterDataUrl: SAMPLE_CREATE_VIDEO_POSTER,
      durationFormatted: '00:24',
      resolution: '1080x1920',
      title: 'Evening Stage Highlight',
    });
    setPostType('video');
    showToast('Loaded demo video highlight');
  };

  const handleRemoveVideo = () => {
    if (video) revokeBlobUrl(video.objectUrl);
    setVideo(null);
    setMediaError(null);
  };

  const handleClearForm = () => {
    photos.forEach((p) => revokeBlobUrl(p.objectUrl));
    if (video) revokeBlobUrl(video.objectUrl);
    setCaption('');
    setPhotos([]);
    setVideo(null);
    setAudience('Public');
    setValidationError(null);
    setMediaError(null);
    setShowEmojiPicker(false);
    setViewMode('edit');
    showToast('Composer cleared');
  };

  const validateBeforeContinue = (): boolean => {
    const trimmed = caption.trim();
    if (caption.length > MAX_CAPTION_CHARS) {
      setValidationError(`Post text exceeds the ${MAX_CAPTION_CHARS}-character limit. Please shorten it slightly.`);
      return false;
    }

    if (postType === 'text' && trimmed.length === 0) {
      setValidationError('Please write something to share before previewing or publishing a Text Post.');
      return false;
    }

    if (postType === 'photo' && photos.length === 0) {
      setValidationError('Please select at least 1 photo (or try Sample Gallery) for your Photo Post.');
      return false;
    }

    if (postType === 'video' && !video) {
      setValidationError('Please select a video file (or load the Demo Stage Clip) for your Video Post.');
      return false;
    }

    setValidationError(null);
    return true;
  };

  const buildPreviewPostItem = (forPersistence: boolean): SquarePostItem => {
    const cleanText = caption.trim();
    const hashtags = extractHashtags(cleanText);
    const defaultCaption =
      postType === 'photo'
        ? 'Shared a new photo update on Popo Live Square ✨'
        : postType === 'video'
        ? 'Check out this short video highlight on Popo Live ✨'
        : '';

    const finalText = cleanText || defaultCaption;
    const resolvedImages = photos.map((p) =>
      forPersistence ? p.compactDataUrl || createFallbackCardPoster(activeUser.name, p.name) : p.objectUrl
    );

    let mediaType: SquarePostItem['mediaType'] = 'none';
    if (postType === 'photo' && resolvedImages.length > 0) {
      mediaType =
        resolvedImages.length === 1 ? 'single_image' : resolvedImages.length === 2 ? 'two_images' : 'multi_images';
    } else if (postType === 'video' && video) {
      mediaType = 'video';
    }

    return {
      id: `post_created_${Date.now()}`,
      creator: activeUser,
      publishedAgo: 'Just now',
      visibility: audience,
      text: finalText,
      hashtags: hashtags.length > 0 ? hashtags : ['#PopoSquare'],
      mediaType,
      images: postType === 'photo' ? resolvedImages : undefined,
      videoThumbnailUrl:
        postType === 'video' && video
          ? video.posterDataUrl || SAMPLE_CREATE_VIDEO_POSTER
          : undefined,
      videoPreviewUrl:
        !forPersistence && postType === 'video' && video && !video.objectUrl.startsWith('poster-demo://')
          ? video.objectUrl
          : undefined,
      videoDuration: postType === 'video' && video ? video.durationFormatted : undefined,
      videoTitle:
        postType === 'video' && video ? video.title.trim() || 'Community Video Highlight' : undefined,
      likesCount: 0,
      isLiked: false,
      isSaved: false,
      sharesCount: 0,
      comments: [],
      categoryScore: 550,
    };
  };

  const previewPost = useMemo(() => buildPreviewPostItem(false), [
    postType,
    caption,
    audience,
    photos,
    video,
    activeUser,
  ]);

  const handleOpenPreview = () => {
    if (!validateBeforeContinue()) return;
    setViewMode('preview');
  };

  const handlePublishPost = () => {
    if (!validateBeforeContinue()) return;

    const persistentPost = buildPreviewPostItem(true);
    saveLocalSquarePost(persistentPost);

    // Release active editor blob URLs once saved cleanly with compact posters/DataURLs
    photos.forEach((p) => revokeBlobUrl(p.objectUrl));
    if (video) revokeBlobUrl(video.objectUrl);

    setPublishedPost(persistentPost);
    setPhotos([]);
    setVideo(null);
    setCaption('');
    setShowEmojiPicker(false);
    setViewMode('published');
    showToast('Demo post published to local Square feed');
  };

  const charCount = caption.length;
  const isOverLimit = charCount > MAX_CAPTION_CHARS;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#130626] via-[#0B0418] to-[#070312] text-white flex flex-col pb-28 lg:pb-12">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-[#120624]/92 backdrop-blur-xl border-b border-purple-400/15">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href="/square"
              data-testid="create-back-btn"
              aria-label="Back to Square"
              className="p-2 rounded-full bg-[#1E0F3B] hover:bg-[#2A1652] text-purple-100 border border-white/10 transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <Link href="/" className="flex items-center gap-2 group whitespace-nowrap shrink-0">
              <div className="w-8 h-8 rounded-full border-2 border-purple-200/80 bg-[#1D0D39] flex items-center justify-center shadow-glow-pink group-hover:scale-105 transition-transform shrink-0">
                <span className="w-3.5 h-3.5 rounded-full bg-white shadow-sm" />
              </div>
              <span className="text-base sm:text-lg font-black tracking-tight text-white whitespace-nowrap">
                Popo <span className="text-[#FF1A6C]">Live</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {viewMode === 'edit' && (
              <>
                <button
                  type="button"
                  data-testid="create-clear-btn"
                  onClick={handleClearForm}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-xs font-bold text-purple-200/85 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>

                <button
                  type="button"
                  data-testid="create-preview-btn"
                  onClick={handleOpenPreview}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-[#221044] hover:bg-[#2D1658] border border-purple-400/25 text-xs font-extrabold text-white transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-[#FF4D8D]" />
                  <span>Preview</span>
                </button>

                <button
                  type="button"
                  data-testid="create-publish-btn"
                  onClick={handlePublishPost}
                  className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FF1A6C] to-[#D946EF] text-white text-xs font-extrabold shadow-glow-pink hover:brightness-110 active:scale-95 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish</span>
                </button>
              </>
            )}

            {viewMode === 'preview' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="create-header-edit-btn"
                  onClick={() => setViewMode('edit')}
                >
                  Edit Post
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  data-testid="create-header-publish-btn"
                  onClick={handlePublishPost}
                >
                  Publish
                </Button>
              </>
            )}

            {viewMode === 'published' && (
              <Link
                href="/square"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FF1A6C] text-white text-xs font-extrabold shadow-glow-pink"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Open Square</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {viewMode === 'published' && publishedPost ? (
          <section data-testid="create-published-view" className="max-w-2xl mx-auto space-y-5">
            <div className="rounded-3xl bg-gradient-to-br from-[#230B45] to-[#120624] border border-emerald-400/35 p-6 text-center space-y-3 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-black text-white">Post Added to Local Square Feed</h1>
              <p className="text-xs sm:text-sm text-purple-200/80 leading-relaxed max-w-md mx-auto">
                Your demo post is ready and saved locally in browser storage so you can see it right inside Square immediately. No server upload was performed.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  href="/square"
                  data-testid="create-view-in-square-btn"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#FF1A6C] to-[#D946EF] text-white text-xs sm:text-sm font-extrabold shadow-glow-pink hover:brightness-110 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>View in Square Feed</span>
                </Link>
                <button
                  type="button"
                  data-testid="create-another-btn"
                  onClick={() => {
                    setPublishedPost(null);
                    setViewMode('edit');
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/15 text-xs sm:text-sm font-bold text-white transition-colors"
                >
                  <Pencil className="w-4 h-4 text-[#FF4D8D]" />
                  <span>Create Another Post</span>
                </button>
              </div>
            </div>

            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-purple-200/60 mb-2 px-1">
                Published Local Card Preview
              </div>
              <SquarePostCard
                post={publishedPost}
                isFollowed
                onToggleLike={() => showToast('Open Square Feed to interact with live likes')}
                onToggleSave={() => showToast('Open Square Feed to bookmark')}
                onToggleFollow={() => {}}
                onOpenComments={() => showToast('Open Square Feed for comments')}
                onOpenShare={() => showToast('Open Square Feed to share')}
                onOpenReport={() => {}}
                onHidePost={() => {}}
                onCopyLink={() => showToast('Demo post link ready')}
                onPreviewCreator={() => {}}
                onPreviewMedia={() => {}}
              />
            </div>
          </section>
        ) : viewMode === 'preview' ? (
          <section data-testid="create-preview-screen" className="max-w-2xl mx-auto space-y-5">
            <div className="rounded-3xl bg-[#110523]/90 border border-purple-400/20 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white">Post Preview</h1>
                <p className="text-xs text-purple-200/70 mt-0.5">
                  Previewing exactly how your post will render inside Popo Live Square ({audience}).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-testid="create-edit-from-preview-btn"
                  onClick={() => setViewMode('edit')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1E0F3D] hover:bg-[#2A1554] border border-white/15 text-xs font-bold text-white transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5 text-[#FF4D8D]" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  data-testid="create-publish-from-preview-btn"
                  onClick={handlePublishPost}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#FF1A6C] to-[#D946EF] text-white text-xs font-extrabold shadow-glow-pink hover:brightness-110 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish Locally</span>
                </button>
              </div>
            </div>

            <div data-testid="create-preview-card-wrapper">
              <SquarePostCard
                post={previewPost}
                isFollowed
                onToggleLike={() => showToast('Preview mode: likes activate after publishing')}
                onToggleSave={() => showToast('Preview mode')}
                onToggleFollow={() => {}}
                onOpenComments={() => showToast('Preview mode')}
                onOpenShare={() => showToast('Preview mode')}
                onOpenReport={() => {}}
                onHidePost={() => {}}
                onCopyLink={() => showToast('Publish first to copy link')}
                onPreviewCreator={() => {}}
                onPreviewMedia={() => {}}
              />
            </div>
          </section>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
            {/* LEFT / MAIN STUDIO COLUMN */}
            <section className="space-y-4">
              {/* Heading + Intro Quick Card (Aligned with 08_04_create_tools.png) */}
              <div className="rounded-3xl bg-[#110523]/92 border border-purple-400/20 p-4 sm:p-6 shadow-2xl space-y-4">
                <div>
                  <h1 className="text-2xl sm:text-[30px] font-black tracking-tight text-white">
                    Create Post
                  </h1>
                  <p className="text-xs sm:text-sm text-purple-200/70 mt-0.5">
                    Share something with the community
                  </p>
                </div>

                {/* User Quick Share Card (Matches 08_04_create_tools.png reference card) */}
                <div className="rounded-2xl bg-[#180A33] border border-purple-400/20 p-4 flex items-center gap-3.5">
                  <div className="relative shrink-0">
                    <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-[#FF1A6C] to-[#EC4899] shadow-glow-pink">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-[#221044] border-2 border-[#110523]">
                        {activeUser.avatarUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={activeUser.avatarUrl}
                            alt={activeUser.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    </div>
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-400 text-black flex items-center justify-center border border-[#110523]">
                      <Crown className="w-2.5 h-2.5 fill-black" />
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-extrabold text-white">{activeUser.name}</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[11px] text-purple-200/60">{activeUser.handle}</span>
                    </div>
                    <p className="text-xs text-purple-200/70 mt-0.5">What would you like to share?</p>
                    <button
                      type="button"
                      onClick={() => captionRef.current?.focus()}
                      className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FF1A6C] hover:brightness-110 text-white text-xs font-extrabold shadow-glow-pink transition-all"
                    >
                      <span>Create a post</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Choose a Creation (Matches 08_04_create_tools.png cards) */}
              <div className="rounded-3xl bg-[#110523]/92 border border-purple-400/20 p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-black text-white">Choose a creation</h2>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/5 text-purple-200/75 uppercase">
                    {postType} post active
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {POST_TYPE_OPTIONS.map(({ id, title, subtitle, Icon }) => {
                    const active = postType === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        data-testid={`create-type-${id}`}
                        onClick={() => handleSelectPostType(id)}
                        className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center gap-3 ${
                          active
                            ? 'bg-gradient-to-r from-[#280F4F] to-[#1D0B3B] border-[#FF1A6C] shadow-glow-pink'
                            : 'bg-[#170930]/90 hover:bg-[#1E0C3D] border-purple-400/15'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                            active ? 'bg-[#FF1A6C] text-white' : 'bg-[#29134E] text-[#FF4D8D]'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-extrabold text-white truncate">{title}</div>
                          <div className="text-[11px] text-purple-200/60 truncate">{subtitle}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Caption / Text Post Editor */}
              <div className="rounded-3xl bg-[#130628]/95 border border-purple-400/20 p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="square-post-caption" className="text-sm font-extrabold text-white">
                    {postType === 'text' ? 'Post Content' : postType === 'photo' ? 'Photo Caption' : 'Video Caption'}
                  </label>

                  <span
                    data-testid="create-char-counter"
                    className={`text-xs font-bold tabular-nums ${
                      isOverLimit
                        ? 'text-red-400'
                        : charCount > MAX_CAPTION_CHARS - 80
                        ? 'text-amber-300'
                        : 'text-purple-200/60'
                    }`}
                  >
                    {charCount} / {MAX_CAPTION_CHARS}
                  </span>
                </div>

                <textarea
                  id="square-post-caption"
                  ref={captionRef}
                  rows={5}
                  value={caption}
                  onChange={(e) => {
                    setCaption(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  data-testid="create-caption-input"
                  placeholder="What would you like to share?"
                  className="w-full bg-[#0C041C] text-white placeholder:text-purple-200/45 text-sm leading-relaxed rounded-2xl p-4 border border-purple-400/20 focus:border-[#FF1A6C] outline-none resize-y min-h-[128px]"
                />

                {/* Emoji + Quick Tag Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      data-testid="create-emoji-toggle-btn"
                      onClick={() => setShowEmojiPicker((v) => !v)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                        showEmojiPicker
                          ? 'bg-[#FF1A6C]/20 border-[#FF1A6C] text-white'
                          : 'bg-[#1D0D39] hover:bg-[#27124C] border-white/10 text-purple-100'
                      }`}
                    >
                      <Smile className="w-3.5 h-3.5 text-amber-300" />
                      <span>Emoji</span>
                    </button>

                    {QUICK_HASHTAGS.slice(0, 3).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleAppendHashtag(tag)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1C0D38] hover:bg-[#291452] border border-purple-400/15 text-[11px] font-bold text-[#FF6BA3] transition-colors"
                      >
                        <Hash className="w-3 h-3" />
                        <span>{tag.replace('#', '')}</span>
                      </button>
                    ))}
                  </div>

                  {caption.length > 0 && (
                    <button
                      type="button"
                      data-testid="create-clear-text-btn"
                      onClick={() => setCaption('')}
                      className="text-xs font-bold text-purple-200/65 hover:text-red-300 transition-colors"
                    >
                      Clear text
                    </button>
                  )}
                </div>

                {showEmojiPicker && (
                  <div
                    data-testid="create-emoji-picker"
                    className="rounded-2xl bg-[#0D041E] border border-purple-400/25 p-2.5 flex flex-wrap gap-1.5"
                  >
                    {EMOJI_PALETTE.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => handleAppendEmoji(em)}
                        className="w-8 h-8 rounded-xl bg-[#1A0D35] hover:bg-[#FF1A6C]/30 text-base flex items-center justify-center transition-colors"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Media Attachment Editor for Photo / Video */}
              {postType === 'photo' && (
                <PhotoAttachmentEditor
                  photos={photos}
                  mediaError={mediaError}
                  onAddPhotoFiles={handleAddPhotoFiles}
                  onAddSamplePhotos={handleAddSamplePhotos}
                  onRemovePhoto={handleRemovePhoto}
                  onReorderPhoto={handleReorderPhoto}
                  onClearAllPhotos={handleClearAllPhotos}
                />
              )}

              {postType === 'video' && (
                <VideoAttachmentEditor
                  video={video}
                  mediaError={mediaError}
                  onSelectVideoFile={handleSelectVideoFile}
                  onUseSampleVideo={handleUseSampleVideo}
                  onUpdateVideoTitle={(title) =>
                    setVideo((prev) => (prev ? { ...prev, title } : prev))
                  }
                  onRemoveVideo={handleRemoveVideo}
                />
              )}

              {/* Audience Visibility Card */}
              <div className="rounded-3xl bg-[#130628]/95 border border-purple-400/20 p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-white">Audience Visibility</h3>
                    <p className="text-xs text-purple-200/60">
                      Choose who can see this demo post on Popo Live Square.
                    </p>
                  </div>
                  <span
                    data-testid="create-selected-audience-label"
                    className="px-3 py-1 rounded-full bg-[#241047] border border-[#FF1A6C]/35 text-xs font-extrabold text-[#FF6BA3]"
                  >
                    {audience}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {AUDIENCE_OPTIONS.map(({ id, label, description, Icon }) => {
                    const active = audience === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        data-testid={`create-audience-${id}`}
                        onClick={() => setAudience(id)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          active
                            ? 'bg-gradient-to-br from-[#FF1A6C]/25 to-[#9333EA]/20 border-[#FF1A6C] text-white'
                            : 'bg-[#190B34] hover:bg-[#221045] border-white/10 text-purple-100/80'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${active ? 'text-[#FF4D8D]' : 'text-purple-200/65'}`} />
                        <div className="text-xs font-extrabold mt-1.5">{label}</div>
                        <div className="text-[10px] text-purple-200/55 mt-0.5 line-clamp-1">{description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Validation Message Banner */}
              {validationError && (
                <div
                  data-testid="create-validation-error"
                  className="rounded-2xl bg-red-500/15 border border-red-400/45 px-4 py-3 flex items-start gap-2.5 text-xs sm:text-sm text-red-200 shadow-lg"
                >
                  <AlertCircle className="w-4 h-4 text-red-300 shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Primary Bottom Actions (Responsive Mobile + Tablet) */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleClearForm}
                  className="px-4 py-2.5 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-xs font-bold text-purple-200/85"
                >
                  Reset Form
                </button>

                <div className="flex items-center gap-2.5 ml-auto">
                  <button
                    type="button"
                    data-testid="create-bottom-preview-btn"
                    onClick={handleOpenPreview}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#221044] hover:bg-[#2E175A] border border-purple-400/30 text-xs sm:text-sm font-extrabold text-white transition-all"
                  >
                    <Eye className="w-4 h-4 text-[#FF4D8D]" />
                    <span>Preview Post</span>
                  </button>

                  <button
                    type="button"
                    data-testid="create-bottom-publish-btn"
                    onClick={handlePublishPost}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#FF1A6C] to-[#D946EF] text-white text-xs sm:text-sm font-extrabold shadow-glow-pink hover:brightness-110 active:scale-95 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Publish Locally</span>
                  </button>
                </div>
              </div>
            </section>

            {/* DESKTOP RIGHT SIDEBAR: Live Summary & Creation Shortcuts */}
            <aside className="hidden lg:flex flex-col gap-4 sticky top-20">
              <div className="rounded-3xl bg-gradient-to-br from-[#230B45] to-[#130627] border border-[#FF1A6C]/30 p-5 space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-purple-200/75">
                    Draft Summary
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FF1A6C]/20 border border-[#FF1A6C]/40 text-[11px] font-bold text-[#FF6BA3]">
                    Frontend Demo
                  </span>
                </div>

                <div className="space-y-2 text-xs text-purple-100/80">
                  <div className="flex justify-between">
                    <span className="text-purple-200/60">Post Type</span>
                    <span className="font-bold text-white capitalize">{postType} Post</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-200/60">Audience</span>
                    <span className="font-bold text-white">{audience}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-200/60">Attachments</span>
                    <span className="font-bold text-white">
                      {postType === 'photo'
                        ? `${photos.length} photo${photos.length === 1 ? '' : 's'}`
                        : postType === 'video'
                        ? video
                          ? '1 video clip'
                          : 'None'
                        : 'Text only'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleOpenPreview}
                    className="w-full py-2.5 rounded-full bg-[#221044] hover:bg-[#2E175A] border border-purple-400/25 text-xs font-extrabold text-white transition-all"
                  >
                    Open Full Post Preview
                  </button>
                  <button
                    type="button"
                    onClick={handlePublishPost}
                    className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#FF1A6C] to-[#EC4899] text-white text-xs font-extrabold shadow-glow-pink hover:brightness-110 transition-all"
                  >
                    Publish to Local Square
                  </button>
                </div>
              </div>

              <div className="rounded-3xl bg-[#110523]/95 border border-purple-400/20 p-4 space-y-2.5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-200/65">
                  Going Live Instead?
                </h3>
                <p className="text-xs text-purple-200/65 leading-relaxed">
                  Open Live Room setup directly if you want to broadcast an interactive audio or PK room.
                </p>
                <Link
                  href="/live/setup"
                  className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#FF4D8D] hover:text-white transition-colors"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Open Live Room Setup ↗</span>
                </Link>
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#100422]/95 backdrop-blur-xl border-t border-purple-400/20 h-16 px-4 flex items-center justify-around"
      >
        <Link href="/" className="flex flex-col items-center gap-1 text-purple-200/55 hover:text-white">
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Home</span>
        </Link>
        <Link href="/square" className="flex flex-col items-center gap-1 text-purple-200/55 hover:text-white">
          <Compass className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Square</span>
        </Link>
        <span className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#FF1A6C] to-[#9333EA] flex items-center justify-center text-white shadow-glow-pink">
          <Pencil className="w-5 h-5" />
        </span>
        <Link href="/inbox" className="flex flex-col items-center gap-1 text-purple-200/55 hover:text-white">
          <MessageCircle className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Inbox</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-1 text-purple-200/55 hover:text-white">
          <User className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Me</span>
        </Link>
      </nav>

      {/* Toast Feedback */}
      {toast && (
        <div
          data-testid="create-toast"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#1F0E3D]/95 border border-[#FF1A6C]/50 text-white text-xs font-bold shadow-glow-pink backdrop-blur-md whitespace-nowrap"
        >
          {toast}
        </div>
      )}
    </div>
  );
};
