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
      <div className="bg-primary px-4 py-2 text-center text-xs font-medium tracking-wide text-primary-foreground sm:text-sm">
        Free delivery on orders over ৳2,000 across Bangladesh
      </div>
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
