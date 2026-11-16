import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../models/pk/pk_models.dart';
import 'pk_service.dart';

/// PK Session State Machine Enum
enum PkState {
  idle,
  discovering,
  inviting,
  invitationSent,
  invitationReceived,
  accepted,
  rejected,
  expired,
  cancelled,
  preparing,
  active,
}

/// Centralized PK Battle Session Manager
/// Coordinates 1v1 PK battle lifecycle, invitations, polling, and preparation
class PkSessionManager extends ChangeNotifier {
  final PkService _service;

  PkSessionManager({PkService? service}) : _service = service ?? PkService.instance;

  static final PkSessionManager instance = PkSessionManager();

  // State Variables
  PkState _state = PkState.idle;
  PkState get state => _state;

  List<PkHost> _eligibleHosts = [];
  List<PkHost> get eligibleHosts => _eligibleHosts;

  bool _isLoadingHosts = false;
  bool get isLoadingHosts => _isLoadingHosts;

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  // Active Outgoing Invitation
  PkInvitation? _outgoingInvitation;
  PkInvitation? get outgoingInvitation => _outgoingInvitation;

  // Active Incoming Invitation (for Host B)
  PkInvitation? _incomingInvitation;
  PkInvitation? get incomingInvitation => _incomingInvitation;
  PkInvitation? get receivedInvitation => _incomingInvitation;

  // Confirmed Battle
  PkBattle? _currentBattle;
  PkBattle? get currentBattle => _currentBattle;

  // Timers
  Timer? _outgoingPollTimer;
  Timer? _incomingCheckTimer;
  Timer? _countdownTimer;
  int _secondsRemaining = 30;
  int get secondsRemaining => _secondsRemaining;

  // 5-second battle preparation countdown
  int _prepSecondsRemaining = 5;
  int get prepSecondsRemaining => _prepSecondsRemaining;
  Timer? _prepTimer;

  // Current Host Context
  String? _currentHostId;
  String? _currentRoomNumber;

  /// Sets host context for session
  void setHostContext({required String hostId, required String roomNumber}) {
    _currentHostId = hostId;
    _currentRoomNumber = roomNumber;
  }

  /// 1. Load eligible live opponents (excluding current host)
  Future<void> loadEligibleHosts({String? search}) async {
    _isLoadingHosts = true;
    _errorMessage = null;
    notifyListeners();

    final res = await _service.getEligibleHosts(
      search: search,
      excludeHostId: _currentHostId,
    );

    _isLoadingHosts = false;
    if (res.isSuccess && res.data != null) {
      _eligibleHosts = res.data!;
    } else {
      _errorMessage = res.errorMessage;
    }
    notifyListeners();
  }

  /// 2. Send 1v1 PK invitation to target host
  Future<bool> sendInvitation(PkHost targetHost) async {
    if (!targetHost.isEligibleForPk) {
      _errorMessage = '${targetHost.nickname} is currently unavailable for PK.';
      notifyListeners();
      return false;
    }

    _state = PkState.inviting;
    _errorMessage = null;
    notifyListeners();

    final res = await _service.sendInvitation(
      receiverHostId: targetHost.id,
      senderHostId: _currentHostId,
      senderRoomNumber: _currentRoomNumber,
      battleType: '1v1', // Strictly 1v1
    );

    if (res.isSuccess && res.data != null) {
      _outgoingInvitation = res.data;
      _state = PkState.invitationSent;
      _secondsRemaining = res.data!.secondsRemaining > 0 ? res.data!.secondsRemaining : 30;
      _startOutgoingCountdown();
      _startPollingOutgoingStatus(_outgoingInvitation!.id);
      notifyListeners();
      return true;
    } else {
      _state = PkState.idle;
      _errorMessage = res.errorMessage ?? 'Failed to send PK invitation.';
      notifyListeners();
      return false;
    }
  }

