export type NoticeCategoryId =
  | 'all'
  | 'account'
  | 'security_safety'
  | 'platform'
  | 'feature'
  | 'wallet_gift'
  | 'important';

export type NoticePriority = 'normal' | 'high' | 'critical';

export interface SystemNoticeAction {
  label: string;
  href: string;
}

export interface SystemNoticeItem {
  id: string;
  referenceCode: string;
  category: Exclude<NoticeCategoryId, 'all'>;
  categoryBadge: string;
  title: string;
  shortDescription: string;
  fullMessage: string[];
  highlights?: string[];
  publicationDate: string;
  publicationTime: string;
  displayTimestamp: string;
  isRead: boolean;
  isImportant: boolean;
  priority: NoticePriority;
  relatedAction?: SystemNoticeAction;
}
