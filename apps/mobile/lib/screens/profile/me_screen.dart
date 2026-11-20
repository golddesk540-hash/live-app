import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../theme/popo_theme.dart';
import '../../l10n/strings.dart';
import '../../design/design_fixtures.dart';
import '../../api/api_config.dart';
import '../../api/services/economy_api_service.dart';
import '../../api/services/vip_api_service.dart';
import '../../api/services/store_api_service.dart';
import '../../widgets/popo_card.dart';
import '../../widgets/popo_icon_button.dart';
import '../../widgets/popo_empty_state.dart';
import '../../widgets/popo_error_state.dart';
import '../daily_tasks/daily_host_tasks_screen.dart';
import '../host_rankings/host_rankings_screen.dart';
import '../store/store_screen.dart';
import '../invites/invites_screen.dart';
import '../task_level/task_level_screen.dart';
import '../fan_club/fan_club_screen.dart';
import '../live/live_rules_screen.dart';
import '../agency_management/agency_management_screen.dart';
import '../event_leaderboard/event_leaderboard_screen.dart';
import '../earning_identity/earning_identity_screen.dart';
import 'edit_profile_screen.dart';
import 'public_profile_screen.dart';
import 'settings_screen.dart';

/// Complete Me / Profile Screen for Popo Live (Phase 5 - D4 Prompt 2)
/// Integrates all 17 layout sections, 8 feature icons, 2 policy banners,
/// Streamer Center, Builder Center, lower sections, and D0 design fixtures.
class MeScreen extends StatefulWidget {
  const MeScreen({super.key});

  @override
  State<MeScreen> createState() => _MeScreenState();
}

class _MeScreenState extends State<MeScreen> {
  int? _liveCoinsBalance;
  int? _livePointsBalance;
  int? _liveVipLevel;
  String? _liveVipLabel;
  int? _liveWealthLevel;
  int? _liveShiningLevel;
  Map<String, dynamic>? _liveEquippedLoadout;

  @override
  void initState() {
    super.initState();
    if (ApiConfig.useEconomyApi) {
      _loadLiveEconomyBalances();
    }
    if (ApiConfig.useVipApi) {
      _loadLiveVipAndHonor();
    }
    if (ApiConfig.useStoreApi) {
      _loadLiveEquippedLoadout();
    }
  }

  Future<void> _loadLiveEquippedLoadout() async {
    try {
      final storeService = StoreApiService.instance;
      final res = await storeService.fetchEquippedProfile(DesignFixtures.currentUserProfile.userId);
      if (res.isSuccess && res.data != null && mounted) {
        setState(() {
          _liveEquippedLoadout = res.data['equipped'] as Map<String, dynamic>?;
        });
      }
    } catch (_) {}
  }

  Future<void> _loadLiveVipAndHonor() async {
    try {
      final vipService = VipApiService.instance;
      final vipRes = await vipService.fetchActiveVip();
      final honorRes = await vipService.fetchHonorLevels('me');

      if (mounted) {
        setState(() {
          if (vipRes.isSuccess && vipRes.data != null) {
            final vip = vipRes.data!['vip'] as Map<String, dynamic>?;
            if (vip != null) {
              _liveVipLevel = (vip['vipLevel'] as num?)?.toInt();
              _liveVipLabel = vip['badgeLabel']?.toString();
            }
          }
          if (honorRes.isSuccess && honorRes.data != null) {
            final wealth = honorRes.data!['wealth'] as Map<String, dynamic>?;
            if (wealth != null) {
              _liveWealthLevel = (wealth['level'] as num?)?.toInt();
            }
            final shining = honorRes.data!['shining'] as Map<String, dynamic>?;
            if (shining != null) {
              _liveShiningLevel = (shining['level'] as num?)?.toInt();
            }
          }
        });
      }
    } catch (_) {}
  }

  Future<void> _loadLiveEconomyBalances() async {
    try {
      final economyService = EconomyApiService();
      final coinRes = await economyService.getCoinBalance();
      final pointsRes = await economyService.getPointsBalance();

      if (mounted) {
        setState(() {
          if (coinRes.isSuccess && coinRes.data != null) {
            _liveCoinsBalance = (coinRes.data['coins'] as num?)?.toInt();
          }
          if (pointsRes.isSuccess && pointsRes.data != null) {
            _livePointsBalance = (pointsRes.data['points'] as num?)?.toInt() ??
                (pointsRes.data['diamondPoints'] as num?)?.toInt();
          }
        });
      }
    } catch (_) {}
  }

