import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { PaymentMethod } from "@/models/PaymentMethod"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    await connectToDatabase()

    const { id } = (await params) as { id: string }

    const authUserId = (user as any).userId || (user as any).id

    const order = await Order.findOne({ _id: id, userId: authUserId }).populate("items.productId", "name")
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })

    const methods = await PaymentMethod.find({ enabled: true }).lean()

    // build simple invoice HTML
    const itemsHtml = (order.items || [])
      .map((it: any) => {
        const name = it.productId?.name || "Item"
        const qty = it.quantity || 1
        const unit = (it.unitPrice / 100).toFixed(2)
        const total = (it.totalPrice / 100).toFixed(2)
        return `<tr><td style="padding:8px;border-bottom:1px solid #eee">${name}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${qty}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${unit}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${total}</td></tr>`
      })
      .join("")

    const methodsHtml = (methods || []).map((m) => {
      const details = m.details || {}
      const detailLines = Object.keys(details).length
        ? Object.entries(details)
            .map(([k, v]) => `<li><strong>${k}:</strong> ${String(v)}</li>`)
            .join("")
        : "<li>No details provided</li>"
      return `<div style="margin-bottom:16px"><h4 style="margin:0 0 8px 0">${m.name}</h4><ul style="margin:0;padding-left:18px">${detailLines}</ul></div>`
    }).join("")

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Invoice ${order.orderNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color:#111; padding:24px }
    .container { max-width:800px; margin:0 auto }
    .header { display:flex; justify-content:space-between; align-items:center }
    .card { border:1px solid #eee; padding:16px; border-radius:8px; background:#fff }
    table { width:100%; border-collapse:collapse; margin-top:12px }
    .total { font-size:20px; font-weight:700; text-align:right }
    @media print { .no-print { display:none } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h2>Order Invoice</h2>
        <div>Order #: ${order.orderNumber}</div>
        <div>Date: ${new Date(order.createdAt).toLocaleString()}</div>
      </div>
      <div>
        <strong>Total</strong>
        <div style="font-size:18px">$${(order.total / 100).toFixed(2)}</div>
      </div>
    </div>

    <div style="height:16px"></div>

    <div class="card">
      <h3 style="margin-top:0">Order Summary</h3>
      <table>
        <thead>
          <tr><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Item</th><th style="padding:8px;border-bottom:1px solid #ddd">Qty</th><th style="padding:8px;border-bottom:1px solid #ddd;text-align:right">Unit</th><th style="padding:8px;border-bottom:1px solid #ddd;text-align:right">Total</th></tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <div style="margin-top:12px;display:flex;justify-content:flex-end"><div class="total">$${(order.total / 100).toFixed(2)}</div></div>
    </div>

    <div style="height:20px"></div>

    <div class="card">
      <h3 style="margin-top:0">Payment Options</h3>
      ${methodsHtml || '<p>No payment methods configured</p>'}
    </div>

    <div style="height:20px"></div>

    <div class="no-print" style="text-align:right;margin-top:12px">
      <button onclick="window.print()" style="padding:8px 12px;border-radius:6px;background:#333;color:#fff;border:none">Print / Save as PDF</button>
    </div>
  </div>
</body>
</html>`

    return new NextResponse(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } })
  } catch (err) {
    console.error("Failed to render invoice:", err)
    return NextResponse.json({ error: "Failed to render invoice" }, { status: 500 })
  }
}
