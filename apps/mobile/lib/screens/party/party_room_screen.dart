import 'dart:async';

import 'package:flutter/material.dart';

import '../../auth/auth_state.dart';
import '../../l10n/strings.dart';
import '../../models/party/party_models.dart';
import '../../services/party/party_session_manager.dart';
import '../../theme/theme.dart';
import '../../widgets/widgets.dart';

/// 9-Seat Party Room Interface
/// Implements verified Next.js backend endpoints:
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
class PartyRoomScreen extends StatefulWidget {
  final String roomId;

  const PartyRoomScreen({super.key, required this.roomId});

  @override
  State<PartyRoomScreen> createState() => _PartyRoomScreenState();
}

class _PartyRoomScreenState extends State<PartyRoomScreen> {
  late final PartySessionManager _manager;
  final TextEditingController _chatController = TextEditingController();
  final ScrollController _chatScrollController = ScrollController();
  String? _handledInvitationId;

  @override
  void initState() {
    super.initState();
    _manager = PartySessionManager();
    _manager.addListener(_onSessionStateChanged);

    // Initialize with current authenticated user
    final currentUser = AuthState.instance.currentUser;
    _manager.joinRoom(roomId: widget.roomId, userProfile: currentUser);
  }

  @override
  void dispose() {
    _manager.removeListener(_onSessionStateChanged);
    _manager.leaveRoom();
    _manager.dispose();
    _chatController.dispose();
    _chatScrollController.dispose();
    super.dispose();
  }

