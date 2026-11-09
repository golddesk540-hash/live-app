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
  status: SeatStatus;
  occupiedAt: string | null;
  updatedAt: string;
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

export function generateDefaultSeats(
  roomNumber: string,
  hostName: string = 'Maria Live',
  hostAvatar: string = '/assets/studio/host_zara_avatar.png'
): PartySeat[] {
  const seats: PartySeat[] = [];
  const now = new Date().toISOString();

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
      status: 'available',
      occupiedAt: null,
      updatedAt: now,
    });
  }

  return seats;
}

