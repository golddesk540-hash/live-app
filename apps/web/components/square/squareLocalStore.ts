import { SquarePostItem } from './types';

const STORAGE_KEY = 'popo_live_square_local_posts_v1';
const MAX_LOCAL_POSTS = 20;

export function extractHashtags(text: string): string[] {
  const matches = text.match(/#[A-Za-z0-9_]+/g) || [];
  const unique: string[] = [];
  for (const tag of matches) {
    if (!unique.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
      unique.push(tag);
    }
  }
  return unique.slice(0, 8);
}

export function loadLocalSquarePosts(): SquarePostItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SquarePostItem[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalSquarePost(post: SquarePostItem): void {
  if (typeof window === 'undefined') return;
  try {
    const current = loadLocalSquarePosts().filter((p) => p.id !== post.id);
    // Strip transient blob: URLs before writing to localStorage so reloaded feeds never hit broken blobs
    const sanitized: SquarePostItem = {
      ...post,
      videoPreviewUrl: undefined,
      images: post.images?.filter((url) => !url.startsWith('blob:')),
      videoThumbnailUrl:
        post.videoThumbnailUrl && post.videoThumbnailUrl.startsWith('blob:')
          ? undefined
          : post.videoThumbnailUrl,
    };
    const next = [sanitized, ...current].slice(0, MAX_LOCAL_POSTS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Graceful fallback when storage quota is tight: retry without inline data URIs
    try {
      const compact: SquarePostItem = {
        ...post,
        videoPreviewUrl: undefined,
        images: post.images?.map((u) => (u.startsWith('data:') ? createFallbackCardPoster(post.creator.name, 'Photo') : u)),
        videoThumbnailUrl: post.videoThumbnailUrl?.startsWith('data:')
          ? createFallbackCardPoster(post.creator.name, post.videoTitle || 'Video Highlight')
          : post.videoThumbnailUrl,
      };
      const current = loadLocalSquarePosts().filter((p) => p.id !== post.id);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([compact, ...current].slice(0, MAX_LOCAL_POSTS)));
    } catch {
      // Ignore storage quota denial cleanly
    }
  }
}

export function clearLocalSquarePosts(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function createFallbackCardPoster(creatorName: string, subtitle: string): string {
  const safeCreator = creatorName.replace(/[<>&"']/g, '');
  const safeSub = subtitle.replace(/[<>&"']/g, '').slice(0, 36);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#280D4F"/>
        <stop offset="55%" stop-color="#6B21A8"/>
        <stop offset="100%" stop-color="#FF1A6C"/>
      </linearGradient>
    </defs>
    <rect width="800" height="450" fill="url(#g)"/>
    <circle cx="650" cy="110" r="95" fill="#FF1A6C" fill-opacity="0.28"/>
    <circle cx="170" cy="360" r="120" fill="#9333EA" fill-opacity="0.32"/>
    <text x="52" y="210" fill="#FFFFFF" font-family="Arial,sans-serif" font-size="34" font-weight="bold">Popo Live Square</text>
    <text x="52" y="258" fill="#F9A8D4" font-family="Arial,sans-serif" font-size="22">${safeSub || 'Community Highlight'}</text>
    <text x="52" y="305" fill="#E9D5FF" font-family="Arial,sans-serif" font-size="16">Created locally by ${safeCreator}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export async function fileToCompactDataUrl(file: File, maxDim = 960): Promise<string> {
  if (typeof window === 'undefined') return '';
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        resolve('');
        return;
      }
      const img = new window.Image();
      img.onload = () => {
        try {
          const scale = Math.min(1, maxDim / Math.max(img.width || maxDim, img.height || maxDim));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(result);
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        } catch {
          resolve(result);
        }
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}
