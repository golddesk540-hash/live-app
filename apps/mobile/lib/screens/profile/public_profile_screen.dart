import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../theme/popo_theme.dart';
import '../../l10n/strings.dart';
import '../../widgets/popo_primary_button.dart';
import '../../widgets/popo_icon_button.dart';
import '../../widgets/popo_card.dart';
import '../../widgets/popo_loading_indicator.dart';
import '../../widgets/popo_error_state.dart';
import '../../api/api.dart';

/// Public user profile card screen displaying public badges, counts, and follow state
class PublicProfileScreen extends StatefulWidget {
  final String userId;

  const PublicProfileScreen({Key? key, required this.userId}) : super(key: key);

  @override
  State<PublicProfileScreen> createState() => _PublicProfileScreenState();
}

class _PublicProfileScreenState extends State<PublicProfileScreen> {
  final ProfileService _profileService = ProfileService();

  bool _isLoading = true;
  String? _errorMessage;
  Map<String, dynamic>? _profile;
  bool _isFollowing = false;

  @override
  void initState() {
    super.initState();
    _loadPublicProfile();
  }

  Future<void> _loadPublicProfile() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final response = await _profileService.getPublicProfile(widget.userId);

    if (!mounted) return;

    if (response.isSuccess &&
        response.data is Map &&
        response.data['profile'] != null) {
      setState(() {
        _profile = Map<String, dynamic>.from(response.data['profile']);
        _isFollowing = _profile?['isFollowing'] == true;
        _isLoading = false;
      });
    } else {
      setState(() {
        _isLoading = false;
        _errorMessage = response.message ?? 'User profile not found.';
      });
    }
  }

  void _copyPoppoId(String poppoId) {
    Clipboard.setData(ClipboardData(text: poppoId));
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
    return ValueListenableBuilder<String>(
      valueListenable: PopoStrings.currentLanguage,
      builder: (context, lang, _) {
        return Scaffold(
          backgroundColor: PopoTheme.background,
          appBar: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            leading: PopoIconButton(
              icon: Icons.arrow_back_ios_new_rounded,
              iconSize: 18,
              tooltip: 'Back',
              onPressed: () => Navigator.of(context).maybePop(),
            ),
            actions: [
              PopoIconButton(
                icon: Icons.translate_rounded,
                color: PopoTheme.cyan,
                tooltip: 'Switch Language (English / اردو)',
                onPressed: PopoStrings.toggleLanguage,
              ),
              const SizedBox(width: 8),
            ],
          ),
          body: _buildBody(),
        );
      },
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: PopoLoadingIndicator());
    }

    if (_errorMessage != null) {
      return PopoErrorState(
        message: _errorMessage,
        onRetry: _loadPublicProfile,
      );
    }

    final p = _profile ?? {};
    final nickname = p['nickname'] ?? 'User';
    final poppoId = p['poppoId'] ?? '';
    final avatarUrl = p['avatarUrl'] ?? '';
    final country = p['country'] ?? 'Global';
    final countryCode = p['countryCode'] ?? '';
    final bio = p['bio']?.toString() ?? '';
    final followersCount = p['followersCount'] ?? 0;
    final followingCount = p['followingCount'] ?? 0;
    final totalGifts = p['totalGifts'] ?? 0;
    final wealthLevel = p['wealthLevel'] ?? 1;
    final hostLevel = p['hostLevel'] ?? 1;
    final isSelf = p['isSelf'] == true;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: Column(
        children: [
          // Profile Header Card
          PopoCard(
            padding: const EdgeInsets.all(24),
            hasGlow: true,
            glowColor: PopoTheme.primary,
            child: Column(
              children: [
                // Avatar with gold/pink gradient ring
                Container(
                  padding: const EdgeInsets.all(3),
                  decoration: BoxDecoration(
                    gradient: PopoTheme.primaryGradient,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: PopoTheme.primary.withOpacity(0.35),
                        blurRadius: 16,
                      ),
                    ],
                  ),
                  child: CircleAvatar(
                    radius: 46,
                    backgroundColor: PopoTheme.surface,
                    backgroundImage: avatarUrl.startsWith('http')
                        ? NetworkImage(avatarUrl)
                        : null,
                    child: !avatarUrl.startsWith('http')
                        ? const Icon(
                            Icons.person,
                            color: PopoTheme.textSecondary,
                            size: 48,
                          )
                        : null,
                  ),
                ),
                const SizedBox(height: 16),

                // Nickname
                Text(
                  nickname,
                  style: const TextStyle(
                    color: PopoTheme.textPrimary,
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 6),

                // Numeric ID with Copy action
                InkWell(
                  onTap: () => _copyPoppoId(poppoId.toString()),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.06),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '${PopoStrings.get('user_id')}: $poppoId',
                          style: const TextStyle(
                            color: PopoTheme.textSecondary,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(width: 6),
                        const Icon(
                          Icons.copy_rounded,
                          color: PopoTheme.cyan,
                          size: 14,
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // Location Tag
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.location_on_rounded,
                      color: PopoTheme.gold,
                      size: 14,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      country,
                      style: const TextStyle(
                        color: PopoTheme.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),

                if (bio.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  Text(
                    bio,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: PopoTheme.textSecondary,
                      fontSize: 13,
                      height: 1.4,
                    ),
                  ),
                ],

                const SizedBox(height: 20),

                // Level Badges Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _buildLevelPill(
                      label: '${PopoStrings.get('wealth_level')} $wealthLevel',
                      color: PopoTheme.gold,
                      icon: Icons.diamond_rounded,
                    ),
                    const SizedBox(width: 10),
                    _buildLevelPill(
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

          // Counts Row
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  title: PopoStrings.get('followers'),
                  value: '$followersCount',
                  icon: Icons.group_outlined,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  title: PopoStrings.get('following'),
                  value: '$followingCount',
                  icon: Icons.person_add_alt_1_outlined,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  title: PopoStrings.get('gifts_received'),
                  value: '$totalGifts',
                  icon: Icons.card_giftcard_rounded,
                ),
              ),
            ],
          ),

          if (!isSelf) ...[
            const SizedBox(height: 24),
            PopoPrimaryButton(
              text: _isFollowing
                  ? PopoStrings.get('unfollow')
                  : PopoStrings.get('follow'),
              icon: _isFollowing ? Icons.check_rounded : Icons.add_rounded,
              onPressed: () {
                setState(() {
                  _isFollowing = !_isFollowing;
                });
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      _isFollowing
                          ? 'Followed $nickname'
                          : 'Unfollowed $nickname',
                    ),
                    backgroundColor: PopoTheme.surface,
                    duration: const Duration(seconds: 1),
                  ),
                );
              },
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildLevelPill({
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
          const SizedBox(width: 5),
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

  Widget _buildStatCard({
    required String title,
    required String value,
    required IconData icon,
  }) {
    return PopoCard(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
      child: Column(
        children: [
          Icon(icon, color: PopoTheme.textSecondary, size: 18),
          const SizedBox(height: 6),
          Text(
            value,
            style: const TextStyle(
              color: PopoTheme.textPrimary,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            title,
            style: const TextStyle(
              color: PopoTheme.textSecondary,
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }
}
