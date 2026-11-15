import 'live_studio_session.dart';

/// Aggregated lifetime and period KPIs for the host streaming center
/// Endpoint: GET /api/live/center/history
class LiveHistoryKpis {
  final int totalSessions;
  final int totalDurationSeconds;
  final String totalDurationFormatted;
  final int totalViewers;
  final String totalViewersFormatted;
  final int totalFollowers;
  final String totalFollowersFormatted;

  const LiveHistoryKpis({
    required this.totalSessions,
    required this.totalDurationSeconds,
    required this.totalDurationFormatted,
    required this.totalViewers,
    required this.totalViewersFormatted,
    required this.totalFollowers,
    required this.totalFollowersFormatted,
  });

  factory LiveHistoryKpis.fromJson(Map<String, dynamic> json) {
    return LiveHistoryKpis(
      totalSessions: (json['totalSessions'] as num?)?.toInt() ?? 0,
      totalDurationSeconds:
          (json['totalDurationSeconds'] as num?)?.toInt() ?? 0,
      totalDurationFormatted:
          json['totalDurationFormatted']?.toString() ?? '0m',
      totalViewers: (json['totalViewers'] as num?)?.toInt() ?? 0,
      totalViewersFormatted: json['totalViewersFormatted']?.toString() ?? '0',
      totalFollowers: (json['totalFollowers'] as num?)?.toInt() ?? 0,
      totalFollowersFormatted:
          json['totalFollowersFormatted']?.toString() ?? '+0',
    );
  }
}

/// Past broadcast session record item in host center history
class LiveHistorySessionItem {
  final String id;
  final String roomNumber;
  final String title;
  final String category;
  final String? coverUrl;
  final DateTime? startedAt;
  final DateTime? endedAt;
  final int durationSeconds;
  final String durationFormatted;
  final int totalViewers;
  final String totalViewersFormatted;
  final int peakViewers;
  final String peakViewersFormatted;
  final int newFollowers;
  final int pointsReceived;
  final String status;

  const LiveHistorySessionItem({
    required this.id,
    required this.roomNumber,
    required this.title,
    required this.category,
    this.coverUrl,
    this.startedAt,
    this.endedAt,
    required this.durationSeconds,
    required this.durationFormatted,
    required this.totalViewers,
    required this.totalViewersFormatted,
    required this.peakViewers,
    required this.peakViewersFormatted,
    required this.newFollowers,
    required this.pointsReceived,
    required this.status,
  });

  factory LiveHistorySessionItem.fromJson(Map<String, dynamic> json) {
    DateTime? started;
    if (json['startedAt'] != null) {
      started = DateTime.tryParse(json['startedAt'].toString());
    }
    DateTime? ended;
    if (json['endedAt'] != null) {
      ended = DateTime.tryParse(json['endedAt'].toString());
    }

    final durationSecs = (json['durationSeconds'] as num?)?.toInt() ?? 0;
    String durFormatted = json['durationFormatted']?.toString() ?? '';
    if (durFormatted.isEmpty) {
      final hours = durationSecs ~/ 3600;
      final mins = (durationSecs % 3600) ~/ 60;
      final secs = durationSecs % 60;
      durFormatted =
          '${hours.toString().padLeft(2, '0')}:${mins.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
    }

    final totalV = (json['totalViewers'] as num?)?.toInt() ?? 0;
    final totalVFormatted =
        json['totalViewersFormatted']?.toString() ??
        (totalV >= 1000 ? '${(totalV / 1000).toStringAsFixed(1)}K' : '$totalV');

    final peakV = (json['peakViewers'] as num?)?.toInt() ?? 0;
    final peakVFormatted =
        json['peakViewersFormatted']?.toString() ??
        (peakV >= 1000 ? '${(peakV / 1000).toStringAsFixed(1)}K' : '$peakV');

    return LiveHistorySessionItem(
      id: json['id']?.toString() ?? '',
      roomNumber: json['roomNumber']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Live Stream',
      category: json['category']?.toString() ?? 'Live Chat',
      coverUrl: json['coverUrl']?.toString(),
      startedAt: started,
      endedAt: ended,
      durationSeconds: durationSecs,
      durationFormatted: durFormatted,
      totalViewers: totalV,
      totalViewersFormatted: totalVFormatted,
      peakViewers: peakV,
      peakViewersFormatted: peakVFormatted,
      newFollowers: (json['newFollowers'] as num?)?.toInt() ?? 0,
      pointsReceived: (json['pointsReceived'] as num?)?.toInt() ?? 0,
      status: json['status']?.toString() ?? 'ended',
    );
  }
}

/// Full Live Center history response payload
class LiveHistoryResponse {
  final bool success;
  final String filter;
  final LiveHostInfo? host;
  final LiveHistoryKpis? kpis;
  final List<LiveHistorySessionItem> sessions;
  final bool isDemo;

  const LiveHistoryResponse({
    required this.success,
    required this.filter,
    this.host,
    this.kpis,
    this.sessions = const [],
    this.isDemo = false,
  });

  factory LiveHistoryResponse.fromJson(Map<String, dynamic> json) {
    final rawSessions = json['sessions'] as List<dynamic>? ?? [];
    final sessionsList = rawSessions
        .whereType<Map<String, dynamic>>()
        .map((s) => LiveHistorySessionItem.fromJson(s))
        .toList();

    return LiveHistoryResponse(
      success: json['success'] == true,
      filter: json['filter']?.toString() ?? 'all',
      host: json['host'] is Map<String, dynamic>
          ? LiveHostInfo.fromJson(json['host'] as Map<String, dynamic>)
          : null,
      kpis: json['kpis'] is Map<String, dynamic>
          ? LiveHistoryKpis.fromJson(json['kpis'] as Map<String, dynamic>)
          : null,
      sessions: sessionsList,
      isDemo: json['isDemo'] == true,
    );
  }
}
