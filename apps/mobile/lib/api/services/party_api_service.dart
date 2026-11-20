import '../api_client.dart';
import '../api_response.dart';

/// Central API Service for 9-Seat Party Rooms
/// Connects to verified Next.js backend endpoints:
/// - GET  /api/discovery/party
/// - GET  /api/party/categories
/// - POST /api/party/create
/// - GET  /api/party/{roomId}
/// - GET  /api/party/{roomId}/seats
/// - POST /api/party/{roomId}/seats/occupy
/// - POST /api/party/{roomId}/seats/vacate
/// - POST /api/party/{roomId}/seats/request
/// - GET  /api/party/{roomId}/seats/requests
/// - POST /api/party/{roomId}/seats/requests/respond
/// - POST /api/party/{roomId}/seats/invite
/// - POST /api/party/{roomId}/seats/invite/respond
/// - POST /api/party/{roomId}/seats/media/toggle
/// - POST /api/party/{roomId}/seats/media/moderate
/// - GET  /api/party/{roomId}/seats/media/token
/// - POST /api/party/{roomId}/audience/join
/// - POST /api/party/{roomId}/audience/leave
/// - GET  /api/party/{roomId}/audience
/// - GET  /api/party/{roomId}/chat/messages
/// - POST /api/party/{roomId}/chat/send
class PartyApiService {
  final ApiClient _client;

  PartyApiService({ApiClient? client}) : _client = client ?? ApiClient.instance;

  /// Fetches available party rooms with optional category, country, or keyword search filters
  Future<ApiResponse<dynamic>> getPartyRooms({
    String? country,
    String? category,
    String? search,
    String tab = 'party',
  }) async {
    return _client.get(
      '/api/party/rooms',
      queryParameters: {
        'tab': tab,
        if (country != null && country.isNotEmpty && country != 'ALL')
          'country': country,
        if (category != null && category.isNotEmpty && category != 'all')
          'category': category,
        if (search != null && search.isNotEmpty) 'q': search,
      },
    );
  }

  /// Retrieves canonical party room categories
  Future<ApiResponse<dynamic>> getCategories() async {
    return _client.get('/api/party/categories');
  }

  /// Creates a new 9-seat party room
  Future<ApiResponse<dynamic>> createPartyRoom({
    required String title,
    required String categoryId,
    String roomType = 'public',
    int maxSeats = 9,
  }) async {
    return _client.post(
      '/api/party/rooms',
      body: {
        'title': title.trim(),
        'categoryId': categoryId,
        'roomType': roomType,
        'maxSeats': maxSeats,
      },
    );
  }

  /// Loads details for a specific party room
  Future<ApiResponse<dynamic>> getPartyRoomDetails(String roomId) async {
    return _client.get('/api/party/rooms/$roomId');
  }

  /// Loads real-time 9-seat occupancy and participant status for a party room
  Future<ApiResponse<dynamic>> getPartySeats(String roomId) async {
    return _client.get('/api/party/rooms/$roomId/seats');
  }

  /// Leaves seat n (self-leave or host-kick)
  Future<ApiResponse<dynamic>> leaveSeat({
    required String roomId,
    required int seatNumber,
  }) async {
    return _client.post('/api/party/rooms/$roomId/seats/$seatNumber/leave');
  }

  /// Toggles microphone for seat n
  Future<ApiResponse<dynamic>> toggleSeatMic({
    required String roomId,
    required int seatNumber,
  }) async {
    return _client.post('/api/party/rooms/$roomId/seats/$seatNumber/mic');
  }

  /// Submits a guest seat join request for Seats 2 to 9
  Future<ApiResponse<dynamic>> requestPartySeat({
    required String roomId,
    int? seatNumber,
  }) async {
    return _client.post(
      '/api/party/rooms/$roomId/requests',
      body: {
        if (seatNumber != null) 'seatNumber': seatNumber,
      },
    );
  }

  /// Retrieves pending seat requests for the room (Host only)
  Future<ApiResponse<dynamic>> getPartyRequests(String roomId) async {
    return _client.get('/api/party/rooms/$roomId/requests');
  }

