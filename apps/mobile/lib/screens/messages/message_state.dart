import 'package:flutter/foundation.dart';
import '../../api/api_config.dart';
import '../../api/services/message_api_service.dart';
import '../../design/design_fixtures.dart';

/// Single chat message in a 1:1 conversation
class LocalChatMessage {
  final String id;
  final String senderId;
  final String senderName;
  final String text;
  final String timestamp;
  final bool isMine;

  const LocalChatMessage({
    required this.id,
    required this.senderId,
    required this.senderName,
    required this.text,
    required this.timestamp,
    required this.isMine,
  });
}

/// Dynamic, interactive chat thread model supporting local state updates
class LocalChatThread {
  final String threadId;
  final String peerUserId;
  final String peerNickname;
  final String peerAvatar;
  String lastMessage;
  String lastMessageTime;
  int unreadCount;
  final bool isOnline;
  final List<LocalChatMessage> messages;

  LocalChatThread({
    required this.threadId,
    required this.peerUserId,
    required this.peerNickname,
    required this.peerAvatar,
    required this.lastMessage,
    required this.lastMessageTime,
    this.unreadCount = 0,
    required this.isOnline,
    required this.messages,
  });

  LocalChatThread copyWith({
    String? lastMessage,
    String? lastMessageTime,
    int? unreadCount,
    List<LocalChatMessage>? messages,
  }) {
    return LocalChatThread(
      threadId: threadId,
      peerUserId: peerUserId,
      peerNickname: peerNickname,
      peerAvatar: peerAvatar,
      lastMessage: lastMessage ?? this.lastMessage,
      lastMessageTime: lastMessageTime ?? this.lastMessageTime,
      unreadCount: unreadCount ?? this.unreadCount,
      isOnline: isOnline,
      messages: messages ?? List.from(this.messages),
    );
  }
}

/// Official notification item for category notice screens
class LocalOfficialNoticeItem {
  final String id;
  final String category;
  final String title;
  final String preview;
  final String timestamp;
  bool isRead;
  final bool isUrgent;
  final String? detailText;
  final String? iconEmoji;

  LocalOfficialNoticeItem({
    required this.id,
    required this.category,
    required this.title,
    required this.preview,
    required this.timestamp,
    this.isRead = false,
    this.isUrgent = false,
    this.detailText,
    this.iconEmoji,
  });
}

/// In-memory session state manager for Popo Live Messages & Chats
class MessageStateManager extends ChangeNotifier {
  static final MessageStateManager instance = MessageStateManager._internal();

  MessageStateManager._internal() {
    resetToFixtures();
  }

  final List<LocalChatThread> _threads = [];
  final Map<String, List<LocalOfficialNoticeItem>> _categoryNotices = {};

  List<LocalChatThread> get threads => List.unmodifiable(_threads);

  Map<String, List<LocalOfficialNoticeItem>> get categoryNotices =>
      Map.unmodifiable(_categoryNotices);

