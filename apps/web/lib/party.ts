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
