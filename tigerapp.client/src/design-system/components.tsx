/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TigerApp UI Kit — Complete Professional Component Library
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Every UI element in the app MUST use these components.
 * Import from '@/design-system/components' — never hardcode styles.
 *
 * Components:
 *  Layout:     Container, Section, SectionHeader, Stack, Grid, Divider
 *  Typography: Heading, Text, Label, Caption
 *  Forms:      Input, Textarea, Select, Checkbox, Switch
 *  Buttons:    Button
 *  Display:    Card, Badge, Avatar, AvatarGroup, PriceDisplay
 *  Feedback:   Alert, Toast, Spinner, Skeleton, EmptyState, Progress
 *  Navigation: Breadcrumb, Tabs, Pagination
 *  Overlays:   Modal, Tooltip
 *  Data:       DataTable, StatCard
 */

import React, {
  type ButtonHTMLAttributes, type InputHTMLAttributes,
  type TextareaHTMLAttributes, type SelectHTMLAttributes,
  type ReactNode, type ReactElement, createContext, useContext,
  useState, useCallback, useEffect, useRef, useId,
} from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS (inline for zero-dependency)
// ═══════════════════════════════════════════════════════════════════════════════

const T = {
  color: {
    navy: '#0F172A', primary: '#1E3A5F', 'primary-dark': '#152C49', 'primary-light': '#2A5080',
    blue: '#2563EB', 'blue-dark': '#1D4ED8',
    gold: '#F59E0B', 'gold-dark': '#D97706', 'gold-light': '#FBBF24',
    success: '#16A34A', 'success-bg': '#DCFCE7', 'success-text': '#166534',
    warning: '#F59E0B', 'warning-bg': '#FEF3C7', 'warning-text': '#92400E',
    danger: '#DC2626', 'danger-bg': '#FEE2E2', 'danger-text': '#991B1B',
    info: '#2563EB', 'info-bg': '#DBEAFE', 'info-text': '#1E40AF',
    bg: '#F8FAFC', surface: '#FFFFFF', border: '#E2E8F0', muted: '#F1F5F9',
    'muted-fg': '#64748B', secondary: '#475569', fg: '#334155', dark: '#0F172A',
  },
  radius: { sm: '4px', md: '6px', lg: '8px', xl: '12px', '2xl': '16px', '3xl': '20px', full: '9999px' },
  shadow: {
    xs: '0 1px 2px rgba(0,0,0,0.05)',
    sm: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
    md: '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.04)',
    lg: '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04)',
    xl: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
    '2xl': '0 25px 50px -12px rgba(0,0,0,0.25)',
  },
} as const;


