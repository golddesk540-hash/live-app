import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../theme/popo_theme.dart';
import '../../l10n/strings.dart';
import '../../widgets/popo_card.dart';
import '../../widgets/popo_icon_button.dart';
import '../../widgets/popo_loading_indicator.dart';
import '../../api/api.dart';
import '../../auth/auth_state.dart';
import '../../services/host/host_task_service.dart';
import '../daily_tasks/daily_host_tasks_screen.dart';
import '../task_level/task_level_screen.dart';
import '../new_host_pack/new_host_pack_screen.dart';
import '../earning_identity/earning_identity_screen.dart';
import '../host_rankings/host_rankings_screen.dart';
import '../event_leaderboard/event_leaderboard_screen.dart';
import '../agency_management/agency_management_screen.dart';
import 'edit_profile_screen.dart';
import 'public_profile_screen.dart';
import 'settings_screen.dart';

/// Premium Me Profile Screen for authenticated users
class MeScreen extends StatefulWidget {
  const MeScreen({Key? key}) : super(key: key);

  @override
  State<MeScreen> createState() => _MeScreenState();
}

class _MeScreenState extends State<MeScreen> {
  final ProfileService _profileService = ProfileService();

  bool _isLoading = false;
  Map<String, dynamic>? _profileData;
  bool _isHostEligible = false;

  @override
  void initState() {
    super.initState();
    _fetchProfile();
  }

  Future<void> _fetchProfile() async {
    setState(() {
      _isLoading = true;
    });

    final response = await _profileService.getMyProfile();

    if (!mounted) return;

    if (response.isSuccess &&
        response.data is Map &&
        response.data['user'] != null) {
      setState(() {
        _profileData = Map<String, dynamic>.from(response.data['user']);
        _isLoading = false;
      });
    } else {
      // Fallback to AuthState current user if offline or starting up
      setState(() {
        _profileData = AuthState.instance.currentUser;
        _isLoading = false;
      });
    }

    try {
      final eligibility = await HostTaskService.instance.checkEligibility();
      if (mounted) {
        setState(() {
          _isHostEligible = eligibility['eligible'] == true;
        });
      }
    } catch (_) {
      // Keep false if error or viewer
    }
  }

