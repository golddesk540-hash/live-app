import 'package:flutter/material.dart';

/// Popo Live — Phase 8.1: Inbox Frontend (Chats, Contacts, Requests, 1:1 Chat)
/// Frontend-only local state implementation aligned with 08_01_inbox.png.
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

  late List<InboxConversationModel> _conversations;
  late List<InboxUserModel> _contacts;
  late List<InboxRequestModel> _requests;

  @override
  void initState() {
    super.initState();
    _initMockData();
  }

  void _initMockData() {
    const ayesha = InboxUserModel(
      id: 'u1',
      name: 'Ayesha Khan',
      poppoId: '10489210',
      status: 'online',
      lastSeen: 'Online now',
      ringColor: Color(0xFFFF1A6C),
    );
    const hamza = InboxUserModel(
      id: 'u2',
      name: 'Hamza Ali',
      poppoId: '20834119',
      status: 'live',
      lastSeen: 'In Live Room',
      ringColor: Color(0xFF3B82F6),
    );
    const sara = InboxUserModel(
      id: 'u3',
      name: 'Sara Noor',
      poppoId: '33910284',
      status: 'online',
      lastSeen: 'Active 4m ago',
      ringColor: Color(0xFF9333EA),
    );
    const popoTeam = InboxUserModel(
      id: 'u4',
      name: 'Popo Live Team',
      poppoId: '10000001',
      status: 'online',
      lastSeen: 'Official Support',
      ringColor: Color(0xFFFBBF24),
      isOfficial: true,
    );
    const mina = InboxUserModel(
      id: 'u5',
      name: 'Mina Official',
      poppoId: '44981203',
      status: 'offline',
      lastSeen: 'Last seen yesterday',
      ringColor: Color(0xFF10B981),
    );

    _conversations = [
      InboxConversationModel(
        id: 'c1',
        user: ayesha,
        lastMessage: 'Hey! Are you live tonight?',
        lastTime: '2m',
        unreadCount: 2,
        messages: const [
          InboxMessageModel(id: 'm1', senderId: 'u1', text: 'Hey! Are you live tonight?', time: '21:14'),
        ],
      ),
      InboxConversationModel(
        id: 'c2',
        user: hamza,
        lastMessage: 'Thanks for the gift ♥',
        lastTime: '18m',
        unreadCount: 0,
        messages: const [
          InboxMessageModel(id: 'm2', senderId: 'u2', text: 'Thanks for the gift ♥', time: '20:56'),
        ],
      ),
      InboxConversationModel(
        id: 'c3',
        user: sara,
        lastMessage: 'Sent you a photo',
        lastTime: '1h',
        unreadCount: 1,
        messages: const [
          InboxMessageModel(id: 'm3', senderId: 'u3', text: 'Sent you a photo', time: '19:46'),
        ],
      ),
      InboxConversationModel(
        id: 'c4',
        user: popoTeam,
        lastMessage: 'Welcome to Popo Live!',
        lastTime: '3h',
        unreadCount: 0,
        messages: const [
          InboxMessageModel(id: 'm4', senderId: 'u4', text: 'Welcome to Popo Live!', time: '18:05'),
        ],
      ),
      InboxConversationModel(
        id: 'c5',
        user: mina,
        lastMessage: "Let's join the party room",
        lastTime: 'Yesterday',
        unreadCount: 0,
        messages: const [
          InboxMessageModel(id: 'm5', senderId: 'u5', text: "Let's join the party room", time: 'Yesterday'),
        ],
      ),
    ];

    _contacts = [ayesha, hamza, sara, popoTeam, mina];
    _requests = [
      const InboxRequestModel(
        id: 'r1',
        user: InboxUserModel(
          id: 'ur1',
          name: 'Tariq Beats',
          poppoId: '77412093',
          status: 'online',
          lastSeen: 'Online now',
          ringColor: Color(0xFF9333EA),
        ),
        preview: 'Hi! Would love to team up for this weekend PK tournament.',
        timeAgo: '12m ago',
      ),
      const InboxRequestModel(
        id: 'r2',
        user: InboxUserModel(
          id: 'ur2',
          name: 'Nadia Grace',
          poppoId: '88201944',
          status: 'live',
          lastSeen: 'Live now',
          ringColor: Color(0xFFFF1A6C),
        ),
        preview: 'Loved your Square clip, mind if we connect?',
        timeAgo: '48m ago',
      ),
    ];
  }

  void _openConversation(InboxConversationModel conv) {
    setState(() {
      conv.unreadCount = 0;
    });
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => _InboxChatDetailScreen(
          conversation: conv,
          onSend: (txt) {
            setState(() {
              conv.messages.add(
                InboxMessageModel(
                  id: DateTime.now().millisecondsSinceEpoch.toString(),
                  senderId: 'me',
                  text: txt,
                  time: 'Just now',
                ),
              );
              conv.lastMessage = txt;
              conv.lastTime = 'Now';
            });
          },
        ),
      ),
    );
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
    final q = _searchQuery.trim().toLowerCase();
    final filteredChats = _conversations
        .where((c) => q.isEmpty || c.user.name.toLowerCase().contains(q) || c.lastMessage.toLowerCase().contains(q))
        .toList();
    final filteredContacts = _contacts
        .where((u) => q.isEmpty || u.name.toLowerCase().contains(q) || u.poppoId.contains(q))
        .toList();

    return Scaffold(
      backgroundColor: _bgDeep,
      appBar: AppBar(
        backgroundColor: _bgDeep,
        elevation: 0,
        title: const Row(
          children: [
            Icon(Icons.radio_button_checked, color: Colors.white, size: 20),
            SizedBox(width: 8),
            Text('Popo Live', style: TextStyle(fontWeight: FontWeight.w800, color: Colors.white)),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(_showSearch ? Icons.close : Icons.search, color: Colors.white70),
            onPressed: () => setState(() {
              _showSearch = !_showSearch;
              if (!_showSearch) _searchQuery = '';
            }),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Inbox', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Colors.white)),
            const SizedBox(height: 2),
            const Text('Your chats and messages', style: TextStyle(fontSize: 13, color: Colors.white60)),
            const SizedBox(height: 16),
            if (_showSearch) ...[
              TextField(
                style: const TextStyle(color: Colors.white, fontSize: 14),
                decoration: InputDecoration(
                  hintText: 'Search chats or contacts...',
                  hintStyle: const TextStyle(color: Colors.white38),
                  filled: true,
                  fillColor: _surface,
                  prefixIcon: const Icon(Icons.search, color: Colors.white54),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(28), borderSide: BorderSide.none),
                ),
                onChanged: (v) => setState(() => _searchQuery = v),
              ),
              const SizedBox(height: 12),
            ],
            Row(
              children: [
                _buildTabPill(0, 'Chats'),
                const SizedBox(width: 8),
                _buildTabPill(1, 'Contacts'),
                const SizedBox(width: 8),
                _buildTabPill(2, 'Requests${_requests.isNotEmpty ? ' (${_requests.length})' : ''}'),
              ],
            ),
            const SizedBox(height: 14),
            Expanded(
              child: _tabIndex == 0
                  ? (filteredChats.isEmpty
                      ? const Center(child: Text('No conversations found', style: TextStyle(color: Colors.white54)))
                      : ListView.separated(
                          itemCount: filteredChats.length,
                          separatorBuilder: (_, __) => const Divider(color: Colors.white12),
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
                                  child: Text(conv.user.name[0], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                                ),
                              ),
                              title: Row(
                                children: [
                                  Expanded(
                                    child: Text(conv.user.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
                                  ),
                                  Text(conv.lastTime, style: const TextStyle(color: Colors.white54, fontSize: 11)),
                                ],
                              ),
                              subtitle: Padding(
                                padding: const EdgeInsets.only(top: 4),
                                child: Text(conv.lastMessage, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white60, fontSize: 12)),
                              ),
                              trailing: conv.unreadCount > 0
                                  ? Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                      decoration: const BoxDecoration(color: _neonPink, shape: BoxShape.circle),
                                      child: Text('${conv.unreadCount}', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                                    )
                                  : null,
                            );
                          },
                        ))
                  : _tabIndex == 1
                      ? (filteredContacts.isEmpty
                          ? const Center(child: Text('No contacts match search', style: TextStyle(color: Colors.white54)))
                          : ListView.builder(
                              itemCount: filteredContacts.length,
                              itemBuilder: (_, idx) {
                                final u = filteredContacts[idx];
                                return ListTile(
                                  leading: CircleAvatar(backgroundColor: u.ringColor, child: Text(u.name[0], style: const TextStyle(color: Colors.white))),
                                  title: Text(u.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                                  subtitle: Text('${u.lastSeen} • ID ${u.poppoId}', style: TextStyle(color: u.status == 'online' ? Colors.greenAccent : Colors.white54, fontSize: 12)),
                                  trailing: ElevatedButton(
                                    style: ElevatedButton.styleFrom(backgroundColor: _neonPink, foregroundColor: Colors.white, shape: const StadiumBorder()),
                                    onPressed: () {
                                      final existing = _conversations.firstWhere(
                                        (c) => c.user.id == u.id,
                                        orElse: () {
                                          final nc = InboxConversationModel(id: 'c_${u.id}', user: u, lastMessage: 'Say hello!', lastTime: 'Now', messages: []);
                                          _conversations.insert(0, nc);
                                          return nc;
                                        },
                                      );
                                      _openConversation(existing);
                                    },
                                    child: const Text('Message', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                  ),
                                );
                              },
                            ))
                      : (_requests.isEmpty
                          ? const Center(child: Text('No message requests', style: TextStyle(color: Colors.white54)))
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
                                    border: Border.all(color: Colors.purpleAccent.withOpacity(0.25)),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Text(r.user.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                                          const Spacer(),
                                          Text(r.timeAgo, style: const TextStyle(color: Colors.white54, fontSize: 11)),
                                        ],
                                      ),
                                      const SizedBox(height: 6),
                                      Text(r.preview, style: const TextStyle(color: Colors.white70, fontSize: 12)),
                                      const SizedBox(height: 10),
                                      Row(
                                        children: [
                                          Expanded(
                                            child: ElevatedButton(
                                              style: ElevatedButton.styleFrom(backgroundColor: _neonPink, foregroundColor: Colors.white, shape: const StadiumBorder()),
                                              onPressed: () => _acceptRequest(r),
                                              child: const Text('Accept', style: TextStyle(fontWeight: FontWeight.bold)),
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: OutlinedButton(
                                              style: OutlinedButton.styleFrom(foregroundColor: _gold, side: const BorderSide(color: Colors.white24), shape: const StadiumBorder()),
                                              onPressed: () => setState(() => _requests.removeWhere((x) => x.id == r.id)),
                                              child: const Text('Delete'),
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
          child: Text(label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 12)),
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

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _submit() {
    final txt = _ctrl.text.trim();
    if (txt.isEmpty) return;
    widget.onSend(txt);
    _ctrl.clear();
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0C041C),
      appBar: AppBar(
        backgroundColor: const Color(0xFF170931),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.conversation.user.name, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white)),
            Text(widget.conversation.user.lastSeen, style: const TextStyle(fontSize: 11, color: Colors.greenAccent)),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(14),
              itemCount: widget.conversation.messages.length,
              itemBuilder: (_, idx) {
                final m = widget.conversation.messages[idx];
                final isMine = m.senderId == 'me';
                return Align(
                  alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: isMine ? const Color(0xFFFF1A6C) : const Color(0xFF1D0F39),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(m.text, style: const TextStyle(color: Colors.white, fontSize: 13)),
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
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(hintText: 'Write a message...', hintStyle: TextStyle(color: Colors.white38), border: InputBorder.none),
                    onSubmitted: (_) => _submit(),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.send, color: Color(0xFFFF1A6C)),
                  onPressed: _submit,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
