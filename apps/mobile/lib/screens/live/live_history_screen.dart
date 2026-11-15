import 'package:flutter/material.dart';

import '../../api/api.dart';
import '../../l10n/strings.dart';
import '../../models/live/live_models.dart';
import '../../theme/theme.dart';
import '../../widgets/widgets.dart';

/// Host Live Streaming Center Past History Screen
/// Integrates endpoint: GET /api/live/center/history
class LiveHistoryScreen extends StatefulWidget {
  final bool isDemo;

  const LiveHistoryScreen({super.key, this.isDemo = false});

  @override
  State<LiveHistoryScreen> createState() => _LiveHistoryScreenState();
}

class _LiveHistoryScreenState extends State<LiveHistoryScreen> {
  final LiveApiService _apiService = LiveApiService();

  String _selectedFilter = 'all'; // 'all', 'week', 'month'
  bool _isLoading = true;
  String? _errorMessage;

  LiveHistoryResponse? _historyData;

  @override
  void initState() {
    super.initState();
    _fetchHistory();
  }

  Future<void> _fetchHistory() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await _apiService.getLiveHistory(
        filter: _selectedFilter,
        isDemo: widget.isDemo,
      );

      if (!mounted) return;

      if (res.isSuccess && res.data != null) {
        final data = res.data as Map<String, dynamic>;
        setState(() {
          _historyData = LiveHistoryResponse.fromJson(data);
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
        _errorMessage = 'Error loading history: $e';
        _isLoading = false;
      });
    }
  }

  void _onFilterChanged(String filter) {
    if (_selectedFilter == filter) return;
    setState(() => _selectedFilter = filter);
    _fetchHistory();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: PopoTheme.background,
      appBar: AppBar(
        backgroundColor: PopoTheme.surface,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_new_rounded,
            color: Colors.white,
            size: 20,
          ),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          Strings.get(context, 'live_history_title'),
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading && _historyData == null) {
      return const Center(
        child: PopoLoadingIndicator(color: PopoTheme.primary, size: 40),
      );
    }

    if (_errorMessage != null && _historyData == null) {
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
                onPressed: _fetchHistory,
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

    return RefreshIndicator(
      onRefresh: _fetchHistory,
      color: PopoTheme.primary,
      backgroundColor: PopoTheme.surface,
      child: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        children: [
          // Aggregated KPI Section
          if (_historyData?.kpis != null) _buildKpiGrid(_historyData!.kpis!),
          const SizedBox(height: 20),

          // Filter Segmented Bar
          _buildFilterBar(),
          const SizedBox(height: 16),

          // Sessions Count Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${_historyData?.sessions.length ?? 0} Recorded Sessions',
                style: const TextStyle(
                  color: PopoTheme.textSecondary,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
              if (_isLoading)
                const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      PopoTheme.primary,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),

          // Session List or Empty State
          if (_historyData?.sessions.isEmpty ?? true)
            _buildEmptyState()
          else
            ...(_historyData!.sessions.map(_buildSessionCard)),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildKpiGrid(LiveHistoryKpis kpis) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: PopoTheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: PopoTheme.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.insights_rounded, color: PopoTheme.gold, size: 20),
              SizedBox(width: 8),
              Text(
                'Live Center Performance KPIs',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildKpiTile(
                  title: Strings.get(context, 'total_sessions'),
                  value: '${kpis.totalSessions}',
                  icon: Icons.video_camera_front_rounded,
                  color: PopoTheme.cyan,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildKpiTile(
                  title: Strings.get(context, 'live_duration'),
                  value: kpis.totalDurationFormatted,
                  icon: Icons.timer_outlined,
                  color: PopoTheme.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildKpiTile(
                  title: Strings.get(context, 'total_viewers'),
                  value: kpis.totalViewersFormatted,
                  icon: Icons.visibility_rounded,
                  color: const Color(0xFF00E676),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildKpiTile(
                  title: Strings.get(context, 'new_followers'),
                  value: kpis.totalFollowersFormatted,
                  icon: Icons.person_add_alt_1_rounded,
                  color: PopoTheme.gold,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildKpiTile({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF1B1B26),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withOpacity(0.18)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 16),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: PopoTheme.textSecondary,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterBar() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: PopoTheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: PopoTheme.borderSubtle),
      ),
      child: Row(
        children: [
          Expanded(
            child: _buildFilterTab(
              label: Strings.get(context, 'history_filter_all'),
              filterKey: 'all',
            ),
          ),
          Expanded(
            child: _buildFilterTab(
              label: Strings.get(context, 'history_filter_week'),
              filterKey: 'week',
            ),
          ),
          Expanded(
            child: _buildFilterTab(
              label: Strings.get(context, 'history_filter_month'),
              filterKey: 'month',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterTab({required String label, required String filterKey}) {
    final isSelected = _selectedFilter == filterKey;
    return GestureDetector(
      onTap: () => _onFilterChanged(filterKey),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? PopoTheme.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : PopoTheme.textSecondary,
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
          ),
        ),
      ),
    );
  }

  Widget _buildSessionCard(LiveHistorySessionItem session) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: PopoTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: PopoTheme.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Cover thumbnail / category box
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  color: const Color(0xFF252538),
                ),
                child: const Icon(
                  Icons.live_tv_rounded,
                  color: PopoTheme.primary,
                  size: 26,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      session.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: PopoTheme.primary.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            session.category,
                            style: const TextStyle(
                              color: PopoTheme.primary,
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Room #${session.roomNumber}',
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
              // Duration Pill
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E1E2D),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: PopoTheme.borderSubtle),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.timer_outlined,
                      color: PopoTheme.cyan,
                      size: 12,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      session.durationFormatted,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(color: PopoTheme.borderSubtle, height: 1),
          const SizedBox(height: 10),

          // Performance Stats Grid inside Card
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildMetricChip(
                icon: Icons.visibility_rounded,
                color: PopoTheme.cyan,
                value: session.totalViewersFormatted,
                label: 'Viewers',
              ),
              _buildMetricChip(
                icon: Icons.trending_up_rounded,
                color: const Color(0xFF00E676),
                value: session.peakViewersFormatted,
                label: 'Peak',
              ),
              _buildMetricChip(
                icon: Icons.person_add_rounded,
                color: PopoTheme.gold,
                value: '+${session.newFollowers}',
                label: 'Follows',
              ),
              _buildMetricChip(
                icon: Icons.diamond_rounded,
                color: PopoTheme.primary,
                value: '${session.pointsReceived}',
                label: 'Points',
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMetricChip({
    required IconData icon,
    required Color color,
    required String value,
    required String label,
  }) {
    return Column(
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: color, size: 13),
            const SizedBox(width: 4),
            Text(
              value,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(color: PopoTheme.textSecondary, fontSize: 10),
        ),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
      alignment: Alignment.center,
      child: Column(
        children: const [
          Icon(
            Icons.history_toggle_off_rounded,
            color: PopoTheme.textSecondary,
            size: 54,
          ),
          SizedBox(height: 12),
          Text(
            'No broadcast sessions found in this period',
            style: TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          SizedBox(height: 4),
          Text(
            'Start a live stream to record sessions and track performance stats.',
            textAlign: TextAlign.center,
            style: TextStyle(color: PopoTheme.textSecondary, fontSize: 12),
          ),
        ],
      ),
    );
  }
}
