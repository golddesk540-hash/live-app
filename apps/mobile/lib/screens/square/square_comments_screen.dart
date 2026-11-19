import 'package:flutter/material.dart';
import '../../design/design_fixtures.dart';
import '../../theme/popo_theme.dart';
import 'square_state.dart';

/// Dedicated Comments Screen for a Square post
class SquareCommentsScreen extends StatefulWidget {
  final String postId;

  const SquareCommentsScreen({
    super.key,
    required this.postId,
  });

  @override
  State<SquareCommentsScreen> createState() => _SquareCommentsScreenState();
}

class _SquareCommentsScreenState extends State<SquareCommentsScreen> {
  final TextEditingController _commentController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    SquareStateManager.instance.addListener(_onStateChange);
  }

  @override
  void dispose() {
    SquareStateManager.instance.removeListener(_onStateChange);
    _commentController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onStateChange() {
    if (mounted) setState(() {});
  }

  void _submitComment() {
    final text = _commentController.text.trim();
    if (text.isEmpty) return;

    final comment = SquareStateManager.instance.addComment(
      postId: widget.postId,
      text: text,
    );

    if (comment != null) {
      _commentController.clear();
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scrollController.hasClients) {
          _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = SquareStateManager.instance;
    final post = state.posts.firstWhere(
      (p) => p.id == widget.postId,
      orElse: () => LocalSquarePost(
        id: widget.postId,
        author: DesignFixtures.currentUserProfile,
        content: '',
        timestamp: '',
        likesCount: 0,
        comments: [],
      ),
    );

    return Scaffold(
      backgroundColor: PopoTheme.background,
      appBar: AppBar(
        backgroundColor: PopoTheme.surface,
        elevation: 1,
        leading: IconButton(
          key: const Key('comments_back_button'),
          icon:
              const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Comments (${post.comments.length})',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 17,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Original post preview banner
            Container(
              padding: const EdgeInsets.all(14),
              color: PopoTheme.surface,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CircleAvatar(
                    radius: 18,
                    backgroundColor: Colors.white12,
                    backgroundImage: NetworkImage(post.author.avatarUrl),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              post.author.nickname,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              post.author.flagEmoji,
                              style: const TextStyle(fontSize: 11),
                            ),
                            const Spacer(),
                            Text(
                              post.timestamp,
                              style: const TextStyle(
                                color: PopoTheme.textSecondary,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 3),
                        Text(
                          post.content,
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const Divider(color: PopoTheme.borderSubtle, height: 1),

            // Comments list
            Expanded(
              child: post.comments.isEmpty
                  ? Center(
                      child: Column(
                        key: const Key('comments_empty_state'),
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.chat_bubble_outline_rounded,
                            color: PopoTheme.textSecondary.withOpacity(0.5),
                            size: 44,
                          ),
                          const SizedBox(height: 10),
                          const Text(
                            'No comments yet.',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Be the first to share your thoughts!',
                            style: TextStyle(
                              color: PopoTheme.textSecondary,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    )
                  : ListView.separated(
                      key: const Key('comments_list'),
                      controller: _scrollController,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                      itemCount: post.comments.length,
                      separatorBuilder: (_, __) => const Divider(
                        color: PopoTheme.borderSubtle,
                        height: 16,
                      ),
                      itemBuilder: (context, index) {
                        final comment = post.comments[index];
                        return Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            CircleAvatar(
                              radius: 18,
                              backgroundColor: Colors.white12,
                              backgroundImage:
                                  NetworkImage(comment.authorAvatar),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Text(
                                        comment.authorName,
                                        key:
                                            Key('comment_author_${comment.id}'),
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 13,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        comment.timestamp,
                                        style: const TextStyle(
                                          color: PopoTheme.textSecondary,
                                          fontSize: 11,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    comment.text,
                                    key: Key('comment_text_${comment.id}'),
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 13,
                                      height: 1.3,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        );
                      },
                    ),
            ),

            // Composer bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: const BoxDecoration(
                color: PopoTheme.surface,
                border: Border(
                  top: BorderSide(color: PopoTheme.borderSubtle, width: 0.8),
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      height: 42,
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      decoration: BoxDecoration(
                        color: PopoTheme.background,
                        borderRadius: BorderRadius.circular(22),
                        border: Border.all(color: PopoTheme.borderSubtle),
                      ),
                      child: TextField(
                        key: const Key('comment_input_field'),
                        controller: _commentController,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                        ),
                        decoration: const InputDecoration(
                          hintText: 'Add a comment...',
                          hintStyle: TextStyle(
                            color: PopoTheme.textSecondary,
                            fontSize: 13,
                          ),
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.symmetric(vertical: 10),
                        ),
                        onSubmitted: (_) => _submitComment(),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  InkWell(
                    key: const Key('comment_send_button'),
                    onTap: _submitComment,
                    borderRadius: BorderRadius.circular(22),
                    child: Container(
                      width: 42,
                      height: 42,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: LinearGradient(
                          colors: [PopoTheme.primary, Color(0xFFFF4D8D)],
                        ),
                      ),
                      child: const Icon(
                        Icons.send_rounded,
                        color: Colors.white,
                        size: 19,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
