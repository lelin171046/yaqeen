import {
  ORDER_PAYMENT_STATUSES,
  ORDER_SOURCES,
  ORDER_STATUSES,
  PAYMENT_METHODS,
} from '@yaqeen/shared';
import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const customerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    altPhone: { type: String, trim: true, maxlength: 20, default: '' },
    email: { type: String, trim: true, lowercase: true, maxlength: 160, default: '' },
    address: { type: String, required: true, trim: true, maxlength: 500 },
    district: { type: String, required: true, trim: true, maxlength: 80 },
    area: { type: String, trim: true, maxlength: 120, default: '' },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { _id: false },
);

const orderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true, trim: true },
    variantSku: { type: String, required: true, trim: true, uppercase: true },
    variantLabel: { type: String, required: true, trim: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
    image: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const statusHistorySchema = new Schema(
  {
    status: { type: String, enum: [...ORDER_STATUSES], required: true },
    note: { type: String, trim: true, maxlength: 500, default: '' },
    changedBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const sourceSchema = new Schema(
  {
    type: { type: String, enum: [...ORDER_SOURCES], default: 'DIRECT' },
    linkCode: { type: String, trim: true, maxlength: 40, default: '' },
    utm: { type: Map, of: String, default: undefined },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
    },
    customer: {
      type: customerSchema,
      required: true,
    },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryCharge: { type: Number, required: true, min: 0, default: 0 },
    discount: { type: Number, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: [...PAYMENT_METHODS],
      required: true,
      default: 'COD',
    },
    paymentStatus: {
      type: String,
      enum: [...ORDER_PAYMENT_STATUSES],
      default: 'UNPAID',
    },
    bkashTrxId: { type: String, trim: true, maxlength: 60, default: '' },
    status: {
      type: String,
      enum: [...ORDER_STATUSES],
      default: 'PENDING',
      index: true,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    source: {
      type: sourceSchema,
      default: undefined,
    },
    adminNotes: { type: String, trim: true, maxlength: 1000, default: '' },
    idempotencyKey: { type: String, trim: true, maxlength: 120, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'customer.phone': 1 });
orderSchema.index({ 'source.linkCode': 1 });
orderSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

export type Order = InferSchemaType<typeof orderSchema>;
export type OrderDocument = HydratedDocument<Order>;

export const OrderModel = model<Order>('Order', orderSchema);
