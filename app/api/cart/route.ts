import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { Product } from "@/models/Product"
import { requireAuth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)
    await connectToDatabase()

    const { productId, variantId, quantity = 1 } = await request.json()

    if (!productId || !variantId) {
      return NextResponse.json({ error: "Product ID and variant ID are required" }, { status: 400 })
    }

    // Verify product exists and is available
    const product = await Product.findById(productId)
    if (!product || product.status !== "originals") {
      return NextResponse.json({ error: "Product not available for purchase" }, { status: 400 })
    }

    // Find the specific variant
  const variant = product.variants.find((v: any) => `${v.color}-${v.material}` === variantId)

    if (!variant || variant.stock < quantity) {
      return NextResponse.json({ error: "Insufficient stock for this variant" }, { status: 400 })
    }

    // For now, return success - in a real app, you'd store cart items
    return NextResponse.json({
      message: "Item added to cart",
      item: {
        productId,
        variantId,
        quantity,
        unitPrice: product.basePrice,
        totalPrice: product.basePrice * quantity,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    console.error("Cart error:", error)
    return NextResponse.json({ error: "Failed to add item to cart" }, { status: 500 })
  }
}
