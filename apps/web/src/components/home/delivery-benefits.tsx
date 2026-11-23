import {
  Package,
  Phone,
  ShieldCheck,
  Sparkles,
  Truck,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { DeliveryBenefitSettings } from '@anando-deal/shared';

const icons: Record<DeliveryBenefitSettings['icon'], LucideIcon> = {
  truck: Truck,
  wallet: Wallet,
  shield: ShieldCheck,
  phone: Phone,
  package: Package,
  sparkles: Sparkles,
};

export function DeliveryBenefits({ benefits }: { benefits: DeliveryBenefitSettings[] }) {
  const active = benefits.filter((benefit) => benefit.isActive);

  if (active.length === 0) {
    return null;
  }

  return (
    <section className="border-y border-border/70 bg-card">
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {active.map((benefit) => {
          const Icon = icons[benefit.icon] ?? Package;

          return (
            <div key={benefit.id} className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">{benefit.title}</p>
                <p className="text-xs text-muted-foreground">{benefit.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
