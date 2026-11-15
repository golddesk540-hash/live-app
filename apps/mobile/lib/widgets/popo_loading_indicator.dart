import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/popo_theme.dart';

/// Branded dual-ring pulsing loading indicator in Neon Rose Pink and Electric Cyan
class PopoLoadingIndicator extends StatefulWidget {
  final double size;
  final String? message;
  final Color? primaryColor;
  final Color? secondaryColor;

  const PopoLoadingIndicator({
    Key? key,
    this.size = 40.0,
    this.message,
    this.primaryColor,
    this.secondaryColor,
  }) : super(key: key);

  @override
  State<PopoLoadingIndicator> createState() => _PopoLoadingIndicatorState();
}

class _PopoLoadingIndicatorState extends State<PopoLoadingIndicator>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final pink = widget.primaryColor ?? PopoTheme.primary;
    final cyan = widget.secondaryColor ?? PopoTheme.cyan;

    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: widget.size,
            height: widget.size,
            child: AnimatedBuilder(
              animation: _controller,
              builder: (context, child) {
                return CustomPaint(
                  painter: _DualRingPainter(
                    progress: _controller.value,
                    color1: pink,
                    color2: cyan,
                  ),
                );
              },
            ),
          ),
          if (widget.message != null) ...[
            const SizedBox(height: 14),
            Text(
              widget.message!,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: PopoTheme.textSecondary,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _DualRingPainter extends CustomPainter {
  final double progress;
  final Color color1;
  final Color color2;

  _DualRingPainter({
    required this.progress,
    required this.color1,
    required this.color2,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 3;

    // Outer pink ring rotating clockwise
    final paint1 = Paint()
      ..color = color1
      ..strokeWidth = 2.8
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final startAngle1 = progress * 2 * math.pi;
    const sweepAngle1 = math.pi * 1.2;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle1,
      sweepAngle1,
      false,
      paint1,
    );

    // Inner cyan ring rotating counter-clockwise
    final paint2 = Paint()
      ..color = color2
      ..strokeWidth = 2.0
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final startAngle2 = -progress * 2 * math.pi;
    const sweepAngle2 = math.pi * 0.9;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius * 0.65),
      startAngle2,
      sweepAngle2,
      false,
      paint2,
    );
  }

  @override
  bool shouldRepaint(_DualRingPainter oldDelegate) =>
      oldDelegate.progress != progress;
}
