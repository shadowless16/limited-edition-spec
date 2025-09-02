import mongoose, { type Document, Schema } from "mongoose"

interface IVariant {
  color: string
  material: string
  stock: number
  reservedStock: number
}

interface IReleasePhases {
  waitlist: {
    startDate: Date
    endDate: Date
    isActive: boolean
  }
  originals: {
    startDate: Date
    endDate: Date
    isActive: boolean
    maxQuantity: number
  }
  echo: {
    startDate: Date
    endDate: Date
    isActive: boolean
    windowDays: number
  }
}

export interface IProduct extends Document {
  sku: string
  name: string
  description: string
  basePrice: number
  images: string[]
  variants: IVariant[]
  // Payment options allowed for this product (e.g. bank_transfer, crypto)
  paymentOptions?: string[]
  releasePhases: IReleasePhases
  status: "draft" | "waitlist" | "originals" | "echo" | "ended"
  createdAt: Date
  updatedAt: Date
}

const VariantSchema = new Schema<IVariant>({
  color: { type: String, required: true },
  material: { type: String, required: true },
  stock: { type: Number, required: true, min: 0 },
  reservedStock: { type: Number, default: 0, min: 0 },
})

const ReleasePhaseSchema = new Schema({
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: false },
})

const ProductSchema = new Schema<IProduct>(
  {
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    variants: [VariantSchema],
  paymentOptions: [String],
    releasePhases: {
      waitlist: {
        ...ReleasePhaseSchema.obj,
      },
      originals: {
        ...ReleasePhaseSchema.obj,
        maxQuantity: { type: Number, required: true, min: 1 },
      },
      echo: {
        ...ReleasePhaseSchema.obj,
        windowDays: { type: Number, default: 30, min: 1 },
      },
    },
    status: {
      type: String,
      enum: ["draft", "waitlist", "originals", "echo", "ended"],
      default: "draft",
    },
  },
  {
    timestamps: true,
  },
)

// Indexes
// `sku` has `unique: true` in the schema which creates an index — avoid declaring it twice.
ProductSchema.index({ status: 1, "releasePhases.originals.startDate": 1 })

const ProductModel = mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema)

export const Product = ProductModel
export default ProductModel
