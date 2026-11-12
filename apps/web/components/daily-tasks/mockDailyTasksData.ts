import {
  DailyHostProfile,
  DailyTaskItem,
  DailyTaskSummaryMetrics,
  TaskCategoryId,
  TaskStatus,
} from './types';

export const SAMPLE_TASK_DATE = 'Nov 12, 2026';

export const SAMPLE_HOST_PROFILE: DailyHostProfile = {
  hostName: 'Ayesha Khan',
  username: '@ayesha.live',
  hostId: '20845176',
  avatarUrl:
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=180&auto=format&fit=crop&q=80',
  sampleDateLabel: SAMPLE_TASK_DATE,
};

export const TASK_CATEGORY_OPTIONS: {
  id: TaskCategoryId;
  label: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    id: 'live_streaming',
    label: 'Live Streaming Tasks',
    shortLabel: 'Live Streaming',
    description: 'Sample daily broadcast and streaming duration goals',
  },
  {
    id: 'gift_activity',
    label: 'Gift Activity Tasks',
    shortLabel: 'Gift Activity',
    description: 'Sample viewer appreciation and live gift interaction goals',
  },
  {
    id: 'community',
    label: 'Community Tasks',
    shortLabel: 'Community',
    description: 'Sample audience engagement, greeting, and party room goals',
  },
];

export const TASK_STATUS_STYLES: Record<
  TaskStatus,
  {
    badgeClasses: string;
    cardBorderClasses: string;
    progressBarClasses: string;
    textAccentClass: string;
  }
> = {
  'Not Started': {
    badgeClasses: 'bg-purple-500/15 border-purple-400/35 text-purple-200',
    cardBorderClasses: 'border-purple-400/20 hover:border-purple-400/40',
    progressBarClasses: 'bg-purple-400/60',
    textAccentClass: 'text-purple-200',
  },
  'In Progress': {
    badgeClasses: 'bg-[#FF1A6C]/20 border-[#FF1A6C]/45 text-[#FF85B3]',
    cardBorderClasses: 'border-[#FF1A6C]/35 hover:border-[#FF1A6C]/60',
    progressBarClasses: 'bg-gradient-to-r from-[#FF1A6C] to-[#EC4899]',
    textAccentClass: 'text-[#FF85B3]',
  },
  Completed: {
    badgeClasses: 'bg-amber-400/15 border-amber-400/45 text-amber-300',
    cardBorderClasses: 'border-amber-400/35 hover:border-amber-400/55',
    progressBarClasses: 'bg-gradient-to-r from-emerald-400 to-amber-300',
    textAccentClass: 'text-emerald-300',
  },
  Locked: {
    badgeClasses: 'bg-slate-500/15 border-white/15 text-purple-200/55',
    cardBorderClasses: 'border-white/10 opacity-85',
    progressBarClasses: 'bg-white/25',
    textAccentClass: 'text-purple-200/55',
  },
};

