/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TigerApp Design Tokens — Professional Grade
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Inspired by: shadcn/ui, TailAdmin, Horizon UI, AdminCN
 * Patterns: subtle shadows, refined gradients, clean hierarchy
 */

// ─── Spacing Scale (4px base) ────────────────────────────────────────────────
export const spacing = {
  0: '0', px: '1px', 0.5: '2px', 1: '4px', 1.5: '6px', 2: '8px',
  2.5: '10px', 3: '12px', 3.5: '14px', 4: '16px', 5: '20px', 6: '24px',
  7: '28px', 8: '32px', 9: '36px', 10: '40px', 12: '48px', 14: '56px',
  16: '64px', 20: '80px', 24: '96px',
} as const;

// ─── Typography ──────────────────────────────────────────────────────────────
export const typography = {
  fontFamily: {
    sans: "'Vazirmatn', system-ui, -apple-system, sans-serif",
    display: "'EB Garamond', 'Vazirmatn', serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.8125rem', { lineHeight: '1.25rem' }],
    base: ['0.875rem', { lineHeight: '1.5rem' }],
    lg: ['1rem', { lineHeight: '1.75rem' }],
    xl: ['1.125rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.25rem', { lineHeight: '1.75rem' }],
    '3xl': ['1.5rem', { lineHeight: '2rem' }],
    '4xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '5xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '0.025em' }],
    '6xl': ['3rem', { lineHeight: '1', letterSpacing: '0.025em' }],
  },
  fontWeight: {
    light: '300', normal: '400', medium: '500', semibold: '600',
    bold: '700', extrabold: '800', black: '900',
  },
  lineHeight: {
    none: '1', tight: '1.25', snug: '1.375', normal: '1.5',
    relaxed: '1.625', loose: '2',
  },
} as const;

// ─── Colors — Professional Palette ───────────────────────────────────────────
export const colors = {
  brand: {
    navy: '#0F172A',
    primary: '#1E3A5F',
    'primary-dark': '#152C49',
    'primary-light': '#2A5080',
    blue: '#2563EB',
    'blue-dark': '#1D4ED8',
    gold: '#F59E0B',
    'gold-dark': '#D97706',
    'gold-light': '#FBBF24',
  },
  semantic: {
    success: '#16A34A', 'success-light': '#DCFCE7', 'success-dark': '#15803D',
    warning: '#F59E0B', 'warning-light': '#FEF3C7', 'warning-dark': '#D97706',
    danger: '#DC2626', 'danger-light': '#FEE2E2', 'danger-dark': '#B91C1C',
    info: '#2563EB', 'info-light': '#DBEAFE', 'info-dark': '#1D4ED8',
  },
  neutral: {
    white: '#FFFFFF',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    border: '#E2E8F0',
    muted: '#F1F5F9',
    'muted-foreground': '#64748B',
    secondary: '#475569',
    foreground: '#334155',
    dark: '#0F172A',
  },
} as const;

// ─── Border Radius ───────────────────────────────────────────────────────────
export const radii = {
  none: '0', sm: '4px', md: '6px', lg: '8px', xl: '12px',
  '2xl': '16px', '3xl': '20px', full: '9999px',
} as const;

// ─── Shadows — Subtle & Refined (shadcn-style) ─────────────────────────────
export const shadows = {
  /** Barely visible — card at rest */
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
  /** Subtle — default card */
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
  /** Interactive card hover */
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.03)',
  /** Dropdown / popover */
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
  /** Modal */
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
  /** Hero / prominent */
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
  /** Brand glow — gold CTA */
  'gold-glow': '0 4px 14px 0 rgba(161, 98, 7, 0.2)',
  /** Brand glow — primary */
  'primary-glow': '0 4px 14px 0 rgba(30, 58, 95, 0.2)',
  /** Inner shadow — pressed state */
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.04)',
} as const;

// ─── Breakpoints ─────────────────────────────────────────────────────────────
export const breakpoints = {
  sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px',
} as const;

// ─── Z-Index ─────────────────────────────────────────────────────────────────
export const zIndex = {
  behind: '-1', base: '0', dropdown: '10', sticky: '20', overlay: '30',
  modal: '40', popover: '50', toast: '60', tooltip: '70',
} as const;

// ─── Transitions ─────────────────────────────────────────────────────────────
export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  spring: '500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

// ─── Layout Presets ──────────────────────────────────────────────────────────
export const layouts = {
  pageX: { padding: `0 ${spacing[4]}` },
  sectionY: { padding: `${spacing[12]} 0` },
  cardPadding: { padding: spacing[5] },
  modalPadding: { padding: spacing[6] },
  fieldGap: { gap: spacing[4] },
  stackSm: { gap: spacing[2] },
  stackMd: { gap: spacing[3] },
  stackLg: { gap: spacing[4] },
  stackXl: { gap: spacing[6] },
} as const;

export const ds = { spacing, typography, colors, radii, shadows, breakpoints, zIndex, transitions, layouts } as const;
export default ds;
