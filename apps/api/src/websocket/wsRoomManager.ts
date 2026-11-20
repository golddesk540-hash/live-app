/**
 * POPO LIVE — REAL-TIME WEBSOCKET ROOM & CHANNEL MANAGER
 * 
 * Manages namespaced channels:
 * - live:{roomId}  -> Live broadcast chat, viewer counts, gift alerts
 * - party:{roomId} -> Party room chat, 9-seat grid updates
 * - dm:{convId}    -> 1-on-1 direct messages & typing indicators
 * - user:{userId}  -> Direct system notices & user notifications
 */

import { WebSocket } from 'ws';
import { getDatabasePool } from './wsAuth';
import {
  WsUserSession,
  WsChatMessage,
  WsGiftAlertPayload,
  WsSeatInfo,
  WsNotificationPayload,
  WsOutboundMessage,
} from './wsTypes';

export interface ChannelSubscription {
  socket: WebSocket;
  user: WsUserSession;
}

export class WsRoomManager {
  // Channel -> Set of active subscribers
  private channels: Map<string, Set<ChannelSubscription>> = new Map();
  // Socket -> Set of channels it is subscribed to
  private socketChannels: Map<WebSocket, Set<string>> = new Map();
  // Socket -> User session
  private socketUsers: Map<WebSocket, WsUserSession> = new Map();

  // In-memory viewer counts per live room: roomId -> count
  private liveViewerCounts: Map<string, number> = new Map();

  // In-memory seat state per party room: roomId -> 9 seats
  private partySeats: Map<string, WsSeatInfo[]> = new Map();

  // Conversation members cache for fast membership check: convId -> Set<userId>
  private conversationMembers: Map<string, Set<string>> = new Map();

  /**
   * Registers a newly authenticated socket connection
   */
  public registerSocket(socket: WebSocket, user: WsUserSession): void {
    this.socketUsers.set(socket, user);
    this.socketChannels.set(socket, new Set());

    // Automatically join the user's personal notification channel
    this.joinChannel(socket, `user:${user.userId}`);
  }

  /**
   * Unregisters socket and cleans up all its channel memberships
   */
  public unregisterSocket(socket: WebSocket): { affectedLiveRooms: string[] } {
    const user = this.socketUsers.get(socket);
    const subscribed = this.socketChannels.get(socket);
    const affectedLiveRooms: string[] = [];

    if (subscribed) {
      for (const channel of subscribed) {
        const subSet = this.channels.get(channel);
        if (subSet) {
          // Find and delete the matching subscription
          for (const sub of subSet) {
            if (sub.socket === socket) {
              subSet.delete(sub);
              break;
            }
          }
          if (subSet.size === 0) {
            this.channels.delete(channel);
          }
        }

        // If leaving a live room, decrement viewer count
        if (channel.startsWith('live:')) {
          const roomId = channel.substring(5);
          const currentCount = this.liveViewerCounts.get(roomId) || 1;
          const newCount = Math.max(0, currentCount - 1);
          this.liveViewerCounts.set(roomId, newCount);
          affectedLiveRooms.push(roomId);
        }
      }
    }

    this.socketChannels.delete(socket);
    this.socketUsers.delete(socket);

    return { affectedLiveRooms };
  }

  /**
   * Gets user session for a socket
   */
  public getUser(socket: WebSocket): WsUserSession | undefined {
    return this.socketUsers.get(socket);
  }

  /**
   * Adds socket to a channel
   */
  public joinChannel(socket: WebSocket, channel: string): void {
    const user = this.socketUsers.get(socket);
    if (!user) return;

    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    this.channels.get(channel)!.add({ socket, user });

    const userChannels = this.socketChannels.get(socket);
    if (userChannels) {
      userChannels.add(channel);
    }
  }

  /**
   * Removes socket from a channel
   */
  public leaveChannel(socket: WebSocket, channel: string): void {
    const subSet = this.channels.get(channel);
    if (subSet) {
      for (const sub of subSet) {
        if (sub.socket === socket) {
          subSet.delete(sub);
          break;
        }
      }
      if (subSet.size === 0) {
        this.channels.delete(channel);
      }
    }

    const userChannels = this.socketChannels.get(socket);
    if (userChannels) {
      userChannels.delete(channel);
    }
  }

  // ---------------------------------------------------------------------------
  // LIVE ROOM OPERATIONS
  // ---------------------------------------------------------------------------
  public joinLiveRoom(socket: WebSocket, roomId: string): number {
    const channel = `live:${roomId}`;
    this.joinChannel(socket, channel);

    const current = this.liveViewerCounts.get(roomId) || 0;
    const newCount = current + 1;
    this.liveViewerCounts.set(roomId, newCount);
    return newCount;
  }

