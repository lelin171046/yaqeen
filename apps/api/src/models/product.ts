import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const imageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, trim: true, default: '' },
    alt: { type: String, trim: true, maxlength: 160, default: '' },
  },
  { _id: false },
);

const variantSchema = new Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 60 },
    grams: { type: Number, min: 0 },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String, required: true, trim: true, uppercase: true, maxlength: 60 },
  },
  { _id: true },
);

const nutritionSchema = new Schema(
  {
    calories: { type: Number, min: 0 },
    protein: { type: Number, min: 0 },
    carbs: { type: Number, min: 0 },
    fat: { type: Number, min: 0 },
    fiber: { type: Number, min: 0 },
    sugar: { type: Number, min: 0 },
  },
  { _id: false },
);

const seoSchema = new Schema(
  {
    title: { type: String, trim: true, maxlength: 70, default: '' },
    description: { type: String, trim: true, maxlength: 160, default: '' },
  },
  { _id: false },
);

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 180,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    images: {
      type: [imageSchema],
      default: [],
    },
    video: {
      type: String,
      trim: true,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
    ingredients: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    nutrition: {
      type: nutritionSchema,
      default: undefined,
    },
    variants: {
      type: [variantSchema],
      default: [],
    },
    basePrice: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    totalStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    badge: {
      type: String,
      trim: true,
      maxlength: 40,
      default: '',
    },
    seo: {
      type: seoSchema,
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ name: 'text', shortDescription: 'text', tags: 'text' });

export type Product = InferSchemaType<typeof productSchema>;
export type ProductDocument = HydratedDocument<Product>;
export type ProductVariant = Product['variants'][number];

export const ProductModel = model<Product>('Product', productSchema);
