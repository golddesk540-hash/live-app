import 'package:flutter/foundation.dart';
import '../../design/design_fixtures.dart';

/// Single comment on a Square post
class LocalSquareComment {
  final String id;
  final String authorId;
  final String authorName;
  final String authorAvatar;
  final String text;
  final String timestamp;
  int likes;

  LocalSquareComment({
    required this.id,
    required this.authorId,
    required this.authorName,
    required this.authorAvatar,
    required this.text,
    required this.timestamp,
    this.likes = 0,
  });
}

/// Dynamic, interactive Square social post model
class LocalSquarePost {
  final String id;
  final FixtureUserProfile author;
  final String content;
  final String? imageUrl;
  final String timestamp;
  int likesCount;
  bool isLiked;
  final List<LocalSquareComment> comments;

  LocalSquarePost({
    required this.id,
    required this.author,
    required this.content,
    this.imageUrl,
    required this.timestamp,
    required this.likesCount,
    this.isLiked = false,
    required this.comments,
  });
}

/// In-memory session state manager for Popo Live Square Social Feed
class SquareStateManager extends ChangeNotifier {
  static final SquareStateManager instance = SquareStateManager._internal();

  SquareStateManager._internal() {
    resetToFixtures();
  }

  final List<LocalSquarePost> _posts = [];

  List<LocalSquarePost> get posts => List.unmodifiable(_posts);

  /// Resets state from current design fixtures
  void resetToFixtures() {
    _posts.clear();

    if (DesignFixtures.isError || DesignFixtures.isEmpty) {
      notifyListeners();
      return;
    }

    final fixturePosts = DesignFixtures.squarePosts;
    for (final fp in fixturePosts) {
      final commentsList = fp.comments.map((c) {
        return LocalSquareComment(
          id: c.id,
          authorId: c.authorId,
          authorName: c.authorName,
          authorAvatar: c.authorAvatar,
          text: c.text,
          timestamp: c.timestamp,
          likes: c.likes,
        );
      }).toList();

      _posts.add(
        LocalSquarePost(
          id: fp.id,
          author: fp.author,
          content: fp.content,
          imageUrl: fp.imageUrl,
          timestamp: fp.timestamp,
          likesCount: fp.initialLikes,
          isLiked: fp.initialIsLiked,
          comments: commentsList,
        ),
      );
    }

    notifyListeners();
  }

  /// Toggles like state on a post
  void toggleLike(String postId) {
    final idx = _posts.indexWhere((p) => p.id == postId);
    if (idx == -1) return;

    final post = _posts[idx];
    if (post.isLiked) {
      post.isLiked = false;
      post.likesCount = (post.likesCount - 1).clamp(0, 9999999);
    } else {
      post.isLiked = true;
      post.likesCount += 1;
    }

    notifyListeners();
  }

  /// Creates and prepends a new post
  LocalSquarePost? createPost({
    required String text,
    String? imageUrl,
  }) {
    final trimmedText = text.trim();
    if (trimmedText.isEmpty && (imageUrl == null || imageUrl.isEmpty)) {
      return null;
    }

    final currentUser = DesignFixtures.currentUserProfile;
    final newPost = LocalSquarePost(
      id: 'post_${DateTime.now().millisecondsSinceEpoch}',
      author: currentUser,
      content: trimmedText,
      imageUrl: imageUrl,
      timestamp: 'Just now',
      likesCount: 0,
      isLiked: false,
      comments: [],
    );

    _posts.insert(0, newPost);
    notifyListeners();
    return newPost;
  }

  /// Adds a comment to a post
  LocalSquareComment? addComment({
    required String postId,
    required String text,
  }) {
    final trimmed = text.trim();
    if (trimmed.isEmpty) return null;

    final idx = _posts.indexWhere((p) => p.id == postId);
    if (idx == -1) return null;

    final post = _posts[idx];
    final currentUser = DesignFixtures.currentUserProfile;
    final comment = LocalSquareComment(
      id: 'com_${DateTime.now().millisecondsSinceEpoch}',
      authorId: currentUser.userId,
      authorName: currentUser.nickname,
      authorAvatar: currentUser.avatarUrl,
      text: trimmed,
      timestamp: 'Just now',
      likes: 0,
    );

    post.comments.add(comment);
    notifyListeners();
    return comment;
  }
}