  public leaveLiveRoom(socket: WebSocket, roomId: string): number {
    const channel = `live:${roomId}`;
    this.leaveChannel(socket, channel);

    const current = this.liveViewerCounts.get(roomId) || 1;
    const newCount = Math.max(0, current - 1);
    this.liveViewerCounts.set(roomId, newCount);
    return newCount;
  }

  public getViewerCount(roomId: string): number {
    return this.liveViewerCounts.get(roomId) || 0;
  }

  // ---------------------------------------------------------------------------
  // PARTY ROOM OPERATIONS
  // ---------------------------------------------------------------------------
  public joinPartyRoom(socket: WebSocket, roomId: string): void {
    const channel = `party:${roomId}`;
    this.joinChannel(socket, channel);

    if (!this.partySeats.has(roomId)) {
      this.initializeDefaultPartySeats(roomId);
    }
  }

  public leavePartyRoom(socket: WebSocket, roomId: string): void {
    const channel = `party:${roomId}`;
    this.leaveChannel(socket, channel);
  }

  public getPartySeats(roomId: string): WsSeatInfo[] {
    if (!this.partySeats.has(roomId)) {
      this.initializeDefaultPartySeats(roomId);
    }
    return this.partySeats.get(roomId)!;
  }

  public updatePartySeat(roomId: string, seatNumber: number, seatUpdate: Partial<WsSeatInfo>): WsSeatInfo[] {
    const seats = this.getPartySeats(roomId);
    const targetIdx = seats.findIndex((s) => s.seatNumber === seatNumber);
    if (targetIdx !== -1) {
      seats[targetIdx] = { ...seats[targetIdx], ...seatUpdate };
    }
    this.partySeats.set(roomId, seats);
    return seats;
  }

  private initializeDefaultPartySeats(roomId: string): void {
    const seats: WsSeatInfo[] = [];
    for (let i = 1; i <= 9; i++) {
      seats.push({
        seatNumber: i,
        participantId: i === 1 ? 'host-user' : null,
        participantName: i === 1 ? 'Room Host' : null,
        participantAvatar: i === 1 ? '/avatars/host.png' : null,
        isHost: i === 1,
        isMuted: false,
        isCameraOn: false,
        status: i === 1 ? 'occupied' : 'available',
      });
    }
    this.partySeats.set(roomId, seats);
  }

  // ---------------------------------------------------------------------------
  // DM CONVERSATION OPERATIONS & MEMBERSHIP VERIFICATION
  // ---------------------------------------------------------------------------
  public setConversationMembers(convId: string, userIds: string[]): void {
    this.conversationMembers.set(convId, new Set(userIds));
  }

  public async isUserConversationMember(convId: string, userId: string): Promise<boolean> {
    // 1. Check in-memory cache
    const cached = this.conversationMembers.get(convId);
    if (cached && cached.has(userId)) {
      return true;
    }

    // 2. Query database inbox_conversations
    try {
      const pool = getDatabasePool();
      const res = await pool.query(
        `SELECT 1 FROM popolive.inbox_conversations
         WHERE id::text = $1 AND (participant_one_id::text = $2 OR participant_two_id::text = $2)
         LIMIT 1`,
        [convId, userId]
      );
      if (res.rows.length > 0) {
        if (!this.conversationMembers.has(convId)) {
          this.conversationMembers.set(convId, new Set());
        }
        this.conversationMembers.get(convId)!.add(userId);
        return true;
      }
    } catch (_) {}

    return false;
  }

  public async joinDmConversation(socket: WebSocket, convId: string): Promise<boolean> {
    const user = this.socketUsers.get(socket);
    if (!user) return false;

    const isMember = await this.isUserConversationMember(convId, user.userId);
    if (!isMember) {
      return false; // Forbidden: not a conversation member
    }

    this.joinChannel(socket, `dm:${convId}`);
    return true;
  }

  // ---------------------------------------------------------------------------
  // BROADCASTING DISPATCHERS
  // ---------------------------------------------------------------------------
  public broadcastToChannel<T>(channel: string, event: any, data: T, excludeSocket?: WebSocket): number {
    const subSet = this.channels.get(channel);
    if (!subSet || subSet.size === 0) return 0;

    const messagePayload: WsOutboundMessage<T> = {
      event,
      data,
      timestamp: new Date().toISOString(),
    };
    const serialized = JSON.stringify(messagePayload);
    let sentCount = 0;

    for (const sub of subSet) {
      if (excludeSocket && sub.socket === excludeSocket) continue;
      if (sub.socket.readyState === WebSocket.OPEN) {
        sub.socket.send(serialized);
        sentCount++;
      }
    }
    return sentCount;
  }

  public getSubscriberCount(channel: string): number {
    return this.channels.get(channel)?.size || 0;
  }
}
