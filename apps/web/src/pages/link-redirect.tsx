import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

interface LinkResolution {
  code: string;
  destination: string;
  product: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function LinkRedirectPage() {
  const { code } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      if (!code) {
        return;
      }

      try {
        const response = await api.get<{ link: LinkResolution }>(
          `/links/${encodeURIComponent(code)}`,
        );
        const link = response.data.link;

        if (cancelled) {
          return;
        }

        sessionStorage.setItem('yaqeen:link', link.code);

        if (link.product.slug) {
          navigate(`/product/${link.product.slug}?link=${link.code}`, { replace: true });
        } else {
          navigate('/shop', { replace: true });
        }
      } catch {
        if (!cancelled) {
          navigate('/shop', { replace: true });
        }
      }
    }

    void resolve();

    return () => {
      cancelled = true;
    };
  }, [code, navigate]);

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <h1 className="mt-4 text-xl font-semibold">Opening your offer…</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Taking you to the product page.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/shop">Go to shop</Link>
        </Button>
      </div>
    </div>
  );
}
