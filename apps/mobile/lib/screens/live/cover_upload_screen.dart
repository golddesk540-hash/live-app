import 'dart:convert';

import 'package:flutter/material.dart';

import '../../theme/popo_theme.dart';
import '../../api/api.dart';
import '../../models/live/live_models.dart';
import '../../repositories/live/live_repository.dart';
import '../../widgets/popo_loading_indicator.dart';
import '../../widgets/popo_primary_button.dart';
import '../../widgets/popo_secondary_button.dart';

/// Professional Live Broadcast Cover Photo Upload Screen
/// Interacts with POST & DELETE /api/live/gates/cover-upload
class CoverUploadScreen extends StatefulWidget {
  final String? currentCoverUrl;

  const CoverUploadScreen({Key? key, this.currentCoverUrl}) : super(key: key);

  @override
  State<CoverUploadScreen> createState() => _CoverUploadScreenState();
}

class _CoverUploadScreenState extends State<CoverUploadScreen> {
  final LiveRepository _repository = LiveRepository.instance;
  final LiveApiService _apiService = LiveApiService();

  String? _selectedCoverBase64;
  String? _activeCoverUrl;
  bool _isUploading = false;
  bool _isDeleting = false;
  String? _errorMessage;
  String? _successMessage;

  // Curated high-definition broadcast cover presets for fast creator selection
  static const List<Map<String, String>> _presetCovers = [
    {
      'id': 'glamour',
      'label': 'Glamour Live',
      'accent': '#FF1768',
      'url': '/assets/pre-live/sample_cover_model.png',
      // High-quality base64 sample
      'data': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
    },
    {
      'id': 'party',
      'label': 'Party & Chat',
      'accent': '#00E5FF',
      'url': '/assets/viewer/sample_viewer_broadcast.png',
      'data': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    },
    {
      'id': 'vip',
      'label': 'VIP Streamer',
      'accent': '#FFB800',
      'url': '/assets/studio/sample_host_preview.png',
      'data': 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==',
    },
  ];

  @override
  void initState() {
    super.initState();
    _activeCoverUrl = widget.currentCoverUrl;
  }

  void _selectPreset(Map<String, String> preset) {
    setState(() {
      _selectedCoverBase64 = preset['data'];
      _errorMessage = null;
      _successMessage = null;
    });
  }