  /// Host accepts a seat request atomically
  Future<ApiResponse<dynamic>> acceptPartyRequest({
    required String roomId,
    required String requestId,
  }) async {
    return _client.post('/api/party/rooms/$roomId/requests/$requestId/accept');
  }

  /// Host rejects a seat request
  Future<ApiResponse<dynamic>> rejectPartyRequest({
    required String roomId,
    required String requestId,
  }) async {
    return _client.post('/api/party/rooms/$roomId/requests/$requestId/reject');
  }

  /// Reads party room chat messages
  Future<ApiResponse<dynamic>> getPartyChat(String roomId) async {
    return _client.get('/api/party/rooms/$roomId/chat');
  }

  /// Directly occupies a seat (or host takes Seat 1)
  Future<ApiResponse<dynamic>> occupySeat({
    required String roomId,
    required int seatNumber,
    String? participantId,
    String? participantName,
    String? participantAvatar,
    bool isHost = false,
  }) async {
    return _client.post(
      '/api/party/$roomId/seats/occupy',
      body: {
        'seatNumber': seatNumber,
        if (participantId != null) 'participantId': participantId,
        if (participantName != null) 'participantName': participantName,
        if (participantAvatar != null) 'participantAvatar': participantAvatar,
        'isHost': isHost,
      },
    );
  }

  /// Vacates an occupied seat
  Future<ApiResponse<dynamic>> vacateSeat({
    required String roomId,
    required int seatNumber,
    String? participantId,
    bool isHostAction = false,
    bool forceHostClose = false,
  }) async {
    return _client.post(
      '/api/party/$roomId/seats/vacate',
      body: {
        'seatNumber': seatNumber,
        if (participantId != null) 'participantId': participantId,
        'isHostAction': isHostAction,
        'forceHostClose': forceHostClose,
      },
    );
  }

  /// Submits a guest seat join request for Seats 2 to 9
  Future<ApiResponse<dynamic>> requestSeat({
    required String roomId,
    required int seatNumber,
    String? userId,
    String? userName,
    String? userAvatar,
    bool acceptedRules = true,
  }) async {
    return _client.post(
      '/api/party/$roomId/seats/request',
      body: {
        'seatNumber': seatNumber,
        if (userId != null) 'userId': userId,
        if (userName != null) 'userName': userName,
        if (userAvatar != null) 'userAvatar': userAvatar,
        'acceptedRules': acceptedRules,
      },
    );
  }

  /// Retrieves pending seat requests and invitations for the room
  Future<ApiResponse<dynamic>> getSeatRequests(String roomId) async {
    return _client.get('/api/party/$roomId/seats/requests');
  }

  /// Responds to a guest seat request ('accept' | 'reject')
  Future<ApiResponse<dynamic>> respondToSeatRequest({
    required String roomId,
    required String requestId,
    required String action, // 'accept' | 'reject'
    bool isHostAction = true,
  }) async {
    return _client.post(
      '/api/party/$roomId/seats/requests/respond',
      body: {
        'requestId': requestId,
        'action': action,
        'isHostAction': isHostAction,
      },
    );
  }

  /// Sends a seat invitation from host to an audience member
  Future<ApiResponse<dynamic>> inviteToSeat({
    required String roomId,
    required int seatNumber,
    String? hostId,
    required String invitedUserId,
    required String invitedUserName,
    String? invitedUserAvatar,
  }) async {
    return _client.post(
      '/api/party/$roomId/seats/invite',
      body: {
        'seatNumber': seatNumber,
        if (hostId != null) 'hostId': hostId,
        'invitedUserId': invitedUserId,
        'invitedUserName': invitedUserName,
        if (invitedUserAvatar != null) 'invitedUserAvatar': invitedUserAvatar,
      },
    );
  }

