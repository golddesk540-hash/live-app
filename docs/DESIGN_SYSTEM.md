# Popo Live — 1.5 Design System Tokens & Guidelines

> Visual Foundation for Mobile (Flutter), Web & Marketing (Next.js), and Admin Panel.

---

## 1. Color Palette

Popo Live utilizes a vibrant dark-mode first palette tailored for live streaming entertainment, high-contrast badges, and sparkling gift animations.

```
┌────────────────────────────────────────────────────────┐
│  Primary: Neon Rose Pink (#FF1768)                     │
│  Secondary / Accent: Electric Cyan (#00E5FF)           │
│  Gold / VIP Level: Imperial Gold (#FFB800)             │
│  Background Dark: Pitch Black / Obsidian (#0D0D12)     │
│  Surface Card Dark: Deep Charcoal (#161622)            │
│  Text Primary: Crisp White (#FFFFFF)                   │
│  Text Secondary: Muted Silver (#9E9EB0)                │
└────────────────────────────────────────────────────────┘
```

| Token | Hex Value | Usage |
| :--- | :--- | :--- |
| `primary` | `#FF1768` | Main action buttons, live indicator dots, follow buttons, gift highlights |
| `primary-hover` | `#E0125A` | Button hover and tap states |
| `accent-cyan` | `#00E5FF` | PK Battle Blue corner, live viewer count, active party seat ring |
| `gold-vip` | `#FFB800` | VIP badges, wealth levels, coin balances, top donor ranks |
| `bg-dark` | `#0D0D12` | App background, video player overlay backdrop |
| `surface-dark` | `#161622` | Navigation bars, cards, bottom sheets, dialog modals |
| `surface-card-hover` | `#222232` | Room card hover on web, list item taps on mobile |
| `border-subtle` | `rgba(255, 255, 255, 0.08)` | Dividers, card strokes, input borders |
| `success-green` | `#00E676` | Online presence, recharge success, payout approved |
| `danger-red` | `#FF3B30` | Stream termination, bans, kick actions, report buttons |

---

## 2. Typography

- **English Font Family:** Inter / Poppins / System Sans-Serif (`font-sans`)
- **Urdu Font Family:** Noto Nastaliq Urdu / Noto Sans Arabic (`font-urdu`)
- **Display & Headings:** Bold / Semi-Bold weights (600 - 800) for energetic entertainment feel.
- **Micro-copy & Badges:** Uppercase, tracking-wider, font-size 10px - 12px.

---

## 3. Core Component Specs

### 3.1 Room Card (Discovery Grid)
- **Aspect Ratio:** 3:4 portrait card.
- **Top Bar:** 
  - Left: Host avatar + Nickname + Country flag pill.
  - Right: Live badge (`🔴 LIVE`) with pulsating glow + Current viewer count.
- **Bottom Overlay:**
  - Gradient scrim (`linear-gradient(to top, rgba(0,0,0,0.85), transparent)`).
  - Room Title (Max 2 lines, truncated with ellipsis).
  - Tags / Category badge (e.g. `🎵 Music`, `💬 Chat`, `⚔️ PK`).

### 3.2 9-Seat Party Room Grid
- **Host Seat:** Seat 0 (Prominently placed at top center or first in grid with Crown icon).
- **Guest Seats:** 8 circular speaker seats with animated audio level waves when mic is active.
- **Seat States:** Empty (`+` icon), Locked (`🔒` icon), Occupied (Avatar + Name tag + Mic Mute status).

### 3.3 Buttons & Interactive Elements
- **Primary CTA:** Gradient button (`linear-gradient(135deg, #FF1768 0%, #FF5E3A 100%)`), border radius `9999px` (Pill shape), bold white text.
- **Secondary Ghost:** 1px stroke `border-subtle`, transparent background, white text.
- **VIP Gold Button:** Gradient (`linear-gradient(135deg, #FFB800 0%, #FF8800 100%)`) with dark text `#0D0D12`.
