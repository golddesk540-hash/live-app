import {
  DemoPaymentMethod,
  SavedAccountDetails,
  WithdrawalDateFilter,
  WithdrawalRecord,
  WithdrawalStatus,
  WithdrawalSummaryMetrics,
  WithdrawalTimelineStep,
  WithdrawalUserProfile,
} from './types';

export const WITHDRAWALS_TODAY_ISO = '2026-11-12';
export const INITIAL_AVAILABLE_DEMO_BALANCE = 8450;

/**
 * Configurable frontend validation bounds.
 * Kept null so no unapproved minimum/maximum limits or fees are invented.
 */
export const WITHDRAWAL_DEMO_CONFIG = {
  minDemoAmount: null as number | null,
  maxDemoAmount: null as number | null,
};

export const DEMO_WITHDRAWAL_USER: WithdrawalUserProfile = {
  userId: 'PL-77490',
  username: '@zara.creator',
  displayName: 'Zara Creator',
  avatar:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  unitLabel: 'pts',
  baseAvailableDemoBalance: INITIAL_AVAILABLE_DEMO_BALANCE,
};

export const DEMO_PAYMENT_METHODS: DemoPaymentMethod[] = [
  {
    id: 'demo_bank_transfer',
    name: 'Demo Bank Transfer (Placeholder)',
    shortLabel: 'Demo Bank',
    description: 'Placeholder bank transfer option for frontend preview only · Not connected',
    identifierLabel: 'Demo Account / IBAN Identifier',
    identifierPlaceholder: 'e.g. DEMO-BANK-004821',
    extraFieldLabel: 'Demo Bank Name (Placeholder)',
    extraFieldPlaceholder: 'e.g. Sample National Demo Bank',
    iconKey: 'bank',
    isPlaceholder: true,
  },
  {
    id: 'demo_mobile_wallet',
    name: 'Demo Mobile Wallet (Placeholder)',
    shortLabel: 'Demo Wallet',
    description: 'Placeholder digital wallet payout option · Display & validation preview only',
    identifierLabel: 'Demo Wallet Number / Handle',
    identifierPlaceholder: 'e.g. +1-555-014-8820',
    extraFieldLabel: 'Wallet Label (Placeholder)',
    extraFieldPlaceholder: 'e.g. Popo Sample Wallet',
    iconKey: 'wallet',
    isPlaceholder: true,
  },
  {
    id: 'demo_payout_account',
    name: 'Demo Payout Card Account (Placeholder)',
    shortLabel: 'Demo Payout Account',
    description: 'Placeholder payout card profile · Does not process real card transactions',
    identifierLabel: 'Demo Payout Reference ID',
    identifierPlaceholder: 'e.g. DEMO-CARD-9134',
    extraFieldLabel: 'Account Region Label (Placeholder)',
    extraFieldPlaceholder: 'e.g. Demo Global Region',
    iconKey: 'card',
    isPlaceholder: true,
  },
];

export function createInitialSavedAccounts(): Record<string, SavedAccountDetails> {
  return {
    demo_bank_transfer: {
      methodId: 'demo_bank_transfer',
      accountHolderName: 'Zara Creator (Demo)',
      rawAccountIdentifier: 'DEMO-BANK-004821',
      extraField: 'Sample National Demo Bank',
      additionalNote: 'Primary sample payout destination',
      updatedAtLabel: 'Nov 10, 2026',
    },
    demo_mobile_wallet: {
      methodId: 'demo_mobile_wallet',
      accountHolderName: 'Zara Creator (Demo)',
      rawAccountIdentifier: '+1-555-014-8820',
      extraField: 'Popo Sample Wallet',
      additionalNote: 'Secondary placeholder mobile wallet',
      updatedAtLabel: 'Nov 08, 2026',
    },
    demo_payout_account: {
      methodId: 'demo_payout_account',
      accountHolderName: 'Zara Creator (Demo)',
      rawAccountIdentifier: 'DEMO-CARD-9134',
      extraField: 'Demo Global Region',
      additionalNote: 'Sample reference payout account',
      updatedAtLabel: 'Nov 02, 2026',
    },
  };
}

