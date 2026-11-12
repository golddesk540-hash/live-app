import React from 'react';
import type { Metadata } from 'next';
import { CreatePostScreen } from '@/components/create/CreatePostScreen';

export const metadata: Metadata = {
  title: 'Create Post — Popo Live Square',
  description: 'Create text, photo, and video community posts with live preview for Popo Live Square.',
};

export default function CreatePage() {
  return <CreatePostScreen />;
}
