import 'package:flutter/material.dart';

/// Popo Live Official Design System Theme
/// Source: docs/DESIGN_SYSTEM.md
class PopoTheme {
  // Brand Color Palette
  static const Color primary = Color(0xFFFF1768); // Neon Rose Pink
  static const Color primaryDark = Color(0xFFE0125A);
  static const Color cyan = Color(0xFF00E5FF); // Electric Cyan
  static const Color gold = Color(0xFFFFB800); // Imperial Gold / VIP
  static const Color background = Color(0xFF0D0D12); // Pitch Black / Obsidian
  static const Color surface = Color(0xFF161622); // Deep Charcoal
  static const Color surfaceCardHover = Color(0xFF222232);
  static const Color surfaceLight = Color(0xFF222232);
  static const Color textPrimary = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xFF9E9EB0);
  static const Color textTertiary = Color(0xFF6B6B80);
  static const Color borderSubtle = Color(
    0x14FFFFFF,
  ); // rgba(255, 255, 255, 0.08)
  static const Color success = Color(0xFF00E676);
  static const Color danger = Color(0xFFFF3B30);
  static const Color warning = Color(0xFFFFB800);

  // Linear Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFFF1768), Color(0xFFFF5E3A)],
  );

  static const LinearGradient goldGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFFFB800), Color(0xFFFF8800)],
  );

  static const LinearGradient cyanGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF00E5FF), Color(0xFF0091EA)],
  );

  static const LinearGradient surfaceGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF1E1435), Color(0xFF120824)],
  );

  /// Main Dark Theme Data
  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: background,
      primaryColor: primary,
      colorScheme: const ColorScheme.dark(
        primary: primary,
        secondary: cyan,
        surface: surface,
        error: danger,
        onPrimary: Colors.white,
        onSecondary: Colors.black,
        onSurface: textPrimary,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: surface,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: textPrimary,
          fontSize: 18,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.2,
        ),
        iconTheme: IconThemeData(color: textPrimary),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: surface,
        selectedItemColor: primary,
        unselectedItemColor: textSecondary,
        type: BottomNavigationBarType.fixed,
        elevation: 12,
        selectedLabelStyle: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.3,
        ),
        unselectedLabelStyle: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.normal,
        ),
      ),
      cardTheme: CardTheme(
        color: surface,
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: borderSubtle, width: 1),
        ),
      ),
      dialogTheme: DialogTheme(
        backgroundColor: surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: const BorderSide(color: borderSubtle, width: 1),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: borderSubtle,
        thickness: 1,
        space: 1,
      ),
      textTheme: const TextTheme(
        headlineLarge: TextStyle(
          color: textPrimary,
          fontSize: 24,
          fontWeight: FontWeight.bold,
        ),
        headlineMedium: TextStyle(
          color: textPrimary,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
        titleLarge: TextStyle(
          color: textPrimary,
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
        titleMedium: TextStyle(
          color: textPrimary,
          fontSize: 14,
          fontWeight: FontWeight.w600,
        ),
        bodyLarge: TextStyle(color: textPrimary, fontSize: 14),
        bodyMedium: TextStyle(color: textSecondary, fontSize: 12),
        labelSmall: TextStyle(
          color: textSecondary,
          fontSize: 10,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
