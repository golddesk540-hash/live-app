import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../models/pk/pk_models.dart';
import '../live/agora_rtc_service.dart';
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

  // Real-Time Score & Timer State (Server-authoritative)
  PkScoreTimerState? _scoreTimerState;
  PkScoreTimerState? get scoreTimerState => _scoreTimerState;

  // Final Battle Result & Winner Declaration
  PkBattleResult? _battleResult;
  PkBattleResult? get battleResult => _battleResult;

  // Active Battle Synchronization
  StreamSubscription? _sseSubscription;
  Timer? _scoreTimerPollTimer;
  bool _isSyncing = false;
  bool get isSyncing => _isSyncing;

  bool _isReconnecting = false;
  bool get isReconnecting => _isReconnecting;

  bool _isOpponentReconnecting = false;
  bool get isOpponentReconnecting => _isOpponentReconnecting;

  int get scoreA => _scoreTimerState?.hostA.score ?? 0;
  int get scoreB => _scoreTimerState?.hostB.score ?? 0;
  double get ratioA => _scoreTimerState?.ratioA ?? 50.0;
  double get ratioB => _scoreTimerState?.ratioB ?? 50.0;
  int get battleRemainingSeconds =>
      _scoreTimerState?.timer.remainingSeconds ?? 300;
  String get battleFormattedTime =>
      _scoreTimerState?.timer.formattedTime ?? '05:00';
  String get timerStatus => _scoreTimerState?.timer.status ?? 'normal';
  String get leadingSide => _scoreTimerState?.leadingSide ?? 'tie';
  bool get isBattleActive =>
      _state == PkState.active && _currentBattle != null;

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
        _startActiveBattleSync();
      }
    });
  }

  /// 11. Orchestrate real-time battle synchronization and Agora subscriptions
  Future<void> _startActiveBattleSync() async {
    if (_currentBattle == null) return;
    final battleId = _currentBattle!.id;

    // 1. Subscribe to remote opponent's video and audio stream
    final opponent = _currentBattle!.getOpponent(_currentHostId ?? '');
    await AgoraRtcService.instance.subscribeToRemoteHost(
      opponentRoomNumber: opponent.roomNumber,
      opponentHostId: opponent.id,
    );

    // 2. Fetch authoritative initial state from backend
    await syncScoreTimer(battleId);

    // 3. Connect real-time Server-Sent Events (SSE) stream
    _startSseListener(battleId);

    // 4. Start periodic REST polling (3s) as resilient backup
    _startScoreTimerPoll(battleId);
  }

  /// Synchronize authoritative score and timer state via REST
  Future<void> syncScoreTimer(String battleId) async {
    _isSyncing = true;
    final res = await _service.getScoreTimer(battleId);
    _isSyncing = false;

    if (res.isSuccess && res.data != null) {
      _scoreTimerState = res.data;
      _isReconnecting = false;
      _isOpponentReconnecting = false;

      // Check if time expired officially
      if (_scoreTimerState!.timer.isExpired && _state == PkState.active) {
        _handleBattleEnded();
      }
      notifyListeners();
    } else {
      _errorMessage = res.errorMessage;
    }
  }

  /// Real-time Server-Sent Events (SSE) listener
  void _startSseListener(String battleId) {
    _sseSubscription?.cancel();
    _sseSubscription = _service.listenToBattleEvents(battleId).listen(
      (eventData) {
        final eventType = eventData['event']?.toString() ?? '';
        final data = eventData['data'];

        if (eventType == 'pk:timer_sync' && data is Map) {
          if (_scoreTimerState != null) {
            final remaining = (data['remainingSeconds'] as num?)?.toInt() ??
                _scoreTimerState!.timer.remainingSeconds;
            final formatted = data['formattedTime']?.toString() ??
                _scoreTimerState!.timer.formattedTime;
            final status = data['status']?.toString() ??
                _scoreTimerState!.timer.status;

            _scoreTimerState = PkScoreTimerState(
              battleId: _scoreTimerState!.battleId,
              battleType: _scoreTimerState!.battleType,
              status: status == 'time_expired'
                  ? 'time_expired'
                  : _scoreTimerState!.status,
              hostA: _scoreTimerState!.hostA,
              hostB: _scoreTimerState!.hostB,
              timer: PkBattleTimer(
                durationSeconds: _scoreTimerState!.timer.durationSeconds,
                remainingSeconds: remaining,
                elapsedSeconds:
                    _scoreTimerState!.timer.durationSeconds - remaining,
                formattedTime: formatted,
                status: status,
                serverTime: data['serverTime'] != null
                    ? DateTime.tryParse(data['serverTime'].toString())
                    : null,
                startedAt: _scoreTimerState!.timer.startedAt,
                expiresAt: _scoreTimerState!.timer.expiresAt,
              ),
              leadingSide: _scoreTimerState!.leadingSide,
              leadingHostId: _scoreTimerState!.leadingHostId,
              ratioA: _scoreTimerState!.ratioA,
              ratioB: _scoreTimerState!.ratioB,
              recentEvents: _scoreTimerState!.recentEvents,
            );
            notifyListeners();
          }
        } else if (eventType == 'pk:score_updated' && data is Map) {
          if (_scoreTimerState != null) {
            final scoreA = (data['scoreA'] as num?)?.toInt() ??
                _scoreTimerState!.hostA.score;
            final scoreB = (data['scoreB'] as num?)?.toInt() ??
                _scoreTimerState!.hostB.score;
            final ratioA = (data['ratioA'] as num?)?.toDouble() ??
                _scoreTimerState!.ratioA;
            final ratioB = (data['ratioB'] as num?)?.toDouble() ??
                _scoreTimerState!.ratioB;
            String leading = 'tie';
            if (scoreA > scoreB) {
              leading = 'host_a';
            } else if (scoreB > scoreA) {
              leading = 'host_b';
            }

            final rawEvent = data['event'];
            PkScoreEvent? newEvent;
            if (rawEvent is Map) {
              newEvent = PkScoreEvent.fromJson(
                rawEvent as Map<String, dynamic>,
              );
            }

            final updatedEvents =
                List<PkScoreEvent>.from(_scoreTimerState!.recentEvents);
            if (newEvent != null) {
              updatedEvents.insert(0, newEvent);
              if (updatedEvents.length > 20) {
                updatedEvents.removeLast();
              }
            }

            _scoreTimerState = PkScoreTimerState(
              battleId: _scoreTimerState!.battleId,
              battleType: _scoreTimerState!.battleType,
              status: _scoreTimerState!.status,
              hostA: _scoreTimerState!.hostA.copyWith(score: scoreA),
              hostB: _scoreTimerState!.hostB.copyWith(score: scoreB),
              timer: _scoreTimerState!.timer,
              leadingSide: leading,
              leadingHostId: leading == 'host_a'
                  ? _scoreTimerState!.hostA.id
                  : leading == 'host_b'
                      ? _scoreTimerState!.hostB.id
                      : null,
              ratioA: ratioA,
              ratioB: ratioB,
              recentEvents: updatedEvents,
            );
            notifyListeners();
          }
        } else if (eventType == 'pk:timer_warning') {
          notifyListeners();
        } else if (eventType == 'pk:battle_time_expired' ||
            eventType == 'pk:battle_ended') {
          _handleBattleEnded();
        } else if (eventType == 'pk:result_calculated' && data is Map) {
          _battleResult = PkBattleResult.fromJson(
            data as Map<String, dynamic>,
          );
          notifyListeners();
        }
      },
      onError: (_) {
        _isReconnecting = true;
        notifyListeners();
      },
    );
  }

  /// Periodic REST polling fallback
  void _startScoreTimerPoll(String battleId) {
    _scoreTimerPollTimer?.cancel();
    _scoreTimerPollTimer = Timer.periodic(const Duration(seconds: 3), (_) {
      if (_state == PkState.active) {
        syncScoreTimer(battleId);
      }
    });
  }

  /// 12. Finalize battle upon time expiration
  Future<void> _handleBattleEnded() async {
    if (_currentBattle == null) return;
    _scoreTimerPollTimer?.cancel();

    final res = await _service.finalizeBattle(
      battleId: _currentBattle!.id,
      action: 'end_battle',
      reason: 'timer_expired',
    );
    if (res.isSuccess && res.data != null) {
      _battleResult = res.data;
    } else {
      final res2 = await _service.getBattleResult(_currentBattle!.id);
      if (res2.isSuccess && res2.data != null) {
        _battleResult = res2.data;
      }
    }
    notifyListeners();
  }

  /// 13. Send validated score points (gift / diamond delta)
  Future<bool> sendScorePoints({
    required int points,
    String giftName = 'Diamond Star',
  }) async {
    if (_currentBattle == null || _scoreTimerState == null) return false;
    final battleId = _currentBattle!.id;
    final isHostA = _currentBattle!.isHostA(_currentHostId ?? '');
    final hostSide = isHostA ? 'host_a' : 'host_b';
    final targetHostId = isHostA
        ? _currentBattle!.hostA.id
        : _currentBattle!.hostB.id;

    final idempotencyKey =
        'pk_${battleId}_${DateTime.now().millisecondsSinceEpoch}_${points}';

    final res = await _service.sendScorePoint(
      battleId: battleId,
      hostSide: hostSide,
      targetHostId: targetHostId,
      senderId: _currentHostId ?? 'current_user',
      senderName: isHostA
          ? _currentBattle!.hostA.nickname
          : _currentBattle!.hostB.nickname,
      points: points,
      giftName: giftName,
      idempotencyKey: idempotencyKey,
    );

    if (res.isSuccess) {
      // Trigger instant score sync
      await syncScoreTimer(battleId);
      return true;
    }
    return false;
  }

  /// 14. Voluntary surrender of active battle
  Future<bool> surrenderBattle({String? reason}) async {
    if (_currentBattle == null) return false;
    final battleId = _currentBattle!.id;

    final res = await _service.finalizeBattle(
      battleId: battleId,
      action: 'end_battle',
      reason: reason ?? 'surrender',
    );

    if (res.isSuccess && res.data != null) {
      _battleResult = res.data;
      await cleanupBattle();
      return true;
    }
    return false;
  }

  /// 15. Voluntary exit / cancel of active battle
  Future<bool> voluntaryExitBattle() async {
    if (_currentBattle == null) return false;
    final battleId = _currentBattle!.id;

    final res = await _service.finalizeBattle(
      battleId: battleId,
      action: 'end_battle',
      reason: 'voluntary_exit',
    );

    if (res.isSuccess && res.data != null) {
      _battleResult = res.data;
      await cleanupBattle();
      return true;
    }
    return false;
  }

  /// 16. Disconnection state recovery
  Future<void> recoverBattleState(String battleId) async {
    _isReconnecting = true;
    notifyListeners();

    await syncScoreTimer(battleId);
    _startSseListener(battleId);
    _startScoreTimerPoll(battleId);

    _isReconnecting = false;
    notifyListeners();
  }

  /// 17. Safe teardown of active battle resources
  Future<void> cleanupBattle() async {
    _sseSubscription?.cancel();
    _scoreTimerPollTimer?.cancel();
    _prepTimer?.cancel();
    await AgoraRtcService.instance.unsubscribeRemoteHost();
    _state = PkState.idle;
    _currentBattle = null;
    _scoreTimerState = null;
    notifyListeners();
  }

  /// Reset PK state back to idle
  void reset() {
    _outgoingPollTimer?.cancel();
    _incomingCheckTimer?.cancel();
    _countdownTimer?.cancel();
    _prepTimer?.cancel();
    _sseSubscription?.cancel();
    _scoreTimerPollTimer?.cancel();

    _state = PkState.idle;
    _outgoingInvitation = null;
    _incomingInvitation = null;
    _currentBattle = null;
    _scoreTimerState = null;
    _battleResult = null;
    _errorMessage = null;
    _secondsRemaining = 30;
    _prepSecondsRemaining = 5;
    _isSyncing = false;
    _isReconnecting = false;
    _isOpponentReconnecting = false;
    notifyListeners();
  }

  @override
  void dispose() {
    _outgoingPollTimer?.cancel();
    _incomingCheckTimer?.cancel();
    _countdownTimer?.cancel();
    _prepTimer?.cancel();
    _sseSubscription?.cancel();
    _scoreTimerPollTimer?.cancel();
    super.dispose();
  }
}
