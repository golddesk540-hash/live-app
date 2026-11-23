import 'package:flutter/material.dart';
import '../profile/public_profile_screen.dart';
import '../../design/design_fixtures.dart';

/// Popo Live — Phase 4 Module 8: Host Rankings Screen
/// Creator Leaderboard with Daily, Weekly, and Monthly Periods, Podium presentation, and Own Rank.
class HostRankingsScreen extends StatefulWidget {
  const HostRankingsScreen({super.key});

  @override
  State<HostRankingsScreen> createState() => _HostRankingsScreenState();
}

class _HostRankingsScreenState extends State<HostRankingsScreen> {
  String _mainSection = 'rankings'; // 'rankings' or 'events'
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
      if (DesignFixtures.isError) {
        throw const DesignFixtureException(
          message: 'Leaderboard database timeout [ERR_RANKINGS_TIMEOUT]',
        );
      }

      final hosts = DesignFixtures.hostRankings;
      if (!mounted) return;

      setState(() {
        if (DesignFixtures.isEmpty || hosts.isEmpty) {
          _rankings = [];
          _podium = null;
          _myRank = null;
        } else {
          _rankings = hosts
              .map((h) => {
                    'rank': h.rank,
                    'hostNickname': h.hostNickname,
                    'avatarUrl': h.avatarUrl,
                    'diamondsEarned': h.diamondsEarned,
                    'country': h.country,
                    'countryFlag': h.countryFlag,
                    'level': h.level,
                    'userId':
                        'u_${h.hostNickname.toLowerCase().replaceAll(' ', '_')}',
                  })
              .toList();

          if (hosts.length >= 3) {
            _podium = {
              'first': {
                'hostNickname': hosts[0].hostNickname,
                'avatarUrl': hosts[0].avatarUrl,
                'diamondsEarned': hosts[0].diamondsEarned,
                'level': hosts[0].level,
                'userId': 'u_amina_noor',
              },
              'second': {
                'hostNickname': hosts[1].hostNickname,
                'avatarUrl': hosts[1].avatarUrl,
                'diamondsEarned': hosts[1].diamondsEarned,
                'level': hosts[1].level,
                'userId': 'u_sana_ali',
              },
              'third': {
                'hostNickname': hosts[2].hostNickname,
                'avatarUrl': hosts[2].avatarUrl,
                'diamondsEarned': hosts[2].diamondsEarned,
                'level': hosts[2].level,
                'userId': 'u_zainab_khan',
              },
            };
          }

          _myRank = {
            'rank': 1,
            'hostNickname': 'Amina Noor',
            'avatarUrl':
                'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
            'diamondsEarned': 1850000,
            'level': 18,
            'gapToNext': 0,
          };
        }
        _isLoading = false;
      });
      return;
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
            // Main Section Tabs: Host Rankings vs Event Board (Section 5, R3)
            Container(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              color: const Color(0xFF120624),
              child: Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _mainSection = 'rankings'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 9),
                        decoration: BoxDecoration(
                          color: _mainSection == 'rankings'
                              ? const Color(0xFFFF1A6C)
                              : Colors.white.withOpacity(0.06),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Center(
                          child: Text(
                            'Host Rankings',
                            style: TextStyle(
                              color: _mainSection == 'rankings'
                                  ? Colors.white
                                  : Colors.white60,
                              fontWeight: FontWeight.w800,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _mainSection = 'events'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 9),
                        decoration: BoxDecoration(
                          color: _mainSection == 'events'
                              ? const Color(0xFFFF1A6C)
                              : Colors.white.withOpacity(0.06),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Center(
                          child: Text(
                            'Event Board',
                            style: TextStyle(
                              color: _mainSection == 'events'
                                  ? Colors.white
                                  : Colors.white60,
                              fontWeight: FontWeight.w800,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            if (_mainSection == 'rankings') ...[
              // Period Selector Tabs
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
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
            ] else ...[
              // Event Board Section
              Expanded(
                child: _buildEventBoardView(),
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _formatDiamonds(int count) {
    if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    } else if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }

  Widget _buildEventBoardView() {
    List<FixtureEventRanking> events = [];
    try {
      events = DesignFixtures.eventRankings;
    } catch (_) {
      events = [];
    }

    if (events.isEmpty) {
      return const Center(
        child: Text(
          'No event rankings available',
          style: TextStyle(color: Colors.white54, fontSize: 13),
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Event Banner
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF381559), Color(0xFF1A0A33)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFFFD700).withOpacity(0.4)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text(
                      'ACTIVE EVENT',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 9.5,
                          fontWeight: FontWeight.w900),
                    ),
                  ),
                  const Text(
                    'Ends in 5 days',
                    style: TextStyle(
                        color: Color(0xFFFFD700),
                        fontSize: 11,
                        fontWeight: FontWeight.w700),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                events.first.eventName,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: 18,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Prize Pool: 10,000,000 Diamond Points + Star Trophy',
                style: TextStyle(color: Color(0xFFD8B4FE), fontSize: 12),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        const Text(
          'Event Leaderboard Standings',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w800,
            fontSize: 16,
          ),
        ),
        const SizedBox(height: 10),
        ...events.map((ev) {
          final isTop3 = ev.rank <= 3;
          final rankColor = ev.rank == 1
              ? const Color(0xFFFFD700)
              : (ev.rank == 2
                  ? const Color(0xFFE2E8F0)
                  : (ev.rank == 3 ? const Color(0xFFCD7F32) : Colors.white60));

          return Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFF16092D),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isTop3
                    ? rankColor.withOpacity(0.4)
                    : Colors.white.withOpacity(0.06),
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: rankColor.withOpacity(0.18),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      '#${ev.rank}',
                      style: TextStyle(
                          color: rankColor,
                          fontWeight: FontWeight.w900,
                          fontSize: 13),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                ClipOval(
                  child: Image.network(
                    ev.avatarUrl,
                    width: 44,
                    height: 44,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      width: 44,
                      height: 44,
                      color: Colors.white12,
                      child: const Icon(Icons.person, color: Colors.white38),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        ev.hostNickname,
                        style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                            fontSize: 14),
                      ),
                      const SizedBox(height: 3),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 1.5),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFF1A6C).withOpacity(0.2),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          ev.badgeTitle,
                          style: const TextStyle(
                              color: Color(0xFFFF1A6C),
                              fontSize: 9.5,
                              fontWeight: FontWeight.w800),
                        ),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Row(
                      children: [
                        const Text('💎', style: TextStyle(fontSize: 12)),
                        const SizedBox(width: 4),
                        Text(
                          _formatDiamonds(ev.eventPoints),
                          style: const TextStyle(
                            color: Color(0xFF00E5FF),
                            fontWeight: FontWeight.w900,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                    const Text('Event Pts',
                        style: TextStyle(color: Colors.white38, fontSize: 10)),
                  ],
                ),
              ],
            ),
          );
        }).toList(),
      ],
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
              const Icon(Icons.error_outline_rounded,
                  color: Color(0xFFFF1A6C), size: 48),
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
    final remainingRankings =
        _rankings.length > 3 ? _rankings.sublist(3) : <dynamic>[];

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
          final String scoreFormatted =
              item['scoreFormatted']?.toString() ?? '0';
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
                border:
                    Border.all(color: Colors.purpleAccent.withOpacity(0.18)),
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
                    backgroundImage:
                        avatar.startsWith('http') ? NetworkImage(avatar) : null,
                    child: !avatar.startsWith('http')
                        ? const Icon(Icons.person,
                            color: Colors.white70, size: 20)
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
                              style: const TextStyle(
                                  color: Color(0xFFBBA9D6), fontSize: 11),
                            ),
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 5, vertical: 1),
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

  Widget _podiumColumn(
      dynamic host, int rank, Color color, double avatarRadius) {
    final String name = host['nickname'] ?? 'Host';
    final String score = host['scoreFormatted']?.toString() ?? '0';
    final String avatar = host['avatarUrl'] ?? '';

    return InkWell(
      onTap: () => _openProfile(host['id'] ?? ''),
      child: Column(
        children: [
          // Crown for 1st
          if (rank == 1)
            const Icon(Icons.workspace_premium_rounded,
                color: Color(0xFFFFC107), size: 28)
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
                  backgroundImage:
                      avatar.startsWith('http') ? NetworkImage(avatar) : null,
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
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
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
