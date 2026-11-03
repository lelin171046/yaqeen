import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const orderLinkSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 40,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    campaign: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    destination: {
      type: String,
      enum: ['ORDER', 'PRODUCT'],
      default: 'ORDER',
    },
    clicks: {
      type: Number,
      default: 0,
      min: 0,
    },
    orders: {
      type: Number,
      default: 0,
      min: 0,
    },
    revenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

orderLinkSchema.index({ product: 1, isActive: 1 });

export type OrderLink = InferSchemaType<typeof orderLinkSchema>;
export type OrderLinkDocument = HydratedDocument<OrderLink>;

export const OrderLinkModel = model<OrderLink>('OrderLink', orderLinkSchema);
