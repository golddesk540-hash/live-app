import 'package:flutter/material.dart';
import '../../design/design_fixtures.dart';
import '../../theme/popo_theme.dart';
import '../../widgets/popo_empty_state.dart';
import '../../widgets/popo_error_state.dart';
import 'create_post_screen.dart';
import 'square_comments_screen.dart';
import 'square_state.dart';

/// Square Discovery & Social Feed Screen (Central Tab in Popo Live)
class SquareDiscoveryScreen extends StatefulWidget {
  const SquareDiscoveryScreen({super.key});

  @override
  State<SquareDiscoveryScreen> createState() => _SquareDiscoveryScreenState();
}

class _SquareDiscoveryScreenState extends State<SquareDiscoveryScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    SquareStateManager.instance.resetToFixtures();
    SquareStateManager.instance.addListener(_onStateChange);
  }

  @override
  void dispose() {
    SquareStateManager.instance.removeListener(_onStateChange);
    _tabController.dispose();
    super.dispose();
  }

  void _onStateChange() {
    if (mounted) setState(() {});
  }

  void _openCreatePost() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => const CreatePostScreen(),
      ),
    );
  }

  void _openComments(String postId) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => SquareCommentsScreen(postId: postId),
      ),
    );
  }

  void _sharePost(LocalSquarePost post) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Post link by ${post.author.nickname} copied to clipboard! 📋',
          style: const TextStyle(color: Colors.white),
        ),
        duration: const Duration(seconds: 1),
        backgroundColor: PopoTheme.surface,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // 1. Error state handling
    if (DesignFixtures.isError) {
      return Scaffold(
        backgroundColor: PopoTheme.background,
        appBar: _buildHeader(),
        body: Center(
          child: PopoErrorState(
            key: const Key('square_error_state'),
            title: DesignFixtures.squareError.title,
            message: DesignFixtures.squareError.message,
            retryText: DesignFixtures.squareError.actionLabel,
            onRetry: () {
              setState(() {
                SquareStateManager.instance.resetToFixtures();
              });
            },
          ),
        ),
      );
    }

    // 2. Empty state handling
    if (DesignFixtures.isEmpty) {
      return Scaffold(
        backgroundColor: PopoTheme.background,
        appBar: _buildHeader(),
        body: Center(
          child: PopoEmptyState(
            key: const Key('square_empty_state'),
            icon: Icons.dynamic_feed_rounded,
            title: 'No Posts Yet',
            message:
                'Community feeds are currently empty. Share the first update with creators and audience!',
            actionText: 'Create First Post',
            onActionTap: _openCreatePost,
          ),
        ),
        floatingActionButton: _buildFab(),
      );
    }

    final posts = SquareStateManager.instance.posts;

    return Scaffold(
      backgroundColor: PopoTheme.background,
      appBar: _buildHeader(),
      floatingActionButton: _buildFab(),
      body: SafeArea(
        child: RefreshIndicator(
          color: PopoTheme.primary,
          onRefresh: () async {
            setState(() {
              SquareStateManager.instance.resetToFixtures();
            });
          },
          child: posts.isEmpty
              ? Center(
                  child: PopoEmptyState(
                    key: const Key('square_empty_state'),
                    icon: Icons.dynamic_feed_rounded,
                    title: 'No Posts Yet',
                    message:
                        'Be the first to share an update with the community!',
                    actionText: 'Create Post',
                    onActionTap: _openCreatePost,
                  ),
                )
              : ListView.separated(
                  key: const Key('square_feed_list'),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 12,
                  ),
                  itemCount: posts.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 14),
                  itemBuilder: (context, index) {
                    final post = posts[index];
                    return _buildPostCard(post);
                  },
                ),
        ),
      ),
    );
  }

  PreferredSizeWidget _buildHeader() {
    return AppBar(
      backgroundColor: PopoTheme.surface,
      elevation: 0,
      titleSpacing: 16,
      title: const Text(
        'Square',
        key: Key('square_feed_title'),
        style: TextStyle(
          color: Colors.white,
          fontSize: 20,
          fontWeight: FontWeight.w900,
          letterSpacing: 0.3,
        ),
      ),
      actions: [
        IconButton(
          key: const Key('square_create_post_button'),
          icon: Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: PopoTheme.primary.withOpacity(0.18),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.edit_note_rounded,
              color: PopoTheme.primary,
              size: 22,
            ),
          ),
          tooltip: 'Create Post',
          onPressed: _openCreatePost,
        ),
        const SizedBox(width: 8),
      ],
      bottom: TabBar(
        controller: _tabController,
        indicatorColor: PopoTheme.primary,
        indicatorWeight: 3,
        labelColor: Colors.white,
        unselectedLabelColor: PopoTheme.textSecondary,
        labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
        tabs: const [
          Tab(text: 'For You'),
          Tab(text: 'Following'),
          Tab(text: 'Trending'),
        ],
      ),
    );
  }

  Widget _buildFab() {
    return FloatingActionButton(
      key: const Key('create_post_fab'),
      backgroundColor: PopoTheme.primary,
      onPressed: _openCreatePost,
      tooltip: 'Create Post',
      child: const Icon(Icons.add_rounded, color: Colors.white, size: 28),
    );
  }

  Widget _buildPostCard(LocalSquarePost post) {
    return Container(
      decoration: BoxDecoration(
        color: PopoTheme.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: PopoTheme.borderSubtle, width: 0.8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Author header row
          Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: Colors.white12,
                  backgroundImage: NetworkImage(post.author.avatarUrl),
                  key: Key('post_author_avatar_${post.id}'),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              post.author.nickname,
                              key: Key('post_author_name_${post.id}'),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            post.author.flagEmoji,
                            style: const TextStyle(fontSize: 12),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        post.timestamp,
                        key: Key('post_timestamp_${post.id}'),
                        style: const TextStyle(
                          color: PopoTheme.textSecondary,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(
                    Icons.more_horiz_rounded,
                    color: PopoTheme.textSecondary,
                    size: 20,
                  ),
                  onPressed: () => _sharePost(post),
                ),
              ],
            ),
          ),

          // Post text content
          if (post.content.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14),
              child: Text(
                post.content,
                key: Key('post_content_${post.id}'),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  height: 1.4,
                ),
              ),
            ),

          // Attached Image
          if (post.imageUrl != null && post.imageUrl!.isNotEmpty) ...[
            const SizedBox(height: 10),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: Image.network(
                  post.imageUrl!,
                  key: Key('post_image_${post.id}'),
                  width: double.infinity,
                  height: 200,
                  fit: BoxFit.cover,
                ),
              ),
            ),
          ],

          const SizedBox(height: 12),
          const Divider(color: PopoTheme.borderSubtle, height: 1),

          // Action bar (Like, Comment, Share)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            child: Row(
              children: [
                // Like Button
                InkWell(
                  key: Key('post_like_button_${post.id}'),
                  onTap: () {
                    SquareStateManager.instance.toggleLike(post.id);
                  },
                  borderRadius: BorderRadius.circular(20),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    child: Row(
                      children: [
                        Icon(
                          post.isLiked
                              ? Icons.favorite_rounded
                              : Icons.favorite_border_rounded,
                          color: post.isLiked
                              ? PopoTheme.primary
                              : PopoTheme.textSecondary,
                          size: 20,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          '${post.likesCount}',
                          key: Key('post_like_count_${post.id}'),
                          style: TextStyle(
                            color: post.isLiked
                                ? PopoTheme.primary
                                : Colors.white70,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 14),

                // Comment Button
                InkWell(
                  key: Key('post_comment_button_${post.id}'),
                  onTap: () => _openComments(post.id),
                  borderRadius: BorderRadius.circular(20),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.chat_bubble_outline_rounded,
                          color: PopoTheme.textSecondary,
                          size: 19,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          '${post.comments.length}',
                          key: Key('post_comment_count_${post.id}'),
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const Spacer(),

                // Share Button
                IconButton(
                  key: Key('post_share_button_${post.id}'),
                  icon: const Icon(
                    Icons.share_outlined,
                    color: PopoTheme.textSecondary,
                    size: 19,
                  ),
                  tooltip: 'Share',
                  onPressed: () => _sharePost(post),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
