import { FixtureLiveRoom, DesignFixtures } from '@/lib/design/designFixtures';

export interface LiveRoomFilterParams {
  country?: string;
  category?: string;
  tab?: string;
  search?: string;
  limit?: number;
  page?: number;
}

export interface ViewerSessionResult {
  success: boolean;
  viewerCount: number;
  viewerDisplay: string;
  sessionId?: string;
  error?: string;
}

/**
 * Module-level feature flag controlling whether Web Live Streaming components
 * read from the live backend database (true) or design fixtures (false).
 * Configured via NEXT_PUBLIC_USE_LIVE_API (strictly FALSE by default in B0).
 */
export const USE_LIVE_API: boolean = process.env.NEXT_PUBLIC_USE_LIVE_API === 'true';

export class LiveApiService {
  /**
   * Fetch active live rooms.
   * When USE_LIVE_API is OFF: Returns DesignFixtures.liveRooms.
   * When USE_LIVE_API is ON: Calls live API. Empty responses remain empty. Errors propagate cleanly without silent fixture fallback.
   */
  static async getLiveRooms(params: LiveRoomFilterParams = {}): Promise<FixtureLiveRoom[]> {
    if (!USE_LIVE_API) {
      return DesignFixtures.liveRooms;
    }

    const searchParams = new URLSearchParams();
    if (params.country && params.country !== 'ALL') searchParams.set('country', params.country);
    if (params.category && params.category !== 'all') searchParams.set('category', params.category);
    if (params.tab) searchParams.set('tab', params.tab);
    if (params.search) searchParams.set('search', params.search);
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.page) searchParams.set('page', String(params.page));

