import 'package:flutter/material.dart';

import '../../theme/popo_theme.dart';
import '../../l10n/strings.dart';
import '../../models/live/live_models.dart';
import '../../repositories/live/live_repository.dart';
import '../../services/live/agora_rtc_service.dart';
import '../../services/live/live_permission_service.dart';
import '../../widgets/popo_loading_indicator.dart';
import '../../widgets/popo_error_state.dart';
import '../../widgets/popo_primary_button.dart';
import 'cover_upload_screen.dart';
import 'host_studio_screen.dart';

/// Pre-Live Studio Setup Screen
/// Implemented in Phase 2 Prompt 03/10 according to NEXT IMPLEMENTATION PLAN v1.1
/// Connects to GET /api/live/pre-live/config & POST /api/live/pre-live/setup
class PreLiveSetupScreen extends StatefulWidget {
  const PreLiveSetupScreen({Key? key}) : super(key: key);

  @override
  State<PreLiveSetupScreen> createState() => _PreLiveSetupScreenState();
}

class _PreLiveSetupScreenState extends State<PreLiveSetupScreen> {
  final LiveRepository _repository = LiveRepository.instance;
  final AgoraRtcService _rtcService = AgoraRtcService.instance;
  final LivePermissionService _permissionService =
      LivePermissionService.instance;

  final TextEditingController _titleController = TextEditingController(
    text: 'Come and chat with me 💕',
  );

  PreLiveConfig? _config;
  bool _isLoading = true;
  bool _isSubmitting = false;
  String? _errorMessage;
  String? _titleError;

  // Selected state
  String _selectedCategoryId = 'live_chat';
  String _selectedCategoryName = 'Live Chat';
  final List<String> _selectedTags = ['#LiveChat', '#Friendly'];
  String? _coverUrl;

  // Hardware controls
  bool _isCameraOn = true;
  bool _isMicOn = true;
  bool _isFrontCamera = true;
  bool _hasCameraPermission = false;
  bool _hasMicPermission = false;

  @override
  void initState() {
    super.initState();
    _loadConfig();
    _checkPermissions();
  }

  @override
  void dispose() {
    _titleController.dispose();
    super.dispose();
  }

  Future<void> _checkPermissions() async {
    final status = await _permissionService.checkPermissions();
    if (!mounted) return;
    setState(() {
      _hasCameraPermission = status['camera'] == LivePermissionStatus.granted;
      _hasMicPermission = status['microphone'] == LivePermissionStatus.granted;
    });
  }

  Future<void> _loadConfig() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final config = await _repository.fetchPreLiveConfig(isDemo: false);
      if (!mounted) return;

