# POPO LIVE — PHASE 8 PRODUCTION PROVIDER DECISION & ARCHITECTURE BLUEPRINT

> **Specification Version:** 1.0 (Phase 8 Baseline)  
> **Document Status:** Complete & Awaiting Client Sign-Off  
> **Approved Predecessor:** Phase 7 (P7-P1 through P7-P11 database integration signed off)  
> **Core Directive:** Foundation Only. No provider code integrated in P8-P1. Zero features built. Zero secrets committed.

---

## 1. Executive Summary & Audit of Phase 7 Deferred Items

During Phase 7, all ten core system domains were migrated from static fixtures to a relational PostgreSQL database (`popolive` schema). However, all external third-party infrastructure integrations were intentionally deferred behind mock services, simulated console logs, and internal database ledgers to ensure predictable development, zero third-party vendor charges, and 100% test isolation.

The table below outlines the current Phase 7 baseline state vs. what is required for production readiness in Phase 8:

| # | Domain / Service | Phase 7 Current Baseline (Mock / Internal) | Phase 8 Production Requirement | Priority |
|---|---|---|---|:---:|
| **1** | **OTP & Telephony** | In-memory 6-digit generation logged to server console; static test codes. | Real SMS dispatch to Pakistani & international mobile numbers + transactional email fallback. | P0 |
| **2** | **File Storage** | Base64 strings, mock URLs, and local disk paths (`/uploads/`). | High-availability cloud object storage with CDN edge caching, presigned upload URLs, and thumbnail resizing. | P0 |
| **3** | **WebSockets** | Periodic REST polling and direct database queries on chat/message tables. | Scalable, real-time bidirectional WebSocket cluster with Redis Pub/Sub for sub-second chat & gift effects. | P0 |
| **4** | **Live Streaming** | PostgreSQL signaling tables (`live_rooms`, `live_room_viewers`) tracking metadata. | Interactive live video streaming engine (RTMP/WebRTC ingress, HLS/LL-HLS/WebRTC egress, adaptive bitrate). | P0 |
| **5** | **Party Audio/Video** | REST state updates in `party_rooms` and `party_room_seats` (mic mute/speaker states). | Low-latency 9-seat WebRTC Selective Forwarding Unit (SFU) with spatial audio and noise suppression. | P0 |
| **6** | **Payment Gateways** | Internal database ledger (`user_wallets`, `coin_transactions`) simulating coin credits. | In-App Purchases (Apple StoreKit 2 & Google Play Billing) + Web recharge (Stripe, JazzCash, Easypaisa). | P0 |
| **7** | **Push Notifications** | In-app notification table polled or queried on-demand. | Push notification dispatch (FCM / APNs) for live alerts, stream invitations, direct messages, and security notices. | P1 |
| **8** | **KYC & Payouts** | Manual review rows in `user_identity_verifications` and `agent_withdrawals`. | Automated ID OCR + biometric liveness verification (KYC) + 1LINK/Raast/Bank automated creator payouts. | P0 |
| **9** | **Admin Web Desk** | Isolated Group L tables (`admin_users`, `admin_roles`, `audit_logs`). | Standalone administrative web application on separate domain with RBAC, stream kill-switch, and financial audit. | P1 |
| **10** | **Observability & Backups** | Local console logs and standard development PostgreSQL. | Centralized APM (Sentry), metrics (Prometheus/Grafana), structured logging, and automated continuous DB backups. | P0 |

---

## 2. Provider Decision Document (Evaluations & Recommendations)

For each deferred service, we have evaluated 2–3 enterprise options against criteria of reliability, Pakistani market compatibility, operational cost, and developer experience.

---

### 2.1. Telephony & OTP Gateway

| Provider | Pros | Cons | Recommendation |
|---|---|---|:---:|
| **Twilio Verify / SMS** | Global carrier coverage; 99.99% uptime; built-in OTP generation, rate limiting, and fraud prevention API. | Higher per-SMS cost in Pakistan (~$0.05–$0.08/SMS); occasional local routing delays during network congestion. | **Primary International** |
| **Local SMS Gateway (Telenor / Jazz / SMS4Connect)** | Lowest cost for Pakistani mobile numbers (~PKR 0.50–1.20/SMS); direct local telecom routing; high local delivery rate. | Requires NTN/company registration; limited or no international delivery capability. | **Primary Local (PK)** |
| **Vonage (Nexmo)** | Strong global routing; competitive international rates; good fallback options. | More complex dashboard; less comprehensive fraud prevention compared to Twilio Verify. | Alternative |

