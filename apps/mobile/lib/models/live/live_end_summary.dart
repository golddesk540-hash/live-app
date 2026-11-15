/// Live broadcast completion end-screen summary model
/// Matching backend endpoint: GET /api/live/end-screen/summary
class LiveEndSummary {
  final int durationSeconds;
  final String durationFormatted;
  final int totalViewers;
  final String totalViewersFormatted;
  final int peakViewers;
  final String peakViewersFormatted;
  final int newFollowers;
  final String newFollowersFormatted;
  final int pointsReceived;
  final String pointsReceivedFormatted;

  const LiveEndSummary({
    required this.durationSeconds,
    required this.durationFormatted,
    required this.totalViewers,
    required this.totalViewersFormatted,
    required this.peakViewers,
    required this.peakViewersFormatted,
    required this.newFollowers,
    required this.newFollowersFormatted,
    required this.pointsReceived,
    required this.pointsReceivedFormatted,
  });

  factory LiveEndSummary.fromJson(Map<String, dynamic> json) {
    final s = json['summary'] as Map<String, dynamic>? ?? json;

    return LiveEndSummary(
      durationSeconds: (s['durationSeconds'] as num?)?.toInt() ?? 0,
      durationFormatted: s['durationFormatted']?.toString() ?? '00:00:00',
      totalViewers: (s['totalViewers'] as num?)?.toInt() ?? 0,
      totalViewersFormatted: s['totalViewersFormatted']?.toString() ?? '0',
      peakViewers: (s['peakViewers'] as num?)?.toInt() ?? 0,
      peakViewersFormatted: s['peakViewersFormatted']?.toString() ?? '0',
      newFollowers: (s['newFollowers'] as num?)?.toInt() ?? 0,
      newFollowersFormatted: s['newFollowersFormatted']?.toString() ?? '0',
      pointsReceived:
          (s['pointsReceived'] as num?)?.toInt() ??
          (s['diamondsEarned'] as num?)?.toInt() ??
          0,
      pointsReceivedFormatted:
          s['pointsReceivedFormatted']?.toString() ??
          (s['diamondsEarned'] != null ? '${s['diamondsEarned']}' : '0'),
    );
  }
}
