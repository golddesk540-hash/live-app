/**
 * POPO LIVE — CENTRAL FEATURE FLAGS SYSTEM
 *
 * PHASE 3 MODULE 3.9: NEAR (DEFAULT OFF)
 *
 * Strict Compliance:
 * 1. NEAR_FEATURE_ENABLED is strictly false by default.
 * 2. Remains OFF across app restarts, login/logout, and fresh sessions.
 * 3. Prevents GPS permission requests, background location queries, and location APIs.
 * 4. Prepared for future activation ONLY upon explicit authorized client approval.
 */

export const NEAR_FEATURE_ENABLED = false;

export interface FeatureFlagsConfig {
  NEAR_FEATURE_ENABLED: boolean;
  GPS_PERMISSIONS_REQUESTED: boolean;
  LOCATION_TRACKING_ACTIVE: boolean;
  BACKGROUND_LOCATION_COLLECTION: boolean;
  LOCATION_STORAGE_ENABLED: boolean;
}

export const FEATURE_FLAGS: FeatureFlagsConfig = {
  NEAR_FEATURE_ENABLED: false,
  GPS_PERMISSIONS_REQUESTED: false,
  LOCATION_TRACKING_ACTIVE: false,
  BACKGROUND_LOCATION_COLLECTION: false,
  LOCATION_STORAGE_ENABLED: false,
};

/**
 * Returns true if the Near location-based discovery feature is enabled.
 * Strictly returns false by default.
 */
export function isNearFeatureEnabled(): boolean {
  return NEAR_FEATURE_ENABLED;
}

/**
 * Validates that Near is disabled. Throws an error if attempted without authorization.
 */
export function assertNearDisabled(): void {
  if (NEAR_FEATURE_ENABLED) {
    throw new Error(
      'UNAUTHORIZED_ACTIVATION: The Near feature must remain OFF until explicit client approval.'
    );
  }
}

/**
 * Public accessor for current feature flags snapshot.
 */
export function getFeatureFlags(): FeatureFlagsConfig {
  return { ...FEATURE_FLAGS };
}
