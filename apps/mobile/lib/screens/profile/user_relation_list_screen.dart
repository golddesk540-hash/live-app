import 'package:flutter/material.dart';

import '../../theme/popo_theme.dart';
import '../../design/design_fixtures.dart';
import '../../widgets/popo_empty_state.dart';
import '../../widgets/popo_error_state.dart';
import '../../api/api_config.dart';
import '../../api/services/final_api_service.dart';

/// Available relation list categories
enum UserRelationType {
  friends,
  following,
  followers,
  visitors,
}

/// Dedicated 4-List Screen for Popo Live User Relations (Section 4, R2)
/// Implements full person rows for Friends, Following, Followers, and Visitors.
class UserRelationListScreen extends StatefulWidget {
  final UserRelationType type;
  final int count;
  final String? userId;

  const UserRelationListScreen({
    super.key,
    required this.type,
    required this.count,
    this.userId,
  });

  @override
  State<UserRelationListScreen> createState() => _UserRelationListScreenState();
}

class _UserRelationListScreenState extends State<UserRelationListScreen> {
  bool _isLoading = false;
  String? _error;
  List<FixtureUserRelation>? _livePeople;
  int? _liveCount;

  @override
  void initState() {
    super.initState();
    if (ApiConfig.useFinalApi) {
      _fetchData();
    }
  }

