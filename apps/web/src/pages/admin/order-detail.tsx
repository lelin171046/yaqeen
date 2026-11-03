import {
  ORDER_PAYMENT_STATUSES,
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  formatBdt,
  type OrderStatus,
  type PaymentMethod,
} from '@yaqeen/shared';
import {
  ArrowLeft,
  Check,
  MapPin,
  MessageCircle,
  Phone,
  Save,
  ShoppingBag,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ErrorBlock,
  Field,
  LoadingBlock,
  PageHeader,
  StatusBadge,
} from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  useAdminOrder,
  useUpdateOrderNotes,
  useUpdateOrderPayment,
  useUpdateOrderStatus,
} from '@/hooks/use-admin-orders';
import { getApiErrorMessage } from '@/lib/api-error';
import type { AdminOrderDto } from '@/lib/types';

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('en-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function whatsappHref(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const normalized = digits.startsWith('0') ? `880${digits.slice(1)}` : digits;
  return `https://wa.me/${normalized}`;
}

export default function AdminOrderDetailPage() {
  const { orderNumber } = useParams();
  const { data: order, isLoading, isError, error } = useAdminOrder(orderNumber);

  if (isLoading) {
    return <LoadingBlock label="Loading order…" />;
  }

  if (isError || !order) {
    return (
      <div className="space-y-4">
        <ErrorBlock message={getApiErrorMessage(error)} />
        <Button asChild variant="outline">
          <Link to="/admin/orders">
            <ArrowLeft />
            Back to orders
          </Link>
        </Button>
      </div>
    );
  }

  return <OrderDetail key={order.orderNumber} order={order} />;
}

