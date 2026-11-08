# Popo Live (پوپو لائیو)

> Official Multiplatform Live Streaming & Social Entertainment Ecosystem  
> **Client Specification Version:** 1.0 (7 November 2026)  
> **Status:** Phase 1 (Foundation & Website) Active

---

## Architecture Overview

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
