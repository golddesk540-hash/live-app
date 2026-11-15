import 'package:flutter/material.dart';

import 'theme/popo_theme.dart';
import 'screens/auth/splash_screen.dart';
import 'l10n/strings.dart';

/// Root Widget for Popo Live Application
class PopoLiveApp extends StatelessWidget {
  const PopoLiveApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: PopoStrings.currentLanguage,
      builder: (context, lang, _) {
        final isUrdu = lang == 'ur';
        return MaterialApp(
          title: 'Popo Live',
          debugShowCheckedModeBanner: false,
          theme: PopoTheme.darkTheme,
          locale: Locale(lang),
          // Set text direction dynamically for Urdu
          builder: (context, child) {
            return Directionality(
              textDirection: isUrdu ? TextDirection.rtl : TextDirection.ltr,
              child: child!,
            );
          },
          home: const SplashScreen(),
        );
      },
    );
  }
}