  void _copyPoppoId(String id) {
    Clipboard.setData(ClipboardData(text: id));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(PopoStrings.get('copied_to_clipboard')),
        backgroundColor: PopoTheme.surface,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = _profileData ?? AuthState.instance.currentUser ?? {};
    final nickname = user['nickname']?.toString() ?? 'User';
    final poppoId = user['poppoId']?.toString() ?? user['id']?.toString() ?? '';
    final avatarUrl = user['avatarUrl']?.toString() ?? '';
    final country = user['country']?.toString() ?? 'Pakistan';
    final wealthLevel = user['wealthLevel'] ?? 1;
    final hostLevel = user['hostLevel'] ?? 1;
    final userId = user['id']?.toString() ?? '';

    return Scaffold(
      backgroundColor: PopoTheme.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          PopoStrings.get('profile_title'),
          style: const TextStyle(
            color: PopoTheme.textPrimary,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          PopoIconButton(
            icon: Icons.settings_outlined,
            tooltip: 'Settings',
            onPressed: () {
              Navigator.of(
                context,
              ).push(MaterialPageRoute(builder: (_) => const SettingsScreen()));
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _fetchProfile,
        color: PopoTheme.primary,
        backgroundColor: PopoTheme.surface,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // User Profile Banner Card
              PopoCard(
                padding: const EdgeInsets.all(20),
                hasGlow: true,
                glowColor: PopoTheme.gold,
                child: Column(
                  children: [
                    Row(
                      children: [
                        // Avatar
                        Container(
                          padding: const EdgeInsets.all(2.5),
                          decoration: BoxDecoration(
                            gradient: PopoTheme.goldGradient,
                            shape: BoxShape.circle,
                          ),
                          child: CircleAvatar(
                            radius: 36,
                            backgroundColor: PopoTheme.surface,
                            backgroundImage: avatarUrl.startsWith('http')
                                ? NetworkImage(avatarUrl)
                                : null,
                            child: !avatarUrl.startsWith('http')
                                ? const Icon(
                                    Icons.person,
                                    color: PopoTheme.textSecondary,
                                    size: 36,
                                  )
                                : null,
                          ),
                        ),
                        const SizedBox(width: 16),

                        // User Details
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                nickname,
                                style: const TextStyle(
                                  color: PopoTheme.textPrimary,
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 4),

                              // Copy User ID Pill
                              InkWell(
                                onTap: () => _copyPoppoId(poppoId),
                                borderRadius: BorderRadius.circular(10),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 3,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.06),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        '${PopoStrings.get('user_id')}: $poppoId',
                                        style: const TextStyle(
                                          color: PopoTheme.textSecondary,
                                          fontSize: 11,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                      const Icon(
                                        Icons.copy_rounded,
                                        color: PopoTheme.cyan,
                                        size: 12,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(height: 6),

                              // Country Pill
                              Row(
                                children: [
                                  const Icon(
                                    Icons.location_on_rounded,
                                    color: PopoTheme.gold,
                                    size: 13,
                                  ),
                                  const SizedBox(width: 3),
                                  Text(
                                    country,
                                    style: const TextStyle(
                                      color: PopoTheme.textSecondary,
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),

                        // Edit Button
                        IconButton(
                          icon: const Icon(
                            Icons.edit_outlined,
                            color: PopoTheme.cyan,
                            size: 20,
                          ),
                          tooltip: PopoStrings.get('edit_profile'),
                          onPressed: () async {
                            final updated = await Navigator.of(context)
                                .push<bool>(
                                  MaterialPageRoute(
                                    builder: (_) => const EditProfileScreen(),
                                  ),
                                );
                            if (updated == true) {
                              _fetchProfile();
                            }
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),

                    // Badges Row
                    Row(
                      children: [
                        _buildBadge(
                          label:
                              '${PopoStrings.get('wealth_level')} $wealthLevel',
                          color: PopoTheme.gold,
                          icon: Icons.diamond_rounded,
                        ),
                        const SizedBox(width: 8),
                        _buildBadge(
                          label: '${PopoStrings.get('host_level')} $hostLevel',
                          color: PopoTheme.primary,
                          icon: Icons.star_rounded,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Wallet & Top-up Card
              PopoCard(
                padding: const EdgeInsets.all(16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildWalletStat(
                      title: PopoStrings.get('coins'),
                      value: '0',
                      icon: Icons.monetization_on_rounded,
                      color: PopoTheme.gold,
                    ),
                    Container(
                      width: 1,
                      height: 36,
                      color: PopoTheme.borderSubtle,
                    ),
                    _buildWalletStat(
                      title: PopoStrings.get('points'),
                      value: '0',
                      icon: Icons.stars_rounded,
                      color: PopoTheme.cyan,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Creator & Host Center (Strictly visible only for eligible hosts)
              if (_isHostEligible) ...[
                PopoCard(
                  padding: const EdgeInsets.all(16),
                  hasGlow: true,
                  glowColor: PopoTheme.primary,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: const [
                              Icon(
                                Icons.workspace_premium_rounded,
                                color: PopoTheme.primary,
                                size: 20,
                              ),
                              SizedBox(width: 8),
                              Text(
                                'Host & Creator Center',
                                style: TextStyle(
                                  color: PopoTheme.textPrimary,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: PopoTheme.primary.withOpacity(0.18),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Text(
                              'ACTIVE HOST',
                              style: TextStyle(
                                color: PopoTheme.primary,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          Expanded(
                            child: _buildHostToolButton(
                              icon: Icons.checklist_rounded,
                              label: 'Daily Tasks',
                              color: const Color(0xFFFF1A6C),
                              onTap: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (_) => const DailyHostTasksScreen(),
                                  ),
                                );
                              },
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: _buildHostToolButton(
                              icon: Icons.trending_up_rounded,
                              label: 'Task Level',
                              color: const Color(0xFFFFC107),
                              onTap: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (_) => const TaskLevelScreen(),
                                  ),
                                );
                              },
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: _buildHostToolButton(
                              icon: Icons.card_giftcard_rounded,
                              label: 'Starter Pack',
                              color: const Color(0xFF00E5FF),
                              onTap: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (_) => const NewHostPackScreen(),
                                  ),
                                );
                              },
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: _buildHostToolButton(
                              icon: Icons.verified_user_rounded,
                              label: 'Earning KYC',
                              color: const Color(0xFF34D399),
                              onTap: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (_) => const EarningIdentityScreen(),
                                  ),
                                );
                              },
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: _buildHostToolButton(
                              icon: Icons.leaderboard_rounded,
                              label: 'Rankings',
                              color: const Color(0xFFFFD166),
                              onTap: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (_) => const HostRankingsScreen(),
                                  ),
                                );
                              },
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: _buildHostToolButton(
                              icon: Icons.emoji_events_rounded,
                              label: 'Leaderboard',
                              color: const Color(0xFFF97316),
                              onTap: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (_) => const EventLeaderboardScreen(),
                                  ),
                                );
                              },
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: _buildHostToolButton(
                              icon: Icons.business_rounded,
                              label: 'Agency',
                              color: const Color(0xFF00E5FF),
                              onTap: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (_) => const AgencyManagementScreen(),
                                  ),
                                );
                              },
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Quick Actions List
              PopoCard(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    ListTile(
                      leading: const Icon(
                        Icons.leaderboard_outlined,
                        color: Color(0xFFFFD166),
                      ),
                      title: const Text(
                        'Host Rankings',
                        style: TextStyle(
                          color: PopoTheme.textPrimary,
                          fontSize: 14,
                        ),
                      ),
                      trailing: const Icon(
                        Icons.chevron_right_rounded,
                        color: PopoTheme.textSecondary,
                      ),
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => const HostRankingsScreen(),
                          ),
                        );
                      },
                    ),
                    const Divider(color: PopoTheme.borderSubtle, height: 1),
                    ListTile(
                      leading: const Icon(
                        Icons.emoji_events_outlined,
                        color: Color(0xFFF97316),
                      ),
                      title: const Text(
                        'Event Leaderboard',
                        style: TextStyle(
                          color: PopoTheme.textPrimary,
                          fontSize: 14,
                        ),
                      ),
                      trailing: const Icon(
                        Icons.chevron_right_rounded,
                        color: PopoTheme.textSecondary,
                      ),
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => const EventLeaderboardScreen(),
                          ),
                        );
                      },
                    ),
                    if (_isHostEligible || user['role'] == 'agency_admin') ...[
                      const Divider(color: PopoTheme.borderSubtle, height: 1),
                      ListTile(
                        leading: const Icon(
                          Icons.business_center_outlined,
                          color: Color(0xFF00E5FF),
                        ),
                        title: const Text(
                          'Agency Management',
                          style: TextStyle(
                            color: PopoTheme.textPrimary,
                            fontSize: 14,
                          ),
                        ),
                        trailing: const Icon(
                          Icons.chevron_right_rounded,
                          color: PopoTheme.textSecondary,
                        ),
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => const AgencyManagementScreen(),
                            ),
                          );
                        },
                      ),
                    ],
                    const Divider(color: PopoTheme.borderSubtle, height: 1),
                    ListTile(
                      leading: const Icon(
                        Icons.badge_outlined,
                        color: PopoTheme.primary,
                      ),
                      title: Text(
                        PopoStrings.get('public_profile'),
                        style: const TextStyle(
                          color: PopoTheme.textPrimary,
                          fontSize: 14,
                        ),
                      ),
                      trailing: const Icon(
                        Icons.chevron_right_rounded,
                        color: PopoTheme.textSecondary,
                      ),
                      onTap: () {
                        if (userId.isNotEmpty) {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) =>
                                  PublicProfileScreen(userId: userId),
                            ),
                          );
                        }
                      },
                    ),
                    const Divider(color: PopoTheme.borderSubtle, height: 1),
                    ListTile(
                      leading: const Icon(
                        Icons.edit_note_rounded,
                        color: PopoTheme.cyan,
                      ),
                      title: Text(
                        PopoStrings.get('edit_profile'),
                        style: const TextStyle(
                          color: PopoTheme.textPrimary,
                          fontSize: 14,
                        ),
                      ),
                      trailing: const Icon(
                        Icons.chevron_right_rounded,
                        color: PopoTheme.textSecondary,
                      ),
                      onTap: () async {
                        final updated = await Navigator.of(context).push<bool>(
                          MaterialPageRoute(
                            builder: (_) => const EditProfileScreen(),
                          ),
                        );
                        if (updated == true) {
                          _fetchProfile();
                        }
                      },
                    ),
                    const Divider(color: PopoTheme.borderSubtle, height: 1),
                    ListTile(
                      leading: const Icon(
                        Icons.settings_outlined,
                        color: PopoTheme.textSecondary,
                      ),
                      title: Text(
                        PopoStrings.get('settings'),
                        style: const TextStyle(
                          color: PopoTheme.textPrimary,
                          fontSize: 14,
                        ),
                      ),
                      trailing: const Icon(
                        Icons.chevron_right_rounded,
                        color: PopoTheme.textSecondary,
                      ),
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => const SettingsScreen(),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBadge({
    required String label,
    required Color color,
    required IconData icon,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(0.35)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 14),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 11,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWalletStat({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: color, size: 24),
        const SizedBox(width: 10),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              value,
              style: const TextStyle(
                color: PopoTheme.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              title,
              style: const TextStyle(
                color: PopoTheme.textSecondary,
                fontSize: 11,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildHostToolButton({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withOpacity(0.25)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 6),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
