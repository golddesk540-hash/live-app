import {
  SafetyAlertRecord,
  SafetyCaseRecord,
  SafetyGuidelineItem,
  SafetyMetrics,
} from './childSafetyTypes';

export const SAFETY_GUIDELINES_DATA: SafetyGuidelineItem[] = [
  {
    id: 'GL-01',
    title: 'Age Verification Protocols',
    category: 'Age-Related Safety',
    summary: 'Standard operating procedure for reviewing suspected underage profile representations.',
    keyPoints: [
      'Popo Live enforces a strict 18+ policy for all broadcasting hosts and monetized accounts.',
      'Profile photos with ambiguous age markers require immediate KYC document re-validation.',
      'Never attempt to estimate or infer exact numerical age without verified government ID documentation.',
    ],
    protocolSteps: [
      'Pause live broadcast privileges temporarily during active age inquiry.',
      'Request government photo ID through encrypted in-app KYC channel.',
      'Verify document holographic markers and date of birth match account registration.',
    ],
    iconName: 'ShieldCheck',
  },
  {
    id: 'GL-02',
    title: 'Safe Community Interactions',
    category: 'Interaction Standards',
    summary: 'Ensuring safe, respectful, and protected interactions across audio seats and live rooms.',
    keyPoints: [
      'Co-hosting audio seats must be actively moderated by room creators and designated administrators.',
      'Unsolicited private messaging targeting younger-appearing accounts triggers immediate velocity limits.',
      'All live room text and audio transcripts are monitored by automated keyword toxicity classifiers.',
    ],
    protocolSteps: [
      'Flag suspicious direct message sequences through heuristic safety scoring.',
      'Apply 24-hour interaction hold on accounts demonstrating repetitive aggressive reach-outs.',
      'Escalate repeat offenders to the Senior Safety Review Team for account restriction.',
    ],
    iconName: 'Users',
  },
  {
    id: 'GL-03',
    title: 'Inappropriate Interaction Prevention',
    category: 'Anti-Grooming & Protection',
    summary: 'Zero tolerance protocols for predatory communications, contact soliciting, or coercive behavior.',
    keyPoints: [
      'Attempting to transition conversation to unmonitored external messaging apps is strictly barred.',
      'Soliciting off-platform phone numbers, addresses, or private photos results in immediate suspension.',
      'Automated rate-limiting mutes any user attempting bulk contact requests.',
    ],
    protocolSteps: [
      'Automated audit engine quarantines messages containing suspicious contact solicitation strings.',
      'Quarantined incidents are routed to the High-Priority Safety Queue with Urgent designation.',
      'Permanent account termination and IP network blocking executed upon confirmed violation.',
    ],
    iconName: 'AlertTriangle',
  },
  {
    id: 'GL-04',
    title: 'Harassment & Bullying Intervention',
    category: 'Community Conduct',
    summary: 'Rapid response mechanisms for targeted harassment, verbal abuse, or room disruptions.',
    keyPoints: [
      'Immediate room mute and ejection tools available to hosts and automated safety bots.',
      'Targeted harassment campaigns result in cumulative strikes against offending user IDs.',
      'Hosts experiencing organized raiding receive dynamic room shield protection.',
    ],
    protocolSteps: [
      'Apply dynamic 30-minute room lock to prevent raid participation.',
      'Log audio room participants and chat transcripts into the case evidence ledger.',
      'Issue formal conduct warning or account restriction based on violation history.',
    ],
    iconName: 'MessageSquareWarning',
  },
  {
    id: 'GL-05',
    title: 'Reporting Safety Issues',
    category: 'User Reporting',
    summary: 'Facilitating rapid in-app reporting channels for viewers and room participants.',
    keyPoints: [
      'One-tap safety reporting accessible on every live room viewer card and profile sheet.',
      'Reports flagged with minor safety keywords receive automatic queue priority escalation.',
      'Whistleblower reporter identities remain strictly confidential and protected from public view.',
    ],
    protocolSteps: [
      'Classify incoming report telemetry into category queues within 60 seconds of lodgement.',
      'Prioritize reports with multiple co-witness corroborations into the Urgent queue.',
      'Provide anonymized status feedback to reporter confirming review completion.',
    ],
    iconName: 'FileQuestion',
  },
  {
    id: 'GL-06',
    title: 'Protecting User Privacy',
    category: 'Data Governance',
    summary: 'Safeguarding personal identifying information and preventing dox attempts.',
    keyPoints: [
      'Administrative screens must mask phone numbers, email addresses, and residential locations.',
      'Moderators are prohibited from exporting or capturing private member credentials.',
      'All administrative case actions are logged with immutable audit timestamps.',
    ],
    protocolSteps: [
      'Enforce role-based masking on all customer contact identifiers.',
      'Audit safety team access logs every 24 hours to detect abnormal account query velocity.',
      'Restrict document inspection access strictly to verified Tier 3 Safety Officers.',
    ],
    iconName: 'Lock',
  },
  {
    id: 'GL-07',
    title: 'Evidence Handling & Sanitization',
    category: 'Evidence Standards',
    summary: 'Rigorous chain-of-custody protocols for reviewing, storing, and purging incident media.',
    keyPoints: [
      'All uploaded image attachments must be screened through automated safe-browsing classifiers.',
      'Explicit or sensitive material is automatically quarantined in a secure air-gapped repository.',
      'Moderators inspect safe redacted visual excerpts with watermarked access controls.',
    ],
    protocolSteps: [
      'Generate encrypted hash fingerprint for each evidence item upon upload.',
      'Apply automated redaction filters to mask sensitive personal background details.',
      'Retain audit references in accordance with platform data retention schedules.',
    ],
    iconName: 'FileCheck',
  },
  {
    id: 'GL-08',
    title: 'Escalation Procedures',
    category: 'Incident Governance',
    summary: 'Defined routing rules for complex, multi-jurisdictional, or critical safety incidents.',
    keyPoints: [
      'Incidents meeting severe threshold criteria require dual-moderator concurrence for resolution.',
      'Duty Shift Leads must be notified of all Urgent cases within 15 minutes of triage.',
      'Emergency escalation protocols interface directly with specialized platform Trust & Safety leads.',
    ],
    protocolSteps: [
      'Mark case with Escalated flag and specify concrete rationale and incident severity score.',
      'Dispatch urgent notification to senior on-call safety lead.',
      'Hold target account in protective review status until final disposition is certified.',
    ],
    iconName: 'ArrowUpRight',
  },
];

