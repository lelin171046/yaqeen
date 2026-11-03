import { Loader2 } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/admin-layout';
import { RequireAdmin } from '@/components/admin/require-admin';

const HomePage = lazy(() => import('@/pages/home'));
const ShopPage = lazy(() => import('@/pages/shop'));
const ProductPage = lazy(() => import('@/pages/product'));
const CheckoutPage = lazy(() => import('@/pages/checkout'));
const OrderPage = lazy(() => import('@/pages/order'));
const TrackPage = lazy(() => import('@/pages/track'));
const NotFoundPage = lazy(() => import('@/pages/not-found'));
const LinkRedirectPage = lazy(() => import('@/pages/link-redirect'));

const AdminLoginPage = lazy(() => import('@/pages/admin/login'));
const AdminDashboardPage = lazy(() => import('@/pages/admin/dashboard'));
const AdminOrdersPage = lazy(() => import('@/pages/admin/orders'));
const AdminOrderDetailPage = lazy(() => import('@/pages/admin/order-detail'));
const AdminProductsPage = lazy(() => import('@/pages/admin/products'));
const AdminProductFormPage = lazy(() => import('@/pages/admin/product-form'));
const AdminCategoriesPage = lazy(() => import('@/pages/admin/categories'));
const AdminLinksPage = lazy(() => import('@/pages/admin/links'));
const AdminSettingsPage = lazy(() => import('@/pages/admin/settings'));

function PageFallback() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/product/:slug" element={<ProductPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order/:orderNumber" element={<OrderPage />} />
        <Route path="/track" element={<TrackPage />} />
        <Route path="/l/:code" element={<LinkRedirectPage />} />

        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="orders/:orderNumber" element={<AdminOrderDetailPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="products/new" element={<AdminProductFormPage />} />
          <Route path="products/:id/edit" element={<AdminProductFormPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="links" element={<AdminLinksPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
