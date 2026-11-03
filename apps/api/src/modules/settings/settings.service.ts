import type { SettingsUpdateInput } from '@yaqeen/shared';
import { env } from '../../config/env.js';
import { SettingsModel } from '../../models/settings.js';

export interface PublicSettings {
  storeName: string;
  supportPhone: string;
  supportEmail: string;
  bkashMerchantNumber: string;
  freeDeliveryThreshold: number;
  defaultDeliveryCharge: number;
  deliveryZones: Array<{ name: string; charge: number }>;
}

async function findSettings() {
  return SettingsModel.findOne({ key: 'store' }).lean();
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
}

export async function getAdminSettings(): Promise<AdminSettings> {
  const settings = await findSettings();

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
    socialLinks: {
      facebook: settings?.socialLinks?.facebook ?? '',
      instagram: settings?.socialLinks?.instagram ?? '',
      whatsapp: settings?.socialLinks?.whatsapp ?? '',
    },
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
