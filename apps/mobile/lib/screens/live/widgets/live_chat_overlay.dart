import 'package:flutter/material.dart';

import '../../../theme/popo_theme.dart';
import '../../../models/live/live_models.dart';
import '../../../services/live/live_session_manager.dart';
import 'live_safety_modal.dart';

/// Professional Live Chat Overlay for Host Studio and Viewer Room
/// Displays scrollable chat feed, wealth badges, moderation trigger, and chat input.
class LiveChatOverlay extends StatefulWidget {
  final bool isHost;
  final VoidCallback? onHeartTap;
  final VoidCallback? onGiftTap;

  const LiveChatOverlay({
    Key? key,
    this.isHost = false,
    this.onHeartTap,
    this.onGiftTap,
  }) : super(key: key);

  @override
  State<LiveChatOverlay> createState() => _LiveChatOverlayState();
}

class _LiveChatOverlayState extends State<LiveChatOverlay> {
  final LiveSessionManager _sessionManager = LiveSessionManager.instance;
  final TextEditingController _chatController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  bool _isSending = false;
  int _lastMessageCount = 0;

  @override
  void initState() {
    super.initState();
    _sessionManager.addListener(_onMessagesUpdated);
  }

  @override
  void dispose() {
    _sessionManager.removeListener(_onMessagesUpdated);
    _chatController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onMessagesUpdated() {
    final count = _sessionManager.chatMessages.length;
    if (count != _lastMessageCount) {
      _lastMessageCount = count;
      _scrollToBottom();
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _handleSendMessage() async {
    final text = _chatController.text.trim();
    if (text.isEmpty || _isSending) return;

    if (text.length > 300) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Message cannot exceed 300 characters.'),
          backgroundColor: PopoTheme.warning,
        ),
      );
      return;
    }

    setState(() => _isSending = true);
    _chatController.clear();

    final success = await _sessionManager.sendChatMessage(
      text,
      senderRole: widget.isHost ? 'host' : 'viewer',
    );

    if (mounted) {
      setState(() => _isSending = false);
      if (!success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to send message. Please try again.'),
            backgroundColor: PopoTheme.danger,
          ),
        );
      } else {
        _scrollToBottom();
      }
    }
  }

  void _addEmoji(String emoji) {
    _chatController.text = '${_chatController.text}$emoji';
    _chatController.selection = TextSelection.fromPosition(
      TextPosition(offset: _chatController.text.length),
    );
  }

  void _openModerationModal(LiveChatMessage msg) {
    LiveSafetyModal.show(
      context: context,
      targetUserId: msg.senderId,
      targetNickname: msg.senderNickname,
      targetAvatarUrl: msg.senderAvatarUrl,
      targetRole: msg.senderRole,
      targetWealthLevel: msg.wealthLevel,
      isHostViewer: widget.isHost,
    );
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _sessionManager,
      builder: (context, _) {
        final messages = _sessionManager.chatMessages;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            // 1. Live Chat Message List (max height 220)
            SizedBox(
              height: 220,
              child: ShaderMask(
                shaderCallback: (Rect bounds) {
                  return const LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Colors.transparent, Colors.black],
                    stops: [0.0, 0.25],
                  ).createShader(bounds);
                },
                blendMode: BlendMode.dstIn,
                child: messages.isEmpty
                    ? _buildEmptyState()
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 8,
                        ),
                        itemCount: messages.length,
                        itemBuilder: (ctx, idx) =>
                            _buildMessageBubble(messages[idx]),
                      ),
              ),
            ),

            const SizedBox(height: 8),

            // 2. Quick Emoji Bar
            Container(
              height: 32,
              padding: const EdgeInsets.symmetric(horizontal: 14),
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  _buildEmojiChip('❤️'),
                  _buildEmojiChip('👏'),
                  _buildEmojiChip('🔥'),
                  _buildEmojiChip('🌹'),
                  _buildEmojiChip('😍'),
                  _buildEmojiChip('🎉'),
                  _buildEmojiChip('👋'),
                ],
              ),
            ),

            const SizedBox(height: 6),

            // 3. Bottom Chat Input Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              child: Row(
                children: [
                  // Text input container
                  Expanded(
                    child: Container(
                      height: 42,
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.55),
                        borderRadius: BorderRadius.circular(22),
                        border: Border.all(
                          color: Colors.white.withOpacity(0.12),
                          width: 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          const SizedBox(width: 14),
                          Expanded(
                            child: TextField(
                              controller: _chatController,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                              ),
                              maxLength: 300,
                              buildCounter: (
                                _, {
                                required int currentLength,
                                required bool isFocused,
                                int? maxLength,
                              }) => null,
                              decoration: InputDecoration(
                                hintText: widget.isHost
                                    ? 'Chat with viewers...'
                                    : 'Say something nice...',
                                hintStyle: const TextStyle(
                                  color: Colors.white38,
                                  fontSize: 13,
                                ),
                                border: InputBorder.none,
                                isDense: true,
                                contentPadding: EdgeInsets.zero,
                              ),
                              onSubmitted: (_) => _handleSendMessage(),
                            ),
                          ),
                          IconButton(
                            icon: _isSending
                                ? const SizedBox(
                                    width: 14,
                                    height: 14,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: PopoTheme.primary,
                                    ),
                                  )
                                : const Icon(
                                    Icons.send_rounded,
                                    color: PopoTheme.primary,
                                    size: 20,
                                  ),
                            onPressed: _isSending ? null : _handleSendMessage,
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Floating heart reaction button
                  if (widget.onHeartTap != null) ...[
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: widget.onHeartTap,
                      child: Container(
                        width: 42,
                        height: 42,
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.55),
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: PopoTheme.primary.withOpacity(0.35),
                          ),
                        ),
                        child: const Icon(
                          Icons.favorite_rounded,
                          color: PopoTheme.primary,
                          size: 20,
                        ),
                      ),
                    ),
                  ],

                  // Gift Sending action button
                  if (widget.onGiftTap != null) ...[
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: widget.onGiftTap,
                      child: Container(
                        width: 42,
                        height: 42,
                        decoration: BoxDecoration(
                          color: const Color(0xFF251F38),
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: const Color(0xFFFFB800).withOpacity(0.6),
                            width: 1.5,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFFFB800).withOpacity(0.2),
                              blurRadius: 8,
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.card_giftcard_rounded,
                          color: Color(0xFFFFB800),
                          size: 20,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.black38,
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Text(
          'Say hello to start the conversation! ✨',
          style: TextStyle(color: Colors.white60, fontSize: 12),
        ),
      ),
    );
  }

  Widget _buildEmojiChip(String emoji) {
    return GestureDetector(
      onTap: () => _addEmoji(emoji),
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.4),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white12),
        ),
        child: Center(child: Text(emoji, style: const TextStyle(fontSize: 14))),
      ),
    );
  }

  Widget _buildMessageBubble(LiveChatMessage msg) {
    final isHostMsg = msg.senderRole == 'host';
    final nameColor = isHostMsg ? PopoTheme.primary : PopoTheme.cyan;

    return GestureDetector(
      onTap: () => _openModerationModal(msg),
      onLongPress: () => _openModerationModal(msg),
      child: Container(
        margin: const EdgeInsets.only(bottom: 6),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.5),
          borderRadius: BorderRadius.circular(12),
          border: isHostMsg
              ? Border.all(color: PopoTheme.primary.withOpacity(0.3), width: 1)
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Wealth or Role Badge
            if (isHostMsg)
              Container(
                margin: const EdgeInsets.only(right: 6, top: 1),
                padding: const EdgeInsets.symmetric(
                  horizontal: 5,
                  vertical: 1.5,
                ),
                decoration: BoxDecoration(
                  color: PopoTheme.primary,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Text(
                  'HOST',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 8.5,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              )
            else
              Container(
                margin: const EdgeInsets.only(right: 6, top: 1),
                padding: const EdgeInsets.symmetric(
                  horizontal: 5,
                  vertical: 1.5,
                ),
                decoration: BoxDecoration(
                  color: PopoTheme.gold.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: PopoTheme.gold.withOpacity(0.4)),
                ),
                child: Text(
                  'W.Lv ${msg.wealthLevel}',
                  style: const TextStyle(
                    color: PopoTheme.gold,
                    fontSize: 8.5,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),

            // Nickname and Content
            Flexible(
              child: RichText(
                text: TextSpan(
                  children: [
                    TextSpan(
                      text: '${msg.senderNickname}: ',
                      style: TextStyle(
                        color: nameColor,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    TextSpan(
                      text: msg.displayContent,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        height: 1.25,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(width: 6),
            // Timestamp
            Text(
              msg.formattedTime,
              style: const TextStyle(color: Colors.white38, fontSize: 9),
            ),
          ],
        ),
      ),
    );
  }
}
