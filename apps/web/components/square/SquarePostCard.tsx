'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  ShieldCheck,
  Crown,
  Play,
  Radio,
  Copy,
  UserMinus,
  UserPlus,
  Flag,
  EyeOff,
  Globe,
  Users,
  Lock,
  Sparkles,
} from 'lucide-react';
import { SquareCreator, SquarePostItem } from './types';

interface SquarePostCardProps {
  post: SquarePostItem;
  isFollowed: boolean;
  onToggleLike: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onToggleFollow: (creator: SquareCreator) => void;
  onOpenComments: (post: SquarePostItem) => void;
  onOpenShare: (post: SquarePostItem) => void;
  onOpenReport: (post: SquarePostItem) => void;
  onHidePost: (postId: string) => void;
  onCopyLink: (postId: string) => void;
  onPreviewCreator: (creator: SquareCreator) => void;
  onPreviewMedia: (post: SquarePostItem, imageIndex?: number) => void;
  onFilterTag?: (tag: string) => void;
}

const RING_MAP: Record<SquareCreator['ringColor'], string> = {
  pink: 'from-[#FF1A6C] to-[#EC4899]',
  blue: 'from-[#3B82F6] to-[#00E5FF]',
  purple: 'from-[#9333EA] to-[#FF1A6C]',
  gold: 'from-[#FFB800] to-[#F59E0B]',
  emerald: 'from-[#10B981] to-[#06B6D4]',
};