function OrderDetail({ order }: { order: AdminOrderDto }) {
  const updateStatus = useUpdateOrderStatus(order.orderNumber);
  const updatePayment = useUpdateOrderPayment(order.orderNumber);
  const updateNotes = useUpdateOrderNotes(order.orderNumber);

  const [status, setStatus] = useState<OrderStatus>(order.status as OrderStatus);
  const [statusNote, setStatusNote] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [paymentNote, setPaymentNote] = useState('');
  const [adminNotes, setAdminNotes] = useState(order.adminNotes ?? '');

  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  const saveStatus = () => {
    updateStatus.mutate(
      { status, note: statusNote.trim() || undefined },
      {
        onSuccess: () => {
          toast.success('Order status updated');
          setStatusNote('');
        },
        onError: (mutationError) => toast.error(getApiErrorMessage(mutationError)),
      },
    );
  };

  const savePayment = () => {
    updatePayment.mutate(
      { paymentStatus: paymentStatus as 'UNPAID' | 'PAID' | 'REFUNDED', note: paymentNote.trim() || undefined },
      {
        onSuccess: () => {
          toast.success('Payment status updated');
          setPaymentNote('');
        },
        onError: (mutationError) => toast.error(getApiErrorMessage(mutationError)),
      },
    );
  };

  const saveNotes = () => {
    updateNotes.mutate(
      { adminNotes },
      {
        onSuccess: () => toast.success('Notes saved'),
        onError: (mutationError) => toast.error(getApiErrorMessage(mutationError)),
      },
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={order.orderNumber}
        description={`Placed ${formatDateTime(order.createdAt)} · ${itemCount} item${
          itemCount === 1 ? '' : 's'
        }`}
      >
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/orders">
            <ArrowLeft />
            Orders
          </Link>
        </Button>
        <Button asChild size="sm">
          <a href={whatsappHref(order.customer.phone)} target="_blank" rel="noreferrer">
            <MessageCircle />
            WhatsApp customer
          </a>
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge value={order.status} />
        <StatusBadge value={order.paymentStatus} />
        <span className="rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
          {PAYMENT_METHOD_LABELS[order.paymentMethod as PaymentMethod] ?? order.paymentMethod}
        </span>
        {order.source.linkCode && (
          <span className="rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
            Campaign: {order.source.linkCode}
          </span>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <div className="space-y-5">
          <section className="overflow-hidden rounded-2xl border bg-card">
            <div className="flex items-center gap-2 border-b px-5 py-4">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Product</th>
                    <th className="px-5 py-3 text-right font-semibold">Unit</th>
                    <th className="px-5 py-3 text-right font-semibold">Qty</th>
                    <th className="px-5 py-3 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {order.items.map((item, index) => (
                    <tr key={`${item.variantSku}-${index}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border bg-muted">
                            {item.image && (
                              <img src={item.image} alt="" className="h-full w-full object-cover" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.variantLabel} · {item.variantSku}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">{formatBdt(item.unitPrice)}</td>
                      <td className="px-5 py-3 text-right">{item.quantity}</td>
                      <td className="px-5 py-3 text-right font-medium">
                        {formatBdt(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-1.5 border-t px-5 py-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatBdt(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery</span>
                <span>{order.deliveryCharge === 0 ? 'Free' : formatBdt(order.deliveryCharge)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Discount</span>
                  <span>-{formatBdt(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <span>Total</span>
                <span>{formatBdt(order.total)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <h2 className="text-sm font-semibold">Order timeline</h2>
            <ol className="mt-4 space-y-4">
              {order.statusHistory.map((entry, index) => (
                <li key={`${entry.status}-${index}`} className="flex gap-3">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {ORDER_STATUS_LABELS[entry.status as OrderStatus] ?? entry.status}
                    </p>
                    {entry.note && (
                      <p className="text-xs text-muted-foreground">{entry.note}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      {formatDateTime(entry.changedAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <h2 className="text-sm font-semibold">Admin notes</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Private notes for your team. Not visible to the customer.
            </p>
            <Textarea
              value={adminNotes}
              onChange={(event) => setAdminNotes(event.target.value)}
              rows={3}
              className="mt-3"
              placeholder="Called customer to confirm address…"
            />
            <div className="mt-3 flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={saveNotes}
                disabled={updateNotes.isPending}
              >
                <Save />
                Save notes
              </Button>
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-2xl border bg-card p-5">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Customer</h2>
            </div>
            <div className="mt-3 space-y-1 text-sm">
              <p className="font-medium">{order.customer.name}</p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                {order.customer.phone}
              </p>
              {order.customer.altPhone && (
                <p className="text-xs text-muted-foreground">Alt: {order.customer.altPhone}</p>
              )}
              {order.customer.email && (
                <p className="text-xs text-muted-foreground">{order.customer.email}</p>
              )}
            </div>
            <div className="mt-4 border-t pt-3 text-sm">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                Delivery address
              </p>
              <p className="mt-2 text-muted-foreground">{order.customer.address}</p>
              <p className="text-xs text-muted-foreground">
                {order.customer.area ? `${order.customer.area}, ` : ''}
                {order.customer.district}
              </p>
            </div>
            {order.customer.notes && (
              <div className="mt-4 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Customer note</p>
                <p className="mt-1">{order.customer.notes}</p>
              </div>
            )}
            {order.bkashTrxId && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <p className="font-semibold">bKash transaction ID</p>
                <p className="mt-1 font-mono text-sm">{order.bkashTrxId}</p>
                <p className="mt-1">Verify this in your bKash account before marking as paid.</p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <h2 className="text-sm font-semibold">Update status</h2>
            <div className="mt-3 space-y-3">
              <Field label="Order status" htmlFor="order-status">
                <Select
                  id="order-status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as OrderStatus)}
                >
                  {ORDER_STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {ORDER_STATUS_LABELS[item]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Note (optional)" htmlFor="status-note">
                <Textarea
                  id="status-note"
                  rows={2}
                  value={statusNote}
                  onChange={(event) => setStatusNote(event.target.value)}
                  placeholder="Handed to courier…"
                />
              </Field>
              <Button
                type="button"
                className="w-full"
                onClick={saveStatus}
                disabled={updateStatus.isPending || status === order.status}
              >
                {updateStatus.isPending ? 'Updating…' : 'Update status'}
              </Button>
              <p className="text-[11px] text-muted-foreground">
                Cancelling or returning an order restores its stock automatically.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <h2 className="text-sm font-semibold">Payment</h2>
            <div className="mt-3 space-y-3">
              <Field label="Payment status" htmlFor="payment-status">
                <Select
                  id="payment-status"
                  value={paymentStatus}
                  onChange={(event) => setPaymentStatus(event.target.value)}
                >
                  {ORDER_PAYMENT_STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Note (optional)" htmlFor="payment-note">
                <Textarea
                  id="payment-note"
                  rows={2}
                  value={paymentNote}
                  onChange={(event) => setPaymentNote(event.target.value)}
                  placeholder="bKash TrxID verified"
                />
              </Field>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={savePayment}
                disabled={updatePayment.isPending || paymentStatus === order.paymentStatus}
              >
                {updatePayment.isPending ? 'Updating…' : 'Update payment'}
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