// ═══════════════════════════════════════════════════════════════════════════════
// LAYOUT COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Container ───────────────────────────────────────────────────────────────
interface ContainerProps { children: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'; className?: string; }
const maxW = { sm: 'max-w-lg', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-7xl', full: 'max-w-full' };
export const Container: React.FC<ContainerProps> = ({ children, size = 'xl', className = '' }) => (
  <div className={`app-container mx-auto px-4 sm:px-6 lg:px-8 ${maxW[size]} ${className}`}>{children}</div>
);

// ─── Section ─────────────────────────────────────────────────────────────────
interface SectionProps { children: ReactNode; bg?: 'default' | 'muted' | 'navy' | 'gradient-navy'; padding?: 'sm' | 'md' | 'lg' | 'xl'; className?: string; id?: string; }
const secBg = { default: 'bg-white', muted: 'bg-[#F8FAFC]', navy: 'text-white', 'gradient-navy': 'text-white' };
const secPad = { sm: 'py-8 sm:py-10', md: 'py-10 sm:py-14', lg: 'py-14 sm:py-20', xl: 'py-16 sm:py-24' };
export const Section: React.FC<SectionProps> = ({ children, bg = 'default', padding = 'lg', className = '', id }) => {
  const bgS: React.CSSProperties = bg === 'navy' ? { background: 'linear-gradient(135deg,#0F172A,#1E3A5F)' }
    : bg === 'gradient-navy' ? { background: 'linear-gradient(135deg,#1E3A5F,#0F172A)' } : {};
  return <section id={id} className={`${secBg[bg]} ${secPad[padding]} ${className}`} style={bgS}>{children}</section>;
};

// ─── SectionHeader ───────────────────────────────────────────────────────────
interface SectionHeaderProps { title: string; subtitle?: string; align?: 'center' | 'right' | 'left'; light?: boolean; marginBottom?: 'sm' | 'md' | 'lg'; }
const mbMap = { sm: 'mb-6', md: 'mb-8', lg: 'mb-12' };
export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, align = 'center', light = false, marginBottom = 'lg' }) => (
  <div className={`${mbMap[marginBottom]} ${align === 'center' ? 'text-center' : align === 'left' ? 'text-left' : 'text-right'}`}>
    <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${light ? 'text-white' : T.color.dark}`}>{title}</h2>
    {subtitle && <p className={`mt-2 text-sm sm:text-base ${light ? 'text-slate-300' : T.color.secondary}`}>{subtitle}</p>}
  </div>
);

// ─── Stack ───────────────────────────────────────────────────────────────────
interface StackProps { children: ReactNode; direction?: 'row' | 'col'; gap?: 1 | 2 | 3 | 4 | 5 | 6 | 8; align?: 'start' | 'center' | 'end' | 'stretch'; justify?: 'start' | 'center' | 'end' | 'between' | 'around'; wrap?: boolean; className?: string; }
const gapMap = { 1: 'gap-1', 2: 'gap-2', 3: 'gap-3', 4: 'gap-4', 5: 'gap-5', 6: 'gap-6', 8: 'gap-8' };
const alignMap = { start: 'items-start', center: 'items-center', end: 'items-end', stretch: 'items-stretch' };
const justifyMap = { start: 'justify-start', center: 'justify-center', end: 'justify-end', between: 'justify-between', around: 'justify-around' };
export const Stack: React.FC<StackProps> = ({ children, direction = 'col', gap = 3, align, justify, wrap, className = '' }) => (
  <div className={`flex ${direction === 'row' ? 'flex-row' : 'flex-col'} ${gapMap[gap]} ${align ? alignMap[align] : ''} ${justify ? justifyMap[justify] : ''} ${wrap ? 'flex-wrap' : ''} ${className}`}>{children}</div>
);

// ─── Grid ────────────────────────────────────────────────────────────────────
interface GridProps { children: ReactNode; cols?: 1 | 2 | 3 | 4; gap?: 3 | 4 | 5 | 6; className?: string; }
const gridCols = { 1: 'grid-cols-1', 2: 'grid-cols-1 sm:grid-cols-2', 3: 'grid-cols-1 md:grid-cols-3', 4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' };
const gridGap = { 3: 'gap-3', 4: 'gap-4', 5: 'gap-5', 6: 'gap-6' };
export const Grid: React.FC<GridProps> = ({ children, cols = 3, gap = 5, className = '' }) => (
  <div className={`grid ${gridCols[cols]} ${gridGap[gap]} ${className}`}>{children}</div>
);

// ─── Divider ─────────────────────────────────────────────────────────────────
interface DividerProps { className?: string; margin?: 'sm' | 'md' | 'lg'; }
const divMargin = { sm: 'my-3', md: 'my-5', lg: 'my-8' };
export const Divider: React.FC<DividerProps> = ({ className = '', margin = 'md' }) => (
  <hr className={`border-0 h-px ${divMargin[margin]} ${className}`} style={{ background: T.color.border }} />
);


// ═══════════════════════════════════════════════════════════════════════════════
// TYPOGRAPHY COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
interface HeadingProps { level?: HeadingLevel; children: ReactNode; light?: boolean; className?: string; margin?: boolean; }
const headingSizes: Record<HeadingLevel, string> = {
  h1: 'text-3xl sm:text-4xl font-extrabold tracking-tight',
  h2: 'text-2xl sm:text-3xl font-extrabold tracking-tight',
  h3: 'text-xl sm:text-2xl font-bold',
  h4: 'text-lg sm:text-xl font-bold',
  h5: 'text-base font-bold',
  h6: 'text-sm font-bold',
};
export const Heading: React.FC<HeadingProps> = ({ level = 'h2', children, light = false, className = '', margin }) => {
  const cls = `${headingSizes[level]} ${light ? 'text-white' : T.color.dark} ${margin ? 'mb-4' : ''} ${className}`;
  switch (level) {
    case 'h1': return <h1 className={cls}>{children}</h1>;
    case 'h3': return <h3 className={cls}>{children}</h3>;
    case 'h4': return <h4 className={cls}>{children}</h4>;
    case 'h5': return <h5 className={cls}>{children}</h5>;
    case 'h6': return <h6 className={cls}>{children}</h6>;
    default: return <h2 className={cls}>{children}</h2>;
  }
};

interface TextProps { children: ReactNode; size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl'; color?: 'default' | 'secondary' | 'muted' | 'white'; weight?: 'normal' | 'medium' | 'semibold' | 'bold'; className?: string; as?: 'p' | 'span' | 'div'; }
const textSizes = { xs: 'text-xs', sm: 'text-sm', base: 'text-base', lg: 'text-lg', xl: 'text-xl' };
const textColors = { default: T.color.fg, secondary: T.color.secondary, muted: T.color['muted-fg'], white: '#FFFFFF' };
const textWeights = { normal: 'font-normal', medium: 'font-medium', semibold: 'font-semibold', bold: 'font-bold' };
export const Text: React.FC<TextProps> = ({ children, size = 'base', color = 'default', weight = 'normal', className = '', as = 'p' }) => {
  const cls = `${textSizes[size]} ${textColors[color]} ${textWeights[weight]} leading-relaxed ${className}`;
  switch (as) {
    case 'span': return <span className={cls}>{children}</span>;
    case 'div': return <div className={cls}>{children}</div>;
    default: return <p className={cls}>{children}</p>;
  }
};

interface LabelProps { children: ReactNode; required?: boolean; className?: string; htmlFor?: string; }
export const Label: React.FC<LabelProps> = ({ children, required, className = '', htmlFor }) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium mb-1.5 ${T.color.fg} ${className}`}>
    {children}{required && <span className="mr-1" style={{ color: T.color.danger }}>*</span>}
  </label>
);

