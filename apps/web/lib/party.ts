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



