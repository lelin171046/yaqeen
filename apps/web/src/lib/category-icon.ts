import {
  BadgeCheck,
  Gift,
  Package,
  PackageCheck,
  ShoppingBag,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

export function categoryIcon(slug: string): LucideIcon {
  const value = slug.toLowerCase();

  if (value.includes('kid') || value.includes('toy')) return Gift;
  if (value.includes('home') || value.includes('decor')) return Sparkles;
  if (value.includes('fashion') || value.includes('wear')) return ShoppingBag;
  if (value.includes('deal') || value.includes('sale')) return BadgeCheck;
  if (value.includes('essential') || value.includes('season')) return Package;

  return PackageCheck;
}
