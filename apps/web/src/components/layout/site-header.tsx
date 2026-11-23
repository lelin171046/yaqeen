import { BRAND_LOGO_URL } from '@anando-deal/shared';
import { Heart, Menu, ShoppingBag, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { SearchForm } from '@/components/search-form';
import { Button } from '@/components/ui/button';
import { useCategories } from '@/hooks/use-catalog';
import { cn } from '@/lib/utils';
import { cartCount, useCart } from '@/stores/cart';
import { useWishlist } from '@/stores/wishlist';

const navLinks = [
  { to: '/shop', label: 'Shop' },
  { to: '/track', label: 'Track order' },
  { to: '/contact', label: 'Contact' },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const count = useCart((state) => cartCount(state.items));
  const wishlistCount = useWishlist((state) => state.items.length);
  const { data: categories } = useCategories();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img src={BRAND_LOGO_URL} alt="" className="h-9 w-9 rounded-full" />
          <span className="font-display text-xl font-semibold">Anando Deal</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-6 text-sm font-medium md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn('transition-colors hover:text-primary', isActive && 'text-primary')
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <SearchForm
          className="ml-auto hidden lg:block"
          inputClassName="w-48 xl:w-56"
          placeholder="Search products"
        />

        <div className="ml-auto flex items-center gap-1 sm:gap-2 lg:ml-3">
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link to="/wishlist" aria-label={`Wishlist with ${wishlistCount} items`}>
              <Heart />
              {wishlistCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-white px-1 text-[10px] font-bold text-black">
                  {wishlistCount}
                </span>
              )}
            </Link>
          </Button>

          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link to="/checkout" aria-label={`Cart with ${count} items`}>
              <ShoppingBag />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-white px-1 text-[10px] font-bold text-black">
                  {count}
                </span>
              )}
            </Link>
          </Button>

          <Button asChild variant="accent" className="hidden sm:inline-flex">
            <Link to="/shop">Order now</Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      <div className="hidden border-t border-border/60 bg-card/60 md:block">
        <div className="mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-4 py-2 text-xs font-semibold text-muted-foreground sm:px-6 lg:px-8">
          <Link to="/shop" className="whitespace-nowrap text-primary">
            All products
          </Link>
          {categories?.slice(0, 6).map((category) => (
            <Link
              key={category._id}
              to={`/shop?category=${category.slug}`}
              className="whitespace-nowrap transition-colors hover:text-primary"
            >
              {category.name}
            </Link>
          ))}
          <Link
            to="/shop?sort=price_asc"
            className="whitespace-nowrap transition-colors hover:text-primary"
          >
            Best value
          </Link>
          <Link
            to="/track"
            className="ml-auto whitespace-nowrap transition-colors hover:text-primary"
          >
            Track order
          </Link>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-border/70 bg-background px-4 py-4 md:hidden">
          <SearchForm
            className="mb-4"
            placeholder="Search products"
            onSubmitted={() => setMenuOpen(false)}
          />
          <nav className="flex flex-col gap-1 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 hover:bg-muted"
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/wishlist"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 hover:bg-muted"
            >
              Wishlist ({wishlistCount})
            </Link>
            <Link
              to="/checkout"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 hover:bg-muted"
            >
              Cart ({count})
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
