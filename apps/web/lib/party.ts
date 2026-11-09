export interface PartyCategoryItem {
  id: string;
  name: string;
  icon: string;
  displayOrder: number;
}

export const CANONICAL_PARTY_CATEGORIES: PartyCategoryItem[] = [
  { id: 'chill_chat', name: 'Chill & Chat', icon: 'coffee', displayOrder: 1 },
  { id: 'music', name: 'Music', icon: 'music', displayOrder: 2 },
  { id: 'entertainment', name: 'Entertainment', icon: 'sparkles', displayOrder: 3 },
  { id: 'gaming', name: 'Gaming', icon: 'gamepad', displayOrder: 4 },
  { id: 'lifestyle', name: 'Lifestyle', icon: 'heart', displayOrder: 5 },
  { id: 'talent', name: 'Talent', icon: 'award', displayOrder: 6 },
  { id: 'friendship', name: 'Friendship', icon: 'users', displayOrder: 7 },
];

export type RoomType = 'public' | 'private';

export interface CreatePartyDto {
  title: string;
  categoryId: string;
  roomType: RoomType;
  hostId?: string;
}

export interface PartyRoomResponse {
  id: string;
  roomNumber: string;
  title: string;
  category: string;
  categoryId: string;
  roomType: RoomType;
  isPrivate: boolean;
  hostNickname: string;
  hostAvatar?: string;
  maxSeats: number;
  currentMembers: number;
  status: string;
  createdAt: string;
}

export type SeatStatus = 'available' | 'occupied' | 'locked';

export interface PartySeat {
  id: string;
  roomNumber: string;
  seatNumber: number; // 1 to 9
  participantId: string | null;
  participantName: string | null;
  participantAvatar: string | null;
  isHost: boolean;
  isMuted: boolean;
  isCameraOn: boolean;
  isHostMuted?: boolean;
  isVideoDisabled?: boolean;
  cameraFacing?: 'user' | 'environment';
  status: SeatStatus;
  occupiedAt: string | null;
  updatedAt: string;
}

export interface ToggleSeatMediaDto {
  seatNumber: number;
  type: 'mic' | 'camera' | 'facing';
  enabled?: boolean;
  facing?: 'user' | 'environment';
  participantId?: string;
}

export interface ModerateSeatMediaDto {
  seatNumber: number;
  action: 'host_mute' | 'disable_video' | 'kick' | string;
  isHostAction: boolean;
}

export interface PartyAudienceMember {
  id: string;
  roomNumber: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userLevel: number;
  isActive: boolean;
  joinedAt: string;
}

export interface PartyMessage {
  id: string;
  roomNumber: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: 'host' | 'participant' | 'audience' | 'moderator';
  seatNumber?: number | null;
  messageText: string;
  emoji?: string | null;
  createdAt: string;
}

export interface JoinPartyAudienceDto {
  userId: string;
  userName: string;
  userAvatar?: string;
  userLevel?: number;
}

export interface SendPartyMessageDto {
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole?: 'host' | 'participant' | 'audience' | 'moderator';
  seatNumber?: number | null;
  messageText: string;
  emoji?: string;
}

export interface OccupySeatDto {
  seatNumber: number;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  isMuted?: boolean;
  isCameraOn?: boolean;
}

export interface VacateSeatDto {
  seatNumber: number;
  participantId?: string;
  isHostAction?: boolean;
}

export type SeatInteractionStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'declined'
  | 'cancelled'
  | 'expired';

export interface PartySeatRequest {
  id: string;
  partyId?: string;
  roomNumber: string;
  seatNumber: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  status: SeatInteractionStatus;
  createdAt: string;
  respondedAt?: string;
  expiresAt: string;
}

export interface PartySeatInvitation {
  id: string;
  partyId?: string;
  roomNumber: string;
  seatNumber: number;
  hostId: string;
  invitedUserId: string;
  invitedUserName: string;
  invitedUserAvatar?: string;
  status: SeatInteractionStatus;
  createdAt: string;
  respondedAt?: string;
  expiresAt: string;
}

export interface RequestSeatDto {
  seatNumber: number;
  userId?: string;
  userName?: string;
  userAvatar?: string;
}

export interface RespondSeatRequestDto {
  requestId: string;
  action: 'accept' | 'reject';
  isHostAction?: boolean;
}

export interface InviteViewerDto {
  seatNumber: number;
  invitedUserId: string;
  invitedUserName: string;
  invitedUserAvatar?: string;
}

export interface RespondInvitationDto {
  invitationId: string;
  action: 'accept' | 'decline';
  userId?: string;
}