export function maskDemoAccountIdentifier(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '****';
  if (trimmed.length <= 4) return `****${trimmed}`;
  const tail = trimmed.slice(-4);
  return `**** ${tail}`;
}

export function formatPts(value: number): string {
  return value.toLocaleString('en-US');
}

export function getWithdrawalStatusExplanation(status: WithdrawalStatus): string {
  switch (status) {
    case 'Pending':
      return 'Submitted in frontend preview and waiting in the sample review queue.';
    case 'Processing':
      return 'Shown in demo processing state before final preview completion.';
    case 'Approved':
      return 'Display state indicating sample request passed placeholder verification.';
    case 'Rejected':
      return 'Display state demonstrating a declined mock withdrawal entry.';
    case 'Completed':
      return 'Finalized sample record for frontend withdrawal history demonstration.';
  }
}

export function buildWithdrawalTimeline(
  status: WithdrawalStatus,
  dateLabel: string,
  timeLabel: string
): WithdrawalTimelineStep[] {
  const submitted: WithdrawalTimelineStep = {
    step: 'submitted',
    title: 'Demo Request Submitted',
    description: 'Local demo withdrawal request logged with masked placeholder details.',
    timestampLabel: `${dateLabel} · ${timeLabel}`,
    state: 'done',
  };

  if (status === 'Pending') {
    return [
      submitted,
      {
        step: 'review',
        title: 'Pending Demo Queue',
        description: 'Awaiting local preview transition (no real payment review).',
        timestampLabel: 'Current Status',
        state: 'current',
      },
      {
        step: 'completed',
        title: 'Demo Settlement Display',
        description: 'Final display step once marked completed in preview.',
        timestampLabel: 'Upcoming',
        state: 'upcoming',
      },
    ];
  }

  if (status === 'Processing') {
    return [
      submitted,
      {
        step: 'processing',
        title: 'Demo Processing',
        description: 'Simulated processing state in frontend workflow.',
        timestampLabel: `${dateLabel} · +15m`,
        state: 'current',
      },
      {
        step: 'completed',
        title: 'Demo Settlement Display',
        description: 'Completes the sample request record.',
        timestampLabel: 'Upcoming',
        state: 'upcoming',
      },
    ];
  }

  if (status === 'Approved') {
    return [
      submitted,
      {
        step: 'processing',
        title: 'Demo Processing Checked',
        description: 'Placeholder account fields verified in mock data.',
        timestampLabel: `${dateLabel} · +20m`,
        state: 'done',
      },
      {
        step: 'approved',
        title: 'Demo Request Approved',
        description: 'Approved display state shown before final completed log.',
        timestampLabel: 'Current Status',
        state: 'current',
      },
    ];
  }

  if (status === 'Rejected') {
    return [
      submitted,
      {
        step: 'review',
        title: 'Sample Check Reviewed',
        description: 'Simulated review detected placeholder mismatch example.',
        timestampLabel: `${dateLabel} · +1h`,
        state: 'done',
      },
      {
        step: 'rejected',
        title: 'Demo Request Rejected',
        description: 'Frontend sample entry marked rejected; zero live funds moved.',
        timestampLabel: `${dateLabel} · Closed`,
        state: 'rejected',
      },
    ];
  }

  return [
    submitted,
    {
      step: 'approved',
      title: 'Demo Request Approved',
      description: 'Placeholder details validated in demo state.',
      timestampLabel: `${dateLabel} · +1h`,
      state: 'done',
    },
    {
      step: 'completed',
      title: 'Completed (Demo Only)',
      description: 'Sample withdrawal history record finalized locally.',
      timestampLabel: `${dateLabel} · Final`,
      state: 'done',
    },
  ];
}

