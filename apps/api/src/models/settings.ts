import {
  DELIVERY_BENEFIT_ICON_VALUES,
  HERO_SLIDE_THEME_VALUES,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
} from '@anando-deal/shared';
import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const deliveryZoneSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    charge: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: true },
);

const socialLinksSchema = new Schema(
  {
    facebook: { type: String, trim: true, default: '' },
    instagram: { type: String, trim: true, default: '' },
    whatsapp: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const deliveryBenefitSchema = new Schema(
  {
    id: { type: String, required: true, trim: true, maxlength: 80 },
    title: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 180, default: '' },
    icon: { type: String, enum: [...DELIVERY_BENEFIT_ICON_VALUES], default: 'truck' },
    isActive: { type: Boolean, default: true },
  },
  { _id: false },
);

const heroSlideSchema = new Schema(
  {
    id: { type: String, required: true, trim: true, maxlength: 80 },
    eyebrow: { type: String, trim: true, maxlength: 60, default: '' },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    ctaLabel: { type: String, required: true, trim: true, maxlength: 40 },
    ctaHref: { type: String, required: true, trim: true, maxlength: 300 },
    badge: { type: String, trim: true, maxlength: 40, default: '' },
    image: { type: String, trim: true, default: '' },
    imageAlt: { type: String, trim: true, maxlength: 180, default: '' },
    theme: {
      type: String,
      enum: HERO_SLIDE_THEME_VALUES,
      default: 'forest',
    },
    isActive: { type: Boolean, default: true },
    startsAt: { type: Date, default: undefined },
    endsAt: { type: Date, default: undefined },
  },
  { _id: false },
);

const heroCarouselSchema = new Schema(
  {
    autoplaySeconds: { type: Number, default: 6, min: 0, max: 30 },
    pauseOnHover: { type: Boolean, default: true },
    slides: { type: [heroSlideSchema], default: [] },
  },
  { _id: false },
);

const settingsSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'store',
    },
    storeName: {
      type: String,
      trim: true,
      maxlength: 120,
      default: 'Anando Deal',
    },
    supportPhone: {
      type: String,
      trim: true,
      maxlength: 20,
      default: SUPPORT_PHONE,
    },
    supportEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 160,
      default: SUPPORT_EMAIL,
    },
    bkashMerchantNumber: {
      type: String,
      trim: true,
      maxlength: 20,
      default: '',
    },
    nagadMerchantNumber: {
      type: String,
      trim: true,
      maxlength: 20,
      default: '',
    },
    rocketMerchantNumber: {
      type: String,
      trim: true,
      maxlength: 20,
      default: '',
    },
    freeDeliveryThreshold: {
      type: Number,
      default: 2000,
      min: 0,
    },
    defaultDeliveryCharge: {
      type: Number,
      default: 80,
      min: 0,
    },
    deliveryZones: {
      type: [deliveryZoneSchema],
      default: [],
    },
    adminAlertEmails: {
      type: [String],
      default: [],
    },
    adminAlertWhatsapp: {
      type: [String],
      default: [],
    },
    socialLinks: {
      type: socialLinksSchema,
      default: undefined,
    },
    heroCarousel: {
      type: heroCarouselSchema,
      default: undefined,
    },
    flashDealsEnabled: {
      type: Boolean,
      default: true,
    },
    featuredCategoryIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
      default: [],
    },
    deliveryBenefits: {
      type: [deliveryBenefitSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type Settings = InferSchemaType<typeof settingsSchema>;
export type SettingsDocument = HydratedDocument<Settings>;

export const SettingsModel = model<Settings>('Settings', settingsSchema);
