import 'package:flutter/material.dart';

/// Popo Live — Phase 9.5 Host Rankings Screen (Frontend Preview Only)
class HostRankingsScreen extends StatefulWidget {
  const HostRankingsScreen({super.key});

  @override
  State<HostRankingsScreen> createState() => _HostRankingsScreenState();
}

class _HostRankingsScreenState extends State<HostRankingsScreen> {
  String _period = 'daily';

  static const Map<String, List<_MockRankedHost>> _sampleByPeriod = {
    'daily': [
      _MockRankedHost(rank: 1, name: 'Ayesha Khan', handle: '@ayesha.live', points: '9,800 pts'),
      _MockRankedHost(rank: 2, name: 'Mina Noor', handle: '@mina.noor', points: '8,420 pts'),
      _MockRankedHost(rank: 3, name: 'Sara Ali', handle: '@sara.voice', points: '7,910 pts'),
      _MockRankedHost(rank: 4, name: 'Hamza Ali', handle: '@hamza.stage', points: '7,250 pts'),
      _MockRankedHost(rank: 5, name: 'Zara Noor', handle: '@zara.vibes', points: '6,840 pts'),
    ],
    'weekly': [
      _MockRankedHost(rank: 1, name: 'Mina Noor', handle: '@mina.noor', points: '54,600 pts'),
      _MockRankedHost(rank: 2, name: 'Hamza Ali', handle: '@hamza.stage', points: '49,300 pts'),
      _MockRankedHost(rank: 3, name: 'Zaid Star', handle: '@zaid.star', points: '45,800 pts'),
      _MockRankedHost(rank: 4, name: 'Ayesha Khan', handle: '@ayesha.live', points: '42,150 pts'),
    ],
    'monthly': [
      _MockRankedHost(rank: 1, name: 'Zaid Star', handle: '@zaid.star', points: '188,500 pts'),
      _MockRankedHost(rank: 2, name: 'Sara Ali', handle: '@sara.voice', points: '169,200 pts'),
      _MockRankedHost(rank: 3, name: 'Mina Noor', handle: '@mina.noor', points: '154,900 pts'),
      _MockRankedHost(rank: 7, name: 'Ayesha Khan', handle: '@ayesha.live', points: '118,400 pts'),
    ],
  };

  @override
  Widget build(BuildContext context) {
    final entries = _sampleByPeriod[_period] ?? const <_MockRankedHost>[];

    return Scaffold(
      backgroundColor: const Color(0xFF0D031B),
      appBar: AppBar(
        backgroundColor: const Color(0xFF120624),
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Host Rankings',
          style: TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Creator leaderboard · Sample ranking points only',
            style: TextStyle(color: Color(0xFFBBA9D6), fontSize: 13),
          ),
          const SizedBox(height: 14),
          Row(
            children: ['daily', 'weekly', 'monthly'].map((period) {
              final active = _period == period;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: Text(period.toUpperCase()),
                  selected: active,
                  selectedColor: const Color(0xFFFF1A6C),
                  backgroundColor: const Color(0xFF180A31),
                  labelStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                  onSelected: (_) => setState(() => _period = period),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),
          ...entries.map(
            (entry) => Container(
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
                      '${entry.rank}',
                      style: const TextStyle(
                        color: Color(0xFFFCD34D),
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          entry.name,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        Text(
                          entry.handle,
                          style: const TextStyle(color: Color(0xFFBBA9D6), fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    entry.points,
                    style: const TextStyle(
                      color: Color(0xFFFCD34D),
                      fontWeight: FontWeight.w800,
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

class _MockRankedHost {
  const _MockRankedHost({
    required this.rank,
    required this.name,
    required this.handle,
    required this.points,
  });

  final int rank;
  final String name;
  final String handle;
  final String points;
}
