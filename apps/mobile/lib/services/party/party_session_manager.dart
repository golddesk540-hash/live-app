import 'dart:async';

import 'package:flutter/foundation.dart';

import '../../api/api.dart';
import '../../models/live/live_agora_config.dart';
import '../../models/live/live_models.dart';
import '../../models/party/party_models.dart';
import '../live/agora_rtc_service.dart';

/// Central Controller for Party Room Real-Time 9-Seat Interaction,
/// Agora Audio RTC Broadcasting, Audience Membership, and Seat Moderation.
class PartySessionManager extends ChangeNotifier {
  final PartyApiService _apiService;
  final AgoraRtcService _agoraService;

  PartySessionManager({
    PartyApiService? apiService,
    AgoraRtcService? agoraService,
  }) : _apiService = apiService ?? PartyApiService(),
       _agoraService = agoraService ?? AgoraRtcService.instance;

  String? _roomId;
  PartyRoom? _roomDetails;
  List<PartySeat> _seats = [];
  List<PartyAudienceMember> _audience = [];
  List<PartySeatRequest> _pendingRequests = [];
  List<PartySeatInvitation> _pendingInvitations = [];
  List<PartyChatMessage> _chatMessages = [];

  String? _currentUserId;
  String _currentUserName = 'Guest';
  String? _currentUserAvatar;
  int _currentUserLevel = 1;

  int? _currentSeatNumber; // 1 to 9 if seated, null if audience
  bool _isHost = false;
  bool _isMuted = false;
  bool _isHostMuted = false;
  bool _isCameraOn = false;
  bool _isLoading = false;
  String? _errorMessage;

  Timer? _syncTimer;
  Timer? _chatTimer;

  // Getters
  String? get roomId => _roomId;
  PartyRoom? get roomDetails => _roomDetails;
  List<PartySeat> get seats => _seats;
  List<PartyAudienceMember> get audience => _audience;
  List<PartySeatRequest> get pendingRequests => _pendingRequests;
  List<PartySeatInvitation> get pendingInvitations => _pendingInvitations;
  List<PartyChatMessage> get chatMessages => _chatMessages;

  String? get currentUserId => _currentUserId;
  String get currentUserName => _currentUserName;
  String? get currentUserAvatar => _currentUserAvatar;
  int? get currentSeatNumber => _currentSeatNumber;
  bool get isHost => _isHost;
  bool get isSeated => _currentSeatNumber != null;
  bool get isMuted => _isMuted;
  bool get isHostMuted => _isHostMuted;
  bool get isCameraOn => _isCameraOn;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  /// Initializes party session, identifies user role, joins audience or host seat,
  /// and establishes Agora audio RTC connection.
  Future<void> joinRoom({
    required String roomId,
    required Map<String, dynamic>? userProfile,
  }) async {
    _roomId = roomId;
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    // Populate user profile
    if (userProfile != null) {
      _currentUserId = userProfile['id']?.toString();
      _currentUserName =
          userProfile['nickname']?.toString() ??
          userProfile['name']?.toString() ??
          'Guest';
      _currentUserAvatar =
          userProfile['avatar_url']?.toString() ??
          userProfile['avatar']?.toString();
      _currentUserLevel =
          (userProfile['user_level'] as num?)?.toInt() ??
          (userProfile['level'] as num?)?.toInt() ??
          1;
    }

    try {
      // 1. Fetch Room Details & Seats concurrently
      final results = await Future.wait([
        _apiService.getPartyRoomDetails(roomId),
        _apiService.getPartySeats(roomId),
        _apiService.getAudienceList(roomId),
      ]);

      final roomRes = results[0];
      final seatsRes = results[1];
      final audienceRes = results[2];

      if (roomRes.isSuccess && roomRes.data != null) {
        final data = roomRes.data as Map<String, dynamic>;
        final roomMap = data['room'] as Map<String, dynamic>? ?? data;
        _roomDetails = PartyRoom.fromJson(roomMap);
      }

      if (seatsRes.isSuccess && seatsRes.data != null) {
        final data = seatsRes.data as Map<String, dynamic>;
        final rawSeats = data['seats'] as List<dynamic>? ?? [];
        _seats = _normalizeSeats(rawSeats);
      }

      if (audienceRes.isSuccess && audienceRes.data != null) {
        final data = audienceRes.data as Map<String, dynamic>;
        final rawAudience = data['members'] as List<dynamic>? ?? [];
        _audience = rawAudience
            .whereType<Map<String, dynamic>>()
            .map((m) => PartyAudienceMember.fromJson(m))
            .toList();
      }

      // 2. Check if current user is Host
      final hostNickname = _roomDetails?.hostNickname ?? '';
      if (_currentUserId == 'host_$roomId' ||
          (_currentUserId != null &&
              _roomDetails != null &&
              _currentUserId == _roomDetails!.id) ||
          (_currentUserName.isNotEmpty &&
              hostNickname.isNotEmpty &&
              _currentUserName.toLowerCase() == hostNickname.toLowerCase())) {
        _isHost = true;
        _currentSeatNumber = 1;
      } else {
        // Check if user is already seated in any seat
        final mySeat = _seats.firstWhere(
          (s) =>
              s.isOccupied &&
              s.participantId != null &&
              s.participantId == _currentUserId,
          orElse: () => PartySeat(
            id: '',
            roomNumber: roomId,
            seatNumber: -1,
            isHost: false,
            status: 'none',
          ),
        );
        if (mySeat.seatNumber > 0) {
          _currentSeatNumber = mySeat.seatNumber;
          _isHost = mySeat.isHost;
          _isMuted = mySeat.isMuted;
          _isHostMuted = mySeat.isHostMuted;
          _isCameraOn = mySeat.isCameraOn;
        } else {
          _currentSeatNumber = null;
        }
      }

      // 3. Register in audience if not host
      if (!_isHost && _currentUserId != null) {
        await _apiService.joinAudience(
          roomId: roomId,
          userId: _currentUserId!,
          userName: _currentUserName,
          userAvatar: _currentUserAvatar,
          userLevel: _currentUserLevel,
          acceptedRules: true,
        );
      }

      // 4. Fetch Party Agora RTC Token & Connect
      await _connectAgoraRtc();

      // 5. Initial chat & requests sync
      await _fetchChatMessages();
      if (_isHost) {
        await _fetchPendingRequests();
      }

      // 6. Start Polling Timers
      _startSyncTimers();

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _errorMessage = 'Failed to join party room: $e';
      notifyListeners();
    }
  }