export function createInitialDailyTasks(): DailyTaskItem[] {
  return [
    {
      id: 'task-go-live-60',
      title: 'Go live for 60 minutes',
      description: 'Reach a sample live duration target across your daily host broadcast.',
      category: 'live_streaming',
      categoryLabel: 'Live Streaming',
      iconKey: 'clock',
      currentProgress: 45,
      targetProgress: 60,
      unit: 'min',
      stepIncrement: 15,
      status: 'In Progress',
      taskDate: SAMPLE_TASK_DATE,
      completedDate: null,
      instructions: [
        'Open Host Studio when official live streaming is scheduled.',
        'Maintain continuous audio/video interaction with viewers (sample target: 60 min).',
        'Use the demo progress button below to preview progress bar updates locally.',
      ],
    },
    {
      id: 'task-receive-10-gifts',
      title: 'Receive 10 gifts during live sessions',
      description: 'Engage audience members to receive sample viewer gifts in live sessions.',
      category: 'gift_activity',
      categoryLabel: 'Gift Activity',
      iconKey: 'gift',
      currentProgress: 10,
      targetProgress: 10,
      unit: 'gifts',
      stepIncrement: 2,
      status: 'Completed',
      taskDate: SAMPLE_TASK_DATE,
      completedDate: SAMPLE_TASK_DATE,
      instructions: [
        'Host an interactive live session and acknowledge viewer greetings.',
        'Sample display goal marks completed at 10 viewer gift interactions.',
        'This frontend demo does not calculate points, coins, or payout rewards.',
      ],
    },
    {
      id: 'task-welcome-5-viewers',
      title: 'Welcome 5 new viewers',
      description: 'Greet newly joined audience members in room chat during your stream.',
      category: 'community',
      categoryLabel: 'Community',
      iconKey: 'users',
      currentProgress: 5,
      targetProgress: 5,
      unit: 'viewers',
      stepIncrement: 1,
      status: 'Completed',
      taskDate: SAMPLE_TASK_DATE,
      completedDate: SAMPLE_TASK_DATE,
      instructions: [
        'Watch the live room entry feed when first-time visitors arrive.',
        'Send a friendly welcome greeting by voice or text chat.',
        'Sample goal updates completed state in local UI memory only.',
      ],
    },
    {
      id: 'task-join-party-room',
      title: 'Join a party room',
      description: 'Participate in a collaborative audio or multi-guest community party room.',
      category: 'community',
      categoryLabel: 'Community',
      iconKey: 'radio',
      currentProgress: 0,
      targetProgress: 1,
      unit: 'room',
      stepIncrement: 1,
      status: 'Not Started',
      taskDate: SAMPLE_TASK_DATE,
      completedDate: null,
      instructions: [
        'Browse active community party rooms from the Popo Live lobby.',
        'Take an open guest seat or participate in room conversation.',
        'Tap Mark Complete (Demo) to inspect completed task summary updates.',
      ],
    },
    {
      id: 'task-complete-live-session',
      title: 'Complete a live streaming session',
      description: 'Finish at least one valid sample live broadcast session on the schedule date.',
      category: 'live_streaming',
      categoryLabel: 'Live Streaming',
      iconKey: 'video',
      currentProgress: 1,
      targetProgress: 1,
      unit: 'session',
      stepIncrement: 1,
      status: 'Completed',
      taskDate: SAMPLE_TASK_DATE,
      completedDate: SAMPLE_TASK_DATE,
      instructions: [
        'Review pre-live lighting, title, and category setup.',
        'Run a complete host broadcast and close using the End Screen summary.',
        'Sample state shown here is static placeholder UI only.',
      ],
    },
    {
      id: 'task-interact-audience',
      title: 'Interact with audience chat messages',
      description: 'Reply to viewer comments and questions in live chat to keep engagement warm.',
      category: 'community',
      categoryLabel: 'Community',
      iconKey: 'message',
      currentProgress: 9,
      targetProgress: 15,
      unit: 'replies',
      stepIncrement: 3,
      status: 'In Progress',
      taskDate: SAMPLE_TASK_DATE,
      completedDate: null,
      instructions: [
        'Respond to questions and shout-outs inside room chat.',
        'Encourage viewers to share feedback during your broadcast.',
        'Increment demo replies locally to test live percentage recalculation.',
      ],
    },
    {
      id: 'task-maintain-streaming-goal',
      title: 'Maintain a sample streaming activity goal',
      description: 'Keep consistent host activity check-ins across scheduled room segments.',
      category: 'live_streaming',
      categoryLabel: 'Live Streaming',
      iconKey: 'flame',
      currentProgress: 0,
      targetProgress: 3,
      unit: 'segments',
      stepIncrement: 1,
      status: 'Not Started',
      taskDate: SAMPLE_TASK_DATE,
      completedDate: null,
      instructions: [
        'Prepare three sample activity segments inside your live broadcast.',
        'Track segment pacing without relying on automatic background timers.',
        'Official streak rules remain pending backend approval.',
      ],
    },
    {
      id: 'task-gift-activity-target',
      title: 'Reach a sample gift activity target',
      description: 'Unlock higher-tier community gift activity goals after prerequisite tasks.',
      category: 'gift_activity',
      categoryLabel: 'Gift Activity',
      iconKey: 'sparkles',
      currentProgress: 0,
      targetProgress: 25,
      unit: 'gifts',
      stepIncrement: 5,
      status: 'Locked',
      taskDate: SAMPLE_TASK_DATE,
      completedDate: null,
      unlockRequirementLabel: 'Preview Locked State · Requires prerequisite daily goal',
      instructions: [
        'Demonstrates how a future locked milestone renders in the task dashboard.',
        'No real reward points, wallet credits, or diamond rates are implied.',
        'Configurable via backend once official host task rules are finalized.',
      ],
    },
  ];
}

export function calculateTaskPercentage(task: DailyTaskItem): number {
  if (task.targetProgress <= 0) return 0;
  const clamped = Math.min(task.currentProgress, task.targetProgress);
  return Math.round((clamped / task.targetProgress) * 100);
}

export function computeDailyTaskSummary(tasks: DailyTaskItem[]): DailyTaskSummaryMetrics {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length;
  const notStartedTasks = tasks.filter((t) => t.status === 'Not Started').length;
  const lockedTasks = tasks.filter((t) => t.status === 'Locked').length;
  const activeTasks = tasks.filter((t) => t.status !== 'Completed').length;
  const remainingTasks = Math.max(0, totalTasks - completedTasks);
  const overallPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    notStartedTasks,
    lockedTasks,
    activeTasks,
    remainingTasks,
    overallPercentage,
  };
}
