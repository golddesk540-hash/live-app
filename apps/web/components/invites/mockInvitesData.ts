import { DemoInviteContact, InviteHistoryRecord } from './types';

export const DEMO_INVITE_CODE = 'AB82K';
export const DEMO_INVITE_SHORT_URL = 'popolive.app/invite/AB82K';
export const DEMO_INVITE_FULL_URL = 'https://popolive.app/invite/AB82K';

export const DEFAULT_INVITE_MESSAGE = `Join me on Popo Live!

Watch live streams, meet new people, enjoy party rooms and connect with friends.

Join using my invitation link:
${DEMO_INVITE_FULL_URL}`;

export const INITIAL_INVITE_CONTACTS: DemoInviteContact[] = [
  {
    id: 'inv_c_1',
    name: 'Ayesha Siddiqui',
    initials: 'AS',
    handle: '@ayesha.s',
    phoneNumber: '+92 300 4189201',
    avatarUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=180&auto=format&fit=crop&q=80',
    avatarColor: 'from-pink-500 to-rose-600',
    statusTag: 'Music lover',
  },
  {
    id: 'inv_c_2',
    name: 'Bilal Ahmed',
    initials: 'BA',
    handle: '@bilal.ahmed',
    phoneNumber: '+971 50 842 9104',
    avatarUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=180&auto=format&fit=crop&q=80',
    avatarColor: 'from-blue-500 to-cyan-500',
    statusTag: 'Frequent viewer',
  },
  {
    id: 'inv_c_3',
    name: 'Nadia Hussain',
    initials: 'NH',
    handle: '@nadia.h',
    phoneNumber: '+44 7700 900321',
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=180&auto=format&fit=crop&q=80',
    avatarColor: 'from-purple-500 to-fuchsia-600',
    statusTag: 'Party co-host friend',
  },
  {
    id: 'inv_c_4',
    name: 'Omar Farooq',
    initials: 'OF',
    handle: '@omar.farooq',
    phoneNumber: '+1 (415) 555-0194',
    avatarColor: 'from-amber-400 to-orange-500',
    statusTag: 'College friend',
  },
  {
    id: 'inv_c_5',
    name: 'Zara Qureshi',
    initials: 'ZQ',
    handle: '@zara.q',
    phoneNumber: '+92 321 7742109',
    avatarUrl:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=180&auto=format&fit=crop&q=80',
    avatarColor: 'from-emerald-400 to-teal-500',
  },
  {
    id: 'inv_c_6',
    name: 'Usman Tariq',
    initials: 'UT',
    handle: '@usman.t',
    phoneNumber: '+966 55 319 4820',
    avatarColor: 'from-indigo-500 to-violet-600',
  },
];

export const INITIAL_INVITE_HISTORY: InviteHistoryRecord[] = [
  {
    id: 'inv_h_1',
    contactName: 'Hira Malik',
    contactPhone: '+92 301 9123400',
    inviteCode: DEMO_INVITE_CODE,
    inviteLink: DEMO_INVITE_FULL_URL,
    invitedDate: 'Nov 12, 2026',
    method: 'WhatsApp',
    status: 'joined',
  },
  {
    id: 'inv_h_2',
    contactName: 'Zaid Star',
    contactPhone: '+966 50 882 1409',
    inviteCode: DEMO_INVITE_CODE,
    inviteLink: DEMO_INVITE_FULL_URL,
    invitedDate: 'Nov 11, 2026',
    method: 'Copy Link',
    status: 'pending',
  },
  {
    id: 'inv_h_3',
    contactName: 'Mina Noor',
    contactPhone: '+971 52 409 8712',
    inviteCode: DEMO_INVITE_CODE,
    inviteLink: DEMO_INVITE_FULL_URL,
    invitedDate: 'Nov 09, 2026',
    method: 'Telegram',
    status: 'joined',
  },
  {
    id: 'inv_h_4',
    contactName: 'Saad Raza',
    contactPhone: '+44 7700 900148',
    inviteCode: DEMO_INVITE_CODE,
    inviteLink: DEMO_INVITE_FULL_URL,
    invitedDate: 'Oct 28, 2026',
    method: 'SMS',
    status: 'expired',
  },
  {
    id: 'inv_h_5',
    contactName: 'Farah Khan',
    contactPhone: '+1 (212) 555-0142',
    inviteCode: DEMO_INVITE_CODE,
    inviteLink: DEMO_INVITE_FULL_URL,
    invitedDate: 'Nov 10, 2026',
    method: 'Email',
    status: 'pending',
  },
];
