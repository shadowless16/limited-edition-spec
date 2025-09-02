import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { Product } from "@/models/Product"
import { User } from "@/models/User"
import { requireAuth } from "@/lib/auth"

// Helper to compute price snapshot
async function priceForProduct(productId: string) {
  const product = (await Product.findById(productId).lean()) as any
  if (!product) return null
  return (product.basePrice as number) || null
}

export async function GET(request: NextRequest) {
  try {
  const auth = requireAuth(request)
  const userId = auth.id || auth.userId
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  await connectToDatabase()

  const user = (await User.findById(userId).lean()) as any
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  console.debug("[cart][GET] userId=", userId, "cartCount=", (user.cart || []).length)

    const rawItems = (user as any).cart || []

    // Resolve product details for each cart item
    const items = await Promise.all(
      rawItems.map(async (c: any) => {
        try {
          const product = (await Product.findById(c.productId).lean()) as any
          const variantParts = (c.variantId || "").split("-")
          const color = variantParts[0] || ""
          const material = variantParts.slice(1).join("-") || ""
          return {
            id: c._id || null,
            productId: c.productId,
            productName: product?.name || "Unknown product",
            productImage: (product?.images && product.images.length > 0) ? product.images[0] : "/placeholder.svg",
            variant: { color, material },
            price: c.priceSnapshot || (product?.basePrice || 0),
            quantity: c.quantity || 1,
          }
        } catch (e) {
          return {
            id: c._id || null,
            productId: c.productId,
            productName: "Unknown product",
            productImage: "/placeholder.svg",
            variant: { color: "", material: "" },
            price: c.priceSnapshot || 0,
            quantity: c.quantity || 1,
          }
        }
      }),
    )

    return NextResponse.json({ items })
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    console.error("Error fetching cart:", error)
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
  const auth = requireAuth(request)
  const userId = auth.id || auth.userId
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  await connectToDatabase()

  const { productId, variantId, quantity = 1 } = await request.json()
    if (!productId || !variantId) return NextResponse.json({ error: "productId and variantId required" }, { status: 400 })

  const product = (await Product.findById(productId)) as any
    if (!product || product.status !== "originals") return NextResponse.json({ error: "Product not available for purchase" }, { status: 400 })

    const variant = product.variants.find((v: any) => `${v.color}-${v.material}` === variantId)
    if (!variant || variant.stock < quantity) return NextResponse.json({ error: "Insufficient stock" }, { status: 400 })

  const priceSnapshot = product.basePrice

  const user = await User.findById(userId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  // Ensure cart is an array before mutating
  if (!Array.isArray((user as any).cart)) {
    (user as any).cart = []
  }

  // Check if item exists, update quantity else push
  const existing = (user as any).cart.find((c: any) => String(c.productId) === String(productId) && c.variantId === variantId)
    if (existing) {
      existing.quantity = Math.min(existing.quantity + Number(quantity), variant.stock)
      existing.priceSnapshot = priceSnapshot
    } else {
      (user as any).cart.push({ productId, variantId, quantity: Number(quantity), priceSnapshot })
    }

  await user.save()

  // Read back the saved cart to return to client and log for debugging
  const saved = (await User.findById(userId).lean()) as any
  console.debug("[cart][POST] userId=", userId, "cartCount=", (saved?.cart || []).length)

  return NextResponse.json({ message: "Item added to cart", cart: saved?.cart || [] })
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    console.error("Error adding to cart:", error)
    return NextResponse.json({ error: "Failed to add to cart" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
  const auth = requireAuth(request)
  const userId = auth.id || auth.userId
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  await connectToDatabase()

  const { itemId, quantity } = await request.json()
    if (!itemId || typeof quantity !== "number") return NextResponse.json({ error: "itemId and quantity required" }, { status: 400 })

  const user = await User.findById(userId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // Safely locate the cart item. Mongoose arrays expose `.id()` on subdocument arrays,
    // but TypeScript may infer an empty literal array as `never[]` which causes call-signature errors.
  let cartItem: any = null
  const cartArray = (user as any).cart || []
  // Avoid calling `.id()` to prevent TypeScript `never[]` call-signature errors;
  // a robust fallback is to match by the cart item's `_id` string representation.
  cartItem = (cartArray as any).find((c: any) => String(c._id) === String(itemId))

    if (!cartItem) {
      return NextResponse.json({ error: "Cart item not found" }, { status: 404 })
    }

    cartItem.quantity = Math.max(1, Number(quantity))

    await user.save()
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    console.error("Error updating cart:", error)
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
  const auth = requireAuth(request)
  const userId = auth.id || auth.userId
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  await connectToDatabase()

  const { itemId } = await request.json()
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 })

  const user = await User.findById(userId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  if (!Array.isArray((user as any).cart)) {
    (user as any).cart = []
  }

  (user as any).cart = (user as any).cart.filter((c: any) => String(c._id) !== String(itemId))
  await user.save()

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    console.error("Error deleting cart item:", error)
    return NextResponse.json({ error: "Failed to delete cart item" }, { status: 500 })
  }
}
