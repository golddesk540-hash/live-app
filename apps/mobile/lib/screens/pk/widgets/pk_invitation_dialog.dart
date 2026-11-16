import 'package:flutter/material.dart';
import '../../../models/pk/pk_models.dart';
import '../../../services/pk/pk_session_manager.dart';
import '../../../theme/popo_theme.dart';

/// Modal dialog presented to Host B when an incoming 1v1 PK invitation is received
class PkInvitationDialog extends StatelessWidget {
  final PkInvitation invitation;
  final VoidCallback onAccepted;
  final VoidCallback onRejected;

  const PkInvitationDialog({
    Key? key,
    required this.invitation,
    required this.onAccepted,
    required this.onRejected,
  }) : super(key: key);

  static Future<void> show({
    required BuildContext context,
    required PkInvitation invitation,
    required VoidCallback onAccepted,
    required VoidCallback onRejected,
  }) {
    return showModalBottomSheet(
      context: context,
      isDismissible: false,
      enableDrag: false,
      backgroundColor: Colors.transparent,
      builder: (_) => PkInvitationDialog(
        invitation: invitation,
        onAccepted: onAccepted,
        onRejected: onRejected,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: PkSessionManager.instance,
      builder: (context, _) {
        final secondsLeft = PkSessionManager.instance.secondsRemaining;

        return Container(
          margin: const EdgeInsets.all(16),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: PopoTheme.surface,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: PopoTheme.primary.withOpacity(0.4),
              width: 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color: PopoTheme.primary.withOpacity(0.25),
                blurRadius: 24,
                spreadRadius: 2,
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header Badge & Countdown
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      gradient: PopoTheme.primaryGradient,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.flash_on_rounded, color: Colors.white, size: 14),
                        SizedBox(width: 4),
                        Text(
                          '1v1 PK CHALLENGE',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.4),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: secondsLeft <= 10 ? PopoTheme.danger : PopoTheme.gold,
                        width: 1,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.timer_outlined,
                          color: secondsLeft <= 10 ? PopoTheme.danger : PopoTheme.gold,
                          size: 13,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '${secondsLeft}s',
                          style: TextStyle(
                            color: secondsLeft <= 10 ? PopoTheme.danger : PopoTheme.gold,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),

              // Challenging Host Details
              Row(
                children: [
                  // Avatar with neon ring
                  Container(
                    padding: const EdgeInsets.all(2.5),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: PopoTheme.primary, width: 2),
                    ),
                    child: CircleAvatar(
                      radius: 30,
                      backgroundColor: PopoTheme.surfaceLight,
                      backgroundImage: invitation.senderAvatar.isNotEmpty
                          ? NetworkImage(invitation.senderAvatar)
                          : null,
                      child: invitation.senderAvatar.isEmpty
                          ? Text(
                              invitation.senderNickname.isNotEmpty
                                  ? invitation.senderNickname[0].toUpperCase()
                                  : 'H',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                              ),
                            )
                          : null,
                    ),
                  ),
                  const SizedBox(width: 14),

                  // Nickname & Room Details
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          invitation.senderNickname,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 17,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Room #${invitation.senderRoomNumber}',
                          style: const TextStyle(
                            color: PopoTheme.textSecondary,
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: PopoTheme.cyan.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            'Challenged you to a 1v1 Battle!',
                            style: TextStyle(
                              color: PopoTheme.cyan,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 22),

              // Linear Countdown Progress Bar
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: secondsLeft / 30.0,
                  backgroundColor: Colors.white.withOpacity(0.1),
                  valueColor: AlwaysStoppedAnimation<Color>(
                    secondsLeft <= 10 ? PopoTheme.danger : PopoTheme.primary,
                  ),
                  minHeight: 4,
                ),
              ),
              const SizedBox(height: 20),

              // Action Buttons: Reject & Accept
              Row(
                children: [
                  // Reject / Decline Button
                  Expanded(
                    child: SizedBox(
                      height: 48,
                      child: OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: PopoTheme.borderSubtle, width: 1.2),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                          backgroundColor: Colors.black.withOpacity(0.3),
                        ),
                        onPressed: onRejected,
                        child: const Text(
                          'Decline',
                          style: TextStyle(
                            color: PopoTheme.textSecondary,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),

                  // Accept Button (Neon Rose Pink Gradient)
                  Expanded(
                    flex: 2,
                    child: Container(
                      height: 48,
                      decoration: BoxDecoration(
                        gradient: PopoTheme.primaryGradient,
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: [
                          BoxShadow(
                            color: PopoTheme.primary.withOpacity(0.35),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.transparent,
                          shadowColor: Colors.transparent,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        onPressed: onAccepted,
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.sports_kabaddi_rounded, color: Colors.white, size: 18),
                            SizedBox(width: 6),
                            Text(
                              'Accept Battle',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}
