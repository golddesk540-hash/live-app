import {
  ComputedTaskLevelItem,
  HostLevelHostProfile,
  TaskLevelBenefit,
  TaskLevelDefinition,
  TaskLevelHistoryRecord,
  TaskLevelStatus,
} from './types';

export const DEFAULT_DEMO_POINTS = 650;

export const SAMPLE_LEVEL_HOST: HostLevelHostProfile = {
  hostName: 'Ayesha Khan',
  username: '@ayesha.live',
  hostId: '20845176',
  avatarUrl:
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=180&auto=format&fit=crop&q=80',
  sampleDateLabel: 'Nov 12, 2026',
};

export const SAMPLE_LEVEL_DEFINITIONS: TaskLevelDefinition[] = [
  {
    id: 'level-01',
    levelNumber: 1,
    levelCode: 'Level 01',
    name: 'Starter',
    minPoints: 0,
    targetPoints: 100,
    description:
      'Entry display tier introducing daily host check-ins and introductory room activity goals.',
    iconKey: 'sprout',
    sampleMilestones: [
      'Sample introductory host activity goal threshold (100 pts).',
      'Displays foundational host profile badge preview.',
      'Frontend demonstration tier only — not an official payout rule.',
    ],
  },
  {
    id: 'level-02',
    levelNumber: 2,
    levelCode: 'Level 02',
    name: 'Active Host',
    minPoints: 100,
    targetPoints: 300,
    description:
      'Consistent host participation tier focused on steady room greetings and community visits.',
    iconKey: 'zap',
    sampleMilestones: [
      'Sample activity milestone target at 300 demo points.',
      'Highlights regular streaming engagement indicators.',
      'Configurable once backend host level parameters are approved.',
    ],
  },
  {
    id: 'level-03',
    levelNumber: 3,
    levelCode: 'Level 03',
    name: 'Rising Creator',
    minPoints: 300,
    targetPoints: 900,
    description:
      'Growing creator stage showcasing active audience conversations and ongoing room milestones.',
    iconKey: 'star',
    sampleMilestones: [
      'Sample default active level in frontend preview (650 / 900 pts).',
      'Tracks progression smoothly toward Popular Host tier.',
      'No financial multipliers or cash guarantees implied.',
    ],
  },
  {
    id: 'level-04',
    levelNumber: 4,
    levelCode: 'Level 04',
    name: 'Popular Host',
    minPoints: 900,
    targetPoints: 1500,
    description:
      'Upcoming creator tier representing recognized community rooms and frequent collaborations.',
    iconKey: 'flame',
    sampleMilestones: [
      'Upcoming threshold at 1,500 sample task points.',
      'Demonstrates next-tier preview formatting and progress delta.',
      'Subject to official platform policy rules.',
    ],
  },
  {
    id: 'level-05',
    levelNumber: 5,
    levelCode: 'Level 05',
    name: 'Star Creator',
    minPoints: 1500,
    targetPoints: 2500,
    description:
      'Top frontend showcase tier previewing future creator recognition and profile frames.',
    iconKey: 'crown',
    sampleMilestones: [
      'Top sample threshold set at 2,500 demo task points.',
      'Demonstrates locked state progression until prior level threshold is met.',
      'Does not imply verified payout, commission, or withdrawal privileges.',
    ],
  },
];

export const SAMPLE_LEVEL_BENEFITS: TaskLevelBenefit[] = [
  {
    id: 'benefit-starter-frame',
    title: 'Starter Welcome Frame Preview',
    description:
      'Sample host profile frame placeholder for early onboarding visibility.',
    associatedLevelNumber: 1,
    associatedLevelLabel: 'Level 01 · Starter',
    iconKey: 'award',
  },
  {
    id: 'benefit-active-tag',
    title: 'Active Host Profile Tag Preview',
    description:
      'Visual community activity tag displayed on sample host profile previews.',
    associatedLevelNumber: 2,
    associatedLevelLabel: 'Level 02 · Active Host',
    iconKey: 'shield',
  },
  {
    id: 'benefit-rising-spotlight',
    title: 'Rising Creator Lobby Pill Preview',
    description:
      'Demo decorative badge highlighting Rising Creator stage in card headers.',
    associatedLevelNumber: 3,
    associatedLevelLabel: 'Level 03 · Rising Creator',
    iconKey: 'sparkles',
  },
  {
    id: 'benefit-popular-room',
    title: 'Popular Host Visual Badge Preview',
    description:
      'Sample room card accent badge demonstrating upcoming host tier styling.',
    associatedLevelNumber: 4,
    associatedLevelLabel: 'Level 04 · Popular Host',
    iconKey: 'users',
  },
  {
    id: 'benefit-star-crown',
    title: 'Star Creator Gold Crown Frame',
    description:
      'Gold showcase icon placeholder unlocked when demo points reach Level 05.',
    associatedLevelNumber: 5,
    associatedLevelLabel: 'Level 05 · Star Creator',
    iconKey: 'crown',
  },
];

