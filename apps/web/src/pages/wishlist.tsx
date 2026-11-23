import { formatBdt } from '@anando-deal/shared';
import { Heart, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/stores/wishlist';

export default function WishlistPage() {
  const items = useWishlist((state) => state.items);
  const removeItem = useWishlist((state) => state.removeItem);
  const clear = useWishlist((state) => state.clear);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Saved for later
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold">Your wishlist</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {items.length === 0
              ? 'Nothing saved yet.'
              : `${items.length} ${items.length === 1 ? 'product' : 'products'} saved on this device.`}
          </p>
        </div>
        {items.length > 0 && (
          <Button variant="outline" onClick={clear}>
            Clear wishlist
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-10 grid place-items-center rounded-3xl border border-dashed py-20 text-center">
          <div>
            <Heart className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">Your wishlist is empty</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Tap the heart on any product to save it here for later.
            </p>
            <Button asChild className="mt-6">
              <Link to="/shop">Browse products</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {items.map((item) => (
            <article
              key={item.productId}
              className="flex flex-col overflow-hidden rounded-2xl border bg-card"
            >
              <Link to={`/product/${item.slug}`} className="relative aspect-square bg-secondary">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-muted-foreground">
                    <Heart className="h-8 w-8" />
                  </div>
                )}
              </Link>
              <div className="flex flex-1 flex-col p-4">
                <h2 className="line-clamp-2 text-sm font-semibold">{item.name}</h2>
                <p className="mt-2 text-base font-semibold text-primary">{formatBdt(item.price)}</p>
                <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                  <Link
                    to={`/product/${item.slug}`}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    View product
                  </Link>
                  <button
                    type="button"
                    aria-label={`Remove ${item.name} from wishlist`}
                    onClick={() => removeItem(item.productId)}
                    className="grid h-9 w-9 place-items-center rounded-full border text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
