import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

/// ============================================================================
/// Popo Live — Phase 6 Module 6.9: PK Battle Fair Play & Anti-Cheat System
/// Exact 1:1 Design Reference: 06_09_fair_play_basics.png
/// Flutter implementation for Android & iOS
/// ============================================================================

class PKFairPlayScreen extends StatefulWidget {
  final String battleId;
  final String currentUserId;
  final String currentUserName;
  final String apiBaseUrl;
  final VoidCallback? onBack;

  const PKFairPlayScreen({
    Key? key,
    this.battleId = '00000000-0000-0000-0000-000000000603',
    this.currentUserId = 'user_viewer_9001',
    this.currentUserName = 'Ali',
    this.apiBaseUrl = 'https://kigolive.com',
    this.onBack,
  }) : super(key: key);

  @override
  State<PKFairPlayScreen> createState() => _PKFairPlayScreenState();
}

class _PKFairPlayScreenState extends State<PKFairPlayScreen> {
  bool _isUrdu = false;
  String? _expandedRuleId;

  // Colors matching 06_09_fair_play_basics.png
  static const Color _bgDark = Color(0xFF0A0618);
  static const Color _cardBg = Color(0xFF140F26);
  static const Color _borderColor = Color(0xFF2E1D4D);
  static const Color _neonGreen = Color(0xFF22C55E);
  static const Color _watermarkPill = Color(0xFF8C1B64);
  static const Color _shieldPurple = Color(0xFF9333EA);

  // 4 Canonical Rules
  final List<Map<String, String>> _rules = [
    {
      'id': 'no_fake_traffic',
      'title': 'No fake traffic',
      'titleUr': 'جعلی ٹریفک کی ممانعت',
      'summary': 'Simulated viewer traffic, bot views, or spoofed devices are strictly prohibited.',
      'summaryUr': 'جعلی ناظرین، بوٹ ٹریفک، یا مصنوعی ڈیوائسز کا استعمال سختی سے ممنوع ہے۔',
    },
    {
      'id': 'no_gift_abuse',
      'title': 'No gift abuse',
      'titleUr': 'تحائف کے غلط استعمال پر پابندی',
      'summary': 'Self-gifting, chargeback rings, or wallet fraud strictly violate platform integrity.',
      'summaryUr': 'سیلف گفٹنگ، چارج بیک یا بٹوے کا فراڈ پلیٹ فارم کے اصولوں کی خلاف ورزی ہے۔',
    },
    {
      'id': 'no_multi_account_pk',
      'title': 'No multi-account PK',
      'titleUr': 'ملٹی اکاؤنٹ پی کے ممنوع',
      'summary': 'Operating both competing host accounts in a battle is strictly forbidden.',
      'summaryUr': 'ایک ہی مقابلے میں دونوں مد مقابل اکاؤنٹس چلانا مکمل طور پر ممنوع ہے۔',
    },
    {
      'id': 'report_violations',
      'title': 'Report violations',
      'titleUr': 'خلاف ورزی کی اطلاع دیں',
      'summary': 'Real-time reporting of suspicious actions with 24/7 moderation audit review.',
      'summaryUr': 'مشکوک سرگرمیوں کی فوری اطلاع 24 گھنٹے فعال ٹیم کو دیں۔',
    },
  ];

