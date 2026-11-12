import { NoticeCategoryId, SystemNoticeItem } from './types';

export interface NoticeCategoryTab {
  id: NoticeCategoryId;
  label: string;
  shortLabel: string;
}

export const NOTICE_CATEGORIES: NoticeCategoryTab[] = [
  { id: 'all', label: 'All Notices', shortLabel: 'All' },
  { id: 'account', label: 'Account Updates', shortLabel: 'Account' },
  { id: 'security_safety', label: 'Security & Safety', shortLabel: 'Safety' },
  { id: 'platform', label: 'Platform Updates', shortLabel: 'Platform' },
  { id: 'feature', label: 'Feature Announcements', shortLabel: 'Features' },
  { id: 'wallet_gift', label: 'Wallet & Gift Updates', shortLabel: 'Wallet' },
  { id: 'important', label: 'Important Notices', shortLabel: 'Important' },
];

export const INITIAL_SYSTEM_NOTICES: SystemNoticeItem[] = [
  {
    id: 'notice_profile_ready',
    referenceCode: 'SYS-2026-8104',
    category: 'account',
    categoryBadge: 'ACCOUNT',
    title: 'Your profile is ready',
    shortDescription: 'Your profile information has been updated. Add a photo and bio so people can find you.',
    fullMessage: [
      'Great news! Your Popo Live account profile details are active and synced across web and mobile discovery.',
      'Adding a verified profile avatar, country badge, and short bio helps hosts and community members recognize you faster in party lounges and direct chats.',
    ],
    highlights: [
      'Profile visibility set to Public Discovery',
      'Direct bio editing available anytime from your Profile page',
      'Badges and level rings automatically update as you engage',
    ],
    publicationDate: 'Nov 12, 2026',
    publicationTime: '09:30 AM',
    displayTimestamp: 'Today · 09:30',
    isRead: false,
    isImportant: false,
    priority: 'normal',
    relatedAction: {
      label: 'Edit My Profile',
      href: '/profile/edit',
    },
  },
  {
    id: 'notice_security_login',
    referenceCode: 'SEC-2026-4491',
    category: 'security_safety',
    categoryBadge: 'SECURITY',
    title: 'Security Notice: New login detected',
    shortDescription: 'A new sign-in was detected on your Popo Live web session. Verify active devices if this looks unfamiliar.',
    fullMessage: [
      'We noticed a new web login to your Popo Live account from Chrome on Windows earlier today.',
      'If this was you, no further action is needed. If you do not recognize this activity, review your active sessions immediately and update your account password.',
    ],
    highlights: [
      'Device: Desktop Web Session',
      'Region: Islamabad / PK Network',
      'Tip: Never share 6-digit login verification codes with anyone',
    ],
    publicationDate: 'Nov 12, 2026',
    publicationTime: '08:15 AM',
    displayTimestamp: 'Today · 08:15',
    isRead: false,
    isImportant: true,
    priority: 'high',
    relatedAction: {
      label: 'Check Active Sessions',
      href: '/user-id',
    },
  },
  {
    id: 'notice_important_protection',
    referenceCode: 'IMP-2026-0092',
    category: 'important',
    categoryBadge: 'IMPORTANT',
    title: 'Official Account & Recharge Protection',
    shortDescription: 'Important safety reminder: Only top up coins and claim VIP perks through official Popo Live screens.',
    fullMessage: [
      'Popo Live staff and System Notices will never send external payment links or request your login PIN or password inside direct messages.',
      'Every authorized coin top-up, VIP subscription, and store purchase on Popo Live issues an official PL-RCP receipt directly inside your Receipts & Finance Center.',
    ],
    highlights: [
      'Official Popo Live domain: kigolive.com',
      'Zero external third-party password verification requests',
      'Report impersonators directly inside Inbox or Help Center',
    ],
    publicationDate: 'Nov 12, 2026',
    publicationTime: '07:00 AM',
    displayTimestamp: 'Today · 07:00',
    isRead: false,
    isImportant: true,
    priority: 'critical',
    relatedAction: {
      label: 'Open Receipts & Finance',
      href: '/finance',
    },
  },
  {
    id: 'notice_safety_community',
    referenceCode: 'SAF-2026-3910',
    category: 'security_safety',
    categoryBadge: 'SAFETY',
    title: 'Community reminder',
    shortDescription: 'Keep chats respectful. Report content that breaks the rules across live rooms and Inbox.',
    fullMessage: [
      'Please follow Popo Live Community Guidelines whenever broadcasting live, hosting 9-seat audio rooms, or messaging friends in Inbox.',
      'You can report inappropriate messages or block disruptive senders right from conversation menus and message request cards.',
    ],
    highlights: [
      'Zero tolerance for harassment, spam, or unsafe links',
      '24/7 safety moderation & rapid account protection tools',
    ],
    publicationDate: 'Nov 11, 2026',
    publicationTime: '06:40 PM',
    displayTimestamp: 'Yesterday',
    isRead: true,
    isImportant: false,
    priority: 'normal',
    relatedAction: {
      label: 'Read Community Guidelines',
      href: '/policies/community-guidelines',
    },
  },
  {
    id: 'notice_feature_square',
    referenceCode: 'FEA-2026-7120',
    category: 'feature',
    categoryBadge: 'FEATURE',
    title: 'Square is here — explore community updates',
    shortDescription: 'Explore the new Square section! Share posts, backstage moments, and see what hosts are doing.',
    fullMessage: [
      'Welcome to the next chapter of Popo Live Social! Our upcoming Square experience lets creators post highlights, announcements, and community moments beyond live streams.',
      'In the meantime, your new Inbox and System Notices hubs keep direct conversations and official Popo Live alerts cleanly organized.',
    ],
    highlights: [
      'Quickly connect with creators between live broadcasts',
      'Seamless jump between Inbox Chats and System Notices',
    ],
    publicationDate: 'Nov 11, 2026',
    publicationTime: '03:15 PM',
    displayTimestamp: 'Yesterday',
    isRead: false,
    isImportant: false,
    priority: 'normal',
    relatedAction: {
      label: 'Open Inbox Chats',
      href: '/inbox',
    },
  },
  {
    id: 'notice_wallet_gifts',
    referenceCode: 'WAL-2026-6043',
    category: 'wallet_gift',
    categoryBadge: 'WALLET',
    title: 'Gift points updated',
    shortDescription: 'Your latest gift activity and non-cash Host Points balance snapshot are ready to view.',
    fullMessage: [
      'Your gift activity has been updated cleanly in your Popo Live Wallet. Supporters send Coins for animated gifts, while Creators receive separate non-cash Host Points (70% share).',
      'View itemized gift breakdowns and verified PDF receipts anytime inside your Finance Center.',
    ],
    highlights: [
      'Separate balances for Coins and non-cash Host Points',
      'Complete itemized receipts for verified gift transactions',
    ],
    publicationDate: 'Nov 10, 2026',
    publicationTime: '05:22 PM',
    displayTimestamp: 'Nov 10',
    isRead: true,
    isImportant: false,
    priority: 'normal',
    relatedAction: {
      label: 'View My Wallet',
      href: '/wallet',
    },
  },
  {
    id: 'notice_platform_update',
    referenceCode: 'PLT-2026-5081',
    category: 'platform',
    categoryBadge: 'PLATFORM',
    title: 'Platform Update: New features available on Popo Live',
    shortDescription: 'New features are available on Popo Live, including responsive split-view Inbox and smoother PK animations.',
    fullMessage: [
      'We have rolled out Popo Live Web & Mobile UI upgrades focused on cleaner navigation, faster page transitions, and dark-purple lounge contrast.',
      'Explore updated PK Discovery filters, Virtual Store equip previews, and the redesigned System Notices center.',
    ],
    highlights: [
      'Dark Purple + Neon Pink unified Phase 7 & 8 theme',
      'Instant responsive switching across mobile, tablet, and desktop',
    ],
    publicationDate: 'Nov 09, 2026',
    publicationTime: '11:00 AM',
    displayTimestamp: 'Nov 9',
    isRead: true,
    isImportant: false,
    priority: 'normal',
    relatedAction: {
      label: 'Explore Live Streams',
      href: '/live',
    },
  },
];
