import 'package:flutter/material.dart';

/// Popo Live — Phase 8.2: System Notices Frontend
/// Frontend-only local state aligned with 08_02_system_notices.png.
class SystemNoticeModel {
  final String id;
  final String referenceCode;
  final String category; // account | security_safety | platform | feature | wallet_gift | important
  final String badgeLabel;
  final String title;
  final String shortDesc;
  final String fullMessage;
  final String pubDate;
  final String pubTime;
  final String displayTimestamp;
  final bool isImportant;
  bool isRead;

  SystemNoticeModel({
    required this.id,
    required this.referenceCode,
    required this.category,
    required this.badgeLabel,
    required this.title,
    required this.shortDesc,
    required this.fullMessage,
    required this.pubDate,
    required this.pubTime,
    required this.displayTimestamp,
    this.isImportant = false,
    this.isRead = false,
  });
}

class SystemNoticesScreen extends StatefulWidget {
  const SystemNoticesScreen({super.key});

  @override
  State<SystemNoticesScreen> createState() => _SystemNoticesScreenState();
}

class _SystemNoticesScreenState extends State<SystemNoticesScreen> {
  static const _bgDeep = Color(0xFF0C041C);
  static const _cardBg = Color(0xFF180A33);
  static const _neonPink = Color(0xFFFF1A6C);
  static const _gold = Color(0xFFFBBF24);

  String _selectedCategory = 'all';
  bool _unreadOnly = false;
  bool _showSearch = false;
  String _searchQuery = '';

  late List<SystemNoticeModel> _notices;

  static const _categories = <Map<String, String>>[
    {'id': 'all', 'label': 'All Notices'},
    {'id': 'account', 'label': 'Account Updates'},
    {'id': 'security_safety', 'label': 'Security & Safety'},
    {'id': 'platform', 'label': 'Platform Updates'},
    {'id': 'feature', 'label': 'Feature Announcements'},
    {'id': 'wallet_gift', 'label': 'Wallet & Gift Updates'},
    {'id': 'important', 'label': 'Important Notices'},
  ];

  @override
  void initState() {
    super.initState();
    _initSampleNotices();
  }