  void _showReportSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _ReportBottomSheet(
        battleId: widget.battleId,
        currentUserId: widget.currentUserId,
        currentUserName: widget.currentUserName,
        apiBaseUrl: widget.apiBaseUrl,
        isUrdu: _isUrdu,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final textDirection = _isUrdu ? TextDirection.rtl : TextDirection.ltr;

    return Directionality(
      textDirection: textDirection,
      child: Scaffold(
        backgroundColor: _bgDark,
        body: SafeArea(
          bottom: true,
          child: Column(
            children: [
              // 1. TOP HEADER (Title: "Fair Play")
              _buildHeader(),

              // 2. HERO SECURITY SHIELD (Exact 1:1 match to 06_09_fair_play_basics.png)
              _buildHeroShield(),

              // 3. FOUR CANONICAL RULES CARDS
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  itemCount: _rules.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final rule = _rules[index];
                    return _buildRuleCard(rule);
                  },
                ),
              ),

              // 4. BOTTOM WATERMARK BADGE ("6.9 Fair Play Basics")
              _buildWatermark(),
            ],
          ),
        ),
      ),
    );
  }

  // --- 1. Top Header ---
  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Back button
          GestureDetector(
            onTap: widget.onBack ?? () => Navigator.of(context).maybePop(),
            child: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.08),
                shape: BoxShape.circle,
              ),
              child: Icon(
                _isUrdu ? Icons.arrow_forward_ios : Icons.arrow_back_ios_new,
                color: Colors.white70,
                size: 16,
              ),
            ),
          ),

          // Title
          Text(
            _isUrdu ? 'فیئر پلے' : 'Fair Play',
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w900,
              fontSize: 20,
              letterSpacing: 0.5,
            ),
          ),

          // Language Switcher
          GestureDetector(
            onTap: () => setState(() => _isUrdu = !_isUrdu),
            child: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.language,
                color: Color(0xFFFF2D78),
                size: 18,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // --- 2. Hero Security Shield ---
  Widget _buildHeroShield() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 24),
      alignment: Alignment.center,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Radial Purple Nebula
          Container(
            width: 140,
            height: 140,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  const Color(0xFFA855F7).withOpacity(0.35),
                  Colors.transparent,
                ],
              ),
            ),
          ),

          // Purple Shield Badge
          Container(
            width: 96,
            height: 104,
            decoration: BoxDecoration(
              color: _shieldPurple,
              borderRadius: BorderRadius.circular(22),
              border: Border.all(
                color: const Color(0xFFC084FC).withOpacity(0.7),
                width: 2.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFA855F7).withOpacity(0.6),
                  blurRadius: 28,
                  spreadRadius: 2,
                ),
              ],
            ),
            child: const Center(
              child: Icon(
                Icons.check,
                color: Colors.white,
                size: 50,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // --- 3. Canonical Rule Card ---
  Widget _buildRuleCard(Map<String, String> rule) {
    final isReport = rule['id'] == 'report_violations';
    final isExpanded = _expandedRuleId == rule['id'];

    return GestureDetector(
      onTap: () {
        if (isReport) {
          _showReportSheet();
        } else {
          setState(() {
            _expandedRuleId = isExpanded ? null : rule['id'];
          });
        }
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: _cardBg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isExpanded ? const Color(0xFFA855F7) : _borderColor,
            width: 1.2,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.3),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                // Green Circle with White Checkmark (Exact Match)
                Container(
                  width: 32,
                  height: 32,
                  decoration: const BoxDecoration(
                    color: _neonGreen,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.check,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 14),

                // Rule Title
                Expanded(
                  child: Text(
                    _isUrdu ? rule['titleUr']! : rule['title']!,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                      fontSize: 15,
                    ),
                  ),
                ),

                if (isReport)
                  const Icon(Icons.chevron_right, color: Colors.white38, size: 20),
              ],
            ),
            if (isExpanded) ...[
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.only(left: 46),
                child: Text(
                  _isUrdu ? rule['summaryUr']! : rule['summary']!,
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.7),
                    fontSize: 12,
                    height: 1.4,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  // --- 4. Bottom Watermark Pill ("6.9 Fair Play Basics") ---
  Widget _buildWatermark() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      alignment: Alignment.center,
      child: Container(
        width: 240,
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF831843), Color(0xFF881337), Color(0xFF9F1239)],
          ),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFFF2D78).withOpacity(0.4)),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF9F1239).withOpacity(0.5),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Text(
          _isUrdu ? '6.9 فیئر پلے اصول' : '6.9 Fair Play Basics',
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w900,
            fontSize: 14,
            letterSpacing: 0.3,
          ),
        ),
      ),
    );
  }
}

/// ============================================================================
/// PK Abuse Report Bottom Sheet
/// ============================================================================
class _ReportBottomSheet extends StatefulWidget {
  final String battleId;
  final String currentUserId;
  final String currentUserName;
  final String apiBaseUrl;
  final bool isUrdu;

  const _ReportBottomSheet({
    required this.battleId,
    required this.currentUserId,
    required this.currentUserName,
    required this.apiBaseUrl,
    required this.isUrdu,
  });

  @override
  State<_ReportBottomSheet> createState() => _ReportBottomSheetState();
}

class _ReportBottomSheetState extends State<_ReportBottomSheet> {
  String _selectedCategory = 'score_manipulation';
  final TextEditingController _descController = TextEditingController();
  bool _isSubmitting = false;
  String? _statusMessage;
  bool _isSuccess = false;

