import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { Product } from "@/models/Product"
import { verifyToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
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

    const { productId, variantId, quantity = 1, shippingAddress } = await request.json()

    // shippingAddress is optional at order creation (e.g., add-to-cart / reserve). If provided, validate required fields.
    let shippingAddressPayload: any = undefined
    if (shippingAddress) {
      const requiredAddressFields = ["firstName", "lastName", "addressLine1", "city", "state", "postalCode"]
      if (requiredAddressFields.some((f) => !shippingAddress[f])) {
        return NextResponse.json({ error: "shippingAddress missing required fields: firstName,lastName,addressLine1,city,state,postalCode" }, { status: 400 })
      }
      shippingAddressPayload = {
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        addressLine1: shippingAddress.addressLine1,
        addressLine2: shippingAddress.addressLine2 || undefined,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country || "US",
      }
    }

    // Validate product and variant
    const product = await Product.findById(productId)
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    if (!product.variants || product.variants.length === 0) {
      return NextResponse.json({ error: "No variants available for this product" }, { status: 400 })
    }

    // Support variantId being either the subdocument _id or a generated "color-material" string
    let variant: any = null
    if (variantId) {
      // try subdoc lookup by _id
      try {
        variant = product.variants.id ? product.variants.id(variantId) : null
      } catch (e) {
        // ignore invalid ObjectId format
        variant = null
      }

      if (!variant) {
        // fallback: robust match by color-material string. Allow dashes in material by splitting only on the first dash.
        const dashIndex = variantId.indexOf("-")
        let colorPart = variantId
        let materialPart = ""
        if (dashIndex >= 0) {
          colorPart = variantId.slice(0, dashIndex)
          materialPart = variantId.slice(dashIndex + 1)
        }

        const colorNormalized = colorPart.trim().toLowerCase()
        const materialNormalized = materialPart.trim().toLowerCase()

        variant = product.variants.find((v: any) => {
          return (v.color || "").toString().trim().toLowerCase() === colorNormalized &&
            (v.material || "").toString().trim().toLowerCase() === materialNormalized
        })
      }
    } else {
      // if no variant provided, use first available
      variant = product.variants && product.variants.length ? product.variants[0] : null
    }

    if (!variant) {
      console.error("Variant lookup failed", { productId, variantId, variants: product.variants })
      return NextResponse.json({ error: "Variant not found" }, { status: 404 })
    }

    // Check stock availability
    const available = (variant.stock ?? 0) - (variant.reservedStock ?? variant.reserved ?? 0)
    if (available < quantity) {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 400 })
    }

    // Calculate pricing server-side fallback
    let unitPrice = product.basePrice
    // Product schema uses releasePhases; keep pricing simple here and rely on client-side pricing where possible
    // Apply basic discounts if present
    if (product.releasePhases?.originals && product.releasePhases.originals.maxQuantity) {
      // no-op placeholder for future pricing logic
    }

  // Build order totals using fixed tax and shipping amounts (values are in kobo)
  // Allow overriding via environment variables FIXED_TAX_kobo and FIXED_SHIPPING_kobo
  const FIXED_TAX_kobo = Number(process.env.FIXED_TAX_kobo) || 500 // default 500 kobo
  const FIXED_SHIPPING_kobo = Number(process.env.FIXED_SHIPPING_kobo) || 1000 // default 1000 kobo

  const subtotal = unitPrice * quantity
  const tax = FIXED_TAX_kobo
  const shipping = FIXED_SHIPPING_kobo
  const total = subtotal + tax + shipping

    // Generate a simple order number
    const orderNumber = `ORD${Date.now().toString(36).toUpperCase()}`

    const authUserId = (user as any).userId || (user as any).id
    if (!authUserId) {
      return NextResponse.json({ error: "Invalid token payload: missing user id" }, { status: 401 })
    }

    const order = new Order({
      userId: authUserId,
      orderNumber,
      items: [
        {
          productId,
          variantId: variant._id ? variant._id.toString() : `${variant.color}-${variant.material}`,
          quantity,
          unitPrice,
          totalPrice: subtotal,
        },
      ],
      subtotal,
      tax,
      shipping,
      total,
      status: "pending",
  paymentStatus: "pending",
  ...(shippingAddressPayload && { shippingAddress: shippingAddressPayload }),
      phase: product.status === "originals" ? "originals" : "echo",
    })

    await order.save()

    // Reserve stock on the product
    if (variant.reservedStock !== undefined) {
      variant.reservedStock = (variant.reservedStock || 0) + quantity
    } else if (variant.reserved !== undefined) {
      variant.reserved = (variant.reserved || 0) + quantity
    } else {
      // attach reservedStock if missing
      variant.reservedStock = quantity
    }
    await product.save()

    return NextResponse.json({
      orderId: order._id,
      orderNumber,
      total,
      paymentRequired: true,
    })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
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

    const orders = await Order.find({ userId: user.id })
      .populate("items.productId", "name images")
      .sort({ createdAt: -1 })

    return NextResponse.json(orders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}
