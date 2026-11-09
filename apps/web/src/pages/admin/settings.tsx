import {
  DEFAULT_HERO_CAROUSEL,
  HERO_SLIDE_THEMES,
  settingsUpdateSchema,
  type HeroSlideTheme,
} from '@yaqeen/shared';
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
  Upload,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  ErrorBlock,
  Field,
  LoadingBlock,
  PageHeader,
} from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  useAdminSettings,
  useSendTestEmail,
  useUpdateAdminSettings,
} from '@/hooks/use-admin-settings';
import { uploadProductImage } from '@/lib/admin-upload';
import { getApiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import type { AdminSettingsDto } from '@/lib/types';

interface ZoneRow {
  name: string;
  charge: string;
  isActive: boolean;
}

interface HeroSlideRow {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  badge: string;
  image: string;
  imageAlt: string;
  theme: HeroSlideTheme;
  isActive: boolean;
}

interface SettingsFormState {
  storeName: string;
  supportPhone: string;
  supportEmail: string;
  bkashMerchantNumber: string;
  freeDeliveryThreshold: string;
  defaultDeliveryCharge: string;
  deliveryZones: ZoneRow[];
  adminAlertEmails: string;
  adminAlertWhatsapp: string;
  facebook: string;
  instagram: string;
  whatsapp: string;
  heroAutoplaySeconds: string;
  heroPauseOnHover: boolean;
  heroSlides: HeroSlideRow[];
}

function toFormState(settings: AdminSettingsDto): SettingsFormState {
  const heroCarousel = settings.heroCarousel ?? DEFAULT_HERO_CAROUSEL;

  return {
    storeName: settings.storeName,
    supportPhone: settings.supportPhone,
    supportEmail: settings.supportEmail,
    bkashMerchantNumber: settings.bkashMerchantNumber,
    freeDeliveryThreshold: String(settings.freeDeliveryThreshold),
    defaultDeliveryCharge: String(settings.defaultDeliveryCharge),
    deliveryZones: settings.deliveryZones.map((zone) => ({
      name: zone.name,
      charge: String(zone.charge),
      isActive: zone.isActive,
    })),
    adminAlertEmails: settings.adminAlertEmails.join(', '),
    adminAlertWhatsapp: settings.adminAlertWhatsapp.join(', '),
    facebook: settings.socialLinks.facebook,
    instagram: settings.socialLinks.instagram,
    whatsapp: settings.socialLinks.whatsapp,
    heroAutoplaySeconds: String(heroCarousel.autoplaySeconds),
    heroPauseOnHover: heroCarousel.pauseOnHover,
    heroSlides: heroCarousel.slides.map((slide) => ({
      id: slide.id,
      eyebrow: slide.eyebrow ?? '',
      title: slide.title,
      description: slide.description ?? '',
      ctaLabel: slide.ctaLabel,
      ctaHref: slide.ctaHref,
      badge: slide.badge ?? '',
      image: slide.image ?? '',
      imageAlt: slide.imageAlt ?? '',
      theme: slide.theme,
      isActive: slide.isActive,
    })),
  };
}

function createHeroSlide(): HeroSlideRow {
  return {
    id: crypto.randomUUID(),
    eyebrow: 'New offer',
    title: 'Your next offer headline',
    description: 'Tell customers why this offer is worth clicking.',
    ctaLabel: 'Shop now',
    ctaHref: '/shop',
    badge: '',
    image: '',
    imageAlt: '',
    theme: 'forest',
    isActive: true,
  };
}

export default function AdminSettingsPage() {
  const { data: settings, isLoading, isError, error } = useAdminSettings();

  if (isLoading) {
    return <LoadingBlock label="Loading settings…" />;
  }

  if (isError || !settings) {
    return <ErrorBlock message={getApiErrorMessage(error)} />;
  }

  return <SettingsForm settings={settings} />;
}

function SettingsForm({ settings }: { settings: AdminSettingsDto }) {
  const updateSettings = useUpdateAdminSettings();
  const sendTestEmail = useSendTestEmail();
  const [form, setForm] = useState<SettingsFormState>(() => toFormState(settings));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [uploadingSlideId, setUploadingSlideId] = useState<string | null>(null);
  const imageInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const updateZone = (index: number, patch: Partial<ZoneRow>) => {
    setForm((current) => ({
      ...current,
      deliveryZones: current.deliveryZones.map((zone, position) =>
        position === index ? { ...zone, ...patch } : zone,
      ),
    }));
  };

  const updateSlide = (id: string, patch: Partial<HeroSlideRow>) => {
    setForm((current) => ({
      ...current,
      heroSlides: current.heroSlides.map((slide) =>
        slide.id === id ? { ...slide, ...patch } : slide,
      ),
    }));
  };

  const moveSlide = (index: number, direction: -1 | 1) => {
    setForm((current) => {
      const target = index + direction;

      if (target < 0 || target >= current.heroSlides.length) {
        return current;
      }

      const heroSlides = [...current.heroSlides];
      const [slide] = heroSlides.splice(index, 1);

      if (!slide) {
        return current;
      }

      heroSlides.splice(target, 0, slide);

      return { ...current, heroSlides };
    });
  };

  const handleSlideImageUpload = async (
    slide: HeroSlideRow,
    file: File | undefined,
  ) => {
    if (!file) {
      return;
    }

    setUploadingSlideId(slide.id);

    try {
      const asset = await uploadProductImage(file);
      updateSlide(slide.id, {
        image: asset.url,
        imageAlt: slide.imageAlt || slide.title,
      });
      toast.success('Offer image uploaded');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setUploadingSlideId(null);

      const input = imageInputs.current[slide.id];
      if (input) {
        input.value = '';
      }
    }
  };

  const handleSendTestEmail = () => {
    const recipient = form.adminAlertEmails
      .split(',')
      .map((email) => email.trim())
      .find(Boolean);

    if (!recipient) {
      toast.error('Add an alert email first');
      return;
    }

    sendTestEmail.mutate(recipient, {
      onSuccess: (result) => {
        toast.success(`Test email sent to ${result.sentTo}`);
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
    });
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setFormError('');

    const parsed = settingsUpdateSchema.safeParse({
      storeName: form.storeName,
      supportPhone: form.supportPhone,
      supportEmail: form.supportEmail,
      bkashMerchantNumber: form.bkashMerchantNumber,
      freeDeliveryThreshold: form.freeDeliveryThreshold === '' ? 0 : form.freeDeliveryThreshold,
      defaultDeliveryCharge:
        form.defaultDeliveryCharge === '' ? 0 : form.defaultDeliveryCharge,
      deliveryZones: form.deliveryZones.map((zone) => ({
        name: zone.name,
        charge: zone.charge === '' ? 0 : zone.charge,
        isActive: zone.isActive,
      })),
      adminAlertEmails: form.adminAlertEmails
        .split(',')
        .map((email) => email.trim())
        .filter(Boolean),
      adminAlertWhatsapp: form.adminAlertWhatsapp
        .split(',')
        .map((phone) => phone.trim())
        .filter(Boolean),
      socialLinks: {
        facebook: form.facebook,
        instagram: form.instagram,
        whatsapp: form.whatsapp,
      },
      heroCarousel: {
        autoplaySeconds:
          form.heroAutoplaySeconds === '' ? 6 : form.heroAutoplaySeconds,
        pauseOnHover: form.heroPauseOnHover,
        slides: form.heroSlides.map((slide) => ({
          id: slide.id,
          eyebrow: slide.eyebrow,
          title: slide.title,
          description: slide.description,
          ctaLabel: slide.ctaLabel,
          ctaHref: slide.ctaHref,
          badge: slide.badge,
          image: slide.image,
          imageAlt: slide.imageAlt,
          theme: slide.theme,
          isActive: slide.isActive,
        })),
      },
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};

      for (const issue of parsed.error.issues) {
        nextErrors[issue.path.map(String).join('.')] = issue.message;
      }

      setErrors(nextErrors);
      setFormError('Please fix the highlighted settings before saving.');
      return;
    }

    updateSettings.mutate(parsed.data, {
      onSuccess: () => toast.success('Store settings saved'),
      onError: (mutationError) => {
        const message = getApiErrorMessage(mutationError);
        setFormError(message);
        toast.error(message);
      },
    });
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <PageHeader
        title="Settings"
        description="Homepage offers, store details, delivery charges and alert recipients."
      >
        <Button type="submit" size="sm" disabled={updateSettings.isPending}>
          {updateSettings.isPending ? <Loader2 className="animate-spin" /> : <Save />}
          Save settings
        </Button>
      </PageHeader>

      {formError && <ErrorBlock message={formError} />}

      <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Homepage offer carousel</h2>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
              Edit slide text, button labels and links, images, colors, order and
              visibility. Set autoplay to 0 to stop automatic slide changes.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setForm((current) => ({
                ...current,
                heroSlides: [...current.heroSlides, createHeroSlide()],
              }))
            }
            disabled={form.heroSlides.length >= 8}
          >
            <Plus />
            Add slide
          </Button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field
            label="Autoplay interval (seconds)"
            htmlFor="heroAutoplaySeconds"
            hint="Set 0 to turn autoplay off"
            error={errors['heroCarousel.autoplaySeconds']}
          >
            <Input
              id="heroAutoplaySeconds"
              type="number"
              min="0"
              max="30"
              value={form.heroAutoplaySeconds}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  heroAutoplaySeconds: event.target.value,
                }))
              }
            />
          </Field>
          <label className="flex h-11 items-center gap-2 self-end rounded-xl border bg-background px-3 text-sm">
            <input
              type="checkbox"
              checked={form.heroPauseOnHover}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  heroPauseOnHover: event.target.checked,
                }))
              }
              className="h-4 w-4 accent-[var(--primary)]"
            />
            Pause autoplay on hover
          </label>
        </div>

        <div className="mt-5 space-y-4">
          {form.heroSlides.length === 0 && (
            <div className="grid place-items-center rounded-xl border border-dashed bg-background px-4 py-10 text-center">
              <ImagePlus className="h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">No offer slides yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add a slide to show a banner on the homepage.
              </p>
            </div>
          )}

          {form.heroSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={cn(
                'rounded-xl border bg-background p-4',
                !slide.isActive && 'opacity-70',
              )}
            >
              <div className="flex flex-wrap items-start gap-3">
                <div className="h-24 w-32 shrink-0 overflow-hidden rounded-xl border bg-muted">
                  {slide.image ? (
                    <img
                      src={slide.image}
                      alt={slide.imageAlt || slide.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-center text-[11px] text-muted-foreground">
                      <div>
                        <ImagePlus className="mx-auto h-5 w-5" />
                        <span className="mt-1 block">Product photo fallback</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">Slide {index + 1}</p>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-medium',
                        slide.isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {slide.isActive ? 'Visible' : 'Hidden'}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <input
                      ref={(element) => {
                        imageInputs.current[slide.id] = element;
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) =>
                        void handleSlideImageUpload(
                          slide,
                          event.target.files?.[0],
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => imageInputs.current[slide.id]?.click()}
                      disabled={uploadingSlideId === slide.id}
                    >
                      {uploadingSlideId === slide.id ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Upload />
                      )}
                      Upload image
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => moveSlide(index, -1)}
                      disabled={index === 0}
                      aria-label={`Move slide ${index + 1} up`}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => moveSlide(index, 1)}
                      disabled={index === form.heroSlides.length - 1}
                      aria-label={`Move slide ${index + 1} down`}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          heroSlides: current.heroSlides.filter(
                            (item) => item.id !== slide.id,
                          ),
                        }))
                      }
                      aria-label={`Remove slide ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <label className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={slide.isActive}
                    onChange={(event) =>
                      updateSlide(slide.id, { isActive: event.target.checked })
                    }
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  Visible
                </label>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field
                  label="Title"
                  htmlFor={`hero-title-${index}`}
                  error={errors[`heroCarousel.slides.${index}.title`]}
                  className="sm:col-span-2"
                >
                  <Input
                    id={`hero-title-${index}`}
                    value={slide.title}
                    onChange={(event) =>
                      updateSlide(slide.id, { title: event.target.value })
                    }
                  />
                </Field>
                <Field
                  label="Eyebrow"
                  htmlFor={`hero-eyebrow-${index}`}
                  error={errors[`heroCarousel.slides.${index}.eyebrow`]}
                >
                  <Input
                    id={`hero-eyebrow-${index}`}
                    value={slide.eyebrow}
                    onChange={(event) =>
                      updateSlide(slide.id, { eyebrow: event.target.value })
                    }
                    placeholder="Freshly packed"
                  />
                </Field>
                <Field
                  label="Badge"
                  htmlFor={`hero-badge-${index}`}
                  error={errors[`heroCarousel.slides.${index}.badge`]}
                >
                  <Input
                    id={`hero-badge-${index}`}
                    value={slide.badge}
                    onChange={(event) =>
                      updateSlide(slide.id, { badge: event.target.value })
                    }
                    placeholder="Up to 15% off"
                  />
                </Field>
                <Field
                  label="Description"
                  htmlFor={`hero-description-${index}`}
                  error={errors[`heroCarousel.slides.${index}.description`]}
                  className="sm:col-span-2"
                >
                  <Textarea
                    id={`hero-description-${index}`}
                    value={slide.description}
                    onChange={(event) =>
                      updateSlide(slide.id, { description: event.target.value })
                    }
                    rows={3}
                  />
                </Field>
                <Field
                  label="Button text"
                  htmlFor={`hero-cta-label-${index}`}
                  error={errors[`heroCarousel.slides.${index}.ctaLabel`]}
                >
                  <Input
                    id={`hero-cta-label-${index}`}
                    value={slide.ctaLabel}
                    onChange={(event) =>
                      updateSlide(slide.id, { ctaLabel: event.target.value })
                    }
                  />
                </Field>
                <Field
                  label="Button link"
                  htmlFor={`hero-cta-href-${index}`}
                  error={errors[`heroCarousel.slides.${index}.ctaHref`]}
                >
                  <Input
                    id={`hero-cta-href-${index}`}
                    value={slide.ctaHref}
                    onChange={(event) =>
                      updateSlide(slide.id, { ctaHref: event.target.value })
                    }
                    placeholder="/shop?category=nuts-seeds"
                  />
                </Field>
                <Field
                  label="Color theme"
                  htmlFor={`hero-theme-${index}`}
                  error={errors[`heroCarousel.slides.${index}.theme`]}
                >
                  <Select
                    id={`hero-theme-${index}`}
                    value={slide.theme}
                    onChange={(event) =>
                      updateSlide(slide.id, {
                        theme: event.target.value as HeroSlideTheme,
                      })
                    }
                  >
                    {HERO_SLIDE_THEMES.map((theme) => (
                      <option key={theme.value} value={theme.value}>
                        {theme.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label="Image alt text"
                  htmlFor={`hero-image-alt-${index}`}
                  error={errors[`heroCarousel.slides.${index}.imageAlt`]}
                >
                  <Input
                    id={`hero-image-alt-${index}`}
                    value={slide.imageAlt}
                    onChange={(event) =>
                      updateSlide(slide.id, { imageAlt: event.target.value })
                    }
                    placeholder="Premium nuts gift box"
                  />
                </Field>
                <Field
                  label="Image URL"
                  htmlFor={`hero-image-${index}`}
                  hint="Upload an image or paste a URL. Leave blank to use a product photo."
                  error={errors[`heroCarousel.slides.${index}.image`]}
                  className="sm:col-span-2"
                >
                  <Input
                    id={`hero-image-${index}`}
                    value={slide.image}
                    onChange={(event) =>
                      updateSlide(slide.id, { image: event.target.value })
                    }
                    placeholder="https://res.cloudinary.com/..."
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="text-sm font-semibold">Store details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Store name" htmlFor="storeName" error={errors.storeName} className="sm:col-span-2">
              <Input
                id="storeName"
                value={form.storeName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, storeName: event.target.value }))
                }
              />
            </Field>
            <Field label="Support phone" htmlFor="supportPhone" error={errors.supportPhone}>
              <Input
                id="supportPhone"
                value={form.supportPhone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, supportPhone: event.target.value }))
                }
                placeholder="+8801799573916"
              />
            </Field>
            <Field label="Support email" htmlFor="supportEmail" error={errors.supportEmail}>
              <Input
                id="supportEmail"
                type="email"
                value={form.supportEmail}
                onChange={(event) =>
                  setForm((current) => ({ ...current, supportEmail: event.target.value }))
                }
                placeholder="hello@yaqeen.com"
              />
            </Field>
            <Field
              label="bKash merchant number"
              htmlFor="bkashMerchantNumber"
              error={errors.bkashMerchantNumber}
              className="sm:col-span-2"
            >
              <Input
                id="bkashMerchantNumber"
                value={form.bkashMerchantNumber}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    bkashMerchantNumber: event.target.value,
                  }))
                }
                placeholder="01XXXXXXXXX"
              />
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5">
          <h2 className="text-sm font-semibold">Delivery</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="Free delivery threshold (৳)"
              htmlFor="freeDeliveryThreshold"
              hint="Set 0 to disable free delivery"
              error={errors.freeDeliveryThreshold}
            >
              <Input
                id="freeDeliveryThreshold"
                type="number"
                min="0"
                value={form.freeDeliveryThreshold}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    freeDeliveryThreshold: event.target.value,
                  }))
                }
              />
            </Field>
            <Field
              label="Default delivery charge (৳)"
              htmlFor="defaultDeliveryCharge"
              error={errors.defaultDeliveryCharge}
            >
              <Input
                id="defaultDeliveryCharge"
                type="number"
                min="0"
                value={form.defaultDeliveryCharge}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    defaultDeliveryCharge: event.target.value,
                  }))
                }
              />
            </Field>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Delivery zones</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    deliveryZones: [
                      ...current.deliveryZones,
                      { name: '', charge: '0', isActive: true },
                    ],
                  }))
                }
              >
                <Plus />
                Add zone
              </Button>
            </div>

            <div className="mt-3 space-y-3">
              {form.deliveryZones.map((zone, index) => (
                <div key={index} className="rounded-xl border bg-background p-3">
                  <div className="grid gap-2 sm:grid-cols-[1fr_110px_auto_auto] sm:items-end">
                    <Field label="Zone name" htmlFor={`zone-name-${index}`} error={errors[`deliveryZones.${index}.name`]}>
                      <Input
                        id={`zone-name-${index}`}
                        value={zone.name}
                        onChange={(event) =>
                          updateZone(index, { name: event.target.value })
                        }
                        placeholder="Inside Dhaka"
                        className="h-10"
                      />
                    </Field>
                    <Field label="Charge (৳)" htmlFor={`zone-charge-${index}`} error={errors[`deliveryZones.${index}.charge`]}>
                      <Input
                        id={`zone-charge-${index}`}
                        type="number"
                        min="0"
                        value={zone.charge}
                        onChange={(event) =>
                          updateZone(index, { charge: event.target.value })
                        }
                        className="h-10"
                      />
                    </Field>
                    <label className="flex h-10 items-center gap-2 rounded-lg border bg-card px-2 text-xs">
                      <input
                        type="checkbox"
                        checked={zone.isActive}
                        onChange={(event) =>
                          updateZone(index, { isActive: event.target.checked })
                        }
                        className="h-4 w-4 accent-[var(--primary)]"
                      />
                      Active
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-destructive"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          deliveryZones: current.deliveryZones.filter(
                            (_, position) => position !== index,
                          ),
                        }))
                      }
                      aria-label={`Remove zone ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {form.deliveryZones.length === 0 && (
                <p className="rounded-xl border border-dashed bg-background px-3 py-6 text-center text-xs text-muted-foreground">
                  No zones yet. The default delivery charge will be used.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5">
          <h2 className="text-sm font-semibold">Alerts</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Comma-separated recipients for new order alerts.
          </p>
          <div className="mt-4 space-y-4">
            <Field label="Alert emails" htmlFor="adminAlertEmails" error={errors['adminAlertEmails.0']}>
              <Input
                id="adminAlertEmails"
                value={form.adminAlertEmails}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    adminAlertEmails: event.target.value,
                  }))
                }
                placeholder="owner@yaqeen.com, ops@yaqeen.com"
              />
            </Field>
            <Field
              label="Alert WhatsApp numbers"
              htmlFor="adminAlertWhatsapp"
              error={errors['adminAlertWhatsapp.0']}
            >
              <Input
                id="adminAlertWhatsapp"
                value={form.adminAlertWhatsapp}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    adminAlertWhatsapp: event.target.value,
                  }))
                }
                placeholder="+8801799573916"
              />
            </Field>
          </div>

          <div
            className={cn(
              'mt-4 rounded-xl border p-3 text-xs',
              settings.emailConfigured
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-amber-200 bg-amber-50 text-amber-900',
            )}
          >
            <p className="font-semibold">
              Email delivery: {settings.emailProvider}
              {' - '}
              {settings.emailConfigured ? 'configured' : 'not configured'}
            </p>
            <p className="mt-1">
              {settings.emailConfigured
                ? 'New orders are emailed to the alert recipients above.'
                : 'Set EMAIL_PROVIDER and its credentials in the server environment, then add at least one alert email.'}
            </p>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSendTestEmail}
              disabled={sendTestEmail.isPending}
            >
              {sendTestEmail.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Send />
              )}
              Send test email
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5">
          <h2 className="text-sm font-semibold">Social links</h2>
          <div className="mt-4 space-y-4">
            <Field label="Facebook" htmlFor="facebook" error={errors['socialLinks.facebook']}>
              <Input
                id="facebook"
                value={form.facebook}
                onChange={(event) =>
                  setForm((current) => ({ ...current, facebook: event.target.value }))
                }
                placeholder="https://facebook.com/yaqeen"
              />
            </Field>
            <Field label="Instagram" htmlFor="instagram" error={errors['socialLinks.instagram']}>
              <Input
                id="instagram"
                value={form.instagram}
                onChange={(event) =>
                  setForm((current) => ({ ...current, instagram: event.target.value }))
                }
                placeholder="https://instagram.com/yaqeen"
              />
            </Field>
            <Field label="WhatsApp" htmlFor="whatsapp" error={errors['socialLinks.whatsapp']}>
              <Input
                id="whatsapp"
                value={form.whatsapp}
                onChange={(event) =>
                  setForm((current) => ({ ...current, whatsapp: event.target.value }))
                }
                placeholder="https://wa.me/8801799573916"
              />
            </Field>
          </div>
        </section>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={updateSettings.isPending}>
          {updateSettings.isPending ? <Loader2 className="animate-spin" /> : <Save />}
          Save settings
        </Button>
      </div>
    </form>
  );
}
