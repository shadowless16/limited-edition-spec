import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/models/User"

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Find user
    const user = await User.findOne({ email }).select("+password")
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Generate JWT token
    const role = user.isAdmin ? "admin" : "user"
    const token = jwt.sign({ userId: user._id, email: user.email, isAdmin: user.isAdmin, role }, process.env.JWT_SECRET || "fallback-secret", {
      expiresIn: "7d",
    })

    // Remove password from response
    const userResponse = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      priorityClub: user.priorityClub,
      isAdmin: user.isAdmin,
      role,
    }

    return NextResponse.json({
      user: userResponse,
      token,
    })
  } catch (error) {
    console.error("Signin error:", error)
    return NextResponse.json({ error: "Failed to sign in" }, { status: 500 })
  }
}