  void _onSessionStateChanged() {
    if (!mounted) return;
    setState(() {});

    // Check if an invitation is pending for this user
    final currentUserId = _manager.currentUserId;
    if (currentUserId != null && !_manager.isSeated) {
      final myInv = _manager.pendingInvitations.firstWhere(
        (inv) =>
            inv.invitedUserId == currentUserId &&
            inv.isPending &&
            inv.id != _handledInvitationId,
        orElse: () => PartySeatInvitation(
          id: '',
          roomNumber: '',
          seatNumber: 0,
          hostId: '',
          invitedUserId: '',
          invitedUserName: '',
          status: 'none',
        ),
      );

      if (myInv.id.isNotEmpty) {
        _handledInvitationId = myInv.id;
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _showInvitationDialog(myInv);
        });
      }
    }
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
            onPressed: () async {
              Navigator.pop(ctx);
              await _manager.leaveRoom();
              if (mounted) {
                Navigator.pop(context);
              }
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

  void _showInvitationDialog(PartySeatInvitation invitation) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: PopoTheme.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: const [
            Icon(Icons.celebration_rounded, color: PopoTheme.gold, size: 24),
            SizedBox(width: 10),
            Text(
              'Seat Invitation',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Party Host has invited you to take Seat #${invitation.seatNumber} and broadcast audio!',
              style: const TextStyle(
                color: PopoTheme.textSecondary,
                fontSize: 14,
                height: 1.35,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF1E1E2C),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: PopoTheme.gold.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.mic_rounded,
                    color: PopoTheme.gold,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Seat #${invitation.seatNumber} Reserved for You',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await _manager.respondToInvitation(
                invitationId: invitation.id,
                action: 'decline',
              );
            },
            child: const Text(
              'Decline',
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
            onPressed: () async {
              Navigator.pop(ctx);
              final success = await _manager.respondToInvitation(
                invitationId: invitation.id,
                action: 'accept',
              );
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      success
                          ? 'Joined Seat #${invitation.seatNumber}!'
                          : 'Failed to accept invitation.',
                    ),
                    backgroundColor: success
                        ? const Color(0xFF00E676)
                        : PopoTheme.primary,
                  ),
                );
              }
            },
            child: const Text(
              'Accept & Join Seat',
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

  void _showRequestSeatSheet(int seatNumber) {
    if (_manager.isSeated) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'You are already occupying Seat #${_manager.currentSeatNumber}. Vacate first.',
          ),
          backgroundColor: PopoTheme.primary,
        ),
      );
      return;
    }

    showModalBottomSheet(
      context: context,
      backgroundColor: PopoTheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: PopoTheme.borderSubtle,
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
                    color: PopoTheme.cyan.withOpacity(0.15),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.weekend_rounded,
                    color: PopoTheme.cyan,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Request Seat #$seatNumber',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 2),
                    const Text(
                      'Submit request to Party Host to speak',
                      style: TextStyle(
                        color: PopoTheme.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF1E1E2C),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: PopoTheme.borderSubtle),
              ),
              child: Row(
                children: const [
                  Icon(Icons.mic_rounded, color: Color(0xFF00E676), size: 18),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Once approved, your microphone audio will broadcast live to all listeners.',
                      style: TextStyle(
                        color: PopoTheme.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: PopoTheme.borderSubtle),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text(
                      'Cancel',
                      style: TextStyle(color: PopoTheme.textSecondary),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: PopoPrimaryButton(
                    text: 'Submit Request',
                    onPressed: () async {
                      Navigator.pop(ctx);
                      final msg = await _manager.requestSeat(seatNumber);
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(msg),
                            backgroundColor: PopoTheme.surface,
                            duration: const Duration(seconds: 4),
                          ),
                        );
                      }
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showMySeatSheet(PartySeat seat) {
    showModalBottomSheet(
      context: context,
      backgroundColor: PopoTheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: PopoTheme.borderSubtle,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Your Seat (Seat #${seat.seatNumber})',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              _manager.isHostMuted
                  ? 'Your microphone is currently muted by the Host'
                  : 'You are broadcasting audio to the room',
              style: TextStyle(
                color: _manager.isHostMuted
                    ? PopoTheme.primary
                    : PopoTheme.textSecondary,
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 20),
            ListTile(
              leading: Icon(
                _manager.isMuted ? Icons.mic_off_rounded : Icons.mic_rounded,
                color: _manager.isHostMuted
                    ? Colors.grey
                    : (_manager.isMuted
                          ? PopoTheme.primary
                          : const Color(0xFF00E676)),
              ),
              title: Text(
                _manager.isHostMuted
                    ? 'Microphone (Host Muted)'
                    : (_manager.isMuted
                          ? 'Unmute Microphone'
                          : 'Mute Microphone'),
                style: TextStyle(
                  color: _manager.isHostMuted ? Colors.grey : Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
              enabled: !_manager.isHostMuted,
              onTap: () async {
                Navigator.pop(ctx);
                await _manager.toggleMic();
              },
            ),
            ListTile(
              leading: Icon(
                _manager.isCameraOn
                    ? Icons.videocam_rounded
                    : Icons.videocam_off_rounded,
                color: PopoTheme.cyan,
              ),
              title: Text(
                _manager.isCameraOn ? 'Turn Off Camera' : 'Turn On Camera',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
              onTap: () async {
                Navigator.pop(ctx);
                await _manager.toggleCamera();
              },
            ),
            const Divider(color: PopoTheme.borderSubtle),
            ListTile(
              leading: const Icon(
                Icons.exit_to_app_rounded,
                color: PopoTheme.primary,
              ),
              title: const Text(
                'Leave Seat',
                style: TextStyle(
                  color: PopoTheme.primary,
                  fontWeight: FontWeight.bold,
                ),
              ),
              onTap: () async {
                Navigator.pop(ctx);
                final ok = await _manager.vacateSeat(
                  seatNumber: seat.seatNumber,
                );
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        ok
                            ? 'Vacated Seat #${seat.seatNumber}.'
                            : 'Failed to leave seat.',
                      ),
                    ),
                  );
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showHostManageGuestSheet(PartySeat seat) {
    showModalBottomSheet(
      context: context,
      backgroundColor: PopoTheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: PopoTheme.borderSubtle,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Manage Guest · Seat #${seat.seatNumber}',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              seat.participantName ?? 'Guest User',
              style: const TextStyle(
                color: PopoTheme.cyan,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 20),
            ListTile(
              leading: Icon(
                seat.isHostMuted
                    ? Icons.mic_off_rounded
                    : Icons.volume_off_rounded,
                color: PopoTheme.gold,
              ),
              title: Text(
                seat.isHostMuted ? 'Guest is Muted by Host' : 'Host Mute Guest',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
              subtitle: const Text(
                'Mutes participant audio across Agora channel',
                style: TextStyle(color: PopoTheme.textSecondary, fontSize: 11),
              ),
              onTap: () async {
                Navigator.pop(ctx);
                final ok = await _manager.hostMuteGuest(seat.seatNumber);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        ok
                            ? 'Muted ${seat.participantName} on Seat #${seat.seatNumber}.'
                            : 'Failed to mute guest.',
                      ),
                    ),
                  );
                }
              },
            ),
            ListTile(
              leading: const Icon(
                Icons.person_remove_rounded,
                color: PopoTheme.primary,
              ),
              title: const Text(
                'Remove from Seat (Kick)',
                style: TextStyle(
                  color: PopoTheme.primary,
                  fontWeight: FontWeight.bold,
                ),
              ),
              subtitle: const Text(
                'Vacates seat and returns participant to audience',
                style: TextStyle(color: PopoTheme.textSecondary, fontSize: 11),
              ),
              onTap: () async {
                Navigator.pop(ctx);
                final ok = await _manager.hostKickGuest(seat.seatNumber);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        ok
                            ? 'Removed ${seat.participantName} from Seat #${seat.seatNumber}.'
                            : 'Failed to remove guest.',
                      ),
                    ),
                  );
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showHostInviteSheet(int seatNumber) {
    showModalBottomSheet(
      context: context,
      backgroundColor: PopoTheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: PopoTheme.borderSubtle,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Invite Audience to Seat #$seatNumber',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Choose an active listener from the room (${_manager.audience.length} listeners)',
              style: const TextStyle(
                color: PopoTheme.textSecondary,
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 16),
            if (_manager.audience.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 24),
                child: Center(
                  child: Text(
                    'No audience members currently in the room.',
                    style: const TextStyle(color: PopoTheme.textSecondary),
                  ),
                ),
              )
            else
              ConstrainedBox(
                constraints: const BoxConstraints(maxHeight: 280),
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: _manager.audience.length,
                  separatorBuilder: (_, __) =>
                      const Divider(color: PopoTheme.borderSubtle),
                  itemBuilder: (context, index) {
                    final member = _manager.audience[index];
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: CircleAvatar(
                        radius: 20,
                        backgroundColor: const Color(0xFF28283E),
                        child: Text(
                          member.userName.isNotEmpty
                              ? member.userName[0].toUpperCase()
                              : '?',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      title: Text(
                        member.userName,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      subtitle: Text(
                        'Level ${member.userLevel}',
                        style: const TextStyle(
                          color: PopoTheme.gold,
                          fontSize: 11,
                        ),
                      ),
                      trailing: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: PopoTheme.primary,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 8,
                          ),
                        ),
                        onPressed: () async {
                          Navigator.pop(ctx);
                          final ok = await _manager.inviteAudienceMember(
                            seatNumber: seatNumber,
                            invitedUserId: member.userId,
                            invitedUserName: member.userName,
                            invitedUserAvatar: member.userAvatar,
                          );
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  ok
                                      ? 'Invitation sent to ${member.userName} for Seat #$seatNumber!'
                                      : 'Failed to send invitation.',
                                ),
                              ),
                            );
                          }
                        },
                        child: const Text(
                          'Invite',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _showSeatRequestsSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: PopoTheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setSheetState) {
          final requests = _manager.pendingRequests;

          return Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: PopoTheme.borderSubtle,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Seat Requests (${requests.length})',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (requests.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: PopoTheme.primary,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          '${requests.length} Pending',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 16),
                if (requests.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 32),
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: const [
                          Icon(
                            Icons.check_circle_outline_rounded,
                            color: Color(0xFF00E676),
                            size: 40,
                          ),
                          SizedBox(height: 8),
                          Text(
                            'No pending seat requests',
                            style: TextStyle(
                              color: PopoTheme.textSecondary,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                else
                  ConstrainedBox(
                    constraints: const BoxConstraints(maxHeight: 320),
                    child: ListView.separated(
                      shrinkWrap: true,
                      itemCount: requests.length,
                      separatorBuilder: (_, __) =>
                          const Divider(color: PopoTheme.borderSubtle),
                      itemBuilder: (context, index) {
                        final req = requests[index];
                        return ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: CircleAvatar(
                            radius: 20,
                            backgroundColor: const Color(0xFF28283E),
                            child: Text(
                              req.userName.isNotEmpty
                                  ? req.userName[0].toUpperCase()
                                  : 'G',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          title: Text(
                            req.userName,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          subtitle: Text(
                            'Requested Seat #${req.seatNumber}',
                            style: const TextStyle(
                              color: PopoTheme.cyan,
                              fontSize: 11,
                            ),
                          ),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              IconButton(
                                icon: const Icon(
                                  Icons.close_rounded,
                                  color: PopoTheme.primary,
                                  size: 20,
                                ),
                                onPressed: () async {
                                  await _manager.respondToRequest(
                                    requestId: req.id,
                                    action: 'reject',
                                  );
                                  setSheetState(() {});
                                },
                              ),
                              const SizedBox(width: 4),
                              ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF00E676),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 14,
                                    vertical: 8,
                                  ),
                                ),
                                onPressed: () async {
                                  final ok = await _manager.respondToRequest(
                                    requestId: req.id,
                                    action: 'accept',
                                  );
                                  setSheetState(() {});
                                  if (mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(
                                          ok
                                              ? 'Accepted ${req.userName} for Seat #${req.seatNumber}!'
                                              : 'Failed to accept request.',
                                        ),
                                      ),
                                    );
                                  }
                                },
                                child: const Text(
                                  'Accept',
                                  style: TextStyle(
                                    color: Colors.black,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _sendMessage() async {
    final text = _chatController.text.trim();
    if (text.isEmpty) return;

    _chatController.clear();
    await _manager.sendChatMessage(text);
    if (_chatScrollController.hasClients) {
      _chatScrollController.animateTo(
        _chatScrollController.position.maxScrollExtent + 40,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_manager.isLoading && _manager.seats.isEmpty) {
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

    if (_manager.errorMessage != null && _manager.seats.isEmpty) {
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
                  _manager.errorMessage!,
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

    final hostSeat = _manager.seats.isNotEmpty ? _manager.seats.first : null;
    final guestSeats = _manager.seats.length > 1
        ? _manager.seats.sublist(1)
        : <PartySeat>[];

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

              // 2. Audience Presence Bar
              _buildAudienceBar(),

              // 3. 9-Seat Adaptive Layout & Chat Section
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 8,
                  ),
                  child: Column(
                    children: [
                      // Host Seat (Seat #1)
                      if (hostSeat != null) _buildHostSeatCard(hostSeat),
                      const SizedBox(height: 14),

                      // Guest Seats (Seats #2 to #9) — 2 rows of 4 seats
                      _buildGuestSeatsGrid(guestSeats),
                      const SizedBox(height: 16),

                      // Live Party Chat Stream
                      _buildLiveChatSection(),
                    ],
                  ),
                ),
              ),

              // 4. Bottom Action Bar
              _buildBottomBar(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRoomHeader() {
    final title = _manager.roomDetails?.title ?? 'Party Room #${widget.roomId}';
    final category = _manager.roomDetails?.category ?? 'Chill & Chat';
    final isPrivate = _manager.roomDetails?.isPrivate ?? false;
    final occupiedCount = _manager.seats.where((s) => s.isOccupied).length;
    final pendingCount = _manager.pendingRequests.length;

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

          // For Host: Seat Requests Notification Button
          if (_manager.isHost) ...[
            Stack(
              clipBehavior: Clip.none,
              children: [
                IconButton(
                  icon: const Icon(
                    Icons.how_to_reg_rounded,
                    color: PopoTheme.gold,
                    size: 22,
                  ),
                  onPressed: _showSeatRequestsSheet,
                ),
                if (pendingCount > 0)
                  Positioned(
                    right: 6,
                    top: 6,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: PopoTheme.primary,
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        '$pendingCount',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 4),
          ],

          // Occupancy Pill
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
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
                  size: 13,
                ),
                const SizedBox(width: 4),
                Text(
                  '$occupiedCount / 9',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
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

  Widget _buildAudienceBar() {
    final audience = _manager.audience;
    final totalCount = audience.length;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      color: const Color(0xFF14141E),
      child: Row(
        children: [
          Icon(Icons.headset_rounded, color: PopoTheme.textSecondary, size: 14),
          const SizedBox(width: 6),
          Text(
            '$totalCount Listeners',
            style: const TextStyle(
              color: PopoTheme.textSecondary,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: SizedBox(
              height: 24,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: audience.length,
                separatorBuilder: (_, __) => const SizedBox(width: 6),
                itemBuilder: (context, index) {
                  final member = audience[index];
                  return CircleAvatar(
                    radius: 12,
                    backgroundColor: const Color(0xFF28283E),
                    child: Text(
                      member.userName.isNotEmpty
                          ? member.userName[0].toUpperCase()
                          : '?',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  );
                },
              ),
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
        (_manager.roomDetails?.hostNickname ?? 'Host Live');

    return GestureDetector(
      onTap: () {
        if (_manager.isHost) {
          _showMySeatSheet(hostSeat);
        }
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
        decoration: BoxDecoration(
          color: PopoTheme.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: PopoTheme.gold.withOpacity(0.6),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: PopoTheme.gold.withOpacity(0.12),
              blurRadius: 14,
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
                  size: 16,
                ),
                const SizedBox(width: 4),
                Text(
                  'PARTY HOST · SEAT #1',
                  style: const TextStyle(
                    color: PopoTheme.gold,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.8,
                  ),
                ),
                if (_manager.isHost) ...[
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 5,
                      vertical: 1,
                    ),
                    decoration: BoxDecoration(
                      color: PopoTheme.gold.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text(
                      'YOU',
                      style: TextStyle(
                        color: PopoTheme.gold,
                        fontSize: 8,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 10),

            // Host Avatar with Microphone & Camera Status
            Stack(
              alignment: Alignment.bottomRight,
              children: [
                Container(
                  width: 68,
                  height: 68,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: PopoTheme.gold, width: 2.2),
                    color: const Color(0xFF282438),
                  ),
                  child: const Icon(
                    Icons.person_rounded,
                    color: Colors.white70,
                    size: 38,
                  ),
                ),

                // Mic Status Badge
                Container(
                  padding: const EdgeInsets.all(3.5),
                  decoration: BoxDecoration(
                    color: hostSeat.isMuted
                        ? PopoTheme.primary
                        : const Color(0xFF00E676),
                    shape: BoxShape.circle,
                    border: Border.all(color: PopoTheme.surface, width: 2),
                  ),
                  child: Icon(
                    hostSeat.isMuted
                        ? Icons.mic_off_rounded
                        : Icons.mic_rounded,
                    color: Colors.white,
                    size: 11,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Host Nickname
            Text(
              name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 3),

            // Live Audio Status indicator
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  hostSeat.isCameraOn
                      ? Icons.videocam_rounded
                      : Icons.headphones_rounded,
                  color: PopoTheme.cyan,
                  size: 12,
                ),
                const SizedBox(width: 4),
                Text(
                  hasHost ? 'Broadcasting Audio' : 'Host Active',
                  style: const TextStyle(
                    color: PopoTheme.textSecondary,
                    fontSize: 10,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGuestSeatsGrid(List<PartySeat> guestSeats) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Guest Seats (2-9)',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                '${8 - guestSeats.where((s) => s.isOccupied).length} Seats Available',
                style: const TextStyle(
                  color: PopoTheme.textSecondary,
                  fontSize: 11,
                ),
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
            crossAxisSpacing: 8,
            mainAxisSpacing: 10,
            childAspectRatio: 0.74,
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
    final isMySeat = _manager.currentSeatNumber == seat.seatNumber;

    return GestureDetector(
      onTap: () {
        if (isMySeat) {
          _showMySeatSheet(seat);
        } else if (isOccupied) {
          if (_manager.isHost) {
            _showHostManageGuestSheet(seat);
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  'Seat #${seat.seatNumber} occupied by ${seat.participantName ?? "Guest"}.',
                ),
                duration: const Duration(seconds: 2),
              ),
            );
          }
        } else {
          // Seat is Available
          if (_manager.isHost) {
            _showHostInviteSheet(seat.seatNumber);
          } else {
            _showRequestSeatSheet(seat.seatNumber);
          }
        }
      },
      child: Container(
        decoration: BoxDecoration(
          color: PopoTheme.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isMySeat
                ? PopoTheme.gold
                : isOccupied
                ? PopoTheme.cyan.withOpacity(0.5)
                : PopoTheme.borderSubtle,
            width: isMySeat ? 1.5 : (isOccupied ? 1.2 : 0.8),
          ),
        ),
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            // Seat Avatar or Empty Armchair
            Stack(
              alignment: Alignment.bottomRight,
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isOccupied
                        ? const Color(0xFF28283E)
                        : const Color(0xFF1E1E2B),
                    border: Border.all(
                      color: isMySeat
                          ? PopoTheme.gold
                          : (isOccupied
                                ? PopoTheme.cyan
                                : PopoTheme.borderSubtle),
                      width: 1.2,
                    ),
                  ),
                  child: Icon(
                    isOccupied ? Icons.person_rounded : Icons.weekend_outlined,
                    color: isOccupied
                        ? Colors.white70
                        : PopoTheme.textSecondary.withOpacity(0.6),
                    size: isOccupied ? 22 : 18,
                  ),
                ),

                // Mic icon if occupied
                if (isOccupied)
                  Container(
                    padding: const EdgeInsets.all(2.5),
                    decoration: BoxDecoration(
                      color: seat.isHostMuted
                          ? PopoTheme.primary
                          : (seat.isMuted
                                ? PopoTheme.primary
                                : const Color(0xFF00E676)),
                      shape: BoxShape.circle,
                      border: Border.all(color: PopoTheme.surface, width: 1.5),
                    ),
                    child: Icon(
                      seat.isHostMuted
                          ? Icons.mic_off_rounded
                          : (seat.isMuted
                                ? Icons.mic_off_rounded
                                : Icons.mic_rounded),
                      color: Colors.white,
                      size: 8,
                    ),
                  ),
              ],
            ),

            // Participant Nickname or Available Label
            Text(
              isMySeat
                  ? 'You'
                  : isOccupied
                  ? (seat.participantName ?? 'Guest')
                  : 'Take Seat',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: isMySeat
                    ? PopoTheme.gold
                    : (isOccupied ? Colors.white : PopoTheme.textSecondary),
                fontSize: 9.5,
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
                  fontSize: 7.5,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLiveChatSection() {
    final messages = _manager.chatMessages;

    return Container(
      decoration: BoxDecoration(
        color: PopoTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: PopoTheme.borderSubtle),
      ),
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: const [
                  Icon(
                    Icons.chat_bubble_outline_rounded,
                    color: PopoTheme.cyan,
                    size: 16,
                  ),
                  SizedBox(width: 6),
                  Text(
                    'Party Chat',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              Text(
                '${messages.length} msgs',
                style: const TextStyle(
                  color: PopoTheme.textSecondary,
                  fontSize: 11,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Message Stream
          Container(
            height: 120,
            decoration: BoxDecoration(
              color: const Color(0xFF14141E),
              borderRadius: BorderRadius.circular(10),
            ),
            child: messages.isEmpty
                ? const Center(
                    child: Text(
                      'Welcome to the party! Say hello...',
                      style: TextStyle(
                        color: PopoTheme.textSecondary,
                        fontSize: 11,
                      ),
                    ),
                  )
                : ListView.builder(
                    controller: _chatScrollController,
                    padding: const EdgeInsets.all(8),
                    itemCount: messages.length,
                    itemBuilder: (context, index) {
                      final msg = messages[index];
                      final isHost = msg.isHost;
                      final isSpeaker = msg.isSpeaker;

                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 2.5),
                        child: RichText(
                          text: TextSpan(
                            children: [
                              if (isHost)
                                const WidgetSpan(
                                  alignment: PlaceholderAlignment.middle,
                                  child: Padding(
                                    padding: EdgeInsets.only(right: 4),
                                    child: Icon(
                                      Icons.military_tech_rounded,
                                      color: PopoTheme.gold,
                                      size: 12,
                                    ),
                                  ),
                                )
                              else if (isSpeaker)
                                const WidgetSpan(
                                  alignment: PlaceholderAlignment.middle,
                                  child: Padding(
                                    padding: EdgeInsets.only(right: 4),
                                    child: Icon(
                                      Icons.mic_rounded,
                                      color: Color(0xFF00E676),
                                      size: 11,
                                    ),
                                  ),
                                ),
                              TextSpan(
                                text: '${msg.senderName}: ',
                                style: TextStyle(
                                  color: isHost
                                      ? PopoTheme.gold
                                      : isSpeaker
                                      ? PopoTheme.cyan
                                      : const Color(0xFFB0B0C4),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 11.5,
                                ),
                              ),
                              TextSpan(
                                text: msg.messageText,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 11.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
          const SizedBox(height: 8),

          // Chat Input Row
          Row(
            children: [
              Expanded(
                child: Container(
                  height: 36,
                  decoration: BoxDecoration(
                    color: const Color(0xFF1F1F2C),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: PopoTheme.borderSubtle),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: TextField(
                    controller: _chatController,
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                    decoration: const InputDecoration(
                      hintText: 'Send a message...',
                      hintStyle: TextStyle(
                        color: PopoTheme.textSecondary,
                        fontSize: 12,
                      ),
                      border: InputBorder.none,
                      isDense: true,
                      contentPadding: EdgeInsets.symmetric(vertical: 8),
                    ),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                icon: const Icon(
                  Icons.send_rounded,
                  color: PopoTheme.primary,
                  size: 20,
                ),
                onPressed: _sendMessage,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBottomBar() {
    final isSeated = _manager.isSeated;
    final isMuted = _manager.isMuted;
    final isHostMuted = _manager.isHostMuted;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: PopoTheme.surface,
        border: const Border(
          top: BorderSide(color: PopoTheme.borderSubtle, width: 1),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Audio & Agora RTC Ready Indicator
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: Color(0xFF00E676),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 6),
              Text(
                isSeated
                    ? 'Seat #${_manager.currentSeatNumber} · Live Audio'
                    : 'Audience · Agora Ready',
                style: const TextStyle(
                  color: PopoTheme.textSecondary,
                  fontSize: 11,
                ),
              ),
            ],
          ),

          // Seated Controls or Leave Room
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (isSeated) ...[
                // Mic Toggle
                IconButton(
                  tooltip: isHostMuted
                      ? 'Microphone Muted by Host'
                      : (isMuted ? 'Unmute Mic' : 'Mute Mic'),
                  icon: Container(
                    padding: const EdgeInsets.all(7),
                    decoration: BoxDecoration(
                      color: isHostMuted
                          ? Colors.grey.withOpacity(0.3)
                          : (isMuted
                                ? PopoTheme.primary
                                : const Color(0xFF00E676)),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      isHostMuted || isMuted
                          ? Icons.mic_off_rounded
                          : Icons.mic_rounded,
                      color: isHostMuted ? Colors.white60 : Colors.white,
                      size: 16,
                    ),
                  ),
                  onPressed: isHostMuted
                      ? () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Microphone is muted by the Host.'),
                            ),
                          );
                        }
                      : () => _manager.toggleMic(),
                ),
                const SizedBox(width: 6),
              ],

              // Leave Room Button
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: PopoTheme.primary, width: 1),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                ),
                icon: const Icon(
                  Icons.exit_to_app_rounded,
                  color: PopoTheme.primary,
                  size: 15,
                ),
                label: Text(
                  Strings.get(context, 'leave_party'),
                  style: const TextStyle(
                    color: PopoTheme.primary,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                onPressed: _confirmLeaveRoom,
              ),
            ],
          ),
        ],
      ),
    );
  }
}
