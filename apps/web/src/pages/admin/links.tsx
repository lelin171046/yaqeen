import { orderLinkInputSchema } from '@yaqeen/shared';
import { Copy, ExternalLink, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  EmptyState,
  ErrorBlock,
  Field,
  LoadingBlock,
  PageHeader,
} from '@/components/admin/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useAdminProducts } from '@/hooks/use-admin-products';
import {
  useAdminLinks,
  useCreateLink,
  useDeleteLink,
  useUpdateLink,
} from '@/hooks/use-admin-links';
import { getApiErrorMessage } from '@/lib/api-error';
import type { OrderLinkDto } from '@/lib/types';

interface LinkFormState {
  productId: string;
  title: string;
  campaign: string;
  code: string;
  destination: 'ORDER' | 'PRODUCT';
  isActive: boolean;
}

const emptyForm: LinkFormState = {
  productId: '',
  title: '',
  campaign: '',
  code: '',
  destination: 'ORDER',
  isActive: true,
};

function linkUrl(code: string): string {
  return `${window.location.origin}/l/${code}`;
}

export default function AdminLinksPage() {
  const { data: links, isLoading, isError, error } = useAdminLinks();
  const { data: products } = useAdminProducts({ limit: 100, sort: 'name_asc' });
  const createLink = useCreateLink();
  const updateLink = useUpdateLink();
  const deleteLink = useDeleteLink();

  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<LinkFormState>({ ...emptyForm });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const openCreate = () => {
    setEditingCode(null);
    setForm({ ...emptyForm });
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (link: OrderLinkDto) => {
    setEditingCode(link.code);
    setForm({
      productId: link.product.id,
      title: link.title,
      campaign: link.campaign,
      code: link.code,
      destination: link.destination === 'PRODUCT' ? 'PRODUCT' : 'ORDER',
      isActive: link.isActive,
    });
    setErrors({});
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingCode(null);
    setForm({ ...emptyForm });
    setErrors({});
  };

  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});

    const parsed = orderLinkInputSchema.safeParse({
      productId: form.productId,
      title: form.title,
      campaign: form.campaign,
      code: form.code.trim() ? form.code.trim() : undefined,
      destination: form.destination,
      isActive: form.isActive,
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};

      for (const issue of parsed.error.issues) {
        nextErrors[issue.path.map(String).join('.')] = issue.message;
      }

      setErrors(nextErrors);
      return;
    }

    const callbacks = {
      onSuccess: () => {
        toast.success(editingCode ? 'Link updated' : 'Link created');
        closeForm();
      },
      onError: (mutationError: unknown) =>
        toast.error(getApiErrorMessage(mutationError)),
    };

    if (editingCode) {
      updateLink.mutate({ code: editingCode, input: parsed.data }, callbacks);
    } else {
      createLink.mutate(parsed.data, callbacks);
    }
  };

  const copyLink = async (code: string) => {
    await navigator.clipboard.writeText(linkUrl(code));
    toast.success('Link copied');
  };

  const handleDelete = (link: OrderLinkDto) => {
    if (!window.confirm(`Delete campaign link /${link.code}?`)) {
      return;
    }

    deleteLink.mutate(link.code, {
      onSuccess: () => toast.success('Link deleted'),
      onError: (mutationError) => toast.error(getApiErrorMessage(mutationError)),
    });
  };

  const busy = createLink.isPending || updateLink.isPending;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ad links"
        description="Create trackable campaign links for Facebook ads and WhatsApp."
      >
        <Button size="sm" onClick={openCreate}>
          <Plus />
          New link
        </Button>
      </PageHeader>

      {formOpen && (
        <form onSubmit={save} className="rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              {editingCode ? 'Edit link' : 'New campaign link'}
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={closeForm}
              aria-label="Close form"
            >
              <X />
            </Button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Product" htmlFor="link-product" error={errors.productId} className="sm:col-span-2">
              <Select
                id="link-product"
                value={form.productId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, productId: event.target.value }))
                }
              >
                <option value="">Select a product</option>
                {products?.items.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Title" htmlFor="link-title" error={errors.title}>
              <Input
                id="link-title"
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Eid cashew campaign"
              />
            </Field>
            <Field
              label="Code"
              htmlFor="link-code"
              hint="Leave blank to auto-generate"
              error={errors.code}
            >
              <Input
                id="link-code"
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({ ...current, code: event.target.value }))
                }
                placeholder="eid-cashew"
              />
            </Field>
            <Field label="Campaign" htmlFor="link-campaign" error={errors.campaign}>
              <Input
                id="link-campaign"
                value={form.campaign}
                onChange={(event) =>
                  setForm((current) => ({ ...current, campaign: event.target.value }))
                }
                placeholder="Facebook – Eid 2026"
              />
            </Field>
            <Field label="Destination" htmlFor="link-destination" error={errors.destination}>
              <Select
                id="link-destination"
                value={form.destination}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    destination: event.target.value as 'ORDER' | 'PRODUCT',
                  }))
                }
              >
                <option value="ORDER">Order landing (add to cart)</option>
                <option value="PRODUCT">Product page</option>
              </Select>
            </Field>
            <label className="flex items-center gap-3 self-end rounded-xl border bg-background px-3 py-2.5 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((current) => ({ ...current, isActive: event.target.checked }))
                }
                className="h-4 w-4 accent-[var(--primary)]"
              />
              Active — customers can use this link
            </label>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeForm}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />}
              {editingCode ? 'Save changes' : 'Create link'}
            </Button>
          </div>
        </form>
      )}

      {isLoading && <LoadingBlock label="Loading links…" />}
      {isError && <ErrorBlock message={getApiErrorMessage(error)} />}

      {!isLoading && !isError && links && links.length === 0 && (
        <EmptyState
          title="No campaign links yet"
          description="Create a link for each Facebook ad or WhatsApp broadcast so you can see what converts."
          action={
            <Button onClick={openCreate}>
              <Plus />
              New link
            </Button>
          }
        />
      )}

      {!isLoading && !isError && links && links.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {links.map((link) => (
            <div key={link.id} className="rounded-2xl border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {link.title || link.product.name || link.code}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    /{link.code}
                    {link.campaign ? ` · ${link.campaign}` : ''}
                  </p>
                </div>
                {link.isActive ? (
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-muted text-muted-foreground">
                    Off
                  </Badge>
                )}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-muted/60 px-2 py-2">
                  <p className="text-lg font-semibold">{link.clicks}</p>
                  <p className="text-[11px] text-muted-foreground">Clicks</p>
                </div>
                <div className="rounded-xl bg-muted/60 px-2 py-2">
                  <p className="text-lg font-semibold">{link.orders}</p>
                  <p className="text-[11px] text-muted-foreground">Orders</p>
                </div>
                <div className="rounded-xl bg-muted/60 px-2 py-2">
                  <p className="text-lg font-semibold">
                    {link.clicks > 0
                      ? `${Math.round((link.orders / link.clicks) * 100)}%`
                      : '—'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">CVR</p>
                </div>
              </div>

              <p className="mt-3 truncate rounded-lg bg-muted/60 px-3 py-2 text-[11px] text-muted-foreground">
                {link.product.name || link.product.id}
              </p>

              <div className="mt-4 flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => copyLink(link.code)}
                >
                  <Copy />
                  Copy link
                </Button>
                <Button asChild variant="ghost" size="icon" className="h-9 w-9">
                  <a
                    href={linkUrl(link.code)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${link.code}`}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => openEdit(link)}
                  aria-label={`Edit ${link.code}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-destructive"
                  onClick={() => handleDelete(link)}
                  disabled={deleteLink.isPending}
                  aria-label={`Delete ${link.code}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
