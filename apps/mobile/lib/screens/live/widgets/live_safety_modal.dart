import 'package:flutter/material.dart';

import '../../../theme/popo_theme.dart';
import '../../../models/live/live_models.dart';
import '../../../services/live/live_session_manager.dart';
import '../live_rules_screen.dart';

/// Interactive Moderation & Safety Modal for Live Streams
/// Allows hosts and viewers to mute, block, or report participants with confirmed backend actions.
class LiveSafetyModal {
  static Future<void> show({
    required BuildContext context,
    required String targetUserId,
    required String targetNickname,
    String? targetAvatarUrl,
    String targetRole = 'viewer',
    int targetWealthLevel = 1,
    bool isHostViewer = false,
  }) async {
    final sessionManager = LiveSessionManager.instance;
    final isBlocked = sessionManager.isUserBlocked(targetUserId);
    final isMuted = sessionManager.isUserMuted(targetUserId);

    await showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => _LiveSafetySheet(
        targetUserId: targetUserId,
        targetNickname: targetNickname,
        targetAvatarUrl: targetAvatarUrl,
        targetRole: targetRole,
        targetWealthLevel: targetWealthLevel,
        isHostViewer: isHostViewer,
        isBlocked: isBlocked,
        isMuted: isMuted,
      ),
    );
  }
}

class _LiveSafetySheet extends StatefulWidget {
  final String targetUserId;
  final String targetNickname;
  final String? targetAvatarUrl;
  final String targetRole;
  final int targetWealthLevel;
  final bool isHostViewer;
  final bool isBlocked;
  final bool isMuted;

  const _LiveSafetySheet({
    required this.targetUserId,
    required this.targetNickname,
    this.targetAvatarUrl,
    required this.targetRole,
    required this.targetWealthLevel,
    required this.isHostViewer,
    required this.isBlocked,
    required this.isMuted,
  });

  @override
  State<_LiveSafetySheet> createState() => _LiveSafetySheetState();
}

class _LiveSafetySheetState extends State<_LiveSafetySheet> {
  final LiveSessionManager _sessionManager = LiveSessionManager.instance;
  late bool _isBlocked;
  late bool _isMuted;
  bool _isProcessing = false;

  @override
  void initState() {
    super.initState();
    _isBlocked = widget.isBlocked;
    _isMuted = widget.isMuted;
  }

