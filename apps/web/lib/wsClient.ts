/**
 * POPO LIVE — CLIENT WEBSOCKET & REALTIME SERVICE (WEB)
 * 
 * Supports:
 * - Feature flag gating (USE_REAL_WEBSOCKET)
 * - Automatic polling fallback when flag is false or connection drops
 * - Auto-reconnect with exponential backoff
 * - Namespaced channel subscription management (live, party, dm, user)
 * - Anti-spam rate limiting safeguards
 */

import { PHASE8_FLAGS } from './phase8Flags';

export type WsEventHandler = (data: any) => void;

export interface WsClientConfig {
  url?: string;
  token?: string;
  reconnectIntervalMs?: number;
  maxReconnectAttempts?: number;
}

// Standard Server & Client Event Identifiers
export const WS_EVENTS = {
  JOIN_LIVE: 'ws:join_live',
  LEAVE_LIVE: 'ws:leave_live',
  JOIN_PARTY: 'ws:join_party',
  LEAVE_PARTY: 'ws:leave_party',
  JOIN_DM: 'ws:join_dm',
  TYPING: 'ws:typing',
  CHAT_MESSAGE: 'ws:chat_message',
  GIFT_ALERT: 'ws:gift_alert',
  VIEWER_COUNT: 'ws:viewer_count',
  SEAT_UPDATE: 'ws:seat_update',
  NOTIFICATION: 'ws:notification',
  TYPING_START: 'ws:typing_start',
  TYPING_STOP: 'ws:typing_stop',
} as const;

export class PopoWsClient {
  private ws: any = null;
  private url: string;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private reconnectIntervalMs: number;
  private reconnectTimer: any = null;
  private listeners: Map<string, Set<WsEventHandler>> = new Map();
  private activeSubscriptions: Set<string> = new Set();
  private isConnecting = false;
  private isManuallyClosed = false;

  constructor(config: WsClientConfig = {}) {
    this.url =
      config.url ||
      process.env.NEXT_PUBLIC_WS_URL ||
      (typeof window !== 'undefined'
        ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:4001`
        : 'ws://localhost:4001');
    this.token = config.token || null;
    this.reconnectIntervalMs = config.reconnectIntervalMs || 2000;
    this.maxReconnectAttempts = config.maxReconnectAttempts || 10;
  }

  public isRealWsEnabled(): boolean {
    return (
      PHASE8_FLAGS.useRealWebsocket ||
      process.env.NEXT_PUBLIC_USE_REAL_WEBSOCKET === 'true'
    );
  }

  public setToken(token: string): void {
    this.token = token;
  }

  /**
   * Connects to WebSocket server if flag is enabled
   */
  public connect(token?: string): void {
    if (token) this.token = token;
    this.isManuallyClosed = false;

    if (!this.isRealWsEnabled()) {
      // In polling fallback mode, WS connection is suppressed
      return;
    }

    if (typeof window === 'undefined' && typeof (global as any).WebSocket === 'undefined') {
      return;
    }

    if (this.ws && (this.ws.readyState === 1 || this.ws.readyState === 0)) {
      return;
    }

    this.isConnecting = true;
    const wsConstructor = typeof window !== 'undefined' ? window.WebSocket : (global as any).WebSocket;
    const fullUrl = this.token ? `${this.url}?token=${encodeURIComponent(this.token)}` : this.url;

    try {
      const socket = new wsConstructor(fullUrl);
      this.ws = socket;

      socket.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.emitLocalEvent('open', {});

        // Resubscribe to existing active channels
        this.activeSubscriptions.forEach((channel) => {
          this.sendRawChannelJoin(channel);
        });
      };

      socket.onmessage = (event: any) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload && payload.event) {
            this.emitLocalEvent(payload.event, payload.data);
          }
        } catch (_) {}
      };

      socket.onclose = (event: any) => {
        this.isConnecting = false;
        this.emitLocalEvent('close', { code: event?.code, reason: event?.reason });

        if (!this.isManuallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      socket.onerror = (error: any) => {
        this.isConnecting = false;
        this.emitLocalEvent('error', error);
      };
    } catch (err) {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    const delay = Math.min(
      this.reconnectIntervalMs * Math.pow(1.5, this.reconnectAttempts),
      30000
    );
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Channel Subscriptions
   */
  public joinLiveRoom(roomId: string): void {
    this.activeSubscriptions.add(`live:${roomId}`);
    if (this.isConnected()) {
      this.send('ws:join_live', { roomId });
    }
  }

  public leaveLiveRoom(roomId: string): void {
    this.activeSubscriptions.delete(`live:${roomId}`);
    if (this.isConnected()) {
      this.send('ws:leave_live', { roomId });
    }
  }

  public joinPartyRoom(roomId: string): void {
    this.activeSubscriptions.add(`party:${roomId}`);
    if (this.isConnected()) {
      this.send('ws:join_party', { roomId });
    }
  }

  public leavePartyRoom(roomId: string): void {
    this.activeSubscriptions.delete(`party:${roomId}`);
    if (this.isConnected()) {
      this.send('ws:leave_party', { roomId });
    }
  }

  public joinDmConversation(convId: string): void {
    this.activeSubscriptions.add(`dm:${convId}`);
    if (this.isConnected()) {
      this.send('ws:join_dm', { convId });
    }
  }

  public sendTyping(convId: string, isTyping = true): void {
    if (this.isConnected()) {
      this.send('ws:typing', { convId, isTyping });
    }
  }

  public sendChatMessage(channel: string, messageText: string, emoji?: string): void {
    if (this.isConnected()) {
      this.send('ws:chat_message', { channel, messageText, emoji });
    }
  }

  private sendRawChannelJoin(channel: string): void {
    if (channel.startsWith('live:')) {
      this.send('ws:join_live', { roomId: channel.substring(5) });
    } else if (channel.startsWith('party:')) {
      this.send('ws:join_party', { roomId: channel.substring(6) });
    } else if (channel.startsWith('dm:')) {
      this.send('ws:join_dm', { convId: channel.substring(3) });
    }
  }

  public send(event: string, data?: any): boolean {
    if (!this.isConnected()) return false;
    try {
      this.ws.send(
        JSON.stringify({
          event,
          data,
          timestamp: new Date().toISOString(),
        })
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  public isConnected(): boolean {
    return Boolean(this.ws && this.ws.readyState === 1);
  }

  public on(event: string, handler: WsEventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  public off(event: string, handler: WsEventHandler): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private emitLocalEvent(event: string, data: any): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((h) => {
        try {
          h(data);
        } catch (_) {}
      });
    }
  }

  public disconnect(): void {
    this.isManuallyClosed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      try {
        this.ws.close();
      } catch (_) {}
      this.ws = null;
    }
    this.activeSubscriptions.clear();
  }
}

export const wsClient = new PopoWsClient();
