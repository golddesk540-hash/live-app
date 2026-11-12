import 'package:flutter/material.dart';

/// Popo Live — Phase 9.2 Daily Host Tasks Screen (Frontend Preview Only)
class DailyHostTasksScreen extends StatefulWidget {
  const DailyHostTasksScreen({super.key});

  @override
  State<DailyHostTasksScreen> createState() => _DailyHostTasksScreenState();
}

class _DailyHostTasksScreenState extends State<DailyHostTasksScreen> {
  final List<_SampleDailyTask> _tasks = [
    _SampleDailyTask(
      id: 'go_live_60',
      title: 'Go live for 60 minutes',
      category: 'Live Streaming',
      current: 45,
      target: 60,
      unit: 'min',
      status: 'In Progress',
    ),
    _SampleDailyTask(
      id: 'receive_gifts_10',
      title: 'Receive 10 gifts during live sessions',
      category: 'Gift Activity',
      current: 10,
      target: 10,
      unit: 'gifts',
      status: 'Completed',
    ),
    _SampleDailyTask(
      id: 'welcome_viewers_5',
      title: 'Welcome 5 new viewers',
      category: 'Community',
      current: 5,
      target: 5,
      unit: 'viewers',
      status: 'Completed',
    ),
    _SampleDailyTask(
      id: 'join_party_room',
      title: 'Join a party room',
      category: 'Community',
      current: 0,
      target: 1,
      unit: 'room',
      status: 'Not Started',
    ),
  ];

  int get _completedCount => _tasks.where((t) => t.status == 'Completed').length;

  @override
  Widget build(BuildContext context) {
    final total = _tasks.length;
    final ratio = total > 0 ? _completedCount / total : 0.0;

    return Scaffold(
      backgroundColor: const Color(0xFF0D031B),
      appBar: AppBar(
        backgroundColor: const Color(0xFF120624),
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Daily Host Tasks',
          style: TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Your activity goals · Frontend preview only',
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
                  "TODAY'S PROGRESS · Nov 12, 2026",
                  style: TextStyle(
                    color: Color(0xFFC3B1DF),
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.1,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  '$_completedCount of $total tasks complete',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
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
              ],
            ),
          ),
          const SizedBox(height: 16),
          ..._tasks.map((task) {
            final isDone = task.status == 'Completed';
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF130728),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isDone
                      ? const Color(0xFFFFB800).withOpacity(0.45)
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
                          task.category,
                          style: const TextStyle(
                            color: Color(0xFFFF85B3),
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          task.title,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          task.status == 'Not Started'
                              ? 'Not started'
                              : '${task.current} / ${task.target} ${task.unit}',
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
                          task.current = 0;
                          task.status = 'Not Started';
                        } else {
                          task.current = task.target;
                          task.status = 'Completed';
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

class _SampleDailyTask {
  final String id;
  final String title;
  final String category;
  int current;
  final int target;
  final String unit;
  String status;

  _SampleDailyTask({
    required this.id,
    required this.title,
    required this.category,
    required this.current,
    required this.target,
    required this.unit,
    required this.status,
  });
}
