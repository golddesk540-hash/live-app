export type CreatePostType = 'text' | 'photo' | 'video';

export type CreateAudience = 'Public' | 'Following' | 'Private';

export interface SelectedPhotoItem {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  objectUrl: string;
  compactDataUrl?: string;
}

export interface SelectedVideoItem {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  objectUrl: string;
  posterDataUrl: string;
  durationFormatted: string;
  resolution?: string;
  title: string;
}

export const SAMPLE_CREATE_PHOTOS = [
  {
    name: 'acoustic_stage_night.jpg',
    url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=900&auto=format&fit=crop&q=80',
  },
  {
    name: 'neon_rooftop_lounge.jpg',
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&auto=format&fit=crop&q=80',
  },
  {
    name: 'studio_jam_session.jpg',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&auto=format&fit=crop&q=80',
  },
];

export const SAMPLE_CREATE_VIDEO_POSTER =
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=900&auto=format&fit=crop&q=80';
