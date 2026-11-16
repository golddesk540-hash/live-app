import 'dart:async';
import 'package:flutter/material.dart';
import '../../../models/pk/pk_models.dart';
import '../../../services/pk/pk_session_manager.dart';

/// Real-Time PK Gift Floating Animation Overlay
/// Displays high-fidelity visual banners of incoming gifts for Host A / Host B
/// Non-blocking, transparent, positioned over video without interrupting Agora playback
class PkGiftAnimationOverlay extends StatefulWidget {
  const PkGiftAnimationOverlay({Key? key}) : super(key: key);

  @override
  State<PkGiftAnimationOverlay> createState() => _PkGiftAnimationOverlayState();
}

class _PkGiftAnimationOverlayState extends State<PkGiftAnimationOverlay>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;
  late Animation<double> _scaleAnimation;

  StreamSubscription<PkGiftAnimationEvent>? _sub;
  PkGiftAnimationEvent? _currentEvent;
  Timer? _dismissTimer;

  @override
  void initState() {
    super.initState();

    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 350),
    );

    _fadeAnimation = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeOut,
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0.0, 0.4),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _animController,
      curve: Curves.easeOutBack,
    ));

    _scaleAnimation = Tween<double>(begin: 0.85, end: 1.0).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeOutBack),
    );

    // Listen to gift stream from PkSessionManager
    _sub = PkSessionManager.instance.giftAnimationStream.listen(_onGiftReceived);
  }

  void _onGiftReceived(PkGiftAnimationEvent event) {
    if (!mounted) return;

    _dismissTimer?.cancel();
    setState(() {
      _currentEvent = event;
    });

    _animController.forward(from: 0.0);

    // Auto-dismiss after 2.5 seconds
    _dismissTimer = Timer(const Duration(milliseconds: 2500), () {
      if (mounted) {
        _animController.reverse().then((_) {
          if (mounted) {
            setState(() => _currentEvent = null);
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _dismissTimer?.cancel();
    _sub?.cancel();
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_currentEvent == null) return const SizedBox.shrink();

    final event = _currentEvent!;
    final isHostA = event.targetSide == 'host_a';
    final accentColor = isHostA ? const Color(0xFFFF1768) : const Color(0xFF00E5FF);
    final sideLabel = isHostA ? 'HOST A' : 'HOST B';

    return IgnorePointer(
      child: Align(
        alignment: isHostA ? const Alignment(-0.6, 0.2) : const Alignment(0.6, 0.2),
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: SlideTransition(
            position: _slideAnimation,
            child: ScaleTransition(
              scale: _scaleAnimation,
              child: Container(
                constraints: const BoxFormatConstraint(maxWidth: 260),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      const Color(0xFF161622).withOpacity(0.92),
                      accentColor.withOpacity(0.35),
                    ],
                    begin: isHostA ? Alignment.centerLeft : Alignment.centerRight,
                    end: isHostA ? Alignment.centerRight : Alignment.centerLeft,
                  ),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: accentColor.withOpacity(0.8),
                    width: 1.5,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: accentColor.withOpacity(0.4),
                      blurRadius: 18,
                      spreadRadius: 2,
                    ),
                    const BoxShadow(
                      color: Colors.black54,
                      blurRadius: 10,
                      offset: Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Gift Avatar / Graphic
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: accentColor.withOpacity(0.2),
                        border: Border.all(color: accentColor, width: 1.5),
                      ),
                      child: Center(
                        child: event.imageUrl != null && event.imageUrl!.isNotEmpty
                            ? Image.network(
                                event.imageUrl!,
                                width: 32,
                                height: 32,
                                errorBuilder: (_, __, ___) => _buildFallbackIcon(event.giftName),
                              )
                            : _buildFallbackIcon(event.giftName),
                      ),
                    ),
                    const SizedBox(width: 10),

                    // Sender & Gift info
                    Flexible(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                decoration: BoxDecoration(
                                  color: accentColor,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  sideLabel,
                                  style: TextStyle(
                                    color: isHostA ? Colors.white : Colors.black,
                                    fontSize: 9,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 6),
                              Flexible(
                                child: Text(
                                  event.senderName,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 3),
                          Text(
                            'Sent ${event.giftName} ${event.quantity > 1 ? "x${event.quantity}" : ""}',
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 11,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '+${event.pointsAwarded} PK Points',
                            style: TextStyle(
                              color: accentColor,
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFallbackIcon(String giftName) {
    if (giftName.contains('Crown')) {
      return const Icon(Icons.workspace_premium, color: Color(0xFFFFB800), size: 24);
    } else if (giftName.contains('Rocket')) {
      return const Icon(Icons.rocket_launch, color: Color(0xFF00E5FF), size: 24);
    } else if (giftName.contains('Rose')) {
      return const Icon(Icons.favorite, color: Color(0xFFFF1768), size: 24);
    }
    return const Icon(Icons.card_giftcard, color: Color(0xFFFFB800), size: 24);
  }
}

class BoxFormatConstraint extends BoxConstraints {
  const BoxFormatConstraint({double maxWidth = 260})
      : super(minWidth: 0, maxWidth: maxWidth, minHeight: 0, maxHeight: 100);
}
