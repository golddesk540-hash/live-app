import 'dart:async';

import 'package:flutter/foundation.dart';

import '../../api/api.dart';
import '../../models/live/live_models.dart';

/// Central Repository for Live Streaming Operations and Gate Validation
/// Enforces business rules: Wealth Level >= 5, Face Biometrics, Cover Photo
class LiveRepository {
  static final LiveRepository instance = LiveRepository._internal();
  LiveRepository._internal();

  factory LiveRepository() => instance;

  final LiveApiService _apiService = LiveApiService();

  LiveGatesStatus? _cachedGatesStatus;
  LiveGatesStatus? get cachedGatesStatus => _cachedGatesStatus;

  final ValueNotifier<LiveGatesStatus?> gatesNotifier =
      ValueNotifier<LiveGatesStatus?>(null);

  /// Queries Go-Live gates status from backend
  Future<LiveGatesStatus> fetchGatesStatus({
    bool forceRefresh = false,
    bool isDemo = false,
  }) async {
    if (!forceRefresh && _cachedGatesStatus != null && !isDemo) {
      return _cachedGatesStatus!;
    }

    final res = await _apiService.getGatesStatus(isDemo: isDemo);
    if (!res.isSuccess || res.data == null) {
      final initial = LiveGatesStatus.initial();
      _cachedGatesStatus = initial;
      gatesNotifier.value = initial;
      return initial;
    }

    final data = res.data as Map<String, dynamic>;
    final status = LiveGatesStatus.fromJson(data);
    _cachedGatesStatus = status;
    gatesNotifier.value = status;
    return status;
  }

  /// Triggers biometric face verification scan on backend
  Future<bool> submitFaceVerification({
    bool simulateFailure = false,
    String? reason,
  }) async {
    final res = await _apiService.verifyFace(
      simulateFailure: simulateFailure,
      reason: reason,
    );

    if (res.isSuccess) {
      await fetchGatesStatus(forceRefresh: true);
      return true;
    }
    return false;
  }

  /// Uploads live cover image
  Future<bool> uploadCoverImage(String base64Image) async {
    final res = await _apiService.uploadCover(base64Image: base64Image);
    if (res.isSuccess) {
      await fetchGatesStatus(forceRefresh: true);
      return true;
    }
    return false;
  }

  /// Validates all 3 Go-Live gates on server
  Future<Map<String, dynamic>> verifyEligibilityOnServer() async {
    final res = await _apiService.verifyEligibility();
    if (res.isSuccess && res.data != null) {
      await fetchGatesStatus(forceRefresh: true);
      return {
        'eligible': true,
        'message': 'All Go-Live gates verified successfully!',
      };
    }

    final errData = res.data is Map ? res.data as Map<String, dynamic> : {};
    return {
      'eligible': false,
      'error': res.errorMessage ?? 'You do not meet all Go-Live requirements.',
      'missingGates': errData['missingGates'] ?? [],
      'reasons': errData['reasons'] ?? [],
    };
  }

  /// Clears in-memory caches upon logout
  void clearCache() {
    _cachedGatesStatus = null;
    gatesNotifier.value = null;
  }
}
