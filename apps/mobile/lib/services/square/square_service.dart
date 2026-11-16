import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import '../../api/api_client.dart';
import '../../screens/square/square_posts_screen.dart';

/// Centralized service for Popo Live Square Social Community & Fan Club
class SquareService {
  SquareService._();
  static final SquareService instance = SquareService._();

  /// Fetches community feed from backend
  Future<List<SquarePostModel>> fetchSquareFeed({
    String tab = 'for_you',
    String search = '',
    String tag = '',
    int page = 1,
    int limit = 20,
  }) async {
    final queryParams = <String, dynamic>{
      'tab': tab,
      if (search.isNotEmpty) 'search': search,
      if (tag.isNotEmpty) 'tag': tag,
      'page': page,
      'limit': limit,
    };

    final response = await ApiClient.instance.get('/api/square/posts', queryParameters: queryParams);
    if (!response.isSuccess || response.data == null) {
      throw Exception(response.error ?? 'Failed to load square feed.');
    }

    final postsJson = (response.data['posts'] as List<dynamic>?) ?? [];
    return postsJson.map((p) => _mapJsonToSquarePostModel(p as Map<String, dynamic>)).toList();
  }

  /// Fetches a single post details
  Future<SquarePostModel?> fetchPostDetails(String postId) async {
    final response = await ApiClient.instance.get('/api/square/posts/$postId');
    if (!response.isSuccess || response.data == null) {
      return null;
    }

    final postJson = response.data['post'] as Map<String, dynamic>?;
    if (postJson == null) return null;
    return _mapJsonToSquarePostModel(postJson);
  }

  /// Creates a new Square post
  Future<Map<String, dynamic>> createPost({
    required String content,
    String? mediaType,
    List<String>? images,
    String? videoUrl,
    String? videoThumbnailUrl,
    String? videoDuration,
    String? videoTitle,
    String? liveRoomLabel,
    String? liveRoomId,
    List<String>? hashtags,
    String visibility = 'Public',
  }) async {
    final body = {
      'content': content,
      if (mediaType != null) 'mediaType': mediaType,
      if (images != null) 'images': images,
      if (videoUrl != null) 'videoUrl': videoUrl,
      if (videoThumbnailUrl != null) 'videoThumbnailUrl': videoThumbnailUrl,
      if (videoDuration != null) 'videoDuration': videoDuration,
      if (videoTitle != null) 'videoTitle': videoTitle,
      if (liveRoomLabel != null) 'liveRoomLabel': liveRoomLabel,
      if (liveRoomId != null) 'liveRoomId': liveRoomId,
      if (hashtags != null) 'hashtags': hashtags,
      'visibility': visibility,
    };

    final response = await ApiClient.instance.post('/api/square/posts', body: body);
    if (!response.isSuccess || response.data == null) {
      throw Exception(response.error ?? 'Failed to create post.');
    }

    return response.data;
  }

  /// Uploads media file (image or video) via base64 or multipart
  Future<String> uploadMediaBase64({
    required String base64Data,
    required bool isVideo,
  }) async {
    final body = isVideo
        ? {'videoBase64': base64Data}
        : {'imageBase64': base64Data};

    final response = await ApiClient.instance.post('/api/square/media/upload', body: body);
    if (!response.isSuccess || response.data == null) {
      throw Exception(response.error ?? 'Media upload failed.');
    }

    return response.data['url'] as String? ?? '';
  }

  /// Likes or unlikes a post
  Future<Map<String, dynamic>> togglePostLike(String postId, {bool unlike = false}) async {
    final response = await ApiClient.instance.post(
      '/api/square/posts/$postId/like',
      body: {'unlike': unlike},
    );

    if (!response.isSuccess || response.data == null) {
      throw Exception(response.error ?? 'Failed to toggle post like.');
    }

    return response.data;
  }

  /// Deletes a post
  Future<bool> deletePost(String postId) async {
    final response = await ApiClient.instance.delete('/api/square/posts/$postId');
    return response.isSuccess;
  }

  /// Fetches comments for a post
  Future<List<Map<String, dynamic>>> fetchComments(String postId) async {
    final response = await ApiClient.instance.get('/api/square/posts/$postId/comments');
    if (!response.isSuccess || response.data == null) {
      throw Exception(response.error ?? 'Failed to load comments.');
    }

    final comments = (response.data['comments'] as List<dynamic>?) ?? [];
    return comments.cast<Map<String, dynamic>>();
  }

  /// Adds a comment or reply to a post
  Future<Map<String, dynamic>> addComment(
    String postId, {
    required String content,
    String? parentCommentId,
  }) async {
    final body = {
      'content': content,
      if (parentCommentId != null) 'parentCommentId': parentCommentId,
    };

    final response = await ApiClient.instance.post('/api/square/posts/$postId/comments', body: body);
    if (!response.isSuccess || response.data == null) {
      throw Exception(response.error ?? 'Failed to submit comment.');
    }

    return response.data;
  }

  /// Deletes a comment
  Future<bool> deleteComment(String commentId) async {
    final response = await ApiClient.instance.delete('/api/square/comments/$commentId');
    return response.isSuccess;
  }

  /// Toggles like on a comment
  Future<Map<String, dynamic>> toggleCommentLike(String commentId) async {
    final response = await ApiClient.instance.post('/api/square/comments/$commentId/like');
    if (!response.isSuccess || response.data == null) {
      throw Exception(response.error ?? 'Failed to like comment.');
    }

    return response.data;
  }

