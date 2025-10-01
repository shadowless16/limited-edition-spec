import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { Order } from "@/models/Order"
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

    const { orderId, action, notes } = await request.json()

    if (!orderId || !action) {
      return NextResponse.json({ error: "orderId and action required" }, { status: 400 })
    }

    const order = await Order.findById(orderId)
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (action === "confirm") {
      order.paymentStatus = "paid"
      order.status = "confirmed"
      await order.save()

      // Generate COA for confirmed order
      try {
        const { generateCOA } = await import("@/lib/coa-generator")
        await generateCOA(order._id.toString(), order.userId.toString(), order.items)
        order.coaGenerated = true
        order.coaUrl = `/api/coa/${order._id}`
        await order.save()
      } catch (coaError) {
        console.error('COA generation failed:', coaError)
      }

      return NextResponse.json({
        success: true,
        message: "Payment confirmed successfully",
        orderNumber: order.orderNumber,
        coaUrl: `/api/coa/${order._id}`
      })

    } else if (action === "reject") {
      order.paymentStatus = "failed"
      order.status = "cancelled"
      await order.save()

      return NextResponse.json({
        success: true,
        message: "Payment rejected",
        orderNumber: order.orderNumber,
        notes
      })

    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

  } catch (error) {
    console.error("Error confirming payment:", error)
    return NextResponse.json({ error: "Failed to confirm payment" }, { status: 500 })
  }
}