  /// Resets state from current design fixture data
  void resetToFixtures() {
    _threads.clear();
    _categoryNotices.clear();

    // Check design state
    if (DesignFixtures.isError || DesignFixtures.isEmpty) {
      notifyListeners();
      return;
    }

    // Populate from D0 Fixtures
    final fixtureChats = DesignFixtures.inboxChats;
    for (final fc in fixtureChats) {
      final initialMessages = _createStarterMessages(fc);
      _threads.add(
        LocalChatThread(
          threadId: fc.threadId,
          peerUserId: fc.peerUserId,
          peerNickname: fc.peerNickname,
          peerAvatar: fc.peerAvatar,
          lastMessage: fc.lastMessage,
          lastMessageTime: fc.lastMessageTime,
          unreadCount: fc.unreadCount,
          isOnline: fc.isOnline,
          messages: initialMessages,
        ),
      );
    }

    // Populate official notice records
    final fixtureNotices = DesignFixtures.officialNotices;

    // 1. Achievements
    final fnAchieve = fixtureNotices.firstWhere(
      (n) => n.category == 'Achievements',
      orElse: () => fixtureNotices[0],
    );
    _categoryNotices['Achievements'] = [
      LocalOfficialNoticeItem(
        id: fnAchieve.id,
        category: 'Achievements',
        title: fnAchieve.title,
        preview: fnAchieve.preview,
        timestamp: fnAchieve.timestamp,
        isRead: fnAchieve.isRead,
        isUrgent: fnAchieve.isUrgent,
        iconEmoji: '🏆',
        detailText:
            'You reached the 1,000,000 diamonds milestone this calendar month! The Top Broadcaster sparkling badge and 5,000 bonus host points have been credited to your wallet.',
      ),
      LocalOfficialNoticeItem(
        id: 'achieve_02',
        category: 'Achievements',
        title: 'Level 10 Wealth Master Badge 🌟',
        preview:
            'You unlocked the Level 10 Wealth Master badge for your broadcast profile.',
        timestamp: 'Nov 14, 04:20 PM',
        isRead: true,
        iconEmoji: '🌟',
        detailText:
            'Your generous support across live rooms has unlocked exclusive entrance carriage effects and the Level 10 Golden Avatar Frame.',
      ),
      LocalOfficialNoticeItem(
        id: 'achieve_03',
        category: 'Achievements',
        title: '1v1 PK Battle Champion ⚔️',
        preview:
            'Won 5 consecutive 1v1 PK battles. 5,000 bonus points credited.',
        timestamp: 'Nov 12, 08:15 PM',
        isRead: true,
        iconEmoji: '⚔️',
        detailText:
            'Your performance during the Karachi Live PK Tournament set a new record with over 89,000 cheering reactions!',
      ),
    ];

    // 2. System
    final fnSystem = fixtureNotices.firstWhere(
      (n) => n.category == 'System',
      orElse: () => fixtureNotices[1],
    );
    _categoryNotices['System'] = [
      LocalOfficialNoticeItem(
        id: fnSystem.id,
        category: 'System',
        title: fnSystem.title,
        preview: fnSystem.preview,
        timestamp: fnSystem.timestamp,
        isRead: fnSystem.isRead,
        isUrgent: fnSystem.isUrgent,
        iconEmoji: '⚡',
        detailText:
            'Scheduled infrastructure maintenance completed successfully. Enjoy reduced latency on Agora audio/video channels and enhanced gift animation rendering.',
      ),
      LocalOfficialNoticeItem(
        id: 'sys_02',
        category: 'System',
        title: 'Audio Lounge 9-Seat Update 🎙️',
        preview:
            'Improved low-latency audio engine for 9-seat party rooms with real-time mic controls.',
        timestamp: 'Nov 13, 02:00 PM',
        isRead: true,
        iconEmoji: '🎙️',
        detailText:
            'Hosts can now mute/unmute co-hosts smoothly and manage audience seat requests with instantaneous tactile feedback.',
      ),
      LocalOfficialNoticeItem(
        id: 'sys_03',
        category: 'System',
        title: 'Terms of Service & Creator Guidelines Updated 📜',
        preview:
            'Review the updated broadcaster community safety regulations effective December 2026.',
        timestamp: 'Nov 08, 11:30 AM',
        isRead: true,
        iconEmoji: '📜',
        detailText:
            'All broadcasters are reminded to maintain respectful communication and comply with the Popo Live 18+ community guidelines.',
      ),
    ];

    // 3. Account Security
    final fnSecurity = fixtureNotices.firstWhere(
      (n) => n.category == 'Account Security',
      orElse: () => fixtureNotices[2],
    );
    _categoryNotices['Account Security'] = [
      LocalOfficialNoticeItem(
        id: fnSecurity.id,
        category: 'Account Security',
        title: fnSecurity.title,
        preview: fnSecurity.preview,
        timestamp: fnSecurity.timestamp,
        isRead: fnSecurity.isRead,
        isUrgent: fnSecurity.isUrgent,
        iconEmoji: '🛡️',
        detailText:
            'A new sign-in was confirmed on your account from Android Pixel device (Karachi, Pakistan). IP 169.58.50.184. If this was not you, lock your account immediately in Settings.',
      ),
      LocalOfficialNoticeItem(
        id: 'sec_02',
        category: 'Account Security',
        title: 'Two-Factor Authentication (2FA) Active 🔐',
        preview:
            'SMS OTP verification is enabled for all coin redemptions and profile security changes.',
        timestamp: 'Nov 10, 01:25 PM',
        isRead: true,
        iconEmoji: '🔐',
        detailText:
            'Your mobile number +92 300 1234567 is protected with 6-digit one-time password security.',
      ),
      LocalOfficialNoticeItem(
        id: 'sec_03',
        category: 'Account Security',
        title: 'Password Changed Successfully 🔑',
        preview:
            'Your account password was updated from the mobile application.',
        timestamp: 'Nov 01, 10:00 AM',
        isRead: true,
        iconEmoji: '🔑',
        detailText:
            'All other active sessions were refreshed with the new cryptographic credentials.',
      ),
    ];

    // 4. New Followers
    final fnFollowers = fixtureNotices.firstWhere(
      (n) => n.category == 'New Followers',
      orElse: () => fixtureNotices[3],
    );
    _categoryNotices['New Followers'] = [
      LocalOfficialNoticeItem(
        id: fnFollowers.id,
        category: 'New Followers',
        title: fnFollowers.title,
        preview: fnFollowers.preview,
        timestamp: fnFollowers.timestamp,
        isRead: fnFollowers.isRead,
        isUrgent: fnFollowers.isUrgent,
        iconEmoji: '💖',
        detailText:
            'Ayesha Siddiqui, Tariq Jamil, and 22 other users started following your live studio channel. Greet them in your next live session!',
      ),
      LocalOfficialNoticeItem(
        id: 'fol_02',
        category: 'New Followers',
        title: 'Bilawal Khan Followed You 👤',
        preview: 'Bilawal Khan started following your broadcasting updates.',
        timestamp: 'Nov 14, 07:10 PM',
        isRead: true,
        iconEmoji: '👤',
        detailText:
            'Bilawal Khan is a VIP Level 3 supporter from Lahore with over 5,000 diamonds contributed.',
      ),
      LocalOfficialNoticeItem(
        id: 'fol_03',
        category: 'New Followers',
        title: 'Sana Ali Added You to Favorites ⭐',
        preview: 'Sana Ali added you to priority live stream notifications.',
        timestamp: 'Nov 12, 09:30 AM',
        isRead: true,
        iconEmoji: '⭐',
        detailText:
            'Sana Ali will be notified instantaneously whenever your live room opens.',
      ),
    ];

    notifyListeners();
  }

