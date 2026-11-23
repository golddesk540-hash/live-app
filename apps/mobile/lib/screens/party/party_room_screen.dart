import 'package:flutter/material.dart';

import '../../api/api.dart';
import '../../design/design_fixtures.dart';
import '../../theme/theme.dart';

/// 9-Seat Party Room Interface
/// Implements Popo Live Phase 4 (D3) Prompt 1
///
/// Features:
/// - Exactly 9-seat audio stage (Seat 1 = Host, Seats 2–9 = Guest Slots)
/// - Occupied seats show avatar, speaking rings, mute indicator, points
/// - Available seats show request button, locally occupying the seat
/// - Occupied seats cannot be requested
/// - Microphone controls with mute/unmute state & permission handling
/// - Party room chat with fixture message loading and local sending
/// - Room header with host details, viewer count, and close navigation
class PartyRoomScreen extends StatefulWidget {
  final FixturePartyRoom? room;
  final String? roomId;

  const PartyRoomScreen({
    super.key,
    this.room,
    this.roomId,
  });

  @override
  State<PartyRoomScreen> createState() => _PartyRoomScreenState();
}

class _PartyRoomScreenState extends State<PartyRoomScreen> {
  late FixturePartyRoom _room;
  late List<FixturePartySeat> _seats;
  final List<FixtureLiveChatMessage> _chatMessages = [];

  final TextEditingController _chatController = TextEditingController();
  final ScrollController _chatScrollController = ScrollController();

  int? _myOccupiedSeatIndex;
  bool _isMicMuted = false;
  bool _hasMicPermission = true;

  @override
  void initState() {
    super.initState();
    _initializeRoom();
    _initializeChat();
  }

  void _initializeRoom() {
    if (widget.room != null) {
      _room = widget.room!;
    } else if (widget.roomId != null) {
      try {
        _room = DesignFixtures.partyRooms.firstWhere(
          (r) => r.id == widget.roomId || r.roomNumber == widget.roomId,
          orElse: () => DesignFixtures.partyRooms.first,
        );
      } catch (_) {
        _room = DesignFixtures.partyRooms.first;
      }
    } else {
      _room = DesignFixtures.partyRooms.first;
    }

    // Clone seats list so local seat occupancies/requests are reactive
    _seats = List<FixturePartySeat>.from(_room.seats);

    // If current user is host or already occupying a seat
    final currentUser = DesignFixtures.currentUserProfile;
    if (_room.hostUserId == currentUser.userId ||
        (_seats.isNotEmpty && _seats[0].userId == currentUser.userId)) {
      _myOccupiedSeatIndex = 1;
    } else {
      for (final seat in _seats) {
        if (seat.isOccupied && seat.userId == currentUser.userId) {
          _myOccupiedSeatIndex = seat.index;
          break;
        }
      }
    }
  }

  void _initializeChat() {
    // Populate with fixture chat messages from live viewer room or standard welcome messages
    final sampleMessages = [
      FixtureLiveChatMessage(
        id: 'msg_welcome',
        senderNickname: 'Popo Assistant',
        senderAvatar:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        senderLevel: 99,
        isVip: true,
        content:
            'Welcome to "${_room.title}"! Please be respectful on the microphones 🎙️',
        timestamp: '12:00',
      ),
      FixtureLiveChatMessage(
        id: 'msg_host',
        senderNickname: _room.hostNickname,
        senderAvatar: _room.hostAvatar,
        senderLevel: 18,
        isVip: true,
        content:
            'Hello everyone! Welcome to the 9-seat lounge. Tap an empty seat to join the audio stage! ✨',
        timestamp: '12:01',
      ),
    ];

    try {
      if (!DesignFixtures.isError && !DesignFixtures.isEmpty) {
        sampleMessages
            .addAll(DesignFixtures.liveViewer.recentChatMessages.take(2));
      }
    } catch (_) {}

    _chatMessages.addAll(sampleMessages);
  }