export function createInitialSafetyCases(): SafetyCaseRecord[] {
  return [
    {
      id: '#CS-7701',
      numericId: 7701,
      category: 'Age Verification Review',
      relatedReportId: '#RP98421',
      relatedUserId: 'U10298462',
      relatedUsername: 'User_98462',
      relatedUserAvatar:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
      relatedUserStatus: 'Active',
      isHost: true,
      relatedHostId: 'H3007612',
      priority: 'Urgent',
      status: 'Under Review',
      shortDescription: 'Broadcaster age verification mismatch flagged during studio check',
      fullDescription:
        'Automated facial analysis heuristic during morning broadcast flagged a potential age discrepancy with submitted identity documents. Broadcaster account placed on priority KYC review pending certified proof of majority.',
      assignedReviewer: 'Safety Lead Sarah',
      createdDate: '2026-02-16 09:30:15',
      createdRelative: '15 min ago',
      lastUpdatedDate: '2026-02-16 09:42:00',
      lastUpdatedRelative: '3 min ago',
      isEscalated: true,
      escalationReason: 'Live stream active with 12k viewers while KYC re-verification is pending.',
      escalatedAt: '2026-02-16 09:35:00',
      reviewerNotes:
        'Requested secondary government ID upload via mobile KYC portal. Broadcaster informed via safety notification toast.',
      evidenceItems: [
        {
          id: 'EV-CS-7701-1',
          referenceId: 'REF-KYC-991',
          category: 'KYC Document Redacted',
          type: 'id_document_redacted',
          submissionDate: '2026-02-16 09:31:00',
          fileSize: '1.8 MB',
          description: 'Official National ID Card (DOB and photo visible, personal number redacted)',
          safeThumbnailUrl:
            'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
          reviewStatus: 'Pending Review',
          isRedacted: true,
        },
        {
          id: 'EV-CS-7701-2',
          referenceId: 'REF-CAM-412',
          category: 'Studio Broadcast Telemetry',
          type: 'screenshot',
          submissionDate: '2026-02-16 09:30:20',
          fileSize: '890 KB',
          description: 'Camera frame capture logged by automatic quality verification engine',
          safeThumbnailUrl:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
          reviewStatus: 'Audited',
          isRedacted: false,
        },
      ],
      timeline: [
        {
          id: 'ACT-7701-1',
          title: 'Safety Case Opened',
          adminName: 'Automated Safety Gateway',
          timestamp: '15 min ago',
          description: 'Heuristic age mismatch score exceeded 85% threshold.',
          caseStatus: 'Pending',
        },
        {
          id: 'ACT-7701-2',
          title: 'Review Assigned & Escalated',
          adminName: 'Safety Lead Sarah',
          timestamp: '10 min ago',
          description: 'Escalated to Urgent due to high room viewer concurrency.',
          caseStatus: 'Escalated',
        },
        {
          id: 'ACT-7701-3',
          title: 'KYC Verification In Progress',
          adminName: 'Safety Lead Sarah',
          timestamp: '3 min ago',
          description: 'Document comparison initiated with identity provider database.',
          caseStatus: 'Under Review',
        },
      ],
    },
    {
      id: '#CS-7702',
      numericId: 7702,
      category: 'Inappropriate Interaction',
      relatedReportId: '#RP98420',
      relatedUserId: 'U10299104',
      relatedUsername: 'User_Tariq99',
      relatedUserAvatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      relatedUserStatus: 'Restricted',
      isHost: false,
      priority: 'High',
      status: 'Under Review',
      shortDescription: 'Repetitive contact requests sent to younger host co-seats',
      fullDescription:
        'User was reported for messaging multiple newly registered broadcasters in public audio rooms asking for private social media profiles and offline contact numbers.',
      assignedReviewer: 'Mod Dave',
      createdDate: '2026-02-16 08:45:00',
      createdRelative: '1 hr ago',
      lastUpdatedDate: '2026-02-16 09:10:00',
      lastUpdatedRelative: '35 min ago',
      isEscalated: false,
      reviewerNotes:
        'Direct messaging privileges restricted for 72 hours. Reviewing room chat transcripts for further violations.',
      evidenceItems: [
        {
          id: 'EV-CS-7702-1',
          referenceId: 'REF-CHAT-882',
          category: 'Chat Transcript Extract',
          type: 'chat_excerpt',
          submissionDate: '2026-02-16 08:44:00',
          fileSize: '420 KB',
          description: 'Room audio seat transcript containing 5 off-platform solicitation messages',
          safeThumbnailUrl:
            'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
          reviewStatus: 'Sanction Applied',
          isRedacted: true,
        },
      ],
      timeline: [
        {
          id: 'ACT-7702-1',
          title: 'Report Escalated to Safety',
          adminName: 'Incident Gateway',
          timestamp: '1 hr ago',
          description: 'Report #RP98420 tagged with policy concern keyword.',
          caseStatus: 'Pending',
        },
        {
          id: 'ACT-7702-2',
          title: 'Protective Restrictions Applied',
          adminName: 'Mod Dave',
          timestamp: '35 min ago',
          description: 'Applied 72-hour DM rate limiting and seat mute.',
          caseStatus: 'Under Review',
        },
      ],
    },
    {
      id: '#CS-7703',
      numericId: 7703,
      category: 'Underage Stream Flag',
      relatedReportId: '#RP98419',
      relatedUserId: 'U10299940',
      relatedUsername: 'User_Devon',
      relatedUserAvatar:
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
      relatedUserStatus: 'Under Review',
      isHost: false,
      priority: 'High',
      status: 'Pending',
      shortDescription: 'Viewer flagged profile avatar appearing to depict a minor',
      fullDescription:
        'In-app user complaint filed regarding profile picture portraying school uniform attire. Account flagged for manual content verification.',
      assignedReviewer: 'Unassigned',
      createdDate: '2026-02-16 08:20:10',
      createdRelative: '1.5 hrs ago',
      lastUpdatedDate: '2026-02-16 08:20:10',
      lastUpdatedRelative: '1.5 hrs ago',
      isEscalated: false,
      reviewerNotes: 'Awaiting triage assignment in morning safety rotation.',
      evidenceItems: [
        {
          id: 'EV-CS-7703-1',
          referenceId: 'REF-AVT-102',
          category: 'Profile Photo Archive',
          type: 'image',
          submissionDate: '2026-02-16 08:19:00',
          fileSize: '650 KB',
          description: 'Public profile avatar uploaded during user registration',
          safeThumbnailUrl:
            'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&auto=format&fit=crop&q=80',
          reviewStatus: 'Pending Review',
          isRedacted: false,
        },
      ],
      timeline: [
        {
          id: 'ACT-7703-1',
          title: 'Case Registered',
          adminName: 'System Gatekeeper',
          timestamp: '1.5 hrs ago',
          description: 'Report filed by room host during morning PK stream.',
          caseStatus: 'Pending',
        },
      ],
    },
    {
      id: '#CS-7704',
      numericId: 7704,
      category: 'Restricted Contact Violation',
      relatedReportId: '#RP98418',
      relatedUserId: 'U10299401',
      relatedUsername: 'User_SpamBot1',
      relatedUserAvatar:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
      relatedUserStatus: 'Suspended',
      isHost: false,
      priority: 'Medium',
      status: 'Resolved',
      shortDescription: 'Automated spam bot circulating external messaging links',
      fullDescription:
        'Spam account broadcasting unauthorized WhatsApp coin promotion URLs in general rooms. Quarantined and permanently banned under platform safety policy.',
      assignedReviewer: 'Security Lead',
      createdDate: '2026-02-16 07:10:00',
      createdRelative: '2.5 hrs ago',
      lastUpdatedDate: '2026-02-16 08:00:00',
      lastUpdatedRelative: '1.8 hrs ago',
      isEscalated: false,
      reviewerNotes: 'Account terminated. Hardware signature blocked from further signups.',
      evidenceItems: [
        {
          id: 'EV-CS-7704-1',
          referenceId: 'REF-SPAM-331',
          category: 'Automated Bot Log',
          type: 'system_log',
          submissionDate: '2026-02-16 07:09:00',
          fileSize: '310 KB',
          description: 'Repetitive message logs from automated socket connection',
          safeThumbnailUrl:
            'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
          reviewStatus: 'Sanction Applied',
          isRedacted: false,
        },
      ],
      timeline: [
        {
          id: 'ACT-7704-1',
          title: 'Auto-Spam Quarantine',
          adminName: 'Bot Shield Engine',
          timestamp: '2.5 hrs ago',
          description: '12 duplicate links detected within 30 seconds.',
          caseStatus: 'Pending',
        },
        {
          id: 'ACT-7704-2',
          title: 'Sanction Confirmed & Resolved',
          adminName: 'Security Lead',
          timestamp: '1.8 hrs ago',
          description: 'Confirmed bot pattern. Permanent termination applied.',
          caseStatus: 'Resolved',
        },
      ],
    },
    {
      id: '#CS-7705',
      numericId: 7705,
      category: 'Grooming Prevention Alert',
      relatedReportId: '#RP98417',
      relatedUserId: 'U10299881',
      relatedUsername: 'Popo_Support_Official_Fake',
      relatedUserAvatar:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      relatedUserStatus: 'Suspended',
      isHost: false,
      priority: 'Urgent',
      status: 'Escalated',
      shortDescription: 'Phishing impersonation demanding account verification passwords',
      fullDescription:
        'Fraudulent account impersonating Popo Live Customer Care sending direct messages to newly verified users demanding phone numbers and security credentials under pretense of minor age safety verification.',
      assignedReviewer: 'Safety Lead Sarah',
      createdDate: '2026-02-16 06:40:00',
      createdRelative: '3 hrs ago',
      lastUpdatedDate: '2026-02-16 07:20:00',
      lastUpdatedRelative: '2.4 hrs ago',
      isEscalated: true,
      escalationReason: 'Active credential phishing campaign targeting platform creators.',
      escalatedAt: '2026-02-16 07:00:00',
      reviewerNotes:
        'Impersonation markers confirmed. Global announcement banner queued to warn users about official verification channels.',
      evidenceItems: [
        {
          id: 'EV-CS-7705-1',
          referenceId: 'REF-PHISH-01',
          category: 'Direct Message Screenshot',
          type: 'screenshot',
          submissionDate: '2026-02-16 06:38:00',
          fileSize: '1.4 MB',
          description: 'Screenshot of fraudulent DM claiming official staff affiliation',
          safeThumbnailUrl:
            'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
          reviewStatus: 'Sanction Applied',
          isRedacted: true,
        },
      ],
      timeline: [
        {
          id: 'ACT-7705-1',
          title: 'Urgent Alert Logged',
          adminName: 'Security Sensor',
          timestamp: '3 hrs ago',
          description: 'Flagged for brand impersonation and credential theft risk.',
          caseStatus: 'Pending',
        },
        {
          id: 'ACT-7705-2',
          title: 'Escalated to Executive Safety',
          adminName: 'Safety Lead Sarah',
          timestamp: '2.4 hrs ago',
          description: 'Escalated case for global network ban and fraud advisory.',
          caseStatus: 'Escalated',
        },
      ],
    },
    // Generate remaining cases to reach exactly 24 cases (Total 24: Pending 6, Under Review 8, Escalated 4, Resolved 4, Closed 2)
    ...generateRemainingSafetyCases(),
  ];
}

