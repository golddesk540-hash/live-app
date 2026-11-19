import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../theme/popo_theme.dart';
import '../../l10n/strings.dart';
import '../../design/design_fixtures.dart';
import '../../widgets/popo_card.dart';
import '../../widgets/popo_icon_button.dart';
import '../../widgets/popo_empty_state.dart';
import '../../widgets/popo_error_state.dart';
import 'edit_profile_screen.dart';
import 'public_profile_screen.dart';
import 'settings_screen.dart';

/// Complete Me / Profile Screen for Popo Live (Phase 5 - D4 Prompt 1)
/// Powered by D0 design fixtures with filled, empty, and error state handling.
class MeScreen extends StatefulWidget {
  const MeScreen({super.key});

  @override
  State<MeScreen> createState() => _MeScreenState();
}

class _MeScreenState extends State<MeScreen> {
  // Helper to format large numbers with standard commas
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

  // Preview bottom sheet for QR scan entry point
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
            // Simulated camera frame
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

  // Interactive bottom sheet preview for profile counts
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
                      'Detailed $title list module will be available in the upcoming release.',
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

  // Interactive sheet preview for reserved feature modules
  void _showReservedFeatureNotice(String title) {
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
            Text(
              title,
              style: const TextStyle(
                color: PopoTheme.textPrimary,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'The complete $title module is reserved and scheduled for implementation in Phase 5 (D4) Prompt 2.',
              style:
                  const TextStyle(color: PopoTheme.textSecondary, fontSize: 13),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

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

              // 5. Reserved Feature Entry Area (Eight Icons)
              _buildFeatureGridArea(),
              const SizedBox(height: 20),

              // 6. Lower Module Entry Area (Reserved for Prompt 2)
              _buildLowerModulesArea(user),
              const SizedBox(height: 28),
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
                decoration: const BoxDecoration(
                  gradient: PopoTheme.goldGradient,
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
                          label: 'Lv.${user.wealthLevel}',
                          color: PopoTheme.gold,
                          icon: Icons.diamond_rounded,
                        ),
                        // Shining Level badge
                        _buildBadge(
                          key: const Key('me_shining_badge'),
                          label: 'Lv.${user.hostLevel}',
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
            'VIP ${user.vipLevel}',
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
              onTap: () => _showCoinsPreview(wallet.coinBalance),
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
                    _formatNumber(wallet.coinBalance),
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
              onTap: () => _showPointsPreview(wallet.pointsBalance),
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
                    _formatNumber(wallet.pointsBalance),
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

  // Feature Entry Area Reserved for Eight Icons (Prompt 2 placeholder)
  Widget _buildFeatureGridArea() {
    final features = [
      {
        'title': 'Reward',
        'icon': Icons.card_giftcard_rounded,
        'color': const Color(0xFFFF1768)
      },
      {
        'title': 'Rank',
        'icon': Icons.leaderboard_rounded,
        'color': const Color(0xFFFFD700)
      },
      {
        'title': 'Store',
        'icon': Icons.storefront_rounded,
        'color': const Color(0xFF00E5FF)
      },
      {
        'title': 'Invite',
        'icon': Icons.group_add_rounded,
        'color': const Color(0xFF00E676)
      },
      {
        'title': 'Guardian',
        'icon': Icons.shield_rounded,
        'color': const Color(0xFFFF9100)
      },
      {
        'title': 'Honor Level',
        'icon': Icons.military_tech_rounded,
        'color': const Color(0xFFE040FB)
      },
      {
        'title': 'Fan Club',
        'icon': Icons.favorite_border_rounded,
        'color': const Color(0xFFFF4081)
      },
      {
        'title': 'Medal Wall',
        'icon': Icons.workspace_premium_outlined,
        'color': const Color(0xFFFFD54F)
      },
    ];

    return PopoCard(
      key: const Key('me_features_grid'),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 6, bottom: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Features & Services',
                  style: TextStyle(
                    color: PopoTheme.textPrimary,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'Reserved for Prompt 2',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.35),
                    fontSize: 10,
                  ),
                ),
              ],
            ),
          ),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: features.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 4,
              mainAxisSpacing: 12,
              crossAxisSpacing: 8,
              childAspectRatio: 0.9,
            ),
            itemBuilder: (context, index) {
              final item = features[index];
              final title = item['title'] as String;
              final icon = item['icon'] as IconData;
              final color = item['color'] as Color;

              return InkWell(
                onTap: () => _showReservedFeatureNotice(title),
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
                        fontWeight: FontWeight.w500,
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

  // Lower Module Entry Area Reserved for Prompt 2
  Widget _buildLowerModulesArea(FixtureUserProfile user) {
    return PopoCard(
      key: const Key('me_lower_modules_section'),
      padding: EdgeInsets.zero,
      child: Column(
        children: [
          _buildModuleRow(
            icon: Icons.videocam_outlined,
            iconColor: PopoTheme.primary,
            title: 'Streamer Center',
            subtitle: 'Live broadcast tasks, agency analytics & studio tools',
            onTap: () => _showReservedFeatureNotice('Streamer Center'),
          ),
          const Divider(color: PopoTheme.borderSubtle, height: 1),
          _buildModuleRow(
            icon: Icons.business_center_outlined,
            iconColor: const Color(0xFF00E5FF),
            title: 'Builder Center',
            subtitle: 'Agency management, host invitations & revenue shares',
            onTap: () => _showReservedFeatureNotice('Builder Center'),
          ),
          const Divider(color: PopoTheme.borderSubtle, height: 1),
          _buildModuleRow(
            icon: Icons.help_outline_rounded,
            iconColor: const Color(0xFFFFD700),
            title: 'Help & Customer Service',
            subtitle: 'FAQ, feedback tickets & live operator support',
            onTap: () => _showReservedFeatureNotice('Help & Customer Service'),
          ),
        ],
      ),
    );
  }

  Widget _buildModuleRow({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    // Note: Wrapped in Material to comply with Flutter 3.50 decorated box rule
    return Material(
      color: Colors.transparent,
      child: ListTile(
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
