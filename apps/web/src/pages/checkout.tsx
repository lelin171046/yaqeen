import { createOrderSchema, formatBdt } from '@yaqeen/shared';
import { Check, Copy, Loader2, Minus, Plus, Trash2 } from 'lucide-react';
import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { SiteLayout } from '@/components/layout/site-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateOrder } from '@/hooks/use-orders';
import { useSettings } from '@/hooks/use-settings';
import { getApiErrorMessage } from '@/lib/api-error';
import { BANGLADESH_DISTRICTS } from '@/lib/districts';
import type { StoreSettingsDto } from '@/lib/types';
import { cn } from '@/lib/utils';
import { cartSubtotal, useCart } from '@/stores/cart';

function estimateDelivery(
  settings: StoreSettingsDto | undefined,
  district: string,
  subtotal: number,
): number {
  const threshold = settings?.freeDeliveryThreshold ?? 2000;

  if (threshold > 0 && subtotal >= threshold) {
    return 0;
  }

  const isDhaka = district.trim().toLowerCase() === 'dhaka';
  const zones = settings?.deliveryZones ?? [];
  const zone = zones.find((item) => (isDhaka ? /inside/i.test(item.name) : /outside/i.test(item.name)));

  return zone?.charge ?? settings?.defaultDeliveryCharge ?? 80;
}

