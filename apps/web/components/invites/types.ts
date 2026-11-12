export type InviteMainTab = 'invite' | 'contacts' | 'history';

export type InviteStatusType = 'pending' | 'joined' | 'expired';

export type InviteChannelId =
  | 'whatsapp'
  | 'facebook'
  | 'telegram'
  | 'sms'
  | 'email'
  | 'copy_link'
  | 'native_share';

export interface DemoInviteContact {
  id: string;
  name: string;
  initials: string;
  handle: string;
  phoneNumber: string;
  avatarUrl?: string;
  avatarColor: string;
  statusTag?: string;
}

export interface InviteHistoryRecord {
  id: string;
  contactName: string;
  contactPhone?: string;
  inviteCode: string;
  inviteLink: string;
  invitedDate: string;
  method: string;
  status: InviteStatusType;
  isDemoLocal?: boolean;
}
