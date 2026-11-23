import { ORDER_STATUS_LABELS, type OrderStatus } from '@anando-deal/shared';
import { Loader2, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

const toneClasses: Record<string, string> = {
  primary: 'bg-primary/10 text-primary',
  emerald: 'bg-secondary text-foreground',
  amber: 'bg-muted text-muted-foreground',
  rose: 'bg-black text-white',
  sky: 'bg-neutral-200 text-black',
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'primary',
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: keyof typeof toneClasses;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && (
          <span className={cn('grid h-10 w-10 place-items-center rounded-xl', toneClasses[tone])}>
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
    </div>
  );
}

const statusColors: Record<string, string> = {
  PENDING: 'border-border bg-muted text-muted-foreground',
  CONFIRMED: 'border-black bg-secondary text-foreground',
  PROCESSING: 'border-border bg-secondary/70 text-foreground',
  SHIPPED: 'border-black bg-black text-white',
  DELIVERED: 'border-black bg-secondary text-black',
  DELIVERY_FAILED: 'border-border bg-muted text-foreground',
  CANCELLED: 'border-black bg-black text-white',
  RETURNED: 'border-border bg-muted text-muted-foreground',
  UNPAID: 'border-border bg-muted text-muted-foreground',
  PAID: 'border-black bg-secondary text-foreground',
  REFUNDED: 'border-border bg-muted text-muted-foreground',
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <Badge
      variant="outline"
      className={cn('whitespace-nowrap', statusColors[value] ?? 'bg-muted text-foreground')}
    >
      {ORDER_STATUS_LABELS[value as OrderStatus] ?? value.toLowerCase().replace(/_/g, ' ')}
    </Badge>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card px-6 py-14 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Pagination({
  page,
  pages,
  total,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  onPage: (page: number) => void;
}) {
  if (pages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-xs text-muted-foreground">
        Page {page} of {pages} · {total} total
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border bg-card py-20">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        {label}
      </div>
    </div>
  );
}

export function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
      {message}
    </div>
  );
}