  /// Connects to Agora RTC Cloud or local device audio pipeline
  Future<void> _connectAgoraRtc() async {
    if (_roomId == null) return;

    try {
      final seatNum = _currentSeatNumber ?? 1;
      final roleStr = isSeated ? 'publisher' : 'audience';

      final tokenRes = await _apiService.getPartyMediaToken(
        roomId: _roomId!,
        seatNumber: seatNum,
        role: roleStr,
      );

      if (tokenRes.isSuccess && tokenRes.data != null) {
        final data = tokenRes.data as Map<String, dynamic>;
        final tokenObj = data['tokenResult'] as Map<String, dynamic>? ?? data;
        final mediaToken = PartyMediaToken.fromJson(tokenObj);

        final agoraConfig = LiveAgoraConfig(
          isConfigured: mediaToken.isConfigured,
          appId: mediaToken.appId,
          token: mediaToken.token ?? '',
          channelName: mediaToken.channelName.isNotEmpty
              ? mediaToken.channelName
              : 'party_$_roomId',
          uid: mediaToken.uid,
          expireTimeInSeconds: mediaToken.expiresInSeconds,
          mode: mediaToken.mode,
          message: mediaToken.message,
        );

        await _agoraService.initialize(appId: agoraConfig.appId);
        await _agoraService.joinChannel(
          config: agoraConfig,
          role: isSeated ? LiveStreamRole.host : LiveStreamRole.viewer,
        );

        if (isSeated) {
          await _agoraService.muteLocalAudio(_isMuted || _isHostMuted);
        } else {
          await _agoraService.muteLocalAudio(true);
        }
      }
    } catch (e) {
      debugPrint('[PartySessionManager] Agora RTC connection notice: $e');
    }
  }

  void _startSyncTimers() {
    _syncTimer?.cancel();
    _chatTimer?.cancel();

    // Seats & Audience poll every 3 seconds
    _syncTimer = Timer.periodic(const Duration(seconds: 3), (_) async {
      await _syncSeatsAndAudience();
      if (_isHost) {
        await _fetchPendingRequests();
      }
    });

    // Chat poll every 3 seconds
    _chatTimer = Timer.periodic(const Duration(seconds: 3), (_) async {
      await _fetchChatMessages();
    });
  }

