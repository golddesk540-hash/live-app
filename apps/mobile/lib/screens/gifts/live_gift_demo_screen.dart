import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'gift_sending_sheet.dart';

/// ============================================================================
/// Popo Live — Phase 7 Module 7.3: Live & PK Gift Stage Screen
/// Replicates 07_03_sending_a_gift.png with non-blocking floating gift burst,
/// PK timer / score bars, live coin sync, and embedded GiftSendingSheet.
/// ============================================================================

class LiveGiftDemoScreen extends StatefulWidget {
  final String userId;
  final String apiBaseUrl;
  final String? authToken;
  final String? roomId;
  final String? pkBattleId;
  final String? initialGiftId;
  final bool previewDemo;
  final VoidCallback? onOpenWallet;

  const LiveGiftDemoScreen({
    Key? key,
    this.userId = 'user_wallet_demo_701',
    this.apiBaseUrl = 'https://kigolive.com',
    this.authToken,
    this.roomId,
    this.pkBattleId = '00000000-0000-0000-0000-000000000603',
    this.initialGiftId,
    this.previewDemo = true,
    this.onOpenWallet,
  }) : super(key: key);

  @override
  State<LiveGiftDemoScreen> createState() => _LiveGiftDemoScreenState();
}

class _LiveGiftDemoScreenState extends State<LiveGiftDemoScreen> {
  static const Color _bgDeep = Color(0xFF0A0318);
  static const Color _neonPink = Color(0xFFFF2E83);
  static const Color _goldCoin = Color(0xFFFFC83B);

  Timer? _syncTimer;
  Timer? _toastTimer;
  int _pkHostAScore = 12560;
  int _pkHostBScore = 9840;
  int _availableCoins = 12500;
  Map<String, dynamic>? _activeBurst;

  @override
  void initState() {
    super.initState();
    _refreshScores();
    _syncTimer = Timer.periodic(const Duration(seconds: 5), (_) => _refreshScores());
  }

  @override
  void dispose() {
    _syncTimer?.cancel();
    _toastTimer?.cancel();
    super.dispose();
  }

  Future<void> _refreshScores() async {
    try {
      final params = <String, String>{};
      if (widget.pkBattleId != null && widget.pkBattleId!.isNotEmpty) {
        params['pkBattleId'] = widget.pkBattleId!;
      } else if (widget.roomId != null && widget.roomId!.isNotEmpty) {
        params['roomId'] = widget.roomId!;
      }
      if (widget.previewDemo) params['preview'] = 'demo';

      final uri = Uri.parse('${widget.apiBaseUrl}/api/gifts/send/context')
          .replace(queryParameters: params);
      final res = await http.get(uri);
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        if (!mounted) return;
        setState(() {
          _pkHostAScore = (data['pkHostAScore'] as num?)?.toInt() ?? _pkHostAScore;
          _pkHostBScore = (data['pkHostBScore'] as num?)?.toInt() ?? _pkHostBScore;
          final wallet = data['senderWallet'] as Map<String, dynamic>?;
          if (wallet != null && wallet['availableCoins'] != null) {
            _availableCoins = (wallet['availableCoins'] as num).toInt();
          }
        });
      }
    } catch (_) {}
  }

  void _handleGiftSent(Map<String, dynamic> result) {
    final tx = result['transaction'] as Map<String, dynamic>?;
    final stats = result['updatedHostStats'] as Map<String, dynamic>?;
    final wallet = result['updatedSenderWallet'] as Map<String, dynamic>?;

    setState(() {
      if (stats != null) {
        if (stats['pkHostAScore'] != null) _pkHostAScore = (stats['pkHostAScore'] as num).toInt();
        if (stats['pkHostBScore'] != null) _pkHostBScore = (stats['pkHostBScore'] as num).toInt();
      }
      if (wallet != null && wallet['availableCoins'] != null) {
        _availableCoins = (wallet['availableCoins'] as num).toInt();
      }
      _activeBurst = tx;
    });

    _toastTimer?.cancel();
    _toastTimer = Timer(const Duration(seconds: 3), () {
      if (mounted) setState(() => _activeBurst = null);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bgDeep,
      appBar: AppBar(
        backgroundColor: const Color(0xFF170830),
        elevation: 0,
        title: const Text('Popo Live', style: TextStyle(fontWeight: FontWeight.w900)),
        actions: [
          Container(
            margin: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFF28114D),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: _goldCoin.withOpacity(0.45)),
            ),
            child: Row(
              children: [
                const Icon(Icons.monetization_on_rounded, color: _goldCoin, size: 15),
                const SizedBox(width: 4),
                Text('$_availableCoins', style: const TextStyle(color: _goldCoin, fontWeight: FontWeight.w800)),
              ],
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // PK Split Stage & Non-Blocking Gift Burst
          Container(
            color: const Color(0xFF190935),
            padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('$_pkHostAScore', style: const TextStyle(color: _goldCoin, fontWeight: FontWeight.w900)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 3),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(colors: [_neonPink, Color(0xFFA238FF)]),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Text('PK 04:32', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 11)),
                    ),
                    Text('$_pkHostBScore', style: const TextStyle(color: Colors.cyanAccent, fontWeight: FontWeight.w900)),
                  ],
                ),
                if (_activeBurst != null) ...[
                  const SizedBox(height: 8),
                  IgnorePointer(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: const Color(0xFF3E105C).withOpacity(0.92),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: _neonPink.withOpacity(0.7)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.auto_awesome, color: _goldCoin, size: 18),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              '${_activeBurst!['senderNickname']} sent ${_activeBurst!['giftNameSnapshot']} x${_activeBurst!['quantity']} → ${_activeBurst!['recipientNickname']}',
                              style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              child: GiftSendingSheet(
                userId: widget.userId,
                apiBaseUrl: widget.apiBaseUrl,
                authToken: widget.authToken,
                roomId: widget.roomId,
                pkBattleId: widget.pkBattleId,
                initialGiftId: widget.initialGiftId,
                previewDemo: widget.previewDemo,
                onOpenWallet: widget.onOpenWallet,
                onGiftSent: _handleGiftSent,
              ),
            ),
          ),
          const Padding(
            padding: EdgeInsets.only(bottom: 6),
            child: Text(
              'P7.3 Sending a Gift',
              style: TextStyle(color: Colors.white38, fontSize: 11),
            ),
          ),
        ],
      ),
    );
  }
}
