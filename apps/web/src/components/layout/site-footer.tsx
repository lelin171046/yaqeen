import { BRAND_LOGO_URL } from '@yaqeen/shared';
import { Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useHealth } from '@/hooks/use-health';
import { cn } from '@/lib/utils';
import { getWhatsAppHref } from '@/lib/whatsapp';

const shopLinks = [
  { label: 'Nuts & seeds', category: 'nuts-seeds' },
  { label: 'Dry fruits', category: 'dry-fruits' },
  { label: 'Diet foods', category: 'diet-foods' },
  { label: 'Gift boxes', category: 'gift-boxes' },
];

export function SiteFooter() {
  const { data: health, isError } = useHealth();
  const whatsappHref = getWhatsAppHref('Hi Yaqeen, I need help with an order.');

  return (
    <footer className="border-t border-border/70 bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            <img src={BRAND_LOGO_URL} alt="" className="h-9 w-9 rounded-full" />
            <span className="font-display text-xl font-semibold">Yaqeen</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Natural nuts, dry foods and nutrition you can trust, delivered across Bangladesh.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                health ? 'bg-emerald-500' : isError ? 'bg-rose-500' : 'bg-amber-400',
              )}
            />
            {health ? 'Store online' : isError ? 'Store offline' : 'Connecting'}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Shop</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {shopLinks.map((link) => (
              <li key={link.category}>
                <Link
                  to={`/shop?category=${link.category}`}
                  className="hover:text-foreground"
                >
                  {link.label}
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
              <a href={whatsappHref} target="_blank" rel="noreferrer" className="hover:text-foreground">
                Contact us
              </a>
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
            New arrivals, offers and healthy ideas.
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
          <p>© {new Date().getFullYear()} Yaqeen. All rights reserved.</p>
          <p>Made with care in Bangladesh.</p>
        </div>
      </div>
    </footer>
  );
}