> **Recommendation:** **Hybrid Architecture.**
> - Use a **Local SMS Gateway** for all Pakistani phone numbers (`+92...`) for high delivery speed and low cost.
> - Use **Twilio Verify** for all international phone numbers.
> - Transactional email OTP fallback powered by **SendGrid / AWS SES**.
> - Client approval required for provider account onboarding.

---

### 2.2. Object File Storage (Avatars, Covers, Poster Art)

| Provider | Pros | Cons | Recommendation |
|---|---|---|:---:|
| **Cloudflare R2** | **Zero egress bandwidth fees** (huge savings for image-heavy live apps); 100% S3-compatible API; automatic Cloudflare CDN integration. | Younger ecosystem than AWS; bucket metrics less granular. | **RECOMMENDED** |
| **AWS S3 + CloudFront** | Industry gold standard; infinite scalability; mature lifecycle rules, Glacier archiving, and IAM policies. | High egress bandwidth pricing ($0.09/GB) which escalates quickly as media traffic grows. | Alternative |
| **Google Cloud Storage (GCS)** | Seamless integration if utilizing GCP services; strong worldwide network. | Bandwidth egress costs similar to AWS; complex IAM. | Alternative |

> **Recommendation:** **Cloudflare R2.**
> Zero egress bandwidth fees make R2 the most cost-effective solution for avatars, room covers, SVGA gift animations, and shared achievement posters. Presigned URLs will be issued for direct mobile client uploads.

---

### 2.3. WebSocket & Real-Time Messaging Layer

| Provider | Pros | Cons | Recommendation |
|---|---|---|:---:|
| **Socket.io + Redis Adapter (Self-Hosted)** | Zero per-message vendor cost; complete data privacy; full support for rooms, namespaces, heartbeat, and reconnection logic; horizontally scalable via Redis Pub/Sub. | Requires maintaining WebSocket server instances (CPU/RAM scaling). | **RECOMMENDED** |
| **Pusher Channels** | Turnkey managed solution; excellent developer experience; zero server management. | Extremely expensive at scale (50,000 concurrent viewers and millions of chat messages generate high monthly costs). | Not Recommended |
| **Ably Realtime** | Guaranteed message ordering; 99.999% SLA; global presence. | High pricing at live streaming scale. | Alternative |

> **Recommendation:** **Socket.io + Redis Pub/Sub Adapter (Self-Hosted).**
> Live streaming chat, viewer count tickers, and animated gift events generate tens of thousands of messages per minute. A self-hosted Socket.io cluster on Node.js/Go backed by Redis Pub/Sub ensures predictable low latency with fixed server infrastructure costs.

---

### 2.4. Live Streaming Video Infrastructure (Host to Viewers)

| Provider | Pros | Cons | Recommendation |
|---|---|---|:---:|
| **Agora Interactive Live Streaming (RTC / ILS)** | Sub-second latency (<400ms); battle-tested in top live streaming apps (Poppo, Bigo, Tango); built-in beauty filters, token security, and recording; rich mobile Flutter SDK. | Proprietary protocol (not pure open-source); usage-based pricing ($0.99–$3.99 / 1,000 minutes). | **RECOMMENDED** |
| **LiveKit Cloud / Self-Hosted** | Modern open-source WebRTC SFU; excellent developer documentation; lower cost if self-hosted; supports mobile Flutter SDK. | Self-hosting WebRTC at massive viewer scale requires significant DevOps expertise and global relay nodes. | Strong Alternative |
| **Mux Video** | Super simple API for RTMP ingest and HLS playback; great video player analytics. | Higher latency (typically 2–5 seconds with LL-HLS), unsuitable for interactive real-time PK battles and instant gifting. | Unsuitable for PK |

