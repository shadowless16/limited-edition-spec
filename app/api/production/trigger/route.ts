import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { Product } from "@/models/Product"
import { Order } from "@/models/Order"

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const { productId, phase } = await request.json()

    if (!productId || !phase) {
      return NextResponse.json({ error: "productId and phase required" }, { status: 400 })
    }

    const product = await Product.findById(productId)
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    let productionTriggered = false
    let message = ""

    switch (phase) {
      case "waitlist_to_originals":
        // Waitlist closes, production starts for confirmed orders
        const confirmedOrders = await Order.countDocuments({
          "items.productId": productId,
          paymentStatus: "paid",
          phase: "originals"
        })

        if (confirmedOrders > 0) {
          await Product.findByIdAndUpdate(productId, {
            status: "originals",
            productionStatus: "started",
            productionStartDate: new Date(),
            allocatedCount: confirmedOrders
          })
          productionTriggered = true
          message = `Production started for ${confirmedOrders} confirmed orders`
        } else {
          message = "No confirmed orders - production not triggered"
        }
        break

      case "originals_cap_reached":
        // Originals cap reached, stop sales and start production
        const originalsCount = await Order.countDocuments({
          "items.productId": productId,
          paymentStatus: "paid",
          phase: "originals"
        })

        const maxOriginals = product.releasePhases?.originals?.maxQuantity || 100

        if (originalsCount >= maxOriginals) {
          await Product.findByIdAndUpdate(productId, {
            status: "ended",
            productionStatus: "started",
            productionStartDate: new Date()
          })
          productionTriggered = true
          message = `Originals cap reached (${originalsCount}/${maxOriginals}). Sales stopped, production started.`
        }
        break

      case "echo_threshold_met":
        // Echo threshold met, production starts
        await Product.findByIdAndUpdate(productId, {
          productionStatus: "started",
          productionStartDate: new Date()
        })
        productionTriggered = true
        message = "Echo production started"
        break

      default:
        return NextResponse.json({ error: "Invalid phase" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      productionTriggered,
      message,
      allocatedCount: product.allocatedCount
    })

  } catch (error) {
    console.error("Error triggering production:", error)
    return NextResponse.json({ error: "Failed to trigger production" }, { status: 500 })
  }
}