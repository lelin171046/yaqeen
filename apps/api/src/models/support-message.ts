import { SUPPORT_MESSAGE_STATUSES, SUPPORT_TOPICS } from '@anando-deal/shared';
import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const supportReplySchema = new Schema(
  {
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    sentBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    sentAt: { type: Date, default: Date.now },
    provider: { type: String, trim: true, maxlength: 60, default: '' },
    messageId: { type: String, trim: true, maxlength: 200, default: '' },
  },
  { versionKey: false },
);

const supportMessageSchema = new Schema(
  {
    ticket: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
    phone: { type: String, trim: true, maxlength: 20, default: '' },
    topic: { type: String, enum: [...SUPPORT_TOPICS], required: true, default: 'OTHER' },
    orderNumber: { type: String, trim: true, maxlength: 40, default: '' },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: [...SUPPORT_MESSAGE_STATUSES],
      required: true,
      default: 'NEW',
      index: true,
    },
    deliveryStatus: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED', 'SKIPPED'],
      required: true,
      default: 'PENDING',
    },
    deliveryProvider: { type: String, trim: true, maxlength: 60, default: '' },
    deliveryError: { type: String, trim: true, maxlength: 1000, default: '' },
    deliveredAt: { type: Date },
    acknowledgementStatus: {
      type: String,
      enum: ['NOT_SENT', 'SENT', 'FAILED'],
      required: true,
      default: 'NOT_SENT',
    },
    acknowledgementError: { type: String, trim: true, maxlength: 1000, default: '' },
    replies: { type: [supportReplySchema], default: [] },
    lastReplyAt: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

supportMessageSchema.index({ status: 1, createdAt: -1 });

export type SupportMessage = InferSchemaType<typeof supportMessageSchema>;
export type SupportMessageDocument = HydratedDocument<SupportMessage>;

export const SupportMessageModel = model<SupportMessage>('SupportMessage', supportMessageSchema);
