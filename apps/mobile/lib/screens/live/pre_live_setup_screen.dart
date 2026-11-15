import 'package:flutter/material.dart';

import '../../theme/popo_theme.dart';
import '../../api/api.dart';
import '../../services/live/live_permission_service.dart';
import '../../services/live/live_session_manager.dart';
import '../../widgets/popo_loading_indicator.dart';
import '../../widgets/popo_primary_button.dart';

/// Pre-Live Studio Setup Screen
/// Allows setting live title, selecting broadcast category, verifying permissions, and going live
class PreLiveSetupScreen extends StatefulWidget {
  const PreLiveSetupScreen({Key? key}) : super(key: key);

  @override
  State<PreLiveSetupScreen> createState() => _PreLiveSetupScreenState();
}

class _PreLiveSetupScreenState extends State<PreLiveSetupScreen> {
  final LiveApiService _apiService = LiveApiService();
  final LivePermissionService _permissionService =
      LivePermissionService.instance;
  final LiveSessionManager _sessionManager = LiveSessionManager.instance;

  final TextEditingController _titleController = TextEditingController(
    text: 'Come and chat with me 💕',
  );

  List<Map<String, dynamic>> _categories = [];
  String _selectedCategory = 'Live Chat';
  String _selectedCategoryId = 'live_chat';
  bool _isLoading = true;
  bool _isStarting = false;
  bool _hasCameraPermission = false;
  bool _hasMicrophonePermission = false;

  @override
  void initState() {
    super.initState();
    _loadPreLiveConfig();
    _checkInitialPermissions();
  }

  @override
  void dispose() {
    _titleController.dispose();
    super.dispose();
  }

  Future<void> _checkInitialPermissions() async {
    final status = await _permissionService.checkPermissions();
    if (!mounted) return;
    setState(() {
      _hasCameraPermission = status['camera'] == LivePermissionStatus.granted;
      _hasMicrophonePermission =
          status['microphone'] == LivePermissionStatus.granted;
    });
  }

