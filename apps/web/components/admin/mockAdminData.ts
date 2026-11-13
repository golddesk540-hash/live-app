import {
  AdminActivityItem,
  AdminProfileData,
  AdminRecord,
  ChartDataPoint,
  PermissionGroup,
  PlatformStatistics,
  RoleDefinition,
} from './types';

export const INITIAL_PLATFORM_STATS: PlatformStatistics = {
  totalUsers: 1245320,
  activeUsers: 892140,
  newUsersToday: 14250,
  inactiveUsers: 338930,
  totalHosts: 28450,
  activeLiveHosts: 8420,
  pendingHosts: 1140,
  suspendedHosts: 890,
  currentLiveSessions: 1264,
  totalLiveViewers: 256480,
  totalReports: 56,
  pendingReports: 32,
  reviewedReports: 24,
};

export const INITIAL_ADMIN_PROFILE: AdminProfileData = {
  id: 'ADM-001',
  name: 'Ayesha Noor',
  username: '@ayesha_admin',
  email: 'ayesha.noor@admin.popolive.local',
  avatar:
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
  role: 'Super Admin',
  status: 'Active',
  twoFactorEnabled: true,
  sessionTimeoutMinutes: 30,
  auditLoggingEnabled: true,
};

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: 'user_management',
    title: 'User Management',
    description: 'Control user profile access, identity oversight, and platform standing',
    permissions: [
      {
        id: 'users.view',
        label: 'View users',
        description: 'Inspect platform user directories, public credentials, and user timelines',
      },
      {
        id: 'users.edit',
        label: 'Edit users',
        description: 'Update profile details, display nicknames, and basic user metadata',
      },
      {
        id: 'users.status',
        label: 'Manage user status',
        description: 'Apply warnings, temporary holds, suspensions, or account restorations',
        sensitive: true,
      },
    ],
  },
  {
    key: 'host_management',
    title: 'Host Management',
    description: 'Creator verification, host tiers, daily tasks, and agency affiliations',
    permissions: [
      {
        id: 'hosts.view',
        label: 'View hosts',
        description: 'Inspect verified host rosters, task levels, and stream performance histories',
      },
      {
        id: 'hosts.review',
        label: 'Review host profiles',
        description: 'Examine live agreements, identity uploads, and agency application documents',
      },
      {
        id: 'hosts.status',
        label: 'Manage host status',
        description: 'Approve new host applications, adjust task level tiers, or revoke live rights',
        sensitive: true,
      },
    ],
  },
  {
    key: 'live_monitoring',
    title: 'Live Monitoring',
    description: 'Active video/party room observation, technical vitals, and live policing',
    permissions: [
      {
        id: 'live.view',
        label: 'View live sessions',
        description: 'Access real-time video/audio room feeds and active audience seat maps',
      },
      {
        id: 'live.info',
        label: 'View live session information',
        description: 'Inspect Agora channel metrics, bitrate stability, and viewer counts',
      },
    ],
  },
  {
    key: 'reports',
    title: 'Reports & Safety Queue',
    description: 'Handle viewer complaints, abusive behavior reports, and moderation flags',
    permissions: [
      {
        id: 'reports.view',
        label: 'View reports',
        description: 'Access incoming incident queues, report categories, and reporter profiles',
      },
      {
        id: 'reports.review',
        label: 'Review reports',
        description: 'Examine chat transcripts, video snapshots, and user history logs',
      },
      {
        id: 'reports.status',
        label: 'Manage report status',
        description: 'Mark incident reports pending, investigated, dismissed, or actioned',
        sensitive: true,
      },
    ],
  },
  {
    key: 'content_management',
    title: 'Content Management',
    description: 'Discovery banners, news announcements, room categories, and virtual gifts',
    permissions: [
      {
        id: 'content.view',
        label: 'View content',
        description: 'Inspect published banners, event leaderboards, and news announcements',
      },
      {
        id: 'content.manage',
        label: 'Manage content',
        description: 'Create, update, schedule, or remove banners, articles, and app notices',
      },
    ],
  },
  {
    key: 'finance',
    title: 'Finance & Economy',
    description: 'Coin packages, seller allocations, host points ledger, and payout requests',
    permissions: [
      {
        id: 'finance.view',
        label: 'View financial records',
        description: 'Inspect platform coin ledger, recharge orders, and host point balances',
      },
      {
        id: 'finance.review',
        label: 'Review financial records',
        description: 'Review pending withdrawal requests, agent commissions, and adjustments',
        sensitive: true,
      },
    ],
  },
];

