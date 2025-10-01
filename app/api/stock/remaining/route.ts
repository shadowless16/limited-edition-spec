import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { Product } from "@/models/Product"
import { Order } from "@/models/Order"
import { WaitlistEntry } from "@/models/WaitlistEntry"

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")

    if (!productId) {
      return NextResponse.json({ error: "productId required" }, { status: 400 })
    }

    const product = await Product.findById(productId)
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Calculate remaining slots based on phase
    const phase = product.status
    const maxQuantity = getPhaseMaxQuantity(product, phase)
    const allocatedCount = product.allocatedCount || 0
    const remainingSlots = Math.max(0, maxQuantity - allocatedCount)

    // Get waitlist count for Drop Day calculation
    const waitlistCount = await WaitlistEntry.countDocuments({ productId })
    
    // For Drop Day (originals phase), calculate slots available after waitlist
    let dropDaySlots = 0
    if (phase === 'originals') {
      // Waitlist gets priority, remaining slots go to Drop Day
      const waitlistAllocated = Math.min(waitlistCount, maxQuantity)
      dropDaySlots = Math.max(0, maxQuantity - waitlistAllocated)
    }

    // Get confirmed orders count
    const confirmedOrders = await Order.countDocuments({
      "items.productId": productId,
      paymentStatus: "paid"
    })

    return NextResponse.json({
      productId,
      phase,
      maxQuantity,
      allocatedCount,
      remainingSlots,
      waitlistCount,
      dropDaySlots,
      confirmedOrders,
      salesStopped: remainingSlots === 0,
      message: remainingSlots === 0 ? "Sales cap reached" : `${remainingSlots} units remaining`
    })

  } catch (error) {
    console.error("Error getting remaining stock:", error)
    return NextResponse.json({ error: "Failed to get remaining stock" }, { status: 500 })
  }
}

function getPhaseMaxQuantity(product: any, phase: string): number {
  switch (phase) {
    case 'waitlist':
    case 'originals':
      return product.releasePhases?.originals?.maxQuantity || 100
    case 'echo':
      return product.releasePhases?.echo?.maxQuantity || 150
    case 'press':
      return product.releasePhases?.press?.maxQuantity || 10
    default:
      return 100
  }
}