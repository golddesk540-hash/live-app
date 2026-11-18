import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../design/design_fixtures.dart';
import '../../models/live/live_models.dart';
import '../../theme/popo_theme.dart';

/// Screen 6/6: End Live Screen — Broadcaster Session Summary
/// Implemented for Phase 3 (D2) Prompt 3 according to Popo Live Complete Product Design v1.1.
/// Displays stream duration, total viewers, new followers, gifts received,
/// points/diamonds demonstration summary, host profile, and Return to Explore navigation.
class LiveEndScreen extends StatefulWidget {
  final LiveEndSummary? summary;
  final String? roomId;

  const LiveEndScreen({
    super.key,
    this.summary,
    this.roomId,
  });

  @override
  State<LiveEndScreen> createState() => _LiveEndScreenState();
}

class _LiveEndScreenState extends State<LiveEndScreen> {
  late LiveEndSummary _summary;

  @override
  void initState() {
    super.initState();
    final user = DesignFixtures.currentUserProfile;

    _summary = widget.summary ??
        LiveEndSummary(
          roomId: widget.roomId ?? 'room_karachi_nights',
          roomNumber: '8800001',
          title: 'Karachi Nights 🎶 Acoustic Live Session',
          category: 'Singing',
          coverUrl:
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
          durationSeconds: 932,
          durationFormatted: '00:15:32',
          totalViewers: 1420,
          totalViewersFormatted: '1,420',
          peakViewers: 1680,
          peakViewersFormatted: '1,680',
          newFollowers: 48,
          newFollowersFormatted: '+48',
          pointsReceived: 32400,
          pointsReceivedFormatted: '32,400',
          totalGifts: 12,
          totalLikes: 8500,
          host: LiveHostInfo(
            id: user.userId,
            poppoId: user.poppoId,
            nickname: user.nickname,
            avatarUrl: user.avatarUrl,
            hostLevel: user.hostLevel,
            wealthLevel: user.wealthLevel,
          ),
        );
  }

  void _returnToExplore() {
    // Pop all screens on the stack until returning to the root Explore Home Screen
    Navigator.of(context).popUntil((route) => route.isFirst);
  }

