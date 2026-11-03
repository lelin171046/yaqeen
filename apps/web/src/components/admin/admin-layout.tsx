import { BRAND_LOGO_URL } from '@yaqeen/shared';
import {
  ExternalLink,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Tags,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAdminLogout, useAdminSession } from '@/hooks/use-admin-auth';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/links', label: 'Ad links', icon: Link2 },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminLayout() {
  const location = useLocation();
  const { data: admin } = useAdminSession();
  const logout = useAdminLogout();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {navItems.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-foreground/15 text-primary-foreground'
                  : 'text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        );
      })}

      <div className="mt-auto space-y-2 pb-4 pt-6">
        <Link
          to="/"
          target="_blank"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
        >
          <ExternalLink className="h-4 w-4" />
          View storefront
        </Link>
        <button
          type="button"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          {logout.isPending ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-primary lg:flex">
        <div className="flex h-20 items-center gap-3 px-5">
          <img src={BRAND_LOGO_URL} alt="Yaqeen" className="h-10 w-10 rounded-full bg-white/5" />
          <div>
            <p className="font-display text-lg font-semibold text-primary-foreground">Yaqeen</p>
            <p className="text-[11px] uppercase tracking-widest text-primary-foreground/60">
              Admin
            </p>
          </div>
        </div>
        {nav}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-72 flex-col bg-primary">
            <div className="flex h-20 items-center justify-between gap-3 px-5">
              <div className="flex items-center gap-3">
                <img
                  src={BRAND_LOGO_URL}
                  alt="Yaqeen"
                  className="h-10 w-10 rounded-full bg-white/5"
                />
                <div>
                  <p className="font-display text-lg font-semibold text-primary-foreground">
                    Yaqeen
                  </p>
                  <p className="text-[11px] uppercase tracking-widest text-primary-foreground/60">
                    Admin
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-full p-2 text-primary-foreground/70 hover:bg-primary-foreground/10"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu />
          </Button>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {navItems.find((item) => item.to === location.pathname)?.label ?? 'Dashboard'}
            </p>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Manage your store from one place
            </p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{admin?.name ?? 'Admin'}</p>
              <p className="text-xs text-muted-foreground">{admin?.email ?? ''}</p>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {(admin?.name ?? 'A').slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