interface CaptionProps { children: ReactNode; color?: 'default' | 'muted' | 'danger'; className?: string; }
const captionColors = { default: T.color.secondary, muted: T.color['muted-fg'], danger: T.color.danger };
export const Caption: React.FC<CaptionProps> = ({ children, color = 'default', className = '' }) => (
  <p className={`text-xs ${captionColors[color]} ${className}`}>{children}</p>
);


// ═══════════════════════════════════════════════════════════════════════════════
// FORM COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Input ───────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string; helperText?: string; error?: boolean; icon?: ReactNode;
}
export const Input: React.FC<InputProps> = ({ label, helperText, error = false, icon, className = '', ...props }) => (
  <div className="w-full">
    {label && <Label required={props.required} htmlFor={props.id}>{label}</Label>}
    <div className="relative">
      {icon && <span className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: T.color['muted-fg'] }}>{icon}</span>}
      <input
        className={`w-full px-3.5 py-2.5 text-sm rounded-lg border transition-all duration-200
          placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-0
          disabled:opacity-50 disabled:cursor-not-allowed
          ${icon ? 'pr-10' : ''}
          ${error ? `border-[${T.color.danger}] focus:ring-[${T.color.danger}]/20`
            : `border-[${T.color.border}] focus:border-[${T.color.primary}] focus:ring-[${T.color.primary}]/10`}
          ${className}`}
        style={{ background: T.color.surface, color: T.color.fg, borderColor: error ? T.color.danger : T.color.border }}
        {...props}
      />
    </div>
    {helperText && <Caption color={error ? 'danger' : 'muted'} className="mt-1.5">{helperText}</Caption>}
  </div>
);

// ─── Textarea ────────────────────────────────────────────────────────────────
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string; helperText?: string; error?: boolean;
}
export const Textarea: React.FC<TextareaProps> = ({ label, helperText, error = false, className = '', ...props }) => (
  <div className="w-full">
    {label && <Label required={props.required}>{label}</Label>}
    <textarea
      className={`w-full px-3.5 py-2.5 text-sm rounded-lg border transition-all duration-200 resize-none
        placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-0
        disabled:opacity-50 disabled:cursor-not-allowed min-h-[80px]
        ${error ? '' : ''} ${className}`}
      style={{ background: T.color.surface, color: T.color.fg, borderColor: error ? T.color.danger : T.color.border }}
      {...props}
    />
    {helperText && <Caption color={error ? 'danger' : 'muted'} className="mt-1.5">{helperText}</Caption>}
  </div>
);