function generateRemainingSafetyCases(): SafetyCaseRecord[] {
  const result: SafetyCaseRecord[] = [];
  // Needed: 19 more cases to reach 24 total
  // Current: Pending (1), Under Review (2), Escalated (1), Resolved (1) -> Total 5
  // Desired distribution:
  // Pending: 6 (needs 5 more)
  // Under Review: 8 (needs 6 more)
  // Escalated: 4 (needs 3 more)
  // Resolved: 4 (needs 3 more)
  // Closed: 2 (needs 2 more)
  // Total additions: 5 + 6 + 3 + 3 + 2 = 19 items!

  const mockUsers = [
    { username: 'User_Rashid', id: 'U10298950', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80' },
    { username: 'User_Elena', id: 'U10298991', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80' },
    { username: 'User_Mike', id: 'U10298810', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
    { username: 'User_Fatima', id: 'U10299622', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
    { username: 'User_Kenji', id: 'U10299710', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80' },
    { username: 'User_Zoya', id: 'U10299775', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80' },
    { username: 'User_Carlos', id: 'U10299833', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
    { username: 'User_Priya', id: 'U10299912', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
    { username: 'User_Hassan', id: 'U10299980', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80' },
  ];

  const categories: { cat: any; desc: string; prio: any }[] = [
    { cat: 'Age Verification Review', desc: 'Periodic identity proof audit for studio broadcaster', prio: 'Medium' },
    { cat: 'Underage Stream Flag', desc: 'Inquiry into co-host appearance during multi-guest room', prio: 'High' },
    { cat: 'Inappropriate Interaction', desc: 'Persistent unsolicited private chat requests to creator', prio: 'High' },
    { cat: 'Restricted Contact Violation', desc: 'Attempting off-platform redirection in live room chat', prio: 'Urgent' },
    { cat: 'Suspicious Minor Profile', desc: 'Mismatched registration date with profile questionnaire', prio: 'Medium' },
    { cat: 'General Child Safety', desc: 'Community complaint regarding live room acoustic noise', prio: 'Low' },
  ];

  let counter = 7706;

  const buildCase = (status: any, isEscalated: boolean, index: number, hoursAgo: number): SafetyCaseRecord => {
    const numId = counter++;
    const id = `#CS-${numId}`;
    const user = mockUsers[index % mockUsers.length];
    const catObj = categories[index % categories.length];
    const isHost = index % 2 === 0;

    return {
      id,
      numericId: numId,
      category: catObj.cat,
      relatedReportId: `#RP${98400 + index}`,
      relatedUserId: user.id,
      relatedUsername: user.username,
      relatedUserAvatar: user.avatar,
      relatedUserStatus: status === 'Resolved' || status === 'Closed' ? 'Active' : 'Under Review',
      isHost,
      relatedHostId: isHost ? `H${3008100 + index}` : undefined,
      priority: isEscalated ? 'Urgent' : catObj.prio,
      status,
      shortDescription: catObj.desc,
      fullDescription: `${catObj.desc}. Handled in accordance with standard Popo Live child safety operational protocols. Logged for compliance audit.`,
      assignedReviewer: status === 'Pending' ? 'Unassigned' : index % 2 === 0 ? 'Safety Lead Sarah' : 'Mod Dave',
      createdDate: `2026-02-15 14:${(index * 9) % 60}:00`,
      createdRelative: `${hoursAgo} hrs ago`,
      lastUpdatedDate: `2026-02-15 15:${(index * 9) % 60}:00`,
      lastUpdatedRelative: `${Math.max(1, hoursAgo - 1)} hrs ago`,
      isEscalated,
      escalationReason: isEscalated ? 'Multi-party report with safety priority keyword markers.' : undefined,
      escalatedAt: isEscalated ? `2026-02-15 14:45:00` : undefined,
      reviewerNotes: status === 'Resolved' ? 'Document verified and resolved with clearance certificate.' : 'Case currently in active review backlog.',
      evidenceItems: [
        {
          id: `EV-${numId}-1`,
          referenceId: `REF-SAFE-${numId}`,
          category: 'Standard Audit Excerpt',
          type: 'screenshot',
          submissionDate: `${hoursAgo} hrs ago`,
          fileSize: '740 KB',
          description: 'Safe placeholder frame captured by telemetry logger',
          safeThumbnailUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
          reviewStatus: status === 'Resolved' ? 'Cleared' : 'Pending Review',
          isRedacted: true,
        },
      ],
      timeline: [
        {
          id: `ACT-${numId}-1`,
          title: 'Case Registered',
          adminName: 'Automated Gateway',
          timestamp: `${hoursAgo} hrs ago`,
          description: 'Incident ticket created from in-room report telemetry.',
          caseStatus: 'Pending',
        },
        ...(status !== 'Pending'
          ? [
              {
                id: `ACT-${numId}-2`,
                title: isEscalated ? 'Escalated to Senior Safety' : 'Review Updated',
                adminName: 'Safety Moderator',
                timestamp: `${Math.max(1, hoursAgo - 1)} hrs ago`,
                description: `Status updated to ${status}.`,
                caseStatus: status,
              },
            ]
          : []),
      ],
    };
  };

  // 5 more Pending
  for (let i = 0; i < 5; i++) result.push(buildCase('Pending', false, i, i + 3));

  // 6 more Under Review
  for (let i = 0; i < 6; i++) result.push(buildCase('Under Review', false, i + 5, i + 4));

  // 3 more Escalated
  for (let i = 0; i < 3; i++) result.push(buildCase('Escalated', true, i + 11, i + 2));

  // 3 more Resolved
  for (let i = 0; i < 3; i++) result.push(buildCase('Resolved', false, i + 14, i + 6));

  // 2 Closed
  for (let i = 0; i < 2; i++) result.push(buildCase('Closed', false, i + 17, i + 12));

  return result;
}

export function createInitialSafetyAlerts(): SafetyAlertRecord[] {
  return [
    {
      id: '#ALT-4401',
      category: 'age_concern',
      categoryLabel: 'Age-Related Concern',
      relatedReportId: '#RP98421',
      relatedCaseId: '#CS-7701',
      relatedUserId: 'U10298462',
      relatedUsername: 'User_98462',
      createdDate: '2026-02-16 09:30:15',
      createdRelative: '15 min ago',
      priority: 'Urgent',
      status: 'Active',
      shortDescription: 'AI visual heuristic flagged age mismatch on active live stream',
      riskScore: 92,
    },
    {
      id: '#ALT-4402',
      category: 'inappropriate_interaction',
      categoryLabel: 'Inappropriate Interaction',
      relatedReportId: '#RP98420',
      relatedCaseId: '#CS-7702',
      relatedUserId: 'U10299104',
      relatedUsername: 'User_Tariq99',
      createdDate: '2026-02-16 08:45:00',
      createdRelative: '1 hr ago',
      priority: 'High',
      status: 'Investigating',
      shortDescription: 'Rapid contact solicitations directed to new creator accounts',
      riskScore: 78,
    },
    {
      id: '#ALT-4403',
      category: 'potential_minor',
      categoryLabel: 'Potential Minor Safety Concern',
      relatedReportId: '#RP98419',
      relatedCaseId: '#CS-7703',
      relatedUserId: 'U10299940',
      relatedUsername: 'User_Devon',
      createdDate: '2026-02-16 08:20:10',
      createdRelative: '1.5 hrs ago',
      priority: 'High',
      status: 'Active',
      shortDescription: 'Viewer complaint regarding profile photo attire ambiguity',
      riskScore: 74,
    },
    {
      id: '#ALT-4404',
      category: 'suspicious_activity',
      categoryLabel: 'Suspicious Account Activity',
      relatedReportId: '#RP98418',
      relatedCaseId: '#CS-7704',
      relatedUserId: 'U10299401',
      relatedUsername: 'User_SpamBot1',
      createdDate: '2026-02-16 07:10:00',
      createdRelative: '2.5 hrs ago',
      priority: 'Medium',
      status: 'Actioned',
      shortDescription: 'Automated spam script targeting public chat with external links',
      riskScore: 58,
    },
    {
      id: '#ALT-4405',
      category: 'safety_policy',
      categoryLabel: 'Safety Policy Concern',
      relatedReportId: '#RP98417',
      relatedCaseId: '#CS-7705',
      relatedUserId: 'U10299881',
      relatedUsername: 'Popo_Support_Official_Fake',
      createdDate: '2026-02-16 06:40:00',
      createdRelative: '3 hrs ago',
      priority: 'Urgent',
      status: 'Investigating',
      shortDescription: 'Phishing account attempting to collect security credentials',
      riskScore: 95,
    },
    // Generate 15 more alerts to reach exactly 20 alert records per Section 4
    ...generateRemainingAlerts(),
  ];
}

function generateRemainingAlerts(): SafetyAlertRecord[] {
  const result: SafetyAlertRecord[] = [];
  const alertCategories: { cat: any; label: string; prio: any; score: number }[] = [
    { cat: 'age_concern', label: 'Age-Related Concern', prio: 'High', score: 82 },
    { cat: 'potential_minor', label: 'Potential Minor Safety Concern', prio: 'Urgent', score: 91 },
    { cat: 'inappropriate_interaction', label: 'Inappropriate Interaction', prio: 'High', score: 79 },
    { cat: 'harassment_concern', label: 'Harassment Concern', prio: 'Medium', score: 62 },
    { cat: 'suspicious_activity', label: 'Suspicious Account Activity', prio: 'Medium', score: 55 },
    { cat: 'policy_concern', label: 'Safety Policy Concern', prio: 'Low', score: 42 },
    { cat: 'other_safety', label: 'Other Safety Concern', prio: 'Low', score: 35 },
  ];

  const usernames = [
    'User_Rashid', 'User_Elena', 'User_Mike', 'User_Fatima',
    'User_Kenji', 'User_Zoya', 'User_Carlos', 'User_Priya',
    'User_Hassan', 'User_98462', 'User_Tariq99', 'User_Devon'
  ];

  for (let i = 0; i < 15; i++) {
    const num = 4406 + i;
    const item = alertCategories[i % alertCategories.length];
    const user = usernames[i % usernames.length];
    const hours = i + 2;

    result.push({
      id: `#ALT-${num}`,
      category: item.cat,
      categoryLabel: item.label,
      relatedReportId: `#RP${98410 + i}`,
      relatedCaseId: `#CS-${7706 + i}`,
      relatedUserId: `U${10298000 + i}`,
      relatedUsername: user,
      createdDate: `2026-02-15 1${Math.max(1, 8 - Math.floor(hours / 2))}:1${i}:00`,
      createdRelative: `${hours} hrs ago`,
      priority: item.prio,
      status: i % 3 === 0 ? 'Active' : i % 3 === 1 ? 'Investigating' : 'Actioned',
      shortDescription: `${item.label} logged by community moderation sensors. Case #${7706 + i} associated.`,
      riskScore: item.score - (i % 8),
    });
  }

  return result;
}

export function calculateSafetyMetrics(cases: SafetyCaseRecord[], alerts: SafetyAlertRecord[]): SafetyMetrics {
  const pendingCases = cases.filter((c) => c.status === 'Pending').length;
  const underReviewCases = cases.filter((c) => c.status === 'Under Review').length;
  const highPriorityCases = cases.filter((c) => c.priority === 'High' || c.priority === 'Urgent').length;
  const urgentCases = cases.filter((c) => c.priority === 'Urgent').length;
  const escalatedCases = cases.filter((c) => c.status === 'Escalated' || c.isEscalated).length;
  const resolvedCases = cases.filter((c) => c.status === 'Resolved').length;
  const closedCases = cases.filter((c) => c.status === 'Closed').length;
  const activeAlerts = alerts.filter((a) => a.status === 'Active' || a.status === 'Investigating').length;
  const ageReviewsPending = cases.filter(
    (c) => c.category === 'Age Verification Review' && c.status !== 'Resolved' && c.status !== 'Closed'
  ).length;

  return {
    totalCases: cases.length,
    pendingCases,
    underReviewCases,
    highPriorityCases,
    urgentCases,
    escalatedCases,
    resolvedCases,
    closedCases,
    activeAlerts,
    ageReviewsPending,
    restrictedAccountsCount: 5,
  };
}
