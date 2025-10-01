import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { PressRequest } from "@/models/PressRequest"
import { Order } from "@/models/Order"
import { requireAuth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    const userId = auth.id || auth.userId
    if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    await connectToDatabase()

    const { paymentLinkId, paymentIntentId } = await request.json()

    if (!paymentLinkId || !paymentIntentId) {
      return NextResponse.json({ error: "paymentLinkId and paymentIntentId required" }, { status: 400 })
    }

    const pressRequest = await PressRequest.findOne({ 
      paymentLinkId, 
      userId,
      status: "approved" 
    })

    if (!pressRequest) {
      return NextResponse.json({ error: "Invalid or expired payment link" }, { status: 404 })
    }

    // Create order from approved press request
    const orderNumber = `PRE${Date.now().toString(36).toUpperCase()}`

    const order = new Order({
      userId,
      orderNumber,
      items: [{
        productId: pressRequest.productId,
        variantId: pressRequest.variantId || "default",
        quantity: 1,
        unitPrice: pressRequest.amount,
        totalPrice: pressRequest.amount
      }],
      subtotal: pressRequest.amount,
      tax: 0,
      shipping: 0,
      total: pressRequest.amount,
      status: "confirmed",
      paymentStatus: "paid",
      paymentIntentId,
      phase: "press"
    })

    await order.save()

    // Mark press request as completed
    pressRequest.status = "completed"
    await pressRequest.save()

    return NextResponse.json({
      success: true,
      orderId: order._id,
      orderNumber,
      message: "Press Edition order confirmed"
    })

  } catch (error) {
    console.error("Error processing press payment:", error)
    return NextResponse.json({ error: "Failed to process press payment" }, { status: 500 })
  }
}