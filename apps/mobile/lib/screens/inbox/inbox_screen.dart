import 'dart:async';
import 'package:flutter/material.dart';

import '../../l10n/strings.dart';
import '../../services/messaging/inbox_service.dart';
import '../notices/system_notices_screen.dart';
import '../notifications/notifications_screen.dart';

/// Popo Live — Phase 8.1: Inbox & 1:1 Direct Messaging
/// Connected to Next.js backend with real-time SSE synchronization
class InboxUserModel {
  final String id;
  final String name;
  final String poppoId;
  final String status; // online | live | offline
  final String lastSeen;
  final Color ringColor;
  final bool isOfficial;

  const InboxUserModel({
    required this.id,
    required this.name,
    required this.poppoId,
    required this.status,
    required this.lastSeen,
    required this.ringColor,
    this.isOfficial = false,
  });
}

class InboxMessageModel {
  final String id;
  final String senderId;
  final String text;
  final String time;

  const InboxMessageModel({
    required this.id,
    required this.senderId,
    required this.text,
    required this.time,
  });
}

class InboxConversationModel {
  final String id;
  final InboxUserModel user;
  String lastMessage;
  String lastTime;
  int unreadCount;
  bool isPinned;
  final List<InboxMessageModel> messages;

  InboxConversationModel({
    required this.id,
    required this.user,
    required this.lastMessage,
    required this.lastTime,
    this.unreadCount = 0,
    this.isPinned = false,
    required this.messages,
  });
}

class InboxRequestModel {
  final String id;
  final InboxUserModel user;
  final String preview;
  final String timeAgo;

  const InboxRequestModel({
    required this.id,
    required this.user,
    required this.preview,
    required this.timeAgo,
  });
}

class InboxScreen extends StatefulWidget {
  const InboxScreen({super.key});

