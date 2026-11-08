/**
 * Popo Live Design System — Spacing, Elevation, and Radius Tokens
 * Standard 4px baseline grid.
 */

export const spacing = {
  // Spacing Units (in rem / px)
  none: '0',
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  base: '1rem',    // 16px
  lg: '1.25rem',   // 20px
  xl: '1.5rem',    // 24px
  '2xl': '2rem',   // 32px
  '3xl': '2.5rem', // 40px
  '4xl': '3rem',   // 48px
  '5xl': '4rem',   // 64px
} as const;

export const borderRadius = {
  none: '0',
  xs: '0.25rem',    // 4px
  sm: '0.375rem',   // 6px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.25rem', // 20px
  '3xl': '1.5rem',  // 24px
  full: '9999px',   // Pill shape (buttons, avatars, badges)
} as const;

export const shadows = {
  subtle: '0 2px 8px rgba(0, 0, 0, 0.4)',
  card: '0 8px 24px -4px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.06)',
  cardHover: '0 12px 32px -4px rgba(255, 26, 108, 0.18), 0 0 0 1px rgba(255, 26, 108, 0.35)',
  glowPink: '0 0 24px -2px rgba(255, 26, 108, 0.5)',
  glowCyan: '0 0 20px -2px rgba(0, 229, 255, 0.45)',
  glowGold: '0 0 20px -2px rgba(255, 184, 0, 0.45)',
  modal: '0 24px 64px -12px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.1)',
} as const;

export const zIndex = {
  base: 0,
  card: 10,
  sticky: 20,
  overlay: 30,
  drawer: 40,
  modal: 50,
  popover: 60,
  toast: 70,
} as const;

export const breakpoints = {
  mobile: '375px',
  sm: '640px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px',
  ultra: '1536px',
} as const;

export const layout = {
  container: {
    mobile: '100%',
    tablet: '720px',
    desktop: '1280px',
    wide: '1440px',
  },
  pageSpacing: {
    mobile: '1rem',      // 16px
    tablet: '1.5rem',    // 24px
    desktop: '2rem',     // 32px
  },
  sectionSpacing: {
    mobile: '3rem',      // 48px
    tablet: '4rem',      // 64px
    desktop: '5rem',     // 80px
  },
  cardSpacing: {
    sm: '0.75rem',       // 12px
    md: '1rem',          // 16px
    lg: '1.5rem',        // 24px
  },
  grid: {
    mobile: 'repeat(1, minmax(0, 1fr))',
    tablet: 'repeat(2, minmax(0, 1fr))',
    desktop: 'repeat(4, minmax(0, 1fr))',
  },
} as const;