export const ALL_PERMISSION_IDS: string[] = PERMISSION_GROUPS.flatMap((g) =>
  g.permissions.map((p) => p.id)
);

export function createInitialRoles(): RoleDefinition[] {
  return [
    {
      id: 'role_super_admin',
      name: 'Super Admin',
      description:
        'Unrestricted administrative root privileges across platform users, hosts, live streams, safety queues, content, and finance.',
      assignedAdminCount: 2,
      isSystemProtected: true,
      status: 'Active',
      permissionIds: [...ALL_PERMISSION_IDS],
    },
    {
      id: 'role_admin',
      name: 'Admin',
      description:
        'Standard operational administrative tier with user/host management, incident review, live stream oversight, and content moderation.',
      assignedAdminCount: 2,
      isSystemProtected: false,
      status: 'Active',
      permissionIds: [
        'users.view',
        'users.edit',
        'users.status',
        'hosts.view',
        'hosts.review',
        'hosts.status',
        'live.view',
        'live.info',
        'reports.view',
        'reports.review',
        'reports.status',
        'content.view',
        'content.manage',
        'finance.view',
      ],
    },
    {
      id: 'role_moderator',
      name: 'Moderator',
      description:
        'Live stream safety and community monitoring specialist tasked with reviewing user reports, chat violations, and active broadcasts.',
      assignedAdminCount: 2,
      isSystemProtected: false,
      status: 'Active',
      permissionIds: [
        'users.view',
        'live.view',
        'live.info',
        'reports.view',
        'reports.review',
        'reports.status',
      ],
    },
    {
      id: 'role_support_agent',
      name: 'Support Agent',
      description:
        'Customer operations and creator support handling host onboarding assistance, identity verification verification, and profile inquiries.',
      assignedAdminCount: 2,
      isSystemProtected: false,
      status: 'Active',
      permissionIds: ['users.view', 'users.edit', 'hosts.view', 'hosts.review', 'reports.view'],
    },
    {
      id: 'role_finance_manager',
      name: 'Finance Manager',
      description:
        'Economic oversight of platform coin transactions, seller quota records, host earnings ledger, and sample payout reconciliation.',
      assignedAdminCount: 1,
      isSystemProtected: false,
      status: 'Active',
      permissionIds: ['users.view', 'hosts.view', 'finance.view', 'finance.review'],
    },
    {
      id: 'role_content_manager',
      name: 'Content Manager',
      description:
        'Creator communications, promotional discovery banners, system notices, multilingual translations, and category organization.',
      assignedAdminCount: 1,
      isSystemProtected: false,
      status: 'Active',
      permissionIds: ['users.view', 'hosts.view', 'content.view', 'content.manage'],
    },
  ];
}