// ─── Select ──────────────────────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string; helperText?: string; error?: boolean; options: { value: string | number; label: string }[];
}
export const Select: React.FC<SelectProps> = ({ label, helperText, error = false, options, className = '', ...props }) => (
  <div className="w-full">
    {label && <Label required={props.required}>{label}</Label>}
    <select
      className={`w-full px-3.5 py-2.5 text-sm rounded-lg border transition-all duration-200 cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-offset-0 appearance-none
        disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{ background: T.color.surface, color: T.color.fg, borderColor: error ? T.color.danger : T.color.border, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'left 12px center' }}
      {...props}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {helperText && <Caption color={error ? 'danger' : 'muted'} className="mt-1.5">{helperText}</Caption>}
  </div>
);

// ─── Checkbox ────────────────────────────────────────────────────────────────
interface CheckboxProps { label: string; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean; className?: string; }
export const Checkbox: React.FC<CheckboxProps> = ({ label, checked, onChange, disabled, className = '' }) => (
  <label className={`flex items-center gap-2.5 cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
    <span className="relative flex-shrink-0">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} className="sr-only peer" />
      <span className="block w-5 h-5 rounded-md border-2 transition-all duration-200 peer-checked:border-transparent peer-checked:bg-[#1E3A5F]"
        style={{ borderColor: checked ? 'transparent' : T.color.border, background: checked ? T.color.primary : 'transparent' }}>
        {checked && (
          <svg className="absolute inset-0 m-auto w-3 h-3" viewBox="0 0 12 12" fill="none">
            <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    </span>
    <span className="text-sm" style={{ color: T.color.fg }}>{label}</span>
  </label>
);

// ─── Switch ──────────────────────────────────────────────────────────────────
interface SwitchProps { checked: boolean; onChange: (checked: boolean) => void; label?: string; disabled?: boolean; className?: string; }
export const Switch: React.FC<SwitchProps> = ({ checked, onChange, label, disabled, className = '' }) => (
  <label className={`inline-flex items-center gap-2.5 cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
    <button type="button" role="switch" aria-checked={checked} disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A5F]"
      style={{ background: checked ? T.color.primary : '#CBD5E1' }}>
      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${checked ? 'translate-x-0' : 'translate-x-5'}`}
        style={{ marginTop: '2px', marginLeft: '2px', marginRight: checked ? '2px' : '0' }} />
    </button>
    {label && <span className="text-sm" style={{ color: T.color.fg }}>{label}</span>}
  </label>
);


// ═══════════════════════════════════════════════════════════════════════════════
// BUTTON
// ═══════════════════════════════════════════════════════════════════════════════

type BtnVariant = 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost' | 'outline' | 'success';
type BtnSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant; size?: BtnSize; fullWidth?: boolean; loading?: boolean;
  leftIcon?: ReactNode; rightIcon?: ReactNode;
}

const btnStyles: Record<BtnVariant, { bg: string; color: string; border?: string }> = {
  primary:   { bg: T.color.primary, color: '#FFF' },
  secondary: { bg: T.color.muted, color: T.color.secondary, border: `1px solid ${T.color.border}` },
  accent:    { bg: T.color.gold, color: '#FFF' },
  danger:    { bg: T.color.danger, color: '#FFF' },
  ghost:     { bg: 'transparent', color: T.color.secondary },
  outline:   { bg: 'transparent', color: T.color.primary, border: `1.5px solid ${T.color.primary}` },
  success:   { bg: T.color.success, color: '#FFF' },
};

const btnHover: Record<BtnVariant, string> = {
  primary: T.color['primary-dark'], secondary: T.color.border, accent: T.color['gold-dark'],
  danger: '#B91C1C', ghost: T.color.muted, outline: '#EFF6FF', success: T.color.success,
};

const btnSizes: Record<BtnSize, string> = {
  xs: 'px-2.5 py-1 text-xs gap-1 rounded-md',
  sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
  md: 'px-4 py-2.5 text-sm gap-2 rounded-lg',
  lg: 'px-6 py-3 text-base gap-2.5 rounded-xl',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary', size = 'md', fullWidth, loading, leftIcon, rightIcon,
  className = '', disabled, children, style: propStyle, ...props
}) => {
  const s = btnStyles[variant];
  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-all duration-200
        cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A5F]
        ${btnSizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      style={{ background: s.bg, color: s.color, border: s.border, ...propStyle }}
      disabled={disabled || loading}
      onMouseEnter={(e) => { if (!disabled && !loading) e.currentTarget.style.background = btnHover[variant]; }}
      onMouseLeave={(e) => { if (!disabled && !loading) e.currentTarget.style.background = s.bg; }}
      {...props}
    >
      {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {!loading && leftIcon}{children}{!loading && rightIcon}
    </button>
  );
};


