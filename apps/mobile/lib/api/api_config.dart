import 'dart:io';

import 'package:flutter/foundation.dart';

/// Environment tiers for the Popo Live mobile application
enum ApiEnvironment { development, testing, production }

/// Centralized configuration for backend connectivity, base URLs, and timeout settings
class ApiConfig {
  static ApiEnvironment _currentEnvironment = ApiEnvironment.production;
  static String? _customBaseUrl;

  /// Default production VPS URL (https://kigolive.com)
  static const String productionBaseUrl = 'https://kigolive.com';

  /// Default local Android emulator host mapping (10.0.2.2 maps to host 127.0.0.1)
  static const String androidEmulatorBaseUrl = 'http://10.0.2.2:3000';

  /// Default local iOS simulator / desktop localhost
  static const String localhostBaseUrl = 'http://localhost:3000';

  /// Request timeout durations
  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 15);

  /// Module-level feature flag controlling whether the Live Streaming screens
  /// read from the live backend database (true) or design fixtures (false).
  /// Preserves full design fixture compatibility when disabled.
  static bool useLiveApi = const bool.fromEnvironment('USE_LIVE_API', defaultValue: false);

  /// Module-level feature flag controlling whether Party screens
  /// read from the live backend database (true) or design fixtures (false).
  /// Preserves full design fixture compatibility when disabled.
  static bool usePartyApi = const bool.fromEnvironment('USE_PARTY_API', defaultValue: false);

  /// Module-level feature flag controlling whether Message screens
  /// read from the live backend database (true) or design fixtures (false).
  /// Preserves full design fixture compatibility when disabled.
  static bool useMessageApi = const bool.fromEnvironment('USE_MESSAGE_API', defaultValue: false);

  /// Module-level feature flag controlling whether Economy (Coins/Points/Gifts/Transactions) screens
  /// read from the live backend database (true) or design fixtures (false).
  /// Preserves full design fixture compatibility when disabled.
  static bool useEconomyApi = const bool.fromEnvironment('USE_ECONOMY_API', defaultValue: false);

  /// Module-level feature flag controlling whether VIP, Rewards, Rankings, Honor & Medals screens
  /// read from the live backend database (true) or design fixtures (false).
  /// Preserves full design fixture compatibility when disabled.
  static bool useVipApi = const bool.fromEnvironment('USE_VIP_API', defaultValue: false);

  /// Module-level feature flag controlling whether Store, Bag & Redeem screens
  /// read from the live backend database (true) or design fixtures (false).
  /// Preserves full design fixture compatibility when disabled.
  static bool useStoreApi = const bool.fromEnvironment('USE_STORE_API', defaultValue: false);

  /// Module-level feature flag controlling whether Community screens
  /// (Fan Club, Guardian, Invite, Honor/Level, Poster, Watch History)
  /// read from the live backend database (true) or design fixtures (false).
  /// Preserves full design fixture compatibility when disabled.
  static bool useCommunityApi = const bool.fromEnvironment('USE_COMMUNITY_API', defaultValue: false);

  /// Module-level feature flag controlling whether Business Centers, Support,
  /// Settings, and Profiles final screens read from the live backend database (true)
  /// or design fixtures (false). Preserves full design fixture compatibility when disabled.
  static bool useFinalApi = const bool.fromEnvironment('USE_FINAL_API', defaultValue: false);

  /// Application version header for backend analytics
  static const String appVersion = '1.0.0';

  /// Gets current active environment
  static ApiEnvironment get currentEnvironment => _currentEnvironment;

  /// Switches active environment
  static void setEnvironment(ApiEnvironment environment) {
    _currentEnvironment = environment;
  }

  /// Sets custom base URL override (e.g. for testing against LAN physical device IP)
  static void setCustomBaseUrl(String? url) {
    if (url != null && url.isNotEmpty) {
      _customBaseUrl = url.endsWith('/')
          ? url.substring(0, url.length - 1)
          : url;
    } else {
      _customBaseUrl = null;
    }
  }

  /// Resolves effective base URL based on environment, platform, and overrides
  static String get baseUrl {
    // 1. Check dart-define compile-time override
    const String dartDefineUrl = String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: '',
    );
    if (dartDefineUrl.isNotEmpty) {
      return dartDefineUrl.endsWith('/')
          ? dartDefineUrl.substring(0, dartDefineUrl.length - 1)
          : dartDefineUrl;
    }

    // 2. Check runtime custom URL override
    if (_customBaseUrl != null && _customBaseUrl!.isNotEmpty) {
      return _customBaseUrl!;
    }

    // 3. Resolve based on environment
    switch (_currentEnvironment) {
      case ApiEnvironment.production:
        return productionBaseUrl;

      case ApiEnvironment.testing:
        return productionBaseUrl;

      case ApiEnvironment.development:
        if (kIsWeb) return '';
        try {
          if (Platform.isAndroid) {
            return androidEmulatorBaseUrl;
          } else if (Platform.isIOS) {
            return localhostBaseUrl;
          }
        } catch (_) {}
        return localhostBaseUrl;
    }
  }

  /// Formats user-agent string for mobile network requests
  static String get userAgent {
    String os = 'unknown';
    if (!kIsWeb) {
      try {
        os = Platform.operatingSystem;
      } catch (_) {}
    } else {
      os = 'web';
    }
    return 'PopoLive-Mobile/$appVersion ($os; Dart/${Platform.version.split(' ').first})';
  }
}