  void _initSampleNotices() {
    _notices = [
      SystemNoticeModel(
        id: 'n1',
        referenceCode: 'SYS-2026-8104',
        category: 'account',
        badgeLabel: 'ACCOUNT',
        title: 'Your profile is ready',
        shortDesc: 'Your profile information has been updated. Add a photo and bio so people can find you.',
        fullMessage:
            'Your Popo Live profile information has been synced across web and mobile discovery. Add a profile picture and short bio to help friends discover you faster.',
        pubDate: 'Nov 12, 2026',
        pubTime: '09:30 AM',
        displayTimestamp: 'Today · 09:30',
      ),
      SystemNoticeModel(
        id: 'n2',
        referenceCode: 'SEC-2026-4491',
        category: 'security_safety',
        badgeLabel: 'SECURITY',
        title: 'A new login was detected',
        shortDesc: 'Review your active sessions if you did not sign in on Web Browser recently.',
        fullMessage:
            'A new sign-in was detected on Popo Live Web. If this looks unfamiliar, inspect Active Sessions and update your security credentials.',
        pubDate: 'Nov 12, 2026',
        pubTime: '08:15 AM',
        displayTimestamp: 'Today · 08:15',
        isImportant: true,
      ),
      SystemNoticeModel(
        id: 'n3',
        referenceCode: 'IMP-2026-0092',
        category: 'important',
        badgeLabel: 'IMPORTANT',
        title: 'Official Account & Recharge Protection',
        shortDesc: 'Only recharge Coins and activate VIP perks inside official Popo Live screens.',
        fullMessage:
            'Popo Live never asks for verification codes or external payment transfers via private chat. Official purchases issue PL-RCP receipts inside Finance Center.',
        pubDate: 'Nov 12, 2026',
        pubTime: '07:00 AM',
        displayTimestamp: 'Today · 07:00',
        isImportant: true,
      ),
      SystemNoticeModel(
        id: 'n4',
        referenceCode: 'SAF-2026-3910',
        category: 'security_safety',
        badgeLabel: 'SAFETY',
        title: 'Community reminder',
        shortDesc: 'Keep chats respectful. Report content that breaks the rules.',
        fullMessage:
            'Please follow Popo Live Community Guidelines in live rooms and Inbox chats. Use Report tools whenever you spot spam or harassment.',
        pubDate: 'Nov 11, 2026',
        pubTime: '06:40 PM',
        displayTimestamp: 'Yesterday',
        isRead: true,
      ),
      SystemNoticeModel(
        id: 'n5',
        referenceCode: 'FEA-2026-7120',
        category: 'feature',
        badgeLabel: 'FEATURE',
        title: 'Square is here',
        shortDesc: 'Explore the new Square section! Share a post and see what the community is doing.',
        fullMessage:
            'Explore the upcoming Square experience to stay connected with creators between live broadcasts.',
        pubDate: 'Nov 11, 2026',
        pubTime: '03:15 PM',
        displayTimestamp: 'Yesterday',
      ),
      SystemNoticeModel(
        id: 'n6',
        referenceCode: 'WAL-2026-6043',
        category: 'wallet_gift',
        badgeLabel: 'WALLET',
        title: 'Gift points updated',
        shortDesc: 'Your latest gift activity and non-cash Host Points balance are ready to view.',
        fullMessage:
            'Your gift activity has been updated in your wallet ledger, keeping Coins separate from non-cash Host Points (70% creator share).',
        pubDate: 'Nov 10, 2026',
        pubTime: '05:22 PM',
        displayTimestamp: 'Nov 10',
        isRead: true,
      ),
      SystemNoticeModel(
        id: 'n7',
        referenceCode: 'PLT-2026-5081',
        category: 'platform',
        badgeLabel: 'PLATFORM',
        title: 'New features are available on Popo Live',
        shortDesc: 'Updated dark-purple Inbox lounge and improved live party controls.',
        fullMessage:
            'Enjoy faster room navigation, dark purple Phase 8 UI refresh, and structured Inbox + System Notices management.',
        pubDate: 'Nov 09, 2026',
        pubTime: '11:00 AM',
        displayTimestamp: 'Nov 9',
        isRead: true,
      ),
    ];
  }

