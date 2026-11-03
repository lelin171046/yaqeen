import {
  ORDER_PAYMENT_STATUSES,
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  formatBdt,
  type OrderStatus,
  type PaymentMethod,
} from '@yaqeen/shared';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  Pagination,
  StatusBadge,
} from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useAdminOrders } from '@/hooks/use-admin-orders';
import { getApiErrorMessage } from '@/lib/api-error';

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('en-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function AdminOrdersPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'total_desc' | 'total_asc'>('newest');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useAdminOrders({
    search: search || undefined,
    status: status || undefined,
    paymentStatus: paymentStatus || undefined,
    sort,
    from: from || undefined,
    to: to || undefined,
    page,
    limit: 15,
  });

  const resetPage = () => setPage(1);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Orders"
        description="Review new orders, verify payments and update fulfilment status."
      />

      <div className="space-y-3 rounded-2xl border bg-card p-4">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(searchInput.trim());
            resetPage();
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search order number, customer name, phone or email"
              className="pl-9"
              aria-label="Search orders"
            />
          </div>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <Select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              resetPage();
            }}
            aria-label="Filter by status"
            className="h-10 text-xs"
          >
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((item) => (
              <option key={item} value={item}>
                {ORDER_STATUS_LABELS[item]}
              </option>
            ))}
          </Select>

          <Select
            value={paymentStatus}
            onChange={(event) => {
              setPaymentStatus(event.target.value);
              resetPage();
            }}
            aria-label="Filter by payment status"
            className="h-10 text-xs"
          >
            <option value="">All payments</option>
            {ORDER_PAYMENT_STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>

          <Select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as typeof sort);
              resetPage();
            }}
            aria-label="Sort orders"
            className="h-10 text-xs"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="total_desc">Highest total</option>
            <option value="total_asc">Lowest total</option>
          </Select>

          <Input
            type="date"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value);
              resetPage();
            }}
            className="h-10 text-xs"
            aria-label="From date"
          />
          <Input
            type="date"
            value={to}
            onChange={(event) => {
              setTo(event.target.value);
              resetPage();
            }}
            className="h-10 text-xs"
            aria-label="To date"
          />
        </div>
      </div>

      {isLoading && <LoadingBlock label="Loading orders…" />}
      {isError && <ErrorBlock message={getApiErrorMessage(error)} />}

      {!isLoading && !isError && data && data.items.length === 0 && (
        <EmptyState
          title="No orders match these filters"
          description="Try clearing the filters, or wait for your next order."
        />
      )}

      {!isLoading && !isError && data && data.items.length > 0 && (
        <>
          <div className="overflow-hidden rounded-2xl border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Order</th>
                    <th className="px-5 py-3 font-semibold">Customer</th>
                    <th className="px-5 py-3 font-semibold">Items</th>
                    <th className="px-5 py-3 font-semibold">Payment</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 text-right font-semibold">Total</th>
                    <th className="px-5 py-3 text-right font-semibold">Placed</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.items.map((order) => (
                    <tr key={order.orderNumber} className="hover:bg-muted/30">
                      <td className="px-5 py-3">
                        <Link
                          to={`/admin/orders/${order.orderNumber}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {order.items.reduce((sum, item) => sum + item.quantity, 0)} pcs
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium">{order.customer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.customer.phone} · {order.customer.district}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {order.items.length} line{order.items.length === 1 ? '' : 's'}
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-xs font-medium">
                          {PAYMENT_METHOD_LABELS[order.paymentMethod as PaymentMethod] ??
                            order.paymentMethod}
                        </p>
                        <div className="mt-1">
                          <StatusBadge value={order.paymentStatus} />
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge value={order.status} />
                      </td>
                      <td className="px-5 py-3 text-right font-medium">
                        {formatBdt(order.total)}
                      </td>
                      <td className="px-5 py-3 text-right text-xs text-muted-foreground">
                        {formatDateTime(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            page={data.pagination.page}
            pages={data.pagination.pages}
            total={data.pagination.total}
            onPage={setPage}
          />
        </>
      )}

      <p className="text-xs text-muted-foreground">
        Tip: order statuses like {ORDER_STATUS_LABELS[ORDER_STATUSES[0] as OrderStatus]} can be
        updated from the order detail page.
      </p>
    </div>
  );
}
