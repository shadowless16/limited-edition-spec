import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { PressRequest } from "@/models/PressRequest"
import { User } from "@/models/User"
import { requireAuth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    const adminId = auth.id || auth.userId
    if (!adminId) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    await connectToDatabase()

    // Verify admin permissions
    const admin = await User.findById(adminId)
    if (!admin?.isAdmin) return NextResponse.json({ error: "Admin access required" }, { status: 403 })

    const { requestId, action, rejectionReason } = await request.json()

    if (!requestId || !action) {
      return NextResponse.json({ error: "requestId and action required" }, { status: 400 })
    }

    const pressRequest = await PressRequest.findById(requestId).populate("userId")
    if (!pressRequest) return NextResponse.json({ error: "Press request not found" }, { status: 404 })

    if (pressRequest.status !== "pending") {
      return NextResponse.json({ error: "Request already processed" }, { status: 400 })
    }

    if (action === "approve") {
      // Generate payment link for non-influencers
      let paymentLinkId = null
      if (pressRequest.requestType === "regular" && pressRequest.amount > 0) {
        // TODO: Generate actual payment link via Stripe or payment provider
        paymentLinkId = `press_${pressRequest._id}_${Date.now()}`
      }

      pressRequest.status = "approved"
      pressRequest.approvedBy = adminId
      pressRequest.approvalDate = new Date()
      pressRequest.paymentLinkId = paymentLinkId

      await pressRequest.save()

      return NextResponse.json({
        success: true,
        message: "Press request approved",
        paymentLinkId,
        amount: pressRequest.amount,
        requestType: pressRequest.requestType
      })

    } else if (action === "reject") {
      pressRequest.status = "rejected"
      pressRequest.approvedBy = adminId
      pressRequest.approvalDate = new Date()

      await pressRequest.save()

      return NextResponse.json({
        success: true,
        message: "Press request rejected",
        rejectionReason
      })

    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

  } catch (error) {
    console.error("Error processing press approval:", error)
    return NextResponse.json({ error: "Failed to process press approval" }, { status: 500 })
  }
}