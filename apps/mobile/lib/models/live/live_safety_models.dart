/// Domain models for Live Chat Safety, Moderation, Reports, Blocks, Mutes, and Rules.
/// Conforms to Next.js backend routes (/api/live/safety/* and /api/live/rules/*).

class LiveReportReason {
  final String id;
  final String label;

  const LiveReportReason({required this.id, required this.label});

  /// Canonical report reasons supported by /api/live/safety/report
  static const List<LiveReportReason> canonicalReasons = [
    LiveReportReason(
      id: 'harassment_bullying',
      label: 'Harassment or bullying',
    ),
    LiveReportReason(
      id: 'inappropriate_content',
      label: 'Inappropriate content',
    ),
    LiveReportReason(id: 'spam', label: 'Spam'),
    LiveReportReason(
      id: 'impersonation',
      label: 'Fake account or impersonation',
    ),
    LiveReportReason(id: 'hate_speech', label: 'Hate or abusive language'),
    LiveReportReason(id: 'other', label: 'Other'),
  ];
}

class LiveReportResult {
  final bool success;
  final String? reportCode;
  final String? message;
  final String? error;

  const LiveReportResult({
    required this.success,
    this.reportCode,
    this.message,
    this.error,
  });

  factory LiveReportResult.fromJson(Map<String, dynamic> json) {
    return LiveReportResult(
      success: json['success'] == true,
      reportCode:
          json['reportCode']?.toString() ?? json['reportId']?.toString(),
      message: json['message']?.toString(),
      error: json['error']?.toString(),
    );
  }
}

class LiveBlockResult {
  final bool success;
  final bool blocked;
  final String targetUserId;
  final String? message;
  final String? error;

  const LiveBlockResult({
    required this.success,
    required this.blocked,
    required this.targetUserId,
    this.message,
    this.error,
  });

  factory LiveBlockResult.fromJson(Map<String, dynamic> json) {
    return LiveBlockResult(
      success: json['success'] == true,
      blocked: json['blocked'] == true,
      targetUserId: json['targetUserId']?.toString() ?? '',
      message: json['message']?.toString(),
      error: json['error']?.toString(),
    );
  }
}

class LiveMuteResult {
  final bool success;
  final bool muted;
  final String targetUserId;
  final String muteType;
  final String? message;
  final String? error;

  const LiveMuteResult({
    required this.success,
    required this.muted,
    required this.targetUserId,
    required this.muteType,
    this.message,
    this.error,
  });

  factory LiveMuteResult.fromJson(Map<String, dynamic> json) {
    return LiveMuteResult(
      success: json['success'] == true,
      muted: json['muted'] == true,
      targetUserId: json['targetUserId']?.toString() ?? '',
      muteType: json['muteType']?.toString() ?? 'viewer_local',
      message: json['message']?.toString(),
      error: json['error']?.toString(),
    );
  }
}

class LiveRuleItem {
  final String id;
  final String title;
  final String description;
  final String category;
  final String icon;
  final int displayOrder;
  final bool isActive;

  const LiveRuleItem({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.icon,
    required this.displayOrder,
    this.isActive = true,
  });

  factory LiveRuleItem.fromJson(Map<String, dynamic> json) {
    return LiveRuleItem(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      category: json['category']?.toString() ?? 'General',
      icon: json['icon']?.toString() ?? 'shield',
      displayOrder: (json['displayOrder'] as num?)?.toInt() ?? 0,
      isActive: json['isActive'] != false,
    );
  }
}

class LiveRulesStatus {
  final bool hasAccepted;
  final bool requiresReacceptance;
  final String? acknowledgedVersion;
  final String currentPolicyVersion;
  final String? acceptedAt;

  const LiveRulesStatus({
    required this.hasAccepted,
    required this.requiresReacceptance,
    this.acknowledgedVersion,
    required this.currentPolicyVersion,
    this.acceptedAt,
  });

  factory LiveRulesStatus.fromJson(Map<String, dynamic> json) {
    return LiveRulesStatus(
      hasAccepted: json['hasAccepted'] == true,
      requiresReacceptance: json['requiresReacceptance'] == true,
      acknowledgedVersion: json['acknowledgedVersion']?.toString(),
      currentPolicyVersion: json['currentPolicyVersion']?.toString() ?? 'v1.0',
      acceptedAt: json['acceptedAt']?.toString(),
    );
  }
}
