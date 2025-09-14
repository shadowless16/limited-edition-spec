import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/models/User"
import { WaitlistEntry } from "@/models/WaitlistEntry"
import { Product } from "@/models/Product"
import { verifyToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

  const token = request.headers.get("authorization")?.replace("Bearer ", "")
  const { email: bodyEmail, phone: bodyPhone, productId, variantId } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    // Check if product exists and is in waitlist phase
    const product = await Product.findById(productId)
    if (!product || product.status !== "waitlist") {
      return NextResponse.json({ error: "Product not available for waitlist" }, { status: 400 })
    }

    // If the request contains a valid auth token, associate the waitlist entry
    // with the authenticated user. Otherwise fallback to email-based signup.
    let user = null
    let email: string | undefined = undefined

    if (token) {
      const tokenUser = await verifyToken(token)
      if (tokenUser) {
        // try to load the user from DB by id
        user = await User.findById(tokenUser.id)
        email = tokenUser.email || user?.email
      }
    }

    if (!user) {
      // fallback to email-based flow (guest join)
      email = bodyEmail
      if (!email) {
        return NextResponse.json({ error: "Email is required for guest waitlist joins" }, { status: 400 })
      }
      if (!bodyPhone) {
        return NextResponse.json({ error: "WhatsApp number is required for guest waitlist joins" }, { status: 400 })
      }

      // Basic E.164 phone validation: + followed by 8-15 digits
      const phoneNormalized = String(bodyPhone).replace(/\s+/g, "")
      const e164 = /^\+[1-9]\d{7,14}$/
      if (!e164.test(phoneNormalized)) {
        return NextResponse.json({ error: "Invalid WhatsApp number. Use E.164 format, e.g. +15551234567" }, { status: 400 })
      }

      // Create a lightweight placeholder user (upsert) so we can reference a User._id
      const placeholderPassword = Math.random().toString(36).slice(2, 10)
      user = await User.findOneAndUpdate(
        { email },
        {
          $setOnInsert: {
            email,
            phone: phoneNormalized,
            firstName: "",
            lastName: "",
            password: placeholderPassword,
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      )
    }

    // Check if already on waitlist using the WaitlistEntry collection
    const existingEntry = await WaitlistEntry.findOne({
      userId: user._id,
      productId,
      ...(variantId && { variantId }),
    })

    if (existingEntry) {
      return NextResponse.json({ error: "Already on waitlist for this product" }, { status: 400 })
    }

    // Add to waitlist: compute position across all waitlist entries
    const position = (await WaitlistEntry.countDocuments({
      productId,
      ...(variantId && { variantId }),
    })) + 1

    const newEntry = new WaitlistEntry({
      userId: user._id,
      productId,
      variantId,
      position,
      joinedAt: new Date(),
    })

    await newEntry.save()

    // push the entry id into the user's waitlistEntries array
  // Atomically push the new entry id to user's waitlistEntries to avoid triggering
  // full Document validation via `user.save()` (some user docs may be missing required fields).
  await User.updateOne({ _id: user._id }, { $push: { waitlistEntries: newEntry._id } })

    return NextResponse.json({
      message: "Successfully joined waitlist",
      position,
    })
  } catch (error) {
    console.error("Error joining waitlist:", error)
    return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 })
  }
}
