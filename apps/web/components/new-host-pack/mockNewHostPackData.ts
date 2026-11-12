import {
  GuideCategoryId,
  GuideCategoryMeta,
  LearningStepItem,
  PackProgressSummary,
} from './types';

export const SAMPLE_PACK_HOST = {
  hostName: 'Ayesha Khan',
  username: '@ayesha.live',
  hostId: '20845176',
  avatarUrl:
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=180&auto=format&fit=crop&q=80',
};

export const INITIAL_COMPLETED_STEP_IDS: string[] = [
  'profile-picture',
  'profile-display-name',
  'live-intro',
  'safety-guidelines',
];

export const GUIDE_CATEGORIES: GuideCategoryMeta[] = [
  {
    id: 'profile_setup',
    cardTitle: 'Set up your profile',
    cardSubtitle: 'Add a photo and creator bio',
    sectionTitle: 'Profile Setup Guide',
    sectionDescription:
      'Prepare a recognizable host profile using existing Popo Live profile screens.',
    iconKey: 'user_check',
    primaryRouteLabel: 'Open Profile Editor',
    primaryRouteHref: '/profile/edit',
  },
  {
    id: 'live_streaming',
    cardTitle: 'Learn the live tools',
    cardSubtitle: 'Explore host controls and safety',
    sectionTitle: 'Live Streaming Guide',
    sectionDescription:
      'Beginner-friendly walkthrough of stream setup, controls, audience chat, and party rooms.',
    iconKey: 'video',
    primaryRouteLabel: 'Preview Live Lobby',
    primaryRouteHref: '/live',
  },
  {
    id: 'community_safety',
    cardTitle: 'Meet your community',
    cardSubtitle: 'Connect with viewers and fans',
    sectionTitle: 'Community and Safety Guide',
    sectionDescription:
      'Best practices for respectful communication, privacy awareness, and safety tools.',
    iconKey: 'shield',
    primaryRouteLabel: 'Open Safety Center',
    primaryRouteHref: '/safety',
  },
  {
    id: 'host_goals',
    cardTitle: 'Know your goals',
    cardSubtitle: 'Review tasks and creator rules',
    sectionTitle: 'Host Goals Guide',
    sectionDescription:
      'Discover how sample daily goals and host levels fit into your creator workflow.',
    iconKey: 'trophy',
    primaryRouteLabel: 'Open Daily Host Tasks',
    primaryRouteHref: '/daily-tasks',
  },
];

