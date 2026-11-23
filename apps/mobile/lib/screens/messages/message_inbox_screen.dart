import 'package:flutter/material.dart';
import '../../api/api_config.dart';
import '../../design/design_fixtures.dart';
import '../../theme/popo_theme.dart';
import '../../widgets/popo_empty_state.dart';
import '../../widgets/popo_error_state.dart';
import 'chat_thread_screen.dart';
import 'contact_picker_sheet.dart';
import 'message_state.dart';
import 'official_notice_screen.dart';

/// Popo Live Message Inbox Screen
/// Complete implementation of Phase 4 (D3) Prompt 2
class MessageInboxScreen extends StatefulWidget {
  const MessageInboxScreen({super.key});

  @override
  State<MessageInboxScreen> createState() => _MessageInboxScreenState();
}

class _MessageInboxScreenState extends State<MessageInboxScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    if (!ApiConfig.useMessageApi) {
      MessageStateManager.instance.resetToFixtures();
    }
    MessageStateManager.instance.addListener(_onStateChange);
    if (ApiConfig.useMessageApi) {
      MessageStateManager.instance.fetchLiveInbox();
    }
  }

  @override
  void dispose() {
    MessageStateManager.instance.removeListener(_onStateChange);
    _searchController.dispose();
    super.dispose();
  }

  void _onStateChange() {
    if (mounted) setState(() {});
  }

  void _openPlusAction() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return ContactPickerSheet(
          onSelectUser: (user) {
            final thread = MessageStateManager.instance.getOrCreateThread(user);
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => ChatThreadScreen(threadId: thread.threadId),
              ),
            );
          },
        );
      },
    );
  }

  void _openUserProfile(FixtureUserProfile user) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          padding: const EdgeInsets.all(20),
          decoration: const BoxDecoration(
            color: PopoTheme.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              CircleAvatar(
                radius: 36,
                backgroundImage: NetworkImage(user.avatarUrl),
              ),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    user.nickname,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(user.flagEmoji, style: const TextStyle(fontSize: 14)),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                'ID: ${user.poppoId} · ${user.country}',
                style: const TextStyle(
                  color: PopoTheme.textSecondary,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildProfileStat('Followers', '${user.followersCount}'),
                  const SizedBox(width: 24),
                  _buildProfileStat('Following', '${user.followingCount}'),
                  const SizedBox(width: 24),
                  _buildProfileStat('Wealth', 'Lv.${user.wealthLevel}'),
                ],
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: PopoTheme.primary),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      onPressed: () {
                        Navigator.of(ctx).pop();
                        final thread = MessageStateManager.instance
                            .getOrCreateThread(user);
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) =>
                                ChatThreadScreen(threadId: thread.threadId),
                          ),
                        );
                      },
                      child: const Text(
                        'Direct Message',
                        style: TextStyle(color: PopoTheme.primary),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: PopoTheme.primary,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      onPressed: () => Navigator.of(ctx).pop(),
                      child: const Text('Close'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildProfileStat(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            color: PopoTheme.textSecondary,
            fontSize: 11,
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    // 1. Error state handling
    if (DesignFixtures.isError) {
      return Scaffold(
        backgroundColor: PopoTheme.background,
        appBar: _buildHeader(),
        body: Center(
          child: PopoErrorState(
            key: const Key('message_error_state'),
            title: DesignFixtures.messagesError.title,
            message: DesignFixtures.messagesError.message,
            retryText: DesignFixtures.messagesError.actionLabel,
            onRetry: () {
              setState(() {
                MessageStateManager.instance.resetToFixtures();
              });
            },
          ),
        ),
      );
    }

    // 2. Empty state handling
    if (DesignFixtures.isEmpty) {
      return Scaffold(
        backgroundColor: PopoTheme.background,
        appBar: _buildHeader(),
        body: Center(
          child: PopoEmptyState(
            key: const Key('message_empty_state'),
            icon: Icons.chat_bubble_outline_rounded,
            title: 'No Messages Yet',
            message:
                'Your direct messages and official notices will appear here once received.',
            actionText: 'Find Friends',
            onActionTap: _openPlusAction,
          ),
        ),
      );
    }

    final state = MessageStateManager.instance;
    final allThreads = state.threads;
    final fixtureUsers = DesignFixtures.userProfiles;

    // Filter threads based on search
    final filteredThreads = allThreads.where((t) {
      if (_searchQuery.isEmpty) return true;
      final q = _searchQuery.toLowerCase();
      return t.peerNickname.toLowerCase().contains(q) ||
          t.lastMessage.toLowerCase().contains(q) ||
          t.peerUserId.toLowerCase().contains(q);
    }).toList();

    // Filter people row based on search
    final filteredPeople = fixtureUsers.where((u) {
      if (_searchQuery.isEmpty) return true;
      final q = _searchQuery.toLowerCase();
      return u.nickname.toLowerCase().contains(q) ||
          u.poppoId.toLowerCase().contains(q);
    }).toList();

    return Scaffold(
      backgroundColor: PopoTheme.background,
      appBar: _buildHeader(),
      body: SafeArea(
        child: RefreshIndicator(
          color: PopoTheme.primary,
          onRefresh: () async {
            setState(() {
              MessageStateManager.instance.resetToFixtures();
            });
          },
          child: ListView(
            padding: const EdgeInsets.symmetric(vertical: 8),
            children: [
              // Search Bar
              _buildSearchBar(),
              const SizedBox(height: 12),

              // Search Active & No Results Found
              if (_searchQuery.isNotEmpty &&
                  filteredThreads.isEmpty &&
                  filteredPeople.isEmpty) ...[
                const SizedBox(height: 40),
                Center(
                  child: Column(
                    children: [
                      const Icon(
                        Icons.search_off_rounded,
                        color: PopoTheme.textSecondary,
                        size: 44,
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'No chats or people match "$_searchQuery"',
                        style: const TextStyle(
                          color: PopoTheme.textSecondary,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              ] else ...[
                // Section 2: Horizontal People Row
                if (filteredPeople.isNotEmpty) ...[
                  _buildPeopleSection(filteredPeople),
                  const SizedBox(height: 14),
                ],

                // Section 3: Four Official Notification Rows (Only show if not searching or if search matches official)
                if (_searchQuery.isEmpty) ...[
                  _buildOfficialRowsSection(),
                  const SizedBox(height: 16),
                ],

                // Section 4: Recent Chat List Header & Records
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: [
                      const Text(
                        'Recent Chats',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        '${filteredThreads.length} conversations',
                        style: const TextStyle(
                          color: PopoTheme.textSecondary,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 6),

                // Recent Chats List
                if (filteredThreads.isEmpty) ...[
                  const Padding(
                    padding: EdgeInsets.all(24),
                    child: Center(
                      child: Text(
                        'No matching chat conversations found',
                        style: TextStyle(
                          color: PopoTheme.textSecondary,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ),
                ] else ...[
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    key: const Key('recent_chats_list'),
                    itemCount: filteredThreads.length,
                    separatorBuilder: (_, __) => const Divider(
                      color: PopoTheme.borderSubtle,
                      height: 1,
                      indent: 72,
                      endIndent: 16,
                    ),
                    itemBuilder: (context, index) {
                      final thread = filteredThreads[index];
                      return _buildChatRow(thread);
                    },
                  ),
                ],
              ],
            ],
          ),
        ),
      ),
    );
  }

  PreferredSizeWidget _buildHeader() {
    return AppBar(
      backgroundColor: PopoTheme.surface,
      elevation: 0,
      titleSpacing: 16,
      title: const Text(
        'Message',
        key: Key('message_inbox_title'),
        style: TextStyle(
          color: Colors.white,
          fontSize: 20,
          fontWeight: FontWeight.w900,
          letterSpacing: 0.3,
        ),
      ),
      actions: [
        IconButton(
          key: const Key('message_plus_button'),
          icon: Container(
            padding: const EdgeInsets.all(5),
            decoration: BoxDecoration(
              color: PopoTheme.primary.withOpacity(0.18),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.add_rounded,
              color: PopoTheme.primary,
              size: 22,
            ),
          ),
          tooltip: 'New Conversation',
          onPressed: _openPlusAction,
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        height: 42,
        decoration: BoxDecoration(
          color: PopoTheme.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: PopoTheme.borderSubtle, width: 0.8),
        ),
        child: TextField(
          key: const Key('message_search_input'),
          controller: _searchController,
          style: const TextStyle(color: Colors.white, fontSize: 13),
          decoration: InputDecoration(
            hintText: 'Search people, messages or ID...',
            hintStyle: const TextStyle(
              color: PopoTheme.textSecondary,
              fontSize: 13,
            ),
            prefixIcon: const Icon(
              Icons.search_rounded,
              color: PopoTheme.textSecondary,
              size: 19,
            ),
            suffixIcon: _searchQuery.isNotEmpty
                ? IconButton(
                    key: const Key('message_search_clear'),
                    icon: const Icon(
                      Icons.clear_rounded,
                      color: PopoTheme.textSecondary,
                      size: 16,
                    ),
                    onPressed: () {
                      _searchController.clear();
                      setState(() => _searchQuery = '');
                    },
                  )
                : null,
            border: InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(vertical: 10),
          ),
          onChanged: (val) {
            setState(() => _searchQuery = val.trim());
          },
        ),
      ),
    );
  }

  Widget _buildPeopleSection(List<FixtureUserProfile> people) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'People',
            style: TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        const SizedBox(height: 8),
        SizedBox(
          height: 94,
          child: ListView.separated(
            key: const Key('people_horizontal_list'),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            scrollDirection: Axis.horizontal,
            itemCount: people.length,
            separatorBuilder: (_, __) => const SizedBox(width: 14),
            itemBuilder: (context, index) {
              final user = people[index];
              final isOnline = index % 2 == 0; // Simulated online presence

              return InkWell(
                key: Key('people_avatar_${user.userId}'),
                onTap: () => _openUserProfile(user),
                borderRadius: BorderRadius.circular(30),
                child: SizedBox(
                  width: 62,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Stack(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(2),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: isOnline
                                    ? PopoTheme.primary
                                    : Colors.white24,
                                width: 1.8,
                              ),
                            ),
                            child: CircleAvatar(
                              radius: 24,
                              backgroundColor: Colors.white12,
                              backgroundImage: NetworkImage(user.avatarUrl),
                            ),
                          ),
                          if (isOnline)
                            Positioned(
                              right: 2,
                              bottom: 2,
                              child: Container(
                                width: 10,
                                height: 10,
                                decoration: BoxDecoration(
                                  color: const Color(0xFF00E676),
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: PopoTheme.background,
                                    width: 1.5,
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 5),
                      Text(
                        user.nickname,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildOfficialRowsSection() {
    // Exactly 4 official categories in strict order:
    // 1. Achievements, 2. System, 3. Account Security, 4. New Followers
    final state = MessageStateManager.instance;
    final fixtureNotices = DesignFixtures.officialNotices;

    final categories = [
      {
        'title': 'Achievements',
        'icon': Icons.emoji_events_rounded,
        'color': PopoTheme.gold,
        'notice': fixtureNotices.firstWhere(
          (n) => n.category == 'Achievements',
          orElse: () => fixtureNotices[0],
        ),
      },
      {
        'title': 'System',
        'icon': Icons.campaign_rounded,
        'color': PopoTheme.cyan,
        'notice': fixtureNotices.firstWhere(
          (n) => n.category == 'System',
          orElse: () => fixtureNotices[1],
        ),
      },
      {
        'title': 'Account Security',
        'icon': Icons.security_rounded,
        'color': const Color(0xFF00E676),
        'notice': fixtureNotices.firstWhere(
          (n) => n.category == 'Account Security',
          orElse: () => fixtureNotices[2],
        ),
      },
      {
        'title': 'New Followers',
        'icon': Icons.person_add_alt_1_rounded,
        'color': PopoTheme.primary,
        'notice': fixtureNotices.firstWhere(
          (n) => n.category == 'New Followers',
          orElse: () => fixtureNotices[3],
        ),
      },
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Official Notifications',
            style: TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: PopoTheme.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: PopoTheme.borderSubtle, width: 0.8),
            ),
            child: Column(
              children: List.generate(categories.length, (idx) {
                final cat = categories[idx];
                final title = cat['title'] as String;
                final icon = cat['icon'] as IconData;
                final color = cat['color'] as Color;
                final notice = cat['notice'] as FixtureOfficialNotice;
                final unread = state.getCategoryUnreadCount(title);

                return InkWell(
                  key: Key('official_row_$title'),
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => OfficialNoticeScreen(category: title),
                      ),
                    );
                  },
                  borderRadius: BorderRadius.vertical(
                    top: idx == 0 ? const Radius.circular(16) : Radius.zero,
                    bottom: idx == categories.length - 1
                        ? const Radius.circular(16)
                        : Radius.zero,
                  ),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 12,
                    ),
                    child: Row(
                      children: [
                        // Category Icon container
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: color.withOpacity(0.18),
                            borderRadius: BorderRadius.circular(13),
                          ),
                          child: Icon(icon, color: color, size: 22),
                        ),
                        const SizedBox(width: 12),

                        // Title & Preview
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    title,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const Spacer(),
                                  Text(
                                    notice.timestamp,
                                    style: const TextStyle(
                                      color: PopoTheme.textSecondary,
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 3),
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      notice.preview,
                                      style: const TextStyle(
                                        color: PopoTheme.textSecondary,
                                        fontSize: 12,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  if (unread > 0) ...[
                                    const SizedBox(width: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 6,
                                        vertical: 1,
                                      ),
                                      decoration: BoxDecoration(
                                        color: color,
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Text(
                                        '$unread',
                                        style: const TextStyle(
                                          color: Colors.black,
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChatRow(LocalChatThread thread) {
    return InkWell(
      key: Key('chat_row_${thread.threadId}'),
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => ChatThreadScreen(threadId: thread.threadId),
          ),
        );
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Row(
          children: [
            // User Avatar with Online status
            Stack(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: Colors.white12,
                  backgroundImage: NetworkImage(thread.peerAvatar),
                ),
                if (thread.isOnline)
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      width: 11,
                      height: 11,
                      decoration: BoxDecoration(
                        color: const Color(0xFF00E676),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: PopoTheme.background,
                          width: 1.8,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 12),

            // Peer nickname & last message
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          thread.peerNickname,
                          key: Key('chat_peer_name_${thread.threadId}'),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        thread.lastMessageTime,
                        key: Key('chat_timestamp_${thread.threadId}'),
                        style: TextStyle(
                          color: thread.unreadCount > 0
                              ? PopoTheme.primary
                              : PopoTheme.textSecondary,
                          fontSize: 11,
                          fontWeight: thread.unreadCount > 0
                              ? FontWeight.bold
                              : FontWeight.normal,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          thread.lastMessage,
                          key: Key('chat_last_message_${thread.threadId}'),
                          style: TextStyle(
                            color: thread.unreadCount > 0
                                ? Colors.white
                                : PopoTheme.textSecondary,
                            fontSize: 12,
                            fontWeight: thread.unreadCount > 0
                                ? FontWeight.w600
                                : FontWeight.normal,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (thread.unreadCount > 0) ...[
                        const SizedBox(width: 6),
                        Container(
                          key: Key('chat_unread_badge_${thread.threadId}'),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 1.5,
                          ),
                          decoration: BoxDecoration(
                            color: PopoTheme.primary,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            '${thread.unreadCount}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
