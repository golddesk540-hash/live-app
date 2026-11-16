import 'dart:async';

import 'package:flutter/material.dart';

import '../../api/api.dart';
import '../../l10n/strings.dart';
import '../../models/party/party_models.dart';
import '../../theme/theme.dart';
import '../../widgets/widgets.dart';

/// 9-Seat Party Room Interface
/// Implements verified Next.js backend endpoints:
/// - GET /api/party/{roomId}
/// - GET /api/party/{roomId}/seats
class PartyRoomScreen extends StatefulWidget {
  final String roomId;

  const PartyRoomScreen({super.key, required this.roomId});

  @override
  State<PartyRoomScreen> createState() => _PartyRoomScreenState();
}

class _PartyRoomScreenState extends State<PartyRoomScreen> {
  final PartyApiService _apiService = PartyApiService();

  PartyRoom? _roomDetails;
  List<PartySeat> _seats = [];
  bool _isLoading = true;
  String? _errorMessage;

  Timer? _pollingTimer;

  @override
  void initState() {
    super.initState();
    _fetchRoomData();

    // Periodic seat status poll every 4 seconds
    _pollingTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (mounted && _errorMessage == null) {
        _syncSeats();
      }
    });
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchRoomData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final results = await Future.wait([
        _apiService.getPartyRoomDetails(widget.roomId),
        _apiService.getPartySeats(widget.roomId),
      ]);

      if (!mounted) return;

      final roomRes = results[0];
      final seatsRes = results[1];

      if (roomRes.isSuccess && roomRes.data != null) {
        final data = roomRes.data as Map<String, dynamic>;
        final roomMap = data['room'] as Map<String, dynamic>? ?? data;
        _roomDetails = PartyRoom.fromJson(roomMap);
      }

      if (seatsRes.isSuccess && seatsRes.data != null) {
        final data = seatsRes.data as Map<String, dynamic>;
        final rawSeats = data['seats'] as List<dynamic>? ?? [];
        _seats = _parseAndNormalizeSeats(rawSeats);
      }

      setState(() {
        _isLoading = false;
        if (_roomDetails == null && _seats.isEmpty) {
          _errorMessage =
              roomRes.errorMessage ?? Strings.get(context, 'party_closed');
        }
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = 'Error loading party room: $e';
      });
    }
  }

  Future<void> _syncSeats() async {
    try {
      final res = await _apiService.getPartySeats(widget.roomId);
      if (res.isSuccess && res.data != null && mounted) {
        final data = res.data as Map<String, dynamic>;
        final rawSeats = data['seats'] as List<dynamic>? ?? [];
        final updatedSeats = _parseAndNormalizeSeats(rawSeats);

        setState(() {
          _seats = updatedSeats;
        });
      }
    } catch (e) {
      debugPrint('[PartyRoomScreen] Seat sync error: $e');
    }
  }

  List<PartySeat> _parseAndNormalizeSeats(List<dynamic> rawList) {
    final parsed = rawList
        .whereType<Map<String, dynamic>>()
        .map((s) => PartySeat.fromJson(s))
        .toList();

    // Ensure strictly 9 seat positions exist (Seats 1 to 9)
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
            id: 'seat-${widget.roomId}-$i',
            roomNumber: widget.roomId,
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

  void _confirmLeaveRoom() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: PopoTheme.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: const [
            Icon(Icons.logout_rounded, color: PopoTheme.primary, size: 24),
            SizedBox(width: 10),
            Text(
              'Leave Party Room',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
          ],
        ),
        content: Text(
          Strings.get(context, 'leave_party_confirm'),
          style: const TextStyle(
            color: PopoTheme.textSecondary,
            fontSize: 14,
            height: 1.35,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text(
              'Cancel',
              style: TextStyle(color: PopoTheme.textSecondary),
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: PopoTheme.primary,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.pop(context);
            },
            child: const Text(
              'Leave',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: PopoTheme.background,
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: const [
              PopoLoadingIndicator(color: PopoTheme.primary, size: 40),
              SizedBox(height: 16),
              Text(
                'Connecting to Party Room...',
                style: TextStyle(color: Colors.white, fontSize: 14),
              ),
            ],
          ),
        ),
      );
    }

    if (_errorMessage != null) {
      return Scaffold(
        backgroundColor: PopoTheme.background,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: PopoTheme.surface,
                    shape: BoxShape.circle,
                    border: Border.all(color: PopoTheme.borderSubtle),
                  ),
                  child: const Icon(
                    Icons.meeting_room_outlined,
                    color: PopoTheme.textSecondary,
                    size: 48,
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Party Room Unavailable',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _errorMessage!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: PopoTheme.textSecondary,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 24),
                PopoPrimaryButton(
                  text: 'Back to Party Discovery',
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final hostSeat = _seats.isNotEmpty ? _seats.first : null;
    final guestSeats = _seats.length > 1 ? _seats.sublist(1) : <PartySeat>[];

    return WillPopScope(
      onWillPop: () async {
        _confirmLeaveRoom();
        return false;
      },
      child: Scaffold(
        backgroundColor: PopoTheme.background,
        body: SafeArea(
          child: Column(
            children: [
              // 1. Room Header HUD
              _buildRoomHeader(),

              // 2. 9-Seat Adaptive Layout
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  child: Column(
                    children: [
                      // Host Seat (Seat #1)
                      if (hostSeat != null) _buildHostSeatCard(hostSeat),
                      const SizedBox(height: 20),

                      // Guest Seats (Seats #2 to #9) — 2 rows of 4 seats
                      _buildGuestSeatsGrid(guestSeats),
                    ],
                  ),
                ),
              ),

              // 3. Bottom Action Bar
              _buildBottomBar(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRoomHeader() {
    final title = _roomDetails?.title ?? 'Party Room #${widget.roomId}';
    final category = _roomDetails?.category ?? 'Chill & Chat';
    final isPrivate = _roomDetails?.isPrivate ?? false;
    final occupiedCount = _seats.where((s) => s.isOccupied).length;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: PopoTheme.surface,
        border: const Border(
          bottom: BorderSide(color: PopoTheme.borderSubtle, width: 1),
        ),
      ),
      child: Row(
        children: [
          // Exit button
          IconButton(
            icon: const Icon(
              Icons.arrow_back_ios_new_rounded,
              color: Colors.white,
              size: 20,
            ),
            onPressed: _confirmLeaveRoom,
          ),
          const SizedBox(width: 4),

          // Room Title & Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 1.5,
                      ),
                      decoration: BoxDecoration(
                        color: PopoTheme.primary.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        category,
                        style: const TextStyle(
                          color: PopoTheme.primary,
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'ID: ${widget.roomId}',
                      style: const TextStyle(
                        color: PopoTheme.textSecondary,
                        fontSize: 11,
                      ),
                    ),
                    if (isPrivate) ...[
                      const SizedBox(width: 6),
                      const Icon(
                        Icons.lock_rounded,
                        color: PopoTheme.gold,
                        size: 12,
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),

          // Occupancy Pill
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: const Color(0xFF1B1B26),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: PopoTheme.cyan.withOpacity(0.4)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.weekend_rounded,
                  color: PopoTheme.cyan,
                  size: 14,
                ),
                const SizedBox(width: 5),
                Text(
                  '$occupiedCount / 9',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHostSeatCard(PartySeat hostSeat) {
    final hasHost = hostSeat.isOccupied;
    final name =
        hostSeat.participantName ??
        (_roomDetails?.hostNickname ?? Strings.get(context, 'host_seat_label'));

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
      decoration: BoxDecoration(
        color: PopoTheme.surface,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: PopoTheme.gold.withOpacity(0.6), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: PopoTheme.gold.withOpacity(0.12),
            blurRadius: 16,
            spreadRadius: 1,
          ),
        ],
      ),
      child: Column(
        children: [
          // Host Crown Label
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.military_tech_rounded,
                color: PopoTheme.gold,
                size: 18,
              ),
              const SizedBox(width: 4),
              Text(
                'PARTY HOST · SEAT #1',
                style: const TextStyle(
                  color: PopoTheme.gold,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.8,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Host Avatar with Microphone & Camera Status
          Stack(
            alignment: Alignment.bottomRight,
            children: [
              Container(
                width: 76,
                height: 76,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: PopoTheme.gold, width: 2.5),
                  color: const Color(0xFF282438),
                ),
                child: const Icon(
                  Icons.person_rounded,
                  color: Colors.white70,
                  size: 44,
                ),
              ),

              // Mic Status Badge
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: hostSeat.isMuted
                      ? PopoTheme.primary
                      : const Color(0xFF00E676),
                  shape: BoxShape.circle,
                  border: Border.all(color: PopoTheme.surface, width: 2),
                ),
                child: Icon(
                  hostSeat.isMuted ? Icons.mic_off_rounded : Icons.mic_rounded,
                  color: Colors.white,
                  size: 13,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Host Nickname
          Text(
            name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 15,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),

          // Live Audio Status indicator
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                hostSeat.isCameraOn
                    ? Icons.videocam_rounded
                    : Icons.headphones_rounded,
                color: PopoTheme.cyan,
                size: 13,
              ),
              const SizedBox(width: 4),
              Text(
                hasHost ? 'Broadcasting Audio' : 'Host Active',
                style: const TextStyle(
                  color: PopoTheme.textSecondary,
                  fontSize: 11,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildGuestSeatsGrid(List<PartySeat> guestSeats) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: const [
              Text(
                'Guest Seats (2-9)',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                '8 Seats Available',
                style: TextStyle(color: PopoTheme.textSecondary, fontSize: 11),
              ),
            ],
          ),
        ),
        const SizedBox(height: 6),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 4,
            crossAxisSpacing: 10,
            mainAxisSpacing: 14,
            childAspectRatio: 0.72,
          ),
          itemCount: 8,
          itemBuilder: (context, index) {
            final seat = (index < guestSeats.length)
                ? guestSeats[index]
                : PartySeat(
                    id: 'seat-${widget.roomId}-${index + 2}',
                    roomNumber: widget.roomId,
                    seatNumber: index + 2,
                    isHost: false,
                    status: 'available',
                  );

            return _buildGuestSeatTile(seat);
          },
        ),
      ],
    );
  }

  Widget _buildGuestSeatTile(PartySeat seat) {
    final isOccupied = seat.isOccupied;

    return Container(
      decoration: BoxDecoration(
        color: PopoTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isOccupied
              ? PopoTheme.cyan.withOpacity(0.5)
              : PopoTheme.borderSubtle,
          width: isOccupied ? 1.2 : 0.8,
        ),
      ),
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          // Seat Avatar or Empty Armchair
          Stack(
            alignment: Alignment.bottomRight,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isOccupied
                      ? const Color(0xFF28283E)
                      : const Color(0xFF1E1E2B),
                  border: Border.all(
                    color: isOccupied ? PopoTheme.cyan : PopoTheme.borderSubtle,
                    width: 1.2,
                  ),
                ),
                child: Icon(
                  isOccupied ? Icons.person_rounded : Icons.weekend_outlined,
                  color: isOccupied
                      ? Colors.white70
                      : PopoTheme.textSecondary.withOpacity(0.6),
                  size: isOccupied ? 24 : 20,
                ),
              ),

              // Mic icon if occupied
              if (isOccupied)
                Container(
                  padding: const EdgeInsets.all(2.5),
                  decoration: BoxDecoration(
                    color: seat.isMuted
                        ? PopoTheme.primary
                        : const Color(0xFF00E676),
                    shape: BoxShape.circle,
                    border: Border.all(color: PopoTheme.surface, width: 1.5),
                  ),
                  child: Icon(
                    seat.isMuted ? Icons.mic_off_rounded : Icons.mic_rounded,
                    color: Colors.white,
                    size: 9,
                  ),
                ),
            ],
          ),

          // Participant Nickname or Seat Label
          Text(
            isOccupied
                ? (seat.participantName ?? 'Guest')
                : Strings.get(context, 'available_seat_label'),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: isOccupied ? Colors.white : PopoTheme.textSecondary,
              fontSize: 10,
              fontWeight: isOccupied ? FontWeight.bold : FontWeight.normal,
            ),
          ),

          // Seat Number Badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
            decoration: BoxDecoration(
              color: const Color(0xFF161622),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              'Seat ${seat.seatNumber}',
              style: const TextStyle(
                color: PopoTheme.textSecondary,
                fontSize: 8,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: PopoTheme.surface,
        border: const Border(
          top: BorderSide(color: PopoTheme.borderSubtle, width: 1),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: Color(0xFF00E676),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 8),
              const Text(
                'Party Active · Agora RTC Ready',
                style: TextStyle(color: PopoTheme.textSecondary, fontSize: 12),
              ),
            ],
          ),

          // Leave Room Button
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: PopoTheme.primary, width: 1),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            ),
            icon: const Icon(
              Icons.exit_to_app_rounded,
              color: PopoTheme.primary,
              size: 16,
            ),
            label: Text(
              Strings.get(context, 'leave_party'),
              style: const TextStyle(
                color: PopoTheme.primary,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
            onPressed: _confirmLeaveRoom,
          ),
        ],
      ),
    );
  }
}
