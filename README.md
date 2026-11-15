# Popo Live (پوپو لائیو)

> Official Multiplatform Live Streaming & Social Entertainment Ecosystem  
> **Client Specification Version:** 1.0 (7 November 2026)  
> **Status:** Web & Master Admin (Phases 1–10) COMPLETED. **Active Phase:** Mobile App Implementation Plan (Sprint 1: M0–M2) Active  
> **Master Blueprint:** See [docs/NEXT_IMPLEMENTATION_PLAN.md](file:///d:/popo%20live/docs/NEXT_IMPLEMENTATION_PLAN.md)

---

## 📱 Active Directive: Complete Android & iOS Clone

> **"Agla kaam phone app hai. Web ke pages dubara mat banao. Ek Flutter app: Android aur iOS. Poori access phone pe."**  
> — *Client Pack v1.1 (15 November 2026)*

1. **Web stays thin & administrative:** `apps/web` stays 100% intact (marketing, card top-up, live watch, and master admin suite).
2. **Phone is the product:** Android & iOS Flutter app (`apps/mobile`) covering Explore, Go Live, Party, PK, Gifts, Chat, Wallet, and Me.
3. **Same API:** The Flutter app calls the existing ~319 Next.js routes under `apps/web/app/api`. `apps/api` remains empty.
4. **Existing 49+ Dart Screens:** Saved in `apps/mobile/lib/screens/` and will be wired in Sprint 3 & 4. Do not delete or rewrite them.

---

## 🏃 Mobile Sprints Roadmap

| Sprint | Modules | Scope | Status |
| :---: | :--- | :--- | :---: |
| **Sprint 1** | **M0 + M1 + M2** | Flutter Shell, 18+ Gate, Auth, Me Center, Explore Home | 🟡 **ACTIVE** |
| Sprint 2 | M3 + M4 | Solo Live Studio, Viewer Room, 9-Seat Party Room | ⚪ Next |
| Sprint 3 | M5 + M6 | Wire existing PK screens, Gifts catalog, Wallet & In-App Purchase | ⚪ Pending |
| Sprint 4 | M7 + M8 + M9 | Wire Inbox & Square, Host/Agency Center, Store Release builds | ⚪ Pending |

---

## 🔒 Locked Rules & Baseline Decisions

```
popo-live/
├── apps/
│   ├── api/          # NestJS Backend API (PostgreSQL + Redis + Agora + S3)
│   ├── web/          # Next.js Web App & Marketing Website (English + Urdu)
│   └── mobile/       # Flutter Cross-Platform App (Android & iOS)
├── docs/             # Client Specifications, Modules, and Architectural Blueprints
│   ├── MASTER_BUILD_PLAN.md      # Complete 10-Phase 100-Module Workflow
│   └── ROLES_AND_PERMISSIONS.md  # 8 Core System Roles & Access Matrix
└── README.md
```

---

## 🔒 Locked Rules & Baseline Decisions

- **One Single Backend:** All platforms (Android, iOS, Web, Admin) connect to the unified NestJS API. One wallet system, one universal ban list.
- **Strict Phase Sequence:** Follows Phases 1 through 10 strictly. No phase skipping.
- **Host Points Conversion:** 70% of gift coin value converts to host points.
- **Age Gate:** 18+ strictly enforced.
- **Languages:** English + Urdu supported from Day 1.
- **Locked OFF until Signed:**
  - Lucky / random gifts that return coins
  - 1-to-1 paid video calls
  - Second-level agent commissions
  - Near / GPS tab
  - 4-host PK (post-launch)
  - Direct APK downloads (app stores only)

---

## 📅 Roadmap Tracker

| Phase | Title | Scope | Status |
| :---: | :--- | :--- | :---: |
| **01** | **Foundation and Website** | Staging setup, NestJS base, Next.js marketing site, English/Urdu policies | 🟡 **IN PROGRESS** |
| 02 | Accounts and Profiles | Auth (Google, FB, Apple, Phone, Email), profile, Me center, PIN | ⚪ Pending |
| 03 | Discovery | Shell navigation, Explore/Follow/New/PK tabs, search, room cards | ⚪ Pending |
| 04 | Solo Live | Agora live video streaming, host studio, viewer room, chat | ⚪ Pending |
| 05 | Party Rooms | 9-seat voice/video rooms, host controls, seat request/invite | ⚪ Pending |
| 06 | PK Battles | 1v1 battle, live score bar, winner boost, result screen | ⚪ Pending |
| 07 | Gifts and Wallet | Virtual coins/points, gift catalog, SVGA animations, 70% share | ⚪ Pending |
| 08 | Social and Square | Direct messaging, feed posts, fan clubs, push notifications | ⚪ Pending |
| 09 | Creator Business | Daily tasks, leaderboards, agency dashboard, withdrawals | ⚪ Pending |
| 10 | Trust and Launch | Admin moderation console, live monitor, store submissions | ⚪ Pending |
