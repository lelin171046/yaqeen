import { formatBdt } from '@yaqeen/shared';
import {
  ArrowLeft,
  Check,
  ImageOff,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { SiteLayout } from '@/components/layout/site-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useProduct } from '@/hooks/use-catalog';
import { getApiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { useCart } from '@/stores/cart';

const trustPoints = [
  { title: 'Cash on delivery', icon: Wallet },
  { title: 'Nationwide delivery', icon: Truck },
  { title: 'Quality checked', icon: ShieldCheck },
  { title: 'Freshly packed', icon: PackageCheck },
];

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading, isError, error } = useProduct(slug);
  const addItem = useCart((state) => state.addItem);
  const navigate = useNavigate();

  const [selectedSku, setSelectedSku] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);

  if (isLoading) {
    return (
      <SiteLayout>
        <main className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="aspect-square animate-pulse rounded-3xl border bg-muted" />
          <div className="space-y-4">
            <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
            <div className="h-10 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-20 w-full animate-pulse rounded bg-muted" />
            <div className="h-12 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        </main>
      </SiteLayout>
    );
  }

  if (isError || !product) {
    return (
      <SiteLayout>
        <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-primary">Product unavailable</p>
          <h1 className="mt-2 text-3xl font-semibold">We could not find this product</h1>
          <p className="mt-3 text-muted-foreground">{getApiErrorMessage(error)}</p>
          <Button asChild className="mt-6">
            <Link to="/shop">
              <ArrowLeft />
              Back to shop
            </Link>
          </Button>
        </main>
      </SiteLayout>
    );
  }

  const variant =
    product.variants.find((item) => item.sku === selectedSku) ?? product.variants[0];
  const available = variant?.stock ?? 0;
  const image = product.images[imageIndex] ?? product.images[0];
  const category = typeof product.category === 'object' ? product.category : null;
  const canAdd = Boolean(variant) && available > 0 && product.isActive;

  const addToCart = (thenCheckout = false) => {
    if (!variant || !canAdd) {
      toast.error('This size is currently out of stock.');
      return;
    }

    addItem(
      {
        productId: product._id,
        slug: product.slug,
        name: product.name,
        image: product.images[0]?.url ?? '',
        variantSku: variant.sku,
        variantLabel: variant.label,
        price: variant.price,
        maxStock: available,
      },
      quantity,
    );

    if (thenCheckout) {
      navigate('/checkout');
      return;
    }

    toast.success(`${product.name} (${variant.label}) added to cart`);
  };

  return (
    <SiteLayout>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            Home
          </Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-foreground">
            Shop
          </Link>
          {category && (
            <>
              <span>/</span>
              <Link
                to={`/shop?category=${category.slug}`}
                className="hover:text-foreground"
              >
                {category.name}
              </Link>
            </>
          )}
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1fr_0.95fr] lg:gap-14">
          <div>
            <div className="relative aspect-square overflow-hidden rounded-3xl border bg-secondary">
              {image?.url ? (
                <img
                  src={image.url}
                  alt={image.alt || product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center text-muted-foreground">
                  <ImageOff className="h-14 w-14" />
                </div>
              )}
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                {product.badge && <Badge variant="accent">{product.badge}</Badge>}
                {available === 0 && <Badge variant="outline">Sold out</Badge>}
              </div>
            </div>

            {product.images.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto">
                {product.images.map((item, index) => (
                  <button
                    key={`${item.url}-${index}`}
                    type="button"
                    onClick={() => setImageIndex(index)}
                    className={cn(
                      'h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-secondary',
                      index === imageIndex ? 'border-primary' : 'border-transparent',
                    )}
                    aria-label={`View image ${index + 1}`}
                  >
                    <img
                      src={item.url}
                      alt={item.alt || `${product.name} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            {category && (
              <p className="text-sm font-semibold text-primary">{category.name}</p>
            )}
            <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">{product.name}</h1>
            {product.shortDescription && (
              <p className="mt-3 text-muted-foreground">{product.shortDescription}</p>
            )}

            <div className="mt-6 flex flex-wrap items-end gap-3">
              <p className="text-3xl font-semibold">{formatBdt(variant?.price ?? product.basePrice)}</p>
              {variant?.compareAtPrice && variant.compareAtPrice > variant.price && (
                <p className="pb-1 text-base text-muted-foreground line-through">
                  {formatBdt(variant.compareAtPrice)}
                </p>
              )}
              <span
                className={cn(
                  'mb-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                  available > 0
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-rose-50 text-rose-700',
                )}
              >
                {available > 0 ? `In stock · ${available} left` : 'Out of stock'}
              </span>
            </div>

            <div className="mt-7">
              <p className="text-sm font-semibold">Choose a size</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.variants.map((item) => {
                  const isSelected = item.sku === variant?.sku;
                  const isSoldOut = item.stock < 1;

                  return (
                    <button
                      key={item.sku}
                      type="button"
                      disabled={isSoldOut}
                      onClick={() => {
                        setSelectedSku(item.sku);
                        setQuantity(1);
                      }}
                      className={cn(
                        'rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors',
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'bg-card hover:bg-muted',
                        isSoldOut && 'cursor-not-allowed opacity-40',
                      )}
                    >
                      {item.label}
                      <span className="ml-2 text-xs font-normal opacity-80">
                        {formatBdt(item.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <div className="inline-flex items-center rounded-full border bg-card">
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  disabled={quantity <= 1}
                  className="grid h-11 w-11 place-items-center rounded-l-full hover:bg-muted disabled:opacity-40"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.min(available, value + 1))}
                  disabled={quantity >= available}
                  className="grid h-11 w-11 place-items-center rounded-r-full hover:bg-muted disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <Button
                size="lg"
                variant="outline"
                disabled={!canAdd}
                onClick={() => addToCart(false)}
              >
                <ShoppingBag />
                Add to cart
              </Button>
              <Button size="lg" disabled={!canAdd} onClick={() => addToCart(true)}>
                Order now
              </Button>
            </div>

            <div className="mt-8 grid gap-3 rounded-2xl border bg-card p-5 sm:grid-cols-2">
              {trustPoints.map((point) => (
                <div key={point.title} className="flex items-center gap-2.5 text-sm">
                  <point.icon className="h-4 w-4 text-primary" />
                  {point.title}
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-5">
              <div>
                <h2 className="text-lg font-semibold">About this product</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
              </div>

              {product.ingredients && (
                <div>
                  <h2 className="text-lg font-semibold">Ingredients</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{product.ingredients}</p>
                </div>
              )}

              {product.nutrition && (
                <div>
                  <h2 className="text-lg font-semibold">Nutrition</h2>
                  <dl className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                    {Object.entries(product.nutrition)
                      .filter(([, value]) => value !== undefined)
                      .map(([key, value]) => (
                        <div key={key} className="rounded-lg bg-muted px-3 py-2">
                          <dt className="text-xs capitalize text-muted-foreground">{key}</dt>
                          <dd className="font-semibold">{value}</dd>
                        </div>
                      ))}
                  </dl>
                </div>
              )}

              <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                {product.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1">
                    <Check className="h-3 w-3 text-primary" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </SiteLayout>
  );
}
