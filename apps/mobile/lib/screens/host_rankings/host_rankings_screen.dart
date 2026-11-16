import 'package:flutter/material.dart';
import '../../api/api.dart';
import '../profile/public_profile_screen.dart';

/// Popo Live — Phase 4 Module 8: Host Rankings Screen
/// Creator Leaderboard with Daily, Weekly, and Monthly Periods, Podium presentation, and Own Rank.
class HostRankingsScreen extends StatefulWidget {
  const HostRankingsScreen({super.key});

  @override
  State<HostRankingsScreen> createState() => _HostRankingsScreenState();
}

class _HostRankingsScreenState extends State<HostRankingsScreen> {
  String _period = 'daily';
  bool _isLoading = true;
  String? _errorMessage;

  List<dynamic> _rankings = [];
  Map<String, dynamic>? _podium;
  Map<String, dynamic>? _myRank;

  @override
  void initState() {
    super.initState();
    _fetchRankings();
  }

  Future<void> _fetchRankings() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await RankingsService.instance.getHostRankings(period: _period);
      if (!mounted) return;

      if (res.isSuccess && res.data != null) {
        final data = res.data as Map<String, dynamic>;
        setState(() {
          _rankings = (data['rankings'] as List<dynamic>?) ?? [];
          _podium = data['podium'] as Map<String, dynamic>?;
          _myRank = data['myRank'] as Map<String, dynamic>?;
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = res.error ?? 'Failed to load rankings.';
          _isLoading = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  void _onPeriodChanged(String period) {
    if (_period == period) return;
    setState(() {
      _period = period;
    });
    _fetchRankings();
  }

  void _openProfile(String userId) {
    if (userId.isEmpty) return;
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => PublicProfileScreen(userId: userId)),
    );
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
          'Host Rankings',
          style: TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _fetchRankings,
        color: const Color(0xFFFF1A6C),
        backgroundColor: const Color(0xFF160830),
        child: Column(
          children: [
            // Period Selector Tabs
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              color: const Color(0xFF120624),
              child: Row(
                children: [
                  _periodTab('DAILY', 'daily'),
                  const SizedBox(width: 8),
                  _periodTab('WEEKLY', 'weekly'),
                  const SizedBox(width: 8),
                  _periodTab('MONTHLY', 'monthly'),
                ],
              ),
            ),

            // Content List or Status
            Expanded(
              child: _buildBody(),
            ),

            // Authenticated Host Own Rank Card (if available)
            if (_myRank != null) _buildMyRankCard(),
          ],
        ),
      ),
    );
  }

  Widget _periodTab(String label, String value) {
    final bool active = _period == value;
    return Expanded(
      child: InkWell(
        onTap: () => _onPeriodChanged(value),
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: active ? const Color(0xFFFF1A6C) : const Color(0xFF1C0D36),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: active ? const Color(0xFFFF1A6C) : const Color(0x33A855F7),
            ),
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                color: active ? Colors.white : const Color(0xFFBBA9D6),
                fontSize: 12,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFFFF1A6C)),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline_rounded, color: Color(0xFFFF1A6C), size: 48),
              const SizedBox(height: 12),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Color(0xFFCBB9E6), fontSize: 13),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFF1A6C),
                  foregroundColor: Colors.white,
                  shape: const StadiumBorder(),
                ),
                onPressed: _fetchRankings,
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    if (_rankings.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Icon(Icons.leaderboard_outlined, color: Colors.white30, size: 54),
            SizedBox(height: 12),
            Text(
              'No rankings recorded for this period yet.',
              style: TextStyle(color: Color(0xFFBBA9D6), fontSize: 13),
            ),
          ],
        ),
      );
    }

    final first = _podium?['first'];
    final second = _podium?['second'];
    final third = _podium?['third'];
    final remainingRankings = _rankings.length > 3 ? _rankings.sublist(3) : <dynamic>[];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Top 3 Podium
        if (first != null || second != null || third != null) ...[
          _buildPodium(first, second, third),
          const SizedBox(height: 20),
        ],

        // Remaining Rankings (Rank 4+)
        const Text(
          'Rankings',
          style: TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 10),

        ...remainingRankings.map((item) {
          final int rank = item['rank'] ?? 0;
          final String name = item['nickname'] ?? 'Creator';
          final String poppoId = item['poppoId'] ?? '';
          final String scoreFormatted = item['scoreFormatted']?.toString() ?? '0';
          final String flag = item['flagEmoji'] ?? '🇵🇰';
          final String avatar = item['avatarUrl'] ?? '';
          final int hostLevel = item['hostLevel'] ?? 1;

          return InkWell(
            onTap: () => _openProfile(item['id'] ?? ''),
            borderRadius: BorderRadius.circular(18),
            child: Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xFF16082E),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: Colors.purpleAccent.withOpacity(0.18)),
              ),
              child: Row(
                children: [
                  SizedBox(
                    width: 30,
                    child: Text(
                      '$rank',
                      style: const TextStyle(
                        color: Color(0xFFFCD34D),
                        fontWeight: FontWeight.w900,
                        fontSize: 14,
                      ),
                    ),
                  ),
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: const Color(0xFF281347),
                    backgroundImage: avatar.startsWith('http') ? NetworkImage(avatar) : null,
                    child: !avatar.startsWith('http')
                        ? const Icon(Icons.person, color: Colors.white70, size: 20)
                        : null,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                            const SizedBox(width: 4),
                            Text(flag, style: const TextStyle(fontSize: 12)),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            Text(
                              'ID: $poppoId',
                              style: const TextStyle(color: Color(0xFFBBA9D6), fontSize: 11),
                            ),
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFF1A6C).withOpacity(0.2),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                'Lv.$hostLevel',
                                style: const TextStyle(
                                  color: Color(0xFFFF85B3),
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '$scoreFormatted pts',
                        style: const TextStyle(
                          color: Color(0xFFFCD34D),
                          fontWeight: FontWeight.w900,
                          fontSize: 13,
                        ),
                      ),
                      const Text(
                        'Points',
                        style: TextStyle(color: Colors.white38, fontSize: 10),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildPodium(dynamic first, dynamic second, dynamic third) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 10),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF260D4A), Color(0xFF140728)],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.purpleAccent.withOpacity(0.25)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // 2nd Place (Silver)
          if (second != null)
            _podiumColumn(second, 2, const Color(0xFFE2E8F0), 65)
          else
            const SizedBox(width: 75),

          // 1st Place (Gold)
          if (first != null)
            _podiumColumn(first, 1, const Color(0xFFFFC107), 85)
          else
            const SizedBox(width: 75),

          // 3rd Place (Bronze)
          if (third != null)
            _podiumColumn(third, 3, const Color(0xFFF97316), 55)
          else
            const SizedBox(width: 75),
        ],
      ),
    );
  }

  Widget _podiumColumn(dynamic host, int rank, Color color, double avatarRadius) {
    final String name = host['nickname'] ?? 'Host';
    final String score = host['scoreFormatted']?.toString() ?? '0';
    final String avatar = host['avatarUrl'] ?? '';

    return InkWell(
      onTap: () => _openProfile(host['id'] ?? ''),
      child: Column(
        children: [
          // Crown for 1st
          if (rank == 1)
            const Icon(Icons.workspace_premium_rounded, color: Color(0xFFFFC107), size: 28)
          else
            const SizedBox(height: 28),

          Stack(
            alignment: Alignment.bottomCenter,
            children: [
              Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: color, width: rank == 1 ? 3 : 2),
                ),
                child: CircleAvatar(
                  radius: rank == 1 ? 34 : 28,
                  backgroundColor: const Color(0xFF2E1352),
                  backgroundImage: avatar.startsWith('http') ? NetworkImage(avatar) : null,
                  child: !avatar.startsWith('http')
                      ? const Icon(Icons.person, color: Colors.white, size: 28)
                      : null,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '#$rank',
                  style: const TextStyle(
                    color: Colors.black,
                    fontWeight: FontWeight.w900,
                    fontSize: 10,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          SizedBox(
            width: 85,
            child: Text(
              name,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
                fontSize: 12,
              ),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            '$score pts',
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w800,
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMyRankCard() {
    final rank = _myRank?['rank'];
    final scoreFormatted = _myRank?['scoreFormatted'] ?? '0';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF1E0C3E),
        border: const Border(
          top: BorderSide(color: Color(0xFFFF1A6C), width: 1.5),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.4),
            blurRadius: 10,
            offset: const Offset(0, -3),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFFF1A6C),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  rank != null ? '#$rank' : 'Unranked',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 12,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              const Text(
                'My Ranking Position',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ],
          ),
          Text(
            '$scoreFormatted pts',
            style: const TextStyle(
              color: Color(0xFFFCD34D),
              fontWeight: FontWeight.w900,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
}
