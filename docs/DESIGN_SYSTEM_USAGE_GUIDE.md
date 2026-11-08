# Popo Live — Design System Implementation & Reuse Guide
> **Version:** 1.0 (Phase 1 Baseline)  
> **Target Audience:** Frontend Architects, UI Engineers (Next.js & Flutter), and Designers

---

## 1. Overview & Principles

The Popo Live design system provides a unified visual language and component architecture for all platform frontends:
1. **Web Application & Marketing Site:** Next.js + React + Tailwind CSS (`apps/web`)
2. **Mobile Apps:** Flutter (`apps/mobile`) following the exact same token definitions and component hierarchies.
3. **Admin Panel:** Next.js / Tailwind reusing the core cards, buttons, badges, and layout patterns.

### Core Rules
- **No Direct Color Hardcoding:** Always use defined tokens (`text-popo-pink`, `bg-popo-dark-850`, `border-white/10`, `shadow-glow-pink`).
- **Dark Mode First:** Popo Live is designed with an obsidian-first atmosphere (`#0B0B10`), ensuring vivid live video and gift effects pop out.
- **Bilingual Ready:** Fonts and layouts accommodate both Left-to-Right (English) and Right-to-Left (Urdu).

---

## 2. Directory Structure

```
apps/web/
├── tokens/
│   ├── colors.ts            # Palette: pinks, purples, cyans, golds, dark surfaces
│   ├── typography.ts        # Font families, sizes, weights, responsive scales
│   ├── spacing.ts           # 4px baseline grid, radii, shadows, z-indices
│   └── index.ts             # Central token export
├── components/
│   ├── ui/                  # Atom & Molecule components
│   │   ├── Button.tsx       # Primary, secondary, ghost, VIP, cyan, danger
│   │   ├── IconButton.tsx   # Circular & glass floating controls
│   │   ├── Input.tsx        # Styled form inputs with validation & icons
│   │   ├── SearchBar.tsx    # Live discovery search bar with category pills
│   │   ├── Badge.tsx        # Wealth levels (Lv.1 - 99), VIP, Live pulse, Host
│   │   ├── Avatar.tsx       # Profile avatars with Live rings, VIP crowns, status
│   │   ├── Tabs.tsx         # Pill tabs, underline tabs, category chips
│   │   ├── Card.tsx         # Dark elevated cards, glass cards, interactive cards
│   │   ├── Modal.tsx        # Accessible dialog modals with backdrop blur
│   │   ├── Dropdown.tsx     # Custom select menus for languages and options
│   │   ├── StatusIndicator.tsx # Concentric live pulses, audio equalizer waves
│   │   ├── LoadingState.tsx # Skeletons and spinning neon loaders
│   │   └── EmptyState.tsx   # Friendly empty placeholders
│   ├── navigation/          # Shells and navigation patterns
│   │   ├── MobileNavigation.tsx # 5-tab mobile bottom bar (Live, Party, Explore, Square, Me)
│   │   ├── WebHeader.tsx    # Desktop app header with search, coin balance, profile
│   │   ├── WebSidebar.tsx   # Desktop app sidebar with feeds and top creators
│   │   ├── MarketingNav.tsx # Public website navigation
│   │   └── AdminNav.tsx     # Admin moderation sidebar
│   └── references/          # Core screen layout references for future phases
│       ├── LiveRoomCard.tsx # 3:4 Live discovery card
│       ├── PartyRoomCard.tsx# 9-seat voice room card
│       ├── NineSeatPartyPreview.tsx # Interactive 9-seat party grid
│       ├── LiveRoomOverlay.tsx # Solo live streaming video overlay
│       └── UserProfileCard.tsx # User profile card with stats and action buttons
└── app/
    ├── design-system/page.tsx # Interactive showcase and live component preview
    └── page.tsx             # Root page
```

---

## 3. How Future Pages Must Reuse These Components

### Example 1: Creating a Live Stream Discovery Grid (Phase 3)
```tsx
import { LiveRoomCard } from '@/components/references/LiveRoomCard';
import { Tabs } from '@/components/ui/Tabs';

export function ExploreFeed() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {rooms.map(room => (
        <LiveRoomCard
          key={room.id}
          id={room.id}
          title={room.title}
          hostName={room.host.name}
          hostAvatar={room.host.avatar}
          coverImage={room.coverImage}
          viewerCount={room.viewers}
          category={room.category}
          level={room.host.wealthLevel}
          isPK={room.isPKActive}
        />
      ))}
    </div>
  );
}
```

### Example 2: Implementing the Solo Live Video Screen (Phase 4)
Reuse `LiveRoomOverlay` and wrap it around the Agora WebRTC video playback container:
```tsx
import { LiveRoomOverlay } from '@/components/references/LiveRoomOverlay';

export function SoloLivePlayer({ streamData }) {
  return (
    <div className="relative w-full h-full">
      {/* Agora RTC Video Container */}
      <div id="agora-video-track" className="absolute inset-0" />
      {/* Reusable Overlay UI */}
      <LiveRoomOverlay
        streamerName={streamData.hostName}
        streamerAvatar={streamData.hostAvatar}
        streamerLevel={streamData.wealthLevel}
        viewerCount={streamData.currentViewers}
        points={streamData.hostPoints}
      />
    </div>
  );
}
```

### Example 3: Adding Wealth Badges and VIP Crowns to Any List or Chat
```tsx
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';

export function ChatMessage({ message }) {
  return (
    <div className="flex items-center gap-2">
      <Avatar src={message.user.avatar} size="xs" />
      <Badge variant="level" level={message.user.level} size="xs" />
      {message.user.isVIP && <Badge variant="vip" size="xs">VIP</Badge>}
      <span className="text-xs font-bold text-white">{message.user.name}:</span>
      <span className="text-xs text-popo-text-secondary">{message.content}</span>
    </div>
  );
}
```

---

## 4. Design System Preview URL
Start the development server:
```bash
cd apps/web
npm run dev
```
Navigate to `http://localhost:3000/design-system` or `http://localhost:3000` to inspect and interact with all design tokens, components, and screen references.
