/**
 * Popo Live Design System — Typography Tokens
 * Multi-language support: English (Latin) + Urdu (Nastaliq/Arabic)
 */

export const typography = {
  fontFamilies: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'Poppins, -apple-system, BlinkMacSystemFont, sans-serif',
    urdu: '"Noto Nastaliq Urdu", "Noto Sans Arabic", "Jameel Noori Nastaleeq", serif',
  },
  fontSizes: {
    xs: { size: '0.75rem', lineHeight: '1rem', tracking: '0.01em' },        // 12px
    sm: { size: '0.875rem', lineHeight: '1.25rem', tracking: '0' },         // 14px
    base: { size: '1rem', lineHeight: '1.5rem', tracking: '-0.01em' },      // 16px
    lg: { size: '1.125rem', lineHeight: '1.75rem', tracking: '-0.015em' },  // 18px
    xl: { size: '1.25rem', lineHeight: '1.875rem', tracking: '-0.02em' },   // 20px
    '2xl': { size: '1.5rem', lineHeight: '2rem', tracking: '-0.025em' },    // 24px
    '3xl': { size: '1.875rem', lineHeight: '2.25rem', tracking: '-0.03em' },// 30px
    '4xl': { size: '2.25rem', lineHeight: '2.5rem', tracking: '-0.03em' },  // 36px
    '5xl': { size: '3rem', lineHeight: '1.15', tracking: '-0.035em' },      // 48px
  },
  fontWeights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  // Scale presets for UI consistency
  presets: {
    heroTitle: 'text-3xl md:text-5xl font-extrabold tracking-tight',
    sectionTitle: 'text-2xl md:text-3xl font-bold tracking-tight',
    cardTitle: 'text-base font-semibold leading-snug',
    subTitle: 'text-sm font-medium text-popo-text-secondary',
    body: 'text-sm md:text-base font-normal leading-relaxed text-popo-text-secondary',
    badge: 'text-[11px] font-bold uppercase tracking-wider',
    levelTag: 'text-[10px] font-extrabold tracking-wider',
  },
} as const;