function Field({
  label,
  htmlFor,
  error,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {optional && <span className="ml-1 font-normal text-muted-foreground">(optional)</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default function CheckoutPage() {
  const items = useCart((state) => state.items);
  const setQuantity = useCart((state) => state.setQuantity);
  const removeItem = useCart((state) => state.removeItem);
  const clear = useCart((state) => state.clear);
  const { data: settings } = useSettings();
  const createOrder = useCreateOrder();
  const navigate = useNavigate();
  const idempotencyKey = useRef(crypto.randomUUID());

  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    altPhone: '',
    email: '',
    address: '',
    district: 'Dhaka',
    area: '',
    notes: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BKASH_MANUAL'>('COD');
  const [bkashTrxId, setBkashTrxId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  const subtotal = cartSubtotal(items);
  const deliveryCharge = estimateDelivery(settings, customer.district, subtotal);
  const total = subtotal + deliveryCharge;

  const updateCustomer = (key: keyof typeof customer, value: string) => {
    setCustomer((current) => ({ ...current, [key]: value }));
  };

  const copyMerchantNumber = async () => {
    if (!settings?.bkashMerchantNumber) {
      return;
    }

    await navigator.clipboard.writeText(settings.bkashMerchantNumber);
    setCopied(true);
    toast.success('bKash number copied');
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const linkCode = sessionStorage.getItem('yaqeen:link') ?? undefined;

    const payload = {
      items: items.map((item) => ({
        productId: item.productId,
        variantSku: item.variantSku,
        quantity: item.quantity,
      })),
      customer,
      paymentMethod,
      bkashTrxId: paymentMethod === 'BKASH_MANUAL' ? bkashTrxId : undefined,
      source: linkCode ? { type: 'LINK' as const, linkCode } : undefined,
      idempotencyKey: idempotencyKey.current,
    };

    const parsed = createOrderSchema.safeParse(payload);

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};

      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.');

        if (!nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }

      setErrors(nextErrors);
      toast.error('Please check the highlighted fields.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setErrors({});
    createOrder.mutate(parsed.data, {
      onSuccess: (order) => {
        clear();
        sessionStorage.removeItem('yaqeen:link');
        navigate(
          `/order/${order.orderNumber}?phone=${encodeURIComponent(customer.phone)}`,
        );
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
    });
  };

  if (items.length === 0) {
    return (
      <SiteLayout>
        <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <h1 className="text-3xl font-semibold">Your cart is empty</h1>
          <p className="mt-3 text-muted-foreground">
            Add a few favourites and come back to place your order.
          </p>
          <Button asChild className="mt-6">
            <Link to="/shop">Browse products</Link>
          </Button>
        </main>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-primary">Guest checkout</p>
            <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">Place your order</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              No account needed. We will call to confirm before dispatch.
            </p>
          </div>
          <Link to="/shop" className="text-sm font-semibold text-primary hover:underline">
            Continue shopping
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.8fr]">
          <div className="space-y-8">
            <section className="rounded-2xl border bg-card p-5 sm:p-6">
              <h2 className="text-lg font-semibold">Delivery details</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Full name" htmlFor="name" error={errors['customer.name']}>
                  <Input
                    id="name"
                    value={customer.name}
                    onChange={(event) => updateCustomer('name', event.target.value)}
                    autoComplete="name"
                    placeholder="Your full name"
                  />
                </Field>

                <Field label="Mobile number" htmlFor="phone" error={errors['customer.phone']}>
                  <Input
                    id="phone"
                    value={customer.phone}
                    onChange={(event) => updateCustomer('phone', event.target.value)}
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="01XXXXXXXXX"
                  />
                </Field>

                <Field
                  label="Alternate number"
                  htmlFor="altPhone"
                  error={errors['customer.altPhone']}
                  optional
                >
                  <Input
                    id="altPhone"
                    value={customer.altPhone}
                    onChange={(event) => updateCustomer('altPhone', event.target.value)}
                    inputMode="tel"
                    placeholder="01XXXXXXXXX"
                  />
                </Field>

                <Field label="Email" htmlFor="email" error={errors['customer.email']} optional>
                  <Input
                    id="email"
                    type="email"
                    value={customer.email}
                    onChange={(event) => updateCustomer('email', event.target.value)}
                    autoComplete="email"
                    placeholder="you@example.com"
                  />
                </Field>

                <Field label="District" htmlFor="district" error={errors['customer.district']}>
                  <Select
                    id="district"
                    value={customer.district}
                    onChange={(event) => updateCustomer('district', event.target.value)}
                  >
                    {BANGLADESH_DISTRICTS.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Area" htmlFor="area" error={errors['customer.area']} optional>
                  <Input
                    id="area"
                    value={customer.area}
                    onChange={(event) => updateCustomer('area', event.target.value)}
                    placeholder="Thana, union or area"
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field
                    label="Full address"
                    htmlFor="address"
                    error={errors['customer.address']}
                  >
                    <Textarea
                      id="address"
                      value={customer.address}
                      onChange={(event) => updateCustomer('address', event.target.value)}
                      autoComplete="street-address"
                      placeholder="House, road, landmark"
                    />
                  </Field>
                </div>

                <div className="sm:col-span-2">
                  <Field
                    label="Delivery notes"
                    htmlFor="notes"
                    error={errors['customer.notes']}
                    optional
                  >
                    <Textarea
                      id="notes"
                      value={customer.notes}
                      onChange={(event) => updateCustomer('notes', event.target.value)}
                      placeholder="Anything the delivery person should know"
                      className="min-h-20"
                    />
                  </Field>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border bg-card p-5 sm:p-6">
              <h2 className="text-lg font-semibold">Payment method</h2>
              <div className="mt-4 space-y-3">
                <label
                  className={cn(
                    'flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors',
                    paymentMethod === 'COD' && 'border-primary bg-primary/5',
                  )}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="mt-1 accent-emerald-700"
                  />
                  <span>
                    <span className="block text-sm font-semibold">Cash on delivery</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      Pay the delivery person when your order arrives.
                    </span>
                  </span>
                </label>

                <label
                  className={cn(
                    'flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors',
                    paymentMethod === 'BKASH_MANUAL' && 'border-primary bg-primary/5',
                  )}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="BKASH_MANUAL"
                    checked={paymentMethod === 'BKASH_MANUAL'}
                    onChange={() => setPaymentMethod('BKASH_MANUAL')}
                    className="mt-1 accent-emerald-700"
                  />
                  <span className="w-full">
                    <span className="block text-sm font-semibold">bKash transfer</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      Send the total to our merchant number and enter the transaction ID.
                    </span>

                    {paymentMethod === 'BKASH_MANUAL' && (
                      <span className="mt-3 block rounded-xl bg-muted p-3">
                        <span className="block text-xs text-muted-foreground">
                          Send money to
                        </span>
                        <span className="mt-1 flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold">
                            {settings?.bkashMerchantNumber || 'Number shared on call'}
                          </span>
                          {settings?.bkashMerchantNumber && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(event) => {
                                event.preventDefault();
                                void copyMerchantNumber();
                              }}
                            >
                              {copied ? <Check /> : <Copy />}
                              {copied ? 'Copied' : 'Copy'}
                            </Button>
                          )}
                        </span>
                      </span>
                    )}

                    {paymentMethod === 'BKASH_MANUAL' && (
                      <span className="mt-3 block">
                        <Label htmlFor="bkashTrxId" className="text-xs">
                          bKash transaction ID
                        </Label>
                        <Input
                          id="bkashTrxId"
                          value={bkashTrxId}
                          onChange={(event) => setBkashTrxId(event.target.value)}
                          placeholder="e.g. 9F2A7B1C3D"
                          className="mt-1.5"
                        />
                        {errors.bkashTrxId && (
                          <span className="mt-1 block text-xs text-destructive">
                            {errors.bkashTrxId}
                          </span>
                        )}
                      </span>
                    )}
                  </span>
                </label>
              </div>
            </section>
          </div>

          <aside className="h-fit rounded-2xl border bg-card p-5 sm:p-6 lg:sticky lg:top-24">
            <h2 className="text-lg font-semibold">Order summary</h2>

            <div className="mt-5 space-y-4">
              {items.map((item) => (
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
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.variantLabel}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId, item.variantSku)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="inline-flex items-center rounded-full border">
                        <button
                          type="button"
                          onClick={() =>
                            setQuantity(item.productId, item.variantSku, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                          className="grid h-7 w-7 place-items-center rounded-l-full hover:bg-muted disabled:opacity-40"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setQuantity(item.productId, item.variantSku, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.maxStock}
                          className="grid h-7 w-7 place-items-center rounded-r-full hover:bg-muted disabled:opacity-40"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-sm font-semibold">
                        {formatBdt(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-2 border-t border-border/70 pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatBdt(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span>{deliveryCharge === 0 ? 'Free' : formatBdt(deliveryCharge)}</span>
              </div>
              <div className="flex justify-between border-t border-border/70 pt-3 text-base font-semibold">
                <span>Total</span>
                <span>{formatBdt(total)}</span>
              </div>
            </div>

            {deliveryCharge > 0 && settings?.freeDeliveryThreshold ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Add {formatBdt(Math.max(0, settings.freeDeliveryThreshold - subtotal))} more for
                free delivery.
              </p>
            ) : null}

            <Button type="submit" size="lg" className="mt-5 w-full" disabled={createOrder.isPending}>
              {createOrder.isPending && <Loader2 className="animate-spin" />}
              {createOrder.isPending
                ? 'Placing order...'
                : paymentMethod === 'COD'
                  ? `Place order · ${formatBdt(total)}`
                  : `Confirm order · ${formatBdt(total)}`}
            </Button>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              We will call you to confirm before dispatch. Need help? Message us on WhatsApp.
            </p>
          </aside>
        </form>
      </main>
    </SiteLayout>
  );
}
