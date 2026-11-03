import { formatBdt } from '@yaqeen/shared';
import { ExternalLink, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  Pagination,
} from '@/components/admin/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useAdminCategories } from '@/hooks/use-admin-categories';
import { useAdminProducts, useDeleteProduct } from '@/hooks/use-admin-products';
import { getApiErrorMessage } from '@/lib/api-error';

export default function AdminProductsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [active, setActive] = useState('');
  const [page, setPage] = useState(1);

  const { data: categories } = useAdminCategories();
  const { data, isLoading, isError, error } = useAdminProducts({
    search: search || undefined,
    category: category || undefined,
    active: active === '' ? undefined : active === 'true',
    page,
    limit: 10,
    sort: 'newest',
  });
  const remove = useDeleteProduct();

  const applyFilter = (updater: () => void) => {
    updater();
    setPage(1);
  };

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Deactivate "${name}"? It will be hidden from the storefront.`)) {
      return;
    }

    remove.mutate(id, {
      onSuccess: () => toast.success(`${name} deactivated`),
      onError: (mutationError) => toast.error(getApiErrorMessage(mutationError)),
    });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Products"
        description="Create, edit and manage your catalogue and stock."
      >
        <Button asChild size="sm">
          <Link to="/admin/products/new">
            <Plus />
            New product
          </Link>
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            applyFilter(() => setSearch(searchInput.trim()));
          }}
          className="flex flex-1 gap-2"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by product name or tag"
              className="pl-9"
              aria-label="Search products"
            />
          </div>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>

        <div className="flex gap-2">
          <Select
            value={category}
            onChange={(event) =>
              applyFilter(() => setCategory(event.target.value))
            }
            aria-label="Filter by category"
            className="h-10 w-44 text-xs"
          >
            <option value="">All categories</option>
            {categories?.map((item) => (
              <option key={item._id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </Select>
          <Select
            value={active}
            onChange={(event) => applyFilter(() => setActive(event.target.value))}
            aria-label="Filter by visibility"
            className="h-10 w-36 text-xs"
          >
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
        </div>
      </div>

      {isLoading && <LoadingBlock label="Loading products…" />}
      {isError && <ErrorBlock message={getApiErrorMessage(error)} />}

      {!isLoading && !isError && data && data.items.length === 0 && (
        <EmptyState
          title="No products found"
          description="Try a different filter or add your first product."
          action={
            <Button asChild>
              <Link to="/admin/products/new">
                <Plus />
                Add product
              </Link>
            </Button>
          }
        />
      )}

      {!isLoading && !isError && data && data.items.length > 0 && (
        <>
          <div className="overflow-hidden rounded-2xl border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Product</th>
                    <th className="px-5 py-3 font-semibold">Category</th>
                    <th className="px-5 py-3 font-semibold">Price from</th>
                    <th className="px-5 py-3 font-semibold">Stock</th>
                    <th className="px-5 py-3 font-semibold">Visibility</th>
                    <th className="px-5 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.items.map((product) => {
                    const categoryName =
                      typeof product.category === 'object'
                        ? product.category.name
                        : categories?.find((item) => item._id === product.category)?.name;

                    return (
                      <tr key={product._id} className="hover:bg-muted/30">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border bg-muted">
                              {product.images[0]?.url ? (
                                <img
                                  src={product.images[0].url}
                                  alt={product.images[0].alt || product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : null}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium">{product.name}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {product.variants.length} variant
                                {product.variants.length === 1 ? '' : 's'}
                                {product.isFeatured ? ' · Featured' : ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{categoryName ?? '—'}</td>
                        <td className="px-5 py-3 font-medium">{formatBdt(product.basePrice)}</td>
                        <td className="px-5 py-3">
                          <span
                            className={
                              product.totalStock === 0
                                ? 'font-semibold text-rose-600'
                                : product.totalStock <= 10
                                  ? 'font-semibold text-amber-600'
                                  : ''
                            }
                          >
                            {product.totalStock}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {product.isActive ? (
                            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-muted text-muted-foreground">
                              Inactive
                            </Badge>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              asChild
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="View in store"
                            >
                              <Link
                                to={`/product/${product.slug}`}
                                target="_blank"
                                aria-label={`View ${product.name} in store`}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              asChild
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Edit product"
                            >
                              <Link
                                to={`/admin/products/${product._id}/edit`}
                                aria-label={`Edit ${product.name}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              title="Deactivate product"
                              onClick={() => handleDelete(product._id, product.name)}
                              disabled={remove.isPending || !product.isActive}
                              aria-label={`Deactivate ${product.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            page={data.pagination.page}
            pages={data.pagination.pages}
            total={data.pagination.total}
            onPage={setPage}
          />
        </>
      )}
    </div>
  );
}