// ═══════════════════════════════════════════════════════════════════════════════
// DISPLAY COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Card ────────────────────────────────────────────────────────────────────
interface CardProps { children: ReactNode; padding?: 'none' | 'sm' | 'md' | 'lg'; hover?: boolean; className?: string; onClick?: () => void; style?: React.CSSProperties; }
const cardPad = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6 sm:p-8' };
export const Card: React.FC<CardProps> = ({ children, padding = 'md', hover, className = '', onClick, style }) => (
  <div className={`bg-white rounded-xl border ${cardPad[padding]} ${hover ? 'transition-shadow duration-200 hover:shadow-md' : 'shadow-xs'} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    style={{ borderColor: T.color.border, ...style }} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
    {children}
  </div>
);

// ─── Badge ───────────────────────────────────────────────────────────────────
type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default' | 'accent';
interface BadgeProps { children: ReactNode; variant?: BadgeVariant; pill?: boolean; className?: string; }
const badgeStyles: Record<BadgeVariant, { bg: string; color: string }> = {
  success: { bg: T.color['success-bg'], color: T.color['success-text'] },
  warning: { bg: T.color['warning-bg'], color: T.color['warning-text'] },
  danger:  { bg: T.color['danger-bg'], color: T.color['danger-text'] },
  info:    { bg: T.color['info-bg'], color: T.color['info-text'] },
  default: { bg: T.color.muted, color: T.color.secondary },
  accent:  { bg: T.color['warning-bg'], color: T.color['warning-text'] },
};
export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', pill = true, className = '' }) => {
  const s = badgeStyles[variant];
  return <span className={`inline-flex items-center font-semibold text-xs ${pill ? 'rounded-full px-2.5 py-0.5' : 'rounded-md px-2 py-0.5'} ${className}`} style={{ background: s.bg, color: s.color }}>{children}</span>;
};

// ─── Avatar ──────────────────────────────────────────────────────────────────
interface AvatarProps { initials: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; color?: 'primary' | 'accent' | 'blue' | 'success' | 'danger'; className?: string; }
const avSizes = { xs: 'w-6 h-6 text-[10px]', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-lg' };
const avColors: Record<string, { bg: string; color: string }> = {
  primary: { bg: 'rgba(30,58,95,0.1)', color: T.color.primary },
  accent: { bg: 'rgba(161,98,7,0.15)', color: T.color['gold-light'] },
  blue: { bg: 'rgba(37,99,235,0.1)', color: T.color.blue },
  success: { bg: T.color['success-bg'], color: T.color.success },
  danger: { bg: T.color['danger-bg'], color: T.color.danger },
};
export const Avatar: React.FC<AvatarProps> = ({ initials, size = 'md', color = 'accent', className = '' }) => {
  const c = avColors[color];
  return <div className={`rounded-full flex items-center justify-center font-bold flex-shrink-0 ${avSizes[size]} ${className}`} style={{ background: c.bg, color: c.color }}>{initials}</div>;
};

// ─── AvatarGroup ─────────────────────────────────────────────────────────────
interface AvatarGroupProps { items: { initials: string; color?: 'primary' | 'accent' | 'blue' }[]; max?: number; size?: 'sm' | 'md'; }
export const AvatarGroup: React.FC<AvatarGroupProps> = ({ items, max = 4, size = 'sm' }) => {
  const shown = items.slice(0, max);
  const remaining = items.length - max;
  return (
    <div className="flex -space-x-2 space-x-reverse">
      {shown.map((item, i) => <Avatar key={i} initials={item.initials} size={size} color={item.color || 'accent'} className="ring-2 ring-white" />)}
      {remaining > 0 && (
        <div className={`rounded-full flex items-center justify-center font-bold bg-[#F1F5F9] text-[#64748B] ring-2 ring-white ${avSizes[size]}`}>
          +{remaining}
        </div>
      )}
    </div>
  );
};