  // Helper to format large numbers with commas
  String _formatNumber(int number) {
    final str = number.toString();
    final regExp = RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))');
    return str.replaceAllMapped(regExp, (Match m) => '${m[1]},');
  }

  // Copy User ID with clipboard and feedback snackbar
  void _copyPoppoId(String id) {
    Clipboard.setData(ClipboardData(text: id));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('ID copied to clipboard: $id'),
        backgroundColor: PopoTheme.surface,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  // Preview modal sheet for QR scan entry point
  void _showScanModal(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Container(
        key: const Key('me_scan_sheet'),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
        decoration: const BoxDecoration(
          color: Color(0xFF1B1829),
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          border: Border(
            top: BorderSide(color: Color(0x33FF1768), width: 1.5),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 44,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Scan QR Code',
                  style: TextStyle(
                    color: PopoTheme.textPrimary,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded,
                      color: PopoTheme.textSecondary),
                  onPressed: () => Navigator.of(ctx).pop(),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.5),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: PopoTheme.primary, width: 2),
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  const Icon(
                    Icons.qr_code_scanner_rounded,
                    size: 80,
                    color: PopoTheme.primary,
                  ),
                  Positioned(
                    bottom: 12,
                    child: Text(
                      'Align QR inside the box',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.7),
                        fontSize: 11,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildSheetAction(Icons.flash_on_rounded, 'Torch'),
                _buildSheetAction(Icons.photo_library_rounded, 'Album'),
                _buildSheetAction(Icons.qr_code_rounded, 'My QR Code'),
              ],
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildSheetAction(IconData icon, String label) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: PopoTheme.surface,
            shape: BoxShape.circle,
            border: Border.all(color: PopoTheme.borderSubtle),
          ),
          child: Icon(icon, color: PopoTheme.textPrimary, size: 20),
        ),
        const SizedBox(height: 6),
        Text(
          label,
          style: const TextStyle(
            color: PopoTheme.textSecondary,
            fontSize: 11,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  // Interactive sheet preview for profile counts
  void _showCountPreview(String title, int count, String description) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
        decoration: const BoxDecoration(
          color: Color(0xFF1B1829),
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          border: Border(
            top: BorderSide(color: Color(0x33FF1768), width: 1.5),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '$title (${_formatNumber(count)})',
                  style: const TextStyle(
                    color: PopoTheme.textPrimary,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded,
                      color: PopoTheme.textSecondary),
                  onPressed: () => Navigator.of(ctx).pop(),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              description,
              style: const TextStyle(
                color: PopoTheme.textSecondary,
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: PopoTheme.surface,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: PopoTheme.borderSubtle),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline_rounded,
                      color: PopoTheme.primary, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Detailed $title list module will be available in Phase D5.',
                      style: const TextStyle(
                          color: PopoTheme.textPrimary, fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  // Interactive sheet preview for Coins
  void _showCoinsPreview(int balance) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
        decoration: const BoxDecoration(
          color: Color(0xFF1B1829),
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          border: Border(
            top: BorderSide(color: Color(0x33FFD700), width: 1.5),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Text('🪙', style: TextStyle(fontSize: 22)),
                    SizedBox(width: 8),
                    Text(
                      'Popo Coins Wallet',
                      style: TextStyle(
                        color: PopoTheme.textPrimary,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded,
                      color: PopoTheme.textSecondary),
                  onPressed: () => Navigator.of(ctx).pop(),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF2A200B), Color(0xFF1E1706)],
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0x66FFD700)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Current Balance',
                        style: TextStyle(color: Colors.white60, fontSize: 12),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${_formatNumber(balance)} Coins',
                        style: const TextStyle(
                          color: Color(0xFFFFD700),
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      gradient: PopoTheme.goldGradient,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      'Recharge',
                      style: TextStyle(
                        color: Colors.black,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Coins are used for sending gifts to hosts and unlocking interactive effects. (Local fixture data demonstration)',
              style: TextStyle(color: PopoTheme.textSecondary, fontSize: 12),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  // Interactive sheet preview for Points
  void _showPointsPreview(int balance) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
        decoration: const BoxDecoration(
          color: Color(0xFF1B1829),
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          border: Border(
            top: BorderSide(color: Color(0x3300E5FF), width: 1.5),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Text('💎', style: TextStyle(fontSize: 22)),
                    SizedBox(width: 8),
                    Text(
                      'Host Points & Earnings',
                      style: TextStyle(
                        color: PopoTheme.textPrimary,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded,
                      color: PopoTheme.textSecondary),
                  onPressed: () => Navigator.of(ctx).pop(),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF09202E), Color(0xFF06141D)],
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0x6600E5FF)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Points Balance',
                        style: TextStyle(color: Colors.white60, fontSize: 12),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${_formatNumber(balance)} Points',
                        style: const TextStyle(
                          color: Color(0xFF00E5FF),
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF00E5FF),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      'Exchange',
                      style: TextStyle(
                        color: Colors.black,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Points represent earnings from live broadcasting gifts and can be exchanged for coins or withdrawn. (Local fixture data demonstration)',
              style: TextStyle(color: PopoTheme.textSecondary, fontSize: 12),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  // Interactive sheet preview for VIP
  void _showVipPreview(FixtureUserProfile user) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
        decoration: const BoxDecoration(
          color: Color(0xFF1B1829),
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          border: Border(
            top: BorderSide(color: Color(0x44FFD700), width: 1.5),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Text('👑', style: TextStyle(fontSize: 22)),
                    const SizedBox(width: 8),
                    Text(
                      'VIP ${user.vipLevel} Privileges',
                      style: const TextStyle(
                        color: Color(0xFFFFD700),
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded,
                      color: PopoTheme.textSecondary),
                  onPressed: () => Navigator.of(ctx).pop(),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              'Status: ${user.vipStatus}',
              style: const TextStyle(
                color: PopoTheme.textPrimary,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 16),
            _buildVipPerkRow(
                Icons.auto_awesome_rounded, 'Exclusive Room Entrance Banner'),
            _buildVipPerkRow(
                Icons.military_tech_rounded, 'Animated Luxury Avatar Ring'),
            _buildVipPerkRow(
                Icons.chat_bubble_rounded, 'Distinctive Gold Chat Bubble'),
            _buildVipPerkRow(
                Icons.card_giftcard_rounded, 'Monthly VIP Privilege Gift Pack'),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildVipPerkRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: const BoxDecoration(
              color: Color(0x22FFD700),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: const Color(0xFFFFD700), size: 16),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style:
                  const TextStyle(color: PopoTheme.textPrimary, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // PROMPT 2: DESTINATIONS FOR THE 8 ICONS & LOWER SECTIONS
  // ---------------------------------------------------------------------------

  // Destination 1: Guardian Angels & Shield Protection
  void _openGuardianDestination(BuildContext context) {
    final guardians = DesignFixtures.guardians;

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        key: const Key('me_guardian_destination'),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
        decoration: const BoxDecoration(
          color: Color(0xFF1B1829),
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          border: Border(top: BorderSide(color: Color(0x44FF9100), width: 1.5)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                const Icon(Icons.shield_rounded,
                    color: Color(0xFFFF9100), size: 24),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'Guardian Angels & Shield',
                    style: TextStyle(
                      color: PopoTheme.textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded,
                      color: PopoTheme.textSecondary),
                  onPressed: () => Navigator.of(ctx).pop(),
                ),
              ],
            ),
            const SizedBox(height: 6),
            const Text(
              'Guardians protect the broadcaster with priority chat badges and special entrance effects.',
              style: TextStyle(color: PopoTheme.textSecondary, fontSize: 12),
            ),
            const SizedBox(height: 16),
            ...guardians.map((g) => Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: PopoTheme.surface,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: PopoTheme.borderSubtle),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 20,
                        backgroundImage: g.guardianAvatar.isNotEmpty
                            ? NetworkImage(g.guardianAvatar)
                            : null,
                        child: g.guardianAvatar.isEmpty
                            ? const Icon(Icons.person)
                            : null,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              g.guardianNickname,
                              style: const TextStyle(
                                color: PopoTheme.textPrimary,
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              g.tier,
                              style: const TextStyle(
                                color: Color(0xFFFF9100),
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0x22FF9100),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Text(
                          'Active Shield',
                          style: TextStyle(
                            color: Color(0xFFFF9100),
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                )),
            const SizedBox(height: 14),
          ],
        ),
      ),
    );
  }

  // Destination 2: Medal Wall of Fame
  void _openMedalWallDestination(BuildContext context) {
    final medals = DesignFixtures.medals;

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        key: const Key('me_medal_wall_destination'),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
        decoration: const BoxDecoration(
          color: Color(0xFF1B1829),
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          border: Border(top: BorderSide(color: Color(0x44FFD54F), width: 1.5)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                const Icon(Icons.workspace_premium_rounded,
                    color: Color(0xFFFFD54F), size: 24),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'Medal Wall of Fame',
                    style: TextStyle(
                      color: PopoTheme.textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded,
                      color: PopoTheme.textSecondary),
                  onPressed: () => Navigator.of(ctx).pop(),
                ),
              ],
            ),
            const SizedBox(height: 6),
            const Text(
              'Showcase your streaming milestones, tournament victories and community achievements.',
              style: TextStyle(color: PopoTheme.textSecondary, fontSize: 12),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 280,
              child: GridView.builder(
                itemCount: medals.length,
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 4,
                  mainAxisSpacing: 10,
                  crossAxisSpacing: 8,
                  childAspectRatio: 0.85,
                ),
                itemBuilder: (context, index) {
                  final medal = medals[index];
                  return Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: PopoTheme.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: medal.isUnlocked
                            ? const Color(0x66FFD54F)
                            : PopoTheme.borderSubtle,
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(medal.iconEmoji,
                            style: const TextStyle(fontSize: 24)),
                        const SizedBox(height: 4),
                        Text(
                          medal.name,
                          style: TextStyle(
                            color: medal.isUnlocked
                                ? PopoTheme.textPrimary
                                : PopoTheme.textSecondary,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          textAlign: TextAlign.center,
                        ),
                        Text(
                          medal.isUnlocked ? 'Earned' : 'Locked',
                          style: TextStyle(
                            color: medal.isUnlocked
                                ? const Color(0xFFFFD54F)
                                : Colors.white24,
                            fontSize: 9,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 14),
          ],
        ),
      ),
    );
  }

  // Destination 3: Policy Banner 2 (Fair Play & Financial Integrity)
  void _openFairPlayPolicyDestination(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        key: const Key('me_policy_fairplay_destination'),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
        decoration: const BoxDecoration(
          color: Color(0xFF1B1829),
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          border: Border(top: BorderSide(color: Color(0x4400E5FF), width: 1.5)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                const Icon(Icons.security_rounded,
                    color: Color(0xFF00E5FF), size: 22),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'Fair Play & Financial Integrity',
                    style: TextStyle(
                      color: PopoTheme.textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded,
                      color: PopoTheme.textSecondary),
                  onPressed: () => Navigator.of(ctx).pop(),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _buildPolicyRuleItem('1. Anti-Bot and Anti-Spam Protections',
                'All live broadcasts undergo real-time fair play checks. Scripted traffic or automated interactions are prohibited.'),
            _buildPolicyRuleItem(
                '2. Virtual Gift & Ledger Accounting Transparency',
                'Points and coins balances are backed by an immutable ledger. Every transaction record is securely preserved.'),
            _buildPolicyRuleItem(
                '3. Creator Protection & Non-Harassment Standards',
                'Broadcasters are entitled to a safe streaming environment. Violations trigger immediate moderation response.'),
            _buildPolicyRuleItem(
                '4. Secure Withdrawal Verification & Anti-Fraud',
                'Identity verification protects creator earnings and ensures legitimate payout to registered bank methods.'),
            const SizedBox(height: 20),
            Center(
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF00E5FF),
                  foregroundColor: Colors.black,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20)),
                ),
                onPressed: () => Navigator.of(ctx).pop(),
                child: const Text('Acknowledge & Close',
                    style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildPolicyRuleItem(String title, String body) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: const TextStyle(
                  color: Color(0xFF00E5FF),
                  fontSize: 13,
                  fontWeight: FontWeight.bold)),
          const SizedBox(height: 2),
          Text(body,
              style: const TextStyle(
                  color: PopoTheme.textSecondary, fontSize: 12)),
        ],
      ),
    );
  }

  // Destination 4: Streamer Center Hub
  void _openStreamerCenter(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        key: const Key('me_streamer_center_destination'),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
        decoration: const BoxDecoration(
          color: Color(0xFF1B1829),
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          border: Border(top: BorderSide(color: Color(0x44FF1768), width: 1.5)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                const Icon(Icons.videocam_rounded,
                    color: PopoTheme.primary, size: 24),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'Streamer Center',
                    style: TextStyle(
                      color: PopoTheme.textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded,
                      color: PopoTheme.textSecondary),
                  onPressed: () => Navigator.of(ctx).pop(),
                ),
              ],
            ),
            const SizedBox(height: 6),
            const Text(
              'Host operations hub for tasks, task level, rankings, KYC verification and broadcasting studio tools.',
              style: TextStyle(color: PopoTheme.textSecondary, fontSize: 12),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildCenterToolTile(
                    icon: Icons.checklist_rounded,
                    label: 'Daily Tasks',
                    color: PopoTheme.primary,
                    onTap: () {
                      Navigator.of(ctx).pop();
                      Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => const DailyHostTasksScreen()));
                    },
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildCenterToolTile(
                    icon: Icons.trending_up_rounded,
                    label: 'Task Level',
                    color: const Color(0xFFFFC107),
                    onTap: () {
                      Navigator.of(ctx).pop();
                      Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => const TaskLevelScreen()));
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: _buildCenterToolTile(
                    icon: Icons.verified_user_rounded,
                    label: 'Earning KYC',
                    color: const Color(0xFF00E5FF),
                    onTap: () {
                      Navigator.of(ctx).pop();
                      Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => const EarningIdentityScreen()));
                    },
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildCenterToolTile(
                    icon: Icons.leaderboard_rounded,
                    label: 'Rankings',
                    color: const Color(0xFFFFD166),
                    onTap: () {
                      Navigator.of(ctx).pop();
                      Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => const HostRankingsScreen()));
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: _buildCenterToolTile(
                    icon: Icons.emoji_events_rounded,
                    label: 'Leaderboard',
                    color: const Color(0xFFF97316),
                    onTap: () {
                      Navigator.of(ctx).pop();
                      Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => const EventLeaderboardScreen()));
                    },
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildCenterToolTile(
                    icon: Icons.business_rounded,
                    label: 'My Agency',
                    color: const Color(0xFF29B6F6),
                    onTap: () {
                      Navigator.of(ctx).pop();
                      Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => const AgencyManagementScreen()));
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
          ],
        ),
      ),
    );
  }

  Widget _buildCenterToolTile({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
        decoration: BoxDecoration(
          color: PopoTheme.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.35)),
        ),
        child: Row(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(
                  color: PopoTheme.textPrimary,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Destination 5: Builder Center Hub
  void _openBuilderCenter(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => const Scaffold(
          key: Key('me_builder_center_destination'),
          body: AgencyManagementScreen(),
        ),
      ),
    );
  }

  // Destination 6: Help Center
  void _openHelpCenter(BuildContext context) {
    final tickets = DesignFixtures.supportTickets;

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        key: const Key('me_help_center_destination'),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
        decoration: const BoxDecoration(
          color: Color(0xFF1B1829),
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          border: Border(top: BorderSide(color: Color(0x44FFD700), width: 1.5)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                const Icon(Icons.help_outline_rounded,
                    color: Color(0xFFFFD700), size: 24),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'Help & Customer Center',
                    style: TextStyle(
                      color: PopoTheme.textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded,
                      color: PopoTheme.textSecondary),
                  onPressed: () => Navigator.of(ctx).pop(),
                ),
              ],
            ),
            const SizedBox(height: 6),
            const Text(
              'Browse FAQ topics, track active inquiries, or contact the live Popo support team.',
              style: TextStyle(color: PopoTheme.textSecondary, fontSize: 12),
            ),
            const SizedBox(height: 16),
            const Text(
              'Recent Inquiries',
              style: TextStyle(
                  color: PopoTheme.textPrimary,
                  fontSize: 13,
                  fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            ...tickets.map((t) => Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: PopoTheme.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: PopoTheme.borderSubtle),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.confirmation_number_outlined,
                          color: Color(0xFFFFD700), size: 18),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              t.subject,
                              style: const TextStyle(
                                  color: PopoTheme.textPrimary,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold),
                            ),
                            Text(
                              'Category: ${t.category} • ${t.lastUpdated}',
                              style: const TextStyle(
                                  color: PopoTheme.textSecondary, fontSize: 10),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: t.status == 'Resolved'
                              ? Colors.green.withOpacity(0.2)
                              : Colors.orange.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          t.status,
                          style: TextStyle(
                            color: t.status == 'Resolved'
                                ? Colors.greenAccent
                                : Colors.orangeAccent,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                )),
            const SizedBox(height: 14),
          ],
        ),
      ),
    );
  }

  // Destination 7: Watch History
  void _openWatchHistory(BuildContext context) {
    final rooms = DesignFixtures.liveRooms;

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        key: const Key('me_watch_history_destination'),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
        decoration: const BoxDecoration(
          color: Color(0xFF1B1829),
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          border: Border(top: BorderSide(color: Color(0x44BA68C8), width: 1.5)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                const Icon(Icons.history_rounded,
                    color: Color(0xFFBA68C8), size: 24),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'Broadcast Watch History',
                    style: TextStyle(
                      color: PopoTheme.textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded,
                      color: PopoTheme.textSecondary),
                  onPressed: () => Navigator.of(ctx).pop(),
                ),
              ],
            ),
            const SizedBox(height: 6),
            const Text(
              'Past live streams and audio party rooms you recently attended.',
              style: TextStyle(color: PopoTheme.textSecondary, fontSize: 12),
            ),
            const SizedBox(height: 16),
            ...rooms.take(3).map((r) => Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: PopoTheme.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: PopoTheme.borderSubtle),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 18,
                        backgroundImage: r.coverUrl.isNotEmpty
                            ? NetworkImage(r.coverUrl)
                            : null,
                        child: r.coverUrl.isEmpty ? const Icon(Icons.tv) : null,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              r.title,
                              style: const TextStyle(
                                  color: PopoTheme.textPrimary,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              'Host: ${r.hostNickname} • ${r.country}',
                              style: const TextStyle(
                                  color: PopoTheme.textSecondary, fontSize: 10),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0x22BA68C8),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          'Watched',
                          style: TextStyle(
                              color: Color(0xFFBA68C8),
                              fontSize: 10,
                              fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                )),
            const SizedBox(height: 14),
          ],
        ),
      ),
    );
  }

  // Destination 8: Achievement Poster Preview
  void _openAchievementPoster(BuildContext context, FixtureUserProfile user) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        key: const Key('me_achievement_poster_destination'),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
        decoration: const BoxDecoration(
          color: Color(0xFF1B1829),
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          border: Border(top: BorderSide(color: Color(0x44FF4081), width: 1.5)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: 44,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                const Icon(Icons.photo_library_outlined,
                    color: Color(0xFFFF4081), size: 22),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'Achievement Poster',
                    style: TextStyle(
                      color: PopoTheme.textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded,
                      color: PopoTheme.textSecondary),
                  onPressed: () => Navigator.of(ctx).pop(),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // The Branded Poster Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF330922), Color(0xFF1F0515)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0x66FF4081), width: 1.5),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x22FF4081),
                    blurRadius: 20,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 36,
                    backgroundImage: user.avatarUrl.isNotEmpty
                        ? NetworkImage(user.avatarUrl)
                        : null,
                    child: user.avatarUrl.isEmpty
                        ? const Icon(Icons.person, size: 36)
                        : null,
                  ),
                  const SizedBox(height: 10),
                  Text(
                    user.nickname,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold),
                  ),
                  Text(
                    'Popo ID: ${user.poppoId}',
                    style: const TextStyle(color: Colors.white60, fontSize: 12),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _buildPosterMetric(
                          'Followers', _formatNumber(user.followersCount)),
                      _buildPosterMetric('Wealth Lv', 'Lv.${user.wealthLevel}'),
                      _buildPosterMetric('Shining Lv', 'Lv.${user.hostLevel}'),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0x33FF4081),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      '★ Popo Live Verified Broadcaster ★',
                      style: TextStyle(
                          color: Color(0xFFFF80AB),
                          fontSize: 11,
                          fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white,
                      side: const BorderSide(color: PopoTheme.borderSubtle),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16)),
                    ),
                    onPressed: () {
                      Navigator.of(ctx).pop();
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                            content: Text('Poster saved to Photos!')),
                      );
                    },
                    child: const Text('Save Poster'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFF4081),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16)),
                    ),
                    onPressed: () {
                      Navigator.of(ctx).pop();
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                            content: Text('Poster link ready to share!')),
                      );
                    },
                    child: const Text('Share Poster',
                        style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildPosterMetric(String label, String value) {
    return Column(
      children: [
        Text(value,
            style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.bold)),
        Text(label,
            style: const TextStyle(color: Colors.white54, fontSize: 10)),
      ],
    );
  }

  // Destination 9: Redeem Code Voucher Sheet
  void _openRedeemCodeSheet(BuildContext context) {
    final controller = TextEditingController(text: 'POPO-WELCOME-2026');

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) {
          return Container(
            key: const Key('me_redeem_code_sheet'),
            padding: EdgeInsets.only(
              left: 24,
              right: 24,
              top: 20,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
            ),
            decoration: const BoxDecoration(
              color: Color(0xFF1B1829),
              borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              border:
                  Border(top: BorderSide(color: Color(0x44FF9800), width: 1.5)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 44,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.white24,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    const Icon(Icons.confirmation_number_outlined,
                        color: Color(0xFFFF9800), size: 24),
                    const SizedBox(width: 8),
                    const Expanded(
                      child: Text(
                        'Redeem Official Voucher',
                        style: TextStyle(
                          color: PopoTheme.textPrimary,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded,
                          color: PopoTheme.textSecondary),
                      onPressed: () => Navigator.of(ctx).pop(),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                const Text(
                  'Enter promotional or tournament voucher code to claim coin rewards.',
                  style:
                      TextStyle(color: PopoTheme.textSecondary, fontSize: 12),
                ),
                const SizedBox(height: 16),
                TextField(
                  key: const Key('me_redeem_code_input'),
                  controller: controller,
                  style: const TextStyle(
                      color: Colors.white, fontWeight: FontWeight.bold),
                  decoration: InputDecoration(
                    hintText: 'Enter code (e.g. POPO-WELCOME-2026)',
                    hintStyle: const TextStyle(color: Colors.white38),
                    filled: true,
                    fillColor: PopoTheme.surface,
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 14),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide:
                          const BorderSide(color: PopoTheme.borderSubtle),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    key: const Key('me_redeem_code_submit'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFF9800),
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16)),
                    ),
                    onPressed: () {
                      final code = controller.text.trim();
                      final result = DesignFixtures.redeemCode(code);
                      Navigator.of(ctx).pop();

                      if (result.isValid) {
                        setState(() {}); // Refresh wallet coin display
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(result.message),
                            backgroundColor: Colors.green[800],
                            duration: const Duration(seconds: 3),
                          ),
                        );
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(result.message),
                            backgroundColor: PopoTheme.danger,
                            duration: const Duration(seconds: 3),
                          ),
                        );
                      }
                    },
                    child: const Text('Redeem Voucher Now',
                        style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // MAIN BUILD METHOD
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    // 1. Error state handling
    if (DesignFixtures.isError) {
      return Scaffold(
        backgroundColor: PopoTheme.background,
        appBar: _buildAppBar(),
        body: Center(
          child: PopoErrorState(
            key: const Key('me_error_state'),
            title: DesignFixtures.userProfileError.title,
            message: DesignFixtures.userProfileError.message,
            retryText: DesignFixtures.userProfileError.actionLabel,
            onRetry: () => setState(() {}),
          ),
        ),
      );
    }

    // 2. Empty state handling
    if (DesignFixtures.isEmpty) {
      return Scaffold(
        backgroundColor: PopoTheme.background,
        appBar: _buildAppBar(),
        body: Center(
          child: PopoEmptyState(
            key: const Key('me_empty_state'),
            icon: Icons.person_outline_rounded,
            title: 'Guest Profile',
            message:
                'No active profile data found. Please log in or create an account to view profile.',
            actionText: 'Refresh Profile',
            onActionTap: () => setState(() {}),
          ),
        ),
      );
    }

    // 3. Normal filled state
    final user = DesignFixtures.currentUserProfile;
    final wallet = DesignFixtures.wallet;

    return Scaffold(
      backgroundColor: PopoTheme.background,
      appBar: _buildAppBar(),
      body: RefreshIndicator(
        onRefresh: () async {
          setState(() {});
        },
        color: PopoTheme.primary,
        backgroundColor: PopoTheme.surface,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 1. User Profile Information Card
              _buildUserProfileCard(user),
              const SizedBox(height: 16),

              // 2. Four Profile Counts (Friends, Following, Followers, Visitors)
              _buildCountsRow(user),
              const SizedBox(height: 16),

              // 3. Coins & Points Cards
              _buildEconomyRow(wallet),
              const SizedBox(height: 16),

              // 4. VIP Banner
              _buildVipBanner(user),
              const SizedBox(height: 20),

              // 5. Eight Main Feature Icons (Reward, Rank, Store, Invite, Guardian, Honor Level, Fan Club, Medal Wall)
              _buildEightFeatureIconsGrid(user),
              const SizedBox(height: 20),

              // 6. Two Policy Banners (Conduct Policy, Fair Play Policy)
              _buildTwoPolicyBanners(),
              const SizedBox(height: 20),

              // 7. Streamer Center Entry
              _buildStreamerCenterEntry(user),
              const SizedBox(height: 12),

              // 8. Builder Center Entry
              _buildBuilderCenterEntry(),
              const SizedBox(height: 20),

              // 9. Lower Me Page Sections (Help Center, Watch History, Level, Poster, Bag, Agency, Redeem Code)
              _buildLowerSectionsCard(user),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  // Top App Bar with Me title, Scan button, and Settings button
  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: Colors.transparent,
      elevation: 0,
      title: Text(
        PopoStrings.get('profile_title'),
        key: const Key('me_title'),
        style: const TextStyle(
          color: PopoTheme.textPrimary,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
      ),
      actions: [
        PopoIconButton(
          key: const Key('me_scan_button'),
          icon: Icons.qr_code_scanner_rounded,
          tooltip: 'Scan QR',
          onPressed: () => _showScanModal(context),
        ),
        PopoIconButton(
          key: const Key('me_settings_button'),
          icon: Icons.settings_outlined,
          tooltip: 'Settings',
          onPressed: () {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const SettingsScreen()),
            );
          },
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  // User Profile Main Card
  Widget _buildUserProfileCard(FixtureUserProfile user) {
    return PopoCard(
      padding: const EdgeInsets.all(18),
      hasGlow: true,
      glowColor: PopoTheme.gold,
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Avatar with glowing gradient ring
              Container(
                key: const Key('me_avatar'),
                padding: const EdgeInsets.all(2.5),
                decoration: BoxDecoration(
                  gradient: _liveEquippedLoadout?['profile_frame'] != null
                      ? const LinearGradient(colors: [Color(0xFFFF2E74), Color(0xFFFF9900), Color(0xFF9D00FF)])
                      : PopoTheme.goldGradient,
                  shape: BoxShape.circle,
                ),
                child: CircleAvatar(
                  radius: 36,
                  backgroundColor: PopoTheme.surface,
                  backgroundImage: user.avatarUrl.isNotEmpty
                      ? NetworkImage(user.avatarUrl)
                      : null,
                  child: user.avatarUrl.isEmpty
                      ? const Icon(
                          Icons.person,
                          color: PopoTheme.textSecondary,
                          size: 36,
                        )
                      : null,
                ),
              ),
              const SizedBox(width: 14),

              // Profile Details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Nickname & Country Flag
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            user.nickname,
                            key: const Key('me_nickname'),
                            style: const TextStyle(
                              color: PopoTheme.textPrimary,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Container(
                          key: const Key('me_flag'),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '${user.flagEmoji} ${user.country}',
                            style: const TextStyle(
                              color: PopoTheme.textSecondary,
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),

                    // User ID & Copy Button
                    InkWell(
                      key: const Key('me_copy_id_button'),
                      onTap: () => _copyPoppoId(user.poppoId),
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
                              '${PopoStrings.get('user_id')}: ${user.poppoId}',
                              key: const Key('me_user_id'),
                              style: const TextStyle(
                                color: PopoTheme.textSecondary,
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(width: 5),
                            const Icon(
                              Icons.copy_rounded,
                              color: PopoTheme.cyan,
                              size: 13,
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),

                    // VIP Badge & Two Level Badges Row
                    Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      children: [
                        // VIP status badge
                        _buildVipBadge(user),
                        // Wealth Level badge
                        _buildBadge(
                          key: const Key('me_wealth_badge'),
                          label: 'Lv.${(ApiConfig.useVipApi && _liveWealthLevel != null) ? _liveWealthLevel : user.wealthLevel}',
                          color: PopoTheme.gold,
                          icon: Icons.diamond_rounded,
                        ),
                        // Shining Level badge
                        _buildBadge(
                          key: const Key('me_shining_badge'),
                          label: 'Lv.${(ApiConfig.useVipApi && _liveShiningLevel != null) ? _liveShiningLevel : user.hostLevel}',
                          color: PopoTheme.primary,
                          icon: Icons.star_rounded,
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Edit profile icon button
              IconButton(
                key: const Key('me_edit_profile_button'),
                icon: const Icon(
                  Icons.edit_outlined,
                  color: PopoTheme.cyan,
                  size: 20,
                ),
                tooltip: PopoStrings.get('edit_profile'),
                onPressed: () async {
                  await Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => const EditProfileScreen(),
                    ),
                  );
                  if (mounted) setState(() {});
                },
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Secondary row: Public Profile shortcut link
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              InkWell(
                key: const Key('me_public_profile_button'),
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => PublicProfileScreen(userId: user.userId),
                    ),
                  );
                },
                borderRadius: BorderRadius.circular(12),
                child: const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  child: Row(
                    children: [
                      Text(
                        'Public Profile',
                        style: TextStyle(
                          color: PopoTheme.cyan,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      SizedBox(width: 4),
                      Icon(
                        Icons.chevron_right_rounded,
                        color: PopoTheme.cyan,
                        size: 16,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // VIP Badge Pill
  Widget _buildVipBadge(FixtureUserProfile user) {
    final displayLabel = (ApiConfig.useVipApi && _liveVipLabel != null && _liveVipLabel!.isNotEmpty)
        ? _liveVipLabel!
        : ((ApiConfig.useVipApi && _liveVipLevel != null)
            ? 'VIP ${_liveVipLevel!}'
            : 'VIP ${user.vipLevel}');

    return Container(
      key: const Key('me_vip_badge'),
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFFD700), Color(0xFFFF8C00)],
        ),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('👑', style: TextStyle(fontSize: 10)),
          const SizedBox(width: 3),
          Text(
            displayLabel,
            style: const TextStyle(
              color: Colors.black,
              fontSize: 10,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }

  // Level Badge Pill
  Widget _buildBadge({
    required Key key,
    required String label,
    required Color color,
    required IconData icon,
  }) {
    return Container(
      key: key,
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
      decoration: BoxDecoration(
        color: color.withOpacity(0.18),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(0.4), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 11),
          const SizedBox(width: 3),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 10,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  // Four Profile Counts Row (Friends, Following, Followers, Visitors)
  Widget _buildCountsRow(FixtureUserProfile user) {
    return PopoCard(
      key: const Key('me_counts_row'),
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildCountItem(
            entryKey: const Key('me_friends_entry'),
            countKey: const Key('me_friends_count'),
            count: user.friendsCount,
            title: 'Friends',
            icon: Icons.people_alt_rounded,
            onTap: () => _showCountPreview(
              'Friends',
              user.friendsCount,
              'Mutual friends connected with you on Popo Live.',
            ),
          ),
          _buildCountDivider(),
          _buildCountItem(
            entryKey: const Key('me_following_entry'),
            countKey: const Key('me_following_count'),
            count: user.followingCount,
            title: 'Following',
            icon: Icons.person_add_alt_1_rounded,
            onTap: () => _showCountPreview(
              'Following',
              user.followingCount,
              'Broadcasters and friends you currently follow.',
            ),
          ),
          _buildCountDivider(),
          _buildCountItem(
            entryKey: const Key('me_followers_entry'),
            countKey: const Key('me_followers_count'),
            count: user.followersCount,
            title: 'Followers',
            icon: Icons.favorite_rounded,
            onTap: () => _showCountPreview(
              'Followers',
              user.followersCount,
              'Users and fans following your broadcasts and profile.',
            ),
          ),
          _buildCountDivider(),
          _buildCountItem(
            entryKey: const Key('me_visitors_entry'),
            countKey: const Key('me_visitors_count'),
            count: user.visitorCount,
            title: 'Visitors',
            icon: Icons.remove_red_eye_rounded,
            onTap: () => _showCountPreview(
              'Visitors',
              user.visitorCount,
              'Recent viewers who browsed your profile page.',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCountDivider() {
    return Container(
      width: 1,
      height: 28,
      color: PopoTheme.borderSubtle,
    );
  }

  Widget _buildCountItem({
    required Key entryKey,
    required Key countKey,
    required int count,
    required String title,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: InkWell(
        key: entryKey,
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(icon, size: 13, color: PopoTheme.textSecondary),
                  const SizedBox(width: 4),
                  Text(
                    title,
                    style: const TextStyle(
                      color: PopoTheme.textSecondary,
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                _formatNumber(count),
                key: countKey,
                style: const TextStyle(
                  color: PopoTheme.textPrimary,
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Coins Card & Points Card side-by-side
  Widget _buildEconomyRow(FixtureWallet wallet) {
    final int displayCoins = (ApiConfig.useEconomyApi && _liveCoinsBalance != null)
        ? _liveCoinsBalance!
        : wallet.coinBalance;
    final int displayPoints = (ApiConfig.useEconomyApi && _livePointsBalance != null)
        ? _livePointsBalance!
        : wallet.pointsBalance;

    return Row(
      children: [
        // Coins Card
        Expanded(
          child: PopoCard(
            key: const Key('me_coins_card'),
            padding: const EdgeInsets.all(14),
            hasGlow: true,
            glowColor: PopoTheme.gold,
            child: InkWell(
              onTap: () => _showCoinsPreview(displayCoins),
              borderRadius: BorderRadius.circular(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Text('🪙', style: TextStyle(fontSize: 16)),
                          SizedBox(width: 6),
                          Text(
                            'Coins',
                            key: Key('me_coins_title'),
                            style: TextStyle(
                              color: PopoTheme.textPrimary,
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      Container(
                        key: const Key('me_topup_button'),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          gradient: PopoTheme.goldGradient,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Text(
                          'Top Up',
                          style: TextStyle(
                            color: Colors.black,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    _formatNumber(displayCoins),
                    key: const Key('me_coins_balance'),
                    style: const TextStyle(
                      color: Color(0xFFFFD700),
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),

        // Points Card
        Expanded(
          child: PopoCard(
            key: const Key('me_points_card'),
            padding: const EdgeInsets.all(14),
            hasGlow: true,
            glowColor: PopoTheme.cyan,
            child: InkWell(
              onTap: () => _showPointsPreview(displayPoints),
              borderRadius: BorderRadius.circular(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Text('💎', style: TextStyle(fontSize: 16)),
                          SizedBox(width: 6),
                          Text(
                            'Points',
                            key: Key('me_points_title'),
                            style: TextStyle(
                              color: PopoTheme.textPrimary,
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      Container(
                        key: const Key('me_exchange_button'),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFF00E5FF),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Text(
                          'Exchange',
                          style: TextStyle(
                            color: Colors.black,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    _formatNumber(displayPoints),
                    key: const Key('me_points_balance'),
                    style: const TextStyle(
                      color: Color(0xFF00E5FF),
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  // VIP Prominent Banner
  Widget _buildVipBanner(FixtureUserProfile user) {
    return Container(
      key: const Key('me_vip_banner'),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [
            Color(0xFF332408),
            Color(0xFF221703),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0x66FFD700), width: 1.2),
        boxShadow: const [
          BoxShadow(
            color: Color(0x22FFD700),
            blurRadius: 16,
            spreadRadius: 1,
          ),
        ],
      ),
      child: InkWell(
        onTap: () => _showVipPreview(user),
        borderRadius: BorderRadius.circular(16),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: const BoxDecoration(
                gradient: PopoTheme.goldGradient,
                shape: BoxShape.circle,
              ),
              child: const Text('👑', style: TextStyle(fontSize: 18)),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        'VIP ${user.vipLevel} • ${user.vipStatus}',
                        key: const Key('me_vip_status_text'),
                        style: const TextStyle(
                          color: Color(0xFFFFD700),
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  const Text(
                    'Exclusive entrance effects, custom badge & monthly rewards',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 11,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Container(
              key: const Key('me_vip_cta'),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: const Color(0x22FFD700),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0x55FFD700)),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Privileges',
                    style: TextStyle(
                      color: Color(0xFFFFD700),
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Icon(
                    Icons.chevron_right_rounded,
                    color: Color(0xFFFFD700),
                    size: 14,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // SECTION 7: EIGHT MAIN FEATURE ICONS (Prompt 2)
  // Exact Order:
  // 1. Reward, 2. Rank, 3. Store, 4. Invite, 5. Guardian, 6. Honor Level, 7. Fan Club, 8. Medal Wall
  // ---------------------------------------------------------------------------
  Widget _buildEightFeatureIconsGrid(FixtureUserProfile user) {
    final features = [
      {
        'key': const Key('me_feature_reward'),
        'title': 'Reward',
        'icon': Icons.card_giftcard_rounded,
        'color': const Color(0xFFFF1768),
        'onTap': () {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const DailyHostTasksScreen()),
          );
        },
      },
      {
        'key': const Key('me_feature_rank'),
        'title': 'Rank',
        'icon': Icons.leaderboard_rounded,
        'color': const Color(0xFFFFD700),
        'onTap': () {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const HostRankingsScreen()),
          );
        },
      },
      {
        'key': const Key('me_feature_store'),
        'title': 'Store',
        'icon': Icons.storefront_rounded,
        'color': const Color(0xFF00E5FF),
        'onTap': () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => StoreScreen(
                apiBaseUrl: 'https://api.popolive.com',
                userId: user.userId,
                previewDemo: true,
                initialTab: 'store',
              ),
            ),
          );
        },
      },
      {
        'key': const Key('me_feature_invite'),
        'title': 'Invite',
        'icon': Icons.group_add_rounded,
        'color': const Color(0xFF00E676),
        'onTap': () {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const InvitesScreen()),
          );
        },
      },
      {
        'key': const Key('me_feature_guardian'),
        'title': 'Guardian',
        'icon': Icons.shield_rounded,
        'color': const Color(0xFFFF9100),
        'onTap': () => _openGuardianDestination(context),
      },
      {
        'key': const Key('me_feature_honor_level'),
        'title': 'Honor Level',
        'icon': Icons.military_tech_rounded,
        'color': const Color(0xFFE040FB),
        'onTap': () {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const TaskLevelScreen()),
          );
        },
      },
      {
        'key': const Key('me_feature_fan_club'),
        'title': 'Fan Club',
        'icon': Icons.favorite_rounded,
        'color': const Color(0xFFFF4081),
        'onTap': () {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const FanClubScreen()),
          );
        },
      },
      {
        'key': const Key('me_feature_medal_wall'),
        'title': 'Medal Wall',
        'icon': Icons.workspace_premium_outlined,
        'color': const Color(0xFFFFD54F),
        'onTap': () => _openMedalWallDestination(context),
      },
    ];

    return PopoCard(
      key: const Key('me_features_grid'),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(left: 6, bottom: 14),
            child: Text(
              'Feature Services',
              style: TextStyle(
                color: PopoTheme.textPrimary,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: features.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 4,
              mainAxisSpacing: 14,
              crossAxisSpacing: 8,
              childAspectRatio: 0.9,
            ),
            itemBuilder: (context, index) {
              final item = features[index];
              final key = item['key'] as Key;
              final title = item['title'] as String;
              final icon = item['icon'] as IconData;
              final color = item['color'] as Color;
              final onTap = item['onTap'] as VoidCallback;

              return InkWell(
                key: key,
                onTap: onTap,
                borderRadius: BorderRadius.circular(12),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: color.withOpacity(0.12),
                        shape: BoxShape.circle,
                        border:
                            Border.all(color: color.withOpacity(0.3), width: 1),
                      ),
                      child: Icon(icon, color: color, size: 22),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      title,
                      style: const TextStyle(
                        color: PopoTheme.textSecondary,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // SECTION 8: TWO POLICY BANNERS (Prompt 2)
  // ---------------------------------------------------------------------------
  Widget _buildTwoPolicyBanners() {
    return Column(
      children: [
        // Policy Banner 1: Community Conduct & Safety Policy
        Container(
          key: const Key('me_policy_banner_conduct'),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF1D133D), Color(0xFF2C1A57)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0x44FF1768), width: 1.2),
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const LiveRulesScreen()),
                );
              },
              borderRadius: BorderRadius.circular(16),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: PopoTheme.primary.withOpacity(0.2),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.verified_user_rounded,
                          color: PopoTheme.primary, size: 20),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Community Conduct & Safety Policy',
                            key: Key('me_policy_title_conduct'),
                            style: TextStyle(
                              color: PopoTheme.textPrimary,
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'Broadcasting guidelines, anti-harassment rules & respectful streaming standards',
                            style: TextStyle(
                                color: Colors.white60, fontSize: 10.5),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 6),
                    const Icon(Icons.chevron_right_rounded,
                        color: PopoTheme.textSecondary, size: 18),
                  ],
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 10),

        // Policy Banner 2: Fair Play & Financial Integrity Policy
        Container(
          key: const Key('me_policy_banner_fairplay'),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF0D233A), Color(0xFF163756)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0x4400E5FF), width: 1.2),
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () => _openFairPlayPolicyDestination(context),
              borderRadius: BorderRadius.circular(16),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFF00E5FF).withOpacity(0.2),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.security_rounded,
                          color: Color(0xFF00E5FF), size: 20),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Fair Play & Financial Integrity Policy',
                            key: Key('me_policy_title_fairplay'),
                            style: TextStyle(
                              color: PopoTheme.textPrimary,
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'Transparent gift economy, immutable ledger tracking & anti-fraud safeguards',
                            style: TextStyle(
                                color: Colors.white60, fontSize: 10.5),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 6),
                    const Icon(Icons.chevron_right_rounded,
                        color: PopoTheme.textSecondary, size: 18),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // SECTION 9: STREAMER CENTER (Prompt 2)
  // ---------------------------------------------------------------------------
  Widget _buildStreamerCenterEntry(FixtureUserProfile user) {
    return PopoCard(
      key: const Key('me_streamer_center_entry'),
      padding: EdgeInsets.zero,
      hasGlow: true,
      glowColor: PopoTheme.primary,
      child: Material(
        color: Colors.transparent,
        child: ListTile(
          onTap: () => _openStreamerCenter(context),
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          leading: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: PopoTheme.primary.withOpacity(0.18),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.videocam_rounded,
                color: PopoTheme.primary, size: 22),
          ),
          title: const Text(
            'Streamer Center',
            style: TextStyle(
              color: PopoTheme.textPrimary,
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
          subtitle: const Text(
            'Live studio tasks, broadcaster metrics & host verification',
            style: TextStyle(color: PopoTheme.textSecondary, fontSize: 11),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: PopoTheme.primary.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Text(
                  'Host Tools',
                  style: TextStyle(
                      color: PopoTheme.primary,
                      fontSize: 10,
                      fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(width: 4),
              const Icon(Icons.chevron_right_rounded,
                  color: PopoTheme.textSecondary, size: 18),
            ],
          ),
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // SECTION 10: BUILDER CENTER (Prompt 2)
  // ---------------------------------------------------------------------------
  Widget _buildBuilderCenterEntry() {
    return PopoCard(
      key: const Key('me_builder_center_entry'),
      padding: EdgeInsets.zero,
      hasGlow: true,
      glowColor: const Color(0xFF00E5FF),
      child: Material(
        color: Colors.transparent,
        child: ListTile(
          onTap: () => _openBuilderCenter(context),
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          leading: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFF00E5FF).withOpacity(0.18),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.business_center_rounded,
                color: Color(0xFF00E5FF), size: 22),
          ),
          title: const Text(
            'Builder Center',
            style: TextStyle(
              color: PopoTheme.textPrimary,
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
          subtitle: const Text(
            'Guild administration, creator invitations & agency revenue shares',
            style: TextStyle(color: PopoTheme.textSecondary, fontSize: 11),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFF00E5FF).withOpacity(0.2),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Text(
                  'Agency Hub',
                  style: TextStyle(
                      color: Color(0xFF00E5FF),
                      fontSize: 10,
                      fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(width: 4),
              const Icon(Icons.chevron_right_rounded,
                  color: PopoTheme.textSecondary, size: 18),
            ],
          ),
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // SECTIONS 11 to 17: LOWER ME PAGE SECTIONS (Prompt 2)
  // 1. Help Center, 2. Watch History, 3. Level, 4. Achievement Poster, 5. Bag, 6. My Agency, 7. Redeem Code
  // ---------------------------------------------------------------------------
  Widget _buildLowerSectionsCard(FixtureUserProfile user) {
    return PopoCard(
      key: const Key('me_lower_modules_section'),
      padding: EdgeInsets.zero,
      child: Column(
        children: [
          // 11. Help Center
          _buildLowerModuleRow(
            key: const Key('me_lower_help_center'),
            icon: Icons.help_outline_rounded,
            iconColor: const Color(0xFFFFD700),
            title: 'Help Center',
            subtitle: 'FAQ topics, support tickets & live customer service',
            onTap: () => _openHelpCenter(context),
          ),
          const Divider(color: PopoTheme.borderSubtle, height: 1),

          // 12. Watch History
          _buildLowerModuleRow(
            key: const Key('me_lower_watch_history'),
            icon: Icons.history_rounded,
            iconColor: const Color(0xFFBA68C8),
            title: 'Watch History',
            subtitle: 'Past broadcast rooms and audio party sessions',
            onTap: () => _openWatchHistory(context),
          ),
          const Divider(color: PopoTheme.borderSubtle, height: 1),

          // 13. Level
          _buildLowerModuleRow(
            key: const Key('me_lower_level'),
            icon: Icons.military_tech_rounded,
            iconColor: const Color(0xFFFFD700),
            title: 'Level',
            subtitle:
                'Wealth Level (Lv.${user.wealthLevel}) & Shining Host Level (Lv.${user.hostLevel})',
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const TaskLevelScreen()),
              );
            },
          ),
          const Divider(color: PopoTheme.borderSubtle, height: 1),

          // 14. Achievement Poster
          _buildLowerModuleRow(
            key: const Key('me_lower_achievement_poster'),
            icon: Icons.photo_library_outlined,
            iconColor: const Color(0xFFFF4081),
            title: 'Achievement Poster',
            subtitle: 'Personalized showcase milestone card to save and share',
            onTap: () => _openAchievementPoster(context, user),
          ),
          const Divider(color: PopoTheme.borderSubtle, height: 1),

          // 15. Bag
          _buildLowerModuleRow(
            key: const Key('me_lower_bag'),
            icon: Icons.backpack_outlined,
            iconColor: const Color(0xFF00E676),
            title: 'Bag',
            subtitle:
                'Owned items, entry vehicles & custom chat badges inventory',
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => StoreScreen(
                    apiBaseUrl: 'https://api.popolive.com',
                    userId: user.userId,
                    previewDemo: true,
                    initialTab: 'inventory',
                  ),
                ),
              );
            },
          ),
          const Divider(color: PopoTheme.borderSubtle, height: 1),

          // 16. My Agency
          _buildLowerModuleRow(
            key: const Key('me_lower_my_agency'),
            icon: Icons.groups_outlined,
            iconColor: const Color(0xFF29B6F6),
            title: 'My Agency',
            subtitle: 'Agency association, host director & guild operations',
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                    builder: (_) => const AgencyManagementScreen()),
              );
            },
          ),
          const Divider(color: PopoTheme.borderSubtle, height: 1),

          // 17. Redeem Code
          _buildLowerModuleRow(
            key: const Key('me_lower_redeem_code'),
            icon: Icons.confirmation_number_outlined,
            iconColor: const Color(0xFFFF9800),
            title: 'Redeem Code',
            subtitle: 'Redeem promotional vouchers for bonus coins and perks',
            onTap: () => _openRedeemCodeSheet(context),
          ),
        ],
      ),
    );
  }

  Widget _buildLowerModuleRow({
    required Key key,
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: ListTile(
        key: key,
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: iconColor.withOpacity(0.12),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: iconColor, size: 20),
        ),
        title: Text(
          title,
          style: const TextStyle(
            color: PopoTheme.textPrimary,
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: const TextStyle(
            color: PopoTheme.textSecondary,
            fontSize: 11,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        trailing: const Icon(
          Icons.chevron_right_rounded,
          color: PopoTheme.textSecondary,
          size: 18,
        ),
      ),
    );
  }
}
