import 'package:flutter/material.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  String _selectedCategory = 'All';
  bool _unreadOnly = false;
  final Set<String> _followedBack = <String>{'Tariq Mehmood'};

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

  final List<Map<String, dynamic>> _items = [
    {
      'id': 'notif_1',
      'user': 'Ayesha Khan',
      'category': 'Followers',
      'text': 'started following you',
      'time': '8m',
      'unread': true,
      'ring': const Color(0xFFFF1A6C),
    },
    {
      'id': 'notif_2',
      'user': 'Hamza Ali',
      'category': 'Likes',
      'text': 'liked your Square post',
      'time': '25m',
      'unread': true,
      'ring': const Color(0xFF3B82F6),
    },
    {
      'id': 'notif_3',
      'user': 'Mina Noor',
      'category': 'Comments',
      'text': 'commented: Great post!',
      'time': '1h',
      'unread': true,
      'ring': const Color(0xFFA855F7),
    },
    {
      'id': 'notif_4',
      'user': 'Sara Noor',
      'category': 'Invites',
      'text': 'invited you to a party room',
      'time': '3h',
      'unread': true,
      'ring': const Color(0xFF10B981),
    },
  ];

  @override
  Widget build(BuildContext context) {
    final visible = _items.where((item) {
      if (_selectedCategory != 'All' && item['category'] != _selectedCategory) {
        return false;
      }
      if (_unreadOnly && item['unread'] != true) return false;
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFF0E051E),
      appBar: AppBar(
        backgroundColor: const Color(0xFF120624),
        title: const Text('Notifications'),
        actions: [
          TextButton(
            onPressed: () {
              setState(() {
                for (final item in _items) {
                  item['unread'] = false;
                }
              });
            },
            child: const Text(
              'Mark All Read',
              style: TextStyle(color: Color(0xFFFF4D8D), fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          SizedBox(
            height: 46,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              itemCount: _categories.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final label = _categories[index];
                final active = _selectedCategory == label;
                return ChoiceChip(
                  label: Text(label),
                  selected: active,
                  selectedColor: const Color(0xFFFF1A6C),
                  backgroundColor: const Color(0xFF211042),
                  labelStyle: const TextStyle(color: Colors.white, fontSize: 12),
                  onSelected: (_) => setState(() => _selectedCategory = label),
                );
              },
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(14),
              itemCount: visible.length,
              itemBuilder: (context, index) {
                final item = visible[index];
                final user = item['user'] as String;
                final isFollowed = _followedBack.contains(user);
                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: item['unread'] == true
                        ? const Color(0xFF1B0C36)
                        : const Color(0xFF120624),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: Colors.purpleAccent.withOpacity(0.25)),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 22,
                        backgroundColor: item['ring'] as Color,
                        child: Text(user.substring(0, 1)),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(user, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                            Text(item['text'] as String, style: const TextStyle(color: Colors.white70, fontSize: 12)),
                            Text(item['time'] as String, style: const TextStyle(color: Colors.white38, fontSize: 11)),
                          ],
                        ),
                      ),
                      if (item['category'] == 'Followers')
                        ElevatedButton(
                          onPressed: () {
                            setState(() {
                              if (isFollowed) {
                                _followedBack.remove(user);
                              } else {
                                _followedBack.add(user);
                              }
                            });
                          },
                          child: Text(isFollowed ? 'Following' : 'Follow Back'),
                        ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
