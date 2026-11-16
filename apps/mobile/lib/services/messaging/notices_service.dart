import '../../api/api_client.dart';
import '../../screens/notices/system_notices_screen.dart';

/// Centralized service for Popo Live System Notices
class NoticesService {
  NoticesService._();
  static final NoticesService instance = NoticesService._();

  /// Fetches system notices with category filtering and unread status
  Future<List<SystemNoticeModel>> fetchNotices({
    String category = 'all',
    bool unreadOnly = false,
  }) async {
    final response = await ApiClient.instance.get(
      '/api/notices',
      queryParameters: {
        if (category != 'all') 'category': category,
        if (unreadOnly) 'unreadOnly': 'true',
      },
    );

    if (!response.isSuccess || response.data == null) {
      throw Exception(response.error ?? 'Failed to load system notices.');
    }

    final data = response.data['data'] as Map<String, dynamic>?;
    final noticeList = (data?['notices'] as List<dynamic>?) ?? [];

    return noticeList.map((n) {
      return SystemNoticeModel(
        id: n['id']?.toString() ?? '',
        referenceCode: n['referenceCode']?.toString() ?? 'SYS-2026',
        category: n['category']?.toString() ?? 'platform',
        badgeLabel: n['badgeLabel']?.toString() ?? 'SYSTEM',
        title: n['title']?.toString() ?? 'Notice',
        shortDesc: n['shortDesc']?.toString() ?? '',
        fullMessage: n['fullMessage']?.toString() ?? '',
        pubDate: n['pubDate']?.toString() ?? '',
        pubTime: n['pubTime']?.toString() ?? '',
        displayTimestamp: n['displayTimestamp']?.toString() ?? '',
        isImportant: n['isImportant'] == true,
        isRead: n['isRead'] == true,
      );
    }).toList();
  }

  /// Marks a specific notice as read
  Future<void> markNoticeRead(String noticeId) async {
    await ApiClient.instance.post('/api/notices/$noticeId/read');
  }

  /// Marks all notices as read
  Future<void> markAllNoticesRead() async {
    await ApiClient.instance.post('/api/notices/read-all');
  }
}
