import 'package:flutter/material.dart';

import '../../l10n/strings.dart';
import '../../services/messaging/notifications_service.dart';

/// Popo Live — Phase 8.7: Notifications Screen
/// Connected to Next.js backend with live mark-as-read and category filters
class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  static const _bgDeep = Color(0xFF0E051E);
  static const _appBarBg = Color(0xFF120624);
  static const _cardBg = Color(0xFF180A33);
  static const _neonPink = Color(0xFFFF1A6C);

  String _selectedCategory = 'All';
  bool _unreadOnly = false;
  bool _isLoading = false;
  String? _errorMessage;

  final Set<String> _followedBack = <String>{};

  final List<String> _categories = const [
    'All',
    'Likes',
    'Comments',
    'Followers',
    'Mentions',
    'Fan Club',
    'Invites',
    'Live Activity',
  ];

  List<PopoNotificationItem> _items = [];

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final fetched = await NotificationsService.instance.fetchNotifications(
        category: _selectedCategory,
        unreadOnly: _unreadOnly,
      );
      if (mounted) {
        setState(() {
          _items = fetched;
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

  Future<void> _markAllRead() async {
    setState(() {
      _items = _items.map((i) => PopoNotificationItem(
        id: i.id,
        user: i.user,
        category: i.category,
        text: i.text,
        time: i.time,
        unread: false,
        ring: i.ring,
        entityType: i.entityType,
        entityId: i.entityId,
      )).toList();
    });

    try {
      await NotificationsService.instance.markAllNotificationsRead();
    } catch (_) {}
  }

  void _onNotificationTap(PopoNotificationItem item) async {
    if (item.unread) {
      NotificationsService.instance.markNotificationRead(item.id);
      setState(() {
        final idx = _items.indexWhere((x) => x.id == item.id);
        if (idx != -1) {
          _items[idx] = PopoNotificationItem(
            id: item.id,
            user: item.user,
            category: item.category,
            text: item.text,
            time: item.time,
            unread: false,
            ring: item.ring,
            entityType: item.entityType,
            entityId: item.entityId,
          );
        }
      });
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${item.user}: ${item.text}'),
        backgroundColor: const Color(0xFF1E0E3D),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isUrdu = PopoStrings.currentLanguage.value == 'ur';
    final visible = _items.where((item) {
      if (_selectedCategory != 'All' && item.category != _selectedCategory) {
        return false;
      }
      if (_unreadOnly && !item.unread) return false;
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: _bgDeep,
      appBar: AppBar(
        backgroundColor: _appBarBg,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          isUrdu ? 'اطلاعات' : 'Notifications',
          style: const TextStyle(fontWeight: FontWeight.w800, color: Colors.white),
        ),
        actions: [
          TextButton(
            onPressed: _markAllRead,
            child: Text(
              isUrdu ? 'سب پڑھیں' : 'Mark All Read',
              style: const TextStyle(color: Color(0xFFFF4D8D), fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        color: _neonPink,
        backgroundColor: _cardBg,
        onRefresh: _loadNotifications,
        child: Column(
          children: [
            SizedBox(
              height: 46,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                scrollDirection: Axis.horizontal,
                itemCount: _categories.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  final cat = _categories[index];
                  final isSelected = _selectedCategory == cat;
                  return ChoiceChip(
                    label: Text(
                      cat,
                      style: TextStyle(
                        color: isSelected ? Colors.white : Colors.white70,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        fontSize: 12,
                      ),
                    ),
                    selected: isSelected,
                    selectedColor: _neonPink,
                    backgroundColor: _cardBg,
                    side: BorderSide.none,
                    shape: const StadiumBorder(),
                    onSelected: (_) {
                      setState(() => _selectedCategory = cat);
                      _loadNotifications();
                    },
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Checkbox(
                    value: _unreadOnly,
                    activeColor: _neonPink,
                    onChanged: (val) {
                      setState(() => _unreadOnly = val ?? false);
                      _loadNotifications();
                    },
                  ),
                  Text(
                    isUrdu ? 'صرف نہ پڑھی گئی اطلاعات' : 'Unread only',
                    style: const TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                  const Spacer(),
                  Text(
                    '${visible.length} ${isUrdu ? 'اطلاعات' : 'alerts'}',
                    style: const TextStyle(color: Colors.white38, fontSize: 12),
                  ),
                ],
              ),
            ),
            if (_errorMessage != null)
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
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
                      onPressed: _loadNotifications,
                      child: Text(isUrdu ? 'دوبارہ' : 'Retry', style: const TextStyle(color: Colors.white, fontSize: 11)),
                    ),
                  ],
                ),
              ),
            Expanded(
              child: _isLoading && _items.isEmpty
                  ? const Center(child: CircularProgressIndicator(color: _neonPink))
                  : visible.isEmpty
                      ? Center(
                          child: Text(
                            isUrdu ? 'کوئی نئی اطلاع نہیں ہے' : 'No notifications found',
                            style: const TextStyle(color: Colors.white54),
                          ),
                        )
                      : ListView.separated(
                          itemCount: visible.length,
                          separatorBuilder: (_, __) => const Divider(color: Colors.white10, height: 1),
                          itemBuilder: (context, index) {
                            final item = visible[index];
                            final isFollowBack = _followedBack.contains(item.user);
                            return ListTile(
                              onTap: () => _onNotificationTap(item),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                              leading: CircleAvatar(
                                radius: 22,
                                backgroundColor: item.ring,
                                child: CircleAvatar(
                                  radius: 19,
                                  backgroundColor: const Color(0xFF1E0E38),
                                  child: Text(
                                    item.user.isNotEmpty ? item.user[0].toUpperCase() : 'U',
                                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ),
                              title: RichText(
                                text: TextSpan(
                                  style: const TextStyle(color: Colors.white, fontSize: 14),
                                  children: [
                                    TextSpan(
                                      text: '${item.user} ',
                                      style: const TextStyle(fontWeight: FontWeight.bold),
                                    ),
                                    TextSpan(
                                      text: item.text,
                                      style: TextStyle(
                                        color: item.unread ? Colors.white : Colors.white70,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              subtitle: Padding(
                                padding: const EdgeInsets.only(top: 4),
                                child: Text(
                                  '${item.category} • ${item.time}',
                                  style: const TextStyle(color: Colors.white54, fontSize: 11),
                                ),
                              ),
                              trailing: item.category == 'Followers'
                                  ? OutlinedButton(
                                      style: OutlinedButton.styleFrom(
                                        foregroundColor: isFollowBack ? Colors.white70 : const Color(0xFFFF4D8D),
                                        side: BorderSide(
                                          color: isFollowBack ? Colors.white24 : const Color(0xFFFF4D8D),
                                        ),
                                        shape: const StadiumBorder(),
                                        padding: const EdgeInsets.symmetric(horizontal: 12),
                                      ),
                                      onPressed: () {
                                        setState(() {
                                          if (isFollowBack) {
                                            _followedBack.remove(item.user);
                                          } else {
                                            _followedBack.add(item.user);
                                          }
                                        });
                                      },
                                      child: Text(
                                        isFollowBack ? (isUrdu ? 'فالو کر رہے ہیں' : 'Following') : (isUrdu ? 'فالو بیک' : 'Follow Back'),
                                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                                      ),
                                    )
                                  : (item.unread
                                      ? Container(
                                          width: 8,
                                          height: 8,
                                          decoration: const BoxDecoration(
                                            color: Color(0xFFFF4D8D),
                                            shape: BoxShape.circle,
                                          ),
                                        )
                                      : null),
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
