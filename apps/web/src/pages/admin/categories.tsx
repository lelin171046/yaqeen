import { categoryInputSchema } from '@yaqeen/shared';
import { Loader2, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  useAdminCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/hooks/use-admin-categories';
import { getApiErrorMessage } from '@/lib/api-error';
import { uploadProductImage } from '@/lib/admin-upload';
import type { CategoryDto } from '@/lib/types';

interface CategoryFormState {
  name: string;
  slug: string;
  description: string;
  image: string;
  sortOrder: string;
  isActive: boolean;
}

const emptyForm: CategoryFormState = {
  name: '',
  slug: '',
  description: '',
  image: '',
  sortOrder: '0',
  isActive: true,
};

export default function AdminCategoriesPage() {
  const { data: categories, isLoading, isError, error } = useAdminCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<CategoryFormState>({ ...emptyForm });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (category: CategoryDto) => {
    setEditingId(category._id);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      image: category.image ?? '',
      sortOrder: String(category.sortOrder ?? 0),
      isActive: category.isActive,
    });
    setErrors({});
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setErrors({});
  };

  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});

    const parsed = categoryInputSchema.safeParse({
      name: form.name,
      slug: form.slug.trim() ? form.slug.trim() : undefined,
      description: form.description,
      image: form.image.trim(),
      sortOrder: form.sortOrder,
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
        toast.success(editingId ? 'Category updated' : 'Category created');
        closeForm();
      },
      onError: (mutationError: unknown) =>
        toast.error(getApiErrorMessage(mutationError)),
    };

    if (editingId) {
      updateCategory.mutate({ id: editingId, input: parsed.data }, callbacks);
    } else {
      createCategory.mutate(parsed.data, callbacks);
    }
  };

  const handleDelete = (category: CategoryDto) => {
    if (
      !window.confirm(
        `Delete "${category.name}"? Categories with products cannot be deleted.`,
      )
    ) {
      return;
    }

    deleteCategory.mutate(category._id, {
      onSuccess: () => toast.success(`${category.name} deleted`),
      onError: (mutationError) => toast.error(getApiErrorMessage(mutationError)),
    });
  };

  const handleUpload = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    setUploading(true);

    try {
      const asset = await uploadProductImage(file);
      setForm((current) => ({ ...current, image: asset.url }));
      toast.success('Image uploaded');
    } catch (uploadError) {
      toast.error(getApiErrorMessage(uploadError));
    } finally {
      setUploading(false);

      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const busy = createCategory.isPending || updateCategory.isPending;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Categories"
        description="Organise the catalogue into the sections customers browse."
      >
        <Button size="sm" onClick={openCreate}>
          <Plus />
          New category
        </Button>
      </PageHeader>

      {formOpen && (
        <form onSubmit={save} className="rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              {editingId ? 'Edit category' : 'New category'}
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
            <Field label="Name" htmlFor="category-name" error={errors.name}>
              <Input
                id="category-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Nuts & Seeds"
              />
            </Field>
            <Field
              label="Slug"
              htmlFor="category-slug"
              hint="Leave blank to generate from the name"
              error={errors.slug}
            >
              <Input
                id="category-slug"
                value={form.slug}
                onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                placeholder="nuts-seeds"
              />
            </Field>
            <Field
              label="Description"
              htmlFor="category-description"
              error={errors.description}
              className="sm:col-span-2"
            >
              <Textarea
                id="category-description"
                rows={2}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Cashews, almonds, pistachios, walnuts and everyday seeds."
              />
            </Field>
            <Field label="Image URL" htmlFor="category-image" error={errors.image} className="sm:col-span-2">
              <div className="flex gap-2">
                <Input
                  id="category-image"
                  value={form.image}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, image: event.target.value }))
                  }
                  placeholder="https://res.cloudinary.com/…"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
                  Upload
                </Button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handleUpload(event.target.files?.[0])}
                />
              </div>
            </Field>
            <Field label="Sort order" htmlFor="category-sort" error={errors.sortOrder}>
              <Input
                id="category-sort"
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={(event) =>
                  setForm((current) => ({ ...current, sortOrder: event.target.value }))
                }
              />
            </Field>
            <label className="flex items-center gap-3 self-end rounded-xl border bg-background px-3 py-2.5 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((current) => ({ ...current, isActive: event.target.checked }))
                }
                className="h-4 w-4 accent-[var(--primary)]"
              />
              Active in storefront
            </label>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeForm}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />}
              {editingId ? 'Save changes' : 'Create category'}
            </Button>
          </div>
        </form>
      )}

      {isLoading && <LoadingBlock label="Loading categories…" />}
      {isError && <ErrorBlock message={getApiErrorMessage(error)} />}

      {!isLoading && !isError && categories && categories.length === 0 && (
        <EmptyState
          title="No categories yet"
          description="Create your first category to start adding products."
          action={
            <Button onClick={openCreate}>
              <Plus />
              New category
            </Button>
          }
        />
      )}

      {!isLoading && !isError && categories && categories.length > 0 && (
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Slug</th>
                  <th className="px-5 py-3 font-semibold">Sort</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {categories.map((category) => (
                  <tr key={category._id} className="hover:bg-muted/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border bg-muted">
                          {category.image && (
                            <img
                              src={category.image}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium">{category.name}</p>
                          {category.description && (
                            <p className="max-w-xs truncate text-xs text-muted-foreground">
                              {category.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{category.slug}</td>
                    <td className="px-5 py-3">{category.sortOrder}</td>
                    <td className="px-5 py-3">
                      {category.isActive ? (
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
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(category)}
                          aria-label={`Edit ${category.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(category)}
                          disabled={deleteCategory.isPending}
                          aria-label={`Delete ${category.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