  void _onCopyId(String id) {
    Clipboard.setData(ClipboardData(text: id));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('ID copied to clipboard'),
        backgroundColor: PopoTheme.surface,
        duration: Duration(seconds: 1),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) _returnToExplore();
      },
      child: Scaffold(
        backgroundColor: PopoTheme.background,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          automaticallyImplyLeading: false,
          actions: [
            IconButton(
              key: const Key('end_screen_close_button'),
              icon: const Icon(Icons.close_rounded, color: Colors.white70),
              onPressed: _returnToExplore,
            ),
            const SizedBox(width: 8),
          ],
        ),
        body: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // 1. Celebration & Ended Icon
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      colors: [
                        PopoTheme.gold.withOpacity(0.25),
                        PopoTheme.primary.withOpacity(0.15),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    border: Border.all(
                      color: PopoTheme.gold.withOpacity(0.5),
                      width: 2,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: PopoTheme.gold.withOpacity(0.2),
                        blurRadius: 24,
                        spreadRadius: 4,
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.emoji_events_rounded,
                    color: PopoTheme.gold,
                    size: 44,
                  ),
                ),
                const SizedBox(height: 14),

                // 2. Title & Status
                const Text(
                  'Live Broadcast Ended',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _summary.title ?? 'Karachi Nights 🎶 Acoustic Live Session',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: PopoTheme.textSecondary,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 20),

                // 3. Host Profile Card
                _buildHostCard(_summary.host),
                const SizedBox(height: 20),

                // 4. Summary Metrics Grid
                _buildMetricsGrid(_summary),
                const SizedBox(height: 20),

                // 5. Session Details & Safe Disclaimer Card
                _buildSessionNoticeCard(),
                const SizedBox(height: 28),

                // 6. Return to Explore Action Button
                _buildReturnButton(),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHostCard(LiveHostInfo? host) {
    final user = DesignFixtures.currentUserProfile;
    final nickname = host?.nickname ?? user.nickname;
    final poppoId = host?.poppoId ?? user.poppoId;
    final wealthLevel = host?.wealthLevel ?? user.wealthLevel;
    final avatar = host?.avatarUrl ?? user.avatarUrl;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: PopoTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: PopoTheme.borderSubtle),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 26,
            backgroundImage: NetworkImage(avatar),
            onBackgroundImageError: (_, __) {},
            child: const Icon(Icons.person, color: Colors.white38),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        nickname,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(user.flagEmoji, style: const TextStyle(fontSize: 13)),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 5, vertical: 1),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFFFFB800), Color(0xFFFF8A00)],
                        ),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        'Lv.$wealthLevel',
                        style: const TextStyle(
                          color: Colors.black,
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                GestureDetector(
                  onTap: () => _onCopyId(poppoId),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'ID: $poppoId',
                        style: const TextStyle(
                          color: PopoTheme.textSecondary,
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(width: 4),
                      const Icon(
                        Icons.copy_rounded,
                        color: PopoTheme.textSecondary,
                        size: 13,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricsGrid(LiveEndSummary summary) {
    return GridView.count(
      crossAxisCount: 2,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 1.45,
      children: [
        _buildMetricCard(
          title: 'Duration',
          value: summary.durationFormatted,
          icon: Icons.timer_outlined,
          accentColor: PopoTheme.cyan,
        ),
        _buildMetricCard(
          title: 'Total Viewers',
          value: summary.totalViewersFormatted,
          icon: Icons.visibility_rounded,
          accentColor: const Color(0xFF00E676),
        ),
        _buildMetricCard(
          title: 'New Followers',
          value: summary.newFollowersFormatted,
          icon: Icons.person_add_alt_1_rounded,
          accentColor: const Color(0xFFFF6090),
        ),
        _buildMetricCard(
          title: 'Gifts Received',
          value: '${summary.totalGifts > 0 ? summary.totalGifts : 12}',
          icon: Icons.card_giftcard_rounded,
          accentColor: PopoTheme.gold,
        ),
        _buildMetricCard(
          title: 'Demo Diamonds',
          value: summary.pointsReceivedFormatted,
          icon: Icons.diamond_rounded,
          accentColor: PopoTheme.primary,
        ),
        _buildMetricCard(
          title: 'Total Likes',
          value: '${summary.totalLikes > 0 ? summary.totalLikes : 8500}',
          icon: Icons.favorite_rounded,
          accentColor: const Color(0xFFE040FB),
        ),
      ],
    );
  }

  Widget _buildMetricCard({
    required String title,
    required String value,
    required IconData icon,
    required Color accentColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: PopoTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: PopoTheme.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: accentColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: accentColor, size: 16),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: PopoTheme.textSecondary,
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSessionNoticeCard() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: PopoTheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: PopoTheme.borderSubtle),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: const [
          Icon(Icons.verified_user_outlined,
              color: PopoTheme.cyan, size: 18),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              'Fixture Demonstration Session: All viewer statistics, gifts, and diamonds are simulated locally. No actual financial or network transactions occurred.',
              style: TextStyle(
                color: PopoTheme.textSecondary,
                fontSize: 11,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReturnButton() {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: ElevatedButton(
        key: const Key('return_to_explore_button'),
        style: ElevatedButton.styleFrom(
          padding: EdgeInsets.zero,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          elevation: 6,
          shadowColor: PopoTheme.primary.withOpacity(0.4),
        ),
        onPressed: _returnToExplore,
        child: Ink(
          decoration: BoxDecoration(
            gradient: PopoTheme.primaryGradient,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Container(
            alignment: Alignment.center,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                Icon(
                  Icons.explore_rounded,
                  color: Colors.white,
                  size: 20,
                ),
                SizedBox(width: 8),
                Text(
                  'Return to Explore',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