  /// Synchronizes seat occupation, host mute flags, and audience roster
  Future<void> _syncSeatsAndAudience() async {
    if (_roomId == null) return;

    try {
      final results = await Future.wait([
        _apiService.getPartySeats(_roomId!),
        _apiService.getAudienceList(_roomId!),
      ]);

      final seatsRes = results[0];
      final audienceRes = results[1];

      if (seatsRes.isSuccess && seatsRes.data != null) {
        final data = seatsRes.data as Map<String, dynamic>;
        final rawSeats = data['seats'] as List<dynamic>? ?? [];
        _seats = _normalizeSeats(rawSeats);

        // Check if current user was kicked or host-muted
        if (_currentSeatNumber != null) {
          final mySeat = _seats.firstWhere(
            (s) => s.seatNumber == _currentSeatNumber,
            orElse: () => PartySeat(
              id: '',
              roomNumber: _roomId!,
              seatNumber: -1,
              isHost: false,
              status: 'available',
            ),
          );

          if (mySeat.status != 'occupied' ||
              (mySeat.participantId != null &&
                  _currentUserId != null &&
                  mySeat.participantId != _currentUserId)) {
            // User was removed/kicked from seat!
            _currentSeatNumber = null;
            _isHostMuted = false;
            await _agoraService.muteLocalAudio(true);
          } else {
            // Check host mute synchronization
            if (mySeat.isHostMuted != _isHostMuted) {
              _isHostMuted = mySeat.isHostMuted;
              if (_isHostMuted) {
                // Enforce hardware mute immediately
                await _agoraService.muteLocalAudio(true);
              }
            }
            _isMuted = mySeat.isMuted;
            _isCameraOn = mySeat.isCameraOn;
          }
        }
      }

      if (audienceRes.isSuccess && audienceRes.data != null) {
        final data = audienceRes.data as Map<String, dynamic>;
        final rawAudience = data['members'] as List<dynamic>? ?? [];
        _audience = rawAudience
            .whereType<Map<String, dynamic>>()
            .map((m) => PartyAudienceMember.fromJson(m))
            .toList();
      }

      notifyListeners();
    } catch (e) {
      debugPrint('[PartySessionManager] Sync error: $e');
    }
  }

  /// Fetches pending seat requests and invitations
  Future<void> _fetchPendingRequests() async {
    if (_roomId == null) return;
    try {
      final res = await _apiService.getSeatRequests(_roomId!);
      if (res.isSuccess && res.data != null) {
        final data = res.data as Map<String, dynamic>;
        final rawReqs = data['requests'] as List<dynamic>? ?? [];
        final rawInvs = data['invitations'] as List<dynamic>? ?? [];

        _pendingRequests = rawReqs
            .whereType<Map<String, dynamic>>()
            .map((r) => PartySeatRequest.fromJson(r))
            .toList();

        _pendingInvitations = rawInvs
            .whereType<Map<String, dynamic>>()
            .map((i) => PartySeatInvitation.fromJson(i))
            .toList();

        notifyListeners();
      }
    } catch (e) {
      debugPrint('[PartySessionManager] Requests sync error: $e');
    }
  }

  /// Fetches latest party chat messages
  Future<void> _fetchChatMessages() async {
    if (_roomId == null) return;
    try {
      final res = await _apiService.getPartyChatMessages(roomId: _roomId!);
      if (res.isSuccess && res.data != null) {
        final data = res.data as Map<String, dynamic>;
        final rawMsgs = data['messages'] as List<dynamic>? ?? [];

        _chatMessages = rawMsgs
            .whereType<Map<String, dynamic>>()
            .map((m) => PartyChatMessage.fromJson(m))
            .toList();

        notifyListeners();
      }
    } catch (e) {
      debugPrint('[PartySessionManager] Chat sync error: $e');
    }
  }

  /// Sends a chat message in the party room
  Future<bool> sendChatMessage(String text, {String? emoji}) async {
    if (_roomId == null || text.trim().isEmpty) return false;

    final role = _isHost
        ? 'host'
        : isSeated
        ? 'speaker'
        : 'audience';

    final res = await _apiService.sendPartyChatMessage(
      roomId: _roomId!,
      senderId:
          _currentUserId ?? 'guest_${DateTime.now().millisecondsSinceEpoch}',
      senderName: _currentUserName,
      senderAvatar: _currentUserAvatar,
      senderRole: role,
      seatNumber: _currentSeatNumber,
      messageText: text.trim(),
      emoji: emoji,
    );

    if (res.isSuccess) {
      await _fetchChatMessages();
      return true;
    }
    return false;
  }

