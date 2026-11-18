import 'package:flutter/material.dart';

import '../../theme/popo_theme.dart';
import '../../design/design_fixtures.dart';
import '../../models/live/live_models.dart';
import 'host_studio_screen.dart';

/// Screen 4/6: Pre-Live Screen — Broadcast Confirmation & Staging
/// Implemented for Phase 3 (D2) Prompt 3 according to Popo Live Complete Product Design v1.1.
/// Displays selected cover, room title, host profile, configuration summary, hardware status,
/// and provides Start Live and Back/Edit controls.
class PreLiveSetupScreen extends StatefulWidget {
  final String? coverUrl;
  final String? title;
  final String? category;
  final List<String>? tags;

  const PreLiveSetupScreen({
    super.key,
    this.coverUrl,
    this.title,
    this.category,
    this.tags,
  });

  @override
  State<PreLiveSetupScreen> createState() => _PreLiveSetupScreenState();
}

class _PreLiveSetupScreenState extends State<PreLiveSetupScreen> {
  late String _coverUrl;
  late String _title;
  late String _category;
  late List<String> _tags;

  bool _isCameraOn = true;
  bool _isMicOn = true;
  bool _isFrontCamera = true;
  String? _validationError;

  @override
  void initState() {
    super.initState();
    _coverUrl = widget.coverUrl ??
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600';
    _title = widget.title ?? 'Karachi Nights 🎶 Acoustic Live Session';
    _category = widget.category ?? 'Singing';
    _tags = widget.tags ?? ['#LiveChat', '#Music', '#Singing'];
  }

