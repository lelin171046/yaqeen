import { productInputSchema } from '@yaqeen/shared';
import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  Plus,
  Trash2,
  Upload,
  Video,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ErrorBlock, Field, LoadingBlock, PageHeader } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAdminCategories } from '@/hooks/use-admin-categories';
import {
  useAdminProduct,
  useCreateProduct,
  useUpdateProduct,
} from '@/hooks/use-admin-products';
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
}

interface NutritionRow {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sugar: string;
}

const emptyVariant: VariantRow = {
  label: '',
  grams: '',
  price: '',
  compareAtPrice: '',
  stock: '0',
  sku: '',
};

const emptyNutrition: NutritionRow = {
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
  fiber: '',
  sugar: '',
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

function toNutritionRow(product?: ProductDto): NutritionRow {
  if (!product?.nutrition) {
    return { ...emptyNutrition };
  }

  return {
    calories: numberToString(product.nutrition.calories),
    protein: numberToString(product.nutrition.protein),
    carbs: numberToString(product.nutrition.carbs),
    fat: numberToString(product.nutrition.fat),
    fiber: numberToString(product.nutrition.fiber),
    sugar: numberToString(product.nutrition.sugar),
  };
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
  const [slug, setSlug] = useState(product?.slug ?? '');
  const [categoryId, setCategoryId] = useState(() => {
    if (!product) {
      return '';
    }

    return typeof product.category === 'object'
      ? product.category._id
      : product.category;
  });
  const [shortDescription, setShortDescription] = useState(
    product?.shortDescription ?? '',
  );
  const [description, setDescription] = useState(product?.description ?? '');
  const [badge, setBadge] = useState(product?.badge ?? '');
  const [tags, setTags] = useState((product?.tags ?? []).join(', '));
  const [ingredients, setIngredients] = useState(product?.ingredients ?? '');
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
        }))
      : [{ ...emptyVariant }],
  );
  const [nutrition, setNutrition] = useState<NutritionRow>(() =>
    toNutritionRow(product),
  );
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const updateVariant = (index: number, patch: Partial<VariantRow>) => {
    setVariants((current) =>
      current.map((variant, position) =>
        position === index ? { ...variant, ...patch } : variant,
      ),
    );
  };

  const updateImage = (index: number, patch: Partial<ImageRow>) => {
    setImages((current) =>
      current.map((image, position) =>
        position === index ? { ...image, ...patch } : image,
      ),
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

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setErrors({});

    const payload = {
      name,
      slug: slug.trim() ? slug.trim() : undefined,
      description,
      shortDescription,
      categoryId,
      images: images
        .filter((image) => image.url.trim())
        .map((image) => ({
          url: image.url.trim(),
          publicId: image.publicId || undefined,
          alt: image.alt || undefined,
        })),
      video: video.trim(),
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      ingredients,
      nutrition: Object.values(nutrition).some((value) => value.trim())
        ? {
            calories: toNumber(nutrition.calories),
            protein: toNumber(nutrition.protein),
            carbs: toNumber(nutrition.carbs),
            fat: toNumber(nutrition.fat),
            fiber: toNumber(nutrition.fiber),
            sugar: toNumber(nutrition.sugar),
          }
        : undefined,
      variants: variants.map((variant) => ({
        label: variant.label,
        grams: toNumber(variant.grams),
        price: toNumber(variant.price),
        compareAtPrice: toNumber(variant.compareAtPrice),
        stock: toNumber(variant.stock) ?? 0,
        sku: variant.sku,
      })),
      isFeatured,
      isActive,
      badge,
      seo:
        seoTitle.trim() || seoDescription.trim()
          ? { title: seoTitle, description: seoDescription }
          : undefined,
    };

    const parsed = productInputSchema.safeParse(payload);

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};

      for (const issue of parsed.error.issues) {
        const key = issue.path.map(String).join('.');
        nextErrors[key] = issue.message;
      }

      setErrors(nextErrors);
      setFormError('Please fix the highlighted fields before saving.');
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
              <Field label="Product name" htmlFor="name" error={errors.name} className="sm:col-span-2">
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Premium Cashews"
                />
              </Field>
              <Field
                label="Slug"
                htmlFor="slug"
                hint="Leave blank to generate from the name"
                error={errors.slug}
              >
                <Input
                  id="slug"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  placeholder="premium-cashews"
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
                label="Short description"
                htmlFor="shortDescription"
                error={errors.shortDescription}
                className="sm:col-span-2"
              >
                <Input
                  id="shortDescription"
                  value={shortDescription}
                  onChange={(event) => setShortDescription(event.target.value)}
                  placeholder="Hand-picked, creamy cashews packed fresh."
                />
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
              <Field label="Badge" htmlFor="badge" hint="Shown on product cards" error={errors.badge}>
                <Input
                  id="badge"
                  value={badge}
                  onChange={(event) => setBadge(event.target.value)}
                  placeholder="Best seller"
                />
              </Field>
              <Field label="Tags" htmlFor="tags" hint="Comma separated" error={errors.tags}>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  placeholder="cashew, kaju, premium"
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
                    <Field label="Label" htmlFor={`variant-label-${index}`} error={errors[`variants.${index}.label`]}>
                      <Input
                        id={`variant-label-${index}`}
                        value={variant.label}
                        onChange={(event) => updateVariant(index, { label: event.target.value })}
                        placeholder="250g"
                      />
                    </Field>
                    <Field label="Grams" htmlFor={`variant-grams-${index}`} error={errors[`variants.${index}.grams`]}>
                      <Input
                        id={`variant-grams-${index}`}
                        type="number"
                        min="0"
                        value={variant.grams}
                        onChange={(event) => updateVariant(index, { grams: event.target.value })}
                        placeholder="250"
                      />
                    </Field>
                    <Field label="SKU" htmlFor={`variant-sku-${index}`} hint="Auto-generated if blank" error={errors[`variants.${index}.sku`]}>
                      <Input
                        id={`variant-sku-${index}`}
                        value={variant.sku}
                        onChange={(event) => updateVariant(index, { sku: event.target.value })}
                        placeholder="CASHEW-250G"
                      />
                    </Field>
                    <Field label="Price (৳)" htmlFor={`variant-price-${index}`} error={errors[`variants.${index}.price`]}>
                      <Input
                        id={`variant-price-${index}`}
                        type="number"
                        min="0"
                        value={variant.price}
                        onChange={(event) => updateVariant(index, { price: event.target.value })}
                        placeholder="450"
                      />
                    </Field>
                    <Field label="Compare at (৳)" htmlFor={`variant-compare-${index}`} error={errors[`variants.${index}.compareAtPrice`]}>
                      <Input
                        id={`variant-compare-${index}`}
                        type="number"
                        min="0"
                        value={variant.compareAtPrice}
                        onChange={(event) =>
                          updateVariant(index, { compareAtPrice: event.target.value })
                        }
                        placeholder="520"
                      />
                    </Field>
                    <Field label="Stock" htmlFor={`variant-stock-${index}`} error={errors[`variants.${index}.stock`]}>
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
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <h2 className="text-sm font-semibold">Extra details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                label="Ingredients"
                htmlFor="ingredients"
                error={errors.ingredients}
                className="sm:col-span-2"
              >
                <Textarea
                  id="ingredients"
                  value={ingredients}
                  onChange={(event) => setIngredients(event.target.value)}
                  rows={2}
                  placeholder="Cashews, sea salt."
                />
              </Field>
              {(
                [
                  ['calories', 'Calories'],
                  ['protein', 'Protein (g)'],
                  ['carbs', 'Carbs (g)'],
                  ['fat', 'Fat (g)'],
                  ['fiber', 'Fibre (g)'],
                  ['sugar', 'Sugar (g)'],
                ] as Array<[keyof NutritionRow, string]>
              ).map(([key, label]) => (
                <Field key={key} label={label} htmlFor={`nutrition-${key}`} error={errors[`nutrition.${key}`]}>
                  <Input
                    id={`nutrition-${key}`}
                    type="number"
                    min="0"
                    value={nutrition[key]}
                    onChange={(event) =>
                      setNutrition((current) => ({ ...current, [key]: event.target.value }))
                    }
                  />
                </Field>
              ))}
              <Field label="SEO title" htmlFor="seoTitle" error={errors['seo.title']}>
                <Input
                  id="seoTitle"
                  value={seoTitle}
                  onChange={(event) => setSeoTitle(event.target.value)}
                  placeholder="Premium Cashews in Bangladesh"
                />
              </Field>
              <Field label="SEO description" htmlFor="seoDescription" error={errors['seo.description']}>
                <Input
                  id="seoDescription"
                  value={seoDescription}
                  onChange={(event) => setSeoDescription(event.target.value)}
                  placeholder="Fresh, hand-picked cashews delivered nationwide."
                />
              </Field>
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
                      <Input
                        value={image.alt}
                        onChange={(event) => updateImage(index, { alt: event.target.value })}
                        placeholder="Alt text"
                        className="h-9 text-xs"
                        aria-label={`Image ${index + 1} alt text`}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-destructive"
                      onClick={() =>
                        setImages((current) =>
                          current.filter((_, position) => position !== index),
                        )
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
              <video
                src={video}
                controls
                className="mt-3 w-full rounded-xl border bg-black"
              />
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
              <label className="flex items-center justify-between gap-3 rounded-xl border bg-background px-3 py-2.5 text-sm">
                <span>
                  <span className="font-medium">Featured</span>
                  <span className="block text-xs text-muted-foreground">
                    Highlight on the home page
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(event) => setIsFeatured(event.target.checked)}
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
