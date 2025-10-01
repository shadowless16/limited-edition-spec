import mongoose, { type Document, Schema } from "mongoose"

export interface IEchoRequest extends Document {
  userId?: mongoose.Types.ObjectId
  productId: mongoose.Types.ObjectId
  variantId?: string
  contactEmail?: string
  contactPhone?: string
  amount: number
  paymentStatus: "pending" | "escrowed" | "refunded" | "released"
  paymentIntentId?: string
  escrowReleaseDate?: Date
  createdAt: Date
}

const EchoRequestSchema = new Schema<IEchoRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: String },
    contactEmail: { type: String },
    contactPhone: { type: String },
    amount: { type: Number, required: true, min: 0 },
    paymentStatus: { 
      type: String, 
      enum: ["pending", "escrowed", "refunded", "released"], 
      default: "pending" 
    },
    paymentIntentId: { type: String },
    escrowReleaseDate: { type: Date },
  },
  { timestamps: true }
)

export const EchoRequest = mongoose.models.EchoRequest || mongoose.model<IEchoRequest>("EchoRequest", EchoRequestSchema)
export default EchoRequest