export function createInitialWithdrawalRecords(): WithdrawalRecord[] {
  const raw: Array<{
    id: string;
    amount: number;
    methodIdx: number;
    masked: string;
    dateLabel: string;
    dateIso: string;
    timeLabel: string;
    status: WithdrawalStatus;
    ref: string;
    note: string;
  }> = [
    {
      id: 'WD1024',
      amount: 1200,
      methodIdx: 0,
      masked: '**** 4821',
      dateLabel: 'Today · Nov 12, 2026',
      dateIso: '2026-11-12',
      timeLabel: '16:10',
      status: 'Pending',
      ref: 'DEMO-WD-102490',
      note: 'Sample pending request shown on initial Withdrawals dashboard.',
    },
    {
      id: 'WD1023',
      amount: 800,
      methodIdx: 1,
      masked: '**** 8820',
      dateLabel: 'Today · Nov 12, 2026',
      dateIso: '2026-11-12',
      timeLabel: '13:45',
      status: 'Pending',
      ref: 'DEMO-WD-102377',
      note: 'Pending sample mobile wallet payout request.',
    },
    {
      id: 'WD1022',
      amount: 1500,
      methodIdx: 0,
      masked: '**** 4821',
      dateLabel: 'Yesterday · Nov 11, 2026',
      dateIso: '2026-11-11',
      timeLabel: '19:20',
      status: 'Processing',
      ref: 'DEMO-WD-102264',
      note: 'Sample request currently in simulated Processing state.',
    },
    {
      id: 'WD1021',
      amount: 500,
      methodIdx: 2,
      masked: '**** 9134',
      dateLabel: 'Nov 10, 2026',
      dateIso: '2026-11-10',
      timeLabel: '15:05',
      status: 'Processing',
      ref: 'DEMO-WD-102153',
      note: 'Placeholder payout account verification in progress.',
    },
    {
      id: 'WD1020',
      amount: 2000,
      methodIdx: 0,
      masked: '**** 4821',
      dateLabel: 'Nov 09, 2026',
      dateIso: '2026-11-09',
      timeLabel: '11:30',
      status: 'Approved',
      ref: 'DEMO-WD-102042',
      note: 'Approved sample request in weekly demo log.',
    },
    {
      id: 'WD1019',
      amount: 1000,
      methodIdx: 1,
      masked: '**** 8820',
      dateLabel: 'Nov 07, 2026',
      dateIso: '2026-11-07',
      timeLabel: '17:40',
      status: 'Approved',
      ref: 'DEMO-WD-101931',
      note: 'Approved placeholder wallet request.',
    },
    {
      id: 'WD1018',
      amount: 1500,
      methodIdx: 0,
      masked: '**** 4821',
      dateLabel: 'Nov 05, 2026',
      dateIso: '2026-11-05',
      timeLabel: '14:15',
      status: 'Approved',
      ref: 'DEMO-WD-101820',
      note: 'Sample approved request referenced in Withdrawals preview.',
    },
    {
      id: 'WD1017',
      amount: 600,
      methodIdx: 2,
      masked: '**** 9134',
      dateLabel: 'Nov 03, 2026',
      dateIso: '2026-11-03',
      timeLabel: '10:50',
      status: 'Rejected',
      ref: 'DEMO-WD-101709',
      note: 'Sample rejected entry to preview error/decline UI state.',
    },
    {
      id: 'WD1016',
      amount: 400,
      methodIdx: 1,
      masked: '**** 8820',
      dateLabel: 'Nov 01, 2026',
      dateIso: '2026-11-01',
      timeLabel: '09:20',
      status: 'Rejected',
      ref: 'DEMO-WD-101698',
      note: 'Sample rejected entry in monthly history.',
    },
    {
      id: 'WD1015',
      amount: 3000,
      methodIdx: 0,
      masked: '**** 4821',
      dateLabel: 'Oct 28, 2026',
      dateIso: '2026-10-28',
      timeLabel: '18:00',
      status: 'Completed',
      ref: 'DEMO-WD-101587',
      note: 'Completed demo bank withdrawal sample.',
    },
    {
      id: 'WD1014',
      amount: 2500,
      methodIdx: 1,
      masked: '**** 8820',
      dateLabel: 'Oct 19, 2026',
      dateIso: '2026-10-19',
      timeLabel: '16:25',
      status: 'Completed',
      ref: 'DEMO-WD-101476',
      note: 'Completed demo mobile wallet sample.',
    },
    {
      id: 'WD1013',
      amount: 1800,
      methodIdx: 2,
      masked: '**** 9134',
      dateLabel: 'Oct 11, 2026',
      dateIso: '2026-10-11',
      timeLabel: '12:10',
      status: 'Completed',
      ref: 'DEMO-WD-101365',
      note: 'Completed demo payout card sample.',
    },
  ];

  return raw.map((item) => {
    const method = DEMO_PAYMENT_METHODS[item.methodIdx];
    return {
      id: item.id,
      userId: DEMO_WITHDRAWAL_USER.userId,
      amount: item.amount,
      unitLabel: 'pts',
      paymentMethodId: method.id,
      paymentMethodName: method.name,
      maskedAccountDetails: item.masked,
      accountHolderName: `${DEMO_WITHDRAWAL_USER.displayName} (Demo)`,
      requestDateLabel: item.dateLabel,
      requestDateIso: item.dateIso,
      requestTimeLabel: item.timeLabel,
      status: item.status,
      demoTxRef: item.ref,
      note: item.note,
      timeline: buildWithdrawalTimeline(item.status, item.dateLabel, item.timeLabel),
    };
  });
}

