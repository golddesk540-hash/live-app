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

  static String get(dynamic keyOrContext, [String? key]) {
    final effectiveKey = key ?? (keyOrContext is String ? keyOrContext : '');
    final lang = currentLanguage.value;
    final dict = _strings[lang] ?? _strings['en']!;
    return dict[effectiveKey] ?? _strings['en']![effectiveKey] ?? effectiveKey;
  }

  // Common UI getters
  static String get appName => get('app_name');
  static String get tabLive => get('tab_live');
  static String get tabExplore => get('tab_explore');
  static String get tabSquare => get('tab_square');
  static String get tabMessage => get('tab_message');
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

  static String get profileTitle => get('profile_title');

  static const Map<String, Map<String, String>> _strings = {
    'en': {
      'app_name': 'Popo Live',
      'tab_live': 'Live',
      'tab_square': 'Square',
      'tab_message': 'Message',
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
      'inbox_opens_sprint4':
          'Direct Messages and FCM Push notifications activate in Sprint 4 (M7).',
      'locked_placeholder': 'Upcoming Sprint Milestone',
      'back_to_explore': 'Back to Explore',

      // 18+ Age Verification Gate
      'age_gate_title': '18+ Age Verification Required',
      'age_gate_badge': 'MANDATORY COMPLIANCE',
      'age_gate_desc':
          'Popo Live is an adult live streaming & interactive entertainment community. By continuing, you verify that you are at least 18 years of age and agree to our Terms of Service and Privacy Policy.',
      'age_gate_checkbox':
          'I confirm that I am at least 18 years of age and agree to the Terms of Service & Privacy Policy.',
      'accept_and_continue': 'Accept & Continue',
      'age_gate_decline': 'Decline & Exit',
      'age_gate_declined_msg':
          'Access to Popo Live is strictly restricted to adult users aged 18 and older. You cannot proceed without age confirmation.',

      // Login
      'login_title': 'Welcome Back',
      'login_subtitle':
          'Sign in to connect with live hosts & friends worldwide',
      'email_or_phone': 'Email, Phone or Poppo ID',
      'password': 'Password',
      'forgot_password': 'Forgot Password?',
      'login_btn': 'Log In',
      'login_fixture_user': 'Quick Login with Fixture User (Amina Noor)',
      'login_fixture_sub': 'Use fictional profile without database or API',
      'fixture_otp_hint': 'Fixture OTP code: 123456',
      'complete_profile_btn': 'Enter Popo Live',
      'dont_have_account': 'Don\'t have an account? Sign Up',
      'or_continue_with': 'Or continue with',
      'sign_in_with_phone': 'Sign in with Phone OTP',
      'oauth_coming_soon':
          'Social login will be active in the upcoming integration prompt.',

      // Register
      'register_title': 'Create Account',
      'register_subtitle': 'Join the premier live streaming community today',
      'nickname': 'Nickname',
      'nickname_hint': '3-20 characters (letters, numbers, _)',
      'email': 'Email Address',
      'confirm_password': 'Confirm Password',
      'register_btn': 'Create Account',
      'already_have_account': 'Already have an account? Log In',

      // Phone OTP
      'phone_otp_title': 'Phone Sign-In',
      'phone_otp_subtitle':
          'We will send a 6-digit verification code to your phone number.',
      'phone_number': 'Phone Number',
      'phone_hint': '300 1234567',
      'send_code': 'Send Verification Code',
      'enter_code': 'Enter 6-Digit Code',
      'code_sent_to': 'Enter the 6-digit code dispatched to',
      'verify_and_login': 'Verify & Sign In',
      'resend_code': 'Resend Code',
      'resend_in': 'Resend in',
      'seconds': 's',
      'change_number': 'Change Phone Number',
      'select_country': 'Select Country Code',

      // Complete Profile
      'complete_profile_title': 'Complete Your Profile',
      'complete_profile_subtitle':
          'Set your nickname, birthday, and location to enter Popo Live',
      'birthdate': 'Date of Birth',
      'birthdate_hint': 'Select your birthday (18+ only)',
      'gender': 'Gender',
      'gender_male': 'Male',
      'gender_female': 'Female',
      'gender_other': 'Other',
      'gender_unspecified': 'Prefer not to say',
      'country': 'Country / Region',
      'bio': 'About Me (Bio)',
      'bio_hint': 'Share something interesting about yourself...',
      'save_and_continue': 'Save & Continue',
      'save_changes': 'Save Changes',
      'birthday_locked_notice':
          'Birthday changes require official identity verification.',

      // Public & Me Profile
      'edit_profile': 'Edit Profile',
      'public_profile': 'Public Profile',
      'followers': 'Followers',
      'following': 'Following',
      'gifts_received': 'Gifts',
      'wealth_level': 'Wealth Level',
      'host_level': 'Host Level',
      'copy_id': 'Copy ID',
      'profile_updated_success': 'Profile updated successfully!',
      'follow': 'Follow',
      'unfollow': 'Unfollow',

      // Settings
      'settings_title': 'Settings',
      'app_version': 'App Version',
      'terms_and_privacy': 'Terms & Privacy Policy',
      'account_security': 'Account Security',
      'confirm_logout': 'Are you sure you want to log out of Popo Live?',
      'cancel': 'Cancel',

      // OAuth & Platform
      'apple_signin_ios_only':
          'Apple Sign-In is only supported on iOS devices.',
      'google_signin_cancelled': 'Google sign-in was cancelled by user.',
      'apple_signin_cancelled': 'Apple sign-in was cancelled by user.',
      'provider_unconfigured':
          'Social authentication is being initialized on the server.',

      // Validation
      'err_empty_identifier': 'Please enter your email, phone, or Poppo ID.',
      'err_empty_password': 'Please enter your password.',
      'err_password_short': 'Password must be at least 8 characters long.',
      'err_password_mismatch': 'Passwords do not match.',
      'err_invalid_email': 'Please enter a valid email address.',
      'err_nickname_short': 'Nickname must be at least 3 characters.',
      'err_terms_required':
          'You must confirm that you are 18+ and accept terms.',
      'err_invalid_phone':
          'Please enter a valid phone number including country code.',
      'err_invalid_otp': 'Please enter the complete 6-digit verification code.',
      'err_missing_birthdate': 'Please select your date of birth.',
      'err_under_18': 'You must be at least 18 years old to access Popo Live.',
      'err_future_birthday': 'Date of birth cannot be in the future.',

      // Forgot Password
      'forgot_password_title': 'Reset Password',
      'forgot_password_desc':
          'Enter your registered email or phone to receive instructions.',
      'send_reset_link': 'Send Reset Instructions',
      'reset_link_sent':
          'If an account exists with this identifier, password reset instructions have been dispatched.',

      // Profile & Settings
      'profile_title': 'Me Center',
      'user_id': 'ID',
      'copied_to_clipboard': 'User ID copied to clipboard!',
      'wallet': 'Wallet',
      'coins': 'Coins',
      'points': 'Points',
      'settings': 'Settings',
      'language': 'Language',
      'logout': 'Log Out',

      // Discovery & Live Rooms
      'tab_follow': 'Following',
      'tab_explore': 'Explore',
      'tab_for_you': 'For You',
      'tab_new': 'New',
      'tab_pk': 'PK',
      'honor_title': 'Honor System',
      'honor_level': 'Honor Level',
      'activity_center': 'Activity Center',
      'pk_ranking_title': 'PK Battle Arena',
      'go_live_btn': 'LIVE',
      'search_hint': 'Search Host ID, Username, or Tag',
      'search_title': 'Search',
      'search_users': 'Hosts / Users',
      'search_rooms': 'Live Rooms',
      'no_results_found': 'No results found matching your query.',
      'rankings_title': 'Rankings & Leaderboards',
      'filter_popular': 'Popular',
      'live_now': 'LIVE',
      'viewers': 'viewers',
      'room_preview': 'Room Preview',
      'room_preview_note': 'Live video stream activates in Sprint 2 (M3).',
      'no_live_rooms': 'No live streams currently active.',
      'pull_to_refresh': 'Pull down to refresh',

      'live_chat': 'Live Chat',
      'chat_hint': 'Say something nice...',
      'community_rules': 'Live Community Rules',
      'report_user': 'Report User',
      'block_user': 'Block User',
      'mute_user': 'Mute User',

      // Live End Screen & History
      'broadcast_ended': 'Broadcast Ended',
      'live_duration': 'Live Duration',
      'total_viewers': 'Total Viewers',
      'peak_viewers': 'Peak Viewers',
      'new_followers': 'New Followers',
      'points_received': 'Points Received',
      'total_likes': 'Total Likes',
      'view_history': 'Live Center History',
      'back_to_home': 'Back to Home',
      'live_history_title': 'Live Center History',
      'history_filter_all': 'All',
      'history_filter_week': 'Past Week',
      'history_filter_month': 'Past Month',
      'total_sessions': 'Total Sessions',

      // 9-Seat Party Rooms
      'party_discovery_title': 'Party Rooms',
      'create_party_room': 'Create Room',
      'create_party_title': 'Create Party Room',
      'party_title_hint': 'Enter party room title (max 50 chars)',
      'party_title_label': 'Room Title',
      'select_category': 'Select Category',
      'room_type_public': 'Public Room',
      'room_type_private': 'Private Room',
      'party_seats_count': '9 Seats',
      'host_seat_label': 'Host',
      'available_seat_label': 'Empty',
      'leave_party_confirm': 'Leave this party room?',
      'no_party_rooms': 'No party rooms active in this category.',
      'party_closed': 'This party room is closed or unavailable.',

      // Errors
      'error_network':
          'Unable to connect to server. Please check your internet connection.',
      'error_unknown': 'An unexpected error occurred. Please try again.',
      'retry': 'Retry',
    },
    'ur': {
      'app_name': 'پوپو لائیو',
      'tab_live': 'لائیو',
      'tab_square': 'اسکوائر',
      'tab_message': 'پیغامات',
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

      // 18+ Age Verification Gate
      'age_gate_title': '18+ عمر کی توثیق لازمی ہے',
      'age_gate_badge': 'لازمی تعمیل',
      'age_gate_desc':
          'پوپو لائیو بالغان کے لیے ایک لائیو اسٹریمنگ پلیٹ فارم ہے۔ آگے بڑھنے کے لیے آپ کی عمر کم از کم 18 سال ہونی چاہیے اور سروس کی شرائط سے متفق ہونا ضروری ہے۔',
      'age_gate_checkbox':
          'میں تصدیق کرتا ہوں کہ میری عمر کم از کم 18 سال ہے اور میں سروس کی شرائط اور پرائیویسی پالیسی سے متفق ہوں۔',
      'accept_and_continue': 'قبول کریں اور آگے بڑھیں',
      'age_gate_decline': 'انکار اور خروج',
      'age_gate_declined_msg':
          'پوپو لائیو تک رسائی صرف 18 سال یا اس سے زیادہ عمر کے افراد کے لیے مخصوص ہے۔ آپ بغیر تصدیق کے داخل نہیں ہو سکتے۔',

      // Login
      'login_title': 'خوش آمدید',
      'login_subtitle':
          'دنیا بھر کے لائیو ہوسٹس اور دوستوں کے ساتھ جڑنے کے لیے لاگ ان کریں',
      'email_or_phone': 'ای میل، فون نمبر یا پوپو آئی ڈی',
      'password': 'پاس ورڈ',
      'forgot_password': 'پاس ورڈ بھول گئے؟',
      'login_btn': 'لاگ ان کریں',
      'login_fixture_user': 'فکسچر صارف کے ساتھ فوری لاگ ان (امینہ نور)',
      'login_fixture_sub':
          'بغیر ڈیٹا بیس یا اے پی آئی کے فرضی پروفائل استعمال کریں',
      'fixture_otp_hint': 'فکسچر او ٹی پی کوڈ: 123456',
      'complete_profile_btn': 'پوپو لائیو میں داخل ہوں',
      'dont_have_account': 'اکاؤنٹ نہیں ہے؟ نیا اکاؤنٹ بنائیں',
      'or_continue_with': 'یا ان کے ساتھ لاگ ان کریں',
      'sign_in_with_phone': 'فون او ٹی پی سے سائن ان کریں',
      'oauth_coming_soon': 'سوشل لاگ ان آئندہ پرامپٹ میں فعال کیا جائے گا۔',

      // Register
      'register_title': 'نیا اکاؤنٹ بنائیں',
      'register_subtitle': 'آج ہی پوپو لائیو کمیونٹی کا حصہ بنیں',
      'nickname': 'عرفیت / نام',
      'nickname_hint': '3-20 حروف (حروف، اعداد، _)',
      'email': 'ای میل ایڈریس',
      'confirm_password': 'پاس ورڈ کی تصدیق',
      'register_btn': 'اکاؤنٹ بنائیں',
      'already_have_account': 'پہلے سے اکاؤنٹ ہے؟ لاگ ان کریں',

      // Phone OTP
      'phone_otp_title': 'فون سے سائن ان',
      'phone_otp_subtitle':
          'ہم آپ کے فون نمبر پر 6 ہندسوں کا تصدیقی کوڈ بھیجیں گے۔',
      'phone_number': 'فون نمبر',
      'phone_hint': '300 1234567',
      'send_code': 'تصدیقی کوڈ بھیجیں',
      'enter_code': '6 ہندسوں کا کوڈ درج کریں',
      'code_sent_to': 'اس نمبر پر بھیجا گیا کوڈ درج کریں:',
      'verify_and_login': 'توثیق کریں اور لاگ ان ہوں',
      'resend_code': 'دوبارہ کوڈ بھیجیں',
      'resend_in': 'دوبارہ بھیجیں:',
      'seconds': 'سیکنڈ',
      'change_number': 'فون نمبر تبدیل کریں',
      'select_country': 'ملک کا کوڈ منتخب کریں',

      // Complete Profile
      'complete_profile_title': 'اپنی پروفائل مکمل کریں',
      'complete_profile_subtitle':
          'پوپو لائیو میں داخل ہونے کے لیے اپنا نام، تاریخ پیدائش اور ملک درج کریں',
      'birthdate': 'تاریخ پیدائش',
      'birthdate_hint': 'تاریخ پیدائش منتخب کریں (صرف 18+ سال)',
      'gender': 'جنس',
      'gender_male': 'مرد',
      'gender_female': 'خاتون',
      'gender_other': 'دیگر',
      'gender_unspecified': 'ظاہر نہیں کرنا',
      'country': 'ملک / علاقہ',
      'bio': 'میرے بارے میں (بائیو)',
      'bio_hint': 'اپنے بارے میں کچھ لکھیں...',
      'save_and_continue': 'محفوظ کریں اور آگے بڑھیں',
      'save_changes': 'تبدیلیاں محفوظ کریں',
      'birthday_locked_notice':
          'تاریخ پیدائش تبدیل کرنے کے لیے دفتری شناختی تصدیق درکار ہے۔',

      // Public & Me Profile
      'edit_profile': 'پروفائل میں ترمیم',
      'public_profile': 'عوامی پروفائل',
      'followers': 'فالوورز',
      'following': 'فالوونگ',
      'gifts_received': 'تحائف',
      'wealth_level': 'دولت کا درجہ',
      'host_level': 'ہوسٹ کا درجہ',
      'copy_id': 'آئی ڈی کاپی کریں',
      'profile_updated_success': 'پروفائل کامیابی سے اپ ڈیٹ ہو گئی!',
      'follow': 'فالو کریں',
      'unfollow': 'ان فالو',

      // Settings
      'settings_title': 'سیٹنگز',
      'app_version': 'ایپ ورژن',
      'terms_and_privacy': 'شرائط اور پرائیویسی پالیسی',
      'account_security': 'اکاؤنٹ سیکیورٹی',
      'confirm_logout': 'کیا آپ واقعی پوپو لائیو سے لاگ آؤٹ کرنا چاہتے ہیں؟',
      'cancel': 'منسوخ',

      // OAuth & Platform
      'apple_signin_ios_only':
          'ایپل سائن ان صرف ایپل (iOS) ڈیوائسز پر دستیاب ہے۔',
      'google_signin_cancelled': 'گوگل سائن ان صارف نے منسوخ کر دیا۔',
      'apple_signin_cancelled': 'ایپل سائن ان صارف نے منسوخ کر دیا۔',
      'provider_unconfigured': 'سوشل لاگ ان سرور پر فعال کیا جا رہا ہے۔',

      // Validation
      'err_empty_identifier':
          'براہ کرم اپنی ای میل، فون یا پوپو آئی ڈی درج کریں۔',
      'err_empty_password': 'براہ کرم اپنا پاس ورڈ درج کریں۔',
      'err_password_short': 'پاس ورڈ کم از کم 8 حروف کا ہونا چاہیے۔',
      'err_password_mismatch': 'پاس ورڈ ایک جیسے نہیں ہیں۔',
      'err_invalid_email': 'براہ کرم ایک درست ای میل پتہ درج کریں۔',
      'err_nickname_short': 'نام کم از کم 3 حروف کا ہونا چاہیے۔',
      'err_terms_required':
          'آپ کا 18+ عمر کی تصدیق کرنا اور شرائط تسلیم کرنا لازمی ہے۔',
      'err_invalid_phone': 'براہ کرم ایک درست فون نمبر درج کریں۔',
      'err_invalid_otp': 'براہ کرم پورا 6 ہندسوں کا تصدیقی کوڈ درج کریں۔',
      'err_missing_birthdate': 'براہ کرم اپنی تاریخ پیدائش منتخب کریں۔',
      'err_under_18':
          'پوپو لائیو استعمال کرنے کے لیے آپ کی عمر کم از کم 18 سال ہونی چاہیے۔',
      'err_future_birthday': 'تاریخ پیدائش مستقبل کی نہیں ہو سکتی۔',

      // Forgot Password
      'forgot_password_title': 'پاس ورڈ ری سیٹ کریں',
      'forgot_password_desc':
          'ہدایات حاصل کرنے کے لیے اپنی رجسٹرڈ ای میل درج کریں۔',
      'send_reset_link': 'ہدایات بھیجیں',
      'reset_link_sent':
          'اگر اکاؤنٹ موجود ہے تو پاس ورڈ ری سیٹ کرنے کی ہدایات بھیج دی گئی ہیں۔',

      // Profile & Settings
      'profile_title': 'می سینٹر',
      'user_id': 'آئی ڈی',
      'copied_to_clipboard': 'یوزر آئی ڈی کاپی ہو گئی!',
      'wallet': 'والٹ',
      'coins': 'سکے',
      'points': 'پوائنٹس',
      'settings': 'سیٹنگز',
      'language': 'زبان',
      'logout': 'لاگ آؤٹ',

      // Discovery & Live Rooms
      'tab_follow': 'فالو',
      'tab_explore': 'دریافت',
      'tab_for_you': 'آپ کے لیے',
      'tab_new': 'نیا',
      'tab_pk': 'پی کے',
      'honor_title': 'اعزاز کا نظام',
      'honor_level': 'اعزاز کی سطح',
      'activity_center': 'ایکٹیویٹی سنٹر',
      'pk_ranking_title': 'پی کے میدان',
      'go_live_btn': 'لائیو',
      'search_hint': 'ہوسٹ آئی ڈی، نام یا ٹیگ تلاش کریں',
      'search_title': 'تلاش',
      'search_users': 'ہوسٹس اور صارفین',
      'search_rooms': 'لائیو رومز',
      'no_results_found': 'کوئی نتیجہ دستیاب نہیں ہے۔',
      'rankings_title': 'لیڈر بورڈ اور رینکنگز',
      'filter_popular': 'مقبول',
      'live_now': 'لائیو',
      'viewers': 'ناظرین',
      'room_preview': 'روم کا پیش نظارہ',
      'room_preview_note': 'لائیو ویڈیو سلسلہ سپرنٹ 2 (M3) میں شروع ہوگا۔',
      'no_live_rooms': 'فی الوقت کوئی لائیو اسٹریم دستیاب نہیں ہے۔',
      'pull_to_refresh': 'تازہ کاری کے لیے نیچے کھینچیں',

      'live_chat': 'لائیو چیٹ',
      'chat_hint': 'کچھ اچھا کہیں...',
      'community_rules': 'کمیونٹی لائیو رولز',
      'report_user': 'رپورٹ کریں',
      'block_user': 'بلاک کریں',
      'mute_user': 'میوٹ کریں',

      // Live End Screen & History
      'broadcast_ended': 'لائیو نشریات ختم ہو گئی',
      'live_duration': 'دورانیہ',
      'total_viewers': 'کل ناظرین',
      'peak_viewers': 'زیادہ سے زیادہ ناظرین',
      'new_followers': 'نئے فالورز',
      'points_received': 'کمائے گئے پوائنٹس',
      'total_likes': 'کل لائکس',
      'view_history': 'نشریات کی تاریخ',
      'back_to_home': 'ہوم پر واپس جائیں',
      'live_history_title': 'لائیو ہسٹری',
      'history_filter_all': 'تمام',
      'history_filter_week': 'پچھلا ہفتہ',
      'history_filter_month': 'پچھلا مہینہ',
      'total_sessions': 'کل نشریات',

      // 9-Seat Party Rooms
      'party_discovery_title': 'پارٹی رومز',
      'create_party_room': 'روم بنائیں',
      'create_party_title': 'نیا پارٹی روم بنائیں',
      'party_title_hint': 'روم کا عنوان درج کریں (زیادہ سے زیادہ 50 حروف)',
      'party_title_label': 'روم کا عنوان',
      'select_category': 'کیٹیگری منتخب کریں',
      'room_type_public': 'پبلک روم',
      'room_type_private': 'پرائیویٹ روم',
      'party_seats_count': '9 سیٹیں',
      'host_seat_label': 'ہوسٹ',
      'available_seat_label': 'خالی',
      'leave_party_confirm': 'کیا آپ اس پارٹی روم سے نکلنا چاہتے ہیں؟',
      'no_party_rooms': 'اس کیٹیگری میں کوئی پارٹی روم فعال نہیں ہے۔',
      'party_closed': 'یہ پارٹی روم بند ہو چکا ہے یا دستیاب نہیں ہے۔',

      // Errors
      'error_network':
          'سرور سے رابطہ ممکن نہیں ہو سکا۔ برائے مہربانی انٹرنیٹ چیک کریں۔',
      'error_unknown': 'ایک غیر متوقع مسئلہ پیش آیا۔ دوبارہ کوشش کریں۔',
      'retry': 'دوبارہ کوشش کریں',
    },
  };
}

/// Convenience alias for brevity in screens
typedef Strings = PopoStrings;
