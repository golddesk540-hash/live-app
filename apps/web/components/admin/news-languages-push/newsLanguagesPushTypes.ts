export type NewsStatus = 'Draft' | 'Published' | 'Scheduled' | 'Archived';

export type NewsCategoryName =
  | 'Announcements'
  | 'Events'
  | 'Updates'
  | 'Community'
  | 'Promotions'
  | 'Important Notices';

export type PushNotificationType =
  | 'General Announcement'
  | 'News Update'
  | 'Event Notification'
  | 'Promotional Notification'
  | 'Important Notice';

export type CampaignStatus = 'Draft' | 'Scheduled' | 'Sent Demo' | 'Cancelled' | 'Failed Demo';

export type TranslationStatus = 'Completed' | 'Missing' | 'Needs Review';

export type AudienceGroupId =
  | 'all_users'
  | 'active_users'
  | 'hosts'
  | 'new_users'
  | 'agency_members'
  | 'coin_sellers';

export type NewsLanguagesPushTab =
  | 'dashboard'
  | 'news_management'
  | 'news_categories'
  | 'languages'
  | 'translations'
  | 'push_dashboard'
  | 'push_campaigns'
  | 'push_templates'
  | 'admin_activity';

export type NewsLanguagesPushEmptyKind =
  | 'no_news'
  | 'no_news_categories'
  | 'no_languages'
  | 'no_translations'
  | 'no_missing_translations'
  | 'no_campaigns'
  | 'no_campaign_history'
  | 'no_templates'
  | 'no_search_results';

export interface NewsArticleRecord {
  id: string; // e.g. NEWS-101
  title: string;
  description: string;
  content: string;
  thumbnail: string;
  categoryId: string;
  categoryName: NewsCategoryName;
  languageCode: string; // 'en' | 'ur' etc.
  author: string;
  createdAt: string;
  publishedAt: string;
  status: NewsStatus;
  viewsCount: number;
}

export interface NewsCategoryRecord {
  id: string; // e.g. CAT-ANN
  name: NewsCategoryName;
  icon: string;
  description: string;
  articleCount: number;
  status: 'Active' | 'Inactive';
}

export interface LanguageRecord {
  id: string; // e.g. LANG-EN
  name: string;
  nativeName: string;
  code: string;
  flag: string;
  status: 'Active' | 'Inactive';
  isDefault: boolean;
  totalKeys: number;
  completedKeys: number;
  missingKeys: number;
  needsReviewKeys: number;
  completionPercentage: number;
  lastUpdated: string;
}

export interface TranslationRecord {
  id: string; // e.g. TR-101
  key: string;
  sourceText: string;
  translatedText: string;
  languageCode: string;
  status: TranslationStatus;
  lastUpdated: string;
}

export interface AudienceGroup {
  id: AudienceGroupId;
  name: string;
  sizeEstimate: number;
  description: string;
}

export interface CampaignRecord {
  id: string; // e.g. CMP-701
  title: string;
  message: string;
  image: string;
  type: PushNotificationType;
  audienceGroups: AudienceGroupId[];
  audienceSummary: string;
  languageCode: string;
  createdAt: string;
  scheduledAt: string;
  sentAt?: string;
  status: CampaignStatus;
  deliveredCount: number;
  openRatePercentage: number;
}

export interface NotificationTemplateRecord {
  id: string; // e.g. TPL-01
  name: string;
  title: string;
  message: string;
  type: PushNotificationType;
  languageCode: string;
  lastUsed: string;
}

export interface NewsAdminActivityItem {
  id: string;
  adminName: string;
  activityType:
    | 'News Created'
    | 'News Edited'
    | 'News Status Updated'
    | 'Category Updated'
    | 'Language Added'
    | 'Translation Updated'
    | 'Campaign Created'
    | 'Campaign Scheduled'
    | 'Template Edited';
  relatedRecordId: string;
  timestamp: string;
  description: string;
}

export interface NewsLanguagesPushMetrics {
  totalNews: number;
  publishedNews: number;
  draftNews: number;
  scheduledNews: number;
  archivedNews: number;
  totalLanguages: number;
  activeLanguages: number;
  translationOverallPercentage: number;
  totalCampaigns: number;
  scheduledCampaigns: number;
  sentCampaigns: number;
  draftCampaigns: number;
  totalRecipients: number;
}
