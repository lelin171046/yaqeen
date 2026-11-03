import {
  formatBdt,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  type OrderStatus,
  type PaymentMethod,
} from '@yaqeen/shared';
import {
  Check,
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Receipt,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { SiteLayout } from '@/components/layout/site-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTrackOrder } from '@/hooks/use-orders';
import { getApiErrorMessage } from '@/lib/api-error';
import { getWhatsAppHref } from '@/lib/whatsapp';
import { cn } from '@/lib/utils';

const statusFlow: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
];

const paymentStatusStyles: Record<string, string> = {
  UNPAID: 'bg-amber-50 text-amber-700',
  PAID: 'bg-emerald-50 text-emerald-700',
  REFUNDED: 'bg-muted text-muted-foreground',
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function OrderPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [params, setParams] = useSearchParams();
  const phone = params.get('phone') ?? '';
  const [phoneInput, setPhoneInput] = useState(phone);
  const { data: order, isLoading, isError, error } = useTrackOrder(
    orderNumber,
    phone || undefined,
  );

  const submitPhone = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = new URLSearchParams(params);
    next.set('phone', phoneInput.trim());
    setParams(next);
  };

  if (!phone) {
    return (
      <SiteLayout>
        <main className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border bg-card p-6 text-center sm:p-10">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-secondary">
              <Receipt className="h-6 w-6 text-primary" />
            </div>
            <h1 className="mt-5 text-2xl font-semibold">View your order</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter the phone number you used when placing order{' '}
              <span className="font-semibold text-foreground">{orderNumber}</span>.
            </p>
            <form onSubmit={submitPhone} className="mt-6 flex flex-col gap-3 text-left sm:flex-row">
              <Input
                value={phoneInput}
                onChange={(event) => setPhoneInput(event.target.value)}
                placeholder="01XXXXXXXXX"
                inputMode="tel"
                aria-label="Phone number"
                required
              />
              <Button type="submit">View order</Button>
            </form>
          </div>
        </main>
      </SiteLayout>
    );
  }

  if (isLoading) {
    return (
      <SiteLayout>
        <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Loading your order...</p>
        </main>
      </SiteLayout>
    );
  }

  if (isError || !order) {
    return (
      <SiteLayout>
        <main className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border bg-card p-6 text-center sm:p-10">
            <h1 className="text-2xl font-semibold">Order not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">{getApiErrorMessage(error)}</p>
            <form onSubmit={submitPhone} className="mt-6 flex flex-col gap-3 text-left sm:flex-row">
              <Input
                value={phoneInput}
                onChange={(event) => setPhoneInput(event.target.value)}
                placeholder="Try another phone number"
                inputMode="tel"
                aria-label="Phone number"
                required
              />
              <Button type="submit">Try again</Button>
            </form>
            <Button asChild variant="outline" className="mt-4">
              <Link to="/track">Track a different order</Link>
            </Button>
          </div>
        </main>
      </SiteLayout>
    );
  }

  const currentIndex = statusFlow.indexOf(order.status as OrderStatus);
  const isCancelled = order.status === 'CANCELLED' || order.status === 'RETURNED';
  const whatsappHref = getWhatsAppHref(
    `Hi Yaqeen, I need help with order ${order.orderNumber}.`,
  );

  return (
    <SiteLayout>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="rounded-3xl border bg-card p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-50">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary">Order received</p>
                <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{order.orderNumber}</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Thank you, {order.customer.name}. We will call you to confirm before dispatch.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className="bg-secondary text-secondary-foreground">
                {ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status}
              </Badge>
              <Badge
                className={cn(
                  'border-0',
                  paymentStatusStyles[order.paymentStatus] ?? 'bg-muted text-muted-foreground',
                )}
              >
                {order.paymentStatus}
              </Badge>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-border/70 pt-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {formatDate(order.createdAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              {order.customer.phone}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {order.customer.area ? `${order.customer.area}, ` : ''}
              {order.customer.district}
            </span>
          </div>
        </div>

        <section className="mt-6 rounded-2xl border bg-card p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Order progress</h2>

          {isCancelled ? (
            <p className="mt-3 rounded-xl bg-destructive/5 p-4 text-sm text-destructive">
              This order is {ORDER_STATUS_LABELS[order.status as OrderStatus]?.toLowerCase()}.{' '}
              Message us on WhatsApp if you need help.
            </p>
          ) : (
            <div className="mt-5">
              <div className="hidden items-start justify-between gap-2 sm:flex">
                {statusFlow.map((status, index) => {
                  const reached = index <= currentIndex;
                  const current = index === currentIndex;

                  return (
                    <div key={status} className="relative flex flex-1 flex-col items-center text-center">
                      {index > 0 && (
                        <span
                          className={cn(
                            'absolute right-1/2 top-4 h-0.5 w-full',
                            index <= currentIndex ? 'bg-primary' : 'bg-border',
                          )}
                        />
                      )}
                      <span
                        className={cn(
                          'relative z-10 grid h-8 w-8 place-items-center rounded-full border-2',
                          reached
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-card text-muted-foreground',
                        )}
                      >
                        {reached ? <Check className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
                      </span>
                      <span
                        className={cn(
                          'mt-2 text-xs font-semibold',
                          current ? 'text-primary' : 'text-muted-foreground',
                        )}
                      >
                        {ORDER_STATUS_LABELS[status]}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 sm:hidden">
                {statusFlow.map((status, index) => (
                  <div key={status} className="flex items-center gap-3">
                    <span
                      className={cn(
                        'grid h-7 w-7 place-items-center rounded-full border-2',
                        index <= currentIndex
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border text-muted-foreground',
                      )}
                    >
                      {index <= currentIndex ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Circle className="h-3 w-3" />
                      )}
                    </span>
                    <span
                      className={cn(
                        'text-sm',
                        index === currentIndex
                          ? 'font-semibold text-primary'
                          : 'text-muted-foreground',
                      )}
                    >
                      {ORDER_STATUS_LABELS[status]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {order.statusHistory.length > 0 && (
            <div className="mt-6 space-y-3 border-t border-border/70 pt-4">
              {order.statusHistory.map((entry, index) => (
                <div key={`${entry.status}-${index}`} className="flex gap-3 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="font-medium">
                      {ORDER_STATUS_LABELS[entry.status as OrderStatus] ?? entry.status}
                    </p>
                    {entry.note && <p className="text-xs text-muted-foreground">{entry.note}</p>}
                    <p className="text-xs text-muted-foreground">{formatDate(entry.changedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <section className="rounded-2xl border bg-card p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Package className="h-5 w-5 text-primary" />
              Items
            </h2>
            <div className="mt-4 space-y-4">
              {order.items.map((item) => (
                <div
                  key={`${item.productId}-${item.variantSku}`}
                  className="flex gap-3 border-b border-border/70 pb-4 last:border-0 last:pb-0"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-secondary">
                    {item.image ? (
                      <img src={item.image} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.variantLabel} · Qty {item.quantity}
                    </p>
                    <p className="mt-1 text-sm font-semibold">{formatBdt(item.lineTotal)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 border-t border-border/70 pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatBdt(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span>{order.deliveryCharge === 0 ? 'Free' : formatBdt(order.deliveryCharge)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <span>-{formatBdt(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border/70 pt-3 text-base font-semibold">
                <span>Total</span>
                <span>{formatBdt(order.total)}</span>
              </div>
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-2xl border bg-card p-5 sm:p-6">
              <h2 className="text-lg font-semibold">Delivery address</h2>
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{order.customer.name}</p>
                <p>{order.customer.phone}</p>
                <p>{order.customer.address}</p>
                <p>
                  {order.customer.area ? `${order.customer.area}, ` : ''}
                  {order.customer.district}
                </p>
                {order.customer.notes && <p className="pt-1">Note: {order.customer.notes}</p>}
              </div>

              <div className="mt-5 border-t border-border/70 pt-4">
                <h3 className="text-sm font-semibold">Payment</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {PAYMENT_METHOD_LABELS[order.paymentMethod as PaymentMethod] ??
                    order.paymentMethod}
                  {order.bkashTrxId ? ` · TrxID ${order.bkashTrxId}` : ''}
                </p>
              </div>
            </section>

            <section className="rounded-2xl bg-primary p-5 text-primary-foreground sm:p-6">
              <h2 className="text-lg font-semibold">Need to change something?</h2>
              <p className="mt-2 text-sm text-white/70">
                Message us with your order number and we will help.
              </p>
              <Button asChild variant="accent" className="mt-4 w-full">
                <a href={whatsappHref} target="_blank" rel="noreferrer">
                  <MessageCircle />
                  Chat on WhatsApp
                </a>
              </Button>
            </section>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline">
            <Link to="/shop">Continue shopping</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/track">Track another order</Link>
          </Button>
        </div>
      </main>
    </SiteLayout>
  );
}
