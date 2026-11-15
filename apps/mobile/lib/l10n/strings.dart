import 'package:flutter/material.dart';

/// Centralized Bilingual Localization (English & Urdu)
/// Supports instant language toggle across the entire application.
class PopoStrings {
  static ValueNotifier<String> currentLanguage = ValueNotifier<String>('en');

  static bool get isUrdu => currentLanguage.value == 'ur';

  static void setLanguage(String langCode) {
    if (langCode == 'ur' || langCode == 'en') {
      currentLanguage.value = langCode;
    }
  }

  static void toggleLanguage() {
    currentLanguage.value = currentLanguage.value == 'en' ? 'ur' : 'en';
  }

  static String get(String key) {
    final lang = currentLanguage.value;
    final dict = _strings[lang] ?? _strings['en']!;
    return dict[key] ?? _strings['en']![key] ?? key;
  }

  // Common UI keys
  static String get appName => get('app_name');
  static String get tabHome => get('tab_home');
  static String get tabParty => get('tab_party');
  static String get tabGoLive => get('tab_go_live');
  static String get tabInbox => get('tab_inbox');
  static String get tabMe => get('tab_me');

  static String get exploreFollow => get('explore_follow');
  static String get explorePopular => get('explore_popular');
  static String get exploreNew => get('explore_new');
  static String get explorePk => get('explore_pk');

  static String get comingSoonSprint => get('coming_soon_sprint');
  static String get partyOpensSprint2 => get('party_opens_sprint2');
  static String get goLiveOpensSprint2 => get('go_live_opens_sprint2');
  static String get inboxOpensSprint4 => get('inbox_opens_sprint4');

  static const Map<String, Map<String, String>> _strings = {
    'en': {
      'app_name': 'Popo Live',
      'tab_home': 'Home',
      'tab_party': 'Party',
      'tab_go_live': 'Go Live',
      'tab_inbox': 'Inbox',
      'tab_me': 'Me',

      'explore_follow': 'Follow',
      'explore_popular': 'Explore',
      'explore_new': 'New',
      'explore_pk': 'PK',

      'coming_soon_sprint': 'Sprint Feature',
      'party_opens_sprint2': '9-Seat Party Rooms activate in Sprint 2 (M4).',
      'go_live_opens_sprint2':
          'Host Live Studio & Agora Video stream activates in Sprint 2 (M3).',
      'inbox_opens_sprint4': 'Direct Messages and FCM Push notifications activate in Sprint 4 (M7).',
      'locked_placeholder': 'Upcoming Sprint Milestone',
      'back_to_explore': 'Back to Explore',

      'login_title': 'Login to Popo Live',
      'register_title': 'Create Account',
      'age_gate_title': '18+ Age Verification Required',
      'age_gate_desc': 'Popo Live is an adult live streaming community. You must be at least 18 years old to proceed.',
      'accept_and_continue': 'I am 18+ and Accept Terms',

      'profile_title': 'Me Center',
      'user_id': 'ID',
      'copied_to_clipboard': 'User ID copied to clipboard!',
      'edit_profile': 'Edit Profile',
      'wallet': 'Wallet',
      'coins': 'Coins',
      'points': 'Points',
      'settings': 'Settings',
      'language': 'Language',
      'logout': 'Log Out',

      'error_network':
          'Unable to connect to server. Please check your internet connection.',
      'error_unknown': 'An unexpected error occurred. Please try again.',
      'retry': 'Retry',
    },
    'ur': {
      'app_name': 'پوپو لائیو',
      'tab_home': 'ہوم',
      'tab_party': 'پارٹی',
      'tab_go_live': 'لائیو جائیں',
      'tab_inbox': 'ان باکس',
      'tab_me': 'میری پروفائل',

      'explore_follow': 'فالوورز',
      'explore_popular': 'دریافت',
      'explore_new': 'نیا',
      'explore_pk': 'پی کے',

      'coming_soon_sprint': 'اگلا فیچر',
      'party_opens_sprint2': '9-سیٹ پارٹی رومز سپرنٹ 2 (M4) میں فعال ہوں گے۔',
      'go_live_opens_sprint2':
          'ہوسٹ لائیو براڈکاسٹ اسٹوڈیو سپرنٹ 2 (M3) میں فعال ہوگا۔',
      'inbox_opens_sprint4':
          'پرائیویٹ پیغامات اور نوٹیفیکیشنز سپرنٹ 4 (M7) میں فعال ہوں گے۔',
      'locked_placeholder': 'آئندہ سپرنٹ کا سنگ میل',
      'back_to_explore': 'واپس ہوم پر جائیں',

      'login_title': 'پوپو لائیو میں لاگ ان کریں',
      'register_title': 'نیا اکاؤنٹ بنائیں',
      'age_gate_title': '18+ عمر کی توثیق ضروری ہے',
      'age_gate_desc': 'پوپو لائیو بالغان کے لیے ایک لائیو اسٹریمنگ پلیٹ فارم ہے۔ آگے بڑھنے کے لیے آپ کی عمر کم از کم 18 سال ہونی چاہیے۔',
      'accept_and_continue': 'میری عمر 18+ ہے اور میں شرائط تسلیم کرتا ہوں',

      'profile_title': 'می سینٹر',
      'user_id': 'آئی ڈی',
      'copied_to_clipboard': 'یوزر آئی ڈی کاپی ہو گئی!',
      'edit_profile': 'پروفائل میں ترمیم',
      'wallet': 'والٹ',
      'coins': 'سکے',
      'points': 'پوائنٹس',
      'settings': 'سیٹنگز',
      'language': 'زبان',
      'logout': 'لاگ آؤٹ',

      'error_network':
          'سرور سے رابطہ ممکن نہیں ہو سکا۔ برائے مہربانی انٹرنیٹ چیک کریں۔',
      'error_unknown': 'ایک غیر متوقع مسئلہ پیش آیا۔ دوبارہ کوشش کریں۔',
      'retry': 'دوبارہ کوشش کریں',
    },
  };
}