// ─── PriceDisplay ────────────────────────────────────────────────────────────
interface PriceDisplayProps { amount: number; size?: 'sm' | 'md' | 'lg'; currency?: string; }
const priceSizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' };
export const PriceDisplay: React.FC<PriceDisplayProps> = ({ amount, size = 'md', currency = 'تومان' }) => (
  <div className="flex items-baseline gap-1.5">
    <span className={`${priceSizes[size]} font-extrabold`} style={{ color: T.color.gold }}>{new Intl.NumberFormat('fa-IR').format(amount)}</span>
    <span className="text-xs" style={{ color: T.color['muted-fg'] }}>{currency}</span>
  </div>
);


// ═══════════════════════════════════════════════════════════════════════════════
// FEEDBACK COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Alert ───────────────────────────────────────────────────────────────────
type AlertVariant = 'success' | 'warning' | 'danger' | 'info';
interface AlertProps { variant?: AlertVariant; title?: string; children: ReactNode; closable?: boolean; onClose?: () => void; className?: string; }
const alertStyles: Record<AlertVariant, { bg: string; border: string; color: string; icon: string }> = {
  success: { bg: '#F0FDF4', border: '#BBF7D0', color: T.color['success-text'], icon: '✓' },
  warning: { bg: '#FFFBEB', border: '#FDE68A', color: T.color['warning-text'], icon: '⚠' },
  danger:  { bg: '#FEF2F2', border: '#FECACA', color: T.color['danger-text'], icon: '✕' },
  info:    { bg: '#EFF6FF', border: '#BFDBFE', color: T.color['info-text'], icon: 'ℹ' },
};
export const Alert: React.FC<AlertProps> = ({ variant = 'info', title, children, closable, onClose, className = '' }) => {
  const s = alertStyles[variant];
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl text-sm ${className}`} style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
      <span className="text-base flex-shrink-0 mt-0.5">{s.icon}</span>
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold mb-1">{title}</p>}
        <div>{children}</div>
      </div>
      {closable && (
        <button onClick={onClose} className="flex-shrink-0 opacity-60 hover:opacity-100 transition cursor-pointer text-sm">✕</button>
      )}
    </div>
  );
};

// ─── Toast ───────────────────────────────────────────────────────────────────
interface ToastItem { id: string; message: string; variant: AlertVariant; }
interface ToastContextType { toast: (message: string, variant?: AlertVariant) => void; }
const ToastContext = createContext<ToastContextType>({ toast: () => {} });
// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toast = useCallback((message: string, variant: AlertVariant = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-[60] space-y-2">
        {toasts.map((t) => <Alert key={t.id} variant={t.variant} className="shadow-lg animate-[slideUp_300ms_ease-out]">{t.message}</Alert>)}
      </div>
    </ToastContext.Provider>
  );
};

// ─── Spinner ─────────────────────────────────────────────────────────────────
interface SpinnerProps { size?: 'sm' | 'md' | 'lg'; className?: string; }
const spinSizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => (
  <div className={`${spinSizes[size]} border-4 rounded-full animate-spin ${className}`} style={{ borderColor: T.color.border, borderTopColor: T.color.primary }} />
);

// ─── Skeleton ────────────────────────────────────────────────────────────────
interface SkeletonProps { className?: string; }
export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg ${className}`} style={{ background: T.color.muted }} />
);

// ─── EmptyState ──────────────────────────────────────────────────────────────
interface EmptyStateProps { icon: ReactNode; title: string; description?: string; action?: ReactNode; }
export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="mb-4" style={{ color: T.color.border }}>{icon}</div>
    <Heading level="h4">{title}</Heading>
    {description && <Text color="secondary" className="mt-1 mb-4 max-w-sm">{description}</Text>}
    {action}
  </div>
);

