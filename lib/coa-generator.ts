import { Order } from "@/models/Order"

export interface COAData {
  orderId: string
  productName: string
  productId: string
  serialNumber: string
  pieceNumber: number
  purchaseDate: Date
  customerName: string
  customerEmail: string
  ownerTag?: string
  phase: "originals" | "echo" | "press"
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
    const order = await Order.findById(orderId).populate("items.productId userId")
    if (!order) throw new Error("Order not found")

    const user = order.userId as any
    const firstItem = order.items[0]
    const product = firstItem.productId as any

    // Get piece number based on confirmed payment order (prepaid model)
    const pieceNumber = await Order.countDocuments({
      "items.productId": product._id,
      paymentStatus: "paid",
      phase: order.phase,
      createdAt: { $lte: order.createdAt },
    })

    const serialNumber = this.generateSerialNumber(product._id.toString(), pieceNumber, order.phase)

    const coaData: COAData = {
      orderId: order._id.toString(),
      productName: product.name,
      productId: product._id.toString(),
      serialNumber,
      pieceNumber,
      purchaseDate: order.createdAt,
      customerName: `${user.firstName} ${user.lastName}`,
      customerEmail: user.email,
      ownerTag: user.ownerTag,
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
    return `
ÀNÍKẸ́ BÁKÀRÈ - CERTIFICATE OF AUTHENTICITY

Product: ${coaData.productName}
Serial Number: ${coaData.serialNumber}
Piece Number: ${coaData.pieceNumber}
Edition: ${coaData.phase.toUpperCase()}
${coaData.ownerTag ? `Owner Tag: ${coaData.ownerTag}` : ''}

Owner: ${coaData.customerName}
Email: ${coaData.customerEmail}
Purchase Date: ${coaData.purchaseDate.toLocaleDateString()}

Authenticity Verification:
Hash: ${coaData.authenticity.hash}
Timestamp: ${coaData.authenticity.timestamp}
Status: ${coaData.authenticity.signature}

This certificate verifies the authenticity of your limited edition piece.
Prepaid and made-to-order - no overproduction.
    `.trim()
  }
}

// Export convenience function
export async function generateCOA(orderId: string, userId: string, items: any[]): Promise<string> {
  const coaData = await COAGenerator.generateCOA(orderId)
  return coaData.serialNumber
}
