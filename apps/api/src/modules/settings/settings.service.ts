import {
  DEFAULT_DELIVERY_BENEFITS,
  DEFAULT_HERO_CAROUSEL,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  type DeliveryBenefitSettings,
  type HeroCarouselSettings,
  type SettingsUpdateInput,
} from '@anando-deal/shared';
import { env } from '../../config/env.js';
import { CategoryModel } from '../../models/category.js';
import { SettingsModel } from '../../models/settings.js';
import { getEmailStatus, type EmailProvider } from '../../services/email.js';

export interface PublicSettings {
  storeName: string;
  supportPhone: string;
  supportEmail: string;
  bkashMerchantNumber: string;
  nagadMerchantNumber: string;
  rocketMerchantNumber: string;
  freeDeliveryThreshold: number;
  defaultDeliveryCharge: number;
  deliveryZones: Array<{ name: string; charge: number }>;
  deliveryBenefits: DeliveryBenefitSettings[];
  heroCarousel: HeroCarouselSettings;
  flashDealsEnabled: boolean;
  featuredCategories: Array<{ id: string; name: string; slug: string; image: string }>;
}

function mapHeroCarousel(
  saved: HeroCarouselSettings | undefined,
  includeInactive: boolean,
): HeroCarouselSettings {
  const carousel = saved ?? DEFAULT_HERO_CAROUSEL;
  const now = new Date();

  return {
    autoplaySeconds: carousel.autoplaySeconds ?? 6,
    pauseOnHover: carousel.pauseOnHover ?? true,
    slides: (carousel.slides ?? [])
      .filter((slide) => {
        if (!includeInactive && !slide.isActive) {
          return false;
        }

        if (includeInactive) {
          return true;
        }

        const startsAt = slide.startsAt ? new Date(slide.startsAt) : null;
        const endsAt = slide.endsAt ? new Date(slide.endsAt) : null;

        return (!startsAt || startsAt <= now) && (!endsAt || endsAt >= now);
      })
      .map((slide) => ({
        id: slide.id,
        eyebrow: slide.eyebrow ?? '',
        title: slide.title,
        description: slide.description ?? '',
        ctaLabel: slide.ctaLabel,
        ctaHref: slide.ctaHref,
        badge: slide.badge ?? '',
        image: slide.image ?? '',
        imageAlt: slide.imageAlt ?? '',
        theme: slide.theme ?? 'forest',
        isActive: slide.isActive ?? true,
        startsAt: slide.startsAt,
        endsAt: slide.endsAt,
      })),
  };
}

function mapDeliveryBenefits(
  saved: DeliveryBenefitSettings[] | undefined,
  includeInactive: boolean,
): DeliveryBenefitSettings[] {
  return (saved ?? DEFAULT_DELIVERY_BENEFITS)
    .filter((benefit) => includeInactive || benefit.isActive)
    .map((benefit) => ({
      id: benefit.id,
      title: benefit.title,
      description: benefit.description ?? '',
      icon: benefit.icon ?? 'truck',
      isActive: benefit.isActive ?? true,
    }));
}

async function getFeaturedCategories(ids: unknown) {
  const categoryIds = Array.isArray(ids) ? ids.map(String) : [];

  if (categoryIds.length === 0) {
    return [];
  }

  const categories = await CategoryModel.find({
    _id: { $in: categoryIds },
    isActive: true,
  })
    .select('name slug image')
    .lean();
  const byId = new Map(categories.map((category) => [String(category._id), category]));

  return categoryIds
    .map((id) => byId.get(id))
    .filter((category): category is NonNullable<typeof category> => Boolean(category))
    .map((category) => ({
      id: String(category._id),
      name: category.name,
      slug: category.slug,
      image: category.image ?? '',
    }));
}

async function findSettings() {
  return SettingsModel.findOne({ key: 'store' }).lean();
}

