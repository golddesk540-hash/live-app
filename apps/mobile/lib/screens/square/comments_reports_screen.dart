import 'package:flutter/material.dart';

class CommentsReportsScreen extends StatefulWidget {
  const CommentsReportsScreen({super.key});

  @override
  State<CommentsReportsScreen> createState() => _CommentsReportsScreenState();
}

class _CommentsReportsScreenState extends State<CommentsReportsScreen> {
  final TextEditingController _commentController = TextEditingController();
  final List<_DemoComment> _comments = [
    _DemoComment(
      id: 'c_1',
      author: 'Mina Official',
      text: 'This looks amazing! Saved a front seat for tonight',
      timestamp: '1h ago',
      likes: 14,
      replies: [
        _DemoReply(
          id: 'r_1',
          author: 'Ayesha Khan',
          text: 'Front row VIP seat is waiting for you!',
          timestamp: '52m ago',
        ),
      ],
    ),
    _DemoComment(
      id: 'c_2',
      author: 'Hamza Ali',
      text: 'Great energy on stage tonight',
      timestamp: '42m ago',
      likes: 9,
      replies: [],
    ),
  ];

  static const List<String> _reportReasons = [
    'Spam',
    'Harassment or bullying',
    'Hate speech',
    'Inappropriate content',
    'Violence or threats',
    'Fake or misleading information',
    'Other',
  ];

  final Set<String> _reportedIds = {};
  String? _replyingToCommentId;
  String? _validationError;

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  void _submitText() {
    final text = _commentController.text.trim();
    if (text.isEmpty) {
      setState(() {
        _validationError = 'Please enter a comment before posting.';
      });
      return;
    }
    setState(() {
      _validationError = null;
      if (_replyingToCommentId != null) {
        final target = _comments.firstWhere((c) => c.id == _replyingToCommentId);
        target.replies.add(
          _DemoReply(
            id: 'r_${DateTime.now().millisecondsSinceEpoch}',
            author: 'You',
            text: text,
            timestamp: 'Just now',
          ),
        );
        _replyingToCommentId = null;
      } else {
        _comments.insert(
          0,
          _DemoComment(
            id: 'c_${DateTime.now().millisecondsSinceEpoch}',
            author: 'You',
            text: text,
            timestamp: 'Just now',
            likes: 0,
            isOwn: true,
            replies: [],
          ),
        );
      }
      _commentController.clear();
    });
  }

  void _openReportSheet(String targetType, String targetId, String authorName) {
    String? selectedReason;
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: const Color(0xFF120726),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Report $targetType · $authorName',
                style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 12),
              ..._reportReasons.map(
                (reason) => RadioListTile<String>(
                  dense: true,
                  value: reason,
                  groupValue: selectedReason,
                  activeColor: const Color(0xFFFF1A6C),
                  title: Text(reason, style: const TextStyle(color: Colors.white, fontSize: 13)),
                  onChanged: (val) => setModalState(() => selectedReason = val),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFFF1A6C)),
                    onPressed: selectedReason == null
                        ? null
                        : () {
                            setState(() => _reportedIds.add('$targetType:$targetId'));
                            Navigator.pop(ctx);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Demo report logged locally ($selectedReason)')),
                            );
                          },
                    child: const Text('Submit Report'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D041C),
      appBar: AppBar(
        backgroundColor: const Color(0xFF120624),
        title: const Text('Comments & Reports', style: TextStyle(fontWeight: FontWeight.w800)),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF16092D),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.purpleAccent.withValues(alpha: 0.25)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('POST', style: TextStyle(color: Color(0xFFFF1A6C), fontSize: 11, fontWeight: FontWeight.w900)),
                      const SizedBox(height: 6),
                      const Text('A beautiful day with friends!', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 4),
                      Text('Ayesha Khan · ${_comments.length} comments', style: const TextStyle(color: Colors.white60, fontSize: 12)),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                const Text('Recent comments', style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w800)),
                const SizedBox(height: 10),
                if (_comments.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 32),
                    child: Center(child: Text('No comments yet.', style: TextStyle(color: Colors.white60))),
                  )
                else
                  ..._comments.map((c) => Card(
                        color: const Color(0xFF16092D),
                        margin: const EdgeInsets.only(bottom: 10),
                        child: ListTile(
                          title: Text(c.author, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(c.text, style: const TextStyle(color: Colors.white70, fontSize: 12)),
                              Row(
                                children: [
                                  TextButton(
                                    onPressed: () => setState(() => c.isLiked ? (c.isLiked = false, c.likes--) : (c.isLiked = true, c.likes++)),
                                    child: Text('♥ ${c.likes}', style: const TextStyle(color: Color(0xFFFF4D8D), fontSize: 11)),
                                  ),
                                  TextButton(
                                    onPressed: () => setState(() => _replyingToCommentId = c.id),
                                    child: const Text('Reply', style: TextStyle(color: Colors.white70, fontSize: 11)),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          trailing: IconButton(
                            icon: Icon(c.isOwn ? Icons.delete_outline : Icons.flag_outlined, color: Colors.amberAccent),
                            onPressed: c.isOwn
                                ? () => setState(() => _comments.removeWhere((item) => item.id == c.id))
                                : () => _openReportSheet('comment', c.id, c.author),
                          ),
                        ),
                      )),
              ],
            ),
          ),
          if (_validationError != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Text(_validationError!, style: const TextStyle(color: Colors.amberAccent, fontSize: 12)),
            ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _commentController,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        hintText: _replyingToCommentId != null ? 'Write a reply...' : 'Write a comment...',
                        hintStyle: const TextStyle(color: Colors.white38),
                        filled: true,
                        fillColor: const Color(0xFF16092D),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFFF1A6C), shape: const StadiumBorder()),
                    onPressed: _submitText,
                    child: const Text('Send'),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DemoComment {
  final String id;
  final String author;
  final String text;
  final String timestamp;
  int likes;
  bool isLiked = false;
  final bool isOwn;
  final List<_DemoReply> replies;

  _DemoComment({
    required this.id,
    required this.author,
    required this.text,
    required this.timestamp,
    required this.likes,
    this.isOwn = false,
    required this.replies,
  });
}

class _DemoReply {
  final String id;
  final String author;
  final String text;
  final String timestamp;

  _DemoReply({
    required this.id,
    required this.author,
    required this.text,
    required this.timestamp,
  });
}
