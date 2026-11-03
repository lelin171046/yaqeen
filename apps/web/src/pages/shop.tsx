import { SlidersHorizontal } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { SiteLayout } from '@/components/layout/site-layout';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useCategories, useProducts, type ProductQueryParams } from '@/hooks/use-catalog';
import { getApiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';

const sortOptions: Array<{ value: NonNullable<ProductQueryParams['sort']>; label: string }> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'name_asc', label: 'Name: A to Z' },
];

export default function ShopPage() {
  const [params, setParams] = useSearchParams();
  const search = params.get('search') ?? '';
  const category = params.get('category') ?? '';
  const sort = (params.get('sort') ?? 'newest') as NonNullable<ProductQueryParams['sort']>;
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);

  const { data: categories } = useCategories();
  const { data, isLoading, isError, error } = useProducts({
    search: search || undefined,
    category: category || undefined,
    sort,
    page,
    limit: 9,
  });

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);

    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }

    if (key !== 'page') {
      next.delete('page');
    }

    setParams(next);
  };

  return (
    <SiteLayout>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-primary">Shop Yaqeen</p>
            <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">
              {category
                ? categories?.find((item) => item.slug === category)?.name ?? 'Our range'
                : 'Clean food, honestly priced'}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Nuts, dry fruits, diet foods and everyday nutrition, packed fresh in Bangladesh.
            </p>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              updateParam('search', String(form.get('search') ?? '').trim());
            }}
            className="flex w-full max-w-sm gap-2"
          >
            <input
              key={search}
              name="search"
              type="search"
              defaultValue={search}
              placeholder="Search products"
              className="h-11 w-full rounded-full border border-input bg-card px-4 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              aria-label="Search products"
            />
            <Button type="submit">Search</Button>
          </form>
        </div>

        <div className="mt-8 flex flex-col gap-4 rounded-2xl border bg-card p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            <SlidersHorizontal className="mr-1 h-4 w-4 shrink-0 text-muted-foreground" />
            <button
              type="button"
              onClick={() => updateParam('category', '')}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                !category
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'hover:bg-muted',
              )}
            >
              All
            </button>
            {categories?.map((item) => (
              <button
                key={item._id}
                type="button"
                onClick={() => updateParam('category', item.slug)}
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                  category === item.slug
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'hover:bg-muted',
                )}
              >
                {item.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Sort</span>
            <Select
              value={sort}
              onChange={(event) => updateParam('sort', event.target.value)}
              className="h-9 w-48 text-xs"
              aria-label="Sort products"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {isLoading && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-2xl border bg-card">
                <div className="aspect-square animate-pulse bg-muted" />
                <div className="space-y-3 p-4">
                  <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            {getApiErrorMessage(error)}
          </div>
        )}

        {!isLoading && !isError && data && data.items.length === 0 && (
          <div className="mt-10 rounded-2xl border bg-card px-6 py-16 text-center">
            <h2 className="text-xl font-semibold">No products found</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Try a different search or browse all categories.
            </p>
            <Button asChild className="mt-5">
              <Link to="/shop">Clear filters</Link>
            </Button>
          </div>
        )}

        {data && data.items.length > 0 && (
          <>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {data.pagination.pages > 1 && (
              <div className="mt-10 flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  Page {data.pagination.page} of {data.pagination.pages} ·{' '}
                  {data.pagination.total} products
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={data.pagination.page <= 1}
                    onClick={() => updateParam('page', String(data.pagination.page - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    disabled={data.pagination.page >= data.pagination.pages}
                    onClick={() => updateParam('page', String(data.pagination.page + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </SiteLayout>
  );
}