> **Recommendation:** **Agora Interactive Live Streaming.**
> Poppo Live requires real-time interaction: instant PK battle scoring, reactive gift animations, and live viewer-to-host interaction. Agora delivers proven sub-second mobile latency with official Flutter plugins.

---

### 2.5. Party Rooms (9-Seat Interactive Audio & Video)

| Provider | Pros | Cons | Recommendation |
|---|---|---|:---:|
| **Agora RTC (Voice & Video)** | Shares the exact same SDK and authentication tokens as the live streaming module; 9-seat spatial audio; AI noise cancellation; seamless seat switching. | Vendor lock-in with live streaming provider. | **RECOMMENDED** |
| **LiveKit SFU** | Excellent multi-party audio room features; active speaker detection; open protocol. | Requires separate SDK integration from live streaming if live streaming uses Agora. | Alternative |
| **Daily.co** | Simple REST API for multi-party calls. | Geared primarily toward video conferencing rather than social party rooms; higher latency on low-end mobile devices. | Not Recommended |

> **Recommendation:** **Agora RTC Multi-Party Engine.**
> Utilizing Agora for both Solo Live (1-to-many) and Party Rooms (9-seat mesh/SFU) minimizes mobile app binary size, simplifies token generation on the backend, and leverages unified billing.

---

### 2.6. Payment Gateways & Coin Top-Up Rails

| Channel | Providers Evaluated | Recommendation & Strategy |
|---|---|---|
| **Mobile App (Android)** | **Google Play Billing Library (v6+)** | Mandatory for Google Play Store compliance for all digital goods (coins, VIP). Commission: 15% (first \$1M) / 30%. |
| **Mobile App (iOS)** | **Apple StoreKit 2 (In-App Purchase)** | Mandatory for Apple App Store compliance for all digital items. Commission: 15% (Small Business) / 30%. |
| **Web Portal (International)** | **Stripe Checkout / Stripe Elements** | Global card payments (Visa, MasterCard, Amex); 3D Secure 2; Apple Pay / Google Pay web integration; automated dispute handling. |
| **Web Portal (Pakistan Local)** | **JazzCash, Easypaisa, PayFast (1LINK)** | Vital for Pakistani audience: mobile wallet debits (JazzCash & Easypaisa accounts) + local debit card processing. |

> **Recommendation:** **Dual-Channel Strategy.**
> - On **Mobile Apps (Android & iOS)**: Strictly use **Google Play Billing** and **Apple StoreKit 2** to avoid store rejection and app suspension.
> - On **Web Application (`apps/web`)**: Provide direct top-up via **Stripe** (for international cardholders) and **JazzCash / Easypaisa / PayFast** (for local Pakistani users) with significantly lower transaction processing fees (1.5%–3.5%).

---

### 2.7. Push Notifications

| Provider | Pros | Cons | Recommendation |
|---|---|---|:---:|
| **Firebase Cloud Messaging (FCM)** | **Free of cost**; native Android integration; official Apple APNs relay; topics support (e.g. `topic_host_123` for stream start alerts); official Flutter plugin (`firebase_messaging`). | Web push requires service worker configuration; Google service dependency in restricted regions. | **RECOMMENDED** |
| **OneSignal** | Feature-rich dashboard; automated drip campaigns; user journey builder. | Free tier has strict subscriber limits; paid tiers become expensive at scale. | Alternative |
| **Direct APNs + FCM** | Maximum low-level control. | Duplicated backend dispatch logic for iOS vs. Android. | Not Recommended |

> **Recommendation:** **Firebase Cloud Messaging (FCM).**
> FCM provides free, reliable push delivery for live notifications, follower alerts, direct messages, and security notices across Android, iOS, and Web.

---

### 2.8. Identity Verification (KYC) & Creator Payout Rails

#### A. KYC Identity Verification
- **Recommended Provider:** **Sumsub** (Alternative: **Persona** / **NADRA Verisys** for Pakistan).
- **Capabilities:** Automated OCR of National Identity Cards (Pakistani CNIC / Smart Card, International Passports), 3D facial liveness check, age verification (18+ enforcement), and automated fraud detection.

