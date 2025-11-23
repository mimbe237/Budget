import React from 'react';

export type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  subtle?: boolean; // subtle = soft background + colored text, otherwise solid pill
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
  disabled?: boolean;
}

function cls(...parts: (string | undefined | false)[]) {
  return parts.filter(Boolean).join(' ');
}

function variantClasses(variant: BadgeVariant = 'neutral', subtle = false) {
  // Using Tailwind with fallback to CSS variables defined earlier if present.
  const map: Record<BadgeVariant, { solid: string; subtle: string }> = {
    neutral: {
      solid: 'bg-slate-800 text-white',
      subtle: 'bg-white/70 text-slate-700 ring-1 ring-black/5 dark:bg-gray-800/70 dark:text-slate-100',
    },
    brand: {
      solid: 'bg-gradient-to-r from-[var(--color-brand,#3E63DD)] to-[var(--color-brand-hover,#3257c7)] text-white shadow-sm shadow-[var(--color-brand,#3E63DD)]/30',
      subtle: 'bg-[var(--color-brand-muted,#f3f6ff)] text-[var(--color-brand,#3E63DD)] ring-1 ring-[var(--color-brand,#3E63DD)]/25 dark:bg-[color:rgba(74,108,247,0.16)]',
    },
    success: {
      solid: 'bg-emerald-600 text-white',
      subtle: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-900/25 dark:text-emerald-200',
    },
    warning: {
      solid: 'bg-amber-500 text-white',
      subtle: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-900/25 dark:text-amber-200',
    },
    danger: {
      solid: 'bg-rose-600 text-white',
      subtle: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100 dark:bg-rose-900/25 dark:text-rose-200',
    },
    info: {
      solid: 'bg-sky-600 text-white',
      subtle: 'bg-sky-50 text-sky-700 ring-1 ring-sky-100 dark:bg-sky-900/25 dark:text-sky-200',
    },
  };
  return subtle ? map[variant].subtle : map[variant].solid;
}

function sizeClasses(size: BadgeSize = 'md') {
  switch (size) {
    case 'sm':
      return 'text-xs h-6 px-2';
    case 'md':
    default:
      return 'text-sm h-7 px-3';
  }
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  subtle = false,
  icon,
  children,
  className,
    onClick,
    ariaLabel,
    disabled,
  }) => {
  return (
    <span
      role={onClick ? 'button' : 'status'}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      tabIndex={onClick && !disabled ? 0 : -1}
      onClick={disabled ? undefined : onClick}
      className={cls(
        'inline-flex items-center gap-1 rounded-full font-semibold select-none align-middle whitespace-nowrap tracking-wide',
        'transition-colors duration-150',
        sizeClasses(size),
        variantClasses(variant, subtle),
        disabled && 'opacity-50 cursor-not-allowed',
        onClick && !disabled && 'cursor-pointer hover:brightness-110 active:brightness-95',
        subtle && 'ring-1 ring-inset ring-black/5',
        className
      )}
    >
      {icon && <span className="flex items-center justify-center text-[0.9em]">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