export async function getAlertEmailRecipients(): Promise<string[]> {
  const settings = await findSettings();
  const fromEnv = (env.SELLER_ALERT_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
  const recipients = [...(settings?.adminAlertEmails ?? []), ...fromEnv]
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return [...new Set(recipients)];
}

export async function getSupportEmailRecipients(): Promise<string[]> {
  const settings = await findSettings();
  const supportEmail = settings?.supportEmail?.trim().toLowerCase();

  if (supportEmail) {
    return [supportEmail];
  }

  const alertRecipients = await getAlertEmailRecipients();

  return alertRecipients.length > 0 ? alertRecipients : [SUPPORT_EMAIL];
}

export async function getPublicSettings(): Promise<PublicSettings> {
  const settings = await findSettings();

  return {
    storeName: settings?.storeName ?? 'Anando Deal',
    supportPhone: settings?.supportPhone || SUPPORT_PHONE,
    supportEmail: settings?.supportEmail || SUPPORT_EMAIL,
    bkashMerchantNumber: settings?.bkashMerchantNumber ?? env.BKASH_MERCHANT_NUMBER ?? '',
    nagadMerchantNumber: settings?.nagadMerchantNumber ?? env.NAGAD_MERCHANT_NUMBER ?? '',
    rocketMerchantNumber: settings?.rocketMerchantNumber ?? env.ROCKET_MERCHANT_NUMBER ?? '',
    freeDeliveryThreshold: settings?.freeDeliveryThreshold ?? env.FREE_DELIVERY_THRESHOLD,
    defaultDeliveryCharge: settings?.defaultDeliveryCharge ?? env.DEFAULT_DELIVERY_CHARGE,
    deliveryZones: (settings?.deliveryZones ?? [])
      .filter((zone) => zone.isActive)
      .map((zone) => ({ name: zone.name, charge: zone.charge })),
    deliveryBenefits: mapDeliveryBenefits(
      settings?.deliveryBenefits as DeliveryBenefitSettings[] | undefined,
      false,
    ),
    heroCarousel: mapHeroCarousel(
      settings?.heroCarousel as HeroCarouselSettings | undefined,
      false,
    ),
    flashDealsEnabled: settings?.flashDealsEnabled ?? true,
    featuredCategories: await getFeaturedCategories(settings?.featuredCategoryIds),
  };
}

export async function getDeliveryCharge(district: string, subtotal: number): Promise<number> {
  const settings = await findSettings();
  const freeDeliveryThreshold = settings?.freeDeliveryThreshold ?? env.FREE_DELIVERY_THRESHOLD;

  if (freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold) {
    return 0;
  }

  const isDhaka = district.trim().toLowerCase() === 'dhaka';
  const zones = (settings?.deliveryZones ?? []).filter((zone) => zone.isActive);
  const zone = zones.find((item) =>
    isDhaka ? /inside/i.test(item.name) : /outside/i.test(item.name),
  );

  return zone?.charge ?? settings?.defaultDeliveryCharge ?? env.DEFAULT_DELIVERY_CHARGE;
}

export interface AdminSettings extends PublicSettings {
  deliveryZones: Array<{ name: string; charge: number; isActive: boolean }>;
  featuredCategoryIds: string[];
  adminAlertEmails: string[];
  adminAlertWhatsapp: string[];
  socialLinks: {
    facebook: string;
    instagram: string;
    whatsapp: string;
  };
  emailProvider: EmailProvider;
  emailConfigured: boolean;
}

export async function getAdminSettings(): Promise<AdminSettings> {
  const settings = await findSettings();
  const emailStatus = getEmailStatus();

  return {
    storeName: settings?.storeName ?? 'Anando Deal',
    supportPhone: settings?.supportPhone || SUPPORT_PHONE,
    supportEmail: settings?.supportEmail || SUPPORT_EMAIL,
    bkashMerchantNumber: settings?.bkashMerchantNumber ?? env.BKASH_MERCHANT_NUMBER ?? '',
    nagadMerchantNumber: settings?.nagadMerchantNumber ?? env.NAGAD_MERCHANT_NUMBER ?? '',
    rocketMerchantNumber: settings?.rocketMerchantNumber ?? env.ROCKET_MERCHANT_NUMBER ?? '',
    freeDeliveryThreshold: settings?.freeDeliveryThreshold ?? env.FREE_DELIVERY_THRESHOLD,
    defaultDeliveryCharge: settings?.defaultDeliveryCharge ?? env.DEFAULT_DELIVERY_CHARGE,
    deliveryZones: (settings?.deliveryZones ?? []).map((zone) => ({
      name: zone.name,
      charge: zone.charge,
      isActive: zone.isActive,
    })),
    featuredCategoryIds: (settings?.featuredCategoryIds ?? []).map(String),
    deliveryBenefits: mapDeliveryBenefits(
      settings?.deliveryBenefits as DeliveryBenefitSettings[] | undefined,
      true,
    ),
    adminAlertEmails: settings?.adminAlertEmails ?? [],
    adminAlertWhatsapp: settings?.adminAlertWhatsapp ?? [],
    emailProvider: emailStatus.provider,
    emailConfigured: emailStatus.configured,
    socialLinks: {
      facebook: settings?.socialLinks?.facebook ?? '',
      instagram: settings?.socialLinks?.instagram ?? '',
      whatsapp: settings?.socialLinks?.whatsapp ?? '',
    },
    heroCarousel: mapHeroCarousel(settings?.heroCarousel as HeroCarouselSettings | undefined, true),
    flashDealsEnabled: settings?.flashDealsEnabled ?? true,
    featuredCategories: await getFeaturedCategories(settings?.featuredCategoryIds),
  };
}

export async function updateAdminSettings(input: SettingsUpdateInput): Promise<AdminSettings> {
  await SettingsModel.findOneAndUpdate(
    { key: 'store' },
    { $set: input },
    {
      upsert: true,
      returnDocument: 'after',
      setDefaultsOnInsert: true,
    },
  );

  return getAdminSettings();
}