export function generateDefaultSeats(
  roomNumber: string,
  hostName: string = 'Maria Live',
  hostAvatar: string = '/assets/party/seat_avatar_1.png'
): PartySeat[] {
  const seats: PartySeat[] = [];
  const now = new Date().toISOString();

  // For reference room 7001, seed 6 occupied seats matching 05_04_sound_and_camera_on_a_seat.png
  if (roomNumber === '7001') {
    const demoOccupants = [
      { num: 1, id: 'host_maria_7001', name: 'Maria Live', avatar: '/assets/party/seat_avatar_1.png', isHost: true, isMuted: false, isCameraOn: true },
      { num: 2, id: 'user_kenji_7001', name: 'Kenji R', avatar: '/assets/party/seat_avatar_2.png', isHost: false, isMuted: false, isCameraOn: true },
      { num: 3, id: 'user_elena_7001', name: 'Elena V', avatar: '/assets/party/seat_avatar_3.png', isHost: false, isMuted: false, isCameraOn: true },
      { num: 4, id: 'user_chloe_7001', name: 'Chloe T', avatar: '/assets/party/seat_avatar_4.png', isHost: false, isMuted: false, isCameraOn: true },
      { num: 5, id: 'user_david_7001', name: 'David K', avatar: '/assets/party/seat_avatar_5.png', isHost: false, isMuted: false, isCameraOn: true },
      { num: 6, id: 'user_sophia_7001', name: 'Sophia M', avatar: '/assets/party/seat_avatar_6.png', isHost: false, isMuted: false, isCameraOn: true },
    ];

    for (const occ of demoOccupants) {
      seats.push({
        id: `seat-${roomNumber}-${occ.num}`,
        roomNumber,
        seatNumber: occ.num,
        participantId: occ.id,
        participantName: occ.name,
        participantAvatar: occ.avatar,
        isHost: occ.isHost,
        isMuted: occ.isMuted,
        isCameraOn: occ.isCameraOn,
        isHostMuted: false,
        isVideoDisabled: false,
        cameraFacing: 'user',
        status: 'occupied',
        occupiedAt: now,
        updatedAt: now,
      });
    }

    for (let i = 7; i <= 9; i++) {
      seats.push({
        id: `seat-${roomNumber}-${i}`,
        roomNumber,
        seatNumber: i,
        participantId: null,
        participantName: null,
        participantAvatar: null,
        isHost: false,
        isMuted: false,
        isCameraOn: false,
        isHostMuted: false,
        isVideoDisabled: false,
        cameraFacing: 'user',
        status: 'available',
        occupiedAt: null,
        updatedAt: now,
      });
    }

    return seats;
  }

  // Seat 1: Host Seat
  seats.push({
    id: `seat-${roomNumber}-1`,
    roomNumber,
    seatNumber: 1,
    participantId: `host-${roomNumber}`,
    participantName: hostName,
    participantAvatar: hostAvatar,
    isHost: true,
    isMuted: false,
    isCameraOn: true,
    isHostMuted: false,
    isVideoDisabled: false,
    cameraFacing: 'user',
    status: 'occupied',
    occupiedAt: now,
    updatedAt: now,
  });

  // Seats 2-9: Participant Seats (Available initially)
  for (let i = 2; i <= 9; i++) {
    seats.push({
      id: `seat-${roomNumber}-${i}`,
      roomNumber,
      seatNumber: i,
      participantId: null,
      participantName: null,
      participantAvatar: null,
      isHost: false,
      isMuted: false,
      isCameraOn: false,
      isHostMuted: false,
      isVideoDisabled: false,
      cameraFacing: 'user',
      status: 'available',
      occupiedAt: null,
      updatedAt: now,
    });
  }

  return seats;
}

export interface PartyTheme {
  id: string;
  name: string;
  description?: string;
  thumbnailUrl: string;
  backgroundGradient: string;
  cardBg: string;
  buttonGradient: string;
  accentColor: string;
  textColor: string;
  subtextColor: string;
  displayOrder: number;
  isActive: boolean;
}

export interface PartyThemeState {
  roomId: string;
  activeThemeId: string;
  theme: PartyTheme;
  updatedBy: string;
  updatedAt: string;
}

export interface ApplyPartyThemeDto {
  themeId: string;
  userId?: string;
  isHostAction?: boolean;
}