  /// Submits a guest seat join request (Seats 2-9)
  Future<String> requestSeat(int seatNumber) async {
    if (_roomId == null) return 'Not connected to room';
    if (seatNumber < 2 || seatNumber > 9) return 'Invalid seat number';
    if (isSeated) return 'You are already occupying Seat #$_currentSeatNumber';

    final res = await _apiService.requestSeat(
      roomId: _roomId!,
      seatNumber: seatNumber,
      userId: _currentUserId,
      userName: _currentUserName,
      userAvatar: _currentUserAvatar,
      acceptedRules: true,
    );

    if (res.isSuccess) {
      final msg = res.data is Map && res.data['message'] != null
          ? res.data['message'].toString()
          : 'Seat #$seatNumber request submitted!';
      return msg;
    } else {
      return res.message ?? 'Failed to request seat';
    }
  }

  /// Directly occupies a seat (or host takes Seat 1)
  Future<bool> occupySeatDirectly(int seatNumber) async {
    if (_roomId == null) return false;

    final res = await _apiService.occupySeat(
      roomId: _roomId!,
      seatNumber: seatNumber,
      participantId: _currentUserId,
      participantName: _currentUserName,
      participantAvatar: _currentUserAvatar,
      isHost: seatNumber == 1 || _isHost,
    );

    if (res.isSuccess) {
      _currentSeatNumber = seatNumber;
      _isMuted = false;
      _isHostMuted = false;
      await _agoraService.muteLocalAudio(false);
      await _syncSeatsAndAudience();
      return true;
    }
    return false;
  }

  /// Vacates an occupied seat
  Future<bool> vacateSeat({int? seatNumber}) async {
    if (_roomId == null) return false;
    final targetSeat = seatNumber ?? _currentSeatNumber;
    if (targetSeat == null) return false;

    final isHostAction = _isHost && targetSeat != _currentSeatNumber;

    final res = await _apiService.vacateSeat(
      roomId: _roomId!,
      seatNumber: targetSeat,
      participantId: _currentUserId,
      isHostAction: isHostAction,
    );

    if (res.isSuccess) {
      if (targetSeat == _currentSeatNumber) {
        _currentSeatNumber = null;
        _isMuted = false;
        _isHostMuted = false;
        await _agoraService.muteLocalAudio(true);
      }
      await _syncSeatsAndAudience();
      return true;
    }
    return false;
  }

  /// Host responds to a pending seat request ('accept' | 'reject')
  Future<bool> respondToRequest({
    required String requestId,
    required String action, // 'accept' | 'reject'
  }) async {
    if (_roomId == null || !_isHost) return false;

    final res = await _apiService.respondToSeatRequest(
      roomId: _roomId!,
      requestId: requestId,
      action: action,
      isHostAction: true,
    );

    if (res.isSuccess) {
      await _fetchPendingRequests();
      await _syncSeatsAndAudience();
      return true;
    }
    return false;
  }

  /// Host sends seat invitation to an audience member
  Future<bool> inviteAudienceMember({
    required int seatNumber,
    required String invitedUserId,
    required String invitedUserName,
    String? invitedUserAvatar,
  }) async {
    if (_roomId == null || !_isHost) return false;

    final res = await _apiService.inviteToSeat(
      roomId: _roomId!,
      seatNumber: seatNumber,
      hostId: _currentUserId,
      invitedUserId: invitedUserId,
      invitedUserName: invitedUserName,
      invitedUserAvatar: invitedUserAvatar,
    );

    if (res.isSuccess) {
      await _fetchPendingRequests();
      return true;
    }
    return false;
  }

  /// Guest responds to an invitation ('accept' | 'decline')
  Future<bool> respondToInvitation({
    required String invitationId,
    required String action, // 'accept' | 'decline'
  }) async {
    if (_roomId == null) return false;

    final res = await _apiService.respondToSeatInvitation(
      roomId: _roomId!,
      invitationId: invitationId,
      action: action,
    );

    if (res.isSuccess) {
      if (action == 'accept' &&
          res.data is Map &&
          res.data['seatNumber'] != null) {
        _currentSeatNumber = (res.data['seatNumber'] as num).toInt();
        _isMuted = false;
        _isHostMuted = false;
        await _agoraService.muteLocalAudio(false);
      }
      await _syncSeatsAndAudience();
      return true;
    }
    return false;
  }