      setState(() {
        _config = config;
        _isLoading = false;

        // Apply saved settings
        if (config.savedSetup != null) {
          _titleController.text = config.savedSetup!.title;
          _selectedCategoryId = config.savedSetup!.categoryId;
          _selectedCategoryName = config.savedSetup!.categoryName;
        } else if (config.categories.isNotEmpty) {
          _selectedCategoryId = config.categories.first.id;
          _selectedCategoryName = config.categories.first.name;
        }

        if (config.coverUrl != null && config.coverUrl!.isNotEmpty) {
          _coverUrl = config.coverUrl;
        }
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString();
      });
    }
  }

  Future<void> _toggleCamera() async {
    final nextState = !_isCameraOn;
    await _rtcService.muteLocalVideo(!nextState);
    if (!mounted) return;
    setState(() => _isCameraOn = nextState);
  }

  Future<void> _toggleMic() async {
    final nextState = !_isMicOn;
    await _rtcService.muteLocalAudio(!nextState);
    if (!mounted) return;
    setState(() => _isMicOn = nextState);
  }

  Future<void> _flipCamera() async {
    await _rtcService.switchCamera();
    if (!mounted) return;
    setState(() => _isFrontCamera = _rtcService.isFrontCamera);
  }

  void _onCategorySelected(PreLiveCategory cat) {
    setState(() {
      _selectedCategoryId = cat.id;
      _selectedCategoryName = cat.name;
    });
  }

  void _onTagToggled(String tag) {
    setState(() {
      if (_selectedTags.contains(tag)) {
        _selectedTags.remove(tag);
      } else {
        if (_selectedTags.length >= 3) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Maximum 3 room tags allowed.'),
              duration: Duration(seconds: 1),
            ),
          );
          return;
        }
        _selectedTags.add(tag);
      }
    });
  }

  Future<void> _handleChangeCover() async {
    final result = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => CoverUploadScreen(currentCoverUrl: _coverUrl),
      ),
    );

    if (result == true && mounted) {
      // Reload config to obtain updated cover image URL
      _loadConfig();
    }
  }

  bool _validateInputs() {
    final title = _titleController.text.trim();
    if (title.isEmpty) {
      setState(() => _titleError = 'Live title cannot be empty.');
      return false;
    }
    if (title.length > 60) {
      setState(
        () => _titleError =
            'Live title exceeds maximum 60 characters limit (current: ${title.length}).',
      );
      return false;
    }
    setState(() => _titleError = null);
    return true;
  }

  Future<void> _handleSubmitSetup() async {
    if (!_validateInputs()) return;
    if (_isSubmitting) return;

    // Check camera & mic permissions
    if (!_hasCameraPermission || !_hasMicPermission) {
      final granted = await _permissionService.requestLivePermissions(context);
      if (!granted) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Camera and microphone permissions are required to stage your live studio.',
            ),
            backgroundColor: PopoTheme.primary,
          ),
        );
        return;
      }
      setState(() {
        _hasCameraPermission = _permissionService.isCameraGranted;
        _hasMicPermission = _permissionService.isMicrophoneGranted;
      });
    }

    setState(() => _isSubmitting = true);

    final title = _titleController.text.trim();
    final result = await _repository.submitPreLiveSetup(
      title: title,
      categoryId: _selectedCategoryId,
      category: _selectedCategoryName,
      coverUrl: _coverUrl,
      tags: _selectedTags,
    );

    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (result.success) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => HostStudioScreen(setupResult: result),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result.error ?? 'Failed to stage live studio.'),
          backgroundColor: PopoTheme.primary,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: PopoTheme.background,
      appBar: AppBar(
        backgroundColor: PopoTheme.surface,
        elevation: 0,
        title: const Text(
          'Pre-Live Setup',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: PopoTheme.cyan),
            onPressed: _loadConfig,
            tooltip: 'Refresh Config',
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: PopoLoadingIndicator());
    }

    if (_errorMessage != null) {
      return Center(
        child: PopoErrorState(
          title: 'Failed to Load Pre-Live Config',
          message: _errorMessage!,
          onRetry: _loadConfig,
        ),
      );
    }

    final categories = _config?.categories ?? [];
    final tags = _config?.supportedTags ?? PreLiveConfig.defaultSupportedTags;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Camera & Microphone Viewport Preview
          _buildHardwarePreviewSection(),
          const SizedBox(height: 20),

          // 2. Cover Photo Section
          _buildCoverSection(),
          const SizedBox(height: 20),

          // 3. Live Title Input
          _buildTitleInputSection(),
          const SizedBox(height: 20),

          // 4. Live Category Selection
          _buildCategorySection(categories),
          const SizedBox(height: 20),

          // 5. Room Tags Selection
          _buildTagsSection(tags),
          const SizedBox(height: 32),

          // 6. Action Button
          PopoPrimaryButton(
            text: 'Enter Host Studio',
            isLoading: _isSubmitting,
            onPressed: _handleSubmitSetup,
          ),
          const SizedBox(height: 12),
          const Center(
            child: Text(
              'Your studio setup and preview will be verified before going live.',
              style: TextStyle(color: PopoTheme.textSecondary, fontSize: 12),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildHardwarePreviewSection() {
    return Container(
      height: 160,
      decoration: BoxDecoration(
        color: PopoTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: PopoTheme.borderSubtle, width: 1),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          // Background Viewport
          Positioned.fill(
            child: Container(
              color: const Color(0xFF141420),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      _isCameraOn
                          ? (_isFrontCamera
                                ? Icons.camera_front_rounded
                                : Icons.camera_rear_rounded)
                          : Icons.videocam_off_rounded,
                      color: _isCameraOn
                          ? PopoTheme.cyan
                          : PopoTheme.textSecondary,
                      size: 40,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _isCameraOn
                          ? (_isFrontCamera
                                ? 'Front Camera Preview Active'
                                : 'Rear Camera Preview Active')
                          : 'Camera Video Muted',
                      style: TextStyle(
                        color: _isCameraOn
                            ? Colors.white
                            : PopoTheme.textSecondary,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Hardware Controls Overlay
          Positioned(
            right: 12,
            top: 12,
            child: Row(
              children: [
                _buildQuickIconButton(
                  icon: _isFrontCamera
                      ? Icons.flip_camera_ios_rounded
                      : Icons.flip_camera_android_rounded,
                  onTap: _flipCamera,
                  tooltip: 'Switch Camera',
                ),
                const SizedBox(width: 8),
                _buildQuickIconButton(
                  icon: _isCameraOn
                      ? Icons.videocam_rounded
                      : Icons.videocam_off_rounded,
                  isActive: _isCameraOn,
                  onTap: _toggleCamera,
                  tooltip: 'Toggle Camera',
                ),
                const SizedBox(width: 8),
                _buildQuickIconButton(
                  icon: _isMicOn ? Icons.mic_rounded : Icons.mic_off_rounded,
                  isActive: _isMicOn,
                  onTap: _toggleMic,
                  tooltip: 'Toggle Microphone',
                ),
              ],
            ),
          ),

          // Status Badge
          Positioned(
            left: 12,
            bottom: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.6),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Row(
                children: [
                  Container(
                    width: 6,
                    height: 6,
                    decoration: const BoxDecoration(
                      color: Color(0xFF00C853),
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 6),
                  const Text(
                    'Preview Ready',
                    style: TextStyle(color: Colors.white, fontSize: 11),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickIconButton({
    required IconData icon,
    required VoidCallback onTap,
    required String tooltip,
    bool isActive = true,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.55),
        shape: BoxShape.circle,
      ),
      child: IconButton(
        icon: Icon(
          icon,
          color: isActive ? PopoTheme.cyan : PopoTheme.textSecondary,
          size: 20,
        ),
        onPressed: onTap,
        tooltip: tooltip,
        constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
        padding: const EdgeInsets.all(6),
      ),
    );
  }

  Widget _buildCoverSection() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: PopoTheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: PopoTheme.borderSubtle, width: 1),
      ),
      child: Row(
        children: [
          // Cover Thumbnail (3:4 aspect ratio)
          Container(
            width: 54,
            height: 72,
            decoration: BoxDecoration(
              color: const Color(0xFF222232),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: PopoTheme.gold.withOpacity(0.6),
                width: 1,
              ),
            ),
            clipBehavior: Clip.antiAlias,
            child: _coverUrl != null && _coverUrl!.isNotEmpty
                ? Image.network(
                    _coverUrl!,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const Icon(
                      Icons.image_rounded,
                      color: PopoTheme.textSecondary,
                    ),
                  )
                : const Icon(
                    Icons.add_photo_alternate_rounded,
                    color: PopoTheme.textSecondary,
                  ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text(
                  'Live Cover Photo',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 3),
                Text(
                  'Displayed prominently in the Explore feed',
                  style: TextStyle(
                    color: PopoTheme.textSecondary,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: PopoTheme.surfaceLight,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
                side: const BorderSide(color: PopoTheme.borderSubtle),
              ),
              elevation: 0,
            ),
            onPressed: _handleChangeCover,
            child: const Text(
              'Change',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTitleInputSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Live Broadcast Title',
              style: TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              '${_titleController.text.length}/60',
              style: TextStyle(
                color: _titleController.text.length > 60
                    ? PopoTheme.primary
                    : PopoTheme.textSecondary,
                fontSize: 12,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _titleController,
          maxLength: 60,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          decoration: InputDecoration(
            counterText: '',
            hintText: 'Enter an engaging live stream title...',
            hintStyle: const TextStyle(color: PopoTheme.textTertiary),
            filled: true,
            fillColor: PopoTheme.surface,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: _titleError != null
                    ? PopoTheme.primary
                    : PopoTheme.borderSubtle,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(
                color: PopoTheme.primary,
                width: 1.5,
              ),
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 14,
              vertical: 12,
            ),
            suffixIcon: _titleController.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(
                      Icons.clear_rounded,
                      color: PopoTheme.textSecondary,
                      size: 18,
                    ),
                    onPressed: () {
                      _titleController.clear();
                      setState(() {});
                    },
                  )
                : null,
          ),
          onChanged: (val) {
            setState(() {
              if (val.trim().isNotEmpty && val.length <= 60) {
                _titleError = null;
              }
            });
          },
        ),
        if (_titleError != null) ...[
          const SizedBox(height: 4),
          Text(
            _titleError!,
            style: const TextStyle(color: PopoTheme.primary, fontSize: 12),
          ),
        ],
      ],
    );
  }

  Widget _buildCategorySection(List<PreLiveCategory> categories) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Broadcast Category',
          style: TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        SizedBox(
          height: 38,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: categories.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, index) {
              final cat = categories[index];
              final isSelected = cat.id == _selectedCategoryId;

              return ChoiceChip(
                label: Text(cat.name),
                selected: isSelected,
                labelStyle: TextStyle(
                  color: isSelected ? Colors.white : PopoTheme.textSecondary,
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                ),
                selectedColor: PopoTheme.primary,
                backgroundColor: PopoTheme.surface,
                side: BorderSide(
                  color: isSelected
                      ? PopoTheme.primary
                      : PopoTheme.borderSubtle,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
                onSelected: (_) => _onCategorySelected(cat),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildTagsSection(List<String> tags) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Room Tags',
              style: TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              '${_selectedTags.length}/3 selected',
              style: const TextStyle(
                color: PopoTheme.textSecondary,
                fontSize: 12,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: tags.map((tag) {
            final isSelected = _selectedTags.contains(tag);
            return FilterChip(
              label: Text(tag),
              selected: isSelected,
              labelStyle: TextStyle(
                color: isSelected ? Colors.black : PopoTheme.textSecondary,
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
              selectedColor: PopoTheme.cyan,
              backgroundColor: PopoTheme.surface,
              side: BorderSide(
                color: isSelected ? PopoTheme.cyan : PopoTheme.borderSubtle,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              onSelected: (_) => _onTagToggled(tag),
            );
          }).toList(),
        ),
      ],
    );
  }
}