const INITIAL_PENDING_AMOUNT = 2000;

export function computeWithdrawalSummary(
  records: WithdrawalRecord[],
  baseBalance: number = INITIAL_AVAILABLE_DEMO_BALANCE
): WithdrawalSummaryMetrics {
  let pendingAmount = 0;
  let processingAmount = 0;
  let approvedAmount = 0;
  let completedAmount = 0;
  let rejectedAmount = 0;
  let pendingCount = 0;
  let processingCount = 0;
  let approvedCount = 0;
  let rejectedCount = 0;
  let completedCount = 0;

  for (const r of records) {
    if (r.status === 'Pending') {
      pendingCount += 1;
      pendingAmount += r.amount;
    } else if (r.status === 'Processing') {
      processingCount += 1;
      processingAmount += r.amount;
    } else if (r.status === 'Approved') {
      approvedCount += 1;
      approvedAmount += r.amount;
    } else if (r.status === 'Rejected') {
      rejectedCount += 1;
      rejectedAmount += r.amount;
    } else if (r.status === 'Completed') {
      completedCount += 1;
      completedAmount += r.amount;
    }
  }

  const newlyPendingDelta = pendingAmount - INITIAL_PENDING_AMOUNT;
  const availableDemoBalance = Math.max(0, baseBalance - newlyPendingDelta);

  return {
    availableDemoBalance,
    pendingAmount,
    processingAmount,
    approvedAmount,
    completedAmount,
    rejectedAmount,
    totalRequestsCount: records.length,
    pendingCount,
    processingCount,
    approvedCount,
    rejectedCount,
    completedCount,
  };
}

export function matchesWithdrawalDateFilter(
  dateIso: string,
  filter: WithdrawalDateFilter
): boolean {
  if (filter === 'all') return true;
  if (filter === 'today') return dateIso === WITHDRAWALS_TODAY_ISO;
  if (filter === 'this_week') return dateIso >= '2026-11-06' && dateIso <= WITHDRAWALS_TODAY_ISO;
  if (filter === 'this_month') return dateIso >= '2026-11-01' && dateIso <= '2026-11-30';
  if (filter === 'last_month') return dateIso >= '2026-10-01' && dateIso <= '2026-10-31';
  return true;
}
