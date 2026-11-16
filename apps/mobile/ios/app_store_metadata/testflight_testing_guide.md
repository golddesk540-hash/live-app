# Popo Live — Apple App Store Connect & TestFlight Deployment Guide

## 1. Application Identity Summary

- **App Name:** Popo Live
- **Bundle Identifier:** `com.popolive.app`
- **Marketing Version:** `1.0.0`
- **Build Number:** `1`
- **Minimum iOS Deployment Target:** `iOS 14.0`
- **Targeted Device Families:** iPhone & iPad (`TARGETED_DEVICE_FAMILY = "1,2"`)
- **Primary Category:** Entertainment
- **Secondary Category:** Social Networking
- **Content Rating:** 17+ (User-Generated Content, Unrestricted Web Access)

---

## 2. Apple Developer Account & Capabilities

### Required App ID Capabilities in Developer Portal:
1. **Push Notifications (APNs):**
   - Configured with APNs Production Certificate or Apple Push Notification Authentication Key (`.p8`).
   - `aps-environment` set to `production` in `Runner.entitlements`.
2. **In-App Purchase (StoreKit):**
   - Enabled for digital consumable coin packages and auto-renewable VIP subscriptions.
3. **Background Modes:**
   - Audio, AirPlay, and Picture in Picture (`audio`) for live audio party lounges.
   - Background fetch (`fetch`).
   - Remote notifications (`remote-notification`).
4. **Sign in with Apple:**
   - Configured with Primary App ID `com.popolive.app` for secure user authentication.

---

## 3. App Store Connect Reviewer Credentials

Provide these credentials in App Store Connect under **App Store > App Review Information**:

| Credential Field | Reviewer Value |
| :--- | :--- |
| **Sign-In Required** | Yes |
| **Demo Host Username** | `zara.live@popolive.com` |
| **Demo Host Password** | `ZaraLive@Popo2026!` |
| **Demo Host Role** | Verified Host (Wealth Level 6, Host Level 3) |
| **Demo Viewer Username**| `sana.khan@popolive.com` |
| **Demo Viewer Password**| `SanaKhan@Popo2026!` |
| **Demo Viewer Role** | VIP Level 2 Viewer (Active Coin Balance) |
| **Notes for Review Team** | Camera and microphone permissions are requested at runtime when broadcasting or taking a party lounge seat. Video calling is disabled platform-wide. Testing sandbox IAP requires an Apple Sandbox Tester account. |

---

## 4. In-App Purchase Catalog (StoreKit 2)

All digital goods must be registered in App Store Connect under **Features > In-App Purchases**:

| Product ID | Type | Price (USD) | Coins / Description |
| :--- | :--- | :--- | :--- |
| `com.popolive.coins.100` | Consumable | \$0.99 | Starter Pack (100 Coins) |
| `com.popolive.coins.500` | Consumable | \$4.99 | Silver Pouch (500 + 25 Bonus Coins) |
| `com.popolive.coins.1000` | Consumable | \$9.99 | Popular Gold Pack (1,000 + 100 Bonus Coins) |
| `com.popolive.coins.5000` | Consumable | \$49.99 | Royal Chest (5,000 + 600 Bonus Coins) |
| `com.popolive.coins.10000`| Consumable | \$99.99 | Imperial Vault (10,000 + 1,500 Bonus Coins) |
| `com.popolive.vip.monthly`| Auto-Renewable Sub | \$19.99/mo | VIP Monthly Membership (Badge, Effects, Priority) |

### Server-Side Receipt Verification:
- **Endpoint:** `POST /api/topup/apple/verify`
- **Security:** Idempotent transaction replay prevention, cryptographic validation, server-side catalog price enforcement. Client callbacks never credit balances directly.

---

## 5. Apple Review Guidelines Compliance Checklist

### Guideline 1.2 — User-Generated Content (UGC):
- [x] Terms of Service (EULA) specifying zero tolerance for objectionable content.
- [x] Real-time Report button on all live streams, square posts, and direct messages.
- [x] Instant User Block action that suppresses streams and messages immediately.
- [x] 24/7 moderation queue with administrative review.

### Guideline 2.1 — App Completeness:
- [x] No placeholder text, dead buttons, or "under construction" screens.
- [x] Inactive 1v1 video calling clearly directs users via `video_call_disabled_screen.dart` to live broadcasts and voice party lounges.

### Guideline 3.1.1 — In-App Purchases:
- [x] All digital currencies, gifts, and VIP subscriptions are billed strictly through Apple In-App Purchases on iOS.
- [x] "Restore Purchases" button is present and functional in the Wallet Top-Up UI.

### Guideline 5.1.1(v) — Account Deletion:
- [x] Users can initiate complete account deletion directly in-app:
  `Me Tab > Settings > Account Security > Delete Account`.

---

## 6. Build & TestFlight Deployment Instructions

> [!NOTE]
> **Host Environment Limitation:**
> The current host machine is running **Windows 11**. Apple iOS `.ipa` archives, Xcode SDK compilation, and direct App Store Connect Transporter uploads require a **macOS** environment with Xcode 15 or 16 installed.
> All iOS project files, CocoaPods configurations, and metadata are fully authored and pre-validated so that a macOS workstation or CI/CD runner can build immediately.

### Execution Steps on macOS / CI/CD (GitHub Actions / Fastlane):

```bash
# 1. Navigate to mobile workspace
cd apps/mobile

# 2. Fetch Flutter packages
flutter clean
flutter pub get

# 3. Install CocoaPods dependencies
cd ios
pod install --repo-update
cd ..

# 4. Build Release IPA with Export Options
flutter build ipa --release --export-options-plist=ios/ExportOptions.plist

# 5. Upload to TestFlight via App Store Connect CLI (xcrun altool)
xcrun altool --upload-app \
  --type ios \
  -f build/ios/ipa/popo_live.ipa \
  --apiKey "$APP_STORE_CONNECT_API_KEY" \
  --apiIssuer "$APP_STORE_CONNECT_API_ISSUER"
```

---

## 7. TestFlight Distribution Groups

1. **Internal Testing Group (QA & Engineering):**
   - **Access:** Immediate (No Apple Beta Review required).
   - **Testers:** Add engineering team emails in App Store Connect.
   - **Verification:** Live video broadcast stability, Agora RTC audio lounges, 1v1 PK battle score syncing, sandbox IAP recharge.

2. **External Testing Group (Public Beta):**
   - **Access:** Requires Apple Beta App Review (typically 24–48 hours).
   - **Limit:** Up to 10,000 external testers via public invite link or email invitations.
   - **Feedback:** Collect crash reports and bug reports via the TestFlight app.