  Future<void> _fetchData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final target = widget.userId ?? 'me';
    try {
      final res = await () {
        switch (widget.type) {
          case UserRelationType.friends:
            return FinalApiService.instance.fetchFriends(target);
          case UserRelationType.following:
            return FinalApiService.instance.fetchFollowing(target);
          case UserRelationType.followers:
            return FinalApiService.instance.fetchFollowers(target);
          case UserRelationType.visitors:
            return FinalApiService.instance.fetchVisitors(target);
        }
      }();

      if (!mounted) return;

      if (!res.isSuccess || res.data == null) {
        setState(() {
          _isLoading = false;
          _error = res.error ?? res.message ?? 'Failed to load $_title list.';
        });
        return;
      }

      final data = res.data is Map<String, dynamic>
          ? res.data as Map<String, dynamic>
          : <String, dynamic>{};
      final rawItems = (data['items'] ??
          data['following'] ??
          data['followers'] ??
          data['friends'] ??
          data['visitors']) as List<dynamic>? ?? [];
      final relationTypeStr = widget.type == UserRelationType.friends
          ? 'friend'
          : widget.type == UserRelationType.following
              ? 'following'
              : widget.type == UserRelationType.followers
                  ? 'follower'
                  : 'visitor';

      final items = rawItems
          .whereType<Map<String, dynamic>>()
          .map((m) => FixtureUserRelation.fromMap(m, relationType: relationTypeStr))
          .toList();

      setState(() {
        _isLoading = false;
        _livePeople = items;
        _liveCount = (data['totalCount'] as num?)?.toInt() ?? items.length;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _error = e.toString();
      });
    }
  }

  String get _title {
    switch (widget.type) {
      case UserRelationType.friends:
        return 'Friends';
      case UserRelationType.following:
        return 'Following';
      case UserRelationType.followers:
        return 'Followers';
      case UserRelationType.visitors:
        return 'Visitors';
    }
  }

  IconData get _icon {
    switch (widget.type) {
      case UserRelationType.friends:
        return Icons.people_alt_rounded;
      case UserRelationType.following:
        return Icons.person_add_alt_1_rounded;
      case UserRelationType.followers:
        return Icons.favorite_rounded;
      case UserRelationType.visitors:
        return Icons.remove_red_eye_rounded;
    }
  }

  String _formatNumber(int number) {
    final str = number.toString();
    final regExp = RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))');
    return str.replaceAllMapped(regExp, (Match m) => '${m[1]},');
  }

  List<FixtureUserRelation> _loadPeople() {
    switch (widget.type) {
      case UserRelationType.friends:
        return DesignFixtures.friends;
      case UserRelationType.following:
        return DesignFixtures.following;
      case UserRelationType.followers:
        return DesignFixtures.followers;
      case UserRelationType.visitors:
        return DesignFixtures.visitors;
    }
  }

  Future<void> _handleToggleFollow(FixtureUserRelation person) async {
    if (ApiConfig.useFinalApi) {
      final wasFollowing = person.isFollowing;
      final targetId = person.userId;
      try {
        final res = wasFollowing
            ? await FinalApiService.instance.unfollowUser(targetId)
            : await FinalApiService.instance.followUser(targetId);

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

        // Update in _livePeople
        setState(() {
          if (_livePeople != null) {
            _livePeople = _livePeople!.map((p) {
              if (p.userId == targetId) {
                return p.copyWith(isFollowing: next);
              }
              return p;
            }).toList();
          }
        });

        ScaffoldMessenger.of(context).clearSnackBars();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              next
                  ? 'Followed ${person.nickname}'
                  : 'Unfollowed ${person.nickname}',
              style: const TextStyle(color: Colors.white, fontSize: 13),
            ),
            backgroundColor: next ? PopoTheme.primary : PopoTheme.surface,
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

    final isNowFollowed = DesignFixtures.toggleFollow(person.userId);
    setState(() {});

    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          isNowFollowed
              ? 'Followed ${person.nickname}'
              : 'Unfollowed ${person.nickname}',
          style: const TextStyle(color: Colors.white, fontSize: 13),
        ),
        backgroundColor: isNowFollowed ? PopoTheme.primary : PopoTheme.surface,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final displayCount = ApiConfig.useFinalApi
        ? (_liveCount ?? widget.count)
        : widget.count;
    final formattedCount = _formatNumber(displayCount);

    return Scaffold(
      backgroundColor: PopoTheme.background,
      appBar: AppBar(
        backgroundColor: PopoTheme.surface,
        elevation: 0,
        centerTitle: false,
        title: Text(
          '$_title ($formattedCount)',
          style: const TextStyle(
            color: PopoTheme.textPrimary,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded,
              color: PopoTheme.textPrimary, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    // Mode A: Final API Live Mode
    if (ApiConfig.useFinalApi) {
      if (_isLoading) {
        return const Center(
          child: CircularProgressIndicator(color: PopoTheme.primary),
        );
      }

      if (_error != null) {
        return PopoErrorState(
          title: '$_title Unavailable',
          message: _error!,
          onRetry: _fetchData,
        );
      }

      final people = _livePeople ?? [];
      if (people.isEmpty) {
        return PopoEmptyState(
          icon: _icon,
          title: 'No $_title Yet',
          message: widget.type == UserRelationType.friends
              ? 'Connect and follow users back to form mutual friendships.'
              : widget.type == UserRelationType.following
                  ? 'Discover talented broadcasters on Popo Live and follow them.'
                  : widget.type == UserRelationType.followers
                      ? 'Start live broadcasting and sharing posts on Square to gain fans.'
                      : 'Recent viewers of your profile will be listed here.',
        );
      }

      final formattedCount = _formatNumber(_liveCount ?? people.length);
      return RefreshIndicator(
        onRefresh: _fetchData,
        color: PopoTheme.primary,
        child: Column(
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: const BoxDecoration(
                color: PopoTheme.surface,
                border: Border(
                  bottom: BorderSide(color: PopoTheme.borderSubtle, width: 1),
                ),
              ),
              child: Row(
                children: [
                  Icon(_icon, color: PopoTheme.primary, size: 18),
                  const SizedBox(width: 8),
                  Text(
                    '$formattedCount $_title',
                    style: const TextStyle(
                      color: PopoTheme.textSecondary,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(vertical: 8),
                itemCount: people.length,
                separatorBuilder: (context, index) => const Divider(
                  color: PopoTheme.borderSubtle,
                  height: 1,
                  indent: 72,
                  endIndent: 16,
                ),
                itemBuilder: (context, index) {
                  final person = people[index];
                  final isFollowed = person.isFollowing;
                  return _buildPersonRow(person, isFollowed);
                },
              ),
            ),
          ],
        ),
      );
    }

    // Mode B: Design Fixtures Mode (Preserves 100% test & offline compatibility)
    // 1. Error state handling
    if (DesignFixtures.isError) {
      return PopoErrorState(
        title: '$_title Unavailable',
        message:
            'Unable to synchronize $_title list from network. Please check your connection and retry.',
        onRetry: () => setState(() {}),
      );
    }

    // 2. Fetch list safely
    List<FixtureUserRelation> people = [];
    try {
      people = _loadPeople();
    } catch (e) {
      return PopoErrorState(
        title: '$_title Unavailable',
        message: e.toString(),
        onRetry: () => setState(() {}),
      );
    }

    // 3. Empty state handling
    if (DesignFixtures.isEmpty || people.isEmpty) {
      return PopoEmptyState(
        icon: _icon,
        title: 'No $_title Yet',
        message: widget.type == UserRelationType.friends
            ? 'Connect and follow users back to form mutual friendships.'
            : widget.type == UserRelationType.following
                ? 'Discover talented broadcasters on Popo Live and follow them.'
                : widget.type == UserRelationType.followers
                    ? 'Start live broadcasting and sharing posts on Square to gain fans.'
                    : 'Recent viewers of your profile will be listed here.',
      );
    }

    // 4. Filled state with header and person rows
    final formattedCount = _formatNumber(widget.count);

    return Column(
      children: [
        // List Header displaying profile count
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: const BoxDecoration(
            color: PopoTheme.surface,
            border: Border(
              bottom: BorderSide(color: PopoTheme.borderSubtle, width: 1),
            ),
          ),
          child: Row(
            children: [
              Icon(_icon, color: PopoTheme.primary, size: 18),
              const SizedBox(width: 8),
              Text(
                '$formattedCount $_title',
                style: const TextStyle(
                  color: PopoTheme.textSecondary,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),

        // List of person rows
        Expanded(
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: people.length,
            separatorBuilder: (context, index) => const Divider(
              color: PopoTheme.borderSubtle,
              height: 1,
              indent: 72,
              endIndent: 16,
            ),
            itemBuilder: (context, index) {
              final person = people[index];
              final isFollowed = DesignFixtures.isUserFollowed(person.userId);

              return _buildPersonRow(person, isFollowed);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildPersonRow(FixtureUserRelation person, bool isFollowed) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          // User Avatar with online indicator
          Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: PopoTheme.borderSubtle,
                    width: 1.5,
                  ),
                ),
                child: ClipOval(
                  child: Image.network(
                    person.avatarUrl,
                    width: 48,
                    height: 48,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      color: PopoTheme.surfaceLight,
                      child: const Icon(
                        Icons.person_rounded,
                        color: PopoTheme.textSecondary,
                        size: 26,
                      ),
                    ),
                  ),
                ),
              ),
              if (person.isOnline)
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    width: 13,
                    height: 13,
                    decoration: BoxDecoration(
                      color: PopoTheme.success,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: PopoTheme.background,
                        width: 2,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 14),

          // User Name & Country
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  person.nickname,
                  style: const TextStyle(
                    color: PopoTheme.textPrimary,
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    const Icon(
                      Icons.location_on_outlined,
                      size: 13,
                      color: PopoTheme.textSecondary,
                    ),
                    const SizedBox(width: 3),
                    Text(
                      person.country,
                      style: const TextStyle(
                        color: PopoTheme.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                    if (person.mutualCount > 0) ...[
                      const SizedBox(width: 8),
                      Text(
                        '· ${person.mutualCount} mutual',
                        style: const TextStyle(
                          color: PopoTheme.textTertiary,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),

          // Follow / Unfollow Button
          InkWell(
            onTap: () => _handleToggleFollow(person),
            borderRadius: BorderRadius.circular(20),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
              decoration: BoxDecoration(
                color: isFollowed
                    ? PopoTheme.surfaceLight
                    : PopoTheme.primary,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isFollowed
                      ? PopoTheme.borderSubtle
                      : PopoTheme.primary,
                  width: 1,
                ),
              ),
              child: Text(
                isFollowed ? 'Following' : '+ Follow',
                style: TextStyle(
                  color: isFollowed
                      ? PopoTheme.textSecondary
                      : Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
