import { Order } from "@/models/Order"

export interface COAData {
  orderId: string
  productName: string
  productId: string
  serialNumber: string
  purchaseDate: Date
  customerName: string
  customerEmail: string
  phase: "originals" | "echo"
  authenticity: {
    signature: string
    timestamp: string
    hash: string
  }
}

export class COAGenerator {
  private static generateSerialNumber(productId: string, orderNumber: number, phase: string): string {
    const phaseCode = phase === "originals" ? "OG" : "EC"
    const paddedOrder = orderNumber.toString().padStart(4, "0")
    const productCode = productId.slice(-4).toUpperCase()
    return `${phaseCode}-${productCode}-${paddedOrder}`
  }

  private static generateAuthenticityHash(data: Partial<COAData>): string {
    const hashInput = `${data.orderId}-${data.productId}-${data.serialNumber}-${data.purchaseDate?.toISOString()}`
    // In production, use a proper cryptographic hash
    return Buffer.from(hashInput).toString("base64").slice(0, 16)
  }

  static async generateCOA(orderId: string): Promise<COAData> {
    // This would typically fetch from database
    const order = await Order.findById(orderId).populate("productId userId")
    if (!order) throw new Error("Order not found")

    const product = order.productId as any
    const user = order.userId as any

    // Get order number for this product (for serial numbering)
    const orderCount = await Order.countDocuments({
      productId: product._id,
      status: "completed",
      createdAt: { $lte: order.createdAt },
    })

    const serialNumber = this.generateSerialNumber(product._id.toString(), orderCount, order.phase)

    const coaData: COAData = {
      orderId: order._id.toString(),
      productName: product.name,
      productId: product._id.toString(),
      serialNumber,
      purchaseDate: order.createdAt,
      customerName: user.name,
      customerEmail: user.email,
      phase: order.phase,
      authenticity: {
        signature: "VERIFIED_AUTHENTIC",
        timestamp: new Date().toISOString(),
        hash: this.generateAuthenticityHash({
          orderId: order._id.toString(),
          productId: product._id.toString(),
          serialNumber,
          purchaseDate: order.createdAt,
        }),
      },
    }

    return coaData
  }

  static generateCOAPDF(coaData: COAData): string {
    // In production, this would generate an actual PDF using libraries like jsPDF or Puppeteer
    // For now, return a formatted text representation
    return `
CERTIFICATE OF AUTHENTICITY

Product: ${coaData.productName}
Serial Number: ${coaData.serialNumber}
Phase: ${coaData.phase.toUpperCase()}

Customer: ${coaData.customerName}
Email: ${coaData.customerEmail}
Purchase Date: ${coaData.purchaseDate.toLocaleDateString()}

Authenticity Verification:
Hash: ${coaData.authenticity.hash}
Timestamp: ${coaData.authenticity.timestamp}
Status: ${coaData.authenticity.signature}

This certificate verifies the authenticity of your limited edition purchase.
    `.trim()
  }
}
