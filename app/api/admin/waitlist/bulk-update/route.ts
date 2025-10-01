import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { WaitlistEntry } from "@/models/WaitlistEntry"
import { User } from "@/models/User"
import { requireAuth } from "@/lib/auth"

export async function PATCH(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    const adminId = auth.id || auth.userId
    if (!adminId) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    await connectToDatabase()

    const admin = await User.findById(adminId)
    if (!admin?.isAdmin) return NextResponse.json({ error: "Admin access required" }, { status: 403 })

    const { entryIds, status } = await request.json()

    if (!entryIds || !Array.isArray(entryIds) || entryIds.length === 0) {
      return NextResponse.json({ error: "Entry IDs required" }, { status: 400 })
    }

    if (!status || !["active", "notified", "converted"].includes(status)) {
      return NextResponse.json({ error: "Valid status required" }, { status: 400 })
    }

    // Update entries
    const result = await WaitlistEntry.updateMany(
      { _id: { $in: entryIds } },
      { status, updatedAt: new Date() }
    )

    return NextResponse.json({
      success: true,
      message: `Updated ${result.modifiedCount} entries to ${status}`,
      modifiedCount: result.modifiedCount
    })

  } catch (error) {
    console.error("Error updating entries:", error)
    return NextResponse.json({ error: "Failed to update entries" }, { status: 500 })
  }
}