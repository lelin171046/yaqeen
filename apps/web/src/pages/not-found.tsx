import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SiteLayout } from '@/components/layout/site-layout';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <SiteLayout>
      <main className="grid min-h-[60vh] place-items-center px-4 py-16">
        <div className="max-w-md text-center">
          <p className="font-display text-7xl font-semibold text-accent">404</p>
          <h1 className="mt-4 text-3xl font-semibold">This page could not be found</h1>
          <p className="mt-3 text-muted-foreground">
            The link may be broken or the page may have moved. Let us get you back to the good
            stuff.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/">
                <ArrowLeft />
                Back to home
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/shop">Browse products</Link>
            </Button>
          </div>
        </div>
      </main>
    </SiteLayout>
  );
}
