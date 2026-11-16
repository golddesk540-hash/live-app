# Popo Live — Google Play Console Internal Testing & Release Guide

## 1. Application Identity Summary
- **App Name:** Popo Live
- **Package / Application ID:** `com.popolive.app`
- **Namespace:** `com.popolive.app`
- **Target SDK:** 35 (Android 15)
- **Minimum SDK:** 24 (Android 7.0 Nougat)
- **Version Name:** 1.0.0
- **Version Code:** 1

---

## 2. Release Signing Configuration
- **Keystore Type:** PKCS12 / JKS (`upload-keystore.jks`)
- **Key Alias:** `popolive-upload-key`
- **Configuration File:** `apps/mobile/android/key.properties` (Excluded from git via `.gitignore`)
- **Play App Signing:** Enabled. Google Play manages app signing keys in production; the upload key signs the `.aab` for Play Console ingestion.

---

## 3. Google Play Console Reviewer Credentials (App Access)
Provide these credentials in the Google Play Console under **Policy > App Content > App Access**:

| Field | Credentials / Value |
| :--- | :--- |
| **Access Instruction** | Full Access without 2FA or SMS requirement |
| **Demo Host Username** | `zara.live@popolive.com` |
| **Demo Host Password** | `ZaraLive@Popo2026!` |
| **Demo Viewer Username**| `sana.khan@popolive.com` |
| **Demo Viewer Password**| `SanaKhan@Popo2026!` |
| **Notes for Reviewer** | Stream broadcasting requires camera and microphone permissions. Testing Agora RTC and In-App Purchase sandbox requires internet access. |

---

## 4. Google Play License Testing (In-App Purchases)
To test Coin Top-Up packages without real charges:
1. Go to **Google Play Console > Setup > License Testing**.
2. Add tester email addresses (e.g. `qa-tester@popolive.com`).
3. Set **License test response** to `RESPOND_NORMALLY`.
4. Coin packages configured:
   - `pkg_100` ($0.99 USD)
   - `pkg_500` ($4.99 USD)
   - `pkg_1000` ($9.99 USD)
   - `pkg_5000` ($49.99 USD)
   - `pkg_10000` ($99.99 USD)
   - `vip_monthly` ($19.99 USD / month)

---

## 5. Internal Testing Track Deployment Checklist
1. **Upload AAB:** Upload `app-release.aab` to **Testing > Internal Testing > Create new release**.
2. **Release Notes (en-US):**
   ```
   Popo Live 1.0.0 Internal Testing Release:
   - 24/7 live video broadcasting & viewer interaction
   - Multi-seat voice party rooms
   - 1v1 PK battles with real-time scoring
   - Virtual gifts catalogue & wallet top-up
   - Square community social feed & fan clubs
   - Agency management & host ranking leaderboards
   ```
3. **Tester List:** Add the internal QA testers email list to the Internal Testing track.
4. **Copy Link:** Share the opt-in internal testing URL with QA testers.
5. **Verify Installation:** Verify direct installation via the Play Store testing link on physical Android devices.
