import mongoose, { type Document, Schema } from "mongoose"

export interface IPressRequest extends Document {
  userId: mongoose.Types.ObjectId
  productId: mongoose.Types.ObjectId
  variantId?: string
  requestType: "influencer" | "regular"
  influencerDetails?: {
    platform: string
    handle: string
    followers: number
    verificationUrl?: string
  }
  status: "pending" | "approved" | "rejected"
  approvedBy?: mongoose.Types.ObjectId
  approvalDate?: Date
  paymentLinkId?: string
  amount: number
  createdAt: Date
}

const PressRequestSchema = new Schema<IPressRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: String },
    requestType: { 
      type: String, 
      enum: ["influencer", "regular"], 
      required: true 
    },
    influencerDetails: {
      platform: { type: String },
      handle: { type: String },
      followers: { type: Number },
      verificationUrl: { type: String }
    },
    status: { 
      type: String, 
      enum: ["pending", "approved", "rejected"], 
      default: "pending" 
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvalDate: { type: Date },
    paymentLinkId: { type: String },
    amount: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
)

export const PressRequest = mongoose.models.PressRequest || mongoose.model<IPressRequest>("PressRequest", PressRequestSchema)
export default PressRequest