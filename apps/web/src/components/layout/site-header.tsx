import { BRAND_LOGO_URL } from '@yaqeen/shared';
import { Menu, Search, ShoppingBag, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getWhatsAppHref } from '@/lib/whatsapp';
import { cartCount, useCart } from '@/stores/cart';

const navLinks = [
  { to: '/shop', label: 'Shop' },
  { to: '/track', label: 'Track order' },
];

export function SiteHeader() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const count = useCart((state) => cartCount(state.items));

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/shop?search=${encodeURIComponent(query)}` : '/shop');
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img src={BRAND_LOGO_URL} alt="" className="h-9 w-9 rounded-full" />
          <span className="font-display text-xl font-semibold">Yaqeen</span>
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
          <a
            href={getWhatsAppHref('Hi Yaqeen, I need help with an order.')}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-primary"
          >
            Contact
          </a>
        </nav>

        <form onSubmit={submitSearch} className="ml-auto hidden lg:block">
          <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search nuts, dates, diet foods"
              className="w-48 bg-transparent text-sm outline-none placeholder:text-muted-foreground xl:w-56"
              aria-label="Search products"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 sm:gap-2 lg:ml-3">
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link to="/checkout" aria-label={`Cart with ${count} items`}>
              <ShoppingBag />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
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

      {menuOpen && (
        <div className="border-t border-border/70 bg-background px-4 py-4 md:hidden">
          <form onSubmit={submitSearch} className="mb-4 flex items-center gap-2 rounded-full border bg-card px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              aria-label="Search products"
            />
          </form>
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