  void _onStartLivePressed() {
    if (_title.trim().isEmpty) {
      setState(() {
        _validationError = 'Broadcast room title cannot be empty.';
      });
      return;
    }

    final user = DesignFixtures.currentUserProfile;

    final setupResult = PreLiveSetupResult(
      success: true,
      message: 'Broadcast staged successfully via Popo Fixture Engine',
      roomId: 'room_karachi_nights',
      roomNumber: '8800001',
      title: _title,
      category: _category,
      categoryId: _category.toLowerCase().replaceAll(' ', '_'),
      coverUrl: _coverUrl,
      tags: _tags,
      hostNickname: user.nickname,
      hostPoppoId: user.poppoId,
      hostId: user.id,
      status: 'live',
      nextStep: '/live/studio',
    );

    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => HostStudioScreen(
          setupResult: setupResult,
          initialCameraOn: _isCameraOn,
          initialMicOn: _isMicOn,
          initialFrontCamera: _isFrontCamera,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = DesignFixtures.currentUserProfile;

    return Scaffold(
      backgroundColor: PopoTheme.background,
      appBar: AppBar(
        backgroundColor: PopoTheme.surface,
        elevation: 0,
        leading: IconButton(
          key: const Key('pre_live_back_button'),
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Pre-Live Confirmation',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          TextButton(
            key: const Key('edit_details_button'),
            onPressed: () => Navigator.pop(context),
            child: const Text(
              'Edit',
              style: TextStyle(
                color: PopoTheme.primary,
                fontWeight: FontWeight.w600,
                fontSize: 15,
              ),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 1. Room Cover & Broadcast Meta Card
            _buildRoomSummaryCard(),
            const SizedBox(height: 18),

            // 2. Host Profile Card
            _buildHostProfileCard(user),
            const SizedBox(height: 18),

            // 3. Live Configuration Summary Card
            _buildConfigSummaryCard(),
            const SizedBox(height: 18),

            // 4. Hardware Controls (Camera & Mic Status)
            _buildHardwareStatusCard(),
            const SizedBox(height: 20),

            // Validation error message if any
            if (_validationError != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.redAccent.withOpacity(0.4)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline_rounded,
                        color: Colors.redAccent, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _validationError!,
                        style: const TextStyle(
                            color: Colors.redAccent, fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // 5. Start Live Button
            _buildStartLiveButton(),
            const SizedBox(height: 12),

            // Notice
            const Center(
              child: Text(
                'Demonstration Mode · Connected to Popo Live Fixture Engine',
                style: TextStyle(
                  color: PopoTheme.textSecondary,
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildRoomSummaryCard() {
    return Container(
      decoration: BoxDecoration(
        color: PopoTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: PopoTheme.borderSubtle),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Cover image preview with category chip overlay
          Stack(
            children: [
              SizedBox(
                height: 160,
                width: double.infinity,
                child: Image.network(
                  _coverUrl,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    color: const Color(0xFF222232),
                    child: const Center(
                      child: Icon(Icons.image_not_supported_rounded,
                          color: Colors.white38, size: 48),
                    ),
                  ),
                ),
              ),
              Container(
                height: 160,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.black.withOpacity(0.2),
                      Colors.black.withOpacity(0.7),
                    ],
                  ),
                ),
              ),
              Positioned(
                top: 12,
                left: 12,
                child: Container(
                  key: const Key('pre_live_category_chip'),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: PopoTheme.primary,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.label_rounded,
                          color: Colors.white, size: 12),
                      const SizedBox(width: 4),
                      Text(
                        _category,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),

          // Title & Tags
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'BROADCAST TITLE',
                  style: TextStyle(
                    color: PopoTheme.textSecondary,
                    fontSize: 11,
                    letterSpacing: 0.8,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  _title,
                  key: const Key('pre_live_title_text'),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: _tags.map((tag) {
                    return Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        tag,
                        style: const TextStyle(
                          color: PopoTheme.textSecondary,
                          fontSize: 11,
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHostProfileCard(FixtureUserProfile user) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: PopoTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: PopoTheme.borderSubtle),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 28,
            backgroundColor: PopoTheme.primary.withOpacity(0.2),
            backgroundImage: NetworkImage(user.avatarUrl),
            onBackgroundImageError: (_, __) {},
            child: const Icon(Icons.person, color: Colors.white38),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        user.nickname,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(user.flagEmoji, style: const TextStyle(fontSize: 14)),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFFFFB800), Color(0xFFFF8A00)],
                        ),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        'Lv.${user.wealthLevel}',
                        style: const TextStyle(
                          color: Colors.black,
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  'ID: ${user.poppoId}',
                  style: const TextStyle(
                    color: PopoTheme.textSecondary,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: PopoTheme.primary.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        '${user.coinsFormatted} Coins',
                        style: const TextStyle(
                          color: PopoTheme.primary,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: PopoTheme.gold.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        '${user.pointsFormatted} Points',
                        style: const TextStyle(
                          color: PopoTheme.gold,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConfigSummaryCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: PopoTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: PopoTheme.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.tune_rounded, color: PopoTheme.cyan, size: 18),
              SizedBox(width: 8),
              Text(
                'BROADCAST CONFIGURATION',
                style: TextStyle(
                  color: PopoTheme.textSecondary,
                  fontSize: 12,
                  letterSpacing: 0.8,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _buildConfigRow('Resolution', '720p HD (1280 × 720)'),
          const Divider(color: PopoTheme.borderSubtle, height: 16),
          _buildConfigRow('Target Frame Rate', '30 FPS'),
          const Divider(color: PopoTheme.borderSubtle, height: 16),
          _buildConfigRow('Server Engine', 'Popo Live Fixture Engine'),
          const Divider(color: PopoTheme.borderSubtle, height: 16),
          _buildConfigRow('Broadcasting Mode', 'Demonstration (Safe Demo)'),
        ],
      ),
    );
  }

  Widget _buildConfigRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: PopoTheme.textSecondary,
            fontSize: 13,
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildHardwareStatusCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: PopoTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: PopoTheme.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.devices_rounded, color: PopoTheme.primary, size: 18),
              SizedBox(width: 8),
              Text(
                'DEVICES & HARDWARE STATUS',
                style: TextStyle(
                  color: PopoTheme.textSecondary,
                  fontSize: 12,
                  letterSpacing: 0.8,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Camera status tile
          Container(
            key: const Key('camera_status_tile'),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(
                  _isCameraOn
                      ? Icons.videocam_rounded
                      : Icons.videocam_off_rounded,
                  color: _isCameraOn ? PopoTheme.green : Colors.redAccent,
                  size: 22,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Camera Preview',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        _isCameraOn
                            ? (_isFrontCamera
                                ? 'Active · Front Facing'
                                : 'Active · Rear Facing')
                            : 'Disabled / Muted',
                        style: TextStyle(
                          color: _isCameraOn
                              ? PopoTheme.green
                              : PopoTheme.textSecondary,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                Switch(
                  key: const Key('camera_toggle'),
                  value: _isCameraOn,
                  activeColor: PopoTheme.primary,
                  onChanged: (val) => setState(() => _isCameraOn = val),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),

          // Microphone status tile
          Container(
            key: const Key('mic_status_tile'),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(
                  _isMicOn ? Icons.mic_rounded : Icons.mic_off_rounded,
                  color: _isMicOn ? PopoTheme.green : Colors.redAccent,
                  size: 22,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Microphone Audio',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        _isMicOn ? 'Active · Input Ready' : 'Muted',
                        style: TextStyle(
                          color: _isMicOn
                              ? PopoTheme.green
                              : PopoTheme.textSecondary,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                Switch(
                  key: const Key('mic_toggle'),
                  value: _isMicOn,
                  activeColor: PopoTheme.primary,
                  onChanged: (val) => setState(() => _isMicOn = val),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStartLiveButton() {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        gradient: const LinearGradient(
          colors: [Color(0xFFFF2B78), Color(0xFFFF0D55)],
        ),
        boxShadow: [
          BoxShadow(
            color: PopoTheme.primary.withOpacity(0.35),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          key: const Key('start_live_button'),
          borderRadius: BorderRadius.circular(14),
          onTap: _onStartLivePressed,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                Icon(Icons.sensors_rounded, color: Colors.white, size: 22),
                SizedBox(width: 10),
                Text(
                  'Start Live Broadcast',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
