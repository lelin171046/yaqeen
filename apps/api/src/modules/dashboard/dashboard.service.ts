import { OrderLinkModel } from '../../models/order-link.js';
import { OrderModel } from '../../models/order.js';
import { ProductModel } from '../../models/product.js';
import { toPublicOrder } from '../orders/order.service.js';

const ACTIVE_ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
] as const;

function dhakaStartOfDay(date = new Date()): Date {
  const key = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

  return new Date(`${key}T00:00:00+06:00`);
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

interface SalesPoint {
  date: string;
  orders: number;
  revenue: number;
}

interface StatusPoint {
  status: string;
  count: number;
}

interface PaymentPoint {
  method: string;
  count: number;
  revenue: number;
}

interface TopProduct {
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
}

interface LowStockItem {
  productId: string;
  name: string;
  slug: string;
  variantLabel: string;
  sku: string;
  stock: number;
}

export async function getDashboardSummary(rangeDays: number) {
  const start = daysAgo(rangeDays - 1);
  const today = dhakaStartOfDay();
  const activeFilter = { status: { $in: [...ACTIVE_ORDER_STATUSES] } };
  const rangeFilter = { ...activeFilter, createdAt: { $gte: start } };

  const [
    rangeTotals,
    todayTotals,
    pendingOrders,
    activeProducts,
    lowStockCount,
    salesByDay,
    statusBreakdown,
    paymentBreakdown,
    topProducts,
    recentOrders,
    lowStock,
    linkPerformance,
  ] = await Promise.all([
    OrderModel.aggregate<{ orders: number; revenue: number }>([
      { $match: rangeFilter },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          revenue: { $sum: '$total' },
        },
      },
    ]),
    OrderModel.aggregate<{ orders: number; revenue: number }>([
      { $match: { ...activeFilter, createdAt: { $gte: today } } },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          revenue: { $sum: '$total' },
        },
      },
    ]),
    OrderModel.countDocuments({ status: 'PENDING' }),
    ProductModel.countDocuments({ isActive: true }),
    ProductModel.aggregate<{ count: number }>([
      { $match: { isActive: true } },
      { $unwind: '$variants' },
      { $match: { 'variants.stock': { $lte: 5 } } },
      { $count: 'count' },
    ]),
    OrderModel.aggregate<SalesPoint>([
      { $match: rangeFilter },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
              timezone: 'Asia/Dhaka',
            },
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', orders: 1, revenue: 1 } },
    ]),
    OrderModel.aggregate<StatusPoint>([
      { $match: { createdAt: { $gte: start } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', count: 1 } },
      { $sort: { count: -1 } },
    ]),
    OrderModel.aggregate<PaymentPoint>([
      { $match: rangeFilter },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          revenue: { $sum: '$total' },
        },
      },
      { $project: { _id: 0, method: '$_id', count: 1, revenue: 1 } },
    ]),
    OrderModel.aggregate<TopProduct>([
      { $match: rangeFilter },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.lineTotal' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      { $project: { _id: 0, productId: { $toString: '$_id' }, name: 1, quantity: 1, revenue: 1 } },
    ]),
    OrderModel.find().sort({ createdAt: -1 }).limit(6),
    ProductModel.aggregate<LowStockItem>([
      { $match: { isActive: true } },
      { $unwind: '$variants' },
      { $match: { 'variants.stock': { $lte: 5 } } },
      { $sort: { 'variants.stock': 1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          productId: { $toString: '$_id' },
          name: 1,
          slug: 1,
          variantLabel: '$variants.label',
          sku: '$variants.sku',
          stock: '$variants.stock',
        },
      },
    ]),
    OrderLinkModel.find({ isActive: true }).sort({ revenue: -1, clicks: -1 }).limit(5).lean(),
  ]);

  const revenue = rangeTotals[0]?.revenue ?? 0;
  const orderCount = rangeTotals[0]?.orders ?? 0;
  const distinctCustomers = await OrderModel.distinct('customer.phone', rangeFilter);

  return {
    rangeDays,
    kpis: {
      revenue,
      orders: orderCount,
      averageOrderValue: orderCount > 0 ? Math.round(revenue / orderCount) : 0,
      pendingOrders,
      todayOrders: todayTotals[0]?.orders ?? 0,
      todayRevenue: todayTotals[0]?.revenue ?? 0,
      activeProducts,
      lowStockVariants: lowStockCount[0]?.count ?? 0,
      customers: distinctCustomers.length,
    },
    salesByDay,
    statusBreakdown,
    paymentBreakdown,
    topProducts,
    recentOrders: recentOrders.map(toPublicOrder),
    lowStock,
    linkPerformance: linkPerformance.map((link) => ({
      id: String(link._id),
      code: link.code,
      title: link.title,
      campaign: link.campaign,
      clicks: link.clicks,
      orders: link.orders,
      revenue: link.revenue,
      isActive: link.isActive,
    })),
  };
}
