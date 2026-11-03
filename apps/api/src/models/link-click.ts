import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const linkClickSchema = new Schema(
  {
    link: {
      type: Schema.Types.ObjectId,
      ref: 'OrderLink',
      required: true,
      index: true,
    },
    ipHash: { type: String, trim: true, maxlength: 128, default: '' },
    userAgent: { type: String, trim: true, maxlength: 500, default: '' },
    referrer: { type: String, trim: true, maxlength: 1000, default: '' },
    utm: { type: Map, of: String, default: undefined },
    createdAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  },
);

linkClickSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });
linkClickSchema.index({ link: 1, createdAt: -1 });

export type LinkClick = InferSchemaType<typeof linkClickSchema>;
export type LinkClickDocument = HydratedDocument<LinkClick>;

export const LinkClickModel = model<LinkClick>('LinkClick', linkClickSchema);