  @override
  void dispose() {
    _chatController.dispose();
    _chatScrollController.dispose();
    super.dispose();
  }

  // ==========================================
  // SEAT INTERACTION ACTIONS
  // ==========================================
  void _onSeatTapped(FixturePartySeat seat) {
    if (seat.isOccupied) {
      _showOccupiedSeatProfile(seat);
    } else {
      _showSeatRequestDialog(seat);
    }
  }

  void _showOccupiedSeatProfile(FixturePartySeat seat) {
    showModalBottomSheet(
      context: context,
      backgroundColor: PopoTheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          key: Key('party_seat_profile_${seat.index}'),
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            CircleAvatar(
              radius: 34,
              backgroundImage: NetworkImage(
                seat.avatarUrl ?? _room.hostAvatar,
              ),
              backgroundColor: const Color(0xFF33334D),
            ),
            const SizedBox(height: 10),
            Text(
              seat.nickname ?? 'Audio Speaker',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (seat.isHost)
                  Container(
                    margin: const EdgeInsets.only(right: 6),
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: PopoTheme.gold,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Text(
                      'HOST',
                      style: TextStyle(
                        color: Colors.black,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: PopoTheme.cyan.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    'Seat #${seat.index} • ${seat.giftPoints} pts',
                    style: const TextStyle(
                      color: PopoTheme.cyan,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.06),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Row(
                children: [
                  Icon(Icons.info_outline_rounded,
                      color: PopoTheme.textSecondary, size: 18),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'This seat is currently occupied. Occupied seats cannot be requested.',
                      style: TextStyle(
                        color: PopoTheme.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  void _showSeatRequestDialog(FixturePartySeat seat) {
    showModalBottomSheet(
      context: context,
      backgroundColor: PopoTheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFF9800).withOpacity(0.15),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.airline_seat_recline_normal_rounded,
                    color: Color(0xFFFF9800),
                    size: 24,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Join Audio Stage - Seat #${seat.index}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Request open microphone in 9-seat lounge',
                        style: TextStyle(
                          color: PopoTheme.textSecondary,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            if (_myOccupiedSeatIndex != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: PopoTheme.primary.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.swap_horiz_rounded,
                        color: PopoTheme.primary, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'You are currently occupying Seat #$_myOccupiedSeatIndex. Moving will vacate your existing seat.',
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],
            SizedBox(
              width: double.infinity,
              height: 48,
              child: Container(
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFF9800), Color(0xFFFF5722)],
                  ),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: ElevatedButton(
                  key: const Key('confirm_seat_request_button'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
                    shadowColor: Colors.transparent,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(24),
                    ),
                  ),
                  onPressed: () async {
                    Navigator.of(ctx).pop();
                    if (ApiConfig.usePartyApi) {
                      try {
                        final res = await PartyApiService().requestPartySeat(
                          roomId: _room.id,
                          seatNumber: seat.index,
                        );
                        if (res.isSuccess) {
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                    'Seat #${seat.index} request submitted to host! 🎙️'),
                                backgroundColor: const Color(0xFF00C853),
                                duration: const Duration(seconds: 2),
                              ),
                            );
                          }
                        } else {
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(res.error ??
                                    'Failed to request Seat #${seat.index}'),
                                backgroundColor: Colors.redAccent,
                                duration: const Duration(seconds: 2),
                              ),
                            );
                          }
                        }
                      } catch (e) {
                        _occupySeatLocally(seat.index);
                      }
                    } else {
                      _occupySeatLocally(seat.index);
                    }
                  },
                  child: Text(
                    _myOccupiedSeatIndex != null
                        ? 'MOVE TO SEAT #${seat.index}'
                        : 'TAKE SEAT #${seat.index}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  void _occupySeatLocally(int seatIndex) {
    final currentUser = DesignFixtures.currentUserProfile;

    setState(() {
      // 1. Vacate old seat if user previously sat elsewhere
      if (_myOccupiedSeatIndex != null) {
        final oldIndex = _myOccupiedSeatIndex!;
        if (oldIndex >= 1 && oldIndex <= 9) {
          _seats[oldIndex - 1] = FixturePartySeat.empty(oldIndex);
        }
      }

      // 2. Occupy requested seat
      _seats[seatIndex - 1] = FixturePartySeat(
        index: seatIndex,
        userId: currentUser.userId,
        nickname: currentUser.nickname,
        avatarUrl: currentUser.avatarUrl,
        isHost: false,
        isMuted: _isMicMuted,
        isSpeaking: !_isMicMuted,
        giftPoints: 0,
        isOccupied: true,
        isLocked: false,
        canJoin: false,
        joinRequestStatus: 'accepted',
      );

      _myOccupiedSeatIndex = seatIndex;

      // 3. Post system announcement in party chat
      _chatMessages.add(
        FixtureLiveChatMessage(
          id: 'sys_${DateTime.now().millisecondsSinceEpoch}',
          senderNickname: 'Lounge Notice',
          senderAvatar: currentUser.avatarUrl,
          senderLevel: 1,
          isVip: false,
          content: '${currentUser.nickname} took Seat #$seatIndex 🎙️',
          timestamp: 'Just now',
        ),
      );
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
            'Seat #$seatIndex occupied! You can now speak in the lounge. 🎙️'),
        backgroundColor: const Color(0xFF00C853),
        duration: const Duration(seconds: 2),
      ),
    );

    _scrollChatToBottom();
  }

  void _showHostSeatRequestsModal() {
    showModalBottomSheet(
      context: context,
      backgroundColor: PopoTheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (modalContext, setModalState) {
            return FutureBuilder<ApiResponse<dynamic>>(
              future: PartyApiService().getPartyRequests(_room.id),
              builder: (ctx, snapshot) {
                final isLoading =
                    snapshot.connectionState == ConnectionState.waiting;
                final data = snapshot.data?.data as Map<String, dynamic>?;
                final requests = (data?['requests'] as List<dynamic>?) ?? [];

                return Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Center(
                        child: Container(
                          width: 40,
                          height: 4,
                          decoration: BoxDecoration(
                            color: Colors.white24,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Host Seat Management',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: PopoTheme.gold.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              '${requests.length} Pending',
                              style: const TextStyle(
                                color: PopoTheme.gold,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      if (isLoading)
                        const Center(
                          child: Padding(
                            padding: EdgeInsets.all(24.0),
                            child: CircularProgressIndicator(
                                color: PopoTheme.gold),
                          ),
                        )
                      else if (requests.isEmpty)
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.04),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Center(
                            child: Text(
                              'No pending seat requests at this moment.',
                              style: TextStyle(
                                color: PopoTheme.textSecondary,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        )
                      else
                        ConstrainedBox(
                          constraints: const BoxConstraints(maxHeight: 280),
                          child: ListView.separated(
                            shrinkWrap: true,
                            itemCount: requests.length,
                            separatorBuilder: (_, __) =>
                                const Divider(color: PopoTheme.borderSubtle),
                            itemBuilder: (context, idx) {
                              final req = requests[idx] as Map<String, dynamic>;
                              final reqId = req['id']?.toString() ?? '';
                              final seatNum =
                                  req['seatNumber'] ?? req['seat_number'] ?? 2;
                              final userName = req['userName'] ??
                                  req['user_name'] ??
                                  'Guest';
                              final avatarUrl = req['userAvatar'] ??
                                  req['user_avatar'] ??
                                  '/avatars/default.png';

                              return ListTile(
                                contentPadding: EdgeInsets.zero,
                                leading: CircleAvatar(
                                  radius: 18,
                                  backgroundImage: NetworkImage(avatarUrl),
                                  backgroundColor: const Color(0xFF33334D),
                                ),
                                title: Text(
                                  userName,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                subtitle: Text(
                                  'Requested Seat #$seatNum',
                                  style: const TextStyle(
                                    color: PopoTheme.textSecondary,
                                    fontSize: 11,
                                  ),
                                ),
                                trailing: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    IconButton(
                                      icon: const Icon(Icons.close_rounded,
                                          color: Colors.redAccent, size: 20),
                                      tooltip: 'Reject',
                                      onPressed: () async {
                                        await PartyApiService()
                                            .rejectPartyRequest(
                                          roomId: _room.id,
                                          requestId: reqId,
                                        );
                                        setModalState(() {});
                                      },
                                    ),
                                    IconButton(
                                      icon: const Icon(
                                          Icons.check_circle_rounded,
                                          color: Color(0xFF00C853),
                                          size: 22),
                                      tooltip: 'Accept',
                                       onPressed: () async {
                                         final messenger = ScaffoldMessenger.of(sheetContext);
                                         final nav = Navigator.of(sheetContext);
                                         final acceptRes =
                                             await PartyApiService()
                                                 .acceptPartyRequest(
                                           roomId: _room.id,
                                           requestId: reqId,
                                         );
                                         if (acceptRes.isSuccess) {
                                           if (sheetContext.mounted) {
                                             nav.pop();
                                             messenger.showSnackBar(
                                               SnackBar(
                                                 content: Text(
                                                     '$userName accepted for Seat #$seatNum! 🎙️'),
                                                 backgroundColor:
                                                     const Color(0xFF00C853),
                                               ),
                                             );
                                           }
                                         }
                                       },
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                        ),
                      const SizedBox(height: 12),
                    ],
                  ),
                );
              },
            );
          },
        );
      },
    );
  }

  // ==========================================
  // MICROPHONE CONTROLS
  // ==========================================
  void _toggleMicrophone() {
    if (_myOccupiedSeatIndex == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content:
              Text('You must take an available seat to speak in the lounge.'),
          backgroundColor: PopoTheme.primary,
          duration: Duration(seconds: 2),
        ),
      );
      return;
    }

    if (!_hasMicPermission) {
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
              'Microphone permission is denied. Please grant microphone access in device settings.'),
          backgroundColor: PopoTheme.primary,
          duration: Duration(seconds: 2),
        ),
      );
      return;
    }

    setState(() {
      _isMicMuted = !_isMicMuted;
      final seatIndex = _myOccupiedSeatIndex!;
      final oldSeat = _seats[seatIndex - 1];

      _seats[seatIndex - 1] = FixturePartySeat(
        index: seatIndex,
        userId: oldSeat.userId,
        nickname: oldSeat.nickname,
        avatarUrl: oldSeat.avatarUrl,
        isHost: oldSeat.isHost,
        isMuted: _isMicMuted,
        isSpeaking: !_isMicMuted,
        giftPoints: oldSeat.giftPoints,
        isOccupied: true,
        isLocked: oldSeat.isLocked,
        canJoin: false,
        joinRequestStatus: 'accepted',
      );
    });

    if (ApiConfig.usePartyApi && _room.id.isNotEmpty && _myOccupiedSeatIndex != null) {
      PartyApiService().toggleSeatMic(
        roomId: _room.id,
        seatNumber: _myOccupiedSeatIndex!,
        isMuted: _isMicMuted,
      );
    }

    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          _isMicMuted
              ? 'Microphone muted 🔇'
              : 'Microphone unmuted (Live speaking) 🎙️',
        ),
        backgroundColor:
            _isMicMuted ? const Color(0xFF555566) : const Color(0xFF00C853),
        duration: const Duration(seconds: 1),
      ),
    );
  }

  void _toggleMicPermissionForTesting() {
    setState(() {
      _hasMicPermission = !_hasMicPermission;
    });
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          _hasMicPermission
              ? 'Microphone permission simulated as: GRANTED'
              : 'Microphone permission simulated as: DENIED',
        ),
        backgroundColor:
            _hasMicPermission ? const Color(0xFF00C853) : PopoTheme.primary,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  // ==========================================
  // CHAT CONTROLS
  // ==========================================
  void _sendChatMessage() {
    final text = _chatController.text.trim();
    if (text.isEmpty) return;

    final currentUser = DesignFixtures.currentUserProfile;
    final newMsg = FixtureLiveChatMessage(
      id: 'chat_${DateTime.now().millisecondsSinceEpoch}',
      senderNickname: currentUser.nickname,
      senderAvatar: currentUser.avatarUrl,
      senderLevel: 10,
      isVip: currentUser.vipLevel > 0,
      content: text,
      timestamp: 'Now',
    );

    setState(() {
      _chatMessages.add(newMsg);
      _chatController.clear();
    });

    _scrollChatToBottom();
  }

  void _scrollChatToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_chatScrollController.hasClients) {
        _chatScrollController.animateTo(
          _chatScrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  // ==========================================
  // BUILD METHOD
  // ==========================================
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: PopoTheme.background,
      bottomNavigationBar: SafeArea(
        top: false,
        child: _buildBottomBar(),
      ),
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // 1. Party Room Header
            _buildRoomHeader(),

            // 2. Audio Stage: Exactly 9-Seat Grid
            _buildNineSeatStage(),

            const Divider(color: PopoTheme.borderSubtle, height: 1),

            // 3. Party Room Chat Stream
            Expanded(
              child: _buildChatSection(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRoomHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: const BoxDecoration(
        color: PopoTheme.surface,
        border: Border(
          bottom: BorderSide(color: PopoTheme.borderSubtle, width: 0.8),
        ),
      ),
      child: Row(
        children: [
          // Host Avatar with Flag
          Stack(
            clipBehavior: Clip.none,
            children: [
              CircleAvatar(
                radius: 20,
                backgroundImage: NetworkImage(_room.hostAvatar),
                backgroundColor: const Color(0xFF33334D),
              ),
              Positioned(
                bottom: -2,
                right: -2,
                child:
                    Text(_room.flagEmoji, style: const TextStyle(fontSize: 12)),
              ),
            ],
          ),
          const SizedBox(width: 10),

          // Title & Host info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _room.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Text(
                      _room.hostNickname,
                      style: const TextStyle(
                        color: PopoTheme.textSecondary,
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 5, vertical: 1),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFF9800).withOpacity(0.2),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        '#${_room.roomNumber}',
                        style: const TextStyle(
                          color: Color(0xFFFF9800),
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Viewer Count Badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.08),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.remove_red_eye_rounded,
                  color: Colors.white70,
                  size: 13,
                ),
                const SizedBox(width: 4),
                Text(
                  '${_room.viewerCount}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(width: 8),

          // Permission simulation toggle button (for test & verification)
          IconButton(
            key: const Key('toggle_mic_permission_button'),
            icon: Icon(
              _hasMicPermission
                  ? Icons.security_rounded
                  : Icons.gpp_bad_rounded,
              color: _hasMicPermission ? PopoTheme.cyan : PopoTheme.primary,
              size: 20,
            ),
            tooltip: 'Simulate Mic Permission',
            onPressed: _toggleMicPermissionForTesting,
          ),

          // Host Requests Management Button (when host or in Party API mode)
          if (ApiConfig.usePartyApi ||
              _room.hostNickname ==
                  DesignFixtures.currentUserProfile.nickname)
            IconButton(
              key: const Key('party_host_requests_button'),
              icon: const Icon(Icons.people_outline_rounded,
                  color: PopoTheme.gold, size: 20),
              tooltip: 'Seat Requests',
              onPressed: _showHostSeatRequestsModal,
            ),

          // Close button returning to Party Discovery
          IconButton(
            key: const Key('party_room_close_button'),
            icon:
                const Icon(Icons.close_rounded, color: Colors.white, size: 22),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ],
      ),
    );
  }

  Widget _buildNineSeatStage() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [
            PopoTheme.surface,
            Color(0xFF1B1828),
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      child: Column(
        children: [
          // Row 1: Seats 1..3
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildSeatWidget(_seats[0]),
              _buildSeatWidget(_seats[1]),
              _buildSeatWidget(_seats[2]),
            ],
          ),
          const SizedBox(height: 12),
          // Row 2: Seats 4..6
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildSeatWidget(_seats[3]),
              _buildSeatWidget(_seats[4]),
              _buildSeatWidget(_seats[5]),
            ],
          ),
          const SizedBox(height: 12),
          // Row 3: Seats 7..9
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildSeatWidget(_seats[6]),
              _buildSeatWidget(_seats[7]),
              _buildSeatWidget(_seats[8]),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSeatWidget(FixturePartySeat seat) {
    final isOccupied = seat.isOccupied;
    final isMe = _myOccupiedSeatIndex == seat.index;

    return InkWell(
      key: Key('party_seat_${seat.index}'),
      onTap: () => _onSeatTapped(seat),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        width: 86,
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
        child: Column(
          children: [
            Stack(
              clipBehavior: Clip.none,
              alignment: Alignment.center,
              children: [
                // Avatar or Empty Slot
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isOccupied
                          ? (seat.isSpeaking
                              ? PopoTheme.cyan
                              : (seat.isHost
                                  ? PopoTheme.gold
                                  : (isMe
                                      ? PopoTheme.primary
                                      : PopoTheme.borderSubtle)))
                          : PopoTheme.borderSubtle,
                      width: seat.isSpeaking ? 2.5 : 1.5,
                    ),
                    boxShadow: seat.isSpeaking
                        ? [
                            BoxShadow(
                              color: PopoTheme.cyan.withOpacity(0.5),
                              blurRadius: 10,
                              spreadRadius: 2,
                            ),
                          ]
                        : null,
                  ),
                  child: isOccupied
                      ? CircleAvatar(
                          radius: 23,
                          backgroundImage: NetworkImage(
                            seat.avatarUrl ?? _room.hostAvatar,
                          ),
                          backgroundColor: const Color(0xFF33334D),
                        )
                      : Container(
                          key: Key('seat_request_button_${seat.index}'),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white.withOpacity(0.04),
                          ),
                          child: Center(
                            child: Icon(
                              Icons.add_rounded,
                              color: Colors.white.withOpacity(0.6),
                              size: 22,
                            ),
                          ),
                        ),
                ),

                // Host Crown Badge
                if (seat.isHost)
                  Positioned(
                    top: -7,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 4, vertical: 1),
                      decoration: BoxDecoration(
                        color: PopoTheme.gold,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.workspace_premium,
                              color: Colors.black, size: 8),
                          Text(
                            'HOST',
                            style: TextStyle(
                              color: Colors.black,
                              fontSize: 7,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                // Mute status badge
                if (isOccupied && seat.isMuted)
                  Positioned(
                    bottom: -2,
                    right: -2,
                    child: Container(
                      padding: const EdgeInsets.all(2.5),
                      decoration: const BoxDecoration(
                        color: Color(0xFFE53935),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.mic_off_rounded,
                        color: Colors.white,
                        size: 10,
                      ),
                    ),
                  ),
              ],
            ),

            const SizedBox(height: 6),

            // Nickname or Seat Number
            Text(
              isOccupied
                  ? (isMe ? 'You' : (seat.nickname ?? 'Speaker'))
                  : 'Seat ${seat.index}',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: isOccupied
                    ? (isMe ? PopoTheme.primary : Colors.white)
                    : PopoTheme.textSecondary,
                fontSize: 10,
                fontWeight: isOccupied ? FontWeight.bold : FontWeight.w500,
              ),
            ),

            // Points or Available tag
            const SizedBox(height: 2),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
              decoration: BoxDecoration(
                color: isOccupied
                    ? const Color(0xFFFF9800).withOpacity(0.15)
                    : Colors.white.withOpacity(0.06),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                isOccupied ? '${seat.giftPoints} pts' : 'Join',
                style: TextStyle(
                  color: isOccupied
                      ? const Color(0xFFFF9800)
                      : PopoTheme.textSecondary,
                  fontSize: 8,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChatSection() {
    return Container(
      color: PopoTheme.background,
      child: ListView.builder(
        key: const Key('party_chat_list'),
        controller: _chatScrollController,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        itemCount: _chatMessages.length,
        itemBuilder: (context, index) {
          final msg = _chatMessages[index];
          final isHost = msg.senderNickname == _room.hostNickname;

          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 12,
                  backgroundImage: NetworkImage(msg.senderAvatar),
                  backgroundColor: const Color(0xFF33334D),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: PopoTheme.surface,
                      borderRadius: BorderRadius.circular(10),
                      border:
                          Border.all(color: PopoTheme.borderSubtle, width: 0.6),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            if (isHost)
                              Container(
                                margin: const EdgeInsets.only(right: 4),
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 4, vertical: 0.5),
                                decoration: BoxDecoration(
                                  color: PopoTheme.gold,
                                  borderRadius: BorderRadius.circular(3),
                                ),
                                child: const Text(
                                  'HOST',
                                  style: TextStyle(
                                    color: Colors.black,
                                    fontSize: 8,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            Text(
                              msg.senderNickname,
                              style: TextStyle(
                                color: isHost
                                    ? PopoTheme.gold
                                    : (msg.isVip
                                        ? PopoTheme.primary
                                        : PopoTheme.cyan),
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const Spacer(),
                            Text(
                              msg.timestamp,
                              style: const TextStyle(
                                color: PopoTheme.textSecondary,
                                fontSize: 9,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 3),
                        Text(
                          msg.content,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildBottomBar() {
    final isSeated = _myOccupiedSeatIndex != null;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: const BoxDecoration(
        color: PopoTheme.surface,
        border: Border(
          top: BorderSide(color: PopoTheme.borderSubtle, width: 0.8),
        ),
      ),
      child: Row(
        children: [
          // Microphone Control Button
          InkWell(
            key: const Key('party_mic_button'),
            onTap: _toggleMicrophone,
            borderRadius: BorderRadius.circular(24),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                gradient: isSeated
                    ? (_isMicMuted
                        ? const LinearGradient(
                            colors: [Color(0xFF555566), Color(0xFF333344)])
                        : const LinearGradient(
                            colors: [Color(0xFF00C853), Color(0xFF00E676)]))
                    : null,
                color: isSeated ? null : Colors.white.withOpacity(0.08),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: isSeated
                      ? (_isMicMuted ? Colors.white24 : Colors.transparent)
                      : PopoTheme.borderSubtle,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    isSeated
                        ? (_isMicMuted
                            ? Icons.mic_off_rounded
                            : Icons.mic_rounded)
                        : Icons.mic_off_rounded,
                    color: isSeated ? Colors.white : PopoTheme.textSecondary,
                    size: 18,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    isSeated ? (_isMicMuted ? 'Muted' : 'Mic On') : 'Take Seat',
                    style: TextStyle(
                      color: isSeated ? Colors.white : PopoTheme.textSecondary,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(width: 8),

          // Chat Input TextField
          Expanded(
            child: TextField(
              key: const Key('party_chat_input'),
              controller: _chatController,
              onSubmitted: (_) => _sendChatMessage(),
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: InputDecoration(
                hintText: 'Say something in party chat...',
                hintStyle: const TextStyle(color: Colors.white38, fontSize: 12),
                filled: true,
                fillColor: PopoTheme.background,
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(20),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),

          const SizedBox(width: 8),

          // Send Message Button
          Container(
            decoration: const BoxDecoration(
              gradient: PopoTheme.primaryGradient,
              shape: BoxShape.circle,
            ),
            child: IconButton(
              key: const Key('party_chat_send_button'),
              icon:
                  const Icon(Icons.send_rounded, color: Colors.white, size: 16),
              onPressed: _sendChatMessage,
            ),
          ),
        ],
      ),
    );
  }
}
