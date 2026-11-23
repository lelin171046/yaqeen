import { BRAND_LOGO_URL } from '@anando-deal/shared';
import { Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCategories } from '@/hooks/use-catalog';
import { useHealth } from '@/hooks/use-health';
import { cn } from '@/lib/utils';
import { getWhatsAppHref } from '@/lib/whatsapp';

export function SiteFooter() {
  const { data: health, isError } = useHealth();
  const { data: categories } = useCategories();
  const whatsappHref = getWhatsAppHref('Hi Anando Deal, I need help with an order.');

  return (
    <footer className="border-t border-border/70 bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            <img src={BRAND_LOGO_URL} alt="" className="h-9 w-9 rounded-full" />
            <span className="font-display text-xl font-semibold">Anando Deal</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Everyday products with clear prices, real stock, and delivery across Bangladesh.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                health ? 'bg-black' : isError ? 'bg-neutral-500' : 'bg-neutral-300',
              )}
            />
            {health ? 'Store online' : isError ? 'Store offline' : 'Connecting'}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Shop</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/shop" className="hover:text-foreground">
                All products
              </Link>
            </li>
            {(categories ?? []).slice(0, 4).map((category) => (
              <li key={category._id}>
                <Link to={`/shop?category=${category.slug}`} className="hover:text-foreground">
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Help</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/shop" className="hover:text-foreground">
                Browse all products
              </Link>
            </li>
            <li>
              <Link to="/track" className="hover:text-foreground">
                Track your order
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-foreground">
                Contact us
              </Link>
            </li>
            <li>
              <Link to="/checkout" className="hover:text-foreground">
                Checkout
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Stay connected</h3>
          <p className="mt-3 text-sm text-muted-foreground">
            New arrivals, offers, and store updates.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <a href={whatsappHref} target="_blank" rel="noreferrer">
              <Phone />
              WhatsApp us
            </a>
          </Button>
        </div>
      </div>

      <div className="border-t border-border/70 px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Anando Deal. All rights reserved.</p>
          <p>Made with care in Bangladesh.</p>
        </div>
      </div>
    </footer>
  );
}
