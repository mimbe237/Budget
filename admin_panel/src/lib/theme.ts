// Central design tokens module for the admin panel.
// These tokens can be consumed in Tailwind via CSS variables or directly in components.

export const THEME = {
  colors: {
    background: {
      base: 'hsl(210 30% 98%)',
      subtle: 'hsl(210 30% 96%)',
      elevated: 'hsl(210 30% 94%)',
      overlay: 'hsla(210 30% 8% / 0.60)',
      inverted: 'hsl(222 47% 11%)',
    },
    border: {
      subtle: 'hsl(214 32% 91%)',
      strong: 'hsl(220 14% 46%)',
      inverted: 'hsl(218 23% 26%)',
    },
    text: {
      primary: 'hsl(222 47% 11%)',
      secondary: 'hsl(219 15% 38%)',
      tertiary: 'hsl(215 16% 47%)',
      placeholder: 'hsl(214 20% 65%)',
      inverted: 'hsl(210 40% 98%)',
    },
    accent: {
      brand: 'hsl(222 89% 55%)',
      brandHover: 'hsl(222 89% 48%)',
      brandMuted: 'hsl(223 100% 96%)',
      gradientFrom: 'hsl(223 100% 56%)',
      gradientTo: 'hsl(257 87% 67%)',
    },
    states: {
      success: 'hsl(152 58% 28%)',
      successMuted: 'hsl(149 70% 96%)',
      warning: 'hsl(41 86% 55%)',
      warningMuted: 'hsl(49 100% 97%)',
      danger: 'hsl(0 72% 51%)',
      dangerMuted: 'hsl(0 92% 95%)',
      info: 'hsl(199 89% 48%)',
      infoMuted: 'hsl(199 100% 96%)',
    },
    chart: {
      blue: 'hsl(222 89% 55%)',
      purple: 'hsl(257 87% 67%)',
      green: 'hsl(152 58% 28%)',
      orange: 'hsl(41 86% 55%)',
      grid: 'hsl(214 32% 91%)',
    },
    overlay: {
      scrim: 'hsla(222 47% 11% / 0.66)',
      hover: 'hsla(222 47% 11% / 0.08)',
      active: 'hsla(222 47% 11% / 0.16)',
    },
  },
  typography: {
    fontFamily: {
      sans: 'var(--font-geist-sans)',
      mono: 'var(--font-geist-mono)',
    },
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      md: '1.125rem',
      lg: '1.25rem',
      xl: '1.5rem',
      '2xl': '1.75rem',
      '3xl': '2rem',
    },
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      snug: 1.25,
      normal: 1.5,
    },
  },
  layout: {
    radius: {
      sm: '4px',
      md: '8px',
      lg: '12px',
      pill: '999px',
    },
    shadow: {
      sm: '0 1px 2px 0 hsla(222 47% 11% / 0.05)',
      md: '0 2px 4px -2px hsla(222 47% 11% / 0.08), 0 4px 8px -2px hsla(222 47% 11% / 0.04)',
      lg: '0 4px 8px -4px hsla(222 47% 11% / 0.08), 0 8px 16px -4px hsla(222 47% 11% / 0.04)',
      inset: 'inset 0 0 0 1px hsla(214 32% 91% / 1)',
    },
    spacing: {
      px: '1px',
      1: '0.25rem',
      2: '0.5rem',
      3: '0.75rem',
      4: '1rem',
      5: '1.25rem',
      6: '1.5rem',
      8: '2rem',
      10: '2.5rem',
      12: '3rem',
      16: '4rem',
      20: '5rem',
      24: '6rem',
    },
    zIndex: {
      behind: -1,
      base: 0,
      dropdown: 20,
      sticky: 30,
      overlay: 40,
      modal: 50,
      popover: 60,
      tooltip: 70,
    },
  },
  motion: {
    duration: {
      fast: '120ms',
      base: '180ms',
      slow: '240ms',
    },
    easing: {
      standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
      emphasized: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    },
  },
};

// Helper to convert a subset of tokens to CSS variables (can expand as needed)
export function injectThemeVariables(): string {
  const { colors, typography, layout, motion } = THEME;
  const vars: Record<string, string> = {
    '--color-bg-base': colors.background.base,
    '--color-bg-subtle': colors.background.subtle,
    '--color-bg-elevated': colors.background.elevated,
    '--color-bg-overlay': colors.background.overlay,
    '--color-text-primary': colors.text.primary,
    '--color-text-secondary': colors.text.secondary,
    '--color-text-inverted': colors.text.inverted,
    '--color-brand': colors.accent.brand,
    '--color-brand-hover': colors.accent.brandHover,
    '--color-brand-muted': colors.accent.brandMuted,
    '--color-success': colors.states.success,
    '--color-danger': colors.states.danger,
    '--radius-md': layout.radius.md,
    '--shadow-md': layout.shadow.md,
    '--font-sans': typography.fontFamily.sans,
    '--ease-standard': motion.easing.standard,
    '--duration-base': motion.duration.base,
  };
  return Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(';');
}

export default THEME;
