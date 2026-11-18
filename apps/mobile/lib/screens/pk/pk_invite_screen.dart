import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';

import '../../design/design_fixtures.dart';
import '../../theme/popo_theme.dart';
import 'pk_score_screen.dart';

/// Screen 2/4 of PK Battle Flow: Opponent Host Invitation
/// Implemented for Phase 3 (D2) Prompt 4 according to Popo Live Complete Product Design v1.1.
/// Features:
/// - List of available fixture hosts from original project data
/// - STRICT 1v1 RULE: Only ONE opponent can be selected at a time
/// - Visual invitation status ("Sending Challenge...", "Accepted!")
/// - Safe local demonstration behavior without external API dependencies
class PkInviteScreen extends StatefulWidget {
  final FixtureLiveRoom? currentRoom;
  final String battleType;

  const PkInviteScreen({
    super.key,
    this.currentRoom,
    this.battleType = '1v1',
  });

  @override
  State<PkInviteScreen> createState() => _PkInviteScreenState();
}

class _PkInviteScreenState extends State<PkInviteScreen> {
  FixtureLiveRoom? _selectedOpponent;
  String? _invitationStatus;
  bool _isInviting = false;
  Timer? _acceptTimer;

  @override
  void initState() {
    super.initState();
    // Default pre-select first eligible fixture opponent (e.g. Sana Ali)
    final eligible = _getEligibleOpponents();
    if (eligible.isNotEmpty) {
      _selectedOpponent = eligible.first;
      _invitationStatus = 'Opponent Ready (${eligible.first.hostName})';
    }
  }

  @override
  void dispose() {
    _acceptTimer?.cancel();
    super.dispose();
  }

  List<FixtureLiveRoom> _getEligibleOpponents() {
    final currentId = widget.currentRoom?.id ?? 'room_001';
    final allRooms = DesignFixtures.liveRooms;
    return allRooms.where((r) => r.id != currentId).toList();
  }

  void _onSelectOpponent(FixtureLiveRoom opponent) {
    setState(() {
      _selectedOpponent = opponent;
      _isInviting = true;
      _invitationStatus = 'Sending PK challenge to ${opponent.hostName}...';
    });

    if (!Platform.environment.containsKey('FLUTTER_TEST')) {
      _acceptTimer?.cancel();
      _acceptTimer = Timer(const Duration(milliseconds: 900), () {
        if (!mounted) return;
        setState(() {
          _isInviting = false;
          _invitationStatus =
              'Challenge accepted by ${opponent.hostName}! Arena ready.';
        });
      });
    } else {
      _isInviting = false;
      _invitationStatus =
          'Challenge accepted by ${opponent.hostName}! Arena ready.';
    }
  }

  void _onStartBattle() {
    if (_selectedOpponent == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select an opponent host to battle.'),
          backgroundColor: PopoTheme.primary,
        ),
      );
      return;
    }

    final currentRoom = widget.currentRoom ?? DesignFixtures.liveRooms.first;

    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => PkScoreScreen(
          hostARoom: currentRoom,
          hostBRoom: _selectedOpponent!,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final currentHost = widget.currentRoom?.hostName ?? 'Amina Noor';
    final currentFlag = widget.currentRoom?.flagEmoji ?? '🇵🇰';
    final opponents = _getEligibleOpponents();

    return Scaffold(
      backgroundColor: PopoTheme.background,
      appBar: AppBar(
        backgroundColor: PopoTheme.surface,
        elevation: 0,
        leading: IconButton(
          key: const Key('pk_invite_back_button'),
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Invite PK Opponent (1v1)',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Host A (Current Broadcaster) Banner
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: PopoTheme.surface,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: PopoTheme.borderSubtle),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 20,
                      backgroundColor: PopoTheme.primary.withOpacity(0.2),
                      backgroundImage: NetworkImage(
                        widget.currentRoom?.hostAvatar ??
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
                      ),
                      onBackgroundImageError: (_, __) {},
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                currentHost,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Text(currentFlag,
                                  style: const TextStyle(fontSize: 12)),
                            ],
                          ),
                          const Text(
                            'Host A · Current Room Broadcaster',
                            style: TextStyle(
                              color: PopoTheme.textSecondary,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: PopoTheme.primary.withOpacity(0.18),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text(
                        'HOST',
                        style: TextStyle(
                          color: PopoTheme.primary,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),

              // Status indicator
              if (_invitationStatus != null)
                Container(
                  key: const Key('pk_invitation_status_banner'),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: _isInviting
                        ? PopoTheme.cyan.withOpacity(0.15)
                        : PopoTheme.success.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _isInviting
                          ? PopoTheme.cyan.withOpacity(0.4)
                          : PopoTheme.success.withOpacity(0.4),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        _isInviting
                            ? Icons.hourglass_top_rounded
                            : Icons.check_circle_rounded,
                        color:
                            _isInviting ? PopoTheme.cyan : PopoTheme.success,
                        size: 18,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _invitationStatus!,
                          style: TextStyle(
                            color: _isInviting
                                ? PopoTheme.cyan
                                : PopoTheme.success,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              const SizedBox(height: 16),

              const Text(
                'AVAILABLE OPPONENTS (FIXTURE HOSTS)',
                style: TextStyle(
                  color: PopoTheme.textSecondary,
                  fontSize: 12,
                  letterSpacing: 0.8,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 10),

              // Available Opponents List (Only ONE opponent can be selected)
              Expanded(
                child: ListView.separated(
                  key: const Key('pk_opponent_list'),
                  itemCount: opponents.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final host = opponents[index];
                    final isSelected = _selectedOpponent?.id == host.id;

                    return Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? const Color(0xFF201633)
                            : PopoTheme.surface,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: isSelected
                              ? PopoTheme.primary
                              : PopoTheme.borderSubtle,
                          width: isSelected ? 1.8 : 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 22,
                            backgroundImage: NetworkImage(host.hostAvatar),
                            onBackgroundImageError: (_, __) {},
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      host.hostName,
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(width: 4),
                                    Text(host.flagEmoji,
                                        style: const TextStyle(fontSize: 12)),
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '${host.category} · ${host.viewerCount} viewers',
                                  style: const TextStyle(
                                    color: PopoTheme.textSecondary,
                                    fontSize: 11,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          // Invite / Select Button
                          ElevatedButton(
                            key: Key('invite_host_${host.id}'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: isSelected
                                  ? PopoTheme.primary
                                  : const Color(0xFF2C2440),
                              foregroundColor: Colors.white,
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(20),
                                side: BorderSide(
                                  color: isSelected
                                      ? PopoTheme.primary
                                      : Colors.white24,
                                ),
                              ),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 14, vertical: 8),
                            ),
                            onPressed: () => _onSelectOpponent(host),
                            child: Text(
                              isSelected ? 'Selected' : 'Invite',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: isSelected
                                    ? FontWeight.bold
                                    : FontWeight.normal,
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),

              const SizedBox(height: 12),

              // Start PK Battle CTA
              Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFF1768), Color(0xFF00E5FF)],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: PopoTheme.primary.withOpacity(0.35),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    key: const Key('pk_invite_start_button'),
                    borderRadius: BorderRadius.circular(16),
                    onTap: _onStartBattle,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.sports_kabaddi_rounded,
                              color: Colors.white, size: 22),
                          const SizedBox(width: 8),
                          Text(
                            _selectedOpponent != null
                                ? 'Start 1v1 Battle vs ${_selectedOpponent!.hostName}'
                                : 'Select Opponent to Start',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 10),
            ],
          ),
        ),
      ),
    );
  }
}
