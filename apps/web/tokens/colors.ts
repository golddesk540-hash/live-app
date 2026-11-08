/**
 * Popo Live Design System — Color Tokens
 * Derived from Poppo Live reference aesthetics (High contrast vibrant dark theme)
 */

export const colors = {
  // Brand Primary & Accents
  primary: {
    DEFAULT: '#FF1A6C',      // Electric Neon Pink / Rose
    hover: '#E0125C',
    active: '#C00D4D',
    light: '#FF4D8D',
    subtle: 'rgba(255, 26, 108, 0.12)',
    glow: 'rgba(255, 26, 108, 0.45)',
  },
  secondary: {
    DEFAULT: '#7928CA',      // Electric Purple
    hover: '#6820AE',
    light: '#9333EA',
    subtle: 'rgba(121, 40, 202, 0.15)',
  },
  cyan: {
    DEFAULT: '#00E5FF',      // Electric Cyan / PK Blue corner
    hover: '#00B4D8',
    subtle: 'rgba(0, 229, 255, 0.12)',
    glow: 'rgba(0, 229, 255, 0.4)',
  },
  // VIP & Economy (Coins, Wealth, Crowns)
  gold: {
    DEFAULT: '#FFB800',      // Imperial Gold
    hover: '#E6A600',
    shimmer: '#FFE885',
    subtle: 'rgba(255, 184, 0, 0.15)',
    glow: 'rgba(255, 184, 0, 0.4)',
  },
  // Broadcast & Live Status
  live: {
    DEFAULT: '#FF2B44',      // Live Broadcast Red
    pulse: '#FF455B',
    badge: '#FF1A6C',
    glow: 'rgba(255, 43, 68, 0.55)',
  },
  // Dark Neutral Surfaces
  background: {
    main: '#0B0E17',         // Main Dark Navy Obsidian (Ref: 01_design_system.png)
    surface: '#131A2B',      // Elevated Navigation & Input Fields (Ref: 01_design_system.png)
    card: '#171722',         // Card Background
    cardHover: '#1F1F2E',    // Hover Card Background
    modal: '#1B1B27',        // Dialog & Bottom Sheet Surface
  },
  // Text Tokens
  text: {
    primary: '#FFFFFF',      // High emphasis
    secondary: '#A1A1B2',    // Medium emphasis
    muted: '#68687A',        // Subtle / Placeholders
    disabled: '#484858',     // Inactive
    inverse: '#0B0B10',      // Text on light/gold background
    gold: '#FFD700',         // Coin & VIP text
    pink: '#FF1A6C',         // Accent text
    cyan: '#00E5FF',         // Secondary accent text
  },
  // Borders & Dividers
  border: {
    subtle: 'rgba(255, 255, 255, 0.08)',
    medium: 'rgba(255, 255, 255, 0.14)',
    strong: 'rgba(255, 255, 255, 0.22)',
    pink: 'rgba(255, 26, 108, 0.4)',
    gold: 'rgba(255, 184, 0, 0.4)',
    cyan: 'rgba(0, 229, 255, 0.4)',
  },
  // Semantic Feedback
  state: {
    success: '#10B981',      // Emerald Green
    warning: '#F59E0B',      // Amber
    error: '#EF4444',        // Red
    info: '#3B82F6',         // Sky Blue
  },
  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #FF1A6C 0%, #FF5E3A 100%)',
    vip: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    party: 'linear-gradient(135deg, #7928CA 0%, #FF1A6C 100%)',
    pkRed: 'linear-gradient(135deg, #FF1A6C 0%, #FF2B44 100%)',
    pkBlue: 'linear-gradient(135deg, #0070F3 0%, #00E5FF 100%)',
    cardDark: 'linear-gradient(180deg, rgba(23, 23, 34, 0.9) 0%, rgba(17, 17, 24, 0.95) 100%)',
    liveBadge: 'linear-gradient(90deg, #FF1A6C 0%, #FF455B 100%)',
  },
} as const;
