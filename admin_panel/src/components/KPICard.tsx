import React from 'react';
// import { THEME } from '@/lib/theme';
// Placeholder for future utility import (cn) if needed.

// Direction of delta change
export type DeltaDirection = 'up' | 'down' | 'flat';

export interface KPICardProps {
  label: string;
  value: string | number;
  delta?: string | number; // raw delta value (e.g. 12%)
  deltaDirection?: DeltaDirection;
  description?: string; // secondary description below
  icon?: React.ReactNode; // main icon top-left
  footer?: React.ReactNode; // optional footer area
  loading?: boolean; // skeleton loader state
  children?: React.ReactNode; // slot for sparkline / mini chart
  className?: string;
  onClick?: () => void;
  'aria-label'?: string;
}

// Simple internal utility while waiting for a shared cn helper.
function mergeClasses(...parts: (string | undefined | false)[]): string {
  return parts.filter(Boolean).join(' ');
}

function getDeltaColor(direction?: DeltaDirection) {
  switch (direction) {
    case 'up':
      return 'text-green-600';
    case 'down':
      return 'text-red-600';
    case 'flat':
      return 'text-neutral-500';
    default:
      return 'text-neutral-500';
  }
}

function getDeltaIcon(direction?: DeltaDirection) {
  switch (direction) {
    case 'up':
      return '▲';
    case 'down':
      return '▼';
    case 'flat':
      return '–';
    default:
      return null;
  }
}

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  delta,
  deltaDirection,
  description,
  icon,
  footer,
  loading,
  children,
  className,
  onClick,
  'aria-label': ariaLabel,
}) => {
  // Loader skeleton structure
  if (loading) {
    return (
      <div
        className={mergeClasses(
          'group relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 p-5 shadow-lg shadow-[rgba(62,99,221,0.08)] backdrop-blur animate-pulse dark:border-gray-800/80 dark:bg-gray-900/70',
          className
        )}
        aria-busy="true"
        aria-label={ariaLabel || label}
      >
        <div className="flex items-start justify-between">
          <div className="h-5 w-24 rounded bg-neutral-200" />
          <div className="h-6 w-6 rounded bg-neutral-200" />
        </div>
        <div className="h-8 w-32 rounded bg-neutral-200" />
        <div className="h-4 w-40 rounded bg-neutral-200" />
        <div className="h-6 w-full rounded bg-neutral-200" />
      </div>
    );
  }

  const deltaColor = getDeltaColor(deltaDirection);
  const deltaIcon = getDeltaIcon(deltaDirection);

  return (
    <div
      className={mergeClasses(
        'group relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 p-5 shadow-xl shadow-[rgba(62,99,221,0.08)] backdrop-blur-md transition-all duration-150',
        'dark:border-gray-800/80 dark:bg-gray-900/70',
        onClick && 'cursor-pointer hover:-translate-y-[2px]',
        className
      )}
      onClick={onClick}
      aria-label={ariaLabel || label}
      role={onClick ? 'button' : undefined}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--color-brand,#3E63DD)]/8 via-transparent to-[var(--color-brand-secondary,#8b5cf6)]/12 opacity-90" />
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-brand,#3E63DD)]/30 to-transparent" />

      <div className="relative flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-brand-muted,#f3f6ff)] text-[var(--color-brand,#3E63DD)] shadow-inner dark:bg-[color:rgba(74,108,247,0.14)]">
                {icon}
              </div>
            )}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
                {label}
              </span>
              {description && (
                <p className="text-xs leading-snug text-neutral-600 dark:text-neutral-400">
                  {description}
                </p>
              )}
            </div>
          </div>

          {delta !== undefined && (
            <div className={mergeClasses('flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-semibold shadow-sm ring-1 ring-black/5 dark:bg-gray-800/80', deltaColor)}>
              {deltaIcon && <span className="mr-1 text-[10px] leading-none">{deltaIcon}</span>}
              <span>{delta}</span>
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-[var(--color-text-primary,#0F172A)] dark:text-white">
            {value}
          </span>
        </div>

        {children && (
          <div className="mt-auto">
            {/* chart / sparkline slot */}
            {children}
          </div>
        )}

        {footer && (
          <div className="mt-auto border-t border-neutral-200 pt-3 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;
