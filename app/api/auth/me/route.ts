import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/models/User"
import { generateOwnerTag } from "@/lib/owner-tag"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    await connectToDatabase()
    const user = await User.findById(decoded.userId || decoded.id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Generate owner tag for existing users who don't have one
    if (!user.ownerTag) {
      user.ownerTag = generateOwnerTag(user.firstName, user.lastName, user.phone)
      await user.save()
    }

    return NextResponse.json({
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      ownerTag: user.ownerTag,
      role: user.isAdmin ? "admin" : "user",
      priorityClub: user.priorityClub || false,
    })
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 })
  }
}
