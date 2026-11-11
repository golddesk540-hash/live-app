import 'package:flutter/material.dart';

/// ============================================================================
/// Popo Live — Phase 7 Module 7.4: Host Entrance Effect Banner (Android & iOS)
/// Displays Host avatar, nickname, Poppo Host ID, approved entrance tier &
/// backend-verified VIP badge without blocking Agora live video controls.
/// ============================================================================

class HostEntranceBanner extends StatelessWidget {
  final Map<String, dynamic> entrance;
  final bool reduceAnimations;
  final bool isUrdu;

  const HostEntranceBanner({
    Key? key,
    required this.entrance,
    this.reduceAnimations = false,
    this.isUrdu = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final String tier = (entrance['entranceType'] ?? 'standard').toString();
    final String nickname = (entrance['recipientNickname'] ?? 'Host').toString();
    final String poppoId = (entrance['recipientPoppoId'] ?? '8802194').toString();
    final String? vipBadge = entrance['vipBadgeLabel']?.toString();
    final String title = isUrdu
        ? (entrance['giftNameUr'] ?? entrance['giftName'] ?? 'آمد').toString()
        : (entrance['giftName'] ?? 'Host Entrance').toString();

    final List<Color> gradientColors;
    final Color borderColor;

    switch (tier) {
      case 'vip':
        gradientColors = const [Color(0xFF422006), Color(0xFF9A3412), Color(0xFF2E1065)];
        borderColor = const Color(0xFFFBBF24);
        break;
      case 'special_event':
        gradientColors = const [Color(0xFF0C4A6E), Color(0xFF701A75), Color(0xFF1E1B4B)];
        borderColor = const Color(0xFF38BDF8);
        break;
      case 'premium':
        gradientColors = const [Color(0xFF4A044E), Color(0xFF831843), Color(0xFF2E1065)];
        borderColor = const Color(0xFFF472B6);
        break;
      default:
        gradientColors = const [Color(0xFF1E1B4B), Color(0xFF4C1D95), Color(0xFF1E1B4B)];
        borderColor = const Color(0xFFA855F7);
    }

    return IgnorePointer(
      child: AnimatedContainer(
        duration: Duration(milliseconds: reduceAnimations ? 0 : 280),
        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          gradient: LinearGradient(colors: gradientColors),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: borderColor, width: 1.4),
          boxShadow: reduceAnimations
              ? []
              : [
                  BoxShadow(
                    color: borderColor.withOpacity(0.35),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ],
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 18,
              backgroundColor: const Color(0xFF120624),
              child: const Icon(Icons.person, color: Colors.white70, size: 20),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          nickname,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                            fontSize: 13,
                          ),
                        ),
                      ),
                      if (vipBadge != null && vipBadge.isNotEmpty) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFFFBBF24), Color(0xFFFDE047)],
                            ),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.workspace_premium, size: 10, color: Color(0xFF230938)),
                              const SizedBox(width: 2),
                              Text(
                                vipBadge,
                                style: const TextStyle(
                                  color: Color(0xFF230938),
                                  fontWeight: FontWeight.w900,
                                  fontSize: 9,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    isUrdu ? 'آئی ڈی: $poppoId • $title' : 'ID: $poppoId • $title',
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: Color(0xFFE9D5FF), fontSize: 11),
                  ),
                ],
              ),
            ),
            Icon(
              tier == 'vip' ? Icons.auto_awesome : Icons.star_rounded,
              color: borderColor,
              size: 20,
            ),
          ],
        ),
      ),
    );
  }
}