  /// Responds to a seat invitation ('accept' | 'decline')
  Future<ApiResponse<dynamic>> respondToSeatInvitation({
    required String roomId,
    required String invitationId,
    required String action, // 'accept' | 'decline'
  }) async {
    return _client.post(
      '/api/party/$roomId/seats/invite/respond',
      body: {'invitationId': invitationId, 'action': action},
    );
  }

  /// Toggles local seat media (microphone, camera, facing)
  Future<ApiResponse<dynamic>> toggleMedia({
    required String roomId,
    required int seatNumber,
    required String type, // 'mic' | 'camera' | 'facing'
    required bool enabled,
    String? facing,
    String? participantId,
  }) async {
    return _client.post(
      '/api/party/$roomId/seats/media/toggle',
      body: {
        'seatNumber': seatNumber,
        'type': type,
        'enabled': enabled,
        if (facing != null) 'facing': facing,
        if (participantId != null) 'participantId': participantId,
      },
    );
  }

  /// Performs moderation on a guest seat ('host_mute' | 'disable_video' | 'kick')
  Future<ApiResponse<dynamic>> moderateMedia({
    required String roomId,
    required int seatNumber,
    required String action, // 'host_mute' | 'disable_video' | 'kick'
    bool isHostAction = true,
  }) async {
    return _client.post(
      '/api/party/$roomId/seats/media/moderate',
      body: {
        'seatNumber': seatNumber,
        'action': action,
        'isHostAction': isHostAction,
      },
    );
  }

  /// Generates Agora RTC token for a party seat participant or audience
  Future<ApiResponse<dynamic>> getPartyMediaToken({
    required String roomId,
    required int seatNumber,
    String role = 'publisher', // 'publisher' | 'subscriber' | 'audience'
    int? uid,
  }) async {
    return _client.get(
      '/api/party/$roomId/seats/media/token',
      queryParameters: {
        'seatNumber': seatNumber.toString(),
        'role': role,
        if (uid != null) 'uid': uid.toString(),
      },
    );
  }

  /// Adds a user to the party room active audience
  Future<ApiResponse<dynamic>> joinAudience({
    required String roomId,
    required String userId,
    required String userName,
    String? userAvatar,
    int userLevel = 1,
    bool acceptedRules = true,
  }) async {
    return _client.post(
      '/api/party/$roomId/audience/join',
      body: {
        'userId': userId,
        'userName': userName,
        if (userAvatar != null) 'userAvatar': userAvatar,
        'userLevel': userLevel,
        'acceptedRules': acceptedRules,
      },
    );
  }

  /// Removes a user from the party room active audience
  Future<ApiResponse<dynamic>> leaveAudience({
    required String roomId,
    required String userId,
  }) async {
    return _client.post(
      '/api/party/$roomId/audience/leave',
      body: {'userId': userId},
    );
  }

  /// Retrieves active audience members and total count
  Future<ApiResponse<dynamic>> getAudienceList(String roomId) async {
    return _client.get('/api/party/$roomId/audience');
  }

  /// Retrieves recent party room chat messages
  Future<ApiResponse<dynamic>> getPartyChatMessages({
    required String roomId,
    int limit = 50,
    String? before,
  }) async {
    return _client.get(
      '/api/party/$roomId/chat/messages',
      queryParameters: {
        'limit': limit.toString(),
        if (before != null && before.isNotEmpty) 'before': before,
      },
    );
  }

  /// Sends a chat message in the party room
  Future<ApiResponse<dynamic>> sendPartyChatMessage({
    required String roomId,
    required String senderId,
    required String senderName,
    String? senderAvatar,
    String senderRole = 'audience', // 'host' | 'speaker' | 'audience'
    int? seatNumber,
    required String messageText,
    String? emoji,
  }) async {
    return _client.post(
      '/api/party/$roomId/chat/send',
      body: {
        'senderId': senderId,
        'senderName': senderName,
        if (senderAvatar != null) 'senderAvatar': senderAvatar,
        'senderRole': senderRole,
        if (seatNumber != null) 'seatNumber': seatNumber,
        'messageText': messageText,
        if (emoji != null) 'emoji': emoji,
      },
    );
  }
}