  @override
  State<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends State<InboxScreen> {
  static const _bgDeep = Color(0xFF0C041C);
  static const _surface = Color(0xFF1A0F35);
  static const _neonPink = Color(0xFFFF1A6C);
  static const _gold = Color(0xFFFBBF24);

  int _tabIndex = 0; // 0: Chats, 1: Contacts, 2: Requests
  String _searchQuery = '';
  bool _showSearch = false;
  bool _isLoading = false;
  String? _errorMessage;

  List<InboxConversationModel> _conversations = [];
  List<InboxUserModel> _contacts = [];
  List<InboxRequestModel> _requests = [];

  int _unreadNotices = 0;
  int _unreadNotifications = 0;

  StreamSubscription? _sseSub;

  @override
  void initState() {
    super.initState();
    _loadData();
    _initRealtimeSubscription();
  }

  @override
  void dispose() {
    _sseSub?.cancel();
    super.dispose();
  }

  Future<void> _loadData() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final convs = await InboxService.instance.fetchConversations();
      final summary = await InboxService.instance.fetchInboxSummary();

      // Extract unique contacts from conversations and reference contacts
      final contactsMap = <String, InboxUserModel>{};
      for (final c in convs) {
        contactsMap[c.user.id] = c.user;
      }

      // Add default official contact if not present
      if (!contactsMap.containsKey('official_support')) {
        contactsMap['official_support'] = const InboxUserModel(
          id: '00000000-0000-0000-0000-000000000099',
          name: 'Popo Live Team',
          poppoId: '10000001',
          status: 'online',
          lastSeen: 'Official Support',
          ringColor: Color(0xFFFBBF24),
          isOfficial: true,
        );
      }

      if (mounted) {
        setState(() {
          _conversations = convs;
          _contacts = contactsMap.values.toList();
          _unreadNotices = summary['unreadNotices'] ?? 0;
          _unreadNotifications = summary['unreadNotifications'] ?? 0;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceAll('Exception:', '').trim();
          _isLoading = false;
        });
      }
    }
  }

  void _initRealtimeSubscription() {
    InboxService.instance.subscribeRealtimeEvents();
    _sseSub = InboxService.instance.onMessageEvent.listen((evt) {
      if (!mounted) return;

      if (evt.eventType == 'new_message') {
        final text = evt.payload['text']?.toString() ?? '';
        final senderId = evt.senderId;
        final convId = evt.conversationId;

        setState(() {
          final idx = _conversations.indexWhere((c) => c.id == convId);
          if (idx != -1) {
            final target = _conversations.removeAt(idx);
            target.lastMessage = text;
            target.lastTime = 'Just now';
            target.unreadCount += 1;
            _conversations.insert(0, target);
          } else {
            // New conversation incoming
            _loadData();
          }
        });
      } else if (evt.eventType == 'message_read') {
        final convId = evt.conversationId;
        setState(() {
          final target = _conversations.where((c) => c.id == convId).firstOrNull;
          if (target != null) {
            target.unreadCount = 0;
          }
        });
      }
    });
  }

  void _openConversation(InboxConversationModel conv) async {
    setState(() {
      conv.unreadCount = 0;
    });

    // Mark as read in backend
    InboxService.instance.markConversationRead(conv.id);

    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => _InboxChatDetailScreen(
          conversation: conv,
          onSend: (txt) {
            setState(() {
              conv.lastMessage = txt;
              conv.lastTime = 'Just now';
            });
          },
        ),
      ),
    );

    // Refresh inbox summary on return
    _loadData();
  }

  void _acceptRequest(InboxRequestModel req) {
    setState(() {
      _requests.removeWhere((r) => r.id == req.id);
      final conv = InboxConversationModel(
        id: 'conv_${req.user.id}',
        user: req.user,
        lastMessage: req.preview,
        lastTime: 'Just now',
        unreadCount: 0,
        messages: [
          InboxMessageModel(
            id: 'msg_${req.id}',
            senderId: req.user.id,
            text: req.preview,
            time: 'Just now',
          ),
        ],
      );
      _conversations.insert(0, conv);
      _tabIndex = 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isUrdu = PopoStrings.currentLanguage.value == 'ur';
    final q = _searchQuery.trim().toLowerCase();
    final filteredChats = _conversations
        .where((c) =>
            q.isEmpty ||
            c.user.name.toLowerCase().contains(q) ||
            c.lastMessage.toLowerCase().contains(q))
        .toList();
    final filteredContacts = _contacts
        .where((u) =>
            q.isEmpty ||
            u.name.toLowerCase().contains(q) ||
            u.poppoId.contains(q))
        .toList();

    return Scaffold(
      backgroundColor: _bgDeep,
      appBar: AppBar(
        backgroundColor: _bgDeep,
        elevation: 0,
        title: Row(
          children: [
            const Icon(Icons.radio_button_checked, color: Colors.white, size: 20),
            const SizedBox(width: 8),
            Text(
              PopoStrings.appName,
              style: const TextStyle(fontWeight: FontWeight.w800, color: Colors.white),
            ),
          ],
        ),
        actions: [
          // System Notices shortcut with badge
          Stack(
            alignment: Alignment.topRight,
            children: [
              IconButton(
                icon: const Icon(Icons.campaign_outlined, color: Colors.white70),
                tooltip: isUrdu ? 'سسٹم نوٹس' : 'System Notices',
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const SystemNoticesScreen()),
                  ).then((_) => _loadData());
                },
              ),
              if (_unreadNotices > 0)
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: _neonPink,
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(minWidth: 8, minHeight: 8),
                  ),
                ),
            ],
          ),
          // Notifications shortcut with badge
          Stack(
            alignment: Alignment.topRight,
            children: [
              IconButton(
                icon: const Icon(Icons.notifications_none_rounded, color: Colors.white70),
                tooltip: isUrdu ? 'اطلاعات' : 'Notifications',
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const NotificationsScreen()),
                  ).then((_) => _loadData());
                },
              ),
              if (_unreadNotifications > 0)
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: _gold,
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(minWidth: 8, minHeight: 8),
                  ),
                ),
            ],
          ),
          IconButton(
            icon: Icon(_showSearch ? Icons.close : Icons.search, color: Colors.white70),
            onPressed: () => setState(() {
              _showSearch = !_showSearch;
              if (!_showSearch) _searchQuery = '';
            }),
          ),
        ],
      ),
      body: RefreshIndicator(
        color: _neonPink,
        backgroundColor: _surface,
        onRefresh: _loadData,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                isUrdu ? 'ان باکس' : 'Inbox',
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                isUrdu ? 'آپ کے پیغامات اور چیٹس' : 'Your chats and messages',
                style: const TextStyle(fontSize: 13, color: Colors.white60),
              ),
              const SizedBox(height: 16),
              if (_showSearch) ...[
                TextField(
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                  decoration: InputDecoration(
                    hintText: isUrdu
                        ? 'چیٹس یا رابطے تلاش کریں...'
                        : 'Search chats or contacts...',
                    hintStyle: const TextStyle(color: Colors.white38),
                    filled: true,
                    fillColor: _surface,
                    prefixIcon: const Icon(Icons.search, color: Colors.white54),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(28),
                      borderSide: BorderSide.none,
                    ),
                  ),
                  onChanged: (v) => setState(() => _searchQuery = v),
                ),
                const SizedBox(height: 12),
              ],
              Row(
                children: [
                  _buildTabPill(0, isUrdu ? 'چیٹس' : 'Chats'),
                  const SizedBox(width: 8),
                  _buildTabPill(1, isUrdu ? 'رابطے' : 'Contacts'),
                  const SizedBox(width: 8),
                  _buildTabPill(
                    2,
                    isUrdu
                        ? 'درخواستیں${_requests.isNotEmpty ? ' (${_requests.length})' : ''}'
                        : 'Requests${_requests.isNotEmpty ? ' (${_requests.length})' : ''}',
                  ),
                ],
              ),
              const SizedBox(height: 14),
              if (_errorMessage != null)
                Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.redAccent.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.redAccent.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: Colors.redAccent, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(color: Colors.redAccent, fontSize: 12),
                        ),
                      ),
                      TextButton(
                        onPressed: _loadData,
                        child: Text(
                          isUrdu ? 'دوبارہ کوشش' : 'Retry',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ),
              Expanded(
                child: _isLoading && _conversations.isEmpty
                    ? const Center(
                        child: CircularProgressIndicator(color: _neonPink),
                      )
                    : _tabIndex == 0
                        ? (filteredChats.isEmpty
                            ? Center(
                                child: Text(
                                  isUrdu ? 'کوئی گفتگو موجود نہیں ہے' : 'No conversations found',
                                  style: const TextStyle(color: Colors.white54),
                                ),
                              )
                            : ListView.separated(
                                itemCount: filteredChats.length,
                                separatorBuilder: (_, __) =>
                                    const Divider(color: Colors.white12, height: 1),
                                itemBuilder: (_, idx) {
                                  final conv = filteredChats[idx];
                                  return ListTile(
                                    onTap: () => _openConversation(conv),
                                    contentPadding: const EdgeInsets.symmetric(vertical: 4),
                                    leading: CircleAvatar(
                                      radius: 26,
                                      backgroundColor: conv.user.ringColor,
                                      child: CircleAvatar(
                                        radius: 23,
                                        backgroundColor: _surface,
                                        child: Text(
                                          conv.user.name.isNotEmpty ? conv.user.name[0].toUpperCase() : 'P',
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ),
                                    title: Row(
                                      children: [
                                        Expanded(
                                          child: Text(
                                            conv.user.name,
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontWeight: FontWeight.w800,
                                            ),
                                          ),
                                        ),
                                        Text(
                                          conv.lastTime,
                                          style: const TextStyle(color: Colors.white54, fontSize: 11),
                                        ),
                                      ],
                                    ),
                                    subtitle: Padding(
                                      padding: const EdgeInsets.only(top: 4),
                                      child: Text(
                                        conv.lastMessage,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(color: Colors.white60, fontSize: 12),
                                      ),
                                    ),
                                    trailing: conv.unreadCount > 0
                                        ? Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                            decoration: const BoxDecoration(
                                              color: _neonPink,
                                              shape: BoxShape.circle,
                                            ),
                                            child: Text(
                                              '${conv.unreadCount}',
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontSize: 11,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          )
                                        : null,
                                  );
                                },
                              ))
                        : _tabIndex == 1
                            ? (filteredContacts.isEmpty
                                ? Center(
                                    child: Text(
                                      isUrdu ? 'کوئی رابطہ نہیں ملا' : 'No contacts match search',
                                      style: const TextStyle(color: Colors.white54),
                                    ),
                                  )
                                : ListView.builder(
                                    itemCount: filteredContacts.length,
                                    itemBuilder: (_, idx) {
                                      final u = filteredContacts[idx];
                                      return ListTile(
                                        leading: CircleAvatar(
                                          backgroundColor: u.ringColor,
                                          child: Text(
                                            u.name.isNotEmpty ? u.name[0].toUpperCase() : 'U',
                                            style: const TextStyle(color: Colors.white),
                                          ),
                                        ),
                                        title: Text(
                                          u.name,
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        subtitle: Text(
                                          '${u.lastSeen} • ID ${u.poppoId}',
                                          style: TextStyle(
                                            color: u.status == 'online'
                                                ? Colors.greenAccent
                                                : Colors.white54,
                                            fontSize: 12,
                                          ),
                                        ),
                                        trailing: ElevatedButton(
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: _neonPink,
                                            foregroundColor: Colors.white,
                                            shape: const StadiumBorder(),
                                          ),
                                          onPressed: () async {
                                            final existing = _conversations.where((c) => c.user.id == u.id).firstOrNull;
                                            if (existing != null) {
                                              _openConversation(existing);
                                            } else {
                                              try {
                                                final res = await InboxService.instance.startConversation(u.id);
                                                final convId = res['conversationId']?.toString() ?? 'conv_${u.id}';
                                                final newConv = InboxConversationModel(
                                                  id: convId,
                                                  user: u,
                                                  lastMessage: isUrdu ? 'سلام کہو!' : 'Say hello!',
                                                  lastTime: 'Now',
                                                  messages: [],
                                                );
                                                setState(() {
                                                  _conversations.insert(0, newConv);
                                                });
                                                _openConversation(newConv);
                                              } catch (_) {
                                                final localConv = InboxConversationModel(
                                                  id: 'conv_${u.id}',
                                                  user: u,
                                                  lastMessage: isUrdu ? 'سلام کہو!' : 'Say hello!',
                                                  lastTime: 'Now',
                                                  messages: [],
                                                );
                                                _openConversation(localConv);
                                              }
                                            }
                                          },
                                          child: Text(
                                            isUrdu ? 'میسج' : 'Message',
                                            style: const TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                      );
                                    },
                                  ))
                            : (_requests.isEmpty
                                ? Center(
                                    child: Text(
                                      isUrdu ? 'کوئی میسج درخواست نہیں ہے' : 'No message requests',
                                      style: const TextStyle(color: Colors.white54),
                                    ),
                                  )
                                : ListView.builder(
                                    itemCount: _requests.length,
                                    itemBuilder: (_, idx) {
                                      final r = _requests[idx];
                                      return Container(
                                        margin: const EdgeInsets.only(bottom: 10),
                                        padding: const EdgeInsets.all(14),
                                        decoration: BoxDecoration(
                                          color: _surface,
                                          borderRadius: BorderRadius.circular(18),
                                          border: Border.all(
                                            color: Colors.purpleAccent.withOpacity(0.25),
                                          ),
                                        ),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              children: [
                                                Text(
                                                  r.user.name,
                                                  style: const TextStyle(
                                                    color: Colors.white,
                                                    fontWeight: FontWeight.bold,
                                                    fontSize: 15,
                                                  ),
                                                ),
                                                const Spacer(),
                                                Text(
                                                  r.timeAgo,
                                                  style: const TextStyle(
                                                    color: Colors.white54,
                                                    fontSize: 11,
                                                  ),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 6),
                                            Text(
                                              r.preview,
                                              style: const TextStyle(
                                                color: Colors.white70,
                                                fontSize: 12,
                                              ),
                                            ),
                                            const SizedBox(height: 10),
                                            Row(
                                              children: [
                                                Expanded(
                                                  child: ElevatedButton(
                                                    style: ElevatedButton.styleFrom(
                                                      backgroundColor: _neonPink,
                                                      foregroundColor: Colors.white,
                                                      shape: const StadiumBorder(),
                                                    ),
                                                    onPressed: () => _acceptRequest(r),
                                                    child: Text(
                                                      isUrdu ? 'قبول کریں' : 'Accept',
                                                      style: const TextStyle(fontWeight: FontWeight.bold),
                                                    ),
                                                  ),
                                                ),
                                                const SizedBox(width: 8),
                                                Expanded(
                                                  child: OutlinedButton(
                                                    style: OutlinedButton.styleFrom(
                                                      foregroundColor: _gold,
                                                      side: const BorderSide(color: Colors.white24),
                                                      shape: const StadiumBorder(),
                                                    ),
                                                    onPressed: () => setState(
                                                        () => _requests.removeWhere((x) => x.id == r.id)),
                                                    child: Text(isUrdu ? 'حذف کریں' : 'Delete'),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      );
                                    },
                                  )),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTabPill(int idx, String label) {
    final active = _tabIndex == idx;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _tabIndex = idx),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: active ? _neonPink : _surface,
            borderRadius: BorderRadius.circular(24),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w800,
              fontSize: 12,
            ),
          ),
        ),
      ),
    );
  }
}

class _InboxChatDetailScreen extends StatefulWidget {
  final InboxConversationModel conversation;
  final ValueChanged<String> onSend;

  const _InboxChatDetailScreen({required this.conversation, required this.onSend});

  @override
  State<_InboxChatDetailScreen> createState() => _InboxChatDetailScreenState();
}

class _InboxChatDetailScreenState extends State<_InboxChatDetailScreen> {
  final TextEditingController _ctrl = TextEditingController();
  final ScrollController _scrollCtrl = ScrollController();
  bool _isSending = false;
  bool _isLoadingMessages = false;
  String? _chatError;
  List<InboxMessageModel> _messages = [];
  StreamSubscription? _chatSseSub;

  @override
  void initState() {
    super.initState();
    _messages = List.from(widget.conversation.messages);
    _loadMessages();
    _listenRealtimeMessages();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    _scrollCtrl.dispose();
    _chatSseSub?.cancel();
    super.dispose();
  }

  Future<void> _loadMessages() async {
    setState(() => _isLoadingMessages = true);
    try {
      final history = await InboxService.instance.fetchMessages(widget.conversation.id);
      if (mounted) {
        setState(() {
          _messages = history;
          _isLoadingMessages = false;
        });
        _scrollToBottom();
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isLoadingMessages = false);
      }
    }
  }

  void _listenRealtimeMessages() {
    _chatSseSub = InboxService.instance.onMessageEvent.listen((evt) {
      if (!mounted) return;
      if (evt.eventType == 'new_message' && evt.conversationId == widget.conversation.id) {
        final text = evt.payload['text']?.toString() ?? '';
        final msgId = evt.payload['messageId']?.toString() ?? DateTime.now().millisecondsSinceEpoch.toString();

        setState(() {
          _messages.add(
            InboxMessageModel(
              id: msgId,
              senderId: widget.conversation.user.id,
              text: text,
              time: 'Just now',
            ),
          );
        });
        _scrollToBottom();
      }
    });
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _submit() async {
    final txt = _ctrl.text.trim();
    if (txt.isEmpty || _isSending) return;

    setState(() {
      _isSending = true;
      _chatError = null;
    });

    try {
      final sent = await InboxService.instance.sendMessage(
        recipientId: widget.conversation.user.id,
        text: txt,
        conversationId: widget.conversation.id,
      );

      widget.onSend(txt);
      _ctrl.clear();

      if (mounted) {
        setState(() {
          _messages.add(sent);
          _isSending = false;
        });
        _scrollToBottom();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSending = false;
          _chatError = e.toString().replaceAll('Exception:', '').trim();
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isUrdu = PopoStrings.currentLanguage.value == 'ur';

    return Scaffold(
      backgroundColor: const Color(0xFF0C041C),
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        backgroundColor: const Color(0xFF170931),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Row(
          children: [
            CircleAvatar(
              radius: 18,
              backgroundColor: widget.conversation.user.ringColor,
              child: Text(
                widget.conversation.user.name.isNotEmpty
                    ? widget.conversation.user.name[0].toUpperCase()
                    : 'U',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.conversation.user.name,
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  Text(
                    widget.conversation.user.lastSeen,
                    style: TextStyle(
                      fontSize: 11,
                      color: widget.conversation.user.status == 'online'
                          ? Colors.greenAccent
                          : Colors.white54,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            if (_chatError != null)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                color: Colors.redAccent.withOpacity(0.2),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, color: Colors.redAccent, size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _chatError!,
                        style: const TextStyle(color: Colors.redAccent, fontSize: 11),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.redAccent, size: 14),
                      onPressed: () => setState(() => _chatError = null),
                    ),
                  ],
                ),
              ),
            Expanded(
              child: _isLoadingMessages
                  ? const Center(
                      child: CircularProgressIndicator(color: Color(0xFFFF1A6C)),
                    )
                  : _messages.isEmpty
                      ? Center(
                          child: Text(
                            isUrdu ? 'ابھی کوئی پیغام نہیں ہے' : 'No messages yet. Say hello!',
                            style: const TextStyle(color: Colors.white38, fontSize: 13),
                          ),
                        )
                      : ListView.builder(
                          controller: _scrollCtrl,
                          padding: const EdgeInsets.all(14),
                          itemCount: _messages.length,
                          itemBuilder: (_, idx) {
                            final m = _messages[idx];
                            final isMine = m.senderId == 'me';
                            return Align(
                              alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
                              child: Container(
                                margin: const EdgeInsets.only(bottom: 10),
                                constraints: BoxConstraints(
                                  maxWidth: MediaQuery.of(context).size.width * 0.75,
                                ),
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                decoration: BoxDecoration(
                                  color: isMine ? const Color(0xFFFF1A6C) : const Color(0xFF1D0F39),
                                  borderRadius: BorderRadius.only(
                                    topLeft: const Radius.circular(16),
                                    topRight: const Radius.circular(16),
                                    bottomLeft: isMine ? const Radius.circular(16) : Radius.zero,
                                    bottomRight: isMine ? Radius.zero : const Radius.circular(16),
                                  ),
                                ),
                                child: Column(
                                  crossAxisAlignment: isMine ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      m.text,
                                      style: const TextStyle(color: Colors.white, fontSize: 14),
                                    ),
                                    const SizedBox(height: 4),
                                    Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text(
                                          m.time,
                                          style: const TextStyle(color: Colors.white54, fontSize: 10),
                                        ),
                                        if (isMine) ...[
                                          const SizedBox(width: 4),
                                          const Icon(Icons.done_all_rounded, color: Colors.white70, size: 12),
                                        ],
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
            ),
            Container(
              color: const Color(0xFF170931),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _ctrl,
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                      decoration: InputDecoration(
                        hintText: isUrdu ? 'پیغام لکھیں...' : 'Write a message...',
                        hintStyle: const TextStyle(color: Colors.white38),
                        border: InputBorder.none,
                      ),
                      onSubmitted: (_) => _submit(),
                    ),
                  ),
                  _isSending
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Color(0xFFFF1A6C),
                          ),
                        )
                      : IconButton(
                          icon: const Icon(Icons.send_rounded, color: Color(0xFFFF1A6C)),
                          onPressed: _submit,
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
