import 'package:flutter/material.dart';

/// Popo Live — Phase 9.6 Event Leaderboard Screen (Frontend Preview Only)
class EventLeaderboardScreen extends StatefulWidget {
  const EventLeaderboardScreen({super.key});

  @override
  State<EventLeaderboardScreen> createState() => _EventLeaderboardScreenState();
}

class _EventLeaderboardScreenState extends State<EventLeaderboardScreen> {
  String _tab = 'overall';

  static const _participants = [
    _MockEventParticipant(rank: 1, name: 'Ayesha Khan', points: '24,500 points'),
    _MockEventParticipant(rank: 2, name: 'Hamza Ali', points: '21,300 points'),
    _MockEventParticipant(rank: 3, name: 'Mina Noor', points: '18,900 points'),
    _MockEventParticipant(rank: 4, name: 'Sara Ali', points: '16,750 points'),
    _MockEventParticipant(rank: 5, name: 'Zara Noor', points: '14,200 points'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D031B),
      appBar: AppBar(
        backgroundColor: const Color(0xFF120624),
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Event Leaderboard',
          style: TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Creator event rankings · Sample event preview',
            style: TextStyle(color: Color(0xFFBBA9D6), fontSize: 13),
          ),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF2C104F), Color(0xFF16082E)],
              ),
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: Colors.purpleAccent.withOpacity(0.25)),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'LIVE EVENT',
                  style: TextStyle(
                    color: Color(0xFFFF4D8D),
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                SizedBox(height: 6),
                Text(
                  'Star Creator Challenge',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Event period · Sample event',
                  style: TextStyle(color: Color(0xFFBBA9D6), fontSize: 12),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: ['overall', 'by_points'].map((tab) {
              final active = _tab == tab;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: Text(tab == 'overall' ? 'Overall' : 'By Points'),
                  selected: active,
                  selectedColor: const Color(0xFFFF1A6C),
                  backgroundColor: const Color(0xFF180A31),
                  labelStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                  onSelected: (_) => setState(() => _tab = tab),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 14),
          const Text(
            'Top participants',
            style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 10),
          ..._participants.map(
            (p) => Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xFF16082E),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: Colors.purpleAccent.withOpacity(0.2)),
              ),
              child: Row(
                children: [
                  SizedBox(
                    width: 28,
                    child: Text(
                      '${p.rank}',
                      style: const TextStyle(
                        color: Color(0xFFFCD34D),
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                  Expanded(
                    child: Text(
                      p.name,
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800),
                    ),
                  ),
                  Text(
                    p.points,
                    style: const TextStyle(
                      color: Color(0xFFBBA9D6),
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MockEventParticipant {
  const _MockEventParticipant({
    required this.rank,
    required this.name,
    required this.points,
  });

  final int rank;
  final String name;
  final String points;
}
