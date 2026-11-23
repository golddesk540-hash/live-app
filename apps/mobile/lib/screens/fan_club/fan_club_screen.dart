import 'package:flutter/material.dart';
import '../../design/design_fixtures.dart';
import '../../widgets/popo_error_state.dart';
import '../../widgets/popo_empty_state.dart';

/// Popo Live — Section 5 (R3) Fan Club Screen
/// Displays Fan Club header, join/leave controls, member list, and fan club badge.
/// All state mutations update DesignFixtures state only.
class FanClubScreen extends StatefulWidget {
  const FanClubScreen({super.key});

  @override
  State<FanClubScreen> createState() => _FanClubScreenState();
}

class _FanClubScreenState extends State<FanClubScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _selectedClubId = 'club_amina';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _toggleJoin(FixtureFanClub club) {
    final willBeJoined = DesignFixtures.toggleFanClubMembership(club.id);
    setState(() {});
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          willBeJoined
              ? 'Joined ${club.name}! Fan club badge unlocked.'
              : 'Left ${club.name}.',
        ),
        backgroundColor:
            willBeJoined ? const Color(0xFF00E676) : const Color(0xFF1F0E3D),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  String _formatNumber(int number) {
    if (number >= 1000000) {
      return '${(number / 1000000).toStringAsFixed(1)}M';
    } else if (number >= 1000) {
      return '${(number / 1000).toStringAsFixed(1)}K';
    }
    return number.toString();
  }

  @override
  Widget build(BuildContext context) {
    // 1. Error state handling
    if (DesignFixtures.isError) {
      return Scaffold(
        backgroundColor: const Color(0xFF0D041C),
        appBar: AppBar(
          backgroundColor: const Color(0xFF120624),
          title: const Text('Fan Club',
              style:
                  TextStyle(fontWeight: FontWeight.w800, color: Colors.white)),
        ),
        body: Center(
          child: PopoErrorState(
            title: 'Failed to load Fan Clubs',
            message: 'Unable to retrieve club roster and membership data.',
            retryText: 'Retry',
            onRetry: () => setState(() {}),
          ),
        ),
      );
    }

    final clubs = DesignFixtures.fanClubs;

    // 2. Empty state handling
    if (DesignFixtures.isEmpty || clubs.isEmpty) {
      return Scaffold(
        backgroundColor: const Color(0xFF0D041C),
        appBar: AppBar(
          backgroundColor: const Color(0xFF120624),
          title: const Text('Fan Club',
              style:
                  TextStyle(fontWeight: FontWeight.w800, color: Colors.white)),
        ),
        body: Center(
          child: PopoEmptyState(
            icon: Icons.favorite_border_rounded,
            title: 'No Fan Clubs Available',
            message: 'You have not joined any fan clubs yet.',
            actionText: 'Refresh',
            onActionTap: () => setState(() {}),
          ),
        ),
      );
    }

    final activeClub = clubs.firstWhere(
      (c) => c.id == _selectedClubId,
      orElse: () => clubs.first,
    );
    final isJoined = activeClub.isJoined;

    return Scaffold(
      backgroundColor: const Color(0xFF0D041C),
      appBar: AppBar(
        backgroundColor: const Color(0xFF120624),
        elevation: 0,
        title: const Text(
          'Fan Club',
          key: Key('fan_club_appbar_title'),
          style: TextStyle(fontWeight: FontWeight.w800, color: Colors.white),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // 1. Fan Club Main Header Card
          _buildFanClubHeaderCard(activeClub, isJoined),
          const SizedBox(height: 20),

          // 2. Member List Section
          _buildMemberListSection(activeClub),
        ],
      ),
    );
  }

  Widget _buildFanClubHeaderCard(FixtureFanClub club, bool isJoined) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF2B0A42), Color(0xFF16092D)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
            color: const Color(0xFFFF4081).withOpacity(0.4), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFFF4081).withOpacity(0.15),
            blurRadius: 16,
            spreadRadius: 2,
          ),
        ],
      ),
      child: Column(
        children: [
          // Host Avatar & Club Badge
          Stack(
            alignment: Alignment.bottomRight,
            children: [
              Container(
                padding: const EdgeInsets.all(3),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFFFF4081), Color(0xFFFFD700)],
                  ),
                  shape: BoxShape.circle,
                ),
                child: CircleAvatar(
                  radius: 38,
                  backgroundColor: const Color(0xFF16092D),
                  backgroundImage: club.hostAvatar.isNotEmpty
                      ? NetworkImage(club.hostAvatar)
                      : null,
                  child: club.hostAvatar.isEmpty
                      ? const Icon(Icons.person, size: 38, color: Colors.white)
                      : null,
                ),
              ),
              Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(
                  color: Color(0xFFFFD700),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.star, size: 14, color: Colors.black),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Club Name
          Text(
            club.name,
            key: const Key('fan_club_name_text'),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 4),

          // Host Name & Fans Count
          Text(
            'Host: ${club.hostName} · ${_formatNumber(club.fansCount + (isJoined ? 1 : 0))} Fans',
            style: const TextStyle(color: Color(0xFFD8B4FE), fontSize: 13),
          ),
          const SizedBox(height: 10),

          // Fan Club Badge Pill
          Container(
            key: const Key('fan_club_badge_pill'),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFFF1A6C), Color(0xFFFF8C00)],
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFFF1A6C).withOpacity(0.3),
                  blurRadius: 8,
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.auto_awesome, color: Colors.white, size: 14),
                const SizedBox(width: 5),
                Text(
                  '${club.badge} • Lv.${club.level}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.3,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Join / Leave Control Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              key: const Key('fan_club_join_leave_button'),
              style: ElevatedButton.styleFrom(
                backgroundColor: isJoined
                    ? const Color(0xFF1E293B)
                    : const Color(0xFFFF1A6C),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(
                    color:
                        isJoined ? const Color(0xFF00E676) : Colors.transparent,
                    width: 1.2,
                  ),
                ),
                elevation: isJoined ? 0 : 4,
              ),
              onPressed: () => _toggleJoin(club),
              icon: Icon(
                isJoined ? Icons.check_circle_rounded : Icons.favorite_rounded,
                size: 18,
                color: isJoined ? const Color(0xFF00E676) : Colors.white,
              ),
              label: Text(
                isJoined ? 'Joined · Leave Fan Club' : 'Join Fan Club',
                style:
                    const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMemberListSection(FixtureFanClub club) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Fan Club Members (${club.members.length})',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 15,
                fontWeight: FontWeight.bold,
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: const Color(0x22FFD700),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Row(
                children: [
                  Icon(Icons.military_tech_rounded,
                      size: 12, color: Color(0xFFFFD700)),
                  SizedBox(width: 4),
                  Text(
                    'Honor Ranks',
                    style: TextStyle(
                        color: Color(0xFFFFD700),
                        fontSize: 10,
                        fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ...club.members.asMap().entries.map((entry) {
          final index = entry.key;
          final member = entry.value;

          return Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF16092D),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: index == 0
                    ? const Color(0xFFFFD700).withOpacity(0.4)
                    : Colors.purpleAccent.withOpacity(0.15),
              ),
            ),
            child: Row(
              children: [
                // Rank number pill
                Container(
                  width: 24,
                  alignment: Alignment.center,
                  child: Text(
                    '#${index + 1}',
                    style: TextStyle(
                      color: index == 0
                          ? const Color(0xFFFFD700)
                          : (index == 1
                              ? const Color(0xFFE0E0E0)
                              : const Color(0xFFCD7F32)),
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
                const SizedBox(width: 8),

                // Avatar
                CircleAvatar(
                  radius: 20,
                  backgroundColor: const Color(0xFF28124D),
                  backgroundImage: member.avatarUrl.isNotEmpty
                      ? NetworkImage(member.avatarUrl)
                      : null,
                  child: member.avatarUrl.isEmpty
                      ? const Icon(Icons.person, color: Colors.white60)
                      : null,
                ),
                const SizedBox(width: 12),

                // Name & Joined date
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              member.name,
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 5, vertical: 1.5),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFFFF1A6C), Color(0xFFFF8C00)],
                              ),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              'Lv.${member.fanLevel}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        member.joinedDate,
                        style: const TextStyle(
                            color: Color(0xFFD8B4FE), fontSize: 11),
                      ),
                    ],
                  ),
                ),

                // Contribution score
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '${_formatNumber(member.contributionScore)} pts',
                      style: const TextStyle(
                        color: Color(0xFFFFD700),
                        fontWeight: FontWeight.w800,
                        fontSize: 12,
                      ),
                    ),
                    const Text(
                      'Contribution',
                      style: TextStyle(color: Colors.white38, fontSize: 10),
                    ),
                  ],
                ),
              ],
            ),
          );
        }),
      ],
    );
  }
}
