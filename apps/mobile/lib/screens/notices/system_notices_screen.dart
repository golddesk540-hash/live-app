import 'package:flutter/material.dart';

import '../../l10n/strings.dart';
import '../../services/messaging/notices_service.dart';

/// Popo Live — Phase 8.2: System Notices
/// Connected to Next.js backend with live mark-as-read and categories
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
  bool _isLoading = false;
  String? _errorMessage;

  List<SystemNoticeModel> _notices = [];

  static const _categories = <Map<String, String>>[
    {'id': 'all', 'label': 'All Notices', 'labelUr': 'تمام نوٹس'},
    {'id': 'account', 'label': 'Account Updates', 'labelUr': 'اکاؤنٹ اپ ڈیٹس'},
    {'id': 'security_safety', 'label': 'Security & Safety', 'labelUr': 'تحفظ و سیکیورٹی'},
    {'id': 'platform', 'label': 'Platform Updates', 'labelUr': 'پلیٹ فارم اپ ڈیٹس'},
    {'id': 'feature', 'label': 'Feature Announcements', 'labelUr': 'نئے فیچرز'},
    {'id': 'wallet_gift', 'label': 'Wallet & Gift Updates', 'labelUr': 'والیٹ و گفٹس'},
    {'id': 'important', 'label': 'Important Notices', 'labelUr': 'اہم اعلانات'},
  ];

  @override
  void initState() {
    super.initState();
    _loadNotices();
  }

  Future<void> _loadNotices() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final fetched = await NoticesService.instance.fetchNotices(
        category: _selectedCategory,
        unreadOnly: _unreadOnly,
      );
      if (mounted) {
        setState(() {
          _notices = fetched;
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

  void _openNoticeDetail(SystemNoticeModel notice) async {
    setState(() => notice.isRead = true);
    NoticesService.instance.markNoticeRead(notice.id);

    await Navigator.of(context).push(
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

  Future<void> _markAllRead() async {
    setState(() {
      for (final n in _notices) {
        n.isRead = true;
      }
    });
    try {
      await NoticesService.instance.markAllNoticesRead();
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final isUrdu = PopoStrings.currentLanguage.value == 'ur';
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
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          isUrdu ? 'سسٹم نوٹس' : 'System Notices',
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800),
        ),
        actions: [
          IconButton(
            icon: Icon(_showSearch ? Icons.close : Icons.search, color: Colors.white70),
            onPressed: () => setState(() {
              _showSearch = !_showSearch;
              if (!_showSearch) _searchQuery = '';
            }),
          ),
          TextButton(
            onPressed: _markAllRead,
            child: Text(
              isUrdu ? 'سب پڑھیں' : 'Mark All Read',
              style: const TextStyle(color: _neonPink, fontWeight: FontWeight.bold, fontSize: 12),
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        color: _neonPink,
        backgroundColor: _cardBg,
        onRefresh: _loadNotices,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                isUrdu ? 'دفتری اعلانات' : 'Official Notices',
                style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: Colors.white),
              ),
              const SizedBox(height: 2),
              Text(
                isUrdu ? 'پلیٹ فارم کی اہم اپ ڈیٹس اور سیکیورٹی نوٹس' : 'Important platform updates & security alerts',
                style: const TextStyle(fontSize: 13, color: Colors.white60),
              ),
              const SizedBox(height: 12),
              if (_showSearch) ...[
                TextField(
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                  decoration: InputDecoration(
                    hintText: isUrdu ? 'نوٹس تلاش کریں...' : 'Search notices...',
                    hintStyle: const TextStyle(color: Colors.white38),
                    filled: true,
                    fillColor: _cardBg,
                    prefixIcon: const Icon(Icons.search, color: Colors.white54),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(28), borderSide: BorderSide.none),
                  ),
                  onChanged: (v) => setState(() => _searchQuery = v),
                ),
                const SizedBox(height: 10),
              ],
              SizedBox(
                height: 38,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: _categories.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (_, idx) {
                    final cat = _categories[idx];
                    final active = _selectedCategory == cat['id'];
                    final label = isUrdu ? (cat['labelUr'] ?? cat['label']!) : cat['label']!;
                    return ChoiceChip(
                      label: Text(label, style: TextStyle(color: active ? Colors.white : Colors.white70, fontSize: 12, fontWeight: active ? FontWeight.bold : FontWeight.normal)),
                      selected: active,
                      selectedColor: _neonPink,
                      backgroundColor: _cardBg,
                      side: BorderSide.none,
                      shape: const StadiumBorder(),
                      onSelected: (_) {
                        setState(() => _selectedCategory = cat['id']!);
                        _loadNotices();
                      },
                    );
                  },
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Checkbox(
                    value: _unreadOnly,
                    activeColor: _neonPink,
                    onChanged: (val) {
                      setState(() => _unreadOnly = val ?? false);
                      _loadNotices();
                    },
                  ),
                  Text(isUrdu ? 'صرف نہ پڑھے گئے' : 'Unread only', style: const TextStyle(color: Colors.white70, fontSize: 13)),
                  const Spacer(),
                  Text(
                    '${filtered.length} ${isUrdu ? 'نوٹس' : 'Notices'}',
                    style: const TextStyle(color: Colors.white38, fontSize: 12),
                  ),
                ],
              ),
              if (_errorMessage != null)
                Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.redAccent.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: Colors.redAccent, size: 16),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(_errorMessage!, style: const TextStyle(color: Colors.redAccent, fontSize: 11)),
                      ),
                      TextButton(
                        onPressed: _loadNotices,
                        child: Text(isUrdu ? 'دوبارہ کوشش' : 'Retry', style: const TextStyle(color: Colors.white, fontSize: 11)),
                      ),
                    ],
                  ),
                ),
              Expanded(
                child: _isLoading && _notices.isEmpty
                    ? const Center(child: CircularProgressIndicator(color: _neonPink))
                    : filtered.isEmpty
                        ? Center(
                            child: Text(
                              isUrdu ? 'کوئی نوٹس دستیاب نہیں ہیں' : 'No notices match your selection',
                              style: const TextStyle(color: Colors.white54),
                            ),
                          )
                        : ListView.separated(
                            itemCount: filtered.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (_, idx) {
                              final n = filtered[idx];
                              return GestureDetector(
                                onTap: () => _openNoticeDetail(n),
                                child: Container(
                                  padding: const EdgeInsets.all(14),
                                  decoration: BoxDecoration(
                                    color: _cardBg,
                                    borderRadius: BorderRadius.circular(18),
                                    border: Border.all(
                                      color: n.isImportant
                                          ? _gold.withOpacity(0.4)
                                          : (n.isRead ? Colors.white10 : _neonPink.withOpacity(0.35)),
                                      width: n.isRead ? 1 : 1.5,
                                    ),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                            decoration: BoxDecoration(
                                              color: n.isImportant
                                                  ? _gold.withOpacity(0.2)
                                                  : _neonPink.withOpacity(0.15),
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                            child: Text(
                                              n.badgeLabel,
                                              style: TextStyle(
                                                color: n.isImportant ? _gold : _neonPink,
                                                fontSize: 10,
                                                fontWeight: FontWeight.w900,
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            n.referenceCode,
                                            style: const TextStyle(color: Colors.white38, fontSize: 10, fontFamily: 'monospace'),
                                          ),
                                          const Spacer(),
                                          Text(
                                            n.displayTimestamp,
                                            style: const TextStyle(color: Colors.white54, fontSize: 11),
                                          ),
                                          if (!n.isRead) ...[
                                            const SizedBox(width: 6),
                                            Container(
                                              width: 7,
                                              height: 7,
                                              decoration: const BoxDecoration(
                                                color: _neonPink,
                                                shape: BoxShape.circle,
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        n.title,
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 15,
                                          fontWeight: n.isRead ? FontWeight.w600 : FontWeight.w800,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        n.shortDesc,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(color: Colors.white60, fontSize: 12),
                                      ),
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
        backgroundColor: const Color(0xFF140728),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          notice.referenceCode,
          style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(18),
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: notice.isImportant ? const Color(0xFFFBBF24).withOpacity(0.2) : const Color(0xFFFF1A6C).withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  notice.badgeLabel,
                  style: TextStyle(
                    color: notice.isImportant ? const Color(0xFFFBBF24) : const Color(0xFFFF1A6C),
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const Spacer(),
              Text(
                '${notice.pubDate} • ${notice.pubTime}',
                style: const TextStyle(color: Colors.white54, fontSize: 12),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            notice.title,
            style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 12),
          const Divider(color: Colors.white12),
          const SizedBox(height: 12),
          Text(
            notice.fullMessage,
            style: const TextStyle(color: Colors.white70, fontSize: 14, height: 1.5),
          ),
        ],
      ),
    );
  }
}