export function createInitialLearningSteps(): LearningStepItem[] {
  return [
    // 1. Profile Setup Guide (5 steps)
    {
      id: 'profile-picture',
      category: 'profile_setup',
      categoryLabel: 'Profile Setup Guide',
      orderIndex: 1,
      title: 'Add profile picture',
      shortDescription: 'Choose a clear, friendly portrait photo for your Popo Live host card.',
      instructionContent: [
        'Use a well-lit photo so viewers recognize your host card in the Live lobby.',
        'Open the existing Edit Profile screen whenever you are ready to update your avatar.',
        'Keep profile imagery respectful and aligned with community guidelines.',
      ],
      iconKey: 'camera',
      relatedRouteLabel: 'Open Profile Editor',
      relatedRouteHref: '/profile/edit',
    },
    {
      id: 'profile-display-name',
      category: 'profile_setup',
      categoryLabel: 'Profile Setup Guide',
      orderIndex: 2,
      title: 'Set display name',
      shortDescription: 'Pick an easy-to-remember creator nickname that audience members can search.',
      instructionContent: [
        'Keep your display name readable across mobile room overlays and search results.',
        'Avoid misleading impersonation titles or restricted characters.',
        'Review changes anytime from your existing Popo Live profile settings.',
      ],
      iconKey: 'user_check',
      relatedRouteLabel: 'Open Profile Editor',
      relatedRouteHref: '/profile/edit',
    },
    {
      id: 'profile-bio',
      category: 'profile_setup',
      categoryLabel: 'Profile Setup Guide',
      orderIndex: 3,
      title: 'Add profile bio',
      shortDescription: 'Introduce your stream topics, languages, or hosting style in a short bio.',
      instructionContent: [
        'Write 1–2 welcoming sentences describing music, chat, talent, or gaming themes.',
        'Skip sharing personal contact details like private phone numbers in public bios.',
        'Save updates cleanly inside the existing profile editor screen.',
      ],
      iconKey: 'file_text',
      relatedRouteLabel: 'Edit Profile Bio',
      relatedRouteHref: '/profile/edit',
    },
    {
      id: 'profile-review',
      category: 'profile_setup',
      categoryLabel: 'Profile Setup Guide',
      orderIndex: 4,
      title: 'Review profile information',
      shortDescription: 'Double-check your host ID, nickname, and visible tabs on your Profile page.',
      instructionContent: [
        'Visit your main Profile hub to confirm avatar, bio, and follower counters appear as expected.',
        'Check your Earning Identity readiness shortcut inside your Profile About links.',
        'No duplicate profile form is required—all updates stay in the core Profile screen.',
      ],
      iconKey: 'clipboard',
      relatedRouteLabel: 'Open My Profile',
      relatedRouteHref: '/profile',
    },
    {
      id: 'profile-preview',
      category: 'profile_setup',
      categoryLabel: 'Profile Setup Guide',
      orderIndex: 5,
      title: 'Preview creator profile',
      shortDescription: 'See how new visitors experience your creator card and Square posts.',
      instructionContent: [
        'Verify your About tab links (Square, Fan Club, Invites, Daily Host Tasks) are easy to browse.',
        'Notice how clean creator profiles help retain returning room visitors.',
      ],
      iconKey: 'eye',
      relatedRouteLabel: 'Preview Profile Page',
      relatedRouteHref: '/profile',
    },

    // 2. Live Streaming Guide (6 steps)
    {
      id: 'live-intro',
      category: 'live_streaming',
      categoryLabel: 'Live Streaming Guide',
      orderIndex: 6,
      title: 'Introduction to live streaming',
      shortDescription: 'Learn how solo live rooms and Discovery feeds connect hosts with viewers.',
      instructionContent: [
        'Popo Live rooms appear across Explore, Following, New, and Party discovery feeds.',
        'Hosts welcome guests through interactive room chat and friendly audio/video broadcasts.',
        'This starter guide is informational only and never launches a live broadcast automatically.',
      ],
      iconKey: 'video',
      relatedRouteLabel: 'Browse Live Lobby',
      relatedRouteHref: '/live',
    },
    {
      id: 'live-start-session',
      category: 'live_streaming',
      categoryLabel: 'Live Streaming Guide',
      orderIndex: 7,
      title: 'How to start a live session',
      shortDescription: 'Understand the pre-live setup steps before opening a stream.',
      instructionContent: [
        'Review your stream title, cover photo, and room category inside the Pre-Live setup flow.',
        'Test stable Wi-Fi, lighting, and microphone clarity prior to going live.',
        'Opening Go Live from main app navigation uses the approved Phase 4 Go-Live gates.',
      ],
      iconKey: 'radio',
      relatedRouteLabel: 'View Go-Live Flow',
      relatedRouteHref: '/go-live',
    },
    {
      id: 'live-controls',
      category: 'live_streaming',
      categoryLabel: 'Live Streaming Guide',
      orderIndex: 8,
      title: 'Basic live screen controls',
      shortDescription: 'Get familiar with camera flip, mic mute, beauty filters, and room settings.',
      instructionContent: [
        'Locate mute, camera switch, quality guard, and moderation actions in Host Studio.',
        'Quality and Cost Guard keeps video smooth when network bandwidth dips.',
        'Use room controls calmly to maintain clear host audio and lighting.',
      ],
      iconKey: 'sliders',
      relatedRouteLabel: 'Open Live Discovery',
      relatedRouteHref: '/live',
    },
    {
      id: 'live-audience',
      category: 'live_streaming',
      categoryLabel: 'Live Streaming Guide',
      orderIndex: 9,
      title: 'Audience interaction',
      shortDescription: 'Greet newcomers by name and keep conversation flowing naturally in room chat.',
      instructionContent: [
        'Acknowledge newly joined viewers quickly so first-time visitors feel welcome.',
        'Pin friendly room topics or ask open questions to spark audience conversation.',
        'Celebrate community Fan Club supporters respectfully.',
      ],
      iconKey: 'message',
      relatedRouteLabel: 'Explore Fan Club',
      relatedRouteHref: '/fan-club',
    },
    {
      id: 'live-party-room',
      category: 'live_streaming',
      categoryLabel: 'Live Streaming Guide',
      orderIndex: 10,
      title: 'Party room introduction',
      shortDescription: 'Explore multi-guest voice seats and themed party rooms where supported.',
      instructionContent: [
        'Party rooms allow multiple hosts or guests to co-host conversations together.',
        'Manage seat requests carefully and use seat lock controls whenever needed.',
      ],
      iconKey: 'users',
      relatedRouteLabel: 'Explore Party Rooms',
      relatedRouteHref: '/party',
    },
    {
      id: 'live-safety-tips',
      category: 'live_streaming',
      categoryLabel: 'Live Streaming Guide',
      orderIndex: 11,
      title: 'Live session safety tips',
      shortDescription: 'Keep your stream environment respectful, calm, and aligned with host rules.',
      instructionContent: [
        'Never broadcast sensitive personal documents, private addresses, or payment credentials.',
        'Mute or remove disruptive participants immediately using live moderation controls.',
      ],
      iconKey: 'shield',
      relatedRouteLabel: 'Open Safety Tools',
      relatedRouteHref: '/safety',
    },

    // 3. Community and Safety Guide (6 steps)
    {
      id: 'safety-guidelines',
      category: 'community_safety',
      categoryLabel: 'Community & Safety Guide',
      orderIndex: 12,
      title: 'Community guidelines',
      shortDescription: 'Review Popo Live safety standards for welcoming, age-appropriate broadcasts.',
      instructionContent: [
        'Maintain welcoming rooms free from harassment, hate speech, or prohibited content.',
        'Read the official Community Guidelines summary inside the Policies module.',
      ],
      iconKey: 'shield',
      relatedRouteLabel: 'View Community Guidelines',
      relatedRouteHref: '/policies/community-guidelines',
    },
    {
      id: 'safety-respectful-comm',
      category: 'community_safety',
      categoryLabel: 'Community & Safety Guide',
      orderIndex: 13,
      title: 'Respectful communication',
      shortDescription: 'Set healthy room boundaries and encourage supportive chat culture.',
      instructionContent: [
        'Lead your chat with positive tone and clear expectations for guest behavior.',
        'De-escalate disagreements politely or remove repeat troublemakers cleanly.',
      ],
      iconKey: 'heart_handshake',
      relatedRouteLabel: 'Read Host Standards',
      relatedRouteHref: '/community-guidelines',
    },
    {
      id: 'safety-reporting',
      category: 'community_safety',
      categoryLabel: 'Community & Safety Guide',
      orderIndex: 14,
      title: 'Reporting inappropriate content',
      shortDescription: 'Know how to report spam, abuse, or policy violations quickly.',
      instructionContent: [
        'Use in-room or Square report actions whenever content violates platform safety rules.',
        'Include accurate details so review teams can follow up appropriately.',
      ],
      iconKey: 'flag',
      relatedRouteLabel: 'Open Safety Center',
      relatedRouteHref: '/safety',
    },
    {
      id: 'safety-blocking',
      category: 'community_safety',
      categoryLabel: 'Community & Safety Guide',
      orderIndex: 15,
      title: 'Blocking and safety tools',
      shortDescription: 'Manage blocked users and room mutes to keep your personal space comfortable.',
      instructionContent: [
        'Review your Blacklist / Blocked Users controls anytime from account settings.',
        'Blocked accounts cannot harass you in rooms or private messages.',
      ],
      iconKey: 'lock',
      relatedRouteLabel: 'Manage Blacklist',
      relatedRouteHref: '/settings/blacklist',
    },
    {
      id: 'safety-privacy',
      category: 'community_safety',
      categoryLabel: 'Community & Safety Guide',
      orderIndex: 16,
      title: 'Privacy information',
      shortDescription: 'Understand how personal details and documents stay protected.',
      instructionContent: [
        'Keep off-platform phone numbers, addresses, and ID documents strictly private during live broadcasts.',
        'Consult Popo Live Privacy Policy for official data handling standards.',
      ],
      iconKey: 'lock',
      relatedRouteLabel: 'View Privacy Policy',
      relatedRouteHref: '/policies/privacy',
    },
    {
      id: 'safety-tips',
      category: 'community_safety',
      categoryLabel: 'Community & Safety Guide',
      orderIndex: 17,
      title: 'Safe interaction tips',
      shortDescription: 'Practical habits for keeping your account, gifts, and sessions secure.',
      instructionContent: [
        'Never share account OTPs, passwords, or private session tokens with anyone.',
        'Contact official Support via `/help` if someone claims to represent staff improperly.',
      ],
      iconKey: 'sparkles',
      relatedRouteLabel: 'Get Support / Help',
      relatedRouteHref: '/help',
    },

    // 4. Host Goals Guide (4 steps)
    {
      id: 'goals-daily-tasks',
      category: 'host_goals',
      categoryLabel: 'Host Goals Guide',
      orderIndex: 18,
      title: 'Daily Host Tasks introduction',
      shortDescription: 'Explore how daily host activity goals organize streaming and community steps.',
      instructionContent: [
        'Module 9.2 Daily Host Tasks showcases live duration, gift activity, and community interaction samples.',
        'Open Daily Host Tasks directly to inspect Active Tasks, Completed Tasks, and Task Details.',
        'Sample goals shown in frontend preview do not imply official payout rates.',
      ],
      iconKey: 'list_todo',
      relatedRouteLabel: 'Open Daily Host Tasks',
      relatedRouteHref: '/daily-tasks',
    },
    {
      id: 'goals-task-level',
      category: 'host_goals',
      categoryLabel: 'Host Goals Guide',
      orderIndex: 19,
      title: 'Task Level introduction',
      shortDescription: 'See how creator activity tiers visualize progression across sample milestones.',
      instructionContent: [
        'Module 9.3 Task Level displays current level, progress toward next tiers, and placeholder benefits.',
        'Open Task Level to preview tier transitions and sample achievement history.',
      ],
      iconKey: 'trophy',
      relatedRouteLabel: 'Open Task Level',
      relatedRouteHref: '/task-level',
    },
    {
      id: 'goals-activity-overview',
      category: 'host_goals',
      categoryLabel: 'Host Goals Guide',
      orderIndex: 20,
      title: 'Creator activity overview',
      shortDescription: 'Review how Earning Identity preparation connects with creator tools.',
      instructionContent: [
        'Module 9.1 Earning Identity prepares your host profile information cleanly ahead of verification.',
        'All earning rules remain subject to final client-approved policies.',
      ],
      iconKey: 'sparkles',
      relatedRouteLabel: 'Open Earning Identity',
      relatedRouteHref: '/earning-identity',
    },
    {
      id: 'goals-hosting-tips',
      category: 'host_goals',
      categoryLabel: 'Host Goals Guide',
      orderIndex: 21,
      title: 'Basic hosting tips',
      shortDescription: 'Build consistent schedules, greet returning viewers, and reach out if you need help.',
      instructionContent: [
        'Consistent session timing helps regular fans find your live room easily.',
        'Visit Popo Live Help Center whenever you have questions about creator tools.',
      ],
      iconKey: 'help',
      relatedRouteLabel: 'Open Help Center',
      relatedRouteHref: '/help',
    },
  ];
}

export function computePackProgress(
  steps: LearningStepItem[],
  completedStepIds: string[]
): PackProgressSummary {
  const completedSet = new Set(completedStepIds);
  const totalSteps = steps.length;
  const completedCount = steps.filter((s) => completedSet.has(s.id)).length;
  const pendingCount = Math.max(0, totalSteps - completedCount);
  const overallPercent =
    totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  const recommendedNextStep = steps.find((s) => !completedSet.has(s.id)) || null;

  const categories = GUIDE_CATEGORIES.map((category) => {
    const catSteps = steps.filter((s) => s.category === category.id);
    const total = catSteps.length;
    const completed = catSteps.filter((s) => completedSet.has(s.id)).length;
    const pending = Math.max(0, total - completed);
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      category,
      total,
      completed,
      pending,
      percent,
    };
  });

  return {
    totalSteps,
    completedCount,
    pendingCount,
    overallPercent,
    recommendedNextStep,
    categories,
  };
}

export function getCategoryMeta(id: GuideCategoryId): GuideCategoryMeta {
  return GUIDE_CATEGORIES.find((c) => c.id === id) || GUIDE_CATEGORIES[0];
}
