export const CURRENT_POLICY_VERSION = '1.0.0';
export const POLICY_EFFECTIVE_DATE = '2026-03-20';

export interface HostRuleItem {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
  policyVersion: string;
}

export const CANONICAL_HOST_RULES: HostRuleItem[] = [
  {
    id: 'rule_nudity',
    title: 'No nudity or sexual content',
    description:
      'Any sexually suggestive or explicit content, pornography, transparent clothing, or indecent exposure is strictly banned on Popo Live. Violations lead to immediate termination of the live broadcast.',
    category: 'Content Safety',
    icon: 'check',
    displayOrder: 1,
    isActive: true,
    policyVersion: CURRENT_POLICY_VERSION,
  },
  {
    id: 'rule_minors',
    title: 'No minors (under 18)',
    description:
      'Broadcasters must be at least 18 years of age. Streaming featuring minors without adult guardianship or any child exploitation is completely prohibited under our Child Protection Policy.',
    category: 'Age Restriction',
    icon: 'check',
    displayOrder: 2,
    isActive: true,
    policyVersion: CURRENT_POLICY_VERSION,
  },
  {
    id: 'rule_violence',
    title: 'No violence or hate speech',
    description:
      'Bullying, harassment, hate speech, threats of physical violence, defamation, or discrimination against any individual or demographic group will result in permanent account suspension.',
    category: 'Community Conduct',
    icon: 'check',
    displayOrder: 3,
    isActive: true,
    policyVersion: CURRENT_POLICY_VERSION,
  },
  {
    id: 'rule_illegal',
    title: 'No illegal or harmful activities',
    description:
      'Broadcasting illegal acts, substance abuse, smoking/vaping or alcohol consumption on camera, gambling, self-harm, weapons, or dangerous stunts is strictly forbidden.',
    category: 'Legal Compliance',
    icon: 'check',
    displayOrder: 4,
    isActive: true,
    policyVersion: CURRENT_POLICY_VERSION,
  },
  {
    id: 'rule_guidelines',
    title: 'Follow community guidelines',
    description:
      'All hosts must adhere to Popo Live Community Guidelines and Broadcaster Code of Decorum. Treat viewers, fellow broadcasters, and platform staff with dignity and respect.',
    category: 'Platform Decorum',
    icon: 'check',
    displayOrder: 5,
    isActive: true,
    policyVersion: CURRENT_POLICY_VERSION,
  },
];
