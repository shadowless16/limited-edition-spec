import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { Settings } from "@/models/Settings"
import { requireAuth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    const userId = auth.id || auth.userId
    if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    await connectToDatabase()

    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: "orderId required" }, { status: 400 })
    }

    const order = await Order.findOne({ _id: orderId, userId })
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Update order status to awaiting confirmation
    order.status = "pending"
    order.paymentStatus = "pending"
    await order.save()

    // Get WhatsApp number and generate URL
    const { getPhoneNumber, generateWhatsAppUrl } = await import("@/lib/phone-utils")
    const whatsappNumber = await getPhoneNumber()
    const message = `Hi! I've made a payment for Order #${order.orderNumber}. Total: ₦${(order.total / 100).toFixed(2)}. Please confirm my order. Thank you!`
    const whatsappUrl = generateWhatsAppUrl(whatsappNumber, message)

    return NextResponse.json({
      success: true,
      orderId: order._id,
      orderNumber: order.orderNumber,
      whatsappUrl,
      whatsappNumber,
      message: "Payment submitted. Please contact us on WhatsApp to confirm your order.",
      invoiceUrl: `/api/orders/${order._id}/invoice`,
      invoicePdfUrl: `/api/orders/${order._id}/invoice_pdf`
    })

  } catch (error) {
    console.error("Error confirming payment:", error)
    return NextResponse.json({ error: "Failed to confirm payment" }, { status: 500 })
  }
}