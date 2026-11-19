import 'package:flutter/material.dart';
import '../../theme/popo_theme.dart';
import 'message_state.dart';

/// Dedicated populated notice screen for an official category:
/// 1. Achievements
/// 2. System
/// 3. Account Security
/// 4. New Followers
class OfficialNoticeScreen extends StatefulWidget {
  final String category;

  const OfficialNoticeScreen({
    super.key,
    required this.category,
  });

  @override
  State<OfficialNoticeScreen> createState() => _OfficialNoticeScreenState();
}

class _OfficialNoticeScreenState extends State<OfficialNoticeScreen> {
  @override
  void initState() {
    super.initState();
    MessageStateManager.instance.addListener(_onStateChange);
  }

  @override
  void dispose() {
    MessageStateManager.instance.removeListener(_onStateChange);
    super.dispose();
  }

  void _onStateChange() {
    if (mounted) setState(() {});
  }

  Color _getCategoryColor() {
    switch (widget.category) {
      case 'Achievements':
        return PopoTheme.gold;
      case 'System':
        return PopoTheme.cyan;
      case 'Account Security':
        return const Color(0xFF00E676);
      case 'New Followers':
        return PopoTheme.primary;
      default:
        return PopoTheme.primary;
    }
  }

  IconData _getCategoryIcon() {
    switch (widget.category) {
      case 'Achievements':
        return Icons.emoji_events_rounded;
      case 'System':
        return Icons.campaign_rounded;
      case 'Account Security':
        return Icons.security_rounded;
      case 'New Followers':
        return Icons.person_add_alt_1_rounded;
      default:
        return Icons.notifications_active_rounded;
    }
  }

  void _markAllRead() {
    MessageStateManager.instance.markCategoryNoticesRead(widget.category);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('All ${widget.category} notifications marked as read'),
        duration: const Duration(seconds: 1),
        backgroundColor: PopoTheme.surface,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = MessageStateManager.instance;
    final notices = state.categoryNotices[widget.category] ?? [];
    final categoryColor = _getCategoryColor();
    final categoryIcon = _getCategoryIcon();
    final unreadCount = state.getCategoryUnreadCount(widget.category);

    return Scaffold(
      backgroundColor: PopoTheme.background,
      appBar: AppBar(
        backgroundColor: PopoTheme.surface,
        elevation: 1,
        leading: IconButton(
          key: const Key('official_notice_back_button'),
          icon:
              const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: categoryColor.withOpacity(0.18),
                shape: BoxShape.circle,
              ),
              child: Icon(categoryIcon, color: categoryColor, size: 20),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                widget.category,
                key: const Key('official_notice_title'),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        actions: [
          if (unreadCount > 0)
            TextButton(
              key: const Key('mark_all_read_button'),
              onPressed: _markAllRead,
              child: const Text(
                'Mark Read',
                style: TextStyle(
                  color: PopoTheme.primary,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          const SizedBox(width: 6),
        ],
      ),
      body: SafeArea(
        child: notices.isEmpty
            ? Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      categoryIcon,
                      color: PopoTheme.textSecondary.withOpacity(0.5),
                      size: 48,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'No ${widget.category} notices available',
                      style: const TextStyle(
                        color: PopoTheme.textSecondary,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              )
            : ListView.separated(
                key: const Key('official_notice_list'),
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 14,
                ),
                itemCount: notices.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final notice = notices[index];
                  return _buildNoticeCard(notice, index, categoryColor);
                },
              ),
      ),
    );
  }

  Widget _buildNoticeCard(
    LocalOfficialNoticeItem notice,
    int index,
    Color categoryColor,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: PopoTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: notice.isRead
              ? PopoTheme.borderSubtle
              : categoryColor.withOpacity(0.4),
          width: notice.isRead ? 0.8 : 1.2,
        ),
      ),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row with icon, title, unread dot, and timestamp
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (notice.iconEmoji != null) ...[
                Text(
                  notice.iconEmoji!,
                  style: const TextStyle(fontSize: 20),
                ),
                const SizedBox(width: 8),
              ],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            notice.title,
                            key: Key('notice_item_title_$index'),
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: notice.isRead
                                  ? FontWeight.w600
                                  : FontWeight.bold,
                            ),
                          ),
                        ),
                        if (notice.isUrgent) ...[
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.redAccent.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(
                                color: Colors.redAccent,
                                width: 0.8,
                              ),
                            ),
                            child: const Text(
                              'Alert',
                              style: TextStyle(
                                color: Colors.redAccent,
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                        ],
                        if (!notice.isRead)
                          Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              color: categoryColor,
                              shape: BoxShape.circle,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(
                      notice.timestamp,
                      style: const TextStyle(
                        color: PopoTheme.textSecondary,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Preview / Description
          Text(
            notice.preview,
            key: Key('notice_item_preview_$index'),
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 13,
              height: 1.35,
            ),
          ),

          if (notice.detailText != null) ...[
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: PopoTheme.background,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: PopoTheme.borderSubtle),
              ),
              child: Text(
                notice.detailText!,
                style: const TextStyle(
                  color: Colors.white60,
                  fontSize: 12,
                  height: 1.3,
                ),
              ),
            ),
          ],

          // Follow back action row if New Followers category
          if (widget.category == 'New Followers') ...[
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: PopoTheme.primary),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 6,
                    ),
                    visualDensity: VisualDensity.compact,
                  ),
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Followed back successfully! 💖'),
                        duration: Duration(seconds: 1),
                        backgroundColor: PopoTheme.surface,
                      ),
                    );
                  },
                  child: const Text(
                    'Follow Back',
                    style: TextStyle(
                      color: PopoTheme.primary,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
