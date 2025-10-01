import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { PressRequest } from "@/models/PressRequest"
import { User } from "@/models/User"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    const adminId = auth.id || auth.userId
    if (!adminId) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    await connectToDatabase()

    // Verify admin permissions
    const admin = await User.findById(adminId)
    if (!admin?.isAdmin) return NextResponse.json({ error: "Admin access required" }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "pending"

    const requests = await PressRequest.find({ status })
      .populate("userId", "email firstName lastName")
      .populate("productId", "name sku basePrice")
      .sort({ createdAt: -1 })

    return NextResponse.json({ requests })

  } catch (error) {
    console.error("Error fetching press requests:", error)
    return NextResponse.json({ error: "Failed to fetch press requests" }, { status: 500 })
  }
}