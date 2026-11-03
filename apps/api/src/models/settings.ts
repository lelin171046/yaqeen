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
      default: 'Yaqeen',
    },
    supportPhone: {
      type: String,
      trim: true,
      maxlength: 20,
      default: '',
    },
    supportEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 160,
      default: '',
    },
    bkashMerchantNumber: {
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
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type Settings = InferSchemaType<typeof settingsSchema>;
export type SettingsDocument = HydratedDocument<Settings>;

export const SettingsModel = model<Settings>('Settings', settingsSchema);
