import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { Product } from "@/models/Product"
import { verifyToken } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { method } = await request.json()

    // `params` may be a Promise in Next.js App Router; await before using
    const { id } = await params as { id: string }

    const authUserId = (user as any).userId || (user as any).id
    const order = await Order.findOneAndUpdate(
      { _id: id, userId: authUserId },
      {
        paymentStatus: "paid",
        status: "confirmed",
        paymentIntentId: method,
        updatedAt: new Date(),
      },
      { new: true },
    )

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Decrement stock and clear reserved counters
    for (const item of order.items) {
      const product = await Product.findById(item.productId)
      if (product) {
        // try to find variant by subdoc id or color-material string
        let variant: any = null
        try {
          variant = (product.variants as any).id ? (product.variants as any).id(item.variantId) : null
        } catch (e) {
          variant = null
        }
        if (!variant) {
          const dashIndex = (item.variantId as string).indexOf("-")
          let colorPart = item.variantId as string
          let materialPart = ""
          if (dashIndex >= 0) {
            colorPart = (item.variantId as string).slice(0, dashIndex)
            materialPart = (item.variantId as string).slice(dashIndex + 1)
          }
          const colorNormalized = colorPart.trim().toLowerCase()
          const materialNormalized = materialPart.trim().toLowerCase()
          variant = product.variants.find((v: any) => {
            return (v.color || "").toString().trim().toLowerCase() === colorNormalized &&
              (v.material || "").toString().trim().toLowerCase() === materialNormalized
          })
        }
        if (variant) {
          variant.stock = Math.max(0, (variant.stock || 0) - item.quantity)
          if (variant.reservedStock !== undefined) variant.reservedStock = Math.max(0, (variant.reservedStock || 0) - item.quantity)
          if ((variant as any).reserved !== undefined) (variant as any).reserved = Math.max(0, ((variant as any).reserved || 0) - item.quantity)
          await product.save()
        }
      }
    }

    // Generate a simple invoice HTML
    const itemsHtml = (order.items || []).map((i: any) => {
      const qty = i.quantity || 1
      const pid = i.productId || 'unknown'
      const price = ((i.totalPrice || 0) / 100).toFixed(2)
      return `<li>${qty}x ${pid} - $${price}</li>`
    }).join("")

    const invoiceHtml = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${order.orderNumber}</title></head><body><h1>Invoice ${order.orderNumber}</h1><p>Total: $${(order.total / 100).toFixed(2)}</p><ul>${itemsHtml}</ul></body></html>`

    return NextResponse.json({ success: true, order, invoiceHtml })
  } catch (error) {
    console.error("Error updating payment status:", error)
    return NextResponse.json({ error: "Failed to update payment status" }, { status: 500 })
  }
}
