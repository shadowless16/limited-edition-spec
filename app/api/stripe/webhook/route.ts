import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { Product } from "@/models/Product"
import { EmailService } from "@/lib/email-service"

// Disable webhook processing when Stripe keys are not configured to avoid build/runtime errors
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY
const STRIPE_WEBHOOK = process.env.STRIPE_WEBHOOK_SECRET

let POST: (request: NextRequest) => Promise<NextResponse>

if (!STRIPE_KEY || !STRIPE_WEBHOOK) {
  // Noop handler when Stripe keys are not configured
  POST = async () => new NextResponse(null, { status: 204 })
} else {
  const stripe = require("stripe")(STRIPE_KEY)

  POST = async (request: NextRequest) => {
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")

    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 400 })
    }

    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK)
    } catch (error: any) {
      console.error("Webhook signature verification failed:", error.message)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    try {
      await connectToDatabase()

      switch (event.type) {
        case "payment_intent.succeeded":
          const paymentIntent = event.data.object

          // Find order by payment intent ID
          const order = await Order.findOne({
            paymentIntentId: paymentIntent.id,
          }).populate("userId productId")

          if (order) {
            order.status = "completed"
            order.paidAt = new Date()
            await order.save()

            const product = await Product.findById(order.productId)
            if (product) {
              const phaseStock = product.phases[order.phase]
              if (phaseStock && phaseStock.stock > 0) {
                phaseStock.stock -= order.quantity
                await product.save()
              }
            }

            const user = order.userId as any
            const productData = order.productId as any

            await EmailService.sendEmail(
              EmailService.createOrderConfirmationEmail({
                userName: user.name,
                orderNumber: order._id.toString().slice(-8).toUpperCase(),
                productName: productData.name,
                amount: order.total,
                shippingAddress: `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}`,
              }),
            )
          }
          break

        case "payment_intent.payment_failed":
          const failedPayment = event.data.object

          const failedOrder = await Order.findOne({
            paymentIntentId: failedPayment.id,
          })

          if (failedOrder) {
            failedOrder.status = "failed"
            await failedOrder.save()
          }
          break
      }

      return NextResponse.json({ received: true })
    } catch (error) {
      console.error("Webhook processing error:", error)
      return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
    }
  }
}

export { POST }
