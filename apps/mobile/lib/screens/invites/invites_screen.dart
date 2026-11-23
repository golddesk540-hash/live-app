import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../design/design_fixtures.dart';
import '../../theme/popo_theme.dart';
import '../../widgets/popo_error_state.dart';
import '../../widgets/popo_empty_state.dart';

/// Popo Live — Section 5 (R3) Invites Screen
/// Displays personal fixture invite code/link, invitation statistics,
/// share actions, and joined friends list from DesignFixtures.
class InvitesScreen extends StatefulWidget {
  const InvitesScreen({super.key});

  @override
  State<InvitesScreen> createState() => _InvitesScreenState();
}

class _InvitesScreenState extends State<InvitesScreen> {
  int _selectedTab = 0; // 0: Invite Code, 1: Joined Friends (4)

  Future<void> _copyText(String value, String label) async {
    await Clipboard.setData(ClipboardData(text: value));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$label copied to clipboard!'),
        backgroundColor: const Color(0xFF1F0E3D),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _shareInvite(String code, String link) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Sharing invitation code $code ($link)'),
        backgroundColor: PopoTheme.primary,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // 1. Error state
    if (DesignFixtures.isError) {
      return Scaffold(
        backgroundColor: const Color(0xFF0D031B),
        appBar: AppBar(
          backgroundColor: const Color(0xFF120624),
          title: const Text('Invite Friends',
              style:
                  TextStyle(fontWeight: FontWeight.w800, color: Colors.white)),
        ),
        body: Center(
          child: PopoErrorState(
            title: 'Failed to load invitations',
            message: 'Unable to connect to invitation services.',
            retryText: 'Retry',
            onRetry: () => setState(() {}),
          ),
        ),
      );
    }

    final info = DesignFixtures.invitationInfo;

    // 2. Empty state
    if (DesignFixtures.isEmpty ||
        (info.joinedUsers.isEmpty && info.totalInvited == 0)) {
      return Scaffold(
        backgroundColor: const Color(0xFF0D031B),
        appBar: AppBar(
          backgroundColor: const Color(0xFF120624),
          title: const Text('Invite Friends',
              style:
                  TextStyle(fontWeight: FontWeight.w800, color: Colors.white)),
        ),
        body: Center(
          child: PopoEmptyState(
            icon: Icons.group_add_outlined,
            title: 'No Invitations Yet',
            message:
                'Share your invitation link with friends to earn bonus coins!',
            actionText: 'Refresh',
            onActionTap: () => setState(() {}),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0D031B),
      appBar: AppBar(
        backgroundColor: const Color(0xFF120624),
        elevation: 0,
        title: const Text(
          'Invite Friends',
          key: Key('invites_appbar_title'),
          style: TextStyle(fontWeight: FontWeight.w800, color: Colors.white),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // 1. Invitation Statistics Card
          _buildStatsCard(info),
          const SizedBox(height: 16),

          // 2. Tab selector: Invite & Code vs Joined Friends
          SegmentedButton<int>(
            style: SegmentedButton.styleFrom(
              backgroundColor: const Color(0xFF180A33),
              selectedBackgroundColor: const Color(0xFFFF1A6C),
              selectedForegroundColor: Colors.white,
              foregroundColor: const Color(0xFFD8B4FE),
            ),
            segments: [
              const ButtonSegment(value: 0, label: Text('Invite Code & Share')),
              ButtonSegment(
                  value: 1,
                  label: Text('Joined Friends (${info.joinedUsers.length})')),
            ],
            selected: {_selectedTab},
            onSelectionChanged: (v) {
              setState(() => _selectedTab = v.first);
            },
          ),
          const SizedBox(height: 16),

          if (_selectedTab == 0)
            _buildInviteCodeView(info)
          else
            _buildJoinedUsersView(info),
        ],
      ),
    );
  }

  Widget _buildStatsCard(FixtureInvitationInfo info) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF28114E), Color(0xFF15082C)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0x55FF1A6C)),
      ),
      child: Column(
        children: [
          const Text(
            'Invite Friends & Earn Coins',
            style: TextStyle(
                color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          const Text(
            'Earn 5,000 bonus coins for every friend who joins Popo Live with your code.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Color(0xFFD8B4FE), fontSize: 12),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E0C3A),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0x33FF1A6C)),
                  ),
                  child: Column(
                    children: [
                      Text(
                        '${info.totalInvited}',
                        key: const Key('invites_total_invited_count'),
                        style: const TextStyle(
                          color: Color(0xFFFF4D8D),
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Friends Joined',
                        style: TextStyle(color: Colors.white70, fontSize: 11),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E0C3A),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0x33FFD700)),
                  ),
                  child: Column(
                    children: [
                      Text(
                        '+${info.totalRewardCoins}',
                        key: const Key('invites_total_bonus_coins'),
                        style: const TextStyle(
                          color: Color(0xFFFFD700),
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Coins Earned',
                        style: TextStyle(color: Colors.white70, fontSize: 11),
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

  Widget _buildInviteCodeView(FixtureInvitationInfo info) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF180A33),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.purpleAccent.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Your Exclusive Invitation Code',
            textAlign: TextAlign.center,
            style: TextStyle(
                color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: const Color(0xFF0D031B),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0x66FF1A6C)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  info.invitationCode,
                  key: const Key('invitation_code_display'),
                  style: const TextStyle(
                    color: Color(0xFFFF4D8D),
                    fontSize: 20,
                    letterSpacing: 2,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: () =>
                      _copyText(info.invitationCode, 'Invite code'),
                  icon: const Icon(Icons.copy_rounded,
                      size: 14, color: Colors.white),
                  label: const Text('Copy Code',
                      style: TextStyle(
                          color: Colors.white, fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFF1A6C),
                    shape: const StadiumBorder(),
                    padding:
                        const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Invitation Link',
            style: TextStyle(
                color: Colors.white70,
                fontSize: 13,
                fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF0D031B),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.white12),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    info.shareLink,
                    key: const Key('invitation_link_display'),
                    style:
                        const TextStyle(color: Color(0xFFD8B4FE), fontSize: 12),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.copy_rounded,
                      color: Colors.white70, size: 18),
                  onPressed: () => _copyText(info.shareLink, 'Invite link'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          ElevatedButton.icon(
            key: const Key('invites_share_button'),
            onPressed: () => _shareInvite(info.invitationCode, info.shareLink),
            icon: const Icon(Icons.share_rounded, color: Colors.white),
            label: const Text('Share Invitation',
                style: TextStyle(
                    color: Colors.white, fontWeight: FontWeight.bold)),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFF1A6C),
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildJoinedUsersView(FixtureInvitationInfo info) {
    if (info.joinedUsers.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(28),
        decoration: BoxDecoration(
          color: const Color(0xFF180A33),
          borderRadius: BorderRadius.circular(20),
        ),
        child: const Column(
          children: [
            Icon(Icons.people_outline, color: Color(0xFFD8B4FE), size: 40),
            SizedBox(height: 12),
            Text('No friends joined yet',
                style: TextStyle(
                    color: Colors.white, fontWeight: FontWeight.bold)),
            SizedBox(height: 4),
            Text(
              'Share your code with friends and watch your community grow!',
              textAlign: TextAlign.center,
              style: TextStyle(color: Color(0xFFD8B4FE), fontSize: 12),
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            'Invited Friends (${info.joinedUsers.length})',
            style: const TextStyle(
                color: Colors.white70,
                fontSize: 12,
                fontWeight: FontWeight.bold),
          ),
        ),
        ...info.joinedUsers.map((user) => Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFF180A33),
                borderRadius: BorderRadius.circular(16),
                border:
                    Border.all(color: Colors.purpleAccent.withOpacity(0.18)),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 22,
                    backgroundColor: const Color(0xFF32125A),
                    backgroundImage: user.avatarUrl.isNotEmpty
                        ? NetworkImage(user.avatarUrl)
                        : null,
                    child: user.avatarUrl.isEmpty
                        ? const Icon(Icons.person, color: Colors.white60)
                        : null,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              user.name,
                              style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14),
                            ),
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0x33FFD700),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                'Lv.${user.level}',
                                style: const TextStyle(
                                    color: Color(0xFFFFD700),
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 3),
                        Text(
                          'Joined ${user.joinedAt}',
                          style: const TextStyle(
                              color: Color(0xFFD8B4FE), fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: const Color(0x2200E676),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0x5500E676)),
                    ),
                    child: Text(
                      '+${user.bonusEarned} Coins',
                      style: const TextStyle(
                        color: Color(0xFF00E676),
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            )),
      ],
    );
  }
}