export function createInitialAdmins(): AdminRecord[] {
  return [
    {
      id: 'ADM-001',
      name: 'Ayesha Noor',
      username: '@ayesha_admin',
      email: 'ayesha.noor@admin.popolive.local',
      avatar:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
      role: 'Super Admin',
      status: 'Active',
      createdAt: '2025-11-15',
      lastActive: 'Just now',
      department: 'Platform Architecture & Operations',
      phoneMasked: '+1 (555) ***-0182',
    },
    {
      id: 'ADM-002',
      name: 'Tariq Vance',
      username: '@tariq_ops',
      email: 'tariq.vance@admin.popolive.local',
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      role: 'Super Admin',
      status: 'Active',
      createdAt: '2025-12-01',
      lastActive: '12m ago',
      department: 'Infrastructure & Security',
      phoneMasked: '+1 (555) ***-4491',
    },
    {
      id: 'ADM-003',
      name: 'Mina Chen',
      username: '@mina_lead',
      email: 'mina.chen@admin.popolive.local',
      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      role: 'Admin',
      status: 'Active',
      createdAt: '2026-01-10',
      lastActive: '45m ago',
      department: 'Community Operations',
      phoneMasked: '+1 (555) ***-3190',
    },
    {
      id: 'ADM-004',
      name: 'David Miller',
      username: '@david_mod',
      email: 'david.miller@admin.popolive.local',
      avatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
      role: 'Moderator',
      status: 'Active',
      createdAt: '2026-02-14',
      lastActive: '1h ago',
      department: 'Trust & Safety',
      phoneMasked: '+1 (555) ***-8824',
    },
    {
      id: 'ADM-005',
      name: 'Sarah Al-Mansoor',
      username: '@sarah_finance',
      email: 'sarah.almansoor@admin.popolive.local',
      avatar:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
      role: 'Finance Manager',
      status: 'Active',
      createdAt: '2026-02-28',
      lastActive: '2h ago',
      department: 'Economy & Settlements',
      phoneMasked: '+1 (555) ***-9041',
    },
    {
      id: 'ADM-006',
      name: 'Alex Mercer',
      username: '@alex_media',
      email: 'alex.mercer@admin.popolive.local',
      avatar:
        'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80',
      role: 'Content Manager',
      status: 'Active',
      createdAt: '2026-03-05',
      lastActive: '3h ago',
      department: 'Media & Communications',
      phoneMasked: '+1 (555) ***-6619',
    },
    {
      id: 'ADM-007',
      name: 'Kenji Sato',
      username: '@kenji_support',
      email: 'kenji.sato@admin.popolive.local',
      avatar:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
      role: 'Support Agent',
      status: 'Active',
      createdAt: '2026-03-20',
      lastActive: '5h ago',
      department: 'Host Desk Support',
      phoneMasked: '+1 (555) ***-7712',
    },
    {
      id: 'ADM-008',
      name: 'Fatima Zahra',
      username: '@fatima_safety',
      email: 'fatima.zahra@admin.popolive.local',
      avatar:
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
      role: 'Moderator',
      status: 'Pending',
      createdAt: '2026-11-10',
      lastActive: 'Never',
      department: 'Trust & Safety',
      phoneMasked: '+1 (555) ***-2381',
    },
    {
      id: 'ADM-009',
      name: 'Omar Farooq',
      username: '@omar_support',
      email: 'omar.farooq@admin.popolive.local',
      avatar:
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
      role: 'Support Agent',
      status: 'Inactive',
      createdAt: '2026-04-12',
      lastActive: '14 days ago',
      department: 'Host Desk Support',
      phoneMasked: '+1 (555) ***-1109',
    },
    {
      id: 'ADM-010',
      name: 'Elena Rostova',
      username: '@elena_admin',
      email: 'elena.rostova@admin.popolive.local',
      avatar:
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80',
      role: 'Admin',
      status: 'Suspended',
      createdAt: '2026-01-25',
      lastActive: '3 days ago',
      department: 'Community Operations',
      phoneMasked: '+1 (555) ***-9554',
    },
  ];
}

export function createInitialActivity(): AdminActivityItem[] {
  return [
    {
      id: 'ACT-1001',
      adminName: 'Ayesha Noor',
      adminRole: 'Super Admin',
      adminAvatar:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
      actionTitle: 'Dashboard accessed',
      details: 'Logged into Admin Home; platform statistics overview refreshed',
      dateLabel: 'Today · Nov 13, 2026',
      timeLabel: '08:24',
      category: 'dashboard',
      status: 'Completed',
    },
    {
      id: 'ACT-1002',
      adminName: 'Tariq Vance',
      adminRole: 'Super Admin',
      adminAvatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      actionTitle: 'Permission settings edited',
      details: 'Updated Finance Manager permission group to include host points oversight',
      dateLabel: 'Today · Nov 13, 2026',
      timeLabel: '08:12',
      category: 'permissions',
      status: 'Completed',
    },
    {
      id: 'ACT-1003',
      adminName: 'Mina Chen',
      adminRole: 'Admin',
      adminAvatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      actionTitle: 'Admin status changed',
      details: 'Set Fatima Zahra (ADM-008) onboarding status to Pending verification',
      dateLabel: 'Yesterday · Nov 12, 2026',
      timeLabel: '17:40',
      category: 'status',
      status: 'Completed',
    },
    {
      id: 'ACT-1004',
      adminName: 'David Miller',
      adminRole: 'Moderator',
      adminAvatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
      actionTitle: 'Live session monitored',
      details: 'Reviewed Room #7001 stream stability and safety chat feed',
      dateLabel: 'Yesterday · Nov 12, 2026',
      timeLabel: '16:15',
      category: 'security',
      status: 'Completed',
    },
    {
      id: 'ACT-1005',
      adminName: 'Ayesha Noor',
      adminRole: 'Super Admin',
      adminAvatar:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
      actionTitle: 'Role details viewed',
      details: 'Inspected Moderator role permissions matrix and active assignee list',
      dateLabel: 'Nov 11, 2026',
      timeLabel: '14:30',
      category: 'roles',
      status: 'Completed',
    },
    {
      id: 'ACT-1006',
      adminName: 'Sarah Al-Mansoor',
      adminRole: 'Finance Manager',
      adminAvatar:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
      actionTitle: 'Admin profile updated',
      details: 'Updated contact desk phone and emergency security notification handle',
      dateLabel: 'Nov 10, 2026',
      timeLabel: '11:20',
      category: 'profile',
      status: 'Completed',
    },
    {
      id: 'ACT-1007',
      adminName: 'Alex Mercer',
      adminRole: 'Content Manager',
      adminAvatar:
        'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80',
      actionTitle: 'Content categories reviewed',
      details: 'Inspected event banners and news publishing queue status',
      dateLabel: 'Nov 09, 2026',
      timeLabel: '10:05',
      category: 'dashboard',
      status: 'Completed',
    },
  ];
}

