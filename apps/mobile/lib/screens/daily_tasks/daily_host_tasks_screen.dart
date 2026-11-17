import 'package:flutter/material.dart';
import '../../services/host/host_task_service.dart';

/// Popo Live — Module 9.2 Daily Host Tasks Screen
/// Authoritative host task tracking, completion status, and diamond points reward claiming.
class DailyHostTasksScreen extends StatefulWidget {
  const DailyHostTasksScreen({super.key});

  @override
  State<DailyHostTasksScreen> createState() => _DailyHostTasksScreenState();
}

class _DailyHostTasksScreenState extends State<DailyHostTasksScreen> {
  bool _isLoading = false;
  String? _errorMessage;
  bool _isEligible = true;
  String _dateLabel = 'Today';
  int _completedCount = 0;
  int _totalCount = 0;
  double _completionRatio = 0.0;

  List<_DailyTaskViewItem> _tasks = [
    _DailyTaskViewItem(
      id: 'go_live_60',
      title: 'Go live for 60 minutes',
      category: 'Live Streaming',
      current: 45,
      target: 60,
      unit: 'min',
      status: 'In Progress',
      rewardPoints: 150,
      isRewardClaimed: false,
    ),
    _DailyTaskViewItem(
      id: 'receive_gifts_10',
      title: 'Receive 10 gifts during live sessions',
      category: 'Gift Activity',
      current: 10,
      target: 10,
      unit: 'gifts',
      status: 'Completed',
      rewardPoints: 200,
      isRewardClaimed: false,
    ),
    _DailyTaskViewItem(
      id: 'welcome_viewers_5',
      title: 'Welcome 5 new viewers',
      category: 'Community',
      current: 5,
      target: 5,
      unit: 'viewers',
      status: 'Completed',
      rewardPoints: 100,
      isRewardClaimed: false,
    ),
    _DailyTaskViewItem(
      id: 'join_party_room',
      title: 'Join a party room',
      category: 'Community',
      current: 0,
      target: 1,
      unit: 'room',
      status: 'Not Started',
      rewardPoints: 80,
      isRewardClaimed: false,
    ),
  ];

  @override
  void initState() {
    super.initState();
    _loadBackendTasks();
  }

  Future<void> _loadBackendTasks() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await HostTaskService.instance.fetchDailyTasks();
      final taskList = (res['tasks'] as List<dynamic>?) ?? [];

      if (mounted) {
        setState(() {
          _dateLabel = res['dateLabel']?.toString() ?? 'Today';
          _completedCount = (res['completedCount'] as num?)?.toInt() ?? 0;
          _totalCount = (res['totalCount'] as num?)?.toInt() ?? taskList.length;
          _completionRatio = (res['completionRatio'] as num?)?.toDouble() ?? 0.0;
          _isEligible = true;

          if (taskList.isNotEmpty) {
            _tasks = taskList.map((t) {
              return _DailyTaskViewItem(
                id: t['id']?.toString() ?? '',
                title: t['title']?.toString() ?? '',
                category: t['categoryLabel']?.toString() ?? t['category']?.toString() ?? 'General',
                current: (t['currentProgress'] as num?)?.toInt() ?? 0,
                target: (t['targetProgress'] as num?)?.toInt() ?? 1,
                unit: t['unit']?.toString() ?? '',
                status: t['status']?.toString() ?? 'Not Started',
                rewardPoints: (t['rewardPoints'] as num?)?.toInt() ?? 50,
                isRewardClaimed: t['isRewardClaimed'] == true,
              );
            }).toList();
          }
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceAll('Exception: ', '');
          if (_errorMessage!.contains('403') || _errorMessage!.contains('required')) {
            _isEligible = false;
          }
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _claimReward(String taskId) async {
    try {
      final res = await HostTaskService.instance.claimTaskReward(taskId);
      final pts = res['rewardPoints'] ?? 50;

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Claimed +$pts Diamond Points!'),
          backgroundColor: const Color(0xFF1F0E3D),
        ),
      );
      _loadBackendTasks();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final total = _tasks.length;
    final ratio = total > 0 ? _completedCount / total : _completionRatio;

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
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Color(0xFFFF1A6C)),
            onPressed: _loadBackendTasks,
          ),
        ],
      ),
      body: RefreshIndicator(
        color: const Color(0xFFFF1A6C),
        backgroundColor: const Color(0xFF160830),
        onRefresh: _loadBackendTasks,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(
              'Your official activity goals · $_dateLabel',
              style: const TextStyle(color: Color(0xFFBBA9D6), fontSize: 13),
            ),
            const SizedBox(height: 16),
            if (!_isEligible)
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E0E35),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.amber.withOpacity(0.5)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.lock_person, color: Color(0xFFFFB800), size: 32),
                    SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Host Permission Required',
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                          SizedBox(height: 4),
                          Text('Daily host tasks require Host Role approval or Wealth Level 5.',
                              style: TextStyle(color: Color(0xFFD8B4FE), fontSize: 12)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
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
                  Text(
                    "TODAY'S PROGRESS · $_dateLabel",
                    style: const TextStyle(
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
                      value: ratio.clamp(0.0, 1.0),
                      minHeight: 12,
                      backgroundColor: const Color(0xFF2B174A),
                      valueColor: const AlwaysStoppedAnimation(Color(0xFFFF1A6C)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            if (_isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child: CircularProgressIndicator(color: Color(0xFFFF1A6C)),
                ),
              )
            else
              ..._tasks.map((task) {
                final isDone = task.status == 'Completed' || task.status == 'Claimed';
                final isClaimed = task.isRewardClaimed || task.status == 'Claimed';

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
                            Row(
                              children: [
                                Text(
                                  task.category,
                                  style: const TextStyle(
                                    color: Color(0xFFFF85B3),
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                const Spacer(),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF28124D),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Text(
                                    '+${task.rewardPoints} pts',
                                    style: const TextStyle(
                                      color: Color(0xFFFFC107),
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
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
                      const SizedBox(width: 8),
                      if (isClaimed)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.green.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Text('Claimed', style: TextStyle(color: Colors.greenAccent, fontSize: 11, fontWeight: FontWeight.bold)),
                        )
                      else if (isDone)
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFFFB800),
                            shape: const StadiumBorder(),
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          ),
                          onPressed: () => _claimReward(task.id),
                          child: const Text('Claim', style: TextStyle(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 11)),
                        )
                      else
                        IconButton(
                          onPressed: () async {
                            try {
                              await HostTaskService.instance.updateTaskProgress(task.id, absoluteProgress: task.target);
                              _loadBackendTasks();
                            } catch (_) {}
                          },
                          icon: const Icon(
                            Icons.radio_button_unchecked,
                            color: Colors.white54,
                          ),
                        ),
                    ],
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }
}

class _DailyTaskViewItem {
  final String id;
  final String title;
  final String category;
  int current;
  final int target;
  final String unit;
  String status;
  final int rewardPoints;
  final bool isRewardClaimed;

  _DailyTaskViewItem({
    required this.id,
    required this.title,
    required this.category,
    required this.current,
    required this.target,
    required this.unit,
    required this.status,
    required this.rewardPoints,
    required this.isRewardClaimed,
  });
}
