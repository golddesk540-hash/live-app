import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'host_entrance_banner.dart';

/// ============================================================================
/// Popo Live — Phase 7 Module 7.4: Live Gift Animation & Queue Overlay Widget
/// Renders non-blocking tiered animations (small floating, medium, large/luxury
/// fullscreen, and PK Host A/Host B left/right placement) synced via backend.
/// ============================================================================

class AnimationOverlayWidget extends StatefulWidget {
  final String apiBaseUrl;
  final String userId;
  final String? roomId;
  final String? pkBattleId;
  final bool previewDemo;
  final Map<String, dynamic> preferences;
  final bool isUrdu;

  const AnimationOverlayWidget({
    Key? key,
    required this.apiBaseUrl,
    required this.userId,
    this.roomId,
    this.pkBattleId,
    this.previewDemo = true,
    required this.preferences,
    this.isUrdu = false,
  }) : super(key: key);

  @override
  State<AnimationOverlayWidget> createState() => _AnimationOverlayWidgetState();
}

class _AnimationOverlayWidgetState extends State<AnimationOverlayWidget> {
  Timer? _pollTimer;
  Timer? _completeTimer;
  List<Map<String, dynamic>> _activeGifts = [];
  List<Map<String, dynamic>> _activeEntrances = [];
  int _queuedCount = 0;

  @override
  void initState() {
    super.initState();
    _syncQueue();
    _pollTimer = Timer.periodic(const Duration(seconds: 2), (_) => _syncQueue());
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _completeTimer?.cancel();
    super.dispose();
  }

  Future<void> _syncQueue() async {
    try {
      final params = <String, String>{'userId': widget.userId};
      if (widget.pkBattleId != null && widget.pkBattleId!.isNotEmpty) {
        params['pkBattleId'] = widget.pkBattleId!;
      } else if (widget.roomId != null && widget.roomId!.isNotEmpty) {
        params['roomId'] = widget.roomId!;
      }
      if (widget.previewDemo) params['preview'] = 'demo';

      final uri = Uri.parse('${widget.apiBaseUrl}/api/animations/config')
          .replace(queryParameters: params);
      final res = await http.get(uri);
      if (res.statusCode != 200) return;

      final data = jsonDecode(res.body) as Map<String, dynamic>;
      final sync = data['stateSync'] as Map<String, dynamic>?;
      if (sync == null || !mounted) return;

      final List<dynamic> playingRaw = sync['activeAnimations'] as List<dynamic>? ?? [];
      final List<dynamic> queuedRaw = sync['queuedAnimations'] as List<dynamic>? ?? [];

      final gifts = playingRaw
          .whereType<Map<String, dynamic>>()
          .where((e) => e['eventCategory'] == 'gift')
          .toList();
      final entrances = playingRaw
          .whereType<Map<String, dynamic>>()
          .where((e) => e['eventCategory'] == 'host_entrance')
          .toList();

      setState(() {
        _activeGifts = gifts;
        _activeEntrances = entrances;
        _queuedCount = queuedRaw.length;
      });
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final bool deviceReduce = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    final bool reduceAnimations = widget.preferences['reduceAnimations'] == true ||
        (widget.preferences['respectDeviceReducedMotion'] != false && deviceReduce);
    final bool allowLarge =
        widget.preferences['enableLargeAnimations'] != false && !reduceAnimations;

    final Map<String, dynamic>? primaryGift =
        _activeGifts.isNotEmpty ? _activeGifts.first : null;
    final Map<String, dynamic>? entrance =
        _activeEntrances.isNotEmpty ? _activeEntrances.first : null;

    if (primaryGift == null && entrance == null) {
      return const SizedBox.shrink();
    }

    final String? pkSide = primaryGift?['pkHostSide']?.toString();
    final Alignment sideAlignment = pkSide == 'host_b'
        ? Alignment.centerRight
        : pkSide == 'host_a'
            ? Alignment.centerLeft
            : Alignment.center;

    return IgnorePointer(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (entrance != null)
            HostEntranceBanner(
              entrance: entrance,
              reduceAnimations: reduceAnimations,
              isUrdu: widget.isUrdu,
            ),
          if (primaryGift != null) ...[
            if (primaryGift['isFullscreen'] == true && allowLarge)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Column(
                  children: [
                    Icon(
                      Icons.castle_rounded,
                      size: 56,
                      color: const Color(0xFFFF6EC7),
                    ),
                    const SizedBox(height: 4),
                  ],
                ),
              ),
            Align(
              alignment: sideAlignment,
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFF19092E).withOpacity(0.94),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFFFBBF24), width: 1.2),
                  boxShadow: reduceAnimations
                      ? []
                      : [
                          BoxShadow(
                            color: const Color(0xFFFF007F).withOpacity(0.35),
                            blurRadius: 14,
                          ),
                        ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.auto_awesome, color: Color(0xFFFFC83B), size: 18),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        '${primaryGift['senderNickname']} sent ${primaryGift['giftName']} x${primaryGift['quantity']} → ${primaryGift['recipientNickname']}',
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    if (_queuedCount > 0) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFF007F),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          '+$_queuedCount',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
