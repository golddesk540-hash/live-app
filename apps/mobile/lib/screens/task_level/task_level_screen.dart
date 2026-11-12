import 'package:flutter/material.dart';

/// Popo Live — Phase 9.3 Task Level Screen (Frontend Preview Only)
class TaskLevelScreen extends StatefulWidget {
  const TaskLevelScreen({super.key});

  @override
  State<TaskLevelScreen> createState() => _TaskLevelScreenState();
}

class _TaskLevelScreenState extends State<TaskLevelScreen> {
  int _demoPoints = 650;

  static const _levels = [
    _SampleLevelTier(number: 1, name: 'Starter', points: 100),
    _SampleLevelTier(number: 2, name: 'Active Host', points: 300),
    _SampleLevelTier(number: 3, name: 'Rising Creator', points: 900),
    _SampleLevelTier(number: 4, name: 'Popular Host', points: 1500),
    _SampleLevelTier(number: 5, name: 'Star Creator', points: 2500),
  ];

  @override
  Widget build(BuildContext context) {
    final currentIdx = _levels.indexWhere((l) => _demoPoints < l.points);
    final activeIdx = currentIdx == -1 ? _levels.length - 1 : currentIdx;
    final activeTier = _levels[activeIdx];
    final ratio = (_demoPoints / activeTier.points).clamp(0.0, 1.0);

    return Scaffold(
      backgroundColor: const Color(0xFF0D031B),
      appBar: AppBar(
        backgroundColor: const Color(0xFF120624),
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Task Level',
          style: TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Track your host progress · Frontend preview only',
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
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'CURRENT TASK LEVEL',
                  style: TextStyle(
                    color: Color(0xFFC3B1DF),
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.1,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  'LEVEL 0${activeTier.number}',
                  style: const TextStyle(
                    color: Color(0xFFFFC107),
                    fontSize: 30,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  activeTier.name,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 12),
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: LinearProgressIndicator(
                    value: ratio,
                    minHeight: 12,
                    backgroundColor: const Color(0xFF2B174A),
                    valueColor: const AlwaysStoppedAnimation(Color(0xFFFF1A6C)),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '$_demoPoints / ${activeTier.points} points (${(ratio * 100).round()}%)',
                  style: const TextStyle(color: Color(0xFFCBB9E6), fontSize: 12),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFFF1A6C),
                        foregroundColor: Colors.white,
                      ),
                      onPressed: () {
                        setState(() => _demoPoints += 150);
                      },
                      child: const Text('+150 Demo Pts'),
                    ),
                    const SizedBox(width: 8),
                    TextButton(
                      onPressed: () {
                        setState(() => _demoPoints = 650);
                      },
                      child: const Text('Reset (650)'),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'Level Progress',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 12),
          ..._levels.map((lvl) {
            final isDone = _demoPoints >= lvl.points;
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
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Level 0${lvl.number} · ${lvl.name}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${lvl.points} points',
                        style: const TextStyle(
                          color: Color(0xFFBBA9D6),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  Icon(
                    isDone ? Icons.check_circle : Icons.radio_button_unchecked,
                    color: isDone ? const Color(0xFF34D399) : Colors.white54,
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

class _SampleLevelTier {
  final int number;
  final String name;
  final int points;

  const _SampleLevelTier({
    required this.number,
    required this.name,
    required this.points,
  });
}
