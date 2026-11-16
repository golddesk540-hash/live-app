import 'dart:async';
import 'package:flutter/material.dart';
import '../../../models/gifts/gift_models.dart';
import '../../../services/gifts/gift_session_manager.dart';

/// Real-Time Floating Universal Gift Animation Banner
/// Displays high-fidelity visual cards for gifts sent in Solo Live, Party Rooms, and PK
/// Non-blocking, transparent, positioned over video without interrupting Agora playback
class GiftAnimationBanner extends StatefulWidget {
  const GiftAnimationBanner({Key? key}) : super(key: key);

  @override
  State<GiftAnimationBanner> createState() => _GiftAnimationBannerState();
}

class _GiftAnimationBannerState extends State<GiftAnimationBanner>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;
  late Animation<double> _scaleAnimation;

  StreamSubscription<UniversalGiftAnimationEvent>? _sub;
  UniversalGiftAnimationEvent? _currentEvent;
  Timer? _dismissTimer;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 350),
    );

    _fadeAnimation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOut,
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0.0, 0.4),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutBack));

    _scaleAnimation = Tween<double>(begin: 0.85, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutBack),
    );

    _sub = GiftSessionManager.instance.animationStream.listen(_onGiftAnimation);
  }

  void _onGiftAnimation(UniversalGiftAnimationEvent event) {
    if (!mounted) return;

    _dismissTimer?.cancel();
    setState(() {
      _currentEvent = event;
    });

    _controller.forward(from: 0.0);

    _dismissTimer = Timer(const Duration(milliseconds: 2500), () {
      if (mounted) {
        _controller.reverse().then((_) {
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
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_currentEvent == null) return const SizedBox.shrink();

    final event = _currentEvent!;
    const accentPink = Color(0xFFFF1768);
    const accentGold = Color(0xFFFFB800);

    return IgnorePointer(
      child: Align(
        alignment: const Alignment(-0.6, 0.3),
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: SlideTransition(
            position: _slideAnimation,
            child: ScaleTransition(
              scale: _scaleAnimation,
              child: Container(
                constraints: const BoxConstraints(maxWidth: 280),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      const Color(0xFF161622).withOpacity(0.92),
                      accentPink.withOpacity(0.35),
                    ],
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: accentPink.withOpacity(0.8),
                    width: 1.5,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: accentPink.withOpacity(0.4),
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
                    // Gift Artwork Graphic
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: accentPink.withOpacity(0.2),
                        border: Border.all(color: accentGold, width: 1.5),
                      ),
                      child: Center(
                        child: event.imageUrl != null &&
                                event.imageUrl!.isNotEmpty &&
                                !event.imageUrl!.startsWith('/assets/')
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

                    // Info text
                    Flexible(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Flexible(
                                child: Text(
                                  event.senderNickname,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                decoration: BoxDecoration(
                                  color: accentGold,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  event.quantity > 1 ? 'x${event.quantity}' : 'GIFT',
                                  style: const TextStyle(
                                    color: Colors.black,
                                    fontSize: 9,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 3),
                          Text(
                            'Sent ${event.giftName} to ${event.recipientNickname}',
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 11,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Row(
                            children: [
                              const Text('🪙 ', style: TextStyle(fontSize: 10)),
                              Text(
                                '${event.totalCoins} Coins',
                                style: const TextStyle(
                                  color: accentGold,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Text(
                                '(+${event.hostPointsCredited} Pts · 70%)',
                                style: const TextStyle(
                                  color: Color(0xFF00E5FF),
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
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
    final lower = giftName.toLowerCase();
    if (lower.contains('crown')) {
      return const Icon(Icons.workspace_premium, color: Color(0xFFFFB800), size: 24);
    } else if (lower.contains('rocket') || lower.contains('car')) {
      return const Icon(Icons.rocket_launch, color: Color(0xFF00E5FF), size: 24);
    } else if (lower.contains('rose') || lower.contains('heart')) {
      return const Icon(Icons.favorite, color: Color(0xFFFF1768), size: 24);
    }
    return const Icon(Icons.card_giftcard, color: Color(0xFFFFB800), size: 24);
  }
}
