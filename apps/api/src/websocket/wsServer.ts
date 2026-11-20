/**
 * POPO LIVE — REAL-TIME WEBSOCKET SERVER
 * 
 * Production WebSocket server implementing:
 * - Token authentication & automatic disconnect on expiry
 * - Namespaced channel dispatching (live, party, dm, user)
 * - Anti-spam sliding window rate limiting
 * - Live viewer count & party seat broadcasts
 * - Real-time gift alert broadcasting
 * - Direct messaging & typing indicators
 * - User notification push
 */

import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import crypto from 'crypto';
import { URL } from 'url';
import { WsAuthService } from './wsAuth';
import { WsRateLimiter } from './wsRateLimiter';
import { WsRoomManager } from './wsRoomManager';
import {
  WsInboundMessage,
  WsUserSession,
  WsChatMessage,
  WsGiftAlertPayload,
  WsSeatInfo,
  WsNotificationPayload,
} from './wsTypes';

export interface PopoWsServerOptions {
  port?: number;
  server?: http.Server;
  rateLimitWindowMs?: number;
  rateLimitMaxEvents?: number;
}

export class PopoWebSocketServer {
  private wss: WebSocketServer;
  private roomManager: WsRoomManager;
  private rateLimiter: WsRateLimiter;
  private expiryTimers: Map<WebSocket, NodeJS.Timeout> = new Map();

  constructor(options: PopoWsServerOptions = {}) {
    this.roomManager = new WsRoomManager();
    this.rateLimiter = new WsRateLimiter({
      windowMs: options.rateLimitWindowMs || 3000,
      maxEvents: options.rateLimitMaxEvents || 10,
    });

    if (options.server) {
      this.wss = new WebSocketServer({ server: options.server });
    } else {
      this.wss = new WebSocketServer({ port: options.port || 4001 });
    }

    this.setupServer();
  }

  public getRoomManager(): WsRoomManager {
    return this.roomManager;
  }

  public getWss(): WebSocketServer {
    return this.wss;
  }

  private setupServer(): void {
    this.wss.on('connection', async (socket: WebSocket, req: http.IncomingMessage) => {
      // 1. Authenticate connection via token in query param or Authorization header
      const token = this.extractTokenFromRequest(req);
      if (!token) {
        socket.close(4401, 'Unauthorized: Missing token');
        return;
      }

      const userSession = await WsAuthService.validateToken(token);
      if (!userSession) {
        socket.close(4401, 'Unauthorized: Invalid or expired token');
        return;
      }

      // 2. Register socket with Room Manager
      this.roomManager.registerSocket(socket, userSession);

      // 3. Schedule automatic disconnect on token expiration
      this.scheduleTokenExpiryDisconnect(socket, userSession);

      // 4. Send authentication confirmation
      this.sendToSocket(socket, 'ws:authenticated', {
        userId: userSession.userId,
        poppoId: userSession.poppoId,
        nickname: userSession.nickname,
        avatarUrl: userSession.avatarUrl,
        role: userSession.role,
      });

      // 5. Handle inbound messages
      socket.on('message', async (rawMessage: Buffer | string) => {
        await this.handleInboundMessage(socket, rawMessage);
      });

      // 6. Handle socket close / error
      socket.on('close', () => {
        this.handleSocketDisconnect(socket);
      });

      socket.on('error', (err) => {
        this.handleSocketDisconnect(socket);
      });
    });
  }

