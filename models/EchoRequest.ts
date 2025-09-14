import mongoose, { type Document, Schema } from "mongoose"

export interface IEchoRequest extends Document {
  userId?: mongoose.Types.ObjectId
  productId: mongoose.Types.ObjectId
  variantId?: string
  contactEmail?: string
  contactPhone?: string
  createdAt: Date
}

const EchoRequestSchema = new Schema<IEchoRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: String },
    contactEmail: { type: String },
    contactPhone: { type: String },
  },
  { timestamps: true }
)

export const EchoRequest = mongoose.models.EchoRequest || mongoose.model<IEchoRequest>("EchoRequest", EchoRequestSchema)
export default EchoRequest