#### B. Creator Payout Rails (Withdrawals)
- **Pakistan Local Creators:** **1LINK / Raast Direct API** (or integrated via Bank Alfalah / Meezan Bank Corporate Payout API). Enables instant IBAN transfers in PKR with zero intermediary wire fees.
- **International Creators:** **Stripe Connect** or **Payoneer Mass Payouts** for direct bank transfers in USD/EUR/GBP.

---

### 2.9. Standalone Admin Desk

- **Architecture:** Complete separation from the public Next.js web application.
- **Deployment:** Hosted on an independent administrative domain (e.g. `https://admin.popolive.com` or isolated VPN port) connecting directly to Group L database tables (`popolive.admin_users`, `admin_roles`, `admin_permissions`, `audit_logs`).
- **Core Modules:**
  1. *Live Monitor & Emergency Kill-Switch:* Instant live room termination and host ban with audio/video stream cutoff.
  2. *KYC Review Desk:* Identity verification approval/rejection queue with document inspection.
  3. *Financial Desk:* Withdrawal request batch approvals, payout trigger, and coin circulation ledger audits.
  4. *Moderation & Safety:* User reports, chat thread inspection, automated word blacklist management, and IP bans.
  5. *Catalog Management:* Gift additions, SVGA asset uploads, and coin package pricing.

---

### 2.10. Monitoring, Logging, Error Tracking & Backups

#### A. Error Tracking & Application Performance Monitoring (APM)
- **Sentry:** Unified error and performance monitoring across Flutter mobile app (`sentry_flutter`) and Next.js web/API (`@sentry/nextjs`).
- Captures stack traces, breadcrumbs, user session state, and network transaction times with automated alerting via Slack/Discord.

#### B. Infrastructure Metrics & Centralized Logging
- **Prometheus + Grafana:** Collects server resource metrics (CPU, RAM, network I/O, database connection pool, Redis cache hit ratio).
- **Structured JSON Logging:** All API requests logged with standardized JSON structure:
  ```json
  {
    "timestamp": "2026-11-20T17:30:00.000Z",
    "level": "info",
    "trace_id": "req-98fa-41b2",
    "user_id": "u-12345",
    "method": "POST",
    "path": "/api/builder/withdrawal",
    "status": 200,
    "duration_ms": 42
  }
  ```
- **Log Sanitization:** Sensitive fields (`password`, `pin`, `auth_token`, `id_number`, `card_number`, `otp`) are strictly stripped before reaching any log sink.

#### C. Database Backup & Disaster Recovery Strategy
- **Continuous Archiving:** PostgreSQL Write-Ahead Logging (WAL) continuously streamed to Cloudflare R2 / AWS S3 using `pgBackRest` or `wal-g`.
- **Daily Snapshots:** Automated nightly `pg_dump` snapshots encrypted with AES-256 and stored offsite with a 30-day retention policy.
- **Recovery Time Objective (RTO):** < 30 minutes.
- **Recovery Point Objective (RPO):** < 5 minutes (via continuous WAL replay).
- **Automated Restore Testing:** Weekly automated spin-up of test database containers to verify backup integrity.

---

## 3. Environment Configuration & Secret Management Architecture

### 3.1. Three-Tier Environment Separation

| Environment | Purpose | Database | Base URLs |
|---|---|---|---|
| **Development** | Local engineering and unit/integration testing | Local Docker PostgreSQL (`port 55432`) & Redis | Web: `http://localhost:3000`<br>API: `http://localhost:4000` |
| **Staging** | QA verification, end-to-end integration, client preview | Staging Cloud PostgreSQL & Redis Cluster | Web: `https://staging.popolive.com`<br>API: `https://staging-api.popolive.com` |
| **Production** | Live end-user traffic | High-availability replicated PostgreSQL & Redis | Web: `https://popolive.com`<br>API: `https://api.popolive.com` |

### 3.2. Secret Management Protocols

1. **Zero Secret Policy in Version Control:**
   - No production passwords, private keys, or API tokens are ever checked into git.
   - All `.env` and `.env.local` files are registered in `.gitignore`.
   - Git repository scans (via pre-commit hooks and CI secret scanners) block any commit containing AWS, Stripe, Twilio, or RSA private key signatures.
