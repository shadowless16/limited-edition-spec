import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/models/User"
import { generateOwnerTag } from "@/lib/owner-tag"

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = await request.json()
    const { email, firstName, lastName, password, phone } = body

    const missing: string[] = []
    if (!email) missing.push("email")
    if (!firstName) missing.push("firstName")
    if (!lastName) missing.push("lastName")
    if (!password) missing.push("password")

    if (missing.length) {
      return NextResponse.json({ error: `Missing fields: ${missing.join(", ")}` }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate owner tag
    const ownerTag = generateOwnerTag(firstName, lastName, phone)

    // Create user
    const user = new User({
      email,
      firstName,
      lastName,
      password: hashedPassword,
      ownerTag,
      phone,
    })

    await user.save()

    // Generate JWT token
  const token = jwt.sign({ userId: user._id, email: user.email, isAdmin: user.isAdmin, role: (user as any).role, ownerTag: user.ownerTag }, process.env.JWT_SECRET || "fallback-secret", {
      expiresIn: "7d",
    })

    // Remove password from response
    const userResponse = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      ownerTag: user.ownerTag,
      priorityClub: user.priorityClub,
      isAdmin: user.isAdmin,
      role: (user as any).role || "user",
    }

    return NextResponse.json(
      {
        user: userResponse,
        token,
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Signup error:", error)

    // Mongoose duplicate key error (defensive)
    if (error?.code === 11000) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 })
    }

    return NextResponse.json({ error: error?.message || "Failed to create account" }, { status: 500 })
  }
}