  Future<void> _loadPreLiveConfig() async {
    setState(() => _isLoading = true);
    try {
      final res = await _apiService.getPreLiveConfig(isDemo: true);
      if (res.isSuccess && res.data != null) {
        final data = res.data as Map<String, dynamic>;
        final rawCats = data['categories'] as List<dynamic>? ?? [];
        if (mounted) {
          setState(() {
            _categories = rawCats
                .map((c) => c as Map<String, dynamic>)
                .toList();
            if (_categories.isNotEmpty) {
              _selectedCategory =
                  _categories[0]['name']?.toString() ?? 'Live Chat';
              _selectedCategoryId =
                  _categories[0]['id']?.toString() ?? 'live_chat';
            }
            final saved = data['savedSetup'] as Map<String, dynamic>?;
            if (saved != null && saved['title'] != null) {
              _titleController.text = saved['title'].toString();
            }
            _isLoading = false;
          });
        }
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _requestPermissions() async {
    final granted = await _permissionService.requestLivePermissions(context);
    if (!mounted) return;
    setState(() {
      _hasCameraPermission = _permissionService.isCameraGranted;
      _hasMicrophonePermission = _permissionService.isMicrophoneGranted;
    });

    if (granted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Camera and microphone ready for broadcasting!'),
          backgroundColor: Color(0xFF00C853),
        ),
      );
    }
  }

  Future<void> _startBroadcast() async {
    // 1. Verify permissions
    if (!_hasCameraPermission || !_hasMicrophonePermission) {
      final proceed = await _permissionService.requestLivePermissions(context);
      if (!proceed) return;
      setState(() {
        _hasCameraPermission = _permissionService.isCameraGranted;
        _hasMicrophonePermission = _permissionService.isMicrophoneGranted;
      });
    }

    setState(() => _isStarting = true);

    // 2. Setup pre-live on backend
    await _apiService.setupPreLive(
      title: _titleController.text.trim(),
      category: _selectedCategory,
    );

    // 3. Launch studio session via LiveSessionManager
    final success = await _sessionManager.startBroadcast(
      title: _titleController.text.trim(),
      category: _selectedCategory,
      isDemo: true,
    );

    if (!mounted) return;
    setState(() => _isStarting = false);

    if (success) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: PopoTheme.surface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: Row(
            children: const [
              Icon(
                Icons.check_circle_rounded,
                color: Color(0xFF00C853),
                size: 24,
              ),
              SizedBox(width: 10),
              Text(
                'Live Studio Ready',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Broadcast channel "${_sessionManager.currentSession?.agora?.channelName ?? 'live'}" initialized successfully.',
                style: const TextStyle(
                  color: PopoTheme.textSecondary,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E1E2D),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Mode: ${_sessionManager.currentSession?.agora?.mode ?? 'agora_cloud_rtc'}\nUID: ${_sessionManager.currentSession?.agora?.uid ?? 0}',
                  style: const TextStyle(
                    color: PopoTheme.cyan,
                    fontSize: 12,
                    fontFamily: 'monospace',
                  ),
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Full real-time video rendering UI activates in Prompt 02/10.',
                style: TextStyle(color: PopoTheme.gold, fontSize: 12),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text(
                'Dismiss',
                style: TextStyle(color: PopoTheme.primary),
              ),
            ),
          ],
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _sessionManager.errorMessage ?? 'Failed to start studio session',
          ),
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
          'Pre-Live Studio Setup',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: _isLoading
          ? const Center(child: PopoLoadingIndicator())
          : ListView(
              padding: const EdgeInsets.all(20),
              children: [
                // Camera Preview Stage Placeholder
                Container(
                  height: 240,
                  decoration: BoxDecoration(
                    color: PopoTheme.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: PopoTheme.primary.withOpacity(0.4),
                      width: 1.5,
                    ),
                  ),
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            _hasCameraPermission
                                ? Icons.videocam_rounded
                                : Icons.videocam_off_rounded,
                            color: _hasCameraPermission
                                ? PopoTheme.primary
                                : PopoTheme.textSecondary,
                            size: 48,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            _hasCameraPermission
                                ? 'Camera Ready for Live Stream'
                                : 'Camera Permission Required',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _hasCameraPermission
                                ? 'Agora RTC channel will stream high-definition video'
                                : 'Tap below to grant camera and audio access',
                            style: const TextStyle(
                              color: PopoTheme.textSecondary,
                              fontSize: 12,
                            ),
                          ),
                          if (!_hasCameraPermission) ...[
                            const SizedBox(height: 14),
                            ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: PopoTheme.primary,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                              icon: const Icon(
                                Icons.lock_open_rounded,
                                size: 16,
                                color: Colors.white,
                              ),
                              label: const Text(
                                'Grant Access',
                                style: TextStyle(color: Colors.white),
                              ),
                              onPressed: _requestPermissions,
                            ),
                          ],
                        ],
                      ),
                      // Live badge
                      Positioned(
                        top: 12,
                        left: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: PopoTheme.primary,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            'STUDIO PREVIEW',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Stream Title Input
                const Text(
                  'Broadcast Title',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _titleController,
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                  maxLength: 60,
                  decoration: InputDecoration(
                    filled: true,
                    fillColor: PopoTheme.surface,
                    hintText: 'Enter an engaging broadcast title...',
                    hintStyle: const TextStyle(color: PopoTheme.textSecondary),
                    counterStyle: const TextStyle(
                      color: PopoTheme.textSecondary,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(
                        color: PopoTheme.borderSubtle,
                      ),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(
                        color: PopoTheme.borderSubtle,
                      ),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: PopoTheme.primary),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Category Selector
                const Text(
                  'Streaming Category',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _categories.map((c) {
                    final name = c['name']?.toString() ?? '';
                    final isSelected = _selectedCategory == name;
                    return ChoiceChip(
                      label: Text(name),
                      selected: isSelected,
                      onSelected: (selected) {
                        if (selected) {
                          setState(() {
                            _selectedCategory = name;
                            _selectedCategoryId = c['id']?.toString() ?? '';
                          });
                        }
                      },
                      selectedColor: PopoTheme.primary,
                      backgroundColor: PopoTheme.surface,
                      labelStyle: TextStyle(
                        color: isSelected
                            ? Colors.white
                            : PopoTheme.textSecondary,
                        fontWeight: isSelected
                            ? FontWeight.bold
                            : FontWeight.normal,
                        fontSize: 12,
                      ),
                      side: BorderSide(
                        color: isSelected
                            ? PopoTheme.primary
                            : PopoTheme.borderSubtle,
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 32),

                // Start Live CTA
                PopoPrimaryButton(
                  text: _isStarting ? 'Starting Studio...' : 'Go Live Now',
                  isLoading: _isStarting,
                  onPressed: _isStarting ? null : _startBroadcast,
                ),
                const SizedBox(height: 20),
              ],
            ),
    );
  }
}