  /// Toggles microphone audio publishing (enforces host remote mute protection)
  Future<bool> toggleMic() async {
    if (_roomId == null || _currentSeatNumber == null) return false;

    if (_isHostMuted) {
      // Host has remotely muted this seat: guest cannot unmute
      return false;
    }

    final newMuted = !_isMuted;
    final res = await _apiService.toggleMedia(
      roomId: _roomId!,
      seatNumber: _currentSeatNumber!,
      type: 'mic',
      enabled: !newMuted,
      participantId: _currentUserId,
    );

    if (res.isSuccess) {
      _isMuted = newMuted;
      await _agoraService.muteLocalAudio(newMuted);
      notifyListeners();
      return true;
    }
    return false;
  }

  /// Toggles camera publishing
  Future<bool> toggleCamera() async {
    if (_roomId == null || _currentSeatNumber == null) return false;

    final newCameraOn = !_isCameraOn;
    final res = await _apiService.toggleMedia(
      roomId: _roomId!,
      seatNumber: _currentSeatNumber!,
      type: 'camera',
      enabled: newCameraOn,
      participantId: _currentUserId,
    );

    if (res.isSuccess) {
      _isCameraOn = newCameraOn;
      await _agoraService.muteLocalVideo(!newCameraOn);
      notifyListeners();
      return true;
    }
    return false;
  }

  /// Host remotely mutes a guest on Seats 2-9
  Future<bool> hostMuteGuest(int seatNumber) async {
    if (_roomId == null || !_isHost || seatNumber == 1) return false;

    final res = await _apiService.moderateMedia(
      roomId: _roomId!,
      seatNumber: seatNumber,
      action: 'host_mute',
      isHostAction: true,
    );

    if (res.isSuccess) {
      await _syncSeatsAndAudience();
      return true;
    }
    return false;
  }

  /// Host removes/kicks a guest from Seats 2-9
  Future<bool> hostKickGuest(int seatNumber) async {
    if (_roomId == null || !_isHost || seatNumber == 1) return false;

    final res = await _apiService.moderateMedia(
      roomId: _roomId!,
      seatNumber: seatNumber,
      action: 'kick',
      isHostAction: true,
    );

    if (res.isSuccess) {
      await _syncSeatsAndAudience();
      return true;
    }
    return false;
  }

  /// Leaves the party room cleanly, releasing audience and RTC resources
  Future<void> leaveRoom() async {
    _syncTimer?.cancel();
    _chatTimer?.cancel();

    try {
      if (_roomId != null && _currentUserId != null) {
        if (!_isHost) {
          await _apiService.leaveAudience(
            roomId: _roomId!,
            userId: _currentUserId!,
          );
        }
        if (_currentSeatNumber != null && !_isHost) {
          await _apiService.vacateSeat(
            roomId: _roomId!,
            seatNumber: _currentSeatNumber!,
            participantId: _currentUserId,
          );
        }
      }

      await _agoraService.releaseHardwareResources();
    } catch (e) {
      debugPrint('[PartySessionManager] Teardown error: $e');
    } finally {
      _roomId = null;
      _currentSeatNumber = null;
      _isHost = false;
      _isMuted = false;
      _isHostMuted = false;
      _isCameraOn = false;
      _seats.clear();
      _audience.clear();
      _pendingRequests.clear();
      _chatMessages.clear();
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _syncTimer?.cancel();
    _chatTimer?.cancel();
    super.dispose();
  }

  List<PartySeat> _normalizeSeats(List<dynamic> rawList) {
    final parsed = rawList
        .whereType<Map<String, dynamic>>()
        .map((s) => PartySeat.fromJson(s))
        .toList();

    final Map<int, PartySeat> seatMap = {
      for (var seat in parsed) seat.seatNumber: seat,
    };

    final List<PartySeat> normalized = [];
    for (int i = 1; i <= 9; i++) {
      if (seatMap.containsKey(i)) {
        normalized.add(seatMap[i]!);
      } else {
        normalized.add(
          PartySeat(
            id: 'seat-${_roomId ?? "0"}-$i',
            roomNumber: _roomId ?? '0',
            seatNumber: i,
            isHost: i == 1,
            status: 'available',
          ),
        );
      }
    }

    normalized.sort((a, b) => a.seatNumber.compareTo(b.seatNumber));
    return normalized;
  }
}