export const SquarePostCard: React.FC<SquarePostCardProps> = ({
  post,
  isFollowed,
  onToggleLike,
  onToggleSave,
  onToggleFollow,
  onOpenComments,
  onOpenShare,
  onOpenReport,
  onHidePost,
  onCopyLink,
  onPreviewCreator,
  onPreviewMedia,
  onFilterTag,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const { creator } = post;

  return (
    <article
      data-testid={`square-post-card-${post.id}`}
      className="rounded-3xl bg-[#130628]/95 border border-purple-400/20 p-4 sm:p-5 shadow-xl transition-all hover:border-purple-400/35 relative"
    >
      {/* Card Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => onPreviewCreator(creator)}
            data-testid={`post-creator-btn-${post.id}`}
            className="relative shrink-0 group"
          >
            <div className={`p-[2.5px] rounded-full bg-gradient-to-tr ${RING_MAP[creator.ringColor]} group-hover:scale-105 transition-transform`}>
              <div className="w-11 h-11 rounded-full overflow-hidden bg-[#1D0F38] border-2 border-[#0E051E] flex items-center justify-center">
                {creator.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={creator.avatarUrl} alt={creator.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-white">{creator.name.slice(0, 2)}</span>
                )}
              </div>
            </div>
            {creator.isVip && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-400 text-black flex items-center justify-center border border-[#0E051E]">
                <Crown className="w-2.5 h-2.5 fill-black" />
              </span>
            )}
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => onPreviewCreator(creator)}
                className="text-sm sm:text-[15px] font-extrabold text-white hover:text-[#FF4D8D] transition-colors truncate"
              >
                {creator.name}
              </button>
              {creator.isVerified && (
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              )}
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-purple-200/75">
                Lv.{creator.level}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-purple-200/55 mt-0.5 flex-wrap">
              <Link
                href={`/square/post/${post.id}`}
                data-testid={`post-timestamp-detail-link-${post.id}`}
                className="hover:text-[#FF4D8D] hover:underline transition-colors whitespace-nowrap"
              >
                {post.publishedAgo}
              </Link>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                {post.visibility === 'Public' ? (
                  <Globe className="w-3 h-3" />
                ) : post.visibility === 'Private' ? (
                  <Lock className="w-3 h-3 text-amber-300" />
                ) : (
                  <Users className="w-3 h-3" />
                )}
                {post.visibility}
              </span>
            </div>
          </div>
        </div>

        {/* Right Header Controls: Follow + More Options */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onToggleFollow(creator)}
            data-testid={`follow-btn-${post.id}`}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              isFollowed
                ? 'bg-[#221044] text-purple-200 border border-white/15 hover:bg-red-500/15 hover:text-red-200'
                : 'bg-[#FF1A6C]/20 hover:bg-[#FF1A6C] text-[#FF4D8D] hover:text-white border border-[#FF1A6C]/40'
            }`}
          >
            {isFollowed ? 'Following' : '+ Follow'}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              data-testid={`post-more-btn-${post.id}`}
              aria-label="Post options menu"
              className="p-2 rounded-full text-purple-200/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div
                data-testid={`post-more-menu-${post.id}`}
                className="absolute right-0 mt-1 w-48 rounded-2xl bg-[#100521] border border-purple-400/25 shadow-2xl p-1.5 z-40 space-y-0.5"
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onToggleSave(post.id);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                >
                  <Bookmark className={`w-3.5 h-3.5 ${post.isSaved ? 'text-amber-400 fill-amber-400' : 'text-[#FF4D8D]'}`} />
                  {post.isSaved ? 'Unsave post' : 'Save post'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onCopyLink(post.id);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                >
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  Copy post link
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onToggleFollow(creator);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                >
                  {isFollowed ? (
                    <>
                      <UserMinus className="w-3.5 h-3.5 text-purple-300" /> Unfollow creator
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5 text-emerald-400" /> Follow creator
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenReport(post);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-amber-300 hover:bg-amber-500/15 flex items-center gap-2"
                >
                  <Flag className="w-3.5 h-3.5" />
                  Report post
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onHidePost(post.id);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-red-300 hover:bg-red-500/15 flex items-center gap-2"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  Hide post
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Caption & Hashtags */}
      <p className="text-sm text-purple-50/95 leading-relaxed mt-3.5 break-words">{post.text}</p>

      {post.hashtags && post.hashtags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mt-2">
          {post.hashtags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onFilterTag && onFilterTag(tag)}
              className="text-xs font-bold text-[#FF4D8D] hover:text-white transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Media Layouts */}
      {post.mediaType === 'single_image' && post.images?.[0] && (
        <button
          type="button"
          onClick={() => onPreviewMedia(post, 0)}
          className="mt-3.5 block w-full overflow-hidden rounded-2xl border border-white/10 group relative"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.images[0]}
            alt={post.text.slice(0, 40)}
            className="w-full h-56 sm:h-72 object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
          <span className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#FF4D8D]" /> Tap to view
          </span>
        </button>
      )}

      {post.mediaType === 'two_images' && post.images && post.images.length >= 2 && (
        <div className="mt-3.5 grid grid-cols-2 gap-2">
          {post.images.slice(0, 2).map((img, i) => (
            <button
              key={img}
              type="button"
              onClick={() => onPreviewMedia(post, i)}
              className="overflow-hidden rounded-2xl border border-white/10 group relative aspect-[4/3]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={`${creator.name} snapshot ${i + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </button>
          ))}
        </div>
      )}

      {post.mediaType === 'multi_images' && post.images && post.images.length >= 3 && (
        <div className="mt-3.5 grid grid-cols-2 gap-2">
          {post.images.slice(0, 4).map((img, i) => (
            <button
              key={img}
              type="button"
              onClick={() => onPreviewMedia(post, i)}
              className="overflow-hidden rounded-2xl border border-white/10 group relative aspect-[16/10]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={`${creator.name} gallery ${i + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {i === 3 && post.images && post.images.length > 4 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-black text-lg">
                  +{post.images.length - 4}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {post.mediaType === 'video' && post.videoPreviewUrl ? (
        <div className="mt-3.5 overflow-hidden rounded-2xl border border-purple-400/25 bg-[#0A0316] relative">
          <video
            src={post.videoPreviewUrl}
            poster={post.videoThumbnailUrl}
            controls
            playsInline
            className="w-full max-h-72 object-contain bg-black"
          />
          <div className="px-3 py-2 flex items-center justify-between gap-2 text-xs text-purple-100/80 bg-[#120726]/90 border-t border-white/10">
            <span className="font-bold truncate">{post.videoTitle || 'Video Post Preview'}</span>
            {post.videoDuration && (
              <span className="px-2 py-0.5 rounded-full bg-[#FF1A6C] text-white font-mono text-[11px]">
                {post.videoDuration}
              </span>
            )}
          </div>
        </div>
      ) : (
        post.mediaType === 'video' &&
        post.videoThumbnailUrl && (
          <button
            type="button"
            onClick={() => onPreviewMedia(post, 0)}
            className="mt-3.5 block w-full overflow-hidden rounded-2xl border border-purple-400/25 group relative"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.videoThumbnailUrl}
              alt={post.videoTitle || 'Video highlight'}
              className="w-full h-56 sm:h-68 object-cover brightness-90 group-hover:scale-[1.02] transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-[#FF1A6C]/90 text-white flex items-center justify-center shadow-glow-pink group-hover:scale-110 transition-transform">
                <Play className="w-6 h-6 fill-white ml-0.5" />
              </div>
            </div>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-bold text-white">
              <span className="px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md">
                {post.videoTitle || 'Stage Highlight'}
              </span>
              {post.videoDuration && (
                <span className="px-2.5 py-1 rounded-full bg-[#FF1A6C] text-white font-mono text-[11px]">
                  {post.videoDuration}
                </span>
              )}
            </div>
          </button>
        )
      )}

      {post.mediaType === 'live_room' && (
        <Link
          href={post.liveRoomHref || '/live'}
          className="mt-3.5 block w-full py-5 px-4 rounded-2xl bg-gradient-to-r from-[#230E45] via-[#1B0B36] to-[#230E45] hover:from-[#2E1359] hover:to-[#2E1359] border border-[#FF1A6C]/35 text-center transition-all group"
        >
          <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-black tracking-wider text-[#FF4D8D] group-hover:text-white transition-colors">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>{post.liveRoomTitle || 'LIVE ROOM · JOIN'}</span>
          </div>
        </Link>
      )}

      {/* Engagement Footer */}
      <div className="flex items-center justify-between gap-1.5 pt-3.5 mt-4 border-t border-white/10 text-[11px] sm:text-xs">
        <div className="flex items-center gap-2 sm:gap-5 min-w-0">
          <button
            type="button"
            onClick={() => onToggleLike(post.id)}
            data-testid={`post-like-btn-${post.id}`}
            className={`inline-flex items-center gap-1 sm:gap-1.5 font-bold whitespace-nowrap transition-all active:scale-90 ${
              post.isLiked ? 'text-[#FF1A6C]' : 'text-purple-200/70 hover:text-white'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${post.isLiked ? 'fill-[#FF1A6C]' : ''}`} />
            <span data-testid={`post-like-count-${post.id}`}>{post.likesCount}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenComments(post)}
            data-testid={`post-comment-btn-${post.id}`}
            className="inline-flex items-center gap-1 sm:gap-1.5 font-semibold whitespace-nowrap text-purple-200/70 hover:text-white transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>{post.comments.length} comments</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenShare(post)}
            data-testid={`post-share-btn-${post.id}`}
            className="inline-flex items-center gap-1 sm:gap-1.5 font-semibold whitespace-nowrap text-purple-200/70 hover:text-white transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Share{post.sharesCount > 0 ? ` (${post.sharesCount})` : ''}</span>
          </button>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Link
            href={`/square/post/${post.id}`}
            data-testid={`post-detail-link-${post.id}`}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 hover:bg-[#FF1A6C]/20 border border-white/10 hover:border-[#FF1A6C]/40 text-[10px] sm:text-[11px] font-bold text-purple-100/80 hover:text-white whitespace-nowrap transition-colors"
          >
            <span>Details</span>
            <span aria-hidden="true">↗</span>
          </Link>
          <button
            type="button"
            onClick={() => onToggleSave(post.id)}
            data-testid={`post-save-btn-${post.id}`}
            aria-label={post.isSaved ? 'Unsave post' : 'Save post'}
            className={`p-1.5 rounded-full transition-colors ${
              post.isSaved
                ? 'text-amber-400 bg-amber-400/15'
                : 'text-purple-200/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${post.isSaved ? 'fill-amber-400' : ''}`} />
          </button>
        </div>
      </div>
    </article>
  );
};
