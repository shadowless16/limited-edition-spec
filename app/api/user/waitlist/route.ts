import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { WaitlistEntry } from "@/models/WaitlistEntry"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    await connectToDatabase()

    const waitlistEntries = await WaitlistEntry.find({ userId: user.id })
      .populate("productId", "name images currentPhase")
      .sort({ createdAt: -1 })

    return NextResponse.json(waitlistEntries)
  } catch (error) {
    console.error("Error fetching user waitlist:", error)
    return NextResponse.json({ error: "Failed to fetch waitlist entries" }, { status: 500 })
  }
}
