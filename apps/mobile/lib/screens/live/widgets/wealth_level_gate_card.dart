import 'package:flutter/material.dart';

import '../../../theme/popo_theme.dart';
import '../../../models/live/live_models.dart';

/// Visual Card displaying the mandatory Wealth Level 5 Go-Live Requirement
class WealthLevelGateCard extends StatelessWidget {
  final WealthLevelGate gate;

  const WealthLevelGateCard({Key? key, required this.gate}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isPassed = gate.passed;
    final progress = (gate.current / gate.required).clamp(0.0, 1.0);

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: PopoTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isPassed
              ? PopoTheme.gold.withOpacity(0.6)
              : PopoTheme.primary.withOpacity(0.4),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: isPassed
                ? PopoTheme.gold.withOpacity(0.12)
                : PopoTheme.primary.withOpacity(0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  gradient: isPassed
                      ? const LinearGradient(
                          colors: [Color(0xFFFFB800), Color(0xFFFF8800)],
                        )
                      : const LinearGradient(
                          colors: [Color(0xFF2A2A3C), Color(0xFF1F1F2E)],
                        ),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isPassed
                      ? Icons.verified_rounded
                      : Icons.workspace_premium_rounded,
                  color: isPassed ? Colors.black : PopoTheme.gold,
                  size: 24,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Text(
                          'Wealth Level Gate',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: isPassed
                                ? PopoTheme.gold.withOpacity(0.2)
                                : PopoTheme.primary.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: isPassed
                                  ? PopoTheme.gold
                                  : PopoTheme.primary,
                              width: 0.8,
                            ),
                          ),
                          child: Text(
                            isPassed ? 'PASSED' : 'REQUIRED',
                            style: TextStyle(
                              color: isPassed
                                  ? PopoTheme.gold
                                  : PopoTheme.primary,
                              fontSize: 11,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Minimum Level ${gate.required} is required to broadcast live',
                      style: const TextStyle(
                        color: PopoTheme.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 8,
              backgroundColor: const Color(0xFF2A2A3C),
              valueColor: AlwaysStoppedAnimation<Color>(
                isPassed ? PopoTheme.gold : PopoTheme.primary,
              ),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Current: Level ${gate.current}',
                style: TextStyle(
                  color: isPassed ? PopoTheme.gold : PopoTheme.textPrimary,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                'Required: Level ${gate.required}',
                style: const TextStyle(
                  color: PopoTheme.textSecondary,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          if (!isPassed) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFF1E1E2D),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: const [
                  Icon(
                    Icons.info_outline_rounded,
                    color: PopoTheme.cyan,
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Earn diamonds or send gifts to reach Wealth Level 5 and unlock your Solo Live studio.',
                      style: TextStyle(
                        color: PopoTheme.textSecondary,
                        fontSize: 12,
                        height: 1.3,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
