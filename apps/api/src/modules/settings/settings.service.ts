import {
  DEFAULT_HERO_CAROUSEL,
  type HeroCarouselSettings,
  type SettingsUpdateInput,
} from '@yaqeen/shared';
import { env } from '../../config/env.js';
import { SettingsModel } from '../../models/settings.js';
import { getEmailStatus, type EmailProvider } from '../../services/email.js';

export interface PublicSettings {
  storeName: string;
  supportPhone: string;
  supportEmail: string;
  bkashMerchantNumber: string;
  freeDeliveryThreshold: number;
  defaultDeliveryCharge: number;
  deliveryZones: Array<{ name: string; charge: number }>;
  heroCarousel: HeroCarouselSettings;
}

function mapHeroCarousel(
  saved: HeroCarouselSettings | undefined,
  includeInactive: boolean,
): HeroCarouselSettings {
  const carousel = saved ?? DEFAULT_HERO_CAROUSEL;

  return {
    autoplaySeconds: carousel.autoplaySeconds ?? 6,
    pauseOnHover: carousel.pauseOnHover ?? true,
    slides: (carousel.slides ?? [])
      .filter((slide) => includeInactive || slide.isActive)
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
      })),
  };
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

export async function getPublicSettings(): Promise<PublicSettings> {
  const settings = await findSettings();

  return {
    storeName: settings?.storeName ?? 'Yaqeen',
    supportPhone: settings?.supportPhone ?? '',
    supportEmail: settings?.supportEmail ?? '',
    bkashMerchantNumber: settings?.bkashMerchantNumber ?? env.BKASH_MERCHANT_NUMBER ?? '',
    freeDeliveryThreshold: settings?.freeDeliveryThreshold ?? env.FREE_DELIVERY_THRESHOLD,
    defaultDeliveryCharge: settings?.defaultDeliveryCharge ?? env.DEFAULT_DELIVERY_CHARGE,
    deliveryZones: (settings?.deliveryZones ?? [])
      .filter((zone) => zone.isActive)
      .map((zone) => ({ name: zone.name, charge: zone.charge })),
    heroCarousel: mapHeroCarousel(
      settings?.heroCarousel as HeroCarouselSettings | undefined,
      false,
    ),
  };
}

export async function getDeliveryCharge(district: string, subtotal: number): Promise<number> {
  const settings = await findSettings();
  const freeDeliveryThreshold =
    settings?.freeDeliveryThreshold ?? env.FREE_DELIVERY_THRESHOLD;

  if (freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold) {
    return 0;
  }

  const isDhaka = district.trim().toLowerCase() === 'dhaka';
  const zones = (settings?.deliveryZones ?? []).filter((zone) => zone.isActive);
  const zone = zones.find((item) => (isDhaka ? /inside/i.test(item.name) : /outside/i.test(item.name)));

  return zone?.charge ?? settings?.defaultDeliveryCharge ?? env.DEFAULT_DELIVERY_CHARGE;
}


export interface AdminSettings extends PublicSettings {
  deliveryZones: Array<{ name: string; charge: number; isActive: boolean }>;
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
    storeName: settings?.storeName ?? 'Yaqeen',
    supportPhone: settings?.supportPhone ?? '',
    supportEmail: settings?.supportEmail ?? '',
    bkashMerchantNumber: settings?.bkashMerchantNumber ?? env.BKASH_MERCHANT_NUMBER ?? '',
    freeDeliveryThreshold: settings?.freeDeliveryThreshold ?? env.FREE_DELIVERY_THRESHOLD,
    defaultDeliveryCharge: settings?.defaultDeliveryCharge ?? env.DEFAULT_DELIVERY_CHARGE,
    deliveryZones: (settings?.deliveryZones ?? []).map((zone) => ({
      name: zone.name,
      charge: zone.charge,
      isActive: zone.isActive,
    })),
    adminAlertEmails: settings?.adminAlertEmails ?? [],
    adminAlertWhatsapp: settings?.adminAlertWhatsapp ?? [],
    emailProvider: emailStatus.provider,
    emailConfigured: emailStatus.configured,
    socialLinks: {
      facebook: settings?.socialLinks?.facebook ?? '',
      instagram: settings?.socialLinks?.instagram ?? '',
      whatsapp: settings?.socialLinks?.whatsapp ?? '',
    },
    heroCarousel: mapHeroCarousel(
      settings?.heroCarousel as HeroCarouselSettings | undefined,
      true,
    ),
  };
}

export async function updateAdminSettings(
  input: SettingsUpdateInput,
): Promise<AdminSettings> {
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