2. **Secret Vault in Production:**
   - Production secrets are injected into running containers via **HashiCorp Vault**, **AWS Secrets Manager**, or **Doppler** at deployment time.
   - Environment variables are marked as sensitive and never printed in server logs.

---

## 4. Feature Flag Catalog (`USE_REAL_*`)

To guarantee complete backward compatibility with Phase 7 and ensure that no untested third-party code affects system stability, Phase 8 introduces nine modular feature flags:

```
+--------------------------+---------------+-------------------------------------------------------------+
| Feature Flag             | Default Value | Behavior when FALSE (Phase 7 Baseline Preserved)           |
+--------------------------+---------------+-------------------------------------------------------------+
| USE_REAL_OTP             | false         | OTP logged to server console / mock code 123456 accepted   |
| USE_REAL_STORAGE         | false         | Images stored as base64 / local mock paths                 |
| USE_REAL_WEBSOCKET       | false         | Real-time features use REST polling & database records      |
| USE_REAL_MEDIA           | false         | Live rooms track signaling states in DB; mock video state   |
| USE_REAL_PARTY_MEDIA     | false         | 9-seat party rooms track states in DB; mock audio state     |
| USE_REAL_PAYMENTS        | false         | Coin packages debit/credit internal DB ledger directly     |
| USE_REAL_PUSH            | false         | Push alerts write to DB notification table only             |
| USE_REAL_KYC             | false         | KYC submissions saved as DB records with manual review flag |
| USE_REAL_ADMIN           | false         | Admin tables queried via read-only DB schema               |
+--------------------------+---------------+-------------------------------------------------------------+
```

### Mobile & Web Flag Implementations
- **Flutter Mobile (`apps/mobile/lib/api/api_config.dart`):**
  Uses compile-time environment flags: `const bool.fromEnvironment('USE_REAL_OTP', defaultValue: false)`.
- **Web / API (`apps/web/lib/phase8Flags.ts`):**
  Uses runtime environment checks: `process.env.USE_REAL_OTP === 'true'`.

---

## 5. Rollback Plan & Zero-Destructive Schema Guarantees

If any external third-party provider experiences an outage, service disruption, or integration failure:

1. **Instant Feature Flag Toggle:**
   - Setting `USE_REAL_<SERVICE>=false` immediately restores the Phase 7 database-backed or mock behavior without redeploying application code or altering database schemas.
2. **Zero Destructive Database Changes:**
   - All Phase 8 database migrations must be strictly additive (new tables, nullable columns with safe defaults, or idempotent views).
   - Dropping, renaming, or altering NOT NULL constraints on Phase 7 tables is strictly prohibited.
3. **Client Fallback Gracefulness:**
   - If real live media fails, mobile and web clients gracefully render the stream metadata and chat room from the database.
   - If payment gateway webhooks fail, transaction states remain in `pending` and are reconcilable via background recovery jobs.

---

## 6. Client Approval Checklist for Phase 8

Before proceeding with Phase 8 implementation prompts (P8-P2 onwards), the client must approve the selected providers:

- [ ] **1. OTP Provider:** Approve Twilio (International) + Local SMS Gateway (Pakistan)
- [ ] **2. File Storage:** Approve Cloudflare R2 (zero egress fees)
- [ ] **3. WebSockets:** Approve self-hosted Socket.io + Redis Pub/Sub
- [ ] **4. Live Media:** Approve Agora Interactive Live Streaming
- [ ] **5. Party Media:** Approve Agora RTC (9-seat audio/video)
- [ ] **6. Payments:** Approve Apple StoreKit 2 & Google Play Billing (Mobile) + Stripe & JazzCash/Easypaisa (Web)
- [ ] **7. Push Notifications:** Approve Firebase Cloud Messaging (FCM)
- [ ] **8. KYC & Payouts:** Approve Sumsub (KYC) + 1LINK / Raast (Pakistan bank payouts)
- [ ] **9. Admin Desk:** Approve standalone Next.js admin app on separate subdomain
- [ ] **10. Monitoring & Backups:** Approve Sentry + Prometheus/Grafana + Daily R2/S3 DB backups
