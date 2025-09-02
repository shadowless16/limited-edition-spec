import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { Product } from "@/models/Product"
import { User } from "@/models/User"
import { requireAuth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    const userId = auth.id || auth.userId
    if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    await connectToDatabase()

    const user = await User.findById(userId)
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const cart = (user as any).cart || []
    if (!Array.isArray(cart) || cart.length === 0) return NextResponse.json({ error: "Cart is empty" }, { status: 400 })

    // Build items and validate stock
    let subtotal = 0
    const items: any[] = []

    for (const ci of cart) {
      const product = await Product.findById(ci.productId)
      if (!product) return NextResponse.json({ error: `Product not found: ${ci.productId}` }, { status: 404 })

      // Resolve variant like orders route: support subdoc id or color-material string
      let variant: any = null
      const variantId = ci.variantId
      if (variantId) {
        try {
          variant = product.variants.id ? product.variants.id(variantId) : null
        } catch (e) {
          variant = null
        }
        if (!variant) {
          const dashIndex = (variantId as string).indexOf("-")
          let colorPart = variantId as string
          let materialPart = ""
          if (dashIndex >= 0) {
            colorPart = (variantId as string).slice(0, dashIndex)
            materialPart = (variantId as string).slice(dashIndex + 1)
          }
          const colorNormalized = colorPart.trim().toLowerCase()
          const materialNormalized = materialPart.trim().toLowerCase()
          variant = product.variants.find((v: any) => {
            return (v.color || "").toString().trim().toLowerCase() === colorNormalized &&
              (v.material || "").toString().trim().toLowerCase() === materialNormalized
          })
        }
      } else {
        variant = product.variants && product.variants.length ? product.variants[0] : null
      }

      if (!variant) return NextResponse.json({ error: `Variant not found for product ${ci.productId}` }, { status: 404 })

      const available = (variant.stock ?? 0) - (variant.reservedStock ?? variant.reserved ?? 0)
      const qty = Number(ci.quantity || 1)
      if (available < qty) return NextResponse.json({ error: `Insufficient stock for product ${ci.productId}` }, { status: 400 })

      const unitPrice = product.basePrice || 0
      const totalPrice = unitPrice * qty
      subtotal += totalPrice

      items.push({
        productId: product._id,
        variantId: variant._id ? variant._id.toString() : `${variant.color}-${variant.material}`,
        quantity: qty,
        unitPrice,
        totalPrice,
      })
    }

    const FIXED_TAX_CENTS = Number(process.env.FIXED_TAX_CENTS) || 500
    const FIXED_SHIPPING_CENTS = Number(process.env.FIXED_SHIPPING_CENTS) || 1000
    const tax = FIXED_TAX_CENTS
    const shipping = FIXED_SHIPPING_CENTS
    const total = subtotal + tax + shipping

    const orderNumber = `ORD${Date.now().toString(36).toUpperCase()}`

    const order = new Order({
      userId,
      orderNumber,
      items,
      subtotal,
      tax,
      shipping,
      total,
      status: "pending",
      paymentStatus: "pending",
      phase: "originals",
    })

    await order.save()

    // Reserve stock and save products
    for (const ci of cart) {
      const product = await Product.findById(ci.productId)
      if (!product) continue
      const variantId = ci.variantId
      let variant: any = null
      try {
        variant = product.variants.id ? product.variants.id(variantId) : null
      } catch (e) {
        variant = null
      }
      if (!variant) {
        const dashIndex = (variantId as string).indexOf("-")
        let colorPart = variantId as string
        let materialPart = ""
        if (dashIndex >= 0) {
          colorPart = (variantId as string).slice(0, dashIndex)
          materialPart = (variantId as string).slice(dashIndex + 1)
        }
        const colorNormalized = colorPart.trim().toLowerCase()
        const materialNormalized = materialPart.trim().toLowerCase()
        variant = product.variants.find((v: any) => {
          return (v.color || "").toString().trim().toLowerCase() === colorNormalized &&
            (v.material || "").toString().trim().toLowerCase() === materialNormalized
        })
      }
      if (!variant) continue
      const qty = Number((user as any).cart.find((c: any) => String(c.productId) === String(product._id) && c.variantId === variantId)?.quantity || 1)
      if (variant.reservedStock !== undefined) {
        variant.reservedStock = (variant.reservedStock || 0) + qty
      } else if (variant.reserved !== undefined) {
        variant.reserved = (variant.reserved || 0) + qty
      } else {
        variant.reservedStock = qty
      }
      await product.save()
    }

    // Clear user's cart
    (user as any).cart = []
    await user.save()

    return NextResponse.json({ orderId: order._id, orderNumber, total })
  } catch (error) {
    console.error("Error creating order from cart:", error)
    return NextResponse.json({ error: "Failed to create order from cart" }, { status: 500 })
  }
}