  /// Submits a moderation report for a post or comment
  Future<Map<String, dynamic>> submitReport({
    required String targetType,
    required String targetId,
    required String reason,
    String? description,
  }) async {
    final body = {
      'targetType': targetType,
      'targetId': targetId,
      'reason': reason,
      if (description != null) 'description': description,
    };

    final response = await ApiClient.instance.post('/api/square/reports', body: body);
    if (!response.isSuccess || response.data == null) {
      throw Exception(response.error ?? 'Failed to submit report.');
    }

    return response.data;
  }

  /// Fetches Fan Clubs catalogue
  Future<List<Map<String, dynamic>>> fetchFanClubs({String? search}) async {
    final queryParams = <String, dynamic>{
      if (search != null && search.isNotEmpty) 'search': search,
    };

    final response = await ApiClient.instance.get('/api/fan-club', queryParameters: queryParams);
    if (!response.isSuccess || response.data == null) {
      throw Exception(response.error ?? 'Failed to load fan clubs.');
    }

    final clubs = (response.data['clubs'] as List<dynamic>?) ?? [];
    return clubs.cast<Map<String, dynamic>>();
  }

  /// Joins a Fan Club
  Future<Map<String, dynamic>> joinFanClub(String clubId) async {
    final response = await ApiClient.instance.post('/api/fan-club/$clubId/join');
    if (!response.isSuccess || response.data == null) {
      throw Exception(response.error ?? 'Failed to join fan club.');
    }

    return response.data;
  }

  /// Leaves a Fan Club
  Future<Map<String, dynamic>> leaveFanClub(String clubId) async {
    final response = await ApiClient.instance.post('/api/fan-club/$clubId/leave');
    if (!response.isSuccess || response.data == null) {
      throw Exception(response.error ?? 'Failed to leave fan club.');
    }

    return response.data;
  }

  /// Fetches pending and past Fan Club invitations
  Future<List<Map<String, dynamic>>> fetchInvites() async {
    final response = await ApiClient.instance.get('/api/fan-club/invites');
    if (!response.isSuccess || response.data == null) {
      throw Exception(response.error ?? 'Failed to load invitations.');
    }

    final invites = (response.data['invites'] as List<dynamic>?) ?? [];
    return invites.cast<Map<String, dynamic>>();
  }

  /// Sends a Fan Club invite to another user
  Future<Map<String, dynamic>> sendInvite({
    required String clubId,
    required String inviteeId,
    String? inviteCode,
  }) async {
    final body = {
      'clubId': clubId,
      'inviteeId': inviteeId,
      if (inviteCode != null) 'inviteCode': inviteCode,
    };

    final response = await ApiClient.instance.post('/api/fan-club/invites', body: body);
    if (!response.isSuccess || response.data == null) {
      throw Exception(response.error ?? 'Failed to send invite.');
    }

    return response.data;
  }

  /// Responds to a Fan Club invitation ('accept' or 'reject')
  Future<Map<String, dynamic>> respondToInvite(String inviteId, {required String action}) async {
    final body = {'action': action};
    final response = await ApiClient.instance.post('/api/fan-club/invites/$inviteId', body: body);
    if (!response.isSuccess || response.data == null) {
      throw Exception(response.error ?? 'Failed to respond to invite.');
    }

    return response.data;
  }

  /// Maps backend post JSON to SquarePostModel
  SquarePostModel _mapJsonToSquarePostModel(Map<String, dynamic> p) {
    final creator = p['creator'] as Map<String, dynamic>? ?? {};
    final ringHex = creator['ringColor'] as String? ?? '#FF1768';
    Color ringColor = const Color(0xFFFF1768);
    try {
      final clean = ringHex.replaceAll('#', '');
      ringColor = Color(int.parse('FF$clean', radix: 16));
    } catch (_) {}

    final rawImages = (p['images'] as List<dynamic>?) ?? [];
    final images = rawImages.map((e) => e.toString()).toList();

    return SquarePostModel(
      id: p['id']?.toString() ?? '',
      creatorId: creator['id']?.toString() ?? '',
      creatorName: creator['name']?.toString() ?? 'Popo User',
      creatorHandle: creator['handle']?.toString() ?? '@user',
      isVerified: creator['isVerified'] == true,
      isVip: creator['isVip'] == true,
      ringColor: ringColor,
      publishedAgo: p['publishedAgo']?.toString() ?? 'Just now',
      visibility: p['visibility']?.toString() ?? 'Public',
      text: p['text']?.toString() ?? '',
      hashtags: ((p['hashtags'] as List<dynamic>?) ?? []).map((e) => e.toString()).toList(),
      mediaType: p['mediaType']?.toString() ?? 'none',
      liveRoomLabel: p['liveRoomTitle']?.toString(),
      likesCount: (p['likesCount'] as num?)?.toInt() ?? 0,
      isLiked: p['isLiked'] == true,
      isSaved: p['isSaved'] == true,
      sharesCount: (p['sharesCount'] as num?)?.toInt() ?? 0,
      popularityScore: ((p['likesCount'] as num?)?.toInt() ?? 0) * 2 + ((p['commentsCount'] as num?)?.toInt() ?? 0) * 3,
      comments: [],
    );
  }
}
