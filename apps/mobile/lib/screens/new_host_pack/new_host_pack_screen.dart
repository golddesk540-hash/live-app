import 'package:flutter/material.dart';

/// Popo Live — Phase 9.4 New-Host Pack Screen (Frontend Preview Only)
class NewHostPackScreen extends StatefulWidget {
  const NewHostPackScreen({super.key});

  @override
  State<NewHostPackScreen> createState() => _NewHostPackScreenState();
}

class _NewHostPackScreenState extends State<NewHostPackScreen> {
  final Set<String> _completedIds = {'profile_setup'};

  static const _guides = [
    _StarterGuideItem(
      id: 'profile_setup',
      title: 'Set up your profile',
      subtitle: 'Add a photo and creator bio',
    ),
    _StarterGuideItem(
      id: 'live_tools',
      title: 'Learn the live tools',
      subtitle: 'Explore host controls and safety',
    ),
    _StarterGuideItem(
      id: 'know_goals',
      title: 'Know your goals',
      subtitle: 'Review tasks and creator rules',
    ),
    _StarterGuideItem(
      id: 'meet_community',
      title: 'Meet your community',
      subtitle: 'Connect with viewers and fans',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final completed = _completedIds.length;
    final total = _guides.length;
    final ratio = total > 0 ? completed / total : 0.0;

    return Scaffold(
      backgroundColor: const Color(0xFF0D031B),
      appBar: AppBar(
        backgroundColor: const Color(0xFF120624),
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'New-Host Pack',
          style: TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'A starter guide for new creators · Frontend preview only',
            style: TextStyle(color: Color(0xFFBBA9D6), fontSize: 13),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFF160830),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: Colors.purple.withOpacity(0.28)),
            ),
            child: Column(
              children: [
                const Icon(Icons.auto_awesome, color: Color(0xFFFFC107), size: 38),
                const SizedBox(height: 10),
                const Text(
                  'WELCOME TO POPO LIVE',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Your creator starter pack',
                  style: TextStyle(color: Color(0xFFFF85B3), fontSize: 13),
                ),
                const SizedBox(height: 14),
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: LinearProgressIndicator(
                    value: ratio,
                    minHeight: 10,
                    backgroundColor: const Color(0xFF2B174A),
                    valueColor: const AlwaysStoppedAnimation(Color(0xFFFF1A6C)),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '$completed of $total starter guides completed (${(ratio * 100).round()}%)',
                  style: const TextStyle(color: Color(0xFFCBB9E6), fontSize: 12),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'Your starter guide',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 12),
          ..._guides.map((guide) {
            final isDone = _completedIds.contains(guide.id);
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF130728),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isDone
                      ? const Color(0xFF34D399).withOpacity(0.45)
                      : Colors.purple.withOpacity(0.24),
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          guide.title,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          guide.subtitle,
                          style: const TextStyle(
                            color: Color(0xFFBBA9D6),
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () {
                      setState(() {
                        if (isDone) {
                          _completedIds.remove(guide.id);
                        } else {
                          _completedIds.add(guide.id);
                        }
                      });
                    },
                    icon: Icon(
                      isDone ? Icons.check_circle : Icons.radio_button_unchecked,
                      color: isDone ? const Color(0xFF34D399) : Colors.white54,
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}

class _StarterGuideItem {
  final String id;
  final String title;
  final String subtitle;

  const _StarterGuideItem({
    required this.id,
    required this.title,
    required this.subtitle,
  });
}