// ─── Progress ────────────────────────────────────────────────────────────────
interface ProgressProps { value: number; max?: number; color?: 'primary' | 'accent' | 'success' | 'danger'; size?: 'sm' | 'md'; label?: string; className?: string; }
const progColors = { primary: T.color.primary, accent: T.color.gold, success: T.color.success, danger: T.color.danger };
const progSizes = { sm: 'h-1.5', md: 'h-2.5' };
export const Progress: React.FC<ProgressProps> = ({ value, max = 100, color = 'primary', size = 'md', label, className = '' }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={`w-full ${className}`}>
      {label && <div className="flex items-center justify-between mb-1.5"><Text size="xs" color="secondary">{label}</Text><Text size="xs" color="muted">{Math.round(pct)}%</Text></div>}
      <div className={`w-full rounded-full overflow-hidden ${progSizes[size]}`} style={{ background: T.color.muted }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: progColors[color] }} />
      </div>
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════════════════
// NAVIGATION COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Breadcrumb ──────────────────────────────────────────────────────────────
interface BreadcrumbItem { label: string; href?: string; onClick?: () => void; active?: boolean; }
interface BreadcrumbProps { items: BreadcrumbItem[]; className?: string; }
export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => (
  <nav className={`flex items-center gap-1.5 text-sm ${className}`} aria-label="breadcrumb">
    {items.map((item, i) => (
      <React.Fragment key={i}>
        {i > 0 && <span style={{ color: T.color.border }}>←</span>}
        {item.href || item.onClick ? (
          <button onClick={item.onClick} className="transition cursor-pointer" style={{ color: item.active ? T.color.primary : T.color['muted-fg'] }}>
            {item.label}
          </button>
        ) : (
          <span style={{ color: item.active ? T.color.primary : T.color.fg }}>{item.label}</span>
        )}
      </React.Fragment>
    ))}
  </nav>
);

// ─── Tabs ────────────────────────────────────────────────────────────────────
interface Tab { key: string; label: string; icon?: ReactNode; }
interface TabsProps { tabs: Tab[]; active: string; onChange: (key: string) => void; size?: 'sm' | 'md'; }
export const Tabs: React.FC<TabsProps> = ({ tabs, active, onChange, size = 'md' }) => {
  const pad = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm';
  return (
    <div className="flex gap-2 flex-wrap">
      {tabs.map((tab) => (
        <button key={tab.key} onClick={() => onChange(tab.key)}
          className={`flex items-center gap-1.5 ${pad} rounded-lg font-medium transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A5F]`}
          style={{ background: active === tab.key ? T.color.primary : T.color.surface, color: active === tab.key ? '#FFF' : T.color.secondary, border: `1px solid ${active === tab.key ? T.color.primary : T.color.border}` }}>
          {tab.icon}{tab.label}
        </button>
      ))}
    </div>
  );
};

// ─── Pagination ──────────────────────────────────────────────────────────────
interface PaginationProps { current: number; total: number; perPage: number; onChange: (page: number) => void; }
export const Pagination: React.FC<PaginationProps> = ({ current, total, perPage, onChange }) => {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;
  const pages: (number | '...')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= current - 1 && i <= current + 1)) pages.push(i);
    else if (pages[pages.length - 1] !== '...') pages.push('...');
  }
  return (
    <div className="flex items-center justify-center gap-1.5">
      <Button variant="secondary" size="xs" disabled={current <= 1} onClick={() => onChange(current - 1)}>→</Button>
      {pages.map((p, i) => p === '...' ? <span key={`e${i}`} className="px-1" style={{ color: T.color['muted-fg'] }}>…</span>
        : <Button key={p} variant={p === current ? 'primary' : 'ghost'} size="xs" onClick={() => onChange(p)}>{p}</Button>)}
      <Button variant="secondary" size="xs" disabled={current >= totalPages} onClick={() => onChange(current + 1)}>←</Button>
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════════════════
// OVERLAY COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Modal ───────────────────────────────────────────────────────────────────
interface ModalProps { open: boolean; onClose: () => void; title?: string; children: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl'; footer?: ReactNode; }
const modalMaxW = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl' };
export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, size = 'md', footer }) => {
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const titleId = useId();
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = requestAnimationFrame(() => (panel.current?.querySelector<HTMLElement>('input:not(:disabled), select:not(:disabled), textarea:not(:disabled)') || panel.current?.querySelector<HTMLElement>('button:not(:disabled)') || panel.current)?.focus());
    const handleKey = (event: KeyboardEvent) => {
      if (document.querySelector('.swal2-container')) return;
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(panel.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') || []).filter(element => element.getClientRects().length > 0);
      const first = focusable[0]; const last = focusable.at(-1);
      if (!first) { event.preventDefault(); panel.current?.focus(); }
      else if (event.shiftKey && (document.activeElement === first || !panel.current?.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !panel.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      cancelAnimationFrame(frame); document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus();
    };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[50] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }} />
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} aria-label={title ? undefined : 'پنجره'} tabIndex={-1} className={`relative bg-white rounded-2xl shadow-2xl w-full ${modalMaxW[size]} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${T.color.border}` }}>
            <h4 id={titleId} className="text-lg font-bold">{title}</h4>
            <button type="button" aria-label="بستن پنجره" onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-lg transition cursor-pointer hover:bg-[#F1F5F9]" style={{ color: T.color['muted-fg'] }}>✕</button>
          </div>
        )}
        <div className="p-6">{children}</div>
        {footer && <div className="px-6 py-4" style={{ borderTop: `1px solid ${T.color.border}` }}>{footer}</div>}
      </div>
    </div>
  );
};

