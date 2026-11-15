# =================================================================
# Popo Live - Proguard Rules for Agora RTC Engine & Secure Storage
# =================================================================

# Agora RTC Engine Proguard Rules
-keep class io.agora.** { *; }
-dontwarn io.agora.**
-keep class io.agora.rtc2.** { *; }
-keep class io.agora.base.** { *; }

# Security Crypto (Flutter Secure Storage)
-keep class androidx.security.crypto.** { *; }
-dontwarn androidx.security.crypto.**