  /// Finds or creates a chat thread with a fixture user
  LocalChatThread getOrCreateThread(FixtureUserProfile user) {
    final existingIdx = _threads.indexWhere((t) => t.peerUserId == user.userId);
    if (existingIdx != -1) {
      return _threads[existingIdx];
    }

    final newThread = LocalChatThread(
      threadId: 'th_${user.userId}',
      peerUserId: user.userId,
      peerNickname: user.nickname,
      peerAvatar: user.avatarUrl,
      lastMessage: 'Started a new conversation',
      lastMessageTime: 'Just now',
      unreadCount: 0,
      isOnline: true,
      messages: [
        LocalChatMessage(
          id: 'welcome_${DateTime.now().millisecondsSinceEpoch}',
          senderId: user.userId,
          senderName: user.nickname,
          text: 'Hello! Thanks for connecting on Popo Live 👋',
          timestamp: 'Just now',
          isMine: false,
        ),
      ],
    );

    _threads.insert(0, newThread);
    notifyListeners();
    return newThread;
  }

  /// Sends a new message in a thread
  void sendMessage(String threadId, String text) {
    if (text.trim().isEmpty) return;

    final idx = _threads.indexWhere((t) => t.threadId == threadId);
    if (idx == -1) return;

    final thread = _threads[idx];
    final newMsg = LocalChatMessage(
      id: 'msg_${DateTime.now().millisecondsSinceEpoch}',
      senderId: 'u_current_user',
      senderName: DesignFixtures.currentUserProfile.nickname,
      text: text.trim(),
      timestamp: 'Just now',
      isMine: true,
    );

    thread.messages.add(newMsg);
    thread.lastMessage = text.trim();
    thread.lastMessageTime = 'Just now';
    thread.unreadCount = 0;

    // Move active thread to top of list
    if (idx > 0) {
      _threads.removeAt(idx);
      _threads.insert(0, thread);
    }

    notifyListeners();
  }

