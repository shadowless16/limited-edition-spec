import mongoose, { type Document, Schema } from "mongoose"

interface IVariant {
  color: string
  material: string
  stock: number
  reservedStock: number
  images?: string[]
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
    maxQuantity: number // Always 100 for originals
  }
  echo: {
    startDate: Date
    endDate: Date
    isActive: boolean
    windowDays: number // 14 days (2 weeks) for requests
    minRequests: number // 100+ requests required
    maxQuantity: number // Always 150 for echo
    limitedVariants: {
      fabrics: string[] // Only 2 fabrics allowed
      colors: string[] // Only 2 colors allowed
    }
  }
  press: {
    startDate: Date
    endDate: Date
    isActive: boolean
    maxQuantity: number // Always 10 for press editions
    exclusiveFabric: string // 1 exclusive fabric
    secretColors: string[] // Up to 5 secret colors
    surchargePercent: number // 30% surcharge for non-influencers
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
  // Optional product-level discount percentage (0-100)
  discountPercent?: number
  releasePhases: IReleasePhases
  status: "draft" | "waitlist" | "originals" | "echo" | "press" | "ended"
  allocatedCount: number
  productionStatus: "pending" | "started" | "completed"
  productionStartDate?: Date
  createdAt: Date
  updatedAt: Date
}

const VariantSchema = new Schema<IVariant>({
  color: { type: String, required: true },
  material: { type: String, required: true },
  stock: { type: Number, required: true, min: 0 },
  reservedStock: { type: Number, default: 0, min: 0 },
  images: [{ type: String }],
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
  discountPercent: { type: Number, default: 0, min: 0, max: 100 },
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
        windowDays: { type: Number, default: 14, min: 1 }, // 2 weeks for requests
        minRequests: { type: Number, default: 100, min: 1 }, // 100+ requests required
        maxQuantity: { type: Number, default: 150, min: 1 }, // 150 pieces max
        limitedVariants: {
          fabrics: [{ type: String }], // Only 2 fabrics
          colors: [{ type: String }], // Only 2 colors
        },
      },
      press: {
        startDate: { type: Date, required: false },
        endDate: { type: Date, required: false },
        isActive: { type: Boolean, default: false },
        maxQuantity: { type: Number, default: 10, min: 1 }, // 10 pieces max
        exclusiveFabric: { type: String }, // 1 exclusive fabric
        secretColors: [{ type: String }], // Up to 5 secret colors
        surchargePercent: { type: Number, default: 30, min: 0 }, // 30% surcharge
      },
    },
    status: {
      type: String,
      enum: ["draft", "waitlist", "originals", "echo", "press", "ended"],
      default: "draft",
    },
    allocatedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    productionStatus: {
      type: String,
      enum: ["pending", "started", "completed"],
      default: "pending",
    },
    productionStartDate: {
      type: Date,
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