  Future<void> _uploadCover() async {
    if (_selectedCoverBase64 == null) {
      setState(() => _errorMessage = 'Please select a cover photo to upload.');
      return;
    }

    // Client-side format & size validation
    final prefix = _selectedCoverBase64!.split(';')[0];
    final allowedPrefixes = [
      'data:image/jpeg',
      'data:image/jpg',
      'data:image/png',
      'data:image/webp',
    ];
    if (!allowedPrefixes.any((p) => prefix.startsWith(p))) {
      setState(() {
        _errorMessage =
            'Invalid file format. Only JPG, PNG, and WebP images are allowed.';
      });
      return;
    }

    // Size check (< 5MB)
    final byteCount = (_selectedCoverBase64!.length * 3) / 4;
    if (byteCount > 5 * 1024 * 1024) {
      setState(() {
        _errorMessage = 'Cover photo exceeds the maximum 5MB size limit.';
      });
      return;
    }

    setState(() {
      _isUploading = true;
      _errorMessage = null;
      _successMessage = null;
    });

    try {
      final res = await _apiService.uploadCover(
        base64Image: _selectedCoverBase64!,
        fileName: 'live_cover_${DateTime.now().millisecondsSinceEpoch}.jpg',
      );

      if (!mounted) return;
      setState(() => _isUploading = false);

      if (res.isSuccess && res.data != null) {
        final data = res.data as Map<String, dynamic>;
        setState(() {
          _activeCoverUrl = data['coverUrl']?.toString();
          _successMessage = 'Cover photo uploaded and verified successfully!';
        });

        await _repository.fetchGatesStatus(forceRefresh: true);

        // Auto return after success
        Future.delayed(const Duration(milliseconds: 1400), () {
          if (mounted) Navigator.of(context).pop(true);
        });
      } else {
        setState(() {
          _errorMessage =
              res.errorMessage ??
              'Failed to upload cover photo. Please try again.';
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isUploading = false;
        _errorMessage = 'Network connection failed: $e';
      });
    }
  }

  Future<void> _deleteCover() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: PopoTheme.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text(
          'Remove Cover Photo',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        content: const Text(
          'Are you sure you want to remove your broadcast cover? You will need to upload a new cover before broadcasting.',
          style: TextStyle(color: PopoTheme.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text(
              'Cancel',
              style: TextStyle(color: PopoTheme.textSecondary),
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: PopoTheme.primary),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Remove', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() {
      _isDeleting = true;
      _errorMessage = null;
    });

    try {
      final res = await _apiService.deleteCover();
      if (!mounted) return;
      setState(() => _isDeleting = false);

      if (res.isSuccess) {
        setState(() {
          _activeCoverUrl = null;
          _selectedCoverBase64 = null;
          _successMessage = 'Cover photo removed successfully.';
        });
        await _repository.fetchGatesStatus(forceRefresh: true);
      } else {
        setState(() {
          _errorMessage = res.errorMessage ?? 'Failed to delete cover photo.';
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isDeleting = false;
        _errorMessage = 'Error removing cover: $e';
      });
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
          'Broadcast Cover Photo',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          // Informative Banner
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: PopoTheme.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: PopoTheme.borderSubtle, width: 1),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: PopoTheme.gold.withOpacity(0.15),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.photo_camera_back_rounded,
                    color: PopoTheme.gold,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(
                    'Your broadcast cover is the primary preview card shown to millions of viewers on the Explore feed. High-definition portrait photos attract up to 3x more viewers.',
                    style: TextStyle(
                      color: PopoTheme.textSecondary,
                      fontSize: 13,
                      height: 1.35,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Cover Image Preview Stage (Aspect Ratio 3:4)
          Center(
            child: Container(
              width: 220,
              height: 293, // 3:4 aspect ratio
              decoration: BoxDecoration(
                color: PopoTheme.surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: _activeCoverUrl != null
                      ? PopoTheme.cyan
                      : (_selectedCoverBase64 != null
                            ? PopoTheme.primary
                            : PopoTheme.borderSubtle),
                  width: 2,
                ),
                boxShadow: [
                  BoxShadow(
                    color:
                        (_activeCoverUrl != null
                                ? PopoTheme.cyan
                                : PopoTheme.primary)
                            .withOpacity(0.15),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(18),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    if (_selectedCoverBase64 != null) ...[
                      // Memory image from base64
                      Container(
                        color: const Color(0xFF1F1F2E),
                        child: Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: const [
                              Icon(
                                Icons.image_rounded,
                                color: PopoTheme.cyan,
                                size: 56,
                              ),
                              SizedBox(height: 8),
                              Text(
                                'Cover Selected',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              SizedBox(height: 4),
                              Text(
                                'Ready to Upload',
                                style: TextStyle(
                                  color: PopoTheme.textSecondary,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ] else if (_activeCoverUrl != null) ...[
                      // Existing verified cover placeholder
                      Container(
                        color: const Color(0xFF1E1E2D),
                        child: Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(
                                Icons.verified_rounded,
                                color: PopoTheme.cyan,
                                size: 56,
                              ),
                              const SizedBox(height: 10),
                              const Text(
                                'Verified Cover',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _activeCoverUrl!,
                                style: const TextStyle(
                                  color: PopoTheme.textSecondary,
                                  fontSize: 10,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ] else ...[
                      Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(
                            Icons.add_photo_alternate_rounded,
                            color: PopoTheme.textSecondary,
                            size: 48,
                          ),
                          SizedBox(height: 10),
                          Text(
                            'No Cover Uploaded',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Select from presets below',
                            style: TextStyle(
                              color: PopoTheme.textSecondary,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ],

                    // Badge
                    Positioned(
                      top: 10,
                      left: 10,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: _activeCoverUrl != null
                              ? PopoTheme.cyan
                              : PopoTheme.primary,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          _activeCoverUrl != null ? 'VERIFIED' : '3:4 RATIO',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Presets title
          const Text(
            'Select Broadcast Cover',
            style: TextStyle(
              color: Colors.white,
              fontSize: 15,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 10),

          // Preset options
          Row(
            children: _presetCovers.map((preset) {
              final isSelected = _selectedCoverBase64 == preset['data'];
              return Expanded(
                child: GestureDetector(
                  onTap: () => _selectPreset(preset),
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    decoration: BoxDecoration(
                      color: PopoTheme.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSelected
                            ? PopoTheme.primary
                            : PopoTheme.borderSubtle,
                        width: isSelected ? 2 : 1,
                      ),
                    ),
                    child: Column(
                      children: [
                        Icon(
                          Icons.portrait_rounded,
                          color: isSelected
                              ? PopoTheme.primary
                              : PopoTheme.textSecondary,
                          size: 28,
                        ),
                        const SizedBox(height: 6),
                        Text(
                          preset['label']!,
                          style: TextStyle(
                            color: isSelected
                                ? Colors.white
                                : PopoTheme.textSecondary,
                            fontSize: 11,
                            fontWeight: isSelected
                                ? FontWeight.bold
                                : FontWeight.normal,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 20),

          // Specifications
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF1E1E2D),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text(
                  'Upload Requirements:',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  '• Supported formats: JPG, PNG, WebP\n• Maximum file size: 5 MB\n• Recommended resolution: 720 x 960 (3:4 ratio)',
                  style: TextStyle(
                    color: PopoTheme.textSecondary,
                    fontSize: 11,
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Error / Success Feedback
          if (_errorMessage != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: PopoTheme.primary.withOpacity(0.12),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: PopoTheme.primary.withOpacity(0.4)),
              ),
              child: Text(
                _errorMessage!,
                style: const TextStyle(color: PopoTheme.primary, fontSize: 13),
              ),
            ),
            const SizedBox(height: 16),
          ],

          if (_successMessage != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF00C853).withOpacity(0.12),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: const Color(0xFF00C853).withOpacity(0.4),
                ),
              ),
              child: Text(
                _successMessage!,
                style: const TextStyle(
                  color: Color(0xFF00C853),
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Upload CTA Button
          PopoPrimaryButton(
            text: _isUploading ? 'Uploading & Verifying...' : 'Upload Cover',
            isLoading: _isUploading,
            onPressed: _isUploading || _selectedCoverBase64 == null
                ? null
                : _uploadCover,
          ),

          if (_activeCoverUrl != null) ...[
            const SizedBox(height: 12),
            PopoSecondaryButton(
              text: _isDeleting ? 'Removing...' : 'Remove Current Cover',
              isLoading: _isDeleting,
              borderColor: PopoTheme.primary.withOpacity(0.5),
              textColor: PopoTheme.primary,
              onPressed: _isDeleting ? null : _deleteCover,
            ),
          ],
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}
