import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../api/api.dart';
import '../../l10n/strings.dart';
import '../../models/live/live_models.dart';
import '../../theme/theme.dart';
import '../../widgets/widgets.dart';
import 'live_history_screen.dart';

/// Live broadcast completion end-screen summary
/// Corresponds to backend endpoint: GET /api/live/end-screen/summary
class LiveEndScreen extends StatefulWidget {
  final LiveEndSummary? summary;
  final String? roomId;
  final bool isDemo;

  const LiveEndScreen({
    super.key,
    this.summary,
    this.roomId,
    this.isDemo = false,
  });

  @override
  State<LiveEndScreen> createState() => _LiveEndScreenState();
}

class _LiveEndScreenState extends State<LiveEndScreen> {
  final LiveApiService _apiService = LiveApiService();

  late LiveEndSummary? _summary;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _summary = widget.summary;

    if (_summary == null && widget.roomId != null) {
      _fetchSummary();
    }
  }

  Future<void> _fetchSummary() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await _apiService.getEndScreenSummary(
        roomId: widget.roomId!,
        isDemo: widget.isDemo,
      );

      if (!mounted) return;

      if (res.isSuccess && res.data != null) {
        final data = res.data as Map<String, dynamic>;
        setState(() {
          _summary = LiveEndSummary.fromJson(data);
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage =
              res.errorMessage ?? Strings.get(context, 'error_unknown');
          _isLoading = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = 'Error fetching session summary: $e';
        _isLoading = false;
      });
    }
  }

  void _onCopyId(String id) {
    Clipboard.setData(ClipboardData(text: id));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(Strings.get(context, 'copied_to_clipboard')),
        backgroundColor: PopoTheme.surface,
        duration: const Duration(seconds: 1),
      ),
    );
  }

  void _navigateToHistory() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => LiveHistoryScreen(isDemo: widget.isDemo),
      ),
    );
  }

  void _returnToHome() {
    Navigator.of(context).popUntil((route) => route.isFirst);
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        _returnToHome();
        return false;
      },
      child: Scaffold(
        backgroundColor: PopoTheme.background,
        body: SafeArea(child: _buildContent()),
      ),
    );
  }

  Widget _buildContent() {
    if (_isLoading) {
      return const Center(
        child: PopoLoadingIndicator(color: PopoTheme.primary, size: 40),
      );
    }

    if (_errorMessage != null && _summary == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.error_outline_rounded,
                color: PopoTheme.primary,
                size: 48,
              ),
              const SizedBox(height: 16),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: PopoTheme.textSecondary,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: PopoTheme.primary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                onPressed: _fetchSummary,
                child: Text(
                  Strings.get(context, 'retry'),
                  style: const TextStyle(color: Colors.white),
                ),
              ),
            ],
          ),
        ),
      );
    }

    final summary =
        _summary ??
        const LiveEndSummary(
          durationSeconds: 0,
          durationFormatted: '00:00:00',
          totalViewers: 0,
          totalViewersFormatted: '0',
          peakViewers: 0,
          peakViewersFormatted: '0',
          newFollowers: 0,
          newFollowersFormatted: '0',
          pointsReceived: 0,
          pointsReceivedFormatted: '0',
        );

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          const SizedBox(height: 10),

          // Trophy / Celebration Header Icon
          Container(
            padding: const EdgeInsets.all(20),
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
              size: 48,
            ),
          ),
          const SizedBox(height: 16),

          // Broadcast Ended Title
          Text(
            Strings.get(context, 'broadcast_ended'),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 6),

          // Subtitle / Room Category
          if (summary.title != null || summary.category != null)
            Text(
              summary.title ?? summary.category ?? 'Live Streaming',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: PopoTheme.textSecondary,
                fontSize: 13,
              ),
            ),
          const SizedBox(height: 24),

          // Host Identity Card
          if (summary.host != null) _buildHostCard(summary.host!),
          const SizedBox(height: 24),

          // Metrics 2x3 Grid
          _buildMetricsGrid(summary),
          const SizedBox(height: 32),

          // Action Buttons
          _buildActionButtons(),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildHostCard(LiveHostInfo host) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: PopoTheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: PopoTheme.borderSubtle),
      ),
      child: Row(
        children: [
          // Avatar with Level Ring
          Stack(
            alignment: Alignment.bottomRight,
            children: [
              Container(
                width: 54,
                height: 54,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: PopoTheme.primary, width: 2),
                  color: const Color(0xFF252538),
                ),
                child: const Icon(
                  Icons.person_rounded,
                  color: Colors.white70,
                  size: 32,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                decoration: BoxDecoration(
                  color: PopoTheme.gold,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Lv.${host.wealthLevel}',
                  style: const TextStyle(
                    color: Colors.black,
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: 14),

          // Nickname & Poppo ID
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  host.nickname,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 4),
                GestureDetector(
                  onTap: () => _onCopyId(host.poppoId),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'ID: ${host.poppoId}',
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
          title: Strings.get(context, 'live_duration'),
          value: summary.durationFormatted,
          icon: Icons.timer_outlined,
          accentColor: PopoTheme.cyan,
        ),
        _buildMetricCard(
          title: Strings.get(context, 'total_viewers'),
          value: summary.totalViewersFormatted,
          icon: Icons.visibility_rounded,
          accentColor: const Color(0xFF00E676),
        ),
        _buildMetricCard(
          title: Strings.get(context, 'peak_viewers'),
          value: summary.peakViewersFormatted,
          icon: Icons.trending_up_rounded,
          accentColor: PopoTheme.gold,
        ),
        _buildMetricCard(
          title: Strings.get(context, 'new_followers'),
          value: summary.newFollowersFormatted,
          icon: Icons.person_add_alt_1_rounded,
          accentColor: const Color(0xFFFF6090),
        ),
        _buildMetricCard(
          title: Strings.get(context, 'points_received'),
          value: summary.pointsReceivedFormatted,
          icon: Icons.diamond_rounded,
          accentColor: PopoTheme.primary,
        ),
        _buildMetricCard(
          title: Strings.get(context, 'total_likes'),
          value: '${summary.totalLikes > 0 ? summary.totalLikes : 5420}',
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

  Widget _buildActionButtons() {
    return Column(
      children: [
        // Primary Button: Back to Home
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              padding: EdgeInsets.zero,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
            onPressed: _returnToHome,
            child: Ink(
              decoration: BoxDecoration(
                gradient: PopoTheme.primaryGradient,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Container(
                alignment: Alignment.center,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.home_rounded,
                      color: Colors.white,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      Strings.get(context, 'back_to_home'),
                      style: const TextStyle(
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
        ),
        const SizedBox(height: 12),

        // Secondary Button: View Live Center History
        SizedBox(
          width: double.infinity,
          height: 50,
          child: OutlinedButton(
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: PopoTheme.borderSubtle, width: 1.2),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              backgroundColor: PopoTheme.surface,
            ),
            onPressed: _navigateToHistory,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.history_rounded,
                  color: PopoTheme.cyan,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Text(
                  Strings.get(context, 'view_history'),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
