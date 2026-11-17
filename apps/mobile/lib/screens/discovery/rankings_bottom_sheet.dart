import 'package:flutter/material.dart';

import '../../theme/popo_theme.dart';
import '../../l10n/strings.dart';
import '../../models/models.dart';
import '../../repositories/discovery_repository.dart';
import '../../widgets/popo_loading_indicator.dart';
import '../../widgets/popo_empty_state.dart';
import '../../widgets/popo_icon_button.dart';
import '../profile/public_profile_screen.dart';
import '../host_rankings/host_rankings_screen.dart';
import '../event_leaderboard/event_leaderboard_screen.dart';
import '../agency_management/agency_management_screen.dart';
import '../notices/system_notices_screen.dart';

/// Modal Bottom Sheet displaying Leaderboards and Ranking Doors
class RankingsBottomSheet extends StatefulWidget {
  const RankingsBottomSheet({Key? key}) : super(key: key);

  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const RankingsBottomSheet(),
    );
  }

  @override
  State<RankingsBottomSheet> createState() => _RankingsBottomSheetState();
}

class _RankingsBottomSheetState extends State<RankingsBottomSheet> {
  final DiscoveryRepository _repository = DiscoveryRepository.instance;

  List<RankingDoor> _doors = [];
  RankingPodium? _podium;
  List<RankingUser> _rankings = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchRankingsData();
  }

  Future<void> _fetchRankingsData() async {
    setState(() {
      _isLoading = true;
    });

    final doorsFuture = _repository.fetchRankDoors();
    final previewFuture = _repository.fetchRankingsPreview();

    final results = await Future.wait([doorsFuture, previewFuture]);
    if (!mounted) return;

    final doors = results[0] as List<RankingDoor>;
    final preview = results[1] as RankingsPreviewResult;

    setState(() {
      _doors = doors;
      _podium = preview.podium;
      _rankings = preview.rankings;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;

    return Container(
      height: screenHeight * 0.85,
      decoration: const BoxDecoration(
        color: PopoTheme.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Drag Handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 10, bottom: 8),
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: PopoTheme.borderSubtle,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(
              children: [
                const Icon(
                  Icons.emoji_events_rounded,
                  color: PopoTheme.gold,
                  size: 24,
                ),
                const SizedBox(width: 10),
                Text(
                  PopoStrings.get('rankings_title'),
                  style: const TextStyle(
                    color: PopoTheme.textPrimary,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                PopoIconButton(
                  icon: Icons.close_rounded,
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),

          const Divider(color: PopoTheme.borderSubtle, height: 1),

          // Content
          Expanded(
            child: _isLoading
                ? const Center(
                    child: PopoLoadingIndicator(color: PopoTheme.gold),
                  )
                : _buildContent(),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    return ListView(
      padding: const EdgeInsets.symmetric(vertical: 12),
      children: [
        // 1. Ranking Navigation Doors
        if (_doors.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: _doors.map((door) => _buildDoorItem(door)).toList(),
            ),
          ),
          const SizedBox(height: 20),
        ],

        // 2. Leaderboard Podium (1st, 2nd, 3rd)
        if (_podium != null) ...[
          _buildPodiumView(_podium!),
          const SizedBox(height: 16),
        ],

        // 3. Top Rankings Leaderboard List
        if (_rankings.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: const Text(
              'Leaderboard',
              style: TextStyle(
                color: PopoTheme.textPrimary,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          ..._rankings.skip(3).map((r) => _buildRankItem(r)),
        ] else if (_podium == null && _doors.isEmpty) ...[
          PopoEmptyState(
            title: 'No Rankings Available',
            subtitle: 'Leaderboard scores will update during active campaigns.',
            icon: Icons.military_tech_outlined,
          ),
        ],
      ],
    );
  }

  Widget _buildDoorItem(RankingDoor door) {
    IconData icon;
    Color color;
    switch (door.iconType) {
      case 'event':
        icon = Icons.celebration_rounded;
        color = const Color(0xFFA855F7);
        break;
      case 'rank':
        icon = Icons.emoji_events_rounded;
        color = const Color(0xFFF59E0B);
        break;
      case 'agency':
        icon = Icons.workspace_premium_rounded;
        color = const Color(0xFF0EA5E9);
        break;
      case 'notice':
      default:
        icon = Icons.campaign_rounded;
        color = const Color(0xFFEC4899);
        break;
    }

    return Expanded(
      child: GestureDetector(
        onTap: () {
          Navigator.of(context).pop();
          if (door.id == 'event') {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const EventLeaderboardScreen()),
            );
          } else if (door.id == 'rank') {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const HostRankingsScreen()),
            );
          } else if (door.id == 'agency') {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const AgencyManagementScreen()),
            );
          } else if (door.id == 'notice') {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const SystemNoticesScreen()),
            );
          }
        },
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 4),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: PopoTheme.surfaceLight,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: color.withOpacity(0.35)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Icon(icon, color: color, size: 24),
                  if (door.hasNotificationDot)
                    Positioned(
                      right: -3,
                      top: -3,
                      child: Container(
                        width: 7,
                        height: 7,
                        decoration: const BoxDecoration(
                          color: PopoTheme.primary,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                door.title,
                style: const TextStyle(
                  color: PopoTheme.textPrimary,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPodiumView(RankingPodium podium) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
      decoration: BoxDecoration(
        color: PopoTheme.surfaceLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: PopoTheme.borderSubtle),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // 2nd Place (Left)
          Expanded(
            child: _buildPodiumColumn(
              user: podium.second,
              rank: 2,
              color: const Color(0xFF94A3B8), // Silver
              badge: '2',
              avatarSize: 26,
            ),
          ),

          // 1st Place (Center - Prominent)
          Expanded(
            child: _buildPodiumColumn(
              user: podium.first,
              rank: 1,
              color: PopoTheme.gold, // Gold
              badge: '1',
              avatarSize: 34,
            ),
          ),

          // 3rd Place (Right)
          Expanded(
            child: _buildPodiumColumn(
              user: podium.third,
              rank: 3,
              color: const Color(0xFFB45309), // Bronze
              badge: '3',
              avatarSize: 26,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPodiumColumn({
    required RankingUser? user,
    required int rank,
    required Color color,
    required String badge,
    required double avatarSize,
  }) {
    if (user == null) {
      return const SizedBox.shrink();
    }

    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => PublicProfileScreen(
              userId: user.id.isNotEmpty ? user.id : user.poppoId,
            ),
          ),
        );
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Crown / Star
          if (rank == 1)
            const Icon(Icons.star_rounded, color: PopoTheme.gold, size: 20),

          // Avatar with Rank Ring
          Stack(
            alignment: Alignment.center,
            clipBehavior: Clip.none,
            children: [
              Container(
                padding: const EdgeInsets.all(2.5),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: color, width: 2),
                ),
                child: CircleAvatar(
                  radius: avatarSize,
                  backgroundImage:
                      user.avatarUrl.isNotEmpty &&
                          !user.avatarUrl.contains('default.png') &&
                          user.avatarUrl.startsWith('http')
                      ? NetworkImage(user.avatarUrl)
                      : null,
                  backgroundColor: PopoTheme.surface,
                  child:
                      (user.avatarUrl.isEmpty ||
                          user.avatarUrl.contains('default.png') ||
                          !user.avatarUrl.startsWith('http'))
                      ? Text(
                          user.nickname.isNotEmpty
                              ? user.nickname[0].toUpperCase()
                              : 'P',
                          style: TextStyle(
                            color: color,
                            fontWeight: FontWeight.bold,
                            fontSize: avatarSize * 0.7,
                          ),
                        )
                      : null,
                ),
              ),
              Positioned(
                bottom: -5,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 1,
                  ),
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    badge,
                    style: const TextStyle(
                      color: Colors.black,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 10),

          // Nickname
          Text(
            user.nickname,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: PopoTheme.textPrimary,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),

          const SizedBox(height: 2),

          // Score
          Text(
            '🪙 ${user.scoreFormatted}',
            style: TextStyle(
              color: color,
              fontSize: 11,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRankItem(RankingUser user) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 2),
      leading: SizedBox(
        width: 32,
        child: Text(
          user.rank.toString(),
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: PopoTheme.textSecondary,
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      title: Row(
        children: [
          CircleAvatar(
            radius: 16,
            backgroundImage:
                user.avatarUrl.isNotEmpty &&
                    !user.avatarUrl.contains('default.png') &&
                    user.avatarUrl.startsWith('http')
                ? NetworkImage(user.avatarUrl)
                : null,
            backgroundColor: PopoTheme.surfaceLight,
            child:
                (user.avatarUrl.isEmpty ||
                    user.avatarUrl.contains('default.png') ||
                    !user.avatarUrl.startsWith('http'))
                ? Text(
                    user.nickname.isNotEmpty
                        ? user.nickname[0].toUpperCase()
                        : 'P',
                    style: const TextStyle(
                      color: PopoTheme.cyan,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  )
                : null,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              user.nickname,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: PopoTheme.textPrimary,
                fontSize: 13,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
      subtitle: Padding(
        padding: const EdgeInsets.only(left: 42),
        child: Text(
          'ID: ${user.poppoId}',
          style: const TextStyle(color: PopoTheme.textTertiary, fontSize: 11),
        ),
      ),
      trailing: Text(
        '🪙 ${user.scoreFormatted}',
        style: const TextStyle(
          color: PopoTheme.gold,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
      onTap: () {
        final id = user.id.isNotEmpty ? user.id : user.poppoId;
        Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => PublicProfileScreen(userId: id)),
        );
      },
    );
  }
}