  void _openNoticeDetail(SystemNoticeModel notice) {
    setState(() => notice.isRead = true);
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => _NoticeDetailPage(
          notice: notice,
          onToggleUnread: () {
            setState(() => notice.isRead = !notice.isRead);
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final q = _searchQuery.trim().toLowerCase();
    final filtered = _notices.where((n) {
      if (_selectedCategory != 'all' && n.category != _selectedCategory) return false;
      if (_unreadOnly && n.isRead) return false;
      if (q.isEmpty) return true;
      return n.title.toLowerCase().contains(q) || n.shortDesc.toLowerCase().contains(q);
    }).toList();

    return Scaffold(
      backgroundColor: _bgDeep,
      appBar: AppBar(
        backgroundColor: _bgDeep,
        elevation: 0,
        title: const Text('Popo Live', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
        actions: [
          IconButton(
            icon: Icon(_showSearch ? Icons.close : Icons.search, color: Colors.white70),
            onPressed: () => setState(() {
              _showSearch = !_showSearch;
              if (!_showSearch) _searchQuery = '';
            }),
          ),
          TextButton(
            onPressed: () => setState(() {
              for (final n in _notices) {
                n.isRead = true;
              }
            }),
            child: const Text('Mark All Read', style: TextStyle(color: _neonPink, fontWeight: FontWeight.bold, fontSize: 12)),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('System Notices', style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w900)),
            const SizedBox(height: 2),
            const Text('Updates from Popo Live', style: TextStyle(color: Colors.white60, fontSize: 13)),
            const SizedBox(height: 12),
            if (_showSearch) ...[
              TextField(
                style: const TextStyle(color: Colors.white, fontSize: 14),
                decoration: InputDecoration(
                  hintText: 'Search notices...',
                  hintStyle: const TextStyle(color: Colors.white38),
                  filled: true,
                  fillColor: _cardBg,
                  prefixIcon: const Icon(Icons.search, color: Colors.white54),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                ),
                onChanged: (v) => setState(() => _searchQuery = v),
              ),
              const SizedBox(height: 10),
            ],
            SizedBox(
              height: 36,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _categories.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (_, idx) {
                  final cat = _categories[idx];
                  final active = _selectedCategory == cat['id'];
                  return ChoiceChip(
                    label: Text(cat['label']!, style: TextStyle(color: active ? Colors.white : Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
                    selected: active,
                    selectedColor: cat['id'] == 'important' ? _gold : _neonPink,
                    backgroundColor: _cardBg,
                    onSelected: (_) => setState(() => _selectedCategory = cat['id']!),
                  );
                },
              ),
            ),
            const SizedBox(height: 8),
            FilterChip(
              label: const Text('Unread Only', style: TextStyle(color: Colors.white, fontSize: 12)),
              selected: _unreadOnly,
              selectedColor: _neonPink,
              backgroundColor: _cardBg,
              onSelected: (v) => setState(() => _unreadOnly = v),
            ),
            const SizedBox(height: 10),
            Expanded(
              child: filtered.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.notifications_off_outlined, color: _neonPink, size: 42),
                          const SizedBox(height: 10),
                          Text(
                            _unreadOnly
                                ? 'No unread notices'
                                : q.isNotEmpty
                                    ? 'No search results'
                                    : 'No notices in selected category',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      itemCount: filtered.length,
                      itemBuilder: (_, idx) {
                        final n = filtered[idx];
                        return GestureDetector(
                          onTap: () => _openNoticeDetail(n),
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: _cardBg,
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(
                                color: n.isImportant ? _gold.withOpacity(0.55) : Colors.purpleAccent.withOpacity(0.25),
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(color: const Color(0xFF2B184F), borderRadius: BorderRadius.circular(14)),
                                      child: Text(n.badgeLabel, style: TextStyle(color: n.isImportant ? _gold : _neonPink, fontSize: 10, fontWeight: FontWeight.w800)),
                                    ),
                                    const Spacer(),
                                    if (!n.isRead)
                                      Container(width: 9, height: 9, decoration: const BoxDecoration(color: _neonPink, shape: BoxShape.circle)),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                Text(n.title, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w800)),
                                const SizedBox(height: 6),
                                Text(n.shortDesc, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white70, fontSize: 12)),
                                const SizedBox(height: 10),
                                Text(n.displayTimestamp, style: const TextStyle(color: Colors.white54, fontSize: 11)),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NoticeDetailPage extends StatelessWidget {
  final SystemNoticeModel notice;
  final VoidCallback onToggleUnread;

  const _NoticeDetailPage({required this.notice, required this.onToggleUnread});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0C041C),
      appBar: AppBar(
        backgroundColor: const Color(0xFF180A33),
        title: const Text('Popo Live Official', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
        actions: [
          TextButton(
            onPressed: () {
              onToggleUnread();
              Navigator.of(context).pop();
            },
            child: const Text('Mark Unread', style: TextStyle(color: Color(0xFFFF1A6C), fontSize: 12)),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(notice.badgeLabel, style: const TextStyle(color: Color(0xFFFF1A6C), fontWeight: FontWeight.bold, fontSize: 12)),
            const SizedBox(height: 8),
            Text(notice.title, style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900)),
            const SizedBox(height: 8),
            Text('${notice.pubDate} • ${notice.pubTime} • ${notice.referenceCode}', style: const TextStyle(color: Colors.white54, fontSize: 12)),
            const SizedBox(height: 18),
            Text(notice.fullMessage, style: const TextStyle(color: Colors.white70, fontSize: 14, height: 1.6)),
          ],
        ),
      ),
    );
  }
}
