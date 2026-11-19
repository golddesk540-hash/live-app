import 'package:flutter/material.dart';
import '../../theme/popo_theme.dart';
import 'message_state.dart';

/// 1:1 Direct Chat Thread Screen
class ChatThreadScreen extends StatefulWidget {
  final String threadId;

  const ChatThreadScreen({
    super.key,
    required this.threadId,
  });

  @override
  State<ChatThreadScreen> createState() => _ChatThreadScreenState();
}

class _ChatThreadScreenState extends State<ChatThreadScreen> {
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    MessageStateManager.instance.addListener(_onStateChange);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        MessageStateManager.instance.markThreadAsRead(widget.threadId);
      }
    });
  }

  @override
  void dispose() {
    MessageStateManager.instance.removeListener(_onStateChange);
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onStateChange() {
    if (mounted) {
      setState(() {});
      _scrollToBottom();
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
      }
    });
  }

  void _sendMessage() {
    final text = _inputController.text.trim();
    if (text.isEmpty) return;

    MessageStateManager.instance.sendMessage(widget.threadId, text);
    _inputController.clear();
    _scrollToBottom();
  }

  void _showProfileSheet(LocalChatThread thread) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          padding: const EdgeInsets.all(20),
          decoration: const BoxDecoration(
            color: PopoTheme.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              CircleAvatar(
                radius: 36,
                backgroundImage: NetworkImage(thread.peerAvatar),
              ),
              const SizedBox(height: 12),
              Text(
                thread.peerNickname,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'User ID: ${thread.peerUserId} · ${thread.isOnline ? "Online" : "Offline"}',
                style: const TextStyle(
                  color: PopoTheme.textSecondary,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: PopoTheme.primary,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  onPressed: () => Navigator.of(ctx).pop(),
                  child: const Text('Close Profile'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = MessageStateManager.instance;
    final thread = state.threads.firstWhere(
      (t) => t.threadId == widget.threadId,
      orElse: () => LocalChatThread(
        threadId: widget.threadId,
        peerUserId: 'unknown',
        peerNickname: 'User',
        peerAvatar:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        lastMessage: '',
        lastMessageTime: '',
        isOnline: false,
        messages: [],
      ),
    );

    return Scaffold(
      backgroundColor: PopoTheme.background,
      appBar: AppBar(
        backgroundColor: PopoTheme.surface,
        elevation: 1,
        leading: IconButton(
          key: const Key('chat_thread_back_button'),
          icon:
              const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
        titleSpacing: 0,
        title: Row(
          children: [
            Stack(
              children: [
                CircleAvatar(
                  radius: 19,
                  backgroundColor: Colors.white12,
                  backgroundImage: NetworkImage(thread.peerAvatar),
                ),
                if (thread.isOnline)
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: const Color(0xFF00E676),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: PopoTheme.surface,
                          width: 1.5,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    thread.peerNickname,
                    key: const Key('chat_thread_peer_name'),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: BoxDecoration(
                          color: thread.isOnline
                              ? const Color(0xFF00E676)
                              : Colors.white38,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        thread.isOnline ? 'Online' : 'Offline',
                        style: TextStyle(
                          color: thread.isOnline
                              ? const Color(0xFF00E676)
                              : PopoTheme.textSecondary,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            key: const Key('chat_thread_profile_button'),
            icon: const Icon(Icons.info_outline_rounded, color: Colors.white70),
            onPressed: () => _showProfileSheet(thread),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Safe messaging banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              color: PopoTheme.surface.withOpacity(0.5),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.security_rounded,
                    color: PopoTheme.gold,
                    size: 13,
                  ),
                  SizedBox(width: 6),
                  Text(
                    'Popo Live Shield: End-to-end moderated chat environment',
                    style: TextStyle(
                      color: Colors.white60,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),

            // Message List
            Expanded(
              child: thread.messages.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.chat_bubble_outline_rounded,
                            color: PopoTheme.textSecondary.withOpacity(0.6),
                            size: 40,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Say hi to ${thread.peerNickname}! 👋',
                            style: const TextStyle(
                              color: PopoTheme.textSecondary,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      key: const Key('chat_thread_message_list'),
                      controller: _scrollController,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 12,
                      ),
                      itemCount: thread.messages.length,
                      itemBuilder: (context, index) {
                        final msg = thread.messages[index];
                        return _buildMessageItem(msg);
                      },
                    ),
            ),

            // Message Composer
            _buildComposer(),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageItem(LocalChatMessage msg) {
    final isMine = msg.isMine;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Column(
        crossAxisAlignment:
            isMine ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment:
                isMine ? MainAxisAlignment.end : MainAxisAlignment.start,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Flexible(
                child: Container(
                  constraints: BoxConstraints(
                    maxWidth: MediaQuery.of(context).size.width * 0.75,
                  ),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: isMine ? null : const Color(0xFF231D38),
                    gradient: isMine
                        ? const LinearGradient(
                            colors: [
                              PopoTheme.primary,
                              Color(0xFFFF4D8D),
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          )
                        : null,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(16),
                      topRight: const Radius.circular(16),
                      bottomLeft: isMine
                          ? const Radius.circular(16)
                          : const Radius.circular(4),
                      bottomRight: isMine
                          ? const Radius.circular(4)
                          : const Radius.circular(16),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.15),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: isMine
                        ? CrossAxisAlignment.end
                        : CrossAxisAlignment.start,
                    children: [
                      Text(
                        msg.text,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          height: 1.3,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            msg.timestamp,
                            style: TextStyle(
                              color: isMine
                                  ? Colors.white70
                                  : PopoTheme.textSecondary,
                              fontSize: 10,
                            ),
                          ),
                          if (isMine) ...[
                            const SizedBox(width: 4),
                            const Icon(
                              Icons.done_all_rounded,
                              color: Colors.white70,
                              size: 12,
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildComposer() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: const BoxDecoration(
        color: PopoTheme.surface,
        border: Border(
          top: BorderSide(color: PopoTheme.borderSubtle, width: 0.8),
        ),
      ),
      child: Row(
        children: [
          // Text Input Field
          Expanded(
            child: Container(
              height: 42,
              padding: const EdgeInsets.symmetric(horizontal: 14),
              decoration: BoxDecoration(
                color: PopoTheme.background,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: PopoTheme.borderSubtle),
              ),
              child: TextField(
                key: const Key('chat_thread_input'),
                controller: _inputController,
                style: const TextStyle(color: Colors.white, fontSize: 14),
                decoration: const InputDecoration(
                  hintText: 'Type a message...',
                  hintStyle: TextStyle(
                    color: PopoTheme.textSecondary,
                    fontSize: 13,
                  ),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(vertical: 10),
                ),
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => _sendMessage(),
              ),
            ),
          ),
          const SizedBox(width: 8),

          // Send Button
          InkWell(
            key: const Key('chat_thread_send_button'),
            onTap: _sendMessage,
            borderRadius: BorderRadius.circular(22),
            child: Container(
              width: 42,
              height: 42,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [PopoTheme.primary, Color(0xFFFF4D8D)],
                ),
              ),
              child: const Icon(
                Icons.send_rounded,
                color: Colors.white,
                size: 19,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