// ─── Tooltip ─────────────────────────────────────────────────────────────────
interface TooltipProps { content: string; children: ReactElement; position?: 'top' | 'bottom' | 'left' | 'right'; }
export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const [show, setShow] = useState(false);
  const posMap = { top: 'bottom-full left-1/2 -translate-x-1/2 mb-2', bottom: 'top-full left-1/2 -translate-x-1/2 mt-2', left: 'right-full top-1/2 -translate-y-1/2 mr-2', right: 'left-full top-1/2 -translate-y-1/2 ml-2' };
  return (
    <span className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span className={`absolute ${posMap[position]} px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap z-[70] pointer-events-none animate-[fadeIn_150ms_ease-out]`}
          style={{ background: T.color.dark, color: '#FFF' }}>
          {content}
        </span>
      )}
    </span>
  );
};


// ═══════════════════════════════════════════════════════════════════════════════
// DATA COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── StatCard ────────────────────────────────────────────────────────────────
interface StatCardProps { label: string; value: string | number; icon: ReactNode; color?: string; trend?: { value: number; isPositive: boolean }; }
export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color = T.color.primary, trend }) => (
  <Card padding="lg" hover>
    <div className="flex items-start justify-between">
      <div>
        <Caption color="muted">{label}</Caption>
        <Heading level="h3" className="mt-1">{value}</Heading>
        {trend && <Text size="xs" color={trend.isPositive ? 'default' : 'muted'} weight="medium" className={`mt-1 ${trend.isPositive ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
          {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
        </Text>}
      </div>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
        <span style={{ color }}>{icon}</span>
      </div>
    </div>
  </Card>
);

// ─── DataTable ───────────────────────────────────────────────────────────────
interface Column<T> { key: string; header: string; render?: (item: T, index: number) => ReactNode; className?: string; }
interface DataTableProps<T> { columns: Column<T>[]; data: T[]; keyExtractor: (item: T) => string | number; emptyMessage?: string; }
export function DataTable<T extends Record<string, ReactNode>>({ columns, data, keyExtractor, emptyMessage = 'داده‌ای موجود نیست' }: DataTableProps<T>) {
  if (data.length === 0) {
    return <Card padding="lg"><EmptyState icon={<span className="text-4xl">📋</span>} title={emptyMessage} /></Card>;
  }
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr style={{ background: T.color.bg }}>
            {columns.map((col) => <th key={col.key} className={`px-4 py-3 text-right text-xs font-semibold border-b-2 ${col.className || ''}`} style={{ color: T.color['muted-fg'], borderColor: T.color.border }}>{col.header}</th>)}
          </tr></thead>
          <tbody>{data.map((item, idx) => (
            <tr key={keyExtractor(item)} className="transition-colors duration-150" style={{ borderBottom: `1px solid ${T.color.muted}` }}
              onMouseEnter={(e) => (e.currentTarget.style.background = `${T.color.muted}80`)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              {columns.map((col) => <td key={col.key} className={`px-4 py-3 text-sm ${col.className || ''}`} style={{ color: T.color.fg }}>{col.render ? col.render(item, idx) : item[col.key]}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── PageHeader ──────────────────────────────────────────────────────────────
interface PageHeaderProps { title: string; subtitle?: string; icon?: ReactNode; actions?: ReactNode; breadcrumb?: ReactNode; className?: string; }
export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, icon, actions, breadcrumb, className = '' }) => (
  <div className={`mb-6 ${className}`}>
    {breadcrumb && <div className="mb-3">{breadcrumb}</div>}
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3">
        {icon && <span style={{ color: T.color.gold }}>{icon}</span>}
        <div>
          <Heading level="h2">{title}</Heading>
          {subtitle && <Text size="sm" color="secondary" className="mt-0.5">{subtitle}</Text>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  </div>
);


// ═══════════════════════════════════════════════════════════════════════════════
// INDEX — re-export everything
// ═══════════════════════════════════════════════════════════════════════════════
// Usage: import { Button, Card, ... } from '@/design-system/components';
