import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

/// ============================================================================
/// Popo Live — Phase 7 Module 7.4: Animation & Accessibility Settings Sheet
/// Allows viewers/hosts to configure large animations, SFX & reduced FX
/// without affecting gift transactions, coins, or host points.
/// ============================================================================

class AnimationSettingsSheet extends StatefulWidget {
  final String userId;
  final String apiBaseUrl;
  final String? authToken;
  final bool previewDemo;
  final Map<String, dynamic> initialPrefs;
  final void Function(Map<String, dynamic> updatedPrefs) onSaved;

  const AnimationSettingsSheet({
    Key? key,
    required this.userId,
    required this.apiBaseUrl,
    this.authToken,
    this.previewDemo = true,
    required this.initialPrefs,
    required this.onSaved,
  }) : super(key: key);

  @override
  State<AnimationSettingsSheet> createState() => _AnimationSettingsSheetState();
}

class _AnimationSettingsSheetState extends State<AnimationSettingsSheet> {
  late bool _enableLarge;
  late bool _enableSound;
  late bool _reduceAnimations;
  late bool _respectDevice;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _enableLarge = widget.initialPrefs['enableLargeAnimations'] != false;
    _enableSound = widget.initialPrefs['enableSoundEffects'] != false;
    _reduceAnimations = widget.initialPrefs['reduceAnimations'] == true;
    _respectDevice = widget.initialPrefs['respectDeviceReducedMotion'] != false;
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      final uri = Uri.parse(
        '${widget.apiBaseUrl}/api/animations/preferences${widget.previewDemo ? '?preview=demo' : ''}',
      );
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (widget.authToken != null && widget.authToken!.isNotEmpty) {
        headers['Authorization'] = 'Bearer ${widget.authToken}';
      }
      final res = await http.put(
        uri,
        headers: headers,
        body: jsonEncode({
          'userId': widget.userId,
          'enableLargeAnimations': _enableLarge,
          'enableSoundEffects': _enableSound,
          'reduceAnimations': _reduceAnimations,
          'respectDeviceReducedMotion': _respectDevice,
        }),
      );
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        if (data['preferences'] is Map<String, dynamic>) {
          widget.onSaved(data['preferences'] as Map<String, dynamic>);
        }
      }
    } catch (_) {
    } finally {
      if (mounted) {
        setState(() => _saving = false);
        Navigator.of(context).pop();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(18, 16, 18, 24),
      decoration: const BoxDecoration(
        color: Color(0xFF180833),
        borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              const Icon(Icons.tune, color: Color(0xFFFF2E93), size: 20),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'Animation & Sound Settings',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15),
                ),
              ),
              IconButton(
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(Icons.close, color: Colors.white60, size: 20),
              ),
            ],
          ),
          SwitchListTile(
            title: const Text('Enable Large Animations', style: TextStyle(color: Colors.white, fontSize: 13)),
            subtitle: const Text('Full-screen luxury gifts and fireworks', style: TextStyle(color: Colors.white54, fontSize: 11)),
            activeColor: const Color(0xFFFF007F),
            value: _enableLarge,
            onChanged: (v) => setState(() => _enableLarge = v),
          ),
          SwitchListTile(
            title: const Text('Enable Sound Effects', style: TextStyle(color: Colors.white, fontSize: 13)),
            subtitle: const Text('Gift chimes and VIP entrance audio', style: TextStyle(color: Colors.white54, fontSize: 11)),
            activeColor: const Color(0xFFFF007F),
            value: _enableSound,
            onChanged: (v) => setState(() => _enableSound = v),
          ),
          SwitchListTile(
            title: const Text('Reduce Animations (Low-End Mode)', style: TextStyle(color: Colors.white, fontSize: 13)),
            subtitle: const Text('Lightweight overlay keeping video smooth', style: TextStyle(color: Colors.white54, fontSize: 11)),
            activeColor: const Color(0xFFFF007F),
            value: _reduceAnimations,
            onChanged: (v) => setState(() => _reduceAnimations = v),
          ),
          SwitchListTile(
            title: const Text('Respect Device Accessibility', style: TextStyle(color: Colors.white, fontSize: 13)),
            activeColor: const Color(0xFFFF007F),
            value: _respectDevice,
            onChanged: (v) => setState(() => _respectDevice = v),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFF007F),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              onPressed: _saving ? null : _save,
              child: Text(
                _saving ? 'Saving...' : 'Save Preferences',
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