  /// 3. Start countdown timer for invitation
  void _startOutgoingCountdown() {
    _countdownTimer?.cancel();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_secondsRemaining > 0) {
        _secondsRemaining--;
        notifyListeners();
      } else {
        timer.cancel();
        _handleInvitationExpired();
      }
    });
  }

  /// 4. Poll outgoing invitation status every 2 seconds
  void _startPollingOutgoingStatus(String invitationId) {
    _outgoingPollTimer?.cancel();
    _outgoingPollTimer = Timer.periodic(const Duration(seconds: 2), (timer) async {
      final res = await _service.getInvitationStatus(invitationId: invitationId);
      if (res.isSuccess && res.data != null) {
        final invite = res.data!['invitation'] as PkInvitation?;
        final battle = res.data!['battle'] as PkBattle?;

        if (invite != null) {
          if (invite.isAccepted && battle != null) {
            timer.cancel();
            _countdownTimer?.cancel();
            _outgoingInvitation = invite;
            _currentBattle = battle;
            _state = PkState.accepted;
            notifyListeners();
            _startBattlePreparation();
          } else if (invite.isRejected) {
            timer.cancel();
            _countdownTimer?.cancel();
            _outgoingInvitation = invite;
            _state = PkState.rejected;
            _errorMessage = invite.rejectionReason != null
                ? 'Invitation declined: ${invite.rejectionReason}'
                : 'Host declined your PK battle challenge.';
            notifyListeners();
          } else if (invite.isExpired) {
            timer.cancel();
            _countdownTimer?.cancel();
            _outgoingInvitation = invite;
            _state = PkState.expired;
            _errorMessage = 'Invitation expired with no response.';
            notifyListeners();
          }
        }
      }
    });
  }

  /// 5. Cancel active outgoing invitation
  Future<bool> cancelOutgoingInvitation() async {
    if (_outgoingInvitation == null) return false;
    final inviteId = _outgoingInvitation!.id;

    final res = await _service.cancelInvitation(
      invitationId: inviteId,
      senderHostId: _currentHostId,
    );

    _outgoingPollTimer?.cancel();
    _countdownTimer?.cancel();
    _outgoingInvitation = null;
    _state = PkState.cancelled;
    notifyListeners();

    return res.isSuccess;
  }

  /// 6. Handle local expiration
  void _handleInvitationExpired() {
    _outgoingPollTimer?.cancel();
    _state = PkState.expired;
    _errorMessage = 'PK battle invitation expired.';
    notifyListeners();
  }

  /// 7. Background listener for incoming invitations (for Host B while live)
  void startListeningForIncomingInvitations({
    required String hostId,
    required String roomNumber,
  }) {
    setHostContext(hostId: hostId, roomNumber: roomNumber);
    _incomingCheckTimer?.cancel();
    _incomingCheckTimer = Timer.periodic(const Duration(seconds: 3), (_) async {
      // Only check if not currently in a battle or sending an invite
      if (_state == PkState.idle) {
        final res = await _service.getInvitationStatus(
          hostId: hostId,
          roomNumber: roomNumber,
        );
        if (res.isSuccess && res.data != null) {
          final hasActive = res.data!['hasActiveInvitation'] == true;
          final invite = res.data!['invitation'] as PkInvitation?;
          if (hasActive && invite != null && invite.isPending) {
            // Received incoming invitation!
            _incomingInvitation = invite;
            _state = PkState.invitationReceived;
            _secondsRemaining = invite.secondsRemaining > 0 ? invite.secondsRemaining : 30;
            _startIncomingCountdown();
            notifyListeners();
          }
        }
      }
    });
  }

  /// Stop background polling for incoming invitations
  void stopListeningForIncomingInvitations() {
    _incomingCheckTimer?.cancel();
  }

  void _startIncomingCountdown() {
    _countdownTimer?.cancel();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_secondsRemaining > 0) {
        _secondsRemaining--;
        notifyListeners();
      } else {
        timer.cancel();
        dismissIncomingInvitation();
      }
    });
  }

  /// 8. Respond to incoming invitation (accept)
  Future<bool> acceptIncomingInvitation() async {
    if (_incomingInvitation == null) return false;
    final inviteId = _incomingInvitation!.id;

    final res = await _service.respondToInvitation(
      invitationId: inviteId,
      action: 'accept',
      receiverHostId: _currentHostId,
    );

    _countdownTimer?.cancel();

    if (res.isSuccess && res.data != null) {
      _currentBattle = res.data!;
      _state = PkState.accepted;
      _incomingInvitation = null;
      notifyListeners();
      _startBattlePreparation();
      return true;
    } else {
      _errorMessage = res.errorMessage ?? 'Failed to accept invitation.';
      notifyListeners();
      return false;
    }
  }

  /// 9. Respond to incoming invitation (reject)
  Future<bool> rejectIncomingInvitation([String? reason]) async {
    if (_incomingInvitation == null) return false;
    final inviteId = _incomingInvitation!.id;

    final res = await _service.respondToInvitation(
      invitationId: inviteId,
      action: 'reject',
      receiverHostId: _currentHostId,
      reason: reason ?? 'Host is not accepting battles at this time.',
    );

    _countdownTimer?.cancel();
    _incomingInvitation = null;
    _state = PkState.idle;
    notifyListeners();

    return res.isSuccess;
  }

  /// Dismiss incoming invitation dialog without explicit rejection
  void dismissIncomingInvitation() {
    _countdownTimer?.cancel();
    _incomingInvitation = null;
    _state = PkState.idle;
    notifyListeners();
  }

  /// 10. Start 5-second battle preparation countdown
  void _startBattlePreparation() {
    _state = PkState.preparing;
    _prepSecondsRemaining = 5;
    notifyListeners();

    _prepTimer?.cancel();
    _prepTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_prepSecondsRemaining > 1) {
        _prepSecondsRemaining--;
        notifyListeners();
      } else {
        timer.cancel();
        _state = PkState.active;
        notifyListeners();
      }
    });
  }

  /// Reset PK state back to idle
  void reset() {
    _outgoingPollTimer?.cancel();
    _incomingCheckTimer?.cancel();
    _countdownTimer?.cancel();
    _prepTimer?.cancel();

    _state = PkState.idle;
    _outgoingInvitation = null;
    _incomingInvitation = null;
    _currentBattle = null;
    _errorMessage = null;
    _secondsRemaining = 30;
    _prepSecondsRemaining = 5;
    notifyListeners();
  }

  @override
  void dispose() {
    _outgoingPollTimer?.cancel();
    _incomingCheckTimer?.cancel();
    _countdownTimer?.cancel();
    _prepTimer?.cancel();
    super.dispose();
  }
}
