import 'package:flutter/material.dart';

import '../../design/design_fixtures.dart';
import '../../theme/popo_theme.dart';
import 'pk_invite_screen.dart';

/// Screen 1/4 of PK Battle Flow: PK Type Selection
/// Implemented for Phase 3 (D2) Prompt 4 according to Popo Live Complete Product Design v1.1.
/// Features:
/// - Displays available PK battle type: 1v1 PK Battle only
/// - STRICT REQUIREMENT: The 4-host PK option is completely unavailable, unlabeled, and unreachable.
/// - Attractive selection card with Popo Live pink theme (#FF1768)
/// - Continue button to proceed to host invitation
class PkBattleTypeScreen extends StatefulWidget {
  final FixtureLiveRoom? room;

  const PkBattleTypeScreen({
    super.key,
    this.room,
  });

  @override
  State<PkBattleTypeScreen> createState() => _PkBattleTypeScreenState();
}

class _PkBattleTypeScreenState extends State<PkBattleTypeScreen> {
  // Only 1v1 format is supported according to product specifications
  final String _selectedType = '1v1';

  void _onContinue() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => PkInviteScreen(
          currentRoom: widget.room,
          battleType: _selectedType,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final hostName = widget.room?.hostNickname ?? 'Amina Noor';
    final roomTitle = widget.room?.title ?? 'Karachi Nights 🎶 Acoustic Live Session';

    return Scaffold(
      backgroundColor: PopoTheme.background,
      appBar: AppBar(
        backgroundColor: PopoTheme.surface,
        elevation: 0,
        leading: IconButton(
          key: const Key('pk_type_back_button'),
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Select PK Type',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Host Context Header Pill
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: PopoTheme.surface,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: PopoTheme.borderSubtle),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: LinearGradient(
                          colors: [Color(0xFFFF1768), Color(0xFF00E5FF)],
                        ),
                      ),
                      child: const Center(
                        child: Text(
                          '⚔️',
                          style: TextStyle(fontSize: 18),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            hostName,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            roomTitle,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: PopoTheme.textSecondary,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              const Text(
                'AVAILABLE BATTLE FORMAT',
                style: TextStyle(
                  color: PopoTheme.textSecondary,
                  fontSize: 12,
                  letterSpacing: 0.8,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 12),

              // 1v1 PK Battle Selection Card
              GestureDetector(
                key: const Key('pk_type_1v1_card'),
                onTap: () {
                  // Only 1v1 is supported
                },
                child: Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E1428),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: PopoTheme.primary,
                      width: 2,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: PopoTheme.primary.withOpacity(0.25),
                        blurRadius: 16,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: PopoTheme.primary,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Text(
                                  '1 vs 1',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: PopoTheme.cyan.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                      color: PopoTheme.cyan.withOpacity(0.5)),
                                ),
                                child: const Text(
                                  '3 Minutes',
                                  style: TextStyle(
                                    color: PopoTheme.cyan,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          // Selected Checkmark
                          Container(
                            width: 26,
                            height: 26,
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              color: PopoTheme.primary,
                            ),
                            child: const Icon(
                              Icons.check_rounded,
                              color: Colors.white,
                              size: 16,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),

                      const Text(
                        '1v1 PK Faceoff',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Classic head-to-head broadcaster battle. Broadcasters compete across 3 intense rounds where audience gifts determine the victor.',
                        style: TextStyle(
                          color: PopoTheme.textSecondary,
                          fontSize: 13,
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Features summary
                      Row(
                        children: const [
                          Icon(Icons.flash_on_rounded,
                              color: PopoTheme.gold, size: 16),
                          SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              'Live dynamic score bar & interactive cheering',
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              const Spacer(),

              // Information Notice
              const Center(
                child: Text(
                  'Demonstration PK Arena · Standard 1v1 Battle Mode Only',
                  style: TextStyle(
                    color: PopoTheme.textSecondary,
                    fontSize: 11,
                  ),
                ),
              ),
              const SizedBox(height: 14),

              // Continue CTA
              Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  gradient: PopoTheme.primaryGradient,
                  boxShadow: [
                    BoxShadow(
                      color: PopoTheme.primary.withOpacity(0.4),
                      blurRadius: 14,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    key: const Key('pk_type_continue_button'),
                    borderRadius: BorderRadius.circular(16),
                    onTap: _onContinue,
                    child: const Padding(
                      padding: EdgeInsets.symmetric(vertical: 16),
                      child: Center(
                        child: Text(
                          'Continue to Host Invite',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }
}
