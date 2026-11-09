import { formatBdt } from '@yaqeen/shared';
import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

export function SiteLayout({ children }: { children: ReactNode }) {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div className="min-h-screen">
      <div className="bg-primary px-4 text-primary-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 py-2 text-xs font-medium tracking-wide sm:text-sm">
          <span>Free delivery on orders over {formatBdt(2000)} across Bangladesh</span>
          <span className="hidden text-primary-foreground/75 sm:inline">
            Cash on delivery · Nationwide delivery
          </span>
        </div>
      </div>
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
