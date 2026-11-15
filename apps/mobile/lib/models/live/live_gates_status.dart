/// Strongly-typed domain models for Go-Live gates and eligibility verification
/// Matching backend endpoint: GET /api/live/gates/status
class LiveGatesStatus {
  final bool success;
  final bool isGuest;
  final bool isEligible;
  final List<String> missingRequirements;
  final FaceCheckGate faceCheck;
  final CoverImageGate coverImage;
  final WealthLevelGate wealthLevel;
  final String? error;

  const LiveGatesStatus({
    required this.success,
    required this.isGuest,
    required this.isEligible,
    required this.missingRequirements,
    required this.faceCheck,
    required this.coverImage,
    required this.wealthLevel,
    this.error,
  });

  /// True only if all 3 Go-Live gates are satisfied
  bool get canGoLive =>
      isEligible &&
      faceCheck.verified &&
      coverImage.uploaded &&
      wealthLevel.passed;

  /// Whether user has achieved Wealth Level 5
  bool get isWealthQualified => wealthLevel.passed;

  /// Whether user has passed biometric face verification
  bool get isFaceVerified => faceCheck.verified;

  /// Whether user has an approved broadcast cover photo
  bool get hasCoverImage => coverImage.uploaded;

  factory LiveGatesStatus.fromJson(Map<String, dynamic> json) {
    final gates = json['gates'] as Map<String, dynamic>? ?? {};

    return LiveGatesStatus(
      success: json['success'] == true,
      isGuest: json['isGuest'] == true,
      isEligible: json['isEligible'] == true,
      missingRequirements:
          (json['missingRequirements'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      faceCheck: FaceCheckGate.fromJson(
        gates['faceCheck'] as Map<String, dynamic>? ?? {},
      ),
      coverImage: CoverImageGate.fromJson(
        gates['coverImage'] as Map<String, dynamic>? ?? {},
      ),
      wealthLevel: WealthLevelGate.fromJson(
        gates['wealthLevel'] as Map<String, dynamic>? ?? {},
      ),
      error: json['error']?.toString(),
    );
  }

  factory LiveGatesStatus.initial() {
    return LiveGatesStatus(
      success: false,
      isGuest: false,
      isEligible: false,
      missingRequirements: ['face_check', 'cover_image', 'wealth_level'],
      faceCheck: const FaceCheckGate(
        status: 'not_started',
        verified: false,
        verifiedAt: null,
        provider: 'kyc_face_service',
      ),
      coverImage: const CoverImageGate(uploaded: false, coverUrl: null),
      wealthLevel: const WealthLevelGate(
        current: 1,
        required: 5,
        passed: false,
      ),
    );
  }
}

class FaceCheckGate {
  final String status;
  final bool verified;
  final String? verifiedAt;
  final String provider;

  const FaceCheckGate({
    required this.status,
    required this.verified,
    this.verifiedAt,
    required this.provider,
  });

  factory FaceCheckGate.fromJson(Map<String, dynamic> json) {
    return FaceCheckGate(
      status: json['status']?.toString() ?? 'not_started',
      verified: json['verified'] == true || json['status'] == 'verified',
      verifiedAt: json['verifiedAt']?.toString(),
      provider: json['provider']?.toString() ?? 'kyc_face_service',
    );
  }
}

class CoverImageGate {
  final bool uploaded;
  final String? coverUrl;

  const CoverImageGate({required this.uploaded, this.coverUrl});

  factory CoverImageGate.fromJson(Map<String, dynamic> json) {
    final url = json['coverUrl']?.toString();
    return CoverImageGate(
      uploaded: json['uploaded'] == true || (url != null && url.isNotEmpty),
      coverUrl: url,
    );
  }
}

class WealthLevelGate {
  final int current;
  final int required;
  final bool passed;

  const WealthLevelGate({
    required this.current,
    required this.required,
    required this.passed,
  });

  factory WealthLevelGate.fromJson(Map<String, dynamic> json) {
    final cur = (json['current'] as num?)?.toInt() ?? 1;
    final req = (json['required'] as num?)?.toInt() ?? 5;
    return WealthLevelGate(
      current: cur,
      required: req,
      passed: json['passed'] == true || cur >= req,
    );
  }
}
