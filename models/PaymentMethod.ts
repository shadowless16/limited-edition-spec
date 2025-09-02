import mongoose, { type Document, Schema } from "mongoose"

export interface IPaymentMethod extends Document {
  key: string
  name: string
  enabled: boolean
  details?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

const PaymentMethodSchema = new Schema<IPaymentMethod>(
  {
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    details: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
)

const PaymentMethodModel = mongoose.models.PaymentMethod || mongoose.model<IPaymentMethod>("PaymentMethod", PaymentMethodSchema)

export const PaymentMethod = PaymentMethodModel
export default PaymentMethodModel
