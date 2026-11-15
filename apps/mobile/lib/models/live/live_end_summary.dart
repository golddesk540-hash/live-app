import 'live_studio_session.dart';

/// Live broadcast completion end-screen summary model
/// Compatible with backend endpoints:
/// - POST /api/live/studio/end
/// - POST /api/live/end-screen/end
/// - GET /api/live/end-screen/summary
class LiveEndSummary {
  final String? roomId;
  final String? roomNumber;
  final String? title;
  final String? category;
  final String? coverUrl;
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
  final int totalLikes;
  final int totalGifts;
  final LiveHostInfo? host;

  const LiveEndSummary({
    this.roomId,
    this.roomNumber,
    this.title,
    this.category,
    this.coverUrl,
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
    this.totalLikes = 0,
    this.totalGifts = 0,
    this.host,
  });

  factory LiveEndSummary.fromJson(Map<String, dynamic> json) {
    final s = json['summary'] as Map<String, dynamic>? ?? json;

    final durationSecs = (s['durationSeconds'] as num?)?.toInt() ?? 0;
    String durFormatted = s['durationFormatted']?.toString() ?? '';
    if (durFormatted.isEmpty) {
      final hours = durationSecs ~/ 3600;
      final mins = (durationSecs % 3600) ~/ 60;
      final secs = durationSecs % 60;
      durFormatted =
          '${hours.toString().padLeft(2, '0')}:${mins.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
    }

    final totalV =
        (s['totalViewers'] as num?)?.toInt() ??
        (s['peakViewers'] as num?)?.toInt() ??
        0;
    final totalVFormatted =
        s['totalViewersFormatted']?.toString() ??
        (totalV >= 1000 ? '${(totalV / 1000).toStringAsFixed(1)}K' : '$totalV');

    final peakV = (s['peakViewers'] as num?)?.toInt() ?? 0;
    final peakVFormatted =
        s['peakViewersFormatted']?.toString() ??
        (peakV >= 1000 ? '${(peakV / 1000).toStringAsFixed(1)}K' : '$peakV');

    final newF = (s['newFollowers'] as num?)?.toInt() ?? 0;
    final newFFormatted =
        s['newFollowersFormatted']?.toString() ??
        (newF > 0 ? '+$newF' : '$newF');

    final pts =
        (s['pointsReceived'] as num?)?.toInt() ??
        (s['diamondsEarned'] as num?)?.toInt() ??
        0;
    final ptsFormatted =
        s['pointsReceivedFormatted']?.toString() ??
        (pts >= 1000 ? '${(pts / 1000).toStringAsFixed(1)}K' : '$pts');

    final hostData = s['host'] as Map<String, dynamic>?;

    return LiveEndSummary(
      roomId: s['roomId']?.toString() ?? s['sessionId']?.toString(),
      roomNumber: s['roomNumber']?.toString(),
      title: s['title']?.toString(),
      category: s['category']?.toString(),
      coverUrl: s['coverUrl']?.toString(),
      durationSeconds: durationSecs,
      durationFormatted: durFormatted,
      totalViewers: totalV,
      totalViewersFormatted: totalVFormatted,
      peakViewers: peakV,
      peakViewersFormatted: peakVFormatted,
      newFollowers: newF,
      newFollowersFormatted: newFFormatted,
      pointsReceived: pts,
      pointsReceivedFormatted: ptsFormatted,
      totalLikes: (s['totalLikes'] as num?)?.toInt() ?? 0,
      totalGifts: (s['totalGifts'] as num?)?.toInt() ?? 0,
      host: hostData != null ? LiveHostInfo.fromJson(hostData) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'roomId': roomId,
      'roomNumber': roomNumber,
      'title': title,
      'category': category,
      'coverUrl': coverUrl,
      'durationSeconds': durationSeconds,
      'durationFormatted': durationFormatted,
      'totalViewers': totalViewers,
      'totalViewersFormatted': totalViewersFormatted,
      'peakViewers': peakViewers,
      'peakViewersFormatted': peakViewersFormatted,
      'newFollowers': newFollowers,
      'newFollowersFormatted': newFollowersFormatted,
      'pointsReceived': pointsReceived,
      'pointsReceivedFormatted': pointsReceivedFormatted,
      'totalLikes': totalLikes,
      'totalGifts': totalGifts,
      if (host != null)
        'host': {
          'id': host!.id,
          'nickname': host!.nickname,
          'poppoId': host!.poppoId,
          'avatarUrl': host!.avatarUrl,
          'hostLevel': host!.hostLevel,
          'wealthLevel': host!.wealthLevel,
        },
    };
  }
}
