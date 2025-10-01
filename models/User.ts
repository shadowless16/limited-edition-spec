import mongoose, { type Document, Schema } from "mongoose"

export interface IUser extends Document {
  email: string
  phone?: string
  firstName: string
  lastName: string
  password: string
  priorityClub: boolean
  isAdmin?: boolean
  isInfluencer?: boolean
  influencerVerified?: boolean
  waitlistEntries: mongoose.Types.ObjectId[]
  orders: mongoose.Types.ObjectId[]
  // cart stores transient cart items for the user
  cart?: Array<{
    _id?: mongoose.Types.ObjectId
    productId: mongoose.Types.ObjectId
    variantId?: string
    quantity?: number
    priceSnapshot?: number
  }>
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    priorityClub: {
      type: Boolean,
      default: false,
    },
      cart: [
        {
          productId: { type: Schema.Types.ObjectId, ref: "Product" },
          variantId: { type: String },
          quantity: { type: Number, default: 1, min: 1 },
          priceSnapshot: { type: Number, default: 0 },
        },
      ],
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isInfluencer: {
      type: Boolean,
      default: false,
    },
    influencerVerified: {
      type: Boolean,
      default: false,
    },
    waitlistEntries: [
      {
        type: Schema.Types.ObjectId,
        ref: "WaitlistEntry",
      },
    ],
    orders: [
      {
        type: Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
  },
  {
    timestamps: true,
  },
)

// Indexes
// `email` field already has `unique: true` which creates an index.
// Avoid duplicate index creation by not calling schema.index for email.
UserSchema.index({ priorityClub: 1, createdAt: -1 })

const UserModel = mongoose.models.User || mongoose.model<IUser>("User", UserSchema)

export const User = UserModel
export default UserModel