export const PLATFORM_OVERVIEW_SERIES: Record<
  '24h' | '7d' | '30d',
  {
    users: ChartDataPoint[];
    live: ChartDataPoint[];
    reports: ChartDataPoint[];
  }
> = {
  '24h': {
    users: [
      { label: '00:00', value: 890000, formattedValue: '890k' },
      { label: '04:00', value: 840000, formattedValue: '840k' },
      { label: '08:00', value: 910000, formattedValue: '910k' },
      { label: '12:00', value: 1050000, formattedValue: '1.05M' },
      { label: '16:00', value: 1180000, formattedValue: '1.18M' },
      { label: '20:00', value: 1245320, formattedValue: '1.24M' },
    ],
    live: [
      { label: '00:00', value: 520, formattedValue: '520' },
      { label: '04:00', value: 310, formattedValue: '310' },
      { label: '08:00', value: 680, formattedValue: '680' },
      { label: '12:00', value: 940, formattedValue: '940' },
      { label: '16:00', value: 1150, formattedValue: '1,150' },
      { label: '20:00', value: 1264, formattedValue: '1,264' },
    ],
    reports: [
      { label: '00:00', value: 12, formattedValue: '12' },
      { label: '04:00', value: 8, formattedValue: '8' },
      { label: '08:00', value: 18, formattedValue: '18' },
      { label: '12:00', value: 34, formattedValue: '34' },
      { label: '16:00', value: 45, formattedValue: '45' },
      { label: '20:00', value: 56, formattedValue: '56' },
    ],
  },
  '7d': {
    users: [
      { label: 'Mon', value: 1120000, formattedValue: '1.12M' },
      { label: 'Tue', value: 1150000, formattedValue: '1.15M' },
      { label: 'Wed', value: 1180000, formattedValue: '1.18M' },
      { label: 'Thu', value: 1205000, formattedValue: '1.20M' },
      { label: 'Fri', value: 1228000, formattedValue: '1.22M' },
      { label: 'Sat', value: 1240000, formattedValue: '1.24M' },
      { label: 'Sun', value: 1245320, formattedValue: '1.24M' },
    ],
    live: [
      { label: 'Mon', value: 920, formattedValue: '920' },
      { label: 'Tue', value: 980, formattedValue: '980' },
      { label: 'Wed', value: 1040, formattedValue: '1,040' },
      { label: 'Thu', value: 1110, formattedValue: '1,110' },
      { label: 'Fri', value: 1220, formattedValue: '1,220' },
      { label: 'Sat', value: 1250, formattedValue: '1,250' },
      { label: 'Sun', value: 1264, formattedValue: '1,264' },
    ],
    reports: [
      { label: 'Mon', value: 42, formattedValue: '42' },
      { label: 'Tue', value: 38, formattedValue: '38' },
      { label: 'Wed', value: 45, formattedValue: '45' },
      { label: 'Thu', value: 51, formattedValue: '51' },
      { label: 'Fri', value: 58, formattedValue: '58' },
      { label: 'Sat', value: 62, formattedValue: '62' },
      { label: 'Sun', value: 56, formattedValue: '56' },
    ],
  },
  '30d': {
    users: [
      { label: 'Week 1', value: 980000, formattedValue: '980k' },
      { label: 'Week 2', value: 1060000, formattedValue: '1.06M' },
      { label: 'Week 3', value: 1150000, formattedValue: '1.15M' },
      { label: 'Week 4', value: 1245320, formattedValue: '1.24M' },
    ],
    live: [
      { label: 'Week 1', value: 810, formattedValue: '810' },
      { label: 'Week 2', value: 960, formattedValue: '960' },
      { label: 'Week 3', value: 1120, formattedValue: '1,120' },
      { label: 'Week 4', value: 1264, formattedValue: '1,264' },
    ],
    reports: [
      { label: 'Week 1', value: 48, formattedValue: '48' },
      { label: 'Week 2', value: 54, formattedValue: '54' },
      { label: 'Week 3', value: 65, formattedValue: '65' },
      { label: 'Week 4', value: 56, formattedValue: '56' },
    ],
  },
};

export function formatStatNumber(num: number): string {
  return num.toLocaleString('en-US');
}
