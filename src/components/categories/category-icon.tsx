'use client';

import {
  Landmark,
  ShoppingBag,
  Utensils,
  Car,
  HeartPulse,
  Home,
  PiggyBank,
  Receipt,
  GraduationCap,
  Briefcase,
  Gift,
  Wallet,
  CreditCard,
  Sparkles,
  Dumbbell,
  Plane,
  Building2,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  landmark: Landmark,
  shopping: ShoppingBag,
  food: Utensils,
  transport: Car,
  health: HeartPulse,
  home: Home,
  savings: PiggyBank,
  bills: Receipt,
  education: GraduationCap,
  business: Briefcase,
  gifts: Gift,
  wallet: Wallet,
  credit: CreditCard,
  lifestyle: Sparkles,
  fitness: Dumbbell,
  travel: Plane,
  rent: Building2,
};

type CategoryIconProps = {
  icon?: string | null;
  fallback?: React.ReactNode;
  className?: string;
};

export function CategoryIcon({ icon, fallback, className }: CategoryIconProps) {
  if (!icon) {
    return fallback ?? <Landmark className={className} />;
  }
  const Component = ICON_MAP[icon] ?? Landmark;
  return <Component className={className} />;
}

export const AVAILABLE_CATEGORY_ICONS = Object.keys(ICON_MAP).map(key => ({
  value: key,
  label: key.charAt(0).toUpperCase() + key.slice(1),
}));