  /// Fetches live conversations from database backend when USE_MESSAGE_API is enabled
  Future<void> fetchLiveInbox() async {
    if (!ApiConfig.useMessageApi) return;
    try {
      final res = await MessageApiService().getConversations();
      if (res.isSuccess && res.data != null) {
        final list = (res.data['conversations'] as List?) ?? [];
        _threads.clear();
        for (final c in list) {
          _threads.add(
            LocalChatThread(
              threadId: c['threadId']?.toString() ?? c['id']?.toString() ?? '',
              peerUserId: c['peerUserId']?.toString() ?? c['peerId']?.toString() ?? '',
              peerNickname: c['peerNickname']?.toString() ?? 'User',
              peerAvatar: c['peerAvatar']?.toString() ?? '',
              lastMessage: c['lastMessage']?.toString() ?? '',
              lastMessageTime: c['lastMessageTime']?.toString() ?? '',
              unreadCount: (c['unreadCount'] as num?)?.toInt() ?? 0,
              isOnline: true,
              messages: [],
            ),
          );
        }
        notifyListeners();
      }
    } catch (_) {}
  }

  /// Fetches live messages for a thread from database backend
  Future<void> fetchLiveMessages(String threadId) async {
    if (!ApiConfig.useMessageApi) return;
    try {
      final res = await MessageApiService().getMessages(threadId);
      if (res.isSuccess && res.data != null) {
        final list = (res.data['messages'] as List?) ?? [];
        final idx = _threads.indexWhere((t) => t.threadId == threadId);
        if (idx != -1) {
          _threads[idx].messages.clear();
          for (final m in list) {
            _threads[idx].messages.add(
              LocalChatMessage(
                id: m['id']?.toString() ?? '',
                senderId: m['senderId']?.toString() ?? '',
                senderName: m['senderNickname']?.toString() ?? '',
                text: m['text']?.toString() ?? m['content']?.toString() ?? '',
                timestamp: m['timestamp']?.toString() ?? '',
                isMine: m['isMe'] == true,
              ),
            );
          }
          notifyListeners();
        }
      }
    } catch (_) {}
  }

  /// Sends a message via API or local fallback
  Future<void> sendLiveMessage(String threadId, String text) async {
    if (text.trim().isEmpty) return;
    if (ApiConfig.useMessageApi) {
      try {
        final res = await MessageApiService().sendMessage(threadId, text);
        if (res.isSuccess && res.data != null && res.data['message'] != null) {
          final m = res.data['message'];
          final idx = _threads.indexWhere((t) => t.threadId == threadId);
          if (idx != -1) {
            final thread = _threads[idx];
            thread.messages.add(
              LocalChatMessage(
                id: m['id']?.toString() ?? '',
                senderId: m['senderId']?.toString() ?? '',
                senderName: m['senderNickname']?.toString() ?? '',
                text: m['text']?.toString() ?? text.trim(),
                timestamp: m['timestamp']?.toString() ?? 'Just now',
                isMine: true,
              ),
            );
            thread.lastMessage = text.trim();
            thread.lastMessageTime = 'Just now';
            if (idx > 0) {
              _threads.removeAt(idx);
              _threads.insert(0, thread);
            }
            notifyListeners();
            return;
          }
        }
      } catch (_) {}
    }
    // Fallback to local
    sendMessage(threadId, text);
  }

