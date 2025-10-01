import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { Settings } from "@/models/Settings"
import { User } from "@/models/User"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    const adminId = auth.id || auth.userId
    if (!adminId) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    await connectToDatabase()

    const admin = await User.findById(adminId)
    if (!admin?.isAdmin) return NextResponse.json({ error: "Admin access required" }, { status: 403 })

    const whatsappSetting = await Settings.findOne({ key: "whatsapp_number" })
    
    return NextResponse.json({
      whatsappNumber: whatsappSetting?.value || "+2348000000000"
    })

  } catch (error) {
    console.error("Error fetching WhatsApp settings:", error)
    return NextResponse.json({ error: "Failed to fetch WhatsApp settings" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    const adminId = auth.id || auth.userId
    if (!adminId) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    await connectToDatabase()

    const admin = await User.findById(adminId)
    if (!admin?.isAdmin) return NextResponse.json({ error: "Admin access required" }, { status: 403 })

    const { whatsappNumber } = await request.json()

    if (!whatsappNumber) {
      return NextResponse.json({ error: "WhatsApp number required" }, { status: 400 })
    }

    // Validate phone number format
    const phoneRegex = /^\+[1-9]\d{1,14}$/
    if (!phoneRegex.test(whatsappNumber)) {
      return NextResponse.json({ error: "Invalid phone number format. Use E.164 format (e.g., +2348000000000)" }, { status: 400 })
    }

    await Settings.findOneAndUpdate(
      { key: "whatsapp_number" },
      { value: whatsappNumber },
      { upsert: true, new: true }
    )

    return NextResponse.json({
      success: true,
      whatsappNumber,
      message: "WhatsApp number updated successfully"
    })

  } catch (error) {
    console.error("Error updating WhatsApp settings:", error)
    return NextResponse.json({ error: "Failed to update WhatsApp settings" }, { status: 500 })
  }
}