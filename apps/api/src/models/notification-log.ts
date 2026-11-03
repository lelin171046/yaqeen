import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const notificationLogSchema = new Schema(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['WHATSAPP', 'EMAIL'],
      required: true,
    },
    provider: {
      type: String,
      trim: true,
      maxlength: 60,
      default: '',
    },
    recipient: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
    payload: {
      type: Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastError: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    sentAt: {
      type: Date,
    },
    nextAttemptAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

notificationLogSchema.index({ status: 1, nextAttemptAt: 1 });

export type NotificationLog = InferSchemaType<typeof notificationLogSchema>;
export type NotificationLogDocument = HydratedDocument<NotificationLog>;

export const NotificationLogModel = model<NotificationLog>(
  'NotificationLog',
  notificationLogSchema,
);
