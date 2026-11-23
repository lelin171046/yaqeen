import { Timer, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProductCard } from '@/components/product-card';
import { SectionHeading } from '@/components/section-heading';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useProducts } from '@/hooks/use-catalog';

function remainingParts(target: Date, now: number) {
  const total = Math.max(0, target.getTime() - now);
  const days = Math.floor(total / 86_400_000);
  const hours = Math.floor((total % 86_400_000) / 3_600_000);
  const minutes = Math.floor((total % 3_600_000) / 60_000);
  const seconds = Math.floor((total % 60_000) / 1000);

  return {
    expired: total === 0,
    days,
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  };
}

function Countdown({ endsAt }: { endsAt: Date }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const remaining = remainingParts(endsAt, now);

  if (remaining.expired) {
    return <span className="text-sm font-semibold text-muted-foreground">Offer ended</span>;
  }

  return (
    <div className="flex items-center gap-1.5" aria-label="Time left in this sale">
      <Timer className="h-4 w-4" />
      {remaining.days > 0 && <span>{remaining.days}d</span>}
      <span>{remaining.hours}h</span>
      <span>:</span>
      <span>{remaining.minutes}m</span>
      <span>:</span>
      <span>{remaining.seconds}s</span>
    </div>
  );
}

export function FlashSaleSection() {
  const { data, isLoading, isError } = useProducts({
    flashSale: true,
    limit: 8,
    sort: 'newest',
  });
  const products = useMemo(() => data?.items ?? [], [data]);

  const endsAt = useMemo(() => {
    const dates = products
      .flatMap((product) => product.variants.map((variant) => variant.saleEndsAt))
      .filter((value): value is string => Boolean(value))
      .map((value) => new Date(value))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    return dates[0];
  }, [products]);

  return (
    <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <SectionHeading
          eyebrow="Limited time"
          title="Flash deals"
          description="Real sale windows set on active products."
          href="/shop?sort=price_asc"
          linkLabel="See all deals"
        />
        {endsAt && (
          <div className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            <Countdown endsAt={endsAt} />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-2xl border bg-card">
              <Skeleton className="aspect-square rounded-none" />
              <div className="space-y-3 p-4">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="mt-7 rounded-2xl border border-dashed px-6 py-12 text-center">
          <p className="font-semibold">Flash deals could not be loaded</p>
          <p className="mt-1 text-sm text-muted-foreground">Please try again in a moment.</p>
        </div>
      ) : products.length > 0 ? (
        <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-7 flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-12 text-center">
          <Zap className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">No flash deals are running right now</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Check back soon or browse the full catalog.
          </p>
          <Button asChild variant="outline" className="mt-5">
            <Link to="/shop">Browse products</Link>
          </Button>
        </div>
      )}
    </section>
  );
}