    const res = await fetch(`/api/live/rooms?${searchParams.toString()}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`[LiveApiService] Server returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || '[LiveApiService] Failed to load live rooms');
    }

    if (!Array.isArray(data.rooms)) {
      throw new Error('[LiveApiService] Invalid response format: rooms must be an array');
    }

    // Map backend database format to FixtureLiveRoom interface
    return data.rooms.map((r: any) => ({
      id: r.id,
      roomNumber: r.roomNumber || r.room_number || '8839001',
      title: r.title,
      hostNickname: r.host?.nickname || r.host_nickname || 'Broadcaster',
      hostAvatar: r.host?.avatarUrl || r.host_avatar_url || '/avatars/default.png',
      coverUrl: r.coverUrl || r.cover_url || '/assets/viewer/sample_viewer_broadcast.png',
      category: r.category || 'Live Chat',
      country: r.country || 'Pakistan',
      countryCode: r.countryCode || 'PK',
      flagEmoji: r.flagEmoji || '🇵🇰',
      viewerCount: Number(r.viewerCount) || 0,
      heatScore: (Number(r.viewerCount) || 100) * 12 + 450,
      isLive: r.isLive !== false,
      isPkActive: Boolean(r.isPk || r.isPkActive),
      tags: r.tags || [r.category || 'Live'],
    }));
  }

  /**
   * Fetch followed creators live rooms.
   * When USE_LIVE_API is OFF: Returns fixture followed rooms.
   * When USE_LIVE_API is ON: Calls live following API. Errors propagate cleanly without silent fallback.
   */
  static async getFollowingRooms(): Promise<FixtureLiveRoom[]> {
    if (!USE_LIVE_API) {
      return DesignFixtures.liveRooms.filter((r) => ['room_002', 'room_003', 'room_004'].includes(r.id));
    }

    const res = await fetch('/api/discovery/following', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`[LiveApiService] getFollowingRooms failed with HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || '[LiveApiService] Failed to load following rooms');
    }

    const rooms = data.liveRooms || [];
    return rooms.map((r: any) => ({
      id: r.id || r.roomId,
      roomNumber: r.roomNumber || r.room_number || '8839001',
      title: r.title || r.roomTitle,
      hostNickname: r.host?.nickname || r.hostNickname || 'Broadcaster',
      hostAvatar: r.host?.avatarUrl || r.hostAvatar || '/avatars/default.png',
      coverUrl: r.coverUrl || r.cover_url || '/assets/viewer/sample_viewer_broadcast.png',
      category: r.category || 'Live Chat',
      country: r.country || 'Pakistan',
      countryCode: r.countryCode || 'PK',
      flagEmoji: r.flagEmoji || '🇵🇰',
      viewerCount: Number(r.viewerCount) || 0,
      heatScore: (Number(r.viewerCount) || 100) * 12 + 450,
      isLive: r.isLive !== false,
      isPkActive: Boolean(r.isPk || r.isPkActive),
      tags: r.tags || [r.category || 'Live'],
    }));
  }

  /**
   * Fetch For You curated live rooms.
   * When USE_LIVE_API is OFF: Returns fixture rooms sorted by heat score.
   * When USE_LIVE_API is ON: Calls live discovery API with tab=for_you.
   */
  static async getForYouRooms(): Promise<FixtureLiveRoom[]> {
    if (!USE_LIVE_API) {
      const all = [...DesignFixtures.liveRooms];
      all.sort((a, b) => b.heatScore - a.heatScore);
      return all;
    }

    return LiveApiService.getLiveRooms({ tab: 'for_you' });
  }

  /**
   * Fetch specific live room details by ID.
   * When USE_LIVE_API is OFF: Returns matching fixture room or null.
   * When USE_LIVE_API is ON: Calls live API. Errors propagate cleanly without silent fallback.
   */
  static async getRoomDetails(roomId: string): Promise<FixtureLiveRoom | null> {
    if (!USE_LIVE_API) {
      return DesignFixtures.liveRooms.find((rm) => rm.id === roomId || rm.roomNumber === roomId) || null;
    }

    const res = await fetch(`/api/live/rooms/${roomId}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      throw new Error(`[LiveApiService] getRoomDetails failed with HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || `[LiveApiService] Failed to load room details for "${roomId}"`);
    }

    if (!data.room) {
      return null;
    }

    const r = data.room;
    return {
      id: r.id,
      roomNumber: r.roomNumber || r.room_number || '8839001',
      title: r.title,
      hostNickname: r.host?.nickname || r.host_nickname || 'Broadcaster',
      hostAvatar: r.host?.avatarUrl || r.host_avatar_url || '/avatars/default.png',
      coverUrl: r.coverUrl || r.cover_url || '/assets/viewer/sample_viewer_broadcast.png',
      category: r.category || 'Live Chat',
      country: r.country || 'Pakistan',
      countryCode: r.countryCode || 'PK',
      flagEmoji: r.flagEmoji || '🇵🇰',
      viewerCount: Number(r.viewerCount) || 0,
      heatScore: (Number(r.viewerCount) || 100) * 12 + 450,
      isLive: r.isLive !== false,
      isPkActive: Boolean(r.isPk || r.isPkActive),
      tags: r.tags || [r.category || 'Live'],
    };
  }

  /**
   * Register a viewer joining a live broadcast room.
   * When USE_LIVE_API is OFF: Returns fixture mock viewer count.
   * When USE_LIVE_API is ON: Calls live API. Does not return fake success on failure.
   */
  static async joinViewerSession(roomId: string, sessionId?: string): Promise<ViewerSessionResult> {
    if (!USE_LIVE_API) {
      return {
        success: true,
        viewerCount: 1421,
        viewerDisplay: '1.4K',
        sessionId: sessionId || 'dev_session',
      };
    }

    const res = await fetch(`/api/live/rooms/${roomId}/viewers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });

    if (!res.ok) {
      throw new Error(`[LiveApiService] Join viewer session failed with HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || '[LiveApiService] Failed to join viewer session');
    }

    return {
      success: true,
      viewerCount: Number(data.viewerCount) || 0,
      viewerDisplay: data.viewerDisplay || String(data.viewerCount || 0),
      sessionId: data.sessionId,
    };
  }

  /**
   * Deregister a viewer leaving a live broadcast room.
   * When USE_LIVE_API is OFF: Returns fixture mock viewer count.
   * When USE_LIVE_API is ON: Calls live API. Does not return fake success on failure.
   */
  static async leaveViewerSession(roomId: string, sessionId?: string): Promise<ViewerSessionResult> {
    if (!USE_LIVE_API) {
      return {
        success: true,
        viewerCount: 1420,
        viewerDisplay: '1.4K',
      };
    }

    const res = await fetch(`/api/live/rooms/${roomId}/viewers`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });

    if (!res.ok) {
      throw new Error(`[LiveApiService] Leave viewer session failed with HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || '[LiveApiService] Failed to leave viewer session');
    }

    return {
      success: true,
      viewerCount: Number(data.viewerCount) || 0,
      viewerDisplay: data.viewerDisplay || String(data.viewerCount || 0),
    };
  }

  /**
   * Send periodic heartbeat to refresh active presence.
   * When USE_LIVE_API is OFF: Returns fixture count.
   * When USE_LIVE_API is ON: Calls /api/live/rooms/[roomId]/heartbeat.
   */
  static async sendHeartbeat(roomId: string, sessionId?: string): Promise<ViewerSessionResult> {
    if (!USE_LIVE_API) {
      return {
        success: true,
        viewerCount: 1420,
        viewerDisplay: '1.4K',
      };
    }

    const res = await fetch(`/api/live/rooms/${roomId}/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });

    if (!res.ok) {
      throw new Error(`[LiveApiService] Heartbeat failed with HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || '[LiveApiService] Failed to refresh viewer heartbeat');
    }

    return {
      success: true,
      viewerCount: Number(data.viewerCount) || 0,
      viewerDisplay: data.viewerDisplay || String(data.viewerCount || 0),
    };
  }

  /**
   * Get list of active viewers for a room from PostgreSQL.
   */
  static async getRoomViewers(roomId: string, limit: number = 50): Promise<{
    success: boolean;
    viewerCount: number;
    viewerDisplay: string;
    viewers: any[];
  }> {
    if (!USE_LIVE_API) {
      return {
        success: true,
        viewerCount: 1420,
        viewerDisplay: '1.4K',
        viewers: [],
      };
    }

    const res = await fetch(`/api/live/rooms/${roomId}/viewers?limit=${limit}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`[LiveApiService] getRoomViewers failed with HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || '[LiveApiService] Failed to get room viewers');
    }

    return {
      success: true,
      viewerCount: Number(data.viewerCount) || 0,
      viewerDisplay: data.viewerDisplay || String(data.viewerCount || 0),
      viewers: data.viewers || [],
    };
  }

  /**
   * Fetch chat messages for a live room.
   */
  static async getChatMessages(roomId: string, after?: string, limit: number = 50): Promise<any[]> {
    if (!USE_LIVE_API) {
      return DesignFixtures.liveViewer.recentChatMessages;
    }

    const searchParams = new URLSearchParams();
    if (after) searchParams.set('after', after);
    searchParams.set('limit', String(limit));

    const res = await fetch(`/api/live/rooms/${roomId}/chat?${searchParams.toString()}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`[LiveApiService] getChatMessages failed with HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || '[LiveApiService] Failed to get chat messages');
    }

    return data.messages || [];
  }

  /**
   * Send a chat message into a live room.
   */
  static async sendChatMessage(roomId: string, content: string, emoji?: string): Promise<any> {
    if (!USE_LIVE_API) {
      return {
        id: `mock-${Date.now()}`,
        roomId,
        content,
        emoji,
        createdAt: new Date().toISOString(),
      };
    }

    const res = await fetch(`/api/live/rooms/${roomId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, emoji }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `[LiveApiService] sendChatMessage failed with HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || '[LiveApiService] Failed to send chat message');
    }

    return data.message;
  }
}