  Future<void> _handleMuteToggle() async {
    setState(() => _isProcessing = true);
    if (_isMuted) {
      final success = await _sessionManager.unmuteUser(
        targetUserId: widget.targetUserId,
        muteType: widget.isHostViewer ? 'room_global' : 'viewer_local',
      );
      if (mounted) {
        setState(() {
          _isProcessing = false;
          if (success) _isMuted = false;
        });
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${widget.targetNickname} has been unmuted.'),
            backgroundColor: PopoTheme.surface,
          ),
        );
      }
    } else {
      final muteType = widget.isHostViewer ? 'room_global' : 'viewer_local';
      final res = await _sessionManager.muteUser(
        targetUserId: widget.targetUserId,
        targetNickname: widget.targetNickname,
        muteType: muteType,
      );
      if (mounted) {
        setState(() {
          _isProcessing = false;
          if (res.success) _isMuted = true;
        });
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(res.message ?? 'User has been muted.'),
            backgroundColor: PopoTheme.surface,
          ),
        );
      }
    }
  }

  Future<void> _handleBlockToggle() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (dCtx) => AlertDialog(
        backgroundColor: PopoTheme.surface,
        title: Text(
          _isBlocked ? 'Unblock User?' : 'Block ${widget.targetNickname}?',
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        content: Text(
          _isBlocked
              ? 'This user will be unblocked and their messages will become visible.'
              : 'Are you sure you want to block ${widget.targetNickname}? You will not see their messages or broadcasts.',
          style: const TextStyle(color: PopoTheme.textSecondary, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dCtx, false),
            child: const Text(
              'Cancel',
              style: TextStyle(color: Colors.white60),
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: _isBlocked ? PopoTheme.cyan : PopoTheme.danger,
            ),
            onPressed: () => Navigator.pop(dCtx, true),
            child: Text(
              _isBlocked ? 'Unblock' : 'Block',
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _isProcessing = true);
    if (_isBlocked) {
      final success = await _sessionManager.unblockUser(
        targetUserId: widget.targetUserId,
      );
      if (mounted) {
        setState(() {
          _isProcessing = false;
          if (success) _isBlocked = false;
        });
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${widget.targetNickname} has been unblocked.'),
            backgroundColor: PopoTheme.surface,
          ),
        );
      }
    } else {
      final res = await _sessionManager.blockUser(
        targetUserId: widget.targetUserId,
        targetNickname: widget.targetNickname,
      );
      if (mounted) {
        setState(() {
          _isProcessing = false;
          if (res.success) _isBlocked = true;
        });
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(res.message ?? 'User has been blocked.'),
            backgroundColor: PopoTheme.surface,
          ),
        );
      }
    }
  }

  void _openReportDialog() {
    Navigator.pop(context);
    showDialog(
      context: context,
      builder: (rCtx) => _ReportDialog(
        targetUserId: widget.targetUserId,
        targetNickname: widget.targetNickname,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final initials = widget.targetNickname.isNotEmpty
        ? widget.targetNickname[0].toUpperCase()
        : 'U';

    final isTargetHost = widget.targetRole == 'host';
    final canMute = !isTargetHost || widget.isHostViewer;

    return Container(
      decoration: const BoxDecoration(
        color: PopoTheme.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        border: Border(
          top: BorderSide(color: PopoTheme.borderSubtle, width: 1),
        ),
      ),
      padding: EdgeInsets.only(
        top: 16,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Drag handle
            Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),

            // User Identity Header
            Row(
              children: [
                CircleAvatar(
                  radius: 26,
                  backgroundColor: PopoTheme.primary.withOpacity(0.2),
                  backgroundImage:
                      widget.targetAvatarUrl != null &&
                          widget.targetAvatarUrl!.startsWith('http')
                      ? NetworkImage(widget.targetAvatarUrl!)
                      : null,
                  child:
                      (widget.targetAvatarUrl == null ||
                          !widget.targetAvatarUrl!.startsWith('http'))
                      ? Text(
                          initials,
                          style: const TextStyle(
                            color: PopoTheme.primary,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        )
                      : null,
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
                              widget.targetNickname,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 8),
                          if (widget.targetRole == 'host')
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: PopoTheme.primary,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Text(
                                'HOST',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            )
                          else
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: PopoTheme.gold.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(
                                  color: PopoTheme.gold.withOpacity(0.5),
                                ),
                              ),
                              child: Text(
                                'W.Lv ${widget.targetWealthLevel}',
                                style: const TextStyle(
                                  color: PopoTheme.gold,
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'ID: ${widget.targetUserId.length > 12 ? widget.targetUserId.substring(0, 12) + "..." : widget.targetUserId}',
                        style: const TextStyle(
                          color: PopoTheme.textSecondary,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 20),
            const Divider(color: PopoTheme.borderSubtle, height: 1),
            const SizedBox(height: 12),

            // Action 1: Mute
            if (canMute)
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: (_isMuted ? PopoTheme.cyan : PopoTheme.warning)
                        .withOpacity(0.15),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    _isMuted
                        ? Icons.volume_up_rounded
                        : Icons.volume_off_rounded,
                    color: _isMuted ? PopoTheme.cyan : PopoTheme.warning,
                    size: 20,
                  ),
                ),
                title: Text(
                  _isMuted
                      ? 'Unmute ${widget.targetNickname}'
                      : widget.isHostViewer
                      ? 'Mute in Room (Room-wide)'
                      : 'Mute for Me',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                subtitle: Text(
                  _isMuted
                      ? 'Allow messages from this user to appear again'
                      : widget.isHostViewer
                      ? 'Hide this user messages for all viewers in the room'
                      : 'Hide this user messages in your chat feed',
                  style: const TextStyle(
                    color: PopoTheme.textSecondary,
                    fontSize: 11,
                  ),
                ),
                trailing: _isProcessing
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(
                        Icons.chevron_right_rounded,
                        color: PopoTheme.textSecondary,
                      ),
                onTap: _isProcessing ? null : _handleMuteToggle,
              ),

            // Action 2: Block User
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: (_isBlocked ? PopoTheme.cyan : PopoTheme.danger)
                      .withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  _isBlocked ? Icons.check_circle_outline : Icons.block_rounded,
                  color: _isBlocked ? PopoTheme.cyan : PopoTheme.danger,
                  size: 20,
                ),
              ),
              title: Text(
                _isBlocked
                    ? 'Unblock ${widget.targetNickname}'
                    : 'Block ${widget.targetNickname}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              subtitle: Text(
                _isBlocked
                    ? 'Remove user from your blacklist'
                    : 'Prevent interactions and hide their live streams',
                style: const TextStyle(
                  color: PopoTheme.textSecondary,
                  fontSize: 11,
                ),
              ),
              trailing: _isProcessing
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(
                      Icons.chevron_right_rounded,
                      color: PopoTheme.textSecondary,
                    ),
              onTap: _isProcessing ? null : _handleBlockToggle,
            ),

            // Action 3: Report User
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: PopoTheme.primary.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.flag_rounded,
                  color: PopoTheme.primary,
                  size: 20,
                ),
              ),
              title: const Text(
                'Report User or Content',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              subtitle: const Text(
                'Submit an abuse report to safety moderators',
                style: TextStyle(color: PopoTheme.textSecondary, fontSize: 11),
              ),
              trailing: const Icon(
                Icons.chevron_right_rounded,
                color: PopoTheme.textSecondary,
              ),
              onTap: _openReportDialog,
            ),

            // Action 4: Community Guidelines
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: PopoTheme.cyan.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.shield_rounded,
                  color: PopoTheme.cyan,
                  size: 20,
                ),
              ),
              title: const Text(
                'Live Community Rules',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              subtitle: const Text(
                'Review Popo Live streaming terms and policies',
                style: TextStyle(color: PopoTheme.textSecondary, fontSize: 11),
              ),
              trailing: const Icon(
                Icons.chevron_right_rounded,
                color: PopoTheme.textSecondary,
              ),
              onTap: () {
                Navigator.pop(context);
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const LiveRulesScreen()),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _ReportDialog extends StatefulWidget {
  final String targetUserId;
  final String targetNickname;

  const _ReportDialog({
    required this.targetUserId,
    required this.targetNickname,
  });

  @override
  State<_ReportDialog> createState() => _ReportDialogState();
}

class _ReportDialogState extends State<_ReportDialog> {
  final LiveSessionManager _sessionManager = LiveSessionManager.instance;
  final TextEditingController _descController = TextEditingController();
  String _selectedReason = 'harassment_bullying';
  bool _isSubmitting = false;
  String? _errorMessage;

  @override
  void dispose() {
    _descController.dispose();
    super.dispose();
  }

  Future<void> _submitReport() async {
    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    final res = await _sessionManager.reportUser(
      reportedUserId: widget.targetUserId,
      reason: _selectedReason,
      reportedNickname: widget.targetNickname,
      description: _descController.text.trim(),
    );

    if (!mounted) return;

    if (res.success) {
      Navigator.pop(context);
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: PopoTheme.surface,
          title: Row(
            children: const [
              Icon(Icons.check_circle_rounded, color: Color(0xFF00C853)),
              SizedBox(width: 8),
              Text(
                'Report Submitted',
                style: TextStyle(color: Colors.white, fontSize: 16),
              ),
            ],
          ),
          content: Text(
            res.message ??
                'Thank you. Your report (${res.reportCode ?? ""}) has been submitted to the moderation team.',
            style: const TextStyle(
              color: PopoTheme.textSecondary,
              fontSize: 13,
            ),
          ),
          actions: [
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: PopoTheme.primary,
              ),
              onPressed: () => Navigator.pop(ctx),
              child: const Text('OK', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );
    } else {
      setState(() {
        _isSubmitting = false;
        _errorMessage =
            res.error ?? 'Failed to submit report. Please try again.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: PopoTheme.surface,
      title: Text(
        'Report ${widget.targetNickname}',
        style: const TextStyle(
          color: Colors.white,
          fontSize: 16,
          fontWeight: FontWeight.bold,
        ),
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Select a reason:',
              style: TextStyle(color: PopoTheme.textSecondary, fontSize: 12),
            ),
            const SizedBox(height: 8),

            // Reason selector
            ...LiveReportReason.canonicalReasons.map((reason) {
              return RadioListTile<String>(
                contentPadding: EdgeInsets.zero,
                dense: true,
                value: reason.id,
                groupValue: _selectedReason,
                activeColor: PopoTheme.primary,
                title: Text(
                  reason.label,
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                ),
                onChanged: (val) {
                  if (val != null) setState(() => _selectedReason = val);
                },
              );
            }),

            const SizedBox(height: 12),
            const Text(
              'Additional Details (Optional):',
              style: TextStyle(color: PopoTheme.textSecondary, fontSize: 12),
            ),
            const SizedBox(height: 6),
            TextField(
              controller: _descController,
              maxLength: 500,
              maxLines: 3,
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: InputDecoration(
                hintText: 'Describe the issue...',
                hintStyle: const TextStyle(color: Colors.white30, fontSize: 12),
                filled: true,
                fillColor: Colors.black26,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: PopoTheme.borderSubtle),
                ),
              ),
            ),

            if (_errorMessage != null) ...[
              const SizedBox(height: 8),
              Text(
                _errorMessage!,
                style: const TextStyle(color: PopoTheme.danger, fontSize: 12),
              ),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _isSubmitting ? null : () => Navigator.pop(context),
          child: const Text('Cancel', style: TextStyle(color: Colors.white60)),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: PopoTheme.primary),
          onPressed: _isSubmitting ? null : _submitReport,
          child: _isSubmitting
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              : const Text(
                  'Submit Report',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
        ),
      ],
    );
  }
}
