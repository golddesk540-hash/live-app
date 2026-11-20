import '../api_client.dart';
import '../api_response.dart';

/// Central API Service for Messaging, Chat Threads & Official Notices
/// Implements Popo Live Phase 7 (P7-P6) Message Module Database Integration
class MessageApiService {
  final ApiClient _client;

  MessageApiService({ApiClient? client}) : _client = client ?? ApiClient.instance;

  /// Retrieves active conversation threads and people row
  Future<ApiResponse<dynamic>> getConversations() async {
    return _client.get('/api/message/conversations');
  }

  /// Retrieves conversation details
  Future<ApiResponse<dynamic>> getConversationDetails(String conversationId) async {
    return _client.get('/api/message/conversations/$conversationId');
  }

  /// Retrieves paginated message history for a conversation
  Future<ApiResponse<dynamic>> getMessages(String conversationId, {int page = 1, int limit = 20}) async {
    return _client.get(
      '/api/message/conversations/$conversationId/messages',
      queryParameters: {
        'page': page,
        'limit': limit,
      },
    );
  }

  /// Sends a new direct text message
  Future<ApiResponse<dynamic>> sendMessage(String conversationId, String text) async {
    return _client.post(
      '/api/message/conversations/$conversationId/messages',
      body: {
        'text': text.trim(),
      },
    );
  }

  /// Marks a conversation as read
  Future<ApiResponse<dynamic>> markConversationRead(String conversationId) async {
    return _client.post('/api/message/conversations/$conversationId/read');
  }

  /// Retrieves summaries and unread counts for the 4 official notice categories
  Future<ApiResponse<dynamic>> getOfficialNotices() async {
    return _client.get('/api/message/official');
  }

  /// Retrieves notices for a specific category (achievements, system, security, followers)
  Future<ApiResponse<dynamic>> getOfficialCategoryNotices(String category) async {
    return _client.get('/api/message/official/$category');
  }

  /// Retrieves total unread message counts across conversations & official notices
  Future<ApiResponse<dynamic>> getUnreadCount() async {
    return _client.get('/api/message/unread-count');
  }

  /// Searches matching people and conversation threads
  Future<ApiResponse<dynamic>> searchMessages(String query) async {
    return _client.get(
      '/api/message/search',
      queryParameters: {'q': query.trim()},
    );
  }

  /// Blocks a user
  Future<ApiResponse<dynamic>> blockUser(String userId) async {
    return _client.post('/api/message/users/$userId/block');
  }

  /// Unblocks a user
  Future<ApiResponse<dynamic>> unblockUser(String userId) async {
    return _client.delete('/api/message/users/$userId/block');
  }
}
