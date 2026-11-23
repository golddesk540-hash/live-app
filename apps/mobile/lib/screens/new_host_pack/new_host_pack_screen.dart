import 'package:flutter/material.dart';
import '../../design/design_fixtures.dart';
import '../../widgets/popo_error_state.dart';
import '../../widgets/popo_empty_state.dart';

/// Popo Live — Phase 4 Module 8: New Host Starter Pack Screen
/// Onboarding rewards, starter guides, and one-time pack claim.
class NewHostPackScreen extends StatefulWidget {
  const NewHostPackScreen({super.key});

  @override
  State<NewHostPackScreen> createState() => _NewHostPackScreenState();
}

class _NewHostPackScreenState extends State<NewHostPackScreen> {
  bool _isLoading = true;
  bool _isClaiming = false;
  String? _errorMessage;
  Map<String, dynamic>? _packData;
  final Set<String> _completedGuideIds = {'profile_setup'};

  @override
  void initState() {
    super.initState();
    _loadStarterPack();
  }

  Future<void> _loadStarterPack() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      if (DesignFixtures.isError) {
        throw const DesignFixtureException(
          message: 'Failed to load starter pack: Server busy [ERR_PACK_SYNC_503]',
        );
      }
      final data = DesignFixtures.starterPack.toMap();
      if (!mounted) return;
      setState(() {
        _packData = data;
        _isLoading = false;
      });
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

  Future<void> _handleClaimPack() async {
    setState(() => _isClaiming = true);
    await Future.delayed(const Duration(milliseconds: 200));
    DesignFixtures.claimStarterPack();
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Starter pack claimed! +200 Points, +50 Coins and Rising Star badge added.'),
        backgroundColor: Color(0xFF34D399),
        duration: Duration(seconds: 3),
      ),
    );
    _loadStarterPack();
    if (mounted) {
      setState(() => _isClaiming = false);
    }
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
          'New-Host Pack',
          style: TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadStarterPack,
        color: const Color(0xFFFF1A6C),
        backgroundColor: const Color(0xFF160830),
        child: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFFFF1A6C)),
      );
    }

    if (DesignFixtures.isError || _errorMessage != null) {
      return Center(
        child: PopoErrorState(
          title: 'Starter Pack Unavailable',
          message: _errorMessage ?? 'Server busy [ERR_PACK_SYNC_503]',
          retryText: 'Retry',
          onRetry: _loadStarterPack,
        ),
      );
    }

    if (DesignFixtures.isEmpty || (_packData != null && (_packData!['rewardPoints'] == 0 && _packData!['rewardCoins'] == 0))) {
      return Center(
        child: PopoEmptyState(
          icon: Icons.card_giftcard_outlined,
          title: 'No Starter Pack Available',
          message: 'Creator starter packs are currently not active for this account.',
          actionText: 'Refresh',
          onActionTap: _loadStarterPack,
        ),
      );
    }

    final data = _packData ?? {};
    final title = data['title'] ?? 'Popo Live Host Starter Pack';
    final description = data['description'] ?? 'Welcome bonus for new streaming creators';
    final rewardPoints = data['rewardPoints'] ?? 200;
    final rewardCoins = data['rewardCoins'] ?? 50;
    final badgeName = data['badgeName'] ?? 'Rising Star Host';
    final isClaimed = data['isClaimed'] == true;
    final guides = (data['guides'] as List<dynamic>?) ?? [];

    final completedGuides = _completedGuideIds.length;
    final totalGuides = guides.isNotEmpty ? guides.length : 4;
    final ratio = (completedGuides / totalGuides).clamp(0.0, 1.0);

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          'A starter guide and exclusive gift pack for new creators',
          style: TextStyle(color: Color(0xFFBBA9D6), fontSize: 13),
        ),
        const SizedBox(height: 16),

        // Welcome Hero Banner
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF2E0D4C), Color(0xFF160830)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: Colors.purple.withOpacity(0.35)),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFFFC107).withOpacity(0.12),
                blurRadius: 18,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Column(
            children: [
              const Icon(Icons.auto_awesome, color: Color(0xFFFFC107), size: 40),
              const SizedBox(height: 10),
              Text(
                title.toString().toUpperCase(),
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 17,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0.8,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                description,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Color(0xFFFF85B3), fontSize: 13),
              ),
              const SizedBox(height: 16),

              // Reward Bundle Pills
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _rewardPill(
                    icon: Icons.diamond_rounded,
                    label: '$rewardPoints Points',
                    color: const Color(0xFF00E5FF),
                  ),
                  const SizedBox(width: 8),
                  _rewardPill(
                    icon: Icons.monetization_on_rounded,
                    label: '$rewardCoins Coins',
                    color: const Color(0xFFFFC107),
                  ),
                  const SizedBox(width: 8),
                  _rewardPill(
                    icon: Icons.verified_rounded,
                    label: badgeName,
                    color: const Color(0xFFFF1A6C),
                  ),
                ],
              ),
              const SizedBox(height: 18),

              // Claim Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isClaimed
                        ? const Color(0xFF26183C)
                        : const Color(0xFFFF1A6C),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: const StadiumBorder(),
                    elevation: isClaimed ? 0 : 4,
                  ),
                  onPressed: (isClaimed || _isClaiming) ? null : _handleClaimPack,
                  icon: _isClaiming
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : Icon(
                          isClaimed ? Icons.check_circle_rounded : Icons.card_giftcard_rounded,
                          color: isClaimed ? const Color(0xFF34D399) : Colors.white,
                        ),
                  label: Text(
                    isClaimed ? 'Pack Claimed' : 'Claim Starter Pack Now',
                    style: TextStyle(
                      fontWeight: FontWeight.w900,
                      color: isClaimed ? const Color(0xFFBBA9D6) : Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),

        // Progress bar for guides
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF160830),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.purple.withOpacity(0.24)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Creator Onboarding Checklist',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    '$completedGuides of $totalGuides completed',
                    style: const TextStyle(color: Color(0xFFCBB9E6), fontSize: 12),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              ClipRRect(
                borderRadius: BorderRadius.circular(999),
                child: LinearProgressIndicator(
                  value: ratio,
                  minHeight: 10,
                  backgroundColor: const Color(0xFF2B174A),
                  valueColor: const AlwaysStoppedAnimation(Color(0xFFFF1A6C)),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),

        const Text(
          'Starter Guides',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 12),

        ...guides.map((guide) {
          final String guideId = guide['id'] ?? '';
          final String guideTitle = guide['title'] ?? '';
          final String guideSubtitle = guide['subtitle'] ?? '';
          final bool isDone = _completedGuideIds.contains(guideId);

          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF130728),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isDone
                    ? const Color(0xFF34D399).withOpacity(0.45)
                    : Colors.purple.withOpacity(0.24),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        guideTitle,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        guideSubtitle,
                        style: const TextStyle(
                          color: Color(0xFFBBA9D6),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () {
                    setState(() {
                      if (isDone) {
                        _completedGuideIds.remove(guideId);
                      } else {
                        _completedGuideIds.add(guideId);
                      }
                    });
                  },
                  icon: Icon(
                    isDone ? Icons.check_circle : Icons.radio_button_unchecked,
                    color: isDone ? const Color(0xFF34D399) : Colors.white54,
                  ),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }

  Widget _rewardPill({
    required IconData icon,
    required String label,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.4)),
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
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}