  final List<Map<String, String>> _categories = [
    {'id': 'score_manipulation', 'name': 'Score Manipulation', 'nameUr': 'اسکور میں ہیرا پھیری'},
    {'id': 'fake_traffic', 'name': 'Fake Traffic / Bots', 'nameUr': 'جعلی ٹریفک / بوٹس'},
    {'id': 'gift_abuse', 'name': 'Gift / Coin Laundering', 'nameUr': 'تحائف یا سکوں کا غلط استعمال'},
    {'id': 'multi_account', 'name': 'Multi-Account Operation', 'nameUr': 'ملٹی اکاؤنٹ پی کے'},
    {'id': 'cheating', 'name': 'Cheating & Exploits', 'nameUr': 'دھوکہ دہی اور خرابیوں کا استحصال'},
    {'id': 'invitation_abuse', 'name': 'Invitation Flooding', 'nameUr': 'دعوت ناموں کی بھرمار'},
    {'id': 'spam', 'name': 'Chat / Reaction Spam', 'nameUr': 'چیٹ یا ری ایکشن سپیم'},
    {'id': 'other', 'name': 'Other Violation', 'nameUr': 'دیگر خلاف ورزی'},
  ];

  Future<void> _submitReport() async {
    final text = _descController.text.trim();
    if (text.length < 5) {
      setState(() {
        _statusMessage = widget.isUrdu ? 'براہ کرم مزید تفصیلات فراہم کریں' : 'Please provide at least 5 characters.';
        _isSuccess = false;
      });
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final url = Uri.parse('${widget.apiBaseUrl}/api/pk/security/report');
      final res = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'battleId': widget.battleId,
          'reporterId': widget.currentUserId,
          'reporterName': widget.currentUserName,
          'reportedUserId': '00000000-0000-0000-0000-000000088202',
          'reportedUserName': 'Ayesha',
          'category': _selectedCategory,
          'description': text,
        }),
      ).timeout(const Duration(seconds: 4));

      final data = jsonDecode(res.body);
      if (res.statusCode == 201 && data['success'] == true) {
        setState(() {
          _isSubmitting = false;
          _isSuccess = true;
          _statusMessage = widget.isUrdu ? 'رپورٹ کامیابی کے ساتھ جمع ہو گئی ہے۔' : 'Report submitted successfully.';
        });
        await Future.delayed(const Duration(seconds: 2));
        if (mounted) Navigator.pop(context);
      } else {
        setState(() {
          _isSubmitting = false;
          _isSuccess = false;
          _statusMessage = data['error'] ?? 'Submission failed';
        });
      }
    } catch (_) {
      setState(() {
        _isSubmitting = false;
        _isSuccess = false;
        _statusMessage = 'Network error submitting report';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      decoration: const BoxDecoration(
        color: Color(0xFF130B26),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        border: Border(top: BorderSide(color: Color(0xFF351B54))),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                widget.isUrdu ? 'خلاف ورزی کی رپورٹ' : 'Report PK Violation',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              GestureDetector(
                onTap: () => Navigator.pop(context),
                child: const Icon(Icons.close, color: Colors.white54, size: 20),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Category Dropdown
          Text(
            widget.isUrdu ? 'کیٹیگری منتخب کریں:' : 'Select Category:',
            style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12),
          ),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: const Color(0xFF1B1035),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF2E1D4D)),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _selectedCategory,
                isExpanded: true,
                dropdownColor: const Color(0xFF1B1035),
                style: const TextStyle(color: Colors.white, fontSize: 13),
                items: _categories.map((c) {
                  return DropdownMenuItem<String>(
                    value: c['id'],
                    child: Text(widget.isUrdu ? c['nameUr']! : c['name']!),
                  );
                }).toList(),
                onChanged: (val) {
                  if (val != null) setState(() => _selectedCategory = val);
                },
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Description Input
          Text(
            widget.isUrdu ? 'تفصیلات درج کریں:' : 'Description:',
            style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: _descController,
            maxLines: 3,
            style: const TextStyle(color: Colors.white, fontSize: 12),
            decoration: InputDecoration(
              hintText: widget.isUrdu
                  ? 'مشکوک سرگرمی کی وضاحت کریں...'
                  : 'Describe the suspected violation...',
              hintStyle: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 12),
              filled: true,
              fillColor: const Color(0xFF1B1035),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFF2E1D4D)),
              ),
            ),
          ),

          if (_statusMessage != null) ...[
            const SizedBox(height: 10),
            Text(
              _statusMessage!,
              style: TextStyle(
                color: _isSuccess ? Colors.greenAccent : Colors.redAccent,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
          const SizedBox(height: 16),

          // Submit CTA
          SizedBox(
            width: double.infinity,
            height: 44,
            child: ElevatedButton(
              onPressed: _isSubmitting ? null : _submitReport,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFF2D78),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
              ),
              child: Text(
                _isSubmitting
                    ? (widget.isUrdu ? 'جمع ہو رہا ہے...' : 'Submitting...')
                    : (widget.isUrdu ? 'رپورٹ جمع کریں' : 'Submit Report'),
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
