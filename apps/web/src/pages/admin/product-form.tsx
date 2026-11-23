import { productInputSchema } from '@anando-deal/shared';
import { ArrowLeft, ImagePlus, Loader2, Plus, Trash2, Upload, Video } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ErrorBlock, Field, LoadingBlock, PageHeader } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAdminCategories } from '@/hooks/use-admin-categories';
import { useAdminProduct, useCreateProduct, useUpdateProduct } from '@/hooks/use-admin-products';
import { getApiErrorMessage } from '@/lib/api-error';
import { uploadProductImage, uploadProductVideo } from '@/lib/admin-upload';
import type { ProductDto } from '@/lib/types';

interface ImageRow {
  url: string;
  publicId: string;
  alt: string;
}

interface VariantRow {
  label: string;
  grams: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  sku: string;
  flashDeal: boolean;
  flashPrice: string;
  flashStartsAt: string;
  flashEndsAt: string;
}

const emptyVariant: VariantRow = {
  label: '',
  grams: '',
  price: '',
  compareAtPrice: '',
  stock: '0',
  sku: '',
  flashDeal: false,
  flashPrice: '',
  flashStartsAt: '',
  flashEndsAt: '',
};

function toNumber(value: string): number | undefined {
  if (value.trim() === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function numberToString(value: number | undefined): string {
  return value === undefined ? '' : String(value);
}

function toDateTimeLocal(value: string | undefined): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export default function AdminProductFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { data: product, isLoading } = useAdminProduct(id);

  if (isEditing && isLoading) {
    return <LoadingBlock label="Loading product…" />;
  }

  if (isEditing && !product) {
    return (
      <div className="space-y-4">
        <ErrorBlock message="Product not found." />
        <Button asChild variant="outline">
          <Link to="/admin/products">Back to products</Link>
        </Button>
      </div>
    );
  }

  return <ProductForm key={id ?? 'new'} product={product} />;
}

function ProductForm({ product }: { product?: ProductDto }) {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { data: categories, isLoading: categoriesLoading } = useAdminCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const [name, setName] = useState(product?.name ?? '');
  const [categoryId, setCategoryId] = useState(() => {
    if (!product) {
      return '';
    }

    return typeof product.category === 'object' ? product.category._id : product.category;
  });
  const [description, setDescription] = useState(product?.description ?? '');
  const [images, setImages] = useState<ImageRow[]>(() =>
    (product?.images ?? []).map((image) => ({
      url: image.url,
      publicId: image.publicId ?? '',
      alt: image.alt ?? '',
    })),
  );
  const [video, setVideo] = useState(product?.video ?? '');
  const [variants, setVariants] = useState<VariantRow[]>(() =>
    product
      ? product.variants.map((variant) => ({
          label: variant.label,
          grams: numberToString(variant.grams),
          price: String(variant.price),
          compareAtPrice: numberToString(variant.compareAtPrice),
          stock: String(variant.stock),
          sku: variant.sku,
          flashDeal: Boolean(variant.flashPrice),
          flashPrice: numberToString(variant.flashPrice),
          flashStartsAt: toDateTimeLocal(variant.flashStartsAt),
          flashEndsAt: toDateTimeLocal(variant.flashEndsAt),
        }))
      : [{ ...emptyVariant }],
  );
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const updateVariant = (index: number, patch: Partial<VariantRow>) => {
    setVariants((current) =>
      current.map((variant, position) => (position === index ? { ...variant, ...patch } : variant)),
    );
  };

  const updateImage = (index: number, patch: Partial<ImageRow>) => {
    setImages((current) =>
      current.map((image, position) => (position === index ? { ...image, ...patch } : image)),
    );
  };

  const handleImageUpload = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    setUploadingImage(true);

    try {
      const asset = await uploadProductImage(file);
      setImages((current) => [
        ...current,
        { url: asset.url, publicId: asset.publicId, alt: name || file.name },
      ]);
      toast.success('Image uploaded');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setUploadingImage(false);

      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const handleVideoUpload = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    setUploadingVideo(true);

    try {
      const asset = await uploadProductVideo(file);
      setVideo(asset.url);
      toast.success('Video uploaded');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setUploadingVideo(false);

      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
    }
  };

  const showValidationErrors = (nextErrors: Record<string, string>) => {
    const details = Object.entries(nextErrors).map(([key, message]) => {
      if (key === 'categoryId') {
        return 'Category: select a valid category';
      }

      const variantMatch = key.match(/^variants\.(\d+)\.(.+)$/);

      if (variantMatch) {
        return `Variant ${Number(variantMatch[1]) + 1} ${variantMatch[2]}: ${message}`;
      }

      return `${key}: ${message}`;
    });

    setErrors(nextErrors);
    setFormError(`Please fix the highlighted fields before saving. ${details.join(' · ')}`);
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setErrors({});

    const payload = {
      name,
      description,
      categoryId,
      images: images
        .filter((image) => image.url.trim())
        .map((image) => ({
          url: image.url.trim(),
          publicId: image.publicId || undefined,
          alt: image.alt || undefined,
        })),
      video: video.trim(),
      variants: variants.map((variant) => ({
        label: variant.label,
        grams: toNumber(variant.grams),
        price: toNumber(variant.price),
        compareAtPrice: toNumber(variant.compareAtPrice),
        stock: toNumber(variant.stock) ?? 0,
        sku: variant.sku,
        flashPrice: variant.flashDeal ? toNumber(variant.flashPrice) : undefined,
        flashStartsAt: variant.flashDeal ? variant.flashStartsAt : undefined,
        flashEndsAt: variant.flashDeal ? variant.flashEndsAt : undefined,
      })),
      isActive,
    };

    const missingFlashPrices = variants.reduce<Record<string, string>>(
      (accumulator, variant, index) => {
        if (variant.flashDeal && !variant.flashPrice.trim()) {
          accumulator[`variants.${index}.flashPrice`] = 'Flash sale price is required';
        }

        return accumulator;
      },
      {},
    );

    if (Object.keys(missingFlashPrices).length > 0) {
      showValidationErrors(missingFlashPrices);
      return;
    }

    const parsed = productInputSchema.safeParse(payload);

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};

      for (const issue of parsed.error.issues) {
        const key = issue.path.map(String).join('.');
        nextErrors[key] = issue.message;
      }

      showValidationErrors(nextErrors);
      return;
    }

    const callbacks = {
      onSuccess: () => {
        toast.success(isEditing ? 'Product updated' : 'Product created');
        navigate('/admin/products');
      },
      onError: (error: unknown) => {
        const message = getApiErrorMessage(error);
        setFormError(message);
        toast.error(message);
      },
    };

    if (id) {
      updateProduct.mutate({ id, input: parsed.data }, callbacks);
    } else {
      createProduct.mutate(parsed.data, callbacks);
    }
  };

  const busy = createProduct.isPending || updateProduct.isPending;

  return (
    <form onSubmit={submit} className="space-y-5">
      <PageHeader
        title={isEditing ? 'Edit product' : 'New product'}
        description={
          isEditing
            ? 'Update product details, pricing and stock.'
            : 'Add a new product to your storefront.'
        }
      >
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/products">
            <ArrowLeft />
            Back
          </Link>
        </Button>
        <Button type="submit" size="sm" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />}
          {isEditing ? 'Save changes' : 'Create product'}
        </Button>
      </PageHeader>

      {formError && <ErrorBlock message={formError} />}

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="text-sm font-semibold">Basics</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                label="Product name"
                htmlFor="name"
                error={errors.name}
                className="sm:col-span-2"
              >
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Portable Room Heater"
                />
              </Field>
              <Field label="Category" htmlFor="category" error={errors.categoryId}>
                <Select
                  id="category"
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  disabled={categoriesLoading}
                >
                  <option value="">Select a category</option>
                  {categories?.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Full description"
                htmlFor="description"
                error={errors.description}
                className="sm:col-span-2"
              >
                <Textarea
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={5}
                  placeholder="Tell customers what makes this product special."
                />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Pricing & stock</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVariants((current) => [...current, { ...emptyVariant }])}
              >
                <Plus />
                Add variant
              </Button>
            </div>

            {errors.variants && (
              <p className="mt-2 text-xs font-medium text-destructive">{errors.variants}</p>
            )}

            <div className="mt-4 space-y-4">
              {variants.map((variant, index) => (
                <div key={index} className="rounded-xl border bg-background p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Variant {index + 1}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() =>
                        setVariants((current) =>
                          current.length === 1
                            ? current
                            : current.filter((_, position) => position !== index),
                        )
                      }
                      disabled={variants.length === 1}
                      aria-label={`Remove variant ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Field
                      label="Label"
                      htmlFor={`variant-label-${index}`}
                      error={errors[`variants.${index}.label`]}
                    >
                      <Input
                        id={`variant-label-${index}`}
                        value={variant.label}
                        onChange={(event) => updateVariant(index, { label: event.target.value })}
                        placeholder="Standard"
                      />
                    </Field>
                    <Field
                      label="Price (৳)"
                      htmlFor={`variant-price-${index}`}
                      error={errors[`variants.${index}.price`]}
                    >
                      <Input
                        id={`variant-price-${index}`}
                        type="number"
                        min="0"
                        value={variant.price}
                        onChange={(event) => updateVariant(index, { price: event.target.value })}
                        placeholder="450"
                      />
                    </Field>
                    <Field
                      label="Stock"
                      htmlFor={`variant-stock-${index}`}
                      error={errors[`variants.${index}.stock`]}
                    >
                      <Input
                        id={`variant-stock-${index}`}
                        type="number"
                        min="0"
                        value={variant.stock}
                        onChange={(event) => updateVariant(index, { stock: event.target.value })}
                        placeholder="30"
                      />
                    </Field>
                  </div>

                  <label className="mt-3 flex items-center justify-between gap-3 rounded-xl border bg-card px-3 py-2 text-sm">
                    <span>
                      <span className="font-medium">Flash deal</span>
                      <span className="block text-xs text-muted-foreground">
                        Add this variant to Flash deals. Uncheck to remove it.
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={variant.flashDeal}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        updateVariant(index, {
                          flashDeal: checked,
                          flashPrice: checked ? variant.flashPrice : '',
                          flashStartsAt: checked ? variant.flashStartsAt : '',
                          flashEndsAt: checked ? variant.flashEndsAt : '',
                        });
                      }}
                      className="h-4 w-4 accent-[var(--primary)]"
                    />
                  </label>

                  {variant.flashDeal && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <Field
                        label="Flash sale price (৳)"
                        htmlFor={`variant-flash-price-${index}`}
                        error={errors[`variants.${index}.flashPrice`]}
                      >
                        <Input
                          id={`variant-flash-price-${index}`}
                          type="number"
                          min="1"
                          value={variant.flashPrice}
                          onChange={(event) =>
                            updateVariant(index, { flashPrice: event.target.value })
                          }
                          placeholder="390"
                        />
                      </Field>
                      <Field
                        label="Ends at (optional)"
                        htmlFor={`variant-flash-end-${index}`}
                        error={errors[`variants.${index}.flashEndsAt`]}
                      >
                        <Input
                          id={`variant-flash-end-${index}`}
                          type="datetime-local"
                          value={variant.flashEndsAt}
                          onChange={(event) =>
                            updateVariant(index, { flashEndsAt: event.target.value })
                          }
                        />
                      </Field>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

        </div>

        <div className="space-y-5">
          <section className="rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Images</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploadingImage || images.length >= 8}
              >
                {uploadingImage ? <Loader2 className="animate-spin" /> : <Upload />}
                Upload
              </Button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleImageUpload(event.target.files?.[0])}
              />
            </div>

            {errors.images && (
              <p className="mt-2 text-xs font-medium text-destructive">{errors.images}</p>
            )}

            <div className="mt-4 space-y-3">
              {images.length === 0 && (
                <div className="grid place-items-center rounded-xl border border-dashed bg-background px-4 py-10 text-center">
                  <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Upload up to 8 images. The first one is the cover.
                  </p>
                </div>
              )}

              {images.map((image, index) => (
                <div key={index} className="rounded-xl border bg-background p-3">
                  <div className="flex gap-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted">
                      {image.url && (
                        <img
                          src={image.url}
                          alt={image.alt || 'Product image preview'}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <Input
                        value={image.url}
                        onChange={(event) => updateImage(index, { url: event.target.value })}
                        placeholder="https://…"
                        className="h-9 text-xs"
                        aria-label={`Image ${index + 1} URL`}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-destructive"
                      onClick={() =>
                        setImages((current) => current.filter((_, position) => position !== index))
                      }
                      aria-label={`Remove image ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() =>
                  setImages((current) =>
                    current.length >= 8
                      ? current
                      : [...current, { url: '', publicId: '', alt: '' }],
                  )
                }
                disabled={images.length >= 8}
              >
                <Plus />
                Add image URL
              </Button>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Video className="h-4 w-4" />
                Product video
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => videoInputRef.current?.click()}
                disabled={uploadingVideo}
              >
                {uploadingVideo ? <Loader2 className="animate-spin" /> : <Upload />}
                Upload
              </Button>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(event) => handleVideoUpload(event.target.files?.[0])}
              />
            </div>
            <Input
              value={video}
              onChange={(event) => setVideo(event.target.value)}
              placeholder="https://res.cloudinary.com/…/video.mp4"
              className="mt-3 text-xs"
              aria-label="Product video URL"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Optional. Videos are uploaded to Cloudinary (max 50 MB).
            </p>
            {video && (
              <div className="relative mt-3">
                <video src={video} controls className="w-full rounded-xl border bg-black" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-8 w-8 bg-background/90 text-destructive hover:bg-background"
                  onClick={() => setVideo('')}
                  aria-label="Remove product video"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <h2 className="text-sm font-semibold">Visibility</h2>
            <div className="mt-4 space-y-3">
              <label className="flex items-center justify-between gap-3 rounded-xl border bg-background px-3 py-2.5 text-sm">
                <span>
                  <span className="font-medium">Active</span>
                  <span className="block text-xs text-muted-foreground">
                    Show this product in the storefront
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) => setIsActive(event.target.checked)}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
              </label>
            </div>
          </section>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button asChild type="button" variant="outline">
          <Link to="/admin/products">Cancel</Link>
        </Button>
        <Button type="submit" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />}
          {isEditing ? 'Save changes' : 'Create product'}
        </Button>
      </div>
    </form>
  );
}
