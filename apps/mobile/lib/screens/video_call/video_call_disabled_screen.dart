import 'package:flutter/material.dart';

/// Popo Live — Module 8.9 1-to-1 Video Call (STATUS: DEFAULT OFF)
/// Strictly disabled by default until formal client approval.
/// No WebRTC, Agora, or camera/microphone permission calls exist here.
class VideoCallDisabledScreen extends StatelessWidget {
  const VideoCallDisabledScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D031B),
      appBar: AppBar(
        backgroundColor: const Color(0xFF120624),
        title: const Text(
          '1-to-1 Video Calls',
          style: TextStyle(fontWeight: FontWeight.w800, color: Colors.white),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFF180A33),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFFFF1A6C).withValues(alpha: 0.35)),
            ),
            child: Column(
              children: const [
                Icon(Icons.videocam_off_rounded, color: Color(0xFFFF4D8D), size: 48),
                SizedBox(height: 12),
                Text(
                  'Video calls are turned off',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                SizedBox(height: 6),
                Text(
                  'This feature is unavailable by default until client approval.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Color(0xFFD8B4FE), fontSize: 13),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF16092D),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: const [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '1-to-1 video calls (OFF)',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Enable only after client approval.',
                        style: TextStyle(color: Color(0xFFD8B4FE), fontSize: 12),
                      ),
                    ],
                  ),
                ),
                Switch(value: false, onChanged: null),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF16092D),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.amber.withValues(alpha: 0.4)),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Client approval required',
                  style: TextStyle(
                    color: Colors.amberAccent,
                    fontWeight: FontWeight.w800,
                    fontSize: 14,
                  ),
                ),
                SizedBox(height: 6),
                Text(
                  'Keep this feature disabled for the first release unless the client signs off.',
                  style: TextStyle(color: Colors.white70, fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