export function createInitialLevelHistory(): TaskLevelHistoryRecord[] {
  return [
    {
      id: 'hist-03',
      previousLevelLabel: 'Level 02 · Active Host',
      newLevelLabel: 'Level 03 · Rising Creator',
      achievementDate: 'Nov 12, 2026',
      pointsAtAchievement: 320,
      achievementStatus: 'Achieved',
    },
    {
      id: 'hist-02',
      previousLevelLabel: 'Level 01 · Starter',
      newLevelLabel: 'Level 02 · Active Host',
      achievementDate: 'Nov 11, 2026',
      pointsAtAchievement: 115,
      achievementStatus: 'Achieved',
    },
    {
      id: 'hist-01',
      previousLevelLabel: 'New Host Onboarding',
      newLevelLabel: 'Level 01 · Starter',
      achievementDate: 'Nov 10, 2026',
      pointsAtAchievement: 100,
      achievementStatus: 'Achieved',
    },
  ];
}

export function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function resolveTaskLevelState(pointsInput: number): {
  safePoints: number;
  currentLevelIndex: number;
  currentLevel: ComputedTaskLevelItem;
  nextLevel: ComputedTaskLevelItem | null;
  levels: ComputedTaskLevelItem[];
  overallPercent: number;
  remainingToNext: number;
} {
  const safePoints = Math.max(0, Math.round(pointsInput));

  // Index of current active tier based on thresholds (default 650 pts -> Level 03 target 900)
  let currentLevelIndex = SAMPLE_LEVEL_DEFINITIONS.findIndex(
    (lvl) => safePoints < lvl.targetPoints
  );
  if (currentLevelIndex === -1) {
    currentLevelIndex = SAMPLE_LEVEL_DEFINITIONS.length - 1;
  }

  const levels: ComputedTaskLevelItem[] = SAMPLE_LEVEL_DEFINITIONS.map((lvl, idx) => {
    const reachedMax = safePoints >= lvl.targetPoints;
    let status: TaskLevelStatus;
    if (reachedMax) {
      status = 'Completed';
    } else if (idx === currentLevelIndex) {
      status = 'Current';
    } else if (idx === currentLevelIndex + 1) {
      status = 'Upcoming';
    } else {
      status = 'Locked';
    }

    const progressPercent =
      lvl.targetPoints > 0 ? clampPercentage((safePoints / lvl.targetPoints) * 100) : 0;
    const remainingPoints = Math.max(0, lvl.targetPoints - safePoints);

    return {
      ...lvl,
      status,
      progressPercent,
      remainingPoints,
    };
  });

  const currentLevel = levels[currentLevelIndex];
  const nextLevel =
    currentLevelIndex + 1 < levels.length ? levels[currentLevelIndex + 1] : null;
  const overallPercent = currentLevel.progressPercent;
  const remainingToNext = currentLevel.remainingPoints;

  return {
    safePoints,
    currentLevelIndex,
    currentLevel,
    nextLevel,
    levels,
    overallPercent,
    remainingToNext,
  };
}

export const LEVEL_STATUS_STYLES: Record<
  TaskLevelStatus,
  {
    badgeClasses: string;
    cardBorderClasses: string;
    progressBarClasses: string;
  }
> = {
  Completed: {
    badgeClasses: 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300',
    cardBorderClasses: 'border-emerald-400/30 hover:border-emerald-400/50',
    progressBarClasses: 'bg-gradient-to-r from-emerald-400 to-amber-300',
  },
  Current: {
    badgeClasses: 'bg-amber-400/15 border-amber-400/50 text-amber-300',
    cardBorderClasses: 'border-[#FF1A6C]/50 bg-[#1B0939] shadow-glow-pink',
    progressBarClasses: 'bg-gradient-to-r from-[#FF1A6C] via-[#EC4899] to-amber-300',
  },
  Upcoming: {
    badgeClasses: 'bg-purple-500/20 border-purple-400/35 text-purple-200',
    cardBorderClasses: 'border-purple-400/25 hover:border-purple-400/45',
    progressBarClasses: 'bg-purple-400/65',
  },
  Locked: {
    badgeClasses: 'bg-white/5 border-white/15 text-purple-200/55',
    cardBorderClasses: 'border-white/10 opacity-85',
    progressBarClasses: 'bg-white/25',
  },
};