  /// Marks a thread as read
  void markThreadAsRead(String threadId) {
    final idx = _threads.indexWhere((t) => t.threadId == threadId);
    if (idx != -1 && _threads[idx].unreadCount > 0) {
      _threads[idx].unreadCount = 0;
      notifyListeners();
    }
  }

  /// Marks all notices in a category as read
  void markCategoryNoticesRead(String category) {
    final list = _categoryNotices[category];
    if (list != null) {
      bool changed = false;
      for (final n in list) {
        if (!n.isRead) {
          n.isRead = true;
          changed = true;
        }
      }
      if (changed) {
        notifyListeners();
      }
    }
  }

  /// Unread count for an official notice category
  int getCategoryUnreadCount(String category) {
    final list = _categoryNotices[category];
    if (list == null) return 0;
    return list.where((n) => !n.isRead).length;
  }

  /// Generates starter dialogue for fixture threads
  List<LocalChatMessage> _createStarterMessages(FixtureChatThread fc) {
    final msgs = <LocalChatMessage>[];

    // Pre-populate realistic conversation history ending with lastMessage
    if (fc.threadId == 'th_01') {
      msgs.add(
        LocalChatMessage(
          id: 'm_01_1',
          senderId: fc.peerUserId,
          senderName: fc.peerNickname,
          text:
              'Hey Amina! Are you getting ready for the PK battle tonight? 🎤',
          timestamp: '10:30 AM',
          isMine: false,
        ),
      );
      msgs.add(
        const LocalChatMessage(
          id: 'm_01_2',
          senderId: 'u_current_user',
          senderName: 'Amina Noor',
          text:
              'Yes! Tuning my guitar right now 🎸 Let’s bring our best energy!',
          timestamp: '10:38 AM',
          isMine: true,
        ),
      );
      msgs.add(
        LocalChatMessage(
          id: 'm_01_3',
          senderId: fc.peerUserId,
          senderName: fc.peerNickname,
          text: fc.lastMessage,
          timestamp: fc.lastMessageTime,
          isMine: false,
        ),
      );
    } else if (fc.threadId == 'th_03') {
      msgs.add(
        LocalChatMessage(
          id: 'm_03_1',
          senderId: fc.peerUserId,
          senderName: fc.peerNickname,
          text: 'Assalam o Alaikum Amina! Hope your stream went wonderfully.',
          timestamp: 'Yesterday, 06:15 PM',
          isMine: false,
        ),
      );
      msgs.add(
        const LocalChatMessage(
          id: 'm_03_2',
          senderId: 'u_current_user',
          senderName: 'Amina Noor',
          text:
              'Walaikum Assalam Zainab! Yes, the audience loved the Sufi set.',
          timestamp: 'Yesterday, 07:00 PM',
          isMine: true,
        ),
      );
      msgs.add(
        LocalChatMessage(
          id: 'm_03_3',
          senderId: fc.peerUserId,
          senderName: fc.peerNickname,
          text: fc.lastMessage,
          timestamp: fc.lastMessageTime,
          isMine: false,
        ),
      );
    } else {
      // Default initial message
      msgs.add(
        LocalChatMessage(
          id: 'm_${fc.threadId}_last',
          senderId: fc.peerUserId,
          senderName: fc.peerNickname,
          text: fc.lastMessage,
          timestamp: fc.lastMessageTime,
          isMine: false,
        ),
      );
    }

    return msgs;
  }
}
