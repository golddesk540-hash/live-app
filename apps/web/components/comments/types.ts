import { CommentReplyItem, SquareCommentItem, SquarePostItem } from '../square/types';

export type { CommentReplyItem, SquareCommentItem, SquarePostItem };

export type ReportReasonId =
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'inappropriate_content'
  | 'violence'
  | 'fake_info'
  | 'other';

export interface ReportReasonOption {
  id: ReportReasonId;
  label: string;
  description: string;
}

export const REPORT_REASON_OPTIONS: ReportReasonOption[] = [
  {
    id: 'spam',
    label: 'Spam',
    description: 'Unsolicited promotions, repeated links, or fake engagement.',
  },
  {
    id: 'harassment',
    label: 'Harassment or bullying',
    description: 'Targeted insults, intimidation, or abusive remarks toward a user.',
  },
  {
    id: 'hate_speech',
    label: 'Hate speech',
    description: 'Slurs, dehumanizing language, or attacks against protected groups.',
  },
  {
    id: 'inappropriate_content',
    label: 'Inappropriate content',
    description: 'Sexually explicit material, graphic imagery, or offensive themes.',
  },
  {
    id: 'violence',
    label: 'Violence or threats',
    description: 'Threats of harm, incitement, or depiction of dangerous violence.',
  },
  {
    id: 'fake_info',
    label: 'Fake or misleading information',
    description: 'Deceptive claims, scam recharge offers, or impersonation.',
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Another Community Guidelines concern not listed above.',
  },
];

export interface ReportTarget {
  type: 'post' | 'comment';
  id: string;
  postId?: string;
  authorName: string;
  authorHandle?: string;
  authorAvatarUrl?: string;
  authorInitials?: string;
  authorColor?: string;
  previewText: string;
  timestamp?: string;
}

export interface LocalDemoReport {
  id: string;
  targetType: 'post' | 'comment';
  targetId: string;
  postId?: string;
  targetAuthor: string;
  targetPreview: string;
  reasonId: ReportReasonId;
  reasonLabel: string;
  details: string;
  submittedAt: string;
}
