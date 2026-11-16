import 'package:flutter/material.dart';

import 'theme/popo_theme.dart';
import 'screens/auth/splash_screen.dart';
import 'l10n/strings.dart';
import 'services/notifications/push_notification_service.dart';

/// Root Widget for Popo Live Application
class PopoLiveApp extends StatefulWidget {
  const PopoLiveApp({Key? key}) : super(key: key);

  @override
  State<PopoLiveApp> createState() => _PopoLiveAppState();
}

class _PopoLiveAppState extends State<PopoLiveApp> {
  @override
  void initState() {
    super.initState();
    PushNotificationService.instance.initialize();
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: PopoStrings.currentLanguage,
      builder: (context, lang, _) {
        final isUrdu = lang == 'ur';
        return MaterialApp(
          navigatorKey: PushNotificationService.navigatorKey,
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
