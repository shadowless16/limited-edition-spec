import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { WaitlistEntry } from "@/models/WaitlistEntry"
import { User } from "@/models/User"
import { requireAuth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    const adminId = auth.id || auth.userId
    if (!adminId) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    await connectToDatabase()

    const admin = await User.findById(adminId)
    if (!admin?.isAdmin) return NextResponse.json({ error: "Admin access required" }, { status: 403 })

    const { entryIds, subject, message } = await request.json()

    if (!entryIds || !Array.isArray(entryIds) || entryIds.length === 0) {
      return NextResponse.json({ error: "Entry IDs required" }, { status: 400 })
    }

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message required" }, { status: 400 })
    }

    // Get waitlist entries
    const entries = await WaitlistEntry.find({ _id: { $in: entryIds } })
      .populate("productId", "name")

    if (entries.length === 0) {
      return NextResponse.json({ error: "No valid entries found" }, { status: 404 })
    }

    // In a real implementation, you would integrate with an email service
    // For now, we'll simulate sending emails and update the status
    const emailPromises = entries.map(async (entry) => {
      // Simulate email sending
      console.log(`Sending email to ${entry.email}:`)
      console.log(`Subject: ${subject}`)
      console.log(`Message: ${message}`)
      console.log(`Product: ${(entry.productId as any)?.name}`)
      
      // Update entry status to notified
      entry.status = "notified"
      await entry.save()
      
      return { email: entry.email, status: "sent" }
    })

    const results = await Promise.all(emailPromises)

    return NextResponse.json({
      success: true,
      message: `Bulk email sent to ${results.length} recipients`,
      results
    })

  } catch (error) {
    console.error("Error sending bulk email:", error)
    return NextResponse.json({ error: "Failed to send bulk email" }, { status: 500 })
  }
}