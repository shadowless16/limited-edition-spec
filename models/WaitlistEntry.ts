import mongoose, { type Document, Schema } from "mongoose"

export interface IWaitlistEntry extends Document {
  userId: mongoose.Types.ObjectId
  productId: mongoose.Types.ObjectId
  variantId?: string
  position: number
  joinedAt: Date
  notifiedAt?: Date
  status: "active" | "notified" | "converted" | "expired"
  priorityBoost: number
  createdAt: Date
  updatedAt: Date
}

const WaitlistEntrySchema = new Schema<IWaitlistEntry>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variantId: {
      type: String,
      trim: true,
    },
    position: {
      type: Number,
      required: true,
      min: 1,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    notifiedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["active", "notified", "converted", "expired"],
      default: "active",
    },
    priorityBoost: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for efficient queries
WaitlistEntrySchema.index({ productId: 1, variantId: 1, position: 1 })
WaitlistEntrySchema.index({ userId: 1, status: 1 })
WaitlistEntrySchema.index({ status: 1, joinedAt: 1 })

export const WaitlistEntry =
  mongoose.models.WaitlistEntry || mongoose.model<IWaitlistEntry>("WaitlistEntry", WaitlistEntrySchema)
