import 'package:flutter/material.dart';
import '../../design/design_fixtures.dart';
import '../../widgets/popo_error_state.dart';
import '../../widgets/popo_empty_state.dart';

/// Popo Live — Phase 4 Module 8: Host Task Level Screen
/// Dynamic task level tracking, points progress, tier benefits and milestone roadmap.
class TaskLevelScreen extends StatefulWidget {
  const TaskLevelScreen({super.key});

  @override
  State<TaskLevelScreen> createState() => _TaskLevelScreenState();
}

class _TaskLevelScreenState extends State<TaskLevelScreen> {
  bool _isLoading = true;
  String? _errorMessage;
  Map<String, dynamic>? _levelData;

  @override
  void initState() {
    super.initState();
    _loadTaskLevel();
  }

  Future<void> _loadTaskLevel() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      if (DesignFixtures.isError) {
        throw const DesignFixtureException(
          message: 'Failed to load task level [ERR_TASK_LEVEL_503]',
        );
      }
      final data = DesignFixtures.taskLevelInfo.toMap();
      if (!mounted) return;
      setState(() {
        _levelData = data;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e
            .toString()
            .replaceFirst('Exception: ', '')
            .replaceFirst('DesignFixtureException: ', '');
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D031B),
      appBar: AppBar(
        backgroundColor: const Color(0xFF120624),
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Host Task Level',
          style: TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadTaskLevel,
        color: const Color(0xFFFF1A6C),
        backgroundColor: const Color(0xFF160830),
        child: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFFFF1A6C)),
      );
    }

    if (DesignFixtures.isError || _errorMessage != null) {
      return Center(
        child: PopoErrorState(
          title: 'Task Level Unavailable',
          message: _errorMessage ?? 'Server busy [ERR_TASK_LEVEL_503]',
          retryText: 'Retry',
          onRetry: _loadTaskLevel,
        ),
      );
    }

    if (DesignFixtures.isEmpty || (_levelData != null && _levelData!['currentLevel'] == 0)) {
      return Center(
        child: PopoEmptyState(
          icon: Icons.military_tech_outlined,
          title: 'No Task Level Data',
          message: 'Complete daily host broadcasting tasks to progress through creator milestones.',
          actionText: 'Refresh',
          onActionTap: _loadTaskLevel,
        ),
      );
    }

    final data = _levelData ?? {};
    final currentLevel = data['currentLevel'] ?? 1;
    final levelName = data['levelName'] ?? 'Starter';
    final taskPoints = data['taskPoints'] ?? 0;
    final nextLevel = data['nextLevel'];
    final nextLevelName = data['nextLevelName'];
    final pointsToNext = data['pointsToNext'] ?? 0;
    final double ratio = (data['progressRatio'] is num)
        ? (data['progressRatio'] as num).toDouble().clamp(0.0, 1.0)
        : 0.0;

    final benefits = (data['benefits'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [];
    final allLevels = (data['allLevels'] as List<dynamic>?) ?? [];

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          'Track your creator milestones and unlock tier rewards',
          style: TextStyle(color: Color(0xFFBBA9D6), fontSize: 13),
        ),
        const SizedBox(height: 16),

        // Active Level Card
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF220C46), Color(0xFF160830)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: Colors.purple.withOpacity(0.35)),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFFF1A6C).withOpacity(0.12),
                blurRadius: 18,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
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
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0x33FFB800),
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: const Color(0xFFFFC107)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.star_rounded, color: Color(0xFFFFC107), size: 14),
                        const SizedBox(width: 4),
                        Text(
                          '$taskPoints PTS',
                          style: const TextStyle(
                            color: Color(0xFFFFC107),
                            fontWeight: FontWeight.w900,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                'LEVEL 0$currentLevel',
                style: const TextStyle(
                  color: Color(0xFFFFC107),
                  fontSize: 32,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                levelName,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 14),
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
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    nextLevel != null
                        ? '$pointsToNext pts to Level 0$nextLevel ($nextLevelName)'
                        : 'Max Tier Reached!',
                    style: const TextStyle(color: Color(0xFFCBB9E6), fontSize: 12),
                  ),
                  Text(
                    '${(ratio * 100).round()}%',
                    style: const TextStyle(
                      color: Color(0xFFFF85B3),
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),

        // Tier Benefits Card
        if (benefits.isNotEmpty) ...[
          const Text(
            'Current Tier Benefits',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF160830),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.purple.withOpacity(0.24)),
            ),
            child: Column(
              children: benefits.map((benefit) {
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6.0),
                  child: Row(
                    children: [
                      const Icon(Icons.check_circle_rounded, color: Color(0xFF34D399), size: 18),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          benefit,
                          style: const TextStyle(color: Colors.white, fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 20),
        ],

        // Roadmap of All Levels
        const Text(
          'Level Progression Roadmap',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 12),
        ...allLevels.map((lvl) {
          final int lvlNumber = lvl['levelNumber'] ?? 1;
          final String lvlName = lvl['name'] ?? '';
          final int minPts = lvl['minPoints'] ?? 0;
          final bool isAchieved = taskPoints >= minPts;
          final bool isCurrent = lvlNumber == currentLevel;

          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isCurrent
                  ? const Color(0xFF220E44)
                  : const Color(0xFF130728),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isCurrent
                    ? const Color(0xFFFF1A6C)
                    : (isAchieved
                        ? const Color(0xFF34D399).withOpacity(0.5)
                        : Colors.purple.withOpacity(0.22)),
                width: isCurrent ? 1.5 : 1.0,
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isAchieved
                            ? const Color(0x3334D399)
                            : const Color(0x22FFFFFF),
                      ),
                      child: Center(
                        child: Text(
                          '0$lvlNumber',
                          style: TextStyle(
                            color: isAchieved ? const Color(0xFF34D399) : Colors.white70,
                            fontWeight: FontWeight.w900,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              lvlName,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 15,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            if (isCurrent) ...[
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFF1A6C),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Text(
                                  'CURRENT',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '$minPts points required',
                          style: const TextStyle(
                            color: Color(0xFFBBA9D6),
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                Icon(
                  isAchieved ? Icons.check_circle_rounded : Icons.lock_outline_rounded,
                  color: isAchieved ? const Color(0xFF34D399) : Colors.white38,
                  size: 22,
                ),
              ],
            ),
          );
        }),
      ],
    );
  }
}
