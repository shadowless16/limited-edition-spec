import mongoose, { type Document, Schema } from "mongoose"

export interface IUser extends Document {
  email: string
  phone?: string
  firstName: string
  lastName: string
  password: string
  priorityClub: boolean
  isAdmin?: boolean
  waitlistEntries: mongoose.Types.ObjectId[]
  orders: mongoose.Types.ObjectId[]
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
    isAdmin: {
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
