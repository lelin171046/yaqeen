import { formatBdt } from '@yaqeen/shared';
import { ImageOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import type { ProductDto } from '@/lib/types';

export function ProductCard({ product }: { product: ProductDto }) {
  const image = product.images[0];
  const category = typeof product.category === 'object' ? product.category : null;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-lg hover:shadow-primary/5">
      <Link to={`/product/${product.slug}`} className="flex h-full flex-col">
        <div className="relative aspect-square shrink-0 overflow-hidden bg-secondary">
          {image?.url ? (
            <img
              src={image.url}
              alt={image.alt || product.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full place-items-center text-muted-foreground">
              <ImageOff className="h-10 w-10" />
            </div>
          )}

          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {product.badge && <Badge variant="accent">{product.badge}</Badge>}
            {product.totalStock === 0 && <Badge variant="outline">Sold out</Badge>}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <p className="min-h-4 text-[11px] font-semibold uppercase leading-4 tracking-[0.14em] text-muted-foreground">
            {category?.name ?? '\u00A0'}
          </p>
          <h3 className="mt-1.5 line-clamp-2 min-h-11 text-base font-semibold leading-snug">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
            {product.shortDescription || '\u00A0'}
          </p>

          <div className="mt-auto flex items-end justify-between gap-3 pt-4">
            <div>
              <p className="text-[11px] text-muted-foreground">From</p>
              <p className="text-lg font-semibold">{formatBdt(product.basePrice)}</p>
            </div>
            <span className="text-xs text-muted-foreground">
              {product.variants.length} {product.variants.length === 1 ? 'size' : 'sizes'}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
