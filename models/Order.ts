import mongoose, { type Document, Schema } from "mongoose"

interface IOrderItem {
  productId: mongoose.Types.ObjectId
  variantId: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface IShippingAddress {
  firstName: string
  lastName: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId
  orderNumber: string
  items: IOrderItem[]
  subtotal: number
  tax: number
  shipping: number
  total: number
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded"
  paymentStatus: "pending" | "paid" | "failed" | "refunded"
  paymentIntentId?: string
  shippingAddress: IShippingAddress
  trackingNumber?: string
  fulfillmentStatus: "pending" | "processing" | "packed" | "shipped" | "delivered"
  shippingCarrier?: string
  estimatedDelivery?: Date
  fulfillmentNotes?: string
  coaGenerated: boolean
  coaUrl?: string
  phase: "originals" | "echo"
  createdAt: Date
  updatedAt: Date
}

const OrderItemSchema = new Schema<IOrderItem>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  variantId: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
})

const ShippingAddressSchema = new Schema<IShippingAddress>({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  addressLine1: { type: String, required: true, trim: true },
  addressLine2: { type: String, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  postalCode: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true, default: "US" },
})

const OrderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    items: [OrderItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      required: true,
      min: 0,
    },
    shipping: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentIntentId: {
      type: String,
      trim: true,
    },
    shippingAddress: ShippingAddressSchema,
    trackingNumber: {
      type: String,
      trim: true,
    },
    fulfillmentStatus: {
      type: String,
      enum: ["pending", "processing", "packed", "shipped", "delivered"],
      default: "pending",
    },
    shippingCarrier: {
      type: String,
      trim: true,
    },
    estimatedDelivery: {
      type: Date,
    },
    fulfillmentNotes: {
      type: String,
      trim: true,
    },
    coaGenerated: {
      type: Boolean,
      default: false,
    },
    coaUrl: {
      type: String,
      trim: true,
    },
    phase: {
      type: String,
      enum: ["originals", "echo"],
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes
OrderSchema.index({ userId: 1, createdAt: -1 })
// `orderNumber` is already unique via the schema field definition; avoid duplicating the index here.
OrderSchema.index({ status: 1, createdAt: -1 })
OrderSchema.index({ paymentStatus: 1 })

export const Order = mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema)
