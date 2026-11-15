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

  /// Removes uploaded live cover image
  Future<bool> removeCoverImage() async {
    final res = await _apiService.deleteCover();
    if (res.isSuccess) {
      await fetchGatesStatus(forceRefresh: true);
      return true;
    }
    return false;
  }

  /// Resets face verification status
  Future<bool> resetFaceVerification() async {
    final res = await _apiService.resetFaceVerification();
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

  /// Queries pre-live configuration from backend
  Future<PreLiveConfig> fetchPreLiveConfig({bool isDemo = false}) async {
    try {
      final res = await _apiService.getPreLiveConfig(isDemo: isDemo);
      if (res.isSuccess && res.data != null) {
        final data = res.data as Map<String, dynamic>;
        return PreLiveConfig.fromJson(data);
      }
    } catch (_) {}
    return PreLiveConfig.fallback();
  }

  /// Submits pre-live configuration to create/stage live room
  Future<PreLiveSetupResult> submitPreLiveSetup({
    required String title,
    required String categoryId,
    String? category,
    String? coverUrl,
    List<String> tags = const [],
  }) async {
    final res = await _apiService.setupPreLive(
      title: title,
      categoryId: categoryId,
      category: category,
      coverUrl: coverUrl,
      tags: tags,
    );

    if (res.isSuccess && res.data != null) {
      final data = res.data as Map<String, dynamic>;
      return PreLiveSetupResult.fromJson(data, tags: tags);
    }

    return PreLiveSetupResult(
      success: false,
      message: res.errorMessage ?? 'Failed to stage pre-live studio.',
      roomId: '',
      roomNumber: '',
      title: title,
      category: category ?? 'Live Chat',
      categoryId: categoryId,
      tags: tags,
      hostNickname: 'Host',
      hostPoppoId: '',
      status: 'error',
      nextStep: '',
      error: res.errorMessage,
    );
  }

  /// Clears in-memory caches upon logout
  void clearCache() {
    _cachedGatesStatus = null;
    gatesNotifier.value = null;
  }
}
