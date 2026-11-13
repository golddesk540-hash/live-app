import {
  ReportCategoryItem,
  ReportCategoryKey,
  ReportPriority,
  ReportQueueMetrics,
  ReportRecord,
  ReportStatus,
} from './reportQueueTypes';

export const REPORT_CATEGORIES: ReportCategoryItem[] = [
  {
    key: 'unsuitable_content',
    label: 'Unsuitable Content',
    iconName: 'ImageOff',
    description: 'Visual media or live broadcasts violating community suitability standards',
    reportCount: 16,
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  },
  {
    key: 'community_guidelines',
    label: 'Community Guidelines',
    iconName: 'ShieldAlert',
    description: 'General platform policy violations, disruptive behavior, or room disruption',
    reportCount: 12,
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  {
    key: 'language_conduct',
    label: 'Language & Conduct',
    iconName: 'MessageSquareWarning',
    description: 'Verbal harassment, abusive room chat, offensive remarks, or bullying',
    reportCount: 9,
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  },
  {
    key: 'spam_promotion',
    label: 'Spam & Promotion',
    iconName: 'MegaphoneOff',
    description: 'Repetitive spam links, unauthorized commercial advertisements, or phishing scams',
    reportCount: 7,
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  },
  {
    key: 'impersonation',
    label: 'Impersonation',
    iconName: 'UserX',
    description: 'Pretending to be verified celebrity, platform staff, or another popular host',
    reportCount: 5,
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
  },
  {
    key: 'unverified_profile',
    label: 'Unverified Profile',
    iconName: 'BadgeAlert',
    description: 'Suspicious profile photos, fake ID submission, or deceptive age representations',
    reportCount: 3,
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  },
  {
    key: 'suspicious_activity',
    label: 'Suspicious Activity',
    iconName: 'AlertTriangle',
    description: 'Abnormal coin recharges, coin dumping, third-party wallet fraud indicators',
    reportCount: 3,
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  },
  {
    key: 'other',
    label: 'General / Other',
    iconName: 'HelpCircle',
    description: 'Miscellaneous complaints, copyright claims, or uncategorized member disputes',
    reportCount: 1,
    badgeColor: 'bg-gray-500/20 text-gray-300 border-gray-500/40',
  },
];

export function createInitialReports(): ReportRecord[] {
  return [
    // Visual reference exact matches from 10_04_report_queue.png
    {
      id: '#RP98421',
      numericId: 98421,
      category: 'unsuitable_content',
      categoryLabel: 'Unsuitable Content',
      status: 'Pending',
      priority: 'High',
      shortDescription: 'Inappropriate stream backdrop during broadcast',
      fullDescription:
        'Viewer reported host for having suggestive banners visible in the live stream background during an open broadcast session.',
      submittedAt: '2026-02-16 10:18:24',
      submittedRelative: '2 min ago',
      reporter: {
        userId: 'U10298462',
        username: 'User_98462',
        nickname: 'Amina Live',
        avatar:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
        accountStatus: 'Active',
        registrationDate: '2026-02-14',
        country: 'Pakistan',
        countryCode: 'PK',
        reportsSubmittedCount: 4,
      },
      reported: {
        accountId: 'H3007612',
        username: 'Host_Elena',
        nickname: 'Elena Vance',
        avatar:
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
        accountType: 'Host',
        accountStatus: 'Active',
        isHost: true,
        hostId: 'H3007612',
        agencyName: 'Starlight Talent PK',
        hostTier: 'Tier A',
        registrationDate: '2026-01-20',
        violationsCount: 1,
        country: 'Ukraine',
        countryCode: 'UA',
      },
      evidence: [
        {
          id: 'EV-98421-1',
          title: 'Broadcast Frame Capture',
          type: 'screenshot',
          url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
          caption: 'Live monitor capture showing questionable wall poster behind broadcaster',
          timestamp: '10:17:40 AM',
          fileSize: '1.4 MB',
        },
        {
          id: 'EV-98421-2',
          title: 'Room Snapshot Telemetry',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800&auto=format&fit=crop&q=80',
          caption: 'Secondary spectator view logged by system auto-capture',
          timestamp: '10:18:02 AM',
          fileSize: '890 KB',
        },
      ],
      adminNotes: 'Assigned to Shift Lead for expedited review before stream concludes.',
      reviewHistory: [
        {
          id: 'ACT-98421-1',
          title: 'Report Submitted',
          adminName: 'System Gateway',
          timestamp: '2 min ago',
          description: 'User_98462 lodged report via room viewer menu.',
          status: 'Pending',
        },
      ],
      assignedAdmin: 'Mod_Sarah',
      lastUpdatedAt: '2 min ago',
    },
    {
      id: '#RP98420',
      numericId: 98420,
      category: 'community_guidelines',
      categoryLabel: 'Harassment & Abuse',
      status: 'Under Review',
      priority: 'Urgent',
      shortDescription: 'Persistent verbal harassment in audio seat',
      fullDescription:
        'User was co-hosting an audio seat and repeatedly abused other participants with derogatory remarks and profanity.',
      submittedAt: '2026-02-16 10:14:12',
      submittedRelative: '6 min ago',
      reporter: {
        userId: 'U10298810',
        username: 'User_Mike',
        nickname: 'Mike Ross',
        avatar:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        accountStatus: 'Active',
        registrationDate: '2026-01-12',
        country: 'United States',
        countryCode: 'US',
        reportsSubmittedCount: 1,
      },
      reported: {
        accountId: 'U10299104',
        username: 'User_Tariq99',
        nickname: 'Tariq Storm',
        avatar:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
        accountType: 'User',
        accountStatus: 'Warned',
        isHost: false,
        registrationDate: '2026-02-02',
        violationsCount: 2,
        country: 'Saudi Arabia',
        countryCode: 'SA',
      },
      evidence: [
        {
          id: 'EV-98420-1',
          title: 'Mic Seat Excerpt',
          type: 'chat_log',
          url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
          caption: 'Audio room log transcript: 6 consecutive abusive voice outbursts',
          timestamp: '10:13:30 AM',
          fileSize: '320 KB',
        },
      ],
      adminNotes: 'Review initiated by Admin Dave. Audio room mute applied as precaution.',
      reviewHistory: [
        {
          id: 'ACT-98420-1',
          title: 'Report Submitted',
          adminName: 'System Gateway',
          timestamp: '6 min ago',
          description: 'User_Mike flagged acoustic disturbance in audio room #AR-880.',
          status: 'Pending',
        },
        {
          id: 'ACT-98420-2',
          title: 'Review Started',
          adminName: 'Admin Dave',
          timestamp: '4 min ago',
          description: 'Admin Dave opened investigation and escalated priority to Urgent.',
          status: 'Under Review',
        },
      ],
      assignedAdmin: 'Admin Dave',
      lastUpdatedAt: '4 min ago',
    },
    {
      id: '#RP98419',
      numericId: 98419,
      category: 'language_conduct',
      categoryLabel: 'Offensive Language',
      status: 'Pending',
      priority: 'Medium',
      shortDescription: 'Profanity in public room comments',
      fullDescription:
        'Viewer continually typed toxic insults and vulgar language targeting guest hosts in the live chat feed.',
      submittedAt: '2026-02-16 10:10:05',
      submittedRelative: '10 min ago',
      reporter: {
        userId: 'U10298715',
        username: 'Host_Sara',
        nickname: 'Sara Khan',
        avatar:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        accountStatus: 'Active',
        registrationDate: '2026-02-14',
        country: 'United Arab Emirates',
        countryCode: 'AE',
        reportsSubmittedCount: 3,
      },
      reported: {
        accountId: 'U10299940',
        username: 'User_Devon',
        nickname: 'Devon Lee',
        avatar:
          'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
        accountType: 'User',
        accountStatus: 'Active',
        isHost: false,
        registrationDate: '2026-01-30',
        violationsCount: 0,
        country: 'United Kingdom',
        countryCode: 'GB',
      },
      evidence: [
        {
          id: 'EV-98419-1',
          title: 'Live Chat Screenshot',
          type: 'screenshot',
          url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
          caption: 'Chat transcript highlights 4 vulgar comments directed at broadcaster',
          timestamp: '10:09:15 AM',
          fileSize: '1.1 MB',
        },
      ],
      adminNotes: 'Awaiting moderation queue review.',
      reviewHistory: [
        {
          id: 'ACT-98419-1',
          title: 'Report Submitted',
          adminName: 'System Gateway',
          timestamp: '10 min ago',
          description: 'Host_Sara submitted in-room report.',
          status: 'Pending',
        },
      ],
      assignedAdmin: 'Unassigned',
      lastUpdatedAt: '10 min ago',
    },
    {
      id: '#RP98418',
      numericId: 98418,
      category: 'spam_promotion',
      categoryLabel: 'Spam & Promotion',
      status: 'Pending',
      priority: 'Low',
      shortDescription: 'Spamming external WhatsApp groups in room chat',
      fullDescription: 'User sent 12 rapid messages advertising unauthorized coin trading groups.',
      submittedAt: '2026-02-16 10:04:18',
      submittedRelative: '16 min ago',
      reporter: {
        userId: 'U10298810',
        username: 'User_Mike',
        nickname: 'Mike Ross',
        avatar:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        accountStatus: 'Active',
        registrationDate: '2026-01-12',
        country: 'United States',
        countryCode: 'US',
        reportsSubmittedCount: 2,
      },
      reported: {
        accountId: 'U10299401',
        username: 'User_SpamBot1',
        nickname: 'Best Deals Coins',
        avatar:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
        accountType: 'User',
        accountStatus: 'Restricted',
        isHost: false,
        registrationDate: '2026-02-15',
        violationsCount: 3,
        country: 'India',
        countryCode: 'IN',
      },
      evidence: [
        {
          id: 'EV-98418-1',
          title: 'Spam Chat Log Excerpt',
          type: 'chat_log',
          url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
          caption: 'Log shows automated repetitive URLs posted every 3 seconds',
          timestamp: '10:03:50 AM',
          fileSize: '410 KB',
        },
      ],
      adminNotes: 'Auto-rate limiter triggered. Pending manual audit.',
      reviewHistory: [
        {
          id: 'ACT-98418-1',
          title: 'Report Submitted',
          adminName: 'System Gateway',
          timestamp: '16 min ago',
          description: 'Spam detection engine paired with user complaint.',
          status: 'Pending',
        },
      ],
      assignedAdmin: 'Unassigned',
      lastUpdatedAt: '16 min ago',
    },
    {
      id: '#RP98417',
      numericId: 98417,
      category: 'impersonation',
      categoryLabel: 'Impersonation',
      status: 'Under Review',
      priority: 'High',
      shortDescription: 'Cloning official Popo Live Support avatar and name',
      fullDescription:
        'Account is using official platform logos as avatar and messaging users demanding coin recharge verification passwords.',
      submittedAt: '2026-02-16 09:55:00',
      submittedRelative: '25 min ago',
      reporter: {
        userId: 'U10298950',
        username: 'User_Rashid',
        nickname: 'Rashid Khan',
        avatar:
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
        accountStatus: 'Active',
        registrationDate: '2026-01-28',
        country: 'Pakistan',
        countryCode: 'PK',
        reportsSubmittedCount: 2,
      },
      reported: {
        accountId: 'U10299881',
        username: 'Popo_Support_Official_Fake',
        nickname: 'Popo Support Team',
        avatar:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        accountType: 'User',
        accountStatus: 'Warned',
        isHost: false,
        registrationDate: '2026-02-16',
        violationsCount: 1,
        country: 'Turkey',
        countryCode: 'TR',
      },
      evidence: [
        {
          id: 'EV-98417-1',
          title: 'Inbox Message Screenshot',
          type: 'screenshot',
          url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
          caption: 'User DM containing fraudulent credential request',
          timestamp: '09:54:10 AM',
          fileSize: '1.2 MB',
        },
      ],
      adminNotes: 'High risk phishing case. Investigating IP correlation.',
      reviewHistory: [
        {
          id: 'ACT-98417-1',
          title: 'Report Submitted',
          adminName: 'System Gateway',
          timestamp: '25 min ago',
          description: 'User_Rashid reported malicious direct message.',
          status: 'Pending',
        },
        {
          id: 'ACT-98417-2',
          title: 'Investigation Opened',
          adminName: 'Security Lead',
          timestamp: '18 min ago',
          description: 'Security team verified impersonation markers and initiated account lock.',
          status: 'Under Review',
        },
      ],
      assignedAdmin: 'Security Lead',
      lastUpdatedAt: '18 min ago',
    },
    {
      id: '#RP98416',
      numericId: 98416,
      category: 'suspicious_activity',
      categoryLabel: 'Suspicious Activity',
      status: 'Under Review',
      priority: 'Urgent',
      shortDescription: 'Abnormal coin transfer velocity across multiple dummy accounts',
      fullDescription:
        'Audit alert generated when 5 newly created accounts rapidly transferred 200,000 coins to single host within 4 minutes.',
      submittedAt: '2026-02-16 09:40:11',
      submittedRelative: '40 min ago',
      reporter: {
        userId: 'U10298462',
        username: 'User_98462',
        nickname: 'Amina Live',
        avatar:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
        accountStatus: 'Active',
        registrationDate: '2026-02-14',
        country: 'Pakistan',
        countryCode: 'PK',
        reportsSubmittedCount: 5,
      },
      reported: {
        accountId: 'H3008721',
        username: 'Host_Maya',
        nickname: 'Maya Lin',
        avatar:
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
        accountType: 'Host',
        accountStatus: 'Active',
        isHost: true,
        hostId: 'H3008721',
        agencyName: 'Golden Star Global',
        hostTier: 'Tier S',
        registrationDate: '2026-01-10',
        violationsCount: 0,
        country: 'Singapore',
        countryCode: 'SG',
      },
      evidence: [
        {
          id: 'EV-98416-1',
          title: 'Financial Ledger Spike',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
          caption: 'Abnormal transaction velocity chart showing 200k coins burst',
          timestamp: '09:39:45 AM',
          fileSize: '820 KB',
        },
      ],
      adminNotes: 'Cross-checking with Finance Admin payout reconciliation team.',
      reviewHistory: [
        {
          id: 'ACT-98416-1',
          title: 'Automated Fraud Alert & User Flag',
          adminName: 'Finance Watchdog',
          timestamp: '40 min ago',
          description: 'System flagged sudden gift gifting anomalies.',
          status: 'Under Review',
        },
      ],
      assignedAdmin: 'Finance Lead',
      lastUpdatedAt: '35 min ago',
    },
    {
      id: '#RP98415',
      numericId: 98415,
      category: 'unverified_profile',
      categoryLabel: 'Unverified Profile',
      status: 'Pending',
      priority: 'Medium',
      shortDescription: 'Minor age discrepancy in host profile photo',
      fullDescription: 'User submitted identification documents that appear mismatched with broadcast camera appearance.',
      submittedAt: '2026-02-16 09:22:00',
      submittedRelative: '1 hr ago',
      reporter: {
        userId: 'U10299622',
        username: 'User_Fatima',
        nickname: 'Fatima Noor',
        avatar:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        accountStatus: 'Active',
        registrationDate: '2026-01-15',
        country: 'Egypt',
        countryCode: 'EG',
        reportsSubmittedCount: 1,
      },
      reported: {
        accountId: 'H3007998',
        username: 'Host_Kenji',
        nickname: 'Kenji Sato',
        avatar:
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
        accountType: 'Host',
        accountStatus: 'Active',
        isHost: true,
        hostId: 'H3007998',
        agencyName: 'Tokyo Wave Agency',
        hostTier: 'Tier B',
        registrationDate: '2026-02-05',
        violationsCount: 0,
        country: 'Japan',
        countryCode: 'JP',
      },
      evidence: [
        {
          id: 'EV-98415-1',
          title: 'Camera Snapshot',
          type: 'screenshot',
          url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
          caption: 'Broadcaster facial capture during morning broadcast',
          timestamp: '09:20:10 AM',
          fileSize: '950 KB',
        },
      ],
      adminNotes: 'Scheduled for manual KYC verification audit.',
      reviewHistory: [
        {
          id: 'ACT-98415-1',
          title: 'Report Submitted',
          adminName: 'System Gateway',
          timestamp: '1 hr ago',
          description: 'Viewer initiated safety inquiry.',
          status: 'Pending',
        },
      ],
      assignedAdmin: 'Unassigned',
      lastUpdatedAt: '1 hr ago',
    },
    {
      id: '#RP98414',
      numericId: 98414,
      category: 'community_guidelines',
      categoryLabel: 'Room Rule Violation',
      status: 'Resolved',
      priority: 'Low',
      shortDescription: 'Unauthorized background audio playback in live room',
      fullDescription: 'Host played copyrighted radio broadcast at high volume.',
      submittedAt: '2026-02-16 08:30:15',
      submittedRelative: '2 hrs ago',
      reporter: {
        userId: 'U10298715',
        username: 'Host_Sara',
        nickname: 'Sara Khan',
        avatar:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        accountStatus: 'Active',
        registrationDate: '2026-02-14',
        country: 'United Arab Emirates',
        countryCode: 'AE',
        reportsSubmittedCount: 4,
      },
      reported: {
        accountId: 'H3008112',
        username: 'Host_Carlos',
        nickname: 'Carlos Mendez',
        avatar:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
        accountType: 'Host',
        accountStatus: 'Active',
        isHost: true,
        hostId: 'H3008112',
        agencyName: 'Madrid Stars Media',
        hostTier: 'Tier B',
        registrationDate: '2026-01-18',
        violationsCount: 1,
        country: 'Spain',
        countryCode: 'ES',
      },
      evidence: [],
      adminNotes: 'Broadcaster advised via system warning toast. Volume adjusted immediately. Resolved with warning.',
      reviewHistory: [
        {
          id: 'ACT-98414-1',
          title: 'Report Submitted',
          adminName: 'System Gateway',
          timestamp: '2 hrs ago',
          description: 'Host_Sara lodged copyright advisory.',
          status: 'Pending',
        },
        {
          id: 'ACT-98414-2',
          title: 'Review & Action',
          adminName: 'Mod_Sarah',
          timestamp: '1 hr ago',
          description: 'Issued formal compliance reminder to host.',
          status: 'Resolved',
        },
      ],
      assignedAdmin: 'Mod_Sarah',
      lastUpdatedAt: '1 hr ago',
    },
    {
      id: '#RP98413',
      numericId: 98413,
      category: 'language_conduct',
      categoryLabel: 'Abusive Language',
      status: 'Rejected',
      priority: 'Low',
      shortDescription: 'Disputed ban during PK competition',
      fullDescription: 'User claimed losing PK competitor insulted them, but audio logs confirm friendly banter.',
      submittedAt: '2026-02-16 07:15:00',
      submittedRelative: '3 hrs ago',
      reporter: {
        userId: 'U10299940',
        username: 'User_Devon',
        nickname: 'Devon Lee',
        avatar:
          'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
        accountStatus: 'Active',
        registrationDate: '2026-01-30',
        country: 'United Kingdom',
        countryCode: 'GB',
        reportsSubmittedCount: 1,
      },
      reported: {
        accountId: 'H3008334',
        username: 'Host_Priya',
        nickname: 'Priya Sharma',
        avatar:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        accountType: 'Host',
        accountStatus: 'Active',
        isHost: true,
        hostId: 'H3008334',
        agencyName: 'Mumbai Beats Agency',
        hostTier: 'Tier A',
        registrationDate: '2026-01-22',
        violationsCount: 0,
        country: 'India',
        countryCode: 'IN',
      },
      evidence: [],
      adminNotes: 'Audio transcript inspected. No harassment or policy violation found. Report dismissed as unsubstantiated.',
      reviewHistory: [
        {
          id: 'ACT-98413-1',
          title: 'Report Submitted',
          adminName: 'System Gateway',
          timestamp: '3 hrs ago',
          description: 'User_Devon filed complaint.',
          status: 'Pending',
        },
        {
          id: 'ACT-98413-2',
          title: 'Audit Complete & Dismissed',
          adminName: 'Admin Dave',
          timestamp: '2 hrs ago',
          description: 'Dismissed report after transcript audit.',
          status: 'Rejected',
        },
      ],
      assignedAdmin: 'Admin Dave',
      lastUpdatedAt: '2 hrs ago',
    },
    // Generate additional records to reach exactly 56 records (Total 56, Pending 32, Review 14, Resolved 7, Rejected 3)
    ...generateRemainingReports(),
  ];
}

function generateRemainingReports(): ReportRecord[] {
  const result: ReportRecord[] = [];
  
  // We need 47 more reports:
  // Current: Pending (3), Under Review (3), Resolved (1), Rejected (1) -> Total 8
  // Desired: Pending 32 (needs 29 more), Review 14 (needs 11 more), Resolved 7 (needs 6 more), Rejected 3 (needs 2 more) -> Total 47 more!

  const pendingNeeded = 29;
  const reviewNeeded = 11;
  const resolvedNeeded = 6;
  const rejectedNeeded = 2;

  let reportCounter = 98412;

  const mockUsersList = [
    { username: 'User_Rashid', id: 'U10298950', country: 'Pakistan', code: 'PK', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80' },
    { username: 'User_Elena', id: 'U10298991', country: 'Ukraine', code: 'UA', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80' },
    { username: 'User_Mike', id: 'U10298810', country: 'United States', code: 'US', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
    { username: 'User_Fatima', id: 'U10299622', country: 'Egypt', code: 'EG', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
    { username: 'User_Kenji', id: 'U10299710', country: 'Japan', code: 'JP', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80' },
    { username: 'User_Zoya', id: 'U10299775', country: 'Turkey', code: 'TR', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80' },
    { username: 'User_Carlos', id: 'U10299833', country: 'Spain', code: 'ES', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
    { username: 'User_Priya', id: 'U10299912', country: 'India', code: 'IN', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
    { username: 'User_Devon', id: 'U10299940', country: 'United Kingdom', code: 'GB', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80' },
    { username: 'User_Hassan', id: 'U10299980', country: 'Saudi Arabia', code: 'SA', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80' },
  ];

  const categoriesList: { key: ReportCategoryKey; label: string; desc: string; prio: ReportPriority }[] = [
    { key: 'unsuitable_content', label: 'Unsuitable Content', desc: 'Inappropriate visual content broadcast in public feed', prio: 'High' },
    { key: 'community_guidelines', label: 'Community Guidelines', desc: 'Disruptive room conduct and repetitive interruptions', prio: 'Medium' },
    { key: 'language_conduct', label: 'Language & Conduct', desc: 'Offensive speech directed at other participants', prio: 'Urgent' },
    { key: 'spam_promotion', label: 'Spam & Promotion', desc: 'Unsolicited promotional links broadcast in live stream', prio: 'Low' },
    { key: 'impersonation', label: 'Impersonation', desc: 'Using duplicate photo and name of known platform talent', prio: 'High' },
    { key: 'unverified_profile', label: 'Unverified Profile', desc: 'Suspected identity mismatch during stream KYC', prio: 'Medium' },
    { key: 'suspicious_activity', label: 'Suspicious Activity', desc: 'Irregular gifting patterns from newly created proxy account', prio: 'Urgent' },
    { key: 'other', label: 'General / Other', desc: 'Dispute regarding stream competition prize distribution', prio: 'Low' },
  ];

  // Helper to construct a record
  const buildItem = (
    status: ReportStatus,
    index: number,
    catOffset: number,
    hoursAgo: number
  ): ReportRecord => {
    const numId = reportCounter--;
    const id = `#RP${numId}`;
    const cat = categoriesList[(index + catOffset) % categoriesList.length];
    const reporterUser = mockUsersList[(index * 2) % mockUsersList.length];
    const reportedUser = mockUsersList[(index * 2 + 1) % mockUsersList.length];
    const isHost = index % 2 === 0;

    const evidenceList =
      index % 3 === 0
        ? [
            {
              id: `EV-${numId}-1`,
              title: 'Attached Screenshot',
              type: 'screenshot' as const,
              url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
              caption: 'Viewer captured screenshot of live room interface',
              timestamp: `${hoursAgo} hrs ago`,
              fileSize: '1.2 MB',
            },
          ]
        : [];

    return {
      id,
      numericId: numId,
      category: cat.key,
      categoryLabel: cat.label,
      status,
      priority: cat.prio,
      shortDescription: cat.desc,
      fullDescription: `${cat.desc}. Filed by ${reporterUser.username} against ${reportedUser.username}. Verified by automated audit logger.`,
      submittedAt: `2026-02-15 1${Math.max(1, 8 - Math.floor(hoursAgo / 3))}:${(index * 7) % 60}:00`,
      submittedRelative: `${hoursAgo} hrs ago`,
      reporter: {
        userId: reporterUser.id,
        username: reporterUser.username,
        nickname: reporterUser.username.replace('User_', '') + ' Star',
        avatar: reporterUser.avatar,
        accountStatus: 'Active',
        registrationDate: '2026-01-10',
        country: reporterUser.country,
        countryCode: reporterUser.code,
        reportsSubmittedCount: (index % 4) + 1,
      },
      reported: {
        accountId: isHost ? `H${3008000 + index}` : reportedUser.id,
        username: reportedUser.username,
        nickname: reportedUser.username.replace('User_', '') + (isHost ? ' Live' : ''),
        avatar: reportedUser.avatar,
        accountType: isHost ? 'Host' : 'User',
        accountStatus: index % 5 === 0 ? 'Warned' : 'Active',
        isHost,
        hostId: isHost ? `H${3008000 + index}` : undefined,
        agencyName: isHost ? 'Starlight Talent PK' : undefined,
        hostTier: isHost ? 'Tier A' : undefined,
        registrationDate: '2026-01-18',
        violationsCount: index % 3,
        country: reportedUser.country,
        countryCode: reportedUser.code,
      },
      evidence: evidenceList,
      adminNotes:
        status === 'Pending'
          ? 'Queued for review'
          : status === 'Under Review'
          ? 'Assigned to Shift Lead. Evidence under review.'
          : status === 'Resolved'
          ? 'Action resolved: Warning issued and record noted in safety ledger.'
          : 'Report dismissed: insufficient evidence.',
      reviewHistory: [
        {
          id: `ACT-${numId}-1`,
          title: 'Report Submitted',
          adminName: 'System Gateway',
          timestamp: `${hoursAgo} hrs ago`,
          description: `Filed through user interface by ${reporterUser.username}.`,
          status: 'Pending',
        },
        ...(status !== 'Pending'
          ? [
              {
                id: `ACT-${numId}-2`,
                title: status === 'Under Review' ? 'Investigation Started' : 'Final Disposition',
                adminName: 'Admin Moderator',
                timestamp: `${Math.max(1, hoursAgo - 1)} hrs ago`,
                description: `Status changed to ${status}.`,
                status,
              },
            ]
          : []),
      ],
      assignedAdmin: status === 'Under Review' ? 'Mod_Sarah' : status === 'Pending' ? 'Unassigned' : 'Admin Dave',
      lastUpdatedAt: `${hoursAgo} hrs ago`,
    };
  };

  // Add remaining Pending (29)
  for (let i = 0; i < pendingNeeded; i++) {
    result.push(buildItem('Pending', i, 0, Math.floor(i / 3) + 1));
  }

  // Add remaining Under Review (11)
  for (let i = 0; i < reviewNeeded; i++) {
    result.push(buildItem('Under Review', i, 2, Math.floor(i / 2) + 2));
  }

  // Add remaining Resolved (6)
  for (let i = 0; i < resolvedNeeded; i++) {
    result.push(buildItem('Resolved', i, 4, i + 5));
  }

  // Add remaining Rejected (2)
  for (let i = 0; i < rejectedNeeded; i++) {
    result.push(buildItem('Rejected', i, 6, i + 8));
  }

  return result;
}

export function calculateMetrics(reports: ReportRecord[]): ReportQueueMetrics {
  const pendingReports = reports.filter((r) => r.status === 'Pending').length;
  const underReviewReports = reports.filter((r) => r.status === 'Under Review').length;
  const resolvedReports = reports.filter((r) => r.status === 'Resolved').length;
  const rejectedReports = reports.filter((r) => r.status === 'Rejected').length;
  const urgentReports = reports.filter((r) => r.priority === 'Urgent').length;
  const highPriorityReports = reports.filter((r) => r.priority === 'High').length;

  return {
    totalReports: reports.length,
    pendingReports,
    underReviewReports,
    resolvedReports,
    rejectedReports,
    newReportsToday: 8,
    urgentReports,
    highPriorityReports,
  };
}
