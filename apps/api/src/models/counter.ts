import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const counterSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    seq: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    versionKey: false,
  },
);

export type Counter = InferSchemaType<typeof counterSchema>;
export type CounterDocument = HydratedDocument<Counter>;

export const CounterModel = model<Counter>('Counter', counterSchema);

export async function nextSequence(key: string): Promise<number> {
  const counter = await CounterModel.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );

  return counter.seq;
}
