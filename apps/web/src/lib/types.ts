export interface CategoryDto {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ProductImageDto {
  url: string;
  publicId?: string;
  alt?: string;
}

export interface ProductVariantDto {
  _id?: string;
  label: string;
  grams?: number;
  price: number;
  compareAtPrice?: number;
  stock: number;
  sku: string;
}

export interface ProductDto {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: CategoryDto | string;
  images: ProductImageDto[];
  video?: string;
  tags: string[];
  variants: ProductVariantDto[];
  basePrice: number;
  totalStock: number;
  isFeatured: boolean;
  isActive: boolean;
  badge: string;
  ingredients?: string;
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
  };
}

export interface PaginationDto {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ProductListResponse {
  items: ProductDto[];
  pagination: PaginationDto;
}

export interface StoreSettingsDto {
  storeName: string;
  supportPhone: string;
  supportEmail: string;
  bkashMerchantNumber: string;
  freeDeliveryThreshold: number;
  defaultDeliveryCharge: number;
  deliveryZones: Array<{ name: string; charge: number }>;
}

export interface OrderItemDto {
  productId: string;
  name: string;
  variantSku: string;
  variantLabel: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  image: string;
}

export interface OrderDto {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  bkashTrxId: string;
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
  items: OrderItemDto[];
  customer: {
    name: string;
    phone: string;
    altPhone: string;
    email: string;
    address: string;
    district: string;
    area: string;
    notes: string;
  };
  statusHistory: Array<{ status: string; note: string; changedAt: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface AdminDto {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLoginAt: string | null;
}

export interface AdminOrderDto extends OrderDto {
  id: string;
  adminNotes: string;
  source: {
    type: string;
    linkCode: string;
    utm: Record<string, string> | null;
  };
}

export interface DashboardSummaryDto {
  rangeDays: number;
  kpis: {
    revenue: number;
    orders: number;
    averageOrderValue: number;
    pendingOrders: number;
    todayOrders: number;
    todayRevenue: number;
    activeProducts: number;
    lowStockVariants: number;
    customers: number;
  };
  salesByDay: Array<{ date: string; orders: number; revenue: number }>;
  statusBreakdown: Array<{ status: string; count: number }>;
  paymentBreakdown: Array<{ method: string; count: number; revenue: number }>;
  topProducts: Array<{
    productId: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  recentOrders: OrderDto[];
  lowStock: Array<{
    productId: string;
    name: string;
    slug: string;
    variantLabel: string;
    sku: string;
    stock: number;
  }>;
  linkPerformance: OrderLinkPerformanceDto[];
}

export interface OrderLinkPerformanceDto {
  id: string;
  code: string;
  title: string;
  campaign: string;
  clicks: number;
  orders: number;
  revenue: number;
  isActive: boolean;
}

export interface AdminSettingsDto {
  storeName: string;
  supportPhone: string;
  supportEmail: string;
  bkashMerchantNumber: string;
  freeDeliveryThreshold: number;
  defaultDeliveryCharge: number;
  deliveryZones: Array<{ name: string; charge: number; isActive: boolean }>;
  adminAlertEmails: string[];
  adminAlertWhatsapp: string[];
  socialLinks: {
    facebook: string;
    instagram: string;
    whatsapp: string;
  };
}

export interface OrderLinkDto {
  id: string;
  code: string;
  product: {
    id: string;
    name: string;
    slug: string;
  };
  title: string;
  campaign: string;
  destination: string;
  clicks: number;
  orders: number;
  revenue: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UploadedAssetDto {
  url: string;
  publicId: string;
}
