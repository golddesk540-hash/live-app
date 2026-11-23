import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../theme/popo_theme.dart';
import '../../design/design_fixtures.dart';
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

    try {
      if (ApiConfig.useFinalApi) {
        final res = await FinalApiService.instance.fetchPublicProfile(widget.userId);
        if (!mounted) return;
        if (res.isSuccess && res.data != null) {
          final data = res.data;
          final profileMap = (data is Map<String, dynamic> && data['profile'] is Map<String, dynamic>)
              ? data['profile'] as Map<String, dynamic>
              : (data is Map<String, dynamic> ? data : null);
          if (profileMap != null) {
            setState(() {
              _profile = profileMap;
              _isFollowing = profileMap['isFollowing'] == true;
              _isLoading = false;
            });
            return;
          }
        }
        setState(() {
          _errorMessage = res.error ?? res.message ?? 'User not found';
          _isLoading = false;
        });
        return;
      }

      if (DesignFixtures.isError) {
        throw const DesignFixtureException(
          message: 'User profile query failed: Server busy [ERR_PROFILE_503]',
        );
      }

      // Check relations in DesignFixtures
      FixtureUserRelation? matchRelation;
      final allRelations = [
        ...DesignFixtures.friends,
        ...DesignFixtures.following,
        ...DesignFixtures.followers,
        ...DesignFixtures.visitors,
      ];
      for (final rel in allRelations) {
        if (rel.userId == widget.userId) {
          matchRelation = rel;
          break;
        }
      }

      final currentUser = DesignFixtures.currentUserProfile;
      final isSelf = widget.userId == currentUser.userId ||
          widget.userId == currentUser.poppoId ||
          widget.userId.isEmpty;

      if (isSelf) {
        setState(() {
          _profile = {
            'nickname': currentUser.nickname,
            'poppoId': currentUser.poppoId,
            'avatarUrl': currentUser.avatarUrl,
            'country': currentUser.country,
            'countryCode': currentUser.countryCode,
            'bio': currentUser.bio,
            'followersCount': currentUser.followersCount,
            'followingCount': currentUser.followingCount,
            'totalGifts': 3420,
            'wealthLevel': currentUser.wealthLevel,
            'hostLevel': currentUser.hostLevel,
            'isFollowing': false,
            'isSelf': true,
          };
          _isFollowing = false;
          _isLoading = false;
        });
        return;
      }

      if (matchRelation != null) {
        setState(() {
          _profile = {
            'nickname': matchRelation!.nickname,
            'poppoId': matchRelation.userId,
            'avatarUrl': matchRelation.avatarUrl,
            'country': matchRelation.country,
            'countryCode': 'PK',
            'bio': 'Streaming creator & Popo Live community star 🌟',
            'followersCount': 12400,
            'followingCount': 230,
            'totalGifts': 8920,
            'wealthLevel': 14,
            'hostLevel': 16,
            'isFollowing': DesignFixtures.isUserFollowed(widget.userId),
            'isSelf': false,
          };
          _isFollowing = DesignFixtures.isUserFollowed(widget.userId);
          _isLoading = false;
        });
        return;
      }

      // Default fallback profile
      setState(() {
        _profile = {
          'nickname': 'Ayesha Khan',
          'poppoId': widget.userId,
          'avatarUrl':
              'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
          'country': 'Pakistan',
          'countryCode': 'PK',
          'bio': 'Popo Live Host & Musician 🎵',
          'followersCount': 8900,
          'followingCount': 150,
          'totalGifts': 5400,
          'wealthLevel': 12,
          'hostLevel': 15,
          'isFollowing': DesignFixtures.isUserFollowed(widget.userId),
          'isSelf': false,
        };
        _isFollowing = DesignFixtures.isUserFollowed(widget.userId);
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

  Future<void> _handleFollowToggle() async {
    final nickname = _profile?['nickname']?.toString() ?? 'user';
    if (ApiConfig.useFinalApi) {
      final wasFollowing = _isFollowing;
      try {
        final res = wasFollowing
            ? await FinalApiService.instance.unfollowUser(widget.userId)
            : await FinalApiService.instance.followUser(widget.userId);

        if (!mounted) return;
        if (!res.isSuccess) {
          ScaffoldMessenger.of(context).clearSnackBars();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(res.error ?? res.message ?? 'Failed to update follow status.'),
              backgroundColor: PopoTheme.danger,
              duration: const Duration(seconds: 2),
            ),
          );
          return;
        }

        final data = res.data is Map<String, dynamic> ? res.data as Map<String, dynamic> : null;
        final next = data != null && data.containsKey('isFollowing')
            ? data['isFollowing'] == true
            : !wasFollowing;
        final newFollowers = data != null && data.containsKey('followersCount')
            ? (data['followersCount'] as num).toInt()
            : ((_profile?['followersCount'] as int? ?? 0) + (next ? 1 : -1));

        setState(() {
          _isFollowing = next;
          if (_profile != null) {
            _profile = Map<String, dynamic>.from(_profile!);
            _profile!['followersCount'] = newFollowers < 0 ? 0 : newFollowers;
            _profile!['isFollowing'] = next;
          }
        });

        ScaffoldMessenger.of(context).clearSnackBars();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next ? 'Followed $nickname' : 'Unfollowed $nickname'),
            backgroundColor: PopoTheme.surface,
            duration: const Duration(seconds: 2),
          ),
        );
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).clearSnackBars();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: PopoTheme.danger,
            duration: const Duration(seconds: 2),
          ),
        );
      }
      return;
    }

    final next = DesignFixtures.toggleFollow(widget.userId);
    setState(() {
      _isFollowing = next;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(next ? 'Followed $nickname' : 'Unfollowed $nickname'),
        backgroundColor: PopoTheme.surface,
        duration: const Duration(seconds: 1),
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
    // ignore: unused_local_variable
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
              onPressed: _handleFollowToggle,
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
