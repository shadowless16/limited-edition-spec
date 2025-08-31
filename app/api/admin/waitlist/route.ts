import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { WaitlistEntry } from "@/models/WaitlistEntry"

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    // Populate both product name and the user's email for admin display
    const waitlistEntries = await WaitlistEntry.find()
      .populate("productId", "name")
      .populate("userId", "email")
      .sort({ createdAt: -1 })
      .limit(100)

    // Transform to include email at top-level for ease of rendering in admin UI
    const transformed = waitlistEntries.map((entry) => ({
      _id: entry._id,
      productId: entry.productId,
      email: (entry as any).userId?.email || null,
      position: entry.position,
      status: entry.status,
      createdAt: entry.createdAt,
    }))

    return NextResponse.json(transformed)
  } catch (error) {
    console.error("Error fetching waitlist entries:", error)
    return NextResponse.json({ error: "Failed to fetch waitlist entries" }, { status: 500 })
  }
}