export const CANONICAL_PARTY_THEMES: PartyTheme[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Canonical deep navy and cosmic purple theme with ambient blue orb',
    thumbnailUrl: '/assets/party/theme_thumb_default.png',
    backgroundGradient: 'linear-gradient(180deg, #0b081e 0%, #150f38 45%, #0d0a22 100%)',
    cardBg: 'rgba(26, 20, 56, 0.75)',
    buttonGradient: 'linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)',
    accentColor: '#8B5CF6',
    textColor: '#FFFFFF',
    subtextColor: '#A78BFA',
    displayOrder: 1,
    isActive: true,
  },
  {
    id: 'galaxy',
    name: 'Galaxy',
    description: 'Vibrant cosmic purple nebula with radiating galactic rays',
    thumbnailUrl: '/assets/party/theme_thumb_galaxy.png',
    backgroundGradient: 'linear-gradient(180deg, #0a0620 0%, #220d4d 45%, #08031a 100%)',
    cardBg: 'rgba(38, 16, 77, 0.75)',
    buttonGradient: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
    accentColor: '#A855F7',
    textColor: '#FFFFFF',
    subtextColor: '#C084FC',
    displayOrder: 2,
    isActive: true,
  },
  {
    id: 'neon',
    name: 'Neon',
    description: 'Electric hot magenta and neon beams glowing in deep ultraviolet darkness',
    thumbnailUrl: '/assets/party/theme_thumb_neon.png',
    backgroundGradient: 'linear-gradient(180deg, #140320 0%, #3a084c 45%, #0f0219 100%)',
    cardBg: 'rgba(64, 12, 82, 0.75)',
    buttonGradient: 'linear-gradient(135deg, #D946EF 0%, #EC4899 100%)',
    accentColor: '#F43F5E',
    textColor: '#FFFFFF',
    subtextColor: '#F472B6',
    displayOrder: 3,
    isActive: true,
  },
  {
    id: 'cute',
    name: 'Cute',
    description: 'Soft glowing peach and warm rose with gentle ambient flares',
    thumbnailUrl: '/assets/party/theme_thumb_cute.png',
    backgroundGradient: 'linear-gradient(180deg, #1a0818 0%, #4a193b 45%, #180614 100%)',
    cardBg: 'rgba(74, 25, 59, 0.75)',
    buttonGradient: 'linear-gradient(135deg, #FB7185 0%, #F43F5E 100%)',
    accentColor: '#FB7185',
    textColor: '#FFFFFF',
    subtextColor: '#FDA4AF',
    displayOrder: 4,
    isActive: true,
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Prestigious champagne gold and bronze orbs with warm luxurious shimmer',
    thumbnailUrl: '/assets/party/theme_thumb_elegant.png',
    backgroundGradient: 'linear-gradient(180deg, #150f08 0%, #3b2810 45%, #110c05 100%)',
    cardBg: 'rgba(59, 40, 16, 0.75)',
    buttonGradient: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
    accentColor: '#FBBF24',
    textColor: '#FFFFFF',
    subtextColor: '#FDE68A',
    displayOrder: 5,
    isActive: true,
  },
  {
    id: 'party',
    name: 'Party',
    description: 'Electric laser party lights with multi-colored violet and cyan beams',
    thumbnailUrl: '/assets/party/theme_thumb_party.png',
    backgroundGradient: 'linear-gradient(180deg, #090924 0%, #161b4d 45%, #09091f 100%)',
    cardBg: 'rgba(22, 27, 77, 0.75)',
    buttonGradient: 'linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%)',
    accentColor: '#38BDF8',
    textColor: '#FFFFFF',
    subtextColor: '#7DD3FC',
    displayOrder: 6,
    isActive: true,
  },
  {
    id: 'midnight_blue',
    name: 'Midnight Blue',
    description: 'Deep oceanic midnight indigo with subtle celestial glow',
    thumbnailUrl: '/assets/party/theme_thumb_default.png',
    backgroundGradient: 'linear-gradient(180deg, #060d1f 0%, #0d1e45 45%, #050b1a 100%)',
    cardBg: 'rgba(13, 30, 69, 0.75)',
    buttonGradient: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
    accentColor: '#3B82F6',
    textColor: '#FFFFFF',
    subtextColor: '#93C5FD',
    displayOrder: 7,
    isActive: true,
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Radiant twilight amber, crimson and dusk purple horizon',
    thumbnailUrl: '/assets/party/theme_thumb_cute.png',
    backgroundGradient: 'linear-gradient(180deg, #220b16 0%, #521626 45%, #190812 100%)',
    cardBg: 'rgba(82, 22, 38, 0.75)',
    buttonGradient: 'linear-gradient(135deg, #F97316 0%, #EF4444 100%)',
    accentColor: '#FB923C',
    textColor: '#FFFFFF',
    subtextColor: '#FED7AA',
    displayOrder: 8,
    isActive: true,
  },
  {
    id: 'festival',
    name: 'Festival',
    description: 'Carnival festival vibrancy with energetic emerald and gold highlights',
    thumbnailUrl: '/assets/party/theme_thumb_party.png',
    backgroundGradient: 'linear-gradient(180deg, #071913 0%, #113c2c 45%, #05140f 100%)',
    cardBg: 'rgba(17, 60, 44, 0.75)',
    buttonGradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    accentColor: '#34D399',
    textColor: '#FFFFFF',
    subtextColor: '#A7F3D0',
    displayOrder: 9,
    isActive: true,
  },
];

export function getPartyThemeById(themeId: string): PartyTheme {
  const found = CANONICAL_PARTY_THEMES.find((t) => t.id === themeId);
  return found || CANONICAL_PARTY_THEMES[0];
}




