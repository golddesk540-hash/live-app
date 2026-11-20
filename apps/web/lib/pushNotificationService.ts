/**
 * POPO LIVE — WEB RUNTIME PUSH NOTIFICATION SERVICE
 * 
 * Bridges Next.js API routes with Phase 8 Push Notification Service
 * Adheres to PHASE8_FLAGS.useRealPush feature flag.
 */

import { PHASE8_FLAGS } from './phase8Flags';
import {
  pushProvider,
  pushService,
  DeviceTokenRecord,
  PushNotificationType,
  PushPlatform,
  SendPushParams,
  UserNotificationPreferences,
} from '../../../apps/api/src/notifications';

export function isRealPushEnabled(): boolean {
  return PHASE8_FLAGS.useRealPush;
}

export class WebPushNotificationService {
  public async registerToken(params: {
    userId: string;
    deviceToken: string;
    platform: PushPlatform;
    deviceModel?: string;
    appVersion?: string;
  }) {
    return pushService.registerDeviceToken(params);
  }

  public async unregisterToken(userId: string, deviceToken: string) {
    return pushService.unregisterDeviceToken(userId, deviceToken);
  }

  public async getPreferences(userId: string): Promise<UserNotificationPreferences> {
    return pushService.getUserPreferences(userId);
  }

  public async updatePreferences(
    userId: string,
    updates: Partial<UserNotificationPreferences>
  ): Promise<UserNotificationPreferences> {
    return pushService.updateUserPreferences(userId, updates);
  }

  public async sendPush(params: SendPushParams) {
    return pushService.sendPush(params);
  }
}

export const webPushService = new WebPushNotificationService();
export { pushProvider, pushService };