  private extractTokenFromRequest(req: http.IncomingMessage): string | null {
    try {
      if (req.url) {
        const parsedUrl = new URL(req.url, 'http://localhost');
        const tokenParam = parsedUrl.searchParams.get('token');
        if (tokenParam) return tokenParam;
      }

      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7).trim();
      }
    } catch (_) {}
    return null;
  }

  private scheduleTokenExpiryDisconnect(socket: WebSocket, userSession: WsUserSession): void {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const ttlSeconds = userSession.expiresAt - nowSeconds;

    if (ttlSeconds <= 0) {
      socket.close(4403, 'Forbidden: Token has expired');
      return;
    }

    // Schedule disconnect (capped at max 32-bit int ms: ~24.8 days)
    const timeoutMs = Math.min(ttlSeconds * 1000, 2147483647);
    const timer = setTimeout(() => {
      if (socket.readyState === WebSocket.OPEN) {
        this.sendToSocket(socket, 'ws:error', {
          code: 'TOKEN_EXPIRED',
          message: 'Session token has expired. Connection closed.',
        });
        socket.close(4403, 'Forbidden: Token expired');
      }
    }, timeoutMs);

    this.expiryTimers.set(socket, timer);
  }

  private async handleInboundMessage(socket: WebSocket, raw: Buffer | string): Promise<void> {
    let inbound: WsInboundMessage;
    try {
      const text = raw.toString('utf-8');
      inbound = JSON.parse(text);
    } catch (err) {
      this.sendToSocket(socket, 'ws:error', {
        code: 'MALFORMED_PAYLOAD',
        message: 'Payload is not valid JSON.',
      });
      return;
    }

    if (!inbound || !inbound.event || typeof inbound.event !== 'string') {
      this.sendToSocket(socket, 'ws:error', {
        code: 'MALFORMED_PAYLOAD',
        message: 'Missing or invalid event property.',
      });
      return;
    }

    const user = this.roomManager.getUser(socket);
    if (!user) {
      socket.close(4401, 'Unauthorized');
      return;
    }

    // Rate Limiting Check
    if (!this.rateLimiter.checkRateLimit(user.userId)) {
      this.sendToSocket(socket, 'ws:error', {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many messages sent. Please slow down.',
      });
      return;
    }

    // Event Router
    switch (inbound.event) {
      case 'ws:ping':
        this.sendToSocket(socket, 'ws:pong', { timestamp: new Date().toISOString() });
        break;

      case 'ws:join_live': {
        const roomId = String(inbound.data?.roomId || '').trim();
        if (!roomId) {
          this.sendToSocket(socket, 'ws:error', { code: 'INVALID_ROOM_ID', message: 'Room ID required' });
          return;
        }
        const count = this.roomManager.joinLiveRoom(socket, roomId);
        // Broadcast updated viewer count to the room
        this.broadcastViewerCount(roomId, count);
        break;
      }

      case 'ws:leave_live': {
        const roomId = String(inbound.data?.roomId || '').trim();
        if (roomId) {
          const count = this.roomManager.leaveLiveRoom(socket, roomId);
          this.broadcastViewerCount(roomId, count);
        }
        break;
      }

      case 'ws:join_party': {
        const roomId = String(inbound.data?.roomId || '').trim();
        if (!roomId) {
          this.sendToSocket(socket, 'ws:error', { code: 'INVALID_ROOM_ID', message: 'Party room ID required' });
          return;
        }
        this.roomManager.joinPartyRoom(socket, roomId);
        // Send initial seats to joining client
        const seats = this.roomManager.getPartySeats(roomId);
        this.sendToSocket(socket, 'ws:seat_update', { roomId, seats });
        break;
      }

      case 'ws:leave_party': {
        const roomId = String(inbound.data?.roomId || '').trim();
        if (roomId) {
          this.roomManager.leavePartyRoom(socket, roomId);
        }
        break;
      }

      case 'ws:join_dm': {
        const convId = String(inbound.data?.convId || '').trim();
        if (!convId) {
          this.sendToSocket(socket, 'ws:error', { code: 'INVALID_CONV_ID', message: 'Conversation ID required' });
          return;
        }
        const joined = await this.roomManager.joinDmConversation(socket, convId);
        if (!joined) {
          this.sendToSocket(socket, 'ws:error', {
            code: 'NOT_CONVERSATION_MEMBER',
            message: 'You are not a member of this conversation.',
          });
        }
        break;
      }

      case 'ws:typing': {
        const convId = String(inbound.data?.convId || '').trim();
        const isTyping = Boolean(inbound.data?.isTyping ?? true);
        if (convId) {
          const isMember = await this.roomManager.isUserConversationMember(convId, user.userId);
          if (isMember) {
            const eventName = isTyping ? 'ws:typing_start' : 'ws:typing_stop';
            this.roomManager.broadcastToChannel(
              `dm:${convId}`,
              eventName,
              { convId, userId: user.userId, nickname: user.nickname },
              socket // Exclude sender
            );
          }
        }
        break;
      }

      case 'ws:chat_message': {
        const { channel, roomId, convId, messageText, emoji } = inbound.data || {};
        const cleanText = typeof messageText === 'string' ? messageText.trim() : '';
        if (!cleanText && !emoji) {
          this.sendToSocket(socket, 'ws:error', {
            code: 'EMPTY_MESSAGE',
            message: 'Message cannot be empty.',
          });
          return;
        }

        // Target channel
        let targetChannel = channel;
        if (!targetChannel) {
          if (roomId) targetChannel = `live:${roomId}`;
          else if (convId) targetChannel = `dm:${convId}`;
        }

        if (!targetChannel) {
          this.sendToSocket(socket, 'ws:error', { code: 'INVALID_CHANNEL', message: 'No valid channel specified' });
          return;
        }

        // If DM channel, enforce membership
        if (targetChannel.startsWith('dm:')) {
          const cId = targetChannel.substring(3);
          const isMember = await this.roomManager.isUserConversationMember(cId, user.userId);
          if (!isMember) {
            this.sendToSocket(socket, 'ws:error', {
              code: 'NOT_CONVERSATION_MEMBER',
              message: 'Forbidden: You do not belong to this conversation.',
            });
            return;
          }
        }

        const msgPayload: WsChatMessage = {
          id: crypto.randomUUID(),
          channel: targetChannel,
          roomId,
          convId,
          senderId: user.userId,
          senderNickname: user.nickname,
          senderAvatar: user.avatarUrl,
          senderRole: user.role,
          messageText: cleanText,
          emoji,
          createdAt: new Date().toISOString(),
        };

        this.roomManager.broadcastToChannel(targetChannel, 'ws:chat_message', msgPayload);
        break;
      }

      default:
        this.sendToSocket(socket, 'ws:error', {
          code: 'UNKNOWN_EVENT',
          message: `Event '${inbound.event}' is not supported.`,
        });
        break;
    }
  }

  private handleSocketDisconnect(socket: WebSocket): void {
    const timer = this.expiryTimers.get(socket);
    if (timer) {
      clearTimeout(timer);
      this.expiryTimers.delete(socket);
    }

    const { affectedLiveRooms } = this.roomManager.unregisterSocket(socket);

    // Broadcast decremented viewer counts for affected live rooms
    for (const roomId of affectedLiveRooms) {
      const count = this.roomManager.getViewerCount(roomId);
      this.broadcastViewerCount(roomId, count);
    }
  }

  private sendToSocket(socket: WebSocket, event: any, data: any): void {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          event,
          data,
          timestamp: new Date().toISOString(),
        })
      );
    }
  }

  // ---------------------------------------------------------------------------
  // PUBLIC SERVER BROADCAST API
  // ---------------------------------------------------------------------------

  public broadcastToLiveRoom(roomId: string, message: Partial<WsChatMessage>): void {
    const fullMessage: WsChatMessage = {
      id: message.id || crypto.randomUUID(),
      channel: `live:${roomId}`,
      roomId,
      senderId: message.senderId || 'system',
      senderNickname: message.senderNickname || 'Host',
      senderAvatar: message.senderAvatar || '/avatars/default.png',
      senderRole: message.senderRole || 'viewer',
      messageText: message.messageText || '',
      emoji: message.emoji,
      createdAt: message.createdAt || new Date().toISOString(),
    };
    this.roomManager.broadcastToChannel(`live:${roomId}`, 'ws:chat_message', fullMessage);
  }

  public broadcastGiftAlert(
    roomId: string,
    gift: any,
    sender: any,
    hostShare: number,
    roomNumber?: string
  ): void {
    const payload: WsGiftAlertPayload = {
      roomId,
      gift: {
        id: gift.id || 'gift_default',
        name: gift.name || 'Virtual Gift',
        coins: Number(gift.coins) || 10,
        icon: gift.icon,
        imageUrl: gift.imageUrl,
        animationUrl: gift.animationUrl,
      },
      sender: {
        id: sender.id,
        nickname: sender.nickname || 'Supporter',
        avatar: sender.avatar || '/avatars/default.png',
        poppoId: sender.poppoId,
        vipBadge: sender.vipBadge,
      },
      hostShare,
      roomNumber,
      timestamp: new Date().toISOString(),
    };
    this.roomManager.broadcastToChannel(`live:${roomId}`, 'ws:gift_alert', payload);
  }

  public broadcastViewerCount(roomId: string, count: number): void {
    this.roomManager.broadcastToChannel(`live:${roomId}`, 'ws:viewer_count', { roomId, count });
  }

  public broadcastPartySeats(roomId: string, seats: WsSeatInfo[]): void {
    this.roomManager.broadcastToChannel(`party:${roomId}`, 'ws:seat_update', { roomId, seats });
  }

  public pushNotification(userId: string, type: string, payload: any): void {
    const notif: WsNotificationPayload = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };
    this.roomManager.broadcastToChannel(`user:${userId}`, 'ws:notification', notif);
  }

  public close(): Promise<void> {
    for (const timer of this.expiryTimers.values()) {
      clearTimeout(timer);
    }
    this.expiryTimers.clear();

    return new Promise((resolve) => {
      this.wss.close(() => {
        resolve();
      });
    });
  }
}
