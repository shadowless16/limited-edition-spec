import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { EchoRequest } from "@/models/EchoRequest"
import { Product } from "@/models/Product"
import { Order } from "@/models/Order"

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const { productId } = await request.json()

    if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 })

    const product = await Product.findById(productId)
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 })

    // Get all escrowed requests for this product
    const escrowedRequests = await EchoRequest.find({
      productId,
      paymentStatus: "escrowed",
      escrowReleaseDate: { $lte: new Date() }
    }).populate("userId")

    const requestCount = escrowedRequests.length
    const minRequests = product.releasePhases?.echo?.minRequests || 100

    if (requestCount >= minRequests) {
      // Threshold met - convert to orders and release escrow
      const orders = []
      
      for (const request of escrowedRequests) {
        // Create order from echo request
        const orderNumber = `ECO${Date.now().toString(36).toUpperCase()}`
        
        const order = new Order({
          userId: request.userId,
          orderNumber,
          items: [{
            productId: request.productId,
            variantId: request.variantId || "default",
            quantity: 1,
            unitPrice: request.amount,
            totalPrice: request.amount
          }],
          subtotal: request.amount,
          tax: 0,
          shipping: 0,
          total: request.amount,
          status: "confirmed",
          paymentStatus: "paid",
          paymentIntentId: request.paymentIntentId,
          phase: "echo"
        })
        
        await order.save()
        orders.push(order)

        // Update request status
        request.paymentStatus = "released"
        await request.save()
      }

      // Update product status and trigger production
      product.status = "ended"
      product.productionStatus = "started"
      product.productionStartDate = new Date()
      product.allocatedCount = orders.length
      await product.save()

      return NextResponse.json({ 
        success: true, 
        action: "production_started",
        ordersCreated: orders.length,
        message: `Echo threshold met (${requestCount}/${minRequests}). Production started.`
      })

    } else {
      // Threshold not met - refund all escrow
      for (const request of escrowedRequests) {
        // TODO: Process actual refund via payment provider
        request.paymentStatus = "refunded"
        await request.save()
      }

      return NextResponse.json({ 
        success: true, 
        action: "refunds_processed",
        refundCount: requestCount,
        message: `Echo threshold not met (${requestCount}/${minRequests}). All payments refunded.`
      })
    }

  } catch (error) {
    console.error("Error processing echo escrow:", error)
    return NextResponse.json({ error: "Failed to process echo escrow" }, { status: 500 })
  }
}