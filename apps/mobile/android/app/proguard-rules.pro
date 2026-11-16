# =================================================================
# Popo Live - Production ProGuard / R8 Rules for Google Play Release
# =================================================================

# 1. Flutter Framework & Plugin Engine
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }
-dontwarn io.flutter.embedding.**

# 2. Agora RTC Engine (Live Streaming, Voice Party, PK Battles)
-keep class io.agora.** { *; }
-dontwarn io.agora.**
-keep class io.agora.rtc2.** { *; }
-keep class io.agora.base.** { *; }
-keepclasseswithmembernames class * {
    native <methods>;
}

# 3. Google Play Billing Client (In-App Purchases & Coin Packages)
-keep class com.android.vending.billing.** { *; }
-keep class com.android.billingclient.api.** { *; }
-dontwarn com.android.billingclient.**

# 4. Firebase Cloud Messaging & Google Play Services
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# 5. Security & Encrypted Storage (Flutter Secure Storage)
-keep class androidx.security.crypto.** { *; }
-dontwarn androidx.security.crypto.**

# 6. Network & WebSockets
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
