import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  formatBdt,
  type OrderStatus,
  type PaymentMethod,
} from '@yaqeen/shared';
import {
  ArrowUpRight,
  BadgeDollarSign,
  Clock,
  Package,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  StatCard,
  StatusBadge,
} from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useAdminDashboard } from '@/hooks/use-admin-dashboard';
import { getApiErrorMessage } from '@/lib/api-error';
import type { DashboardSummaryDto } from '@/lib/types';

const ranges = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];

const chartColors = ['#1f4d3b', '#c9a227', '#8b5e3c', '#7c9a6d', '#b45309', '#64748b'];

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-BD', {
    day: 'numeric',
    month: 'short',
  });
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('en-BD', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function buildSalesSeries(summary: DashboardSummaryDto) {
  const byDate = new Map(summary.salesByDay.map((point) => [point.date, point]));
  const series: Array<{ date: string; label: string; revenue: number; orders: number }> = [];
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  for (let index = summary.rangeDays - 1; index >= 0; index -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    const key = formatter.format(date);
    const point = byDate.get(key);

    series.push({
      date: key,
      label: formatDate(key),
      revenue: point?.revenue ?? 0,
      orders: point?.orders ?? 0,
    });
  }

  return series;
}

export default function AdminDashboardPage() {
  const [range, setRange] = useState(30);
  const { data, isLoading, isError, error, isFetching, refetch } = useAdminDashboard(range);
  const series = useMemo(() => (data ? buildSalesSeries(data) : []), [data]);

  if (isLoading) {
    return <LoadingBlock label="Loading your store overview…" />;
  }

  if (isError || !data) {
    return <ErrorBlock message={getApiErrorMessage(error)} />;
  }

  const { kpis } = data;
  const maxPaymentRevenue = Math.max(...data.paymentBreakdown.map((item) => item.revenue), 1);
  const maxProductRevenue = Math.max(...data.topProducts.map((item) => item.revenue), 1);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="A live snapshot of sales, orders and stock."
      >
        <Select
          value={String(range)}
          onChange={(event) => setRange(Number(event.target.value))}
          className="h-9 w-40 text-xs"
          aria-label="Dashboard date range"
        >
          {ranges.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={isFetching ? 'animate-spin' : undefined} />
          Refresh
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue"
          value={formatBdt(kpis.revenue)}
          hint={`${formatBdt(kpis.todayRevenue)} today`}
          icon={BadgeDollarSign}
          tone="emerald"
        />
        <StatCard
          label="Orders"
          value={kpis.orders}
          hint={`${kpis.todayOrders} placed today`}
          icon={ShoppingCart}
          tone="primary"
        />
        <StatCard
          label="Average order"
          value={formatBdt(kpis.averageOrderValue)}
          hint={`${kpis.customers} customers reached`}
          icon={TrendingUp}
          tone="amber"
        />
        <StatCard
          label="Needs attention"
          value={kpis.pendingOrders}
          hint={`${kpis.lowStockVariants} low-stock variants`}
          icon={Clock}
          tone="rose"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Sales over time</h2>
              <p className="text-xs text-muted-foreground">
                Revenue from non-cancelled orders, last {data.rangeDays} days
              </p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
              {formatBdt(kpis.revenue)}
            </span>
          </div>
          <div className="mt-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1f4d3b" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#1f4d3b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value: number) => `৳${Math.round(value / 1000)}k`}
                  width={46}
                />
                <Tooltip
                  formatter={(value) => [formatBdt(Number(value)), 'Revenue']}
                  labelFormatter={(_, payload) => {
                    const point = payload?.[0]?.payload as { date?: string } | undefined;
                    return point?.date ?? '';
                  }}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1f4d3b"
                  strokeWidth={2}
                  fill="url(#revenueFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <h2 className="text-sm font-semibold">Order status</h2>
          <p className="text-xs text-muted-foreground">Last {data.rangeDays} days</p>
          {data.statusBreakdown.length === 0 ? (
            <p className="mt-10 text-center text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <>
              <div className="mx-auto mt-4 h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.statusBreakdown}
                      dataKey="count"
                      nameKey="status"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {data.statusBreakdown.map((entry, index) => (
                        <Cell
                          key={entry.status}
                          fill={chartColors[index % chartColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [
                        value,
                        ORDER_STATUS_LABELS[name as OrderStatus] ?? name,
                      ]}
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid var(--border)',
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-1.5">
                {data.statusBreakdown.map((entry, index) => (
                  <li key={entry.status} className="flex items-center gap-2 text-xs">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: chartColors[index % chartColors.length] }}
                    />
                    <span className="text-muted-foreground">
                      {ORDER_STATUS_LABELS[entry.status as OrderStatus] ?? entry.status}
                    </span>
                    <span className="ml-auto font-semibold">{entry.count}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Payment mix</h2>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-4 space-y-4">
            {data.paymentBreakdown.length === 0 && (
              <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
            )}
            {data.paymentBreakdown.map((item) => (
              <div key={item.method}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">
                    {PAYMENT_METHOD_LABELS[item.method as PaymentMethod] ?? item.method}
                  </span>
                  <span className="text-muted-foreground">
                    {item.count} orders · {formatBdt(item.revenue)}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max(4, (item.revenue / maxPaymentRevenue) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Top products</h2>
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-4 space-y-4">
            {data.topProducts.length === 0 && (
              <p className="text-sm text-muted-foreground">No product sales in this period.</p>
            )}
            {data.topProducts.map((product) => (
              <div key={product.productId}>
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate font-medium">{product.name}</span>
                  <span className="ml-3 shrink-0 text-muted-foreground">
                    {product.quantity} sold · {formatBdt(product.revenue)}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{
                      width: `${Math.max(4, (product.revenue / maxProductRevenue) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card lg:col-span-2">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold">Recent orders</h2>
              <p className="text-xs text-muted-foreground">Latest activity across the store</p>
            </div>
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {data.recentOrders.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No orders yet"
                description="Orders placed from the storefront will appear here."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Order</th>
                    <th className="px-5 py-3 font-semibold">Customer</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 text-right font-semibold">Total</th>
                    <th className="px-5 py-3 text-right font-semibold">Placed</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.recentOrders.map((order) => (
                    <tr key={order.orderNumber} className="hover:bg-muted/30">
                      <td className="px-5 py-3">
                        <Link
                          to={`/admin/orders/${order.orderNumber}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium">{order.customer.name}</p>
                        <p className="text-xs text-muted-foreground">{order.customer.phone}</p>
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
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-5">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Low stock</h2>
            </div>
            {data.lowStock.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">Everything is well stocked.</p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {data.lowStock.map((item) => (
                  <li
                    key={`${item.productId}-${item.sku}`}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.name}</p>
                      <p className="text-muted-foreground">{item.variantLabel}</p>
                    </div>
                    <span
                      className={
                        item.stock === 0
                          ? 'shrink-0 rounded-full bg-rose-50 px-2 py-1 font-semibold text-rose-700'
                          : 'shrink-0 rounded-full bg-amber-50 px-2 py-1 font-semibold text-amber-700'
                      }
                    >
                      {item.stock === 0 ? 'Out' : `${item.stock} left`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="outline" size="sm" className="mt-4 w-full">
              <Link to="/admin/products">Manage stock</Link>
            </Button>
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <h2 className="text-sm font-semibold">Ad links</h2>
            {data.linkPerformance.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                No campaign links created yet.
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5 text-xs">
                {data.linkPerformance.map((link) => (
                  <li key={link.id} className="flex items-center justify-between gap-3">
                    <span className="truncate font-medium">/{link.code}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {link.clicks} clicks · {formatBdt(link.revenue)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="outline" size="sm" className="mt-4 w-full">
              <Link to="/admin/links">Manage links</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
