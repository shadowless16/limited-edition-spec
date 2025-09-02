import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { Product } from "@/models/Product"
import { PaymentMethod } from "@/models/PaymentMethod"
import { Settings } from "@/models/Settings"
import { verifyToken } from "@/lib/auth"
import puppeteer from "puppeteer"

async function buildInvoiceHtml(order: any, methods: any[], brandColor = '#6b3d2e') {
  const itemsHtml = (order.items || [])
    .map((it: any) => {
      const name = it.productId?.name || "Item"
      const qty = it.quantity || 1
      const unit = (it.unitPrice / 100).toFixed(2)
      const total = (it.totalPrice / 100).toFixed(2)
      return `<tr><td class="item">${name}</td><td class="qty">${qty}</td><td class="unit">$${unit}</td><td class="total">$${total}</td></tr>`
    })
    .join("")

  const methodsHtml = (methods || []).map((m) => {
    const details = m.details || {}
    const detailLines = Object.keys(details).length
      ? Object.entries(details)
          .map(([k, v]) => `<div class="detail-line"><span class="dkey">${k}</span><span class="dval">${String(v)}</span></div>`)
          .join("")
      : "<div class=\"detail-line\">No details provided</div>"
    return `<div class="method"><h4>${m.name}</h4>${detailLines}</div>`
  }).join("")

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Invoice ${order.orderNumber}</title>
  <style>
  body { font-family: Arial, Helvetica, sans-serif; color:#2b2b2b; margin:0; padding:24px; background:#f6efe9 }
  .container { max-width:800px; margin:0 auto; background:#fff; padding:20px; border-radius:8px }
    .header { display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding-bottom:12px }
  .logo { font-weight:700; color:${brandColor} }
    table { width:100%; border-collapse:collapse; margin-top:12px }
    table th { text-align:left; padding:8px; border-bottom:2px solid #eee }
    table td { padding:8px; border-bottom:1px solid #f0e9e2 }
    .qty { text-align:center }
    .unit, .total { text-align:right }
    .total-row { font-weight:700; font-size:18px }
    .methods { margin-top:20px }
    .method { margin-bottom:12px; padding:10px; border:1px solid #f0e0d8; border-radius:6px; background:#fbf6f3 }
    .detail-line { display:flex; gap:8px }
    .dkey { font-weight:600; width:140px }
    .dval { color:#3b3b3b }
    .footer { margin-top:20px; font-size:12px; color:#666 }
  </style>
</head>
<body>
  <div class="container">
      <div class="header">
      <div>
        <div class="logo">Your Brand</div>
        <div>Invoice: ${order.orderNumber}</div>
        <div>Date: ${new Date(order.createdAt).toLocaleString()}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:18px;font-weight:700;color:${brandColor}">$${(order.total / 100).toFixed(2)}</div>
      </div>
    </div>

    <div>
      <table>
        <thead>
          <tr><th>Item</th><th class="qty">Qty</th><th class="unit">Unit</th><th class="total">Total</th></tr>
        </thead>
        <tbody>
          ${itemsHtml}
          <tr><td colspan="3" class="total-row">Total</td><td class="total total-row">$${(order.total / 100).toFixed(2)}</td></tr>
        </tbody>
      </table>
    </div>

    <div class="methods">
      <h3>Payment Options</h3>
      ${methodsHtml}
    </div>

    <div class="footer">Thank you for your purchase.</div>
  </div>
</body>
</html>`
}

async function buildInvoicePdf(order: any, methods: any[], brandColor = '#6b3d2e') {
  // Dynamically import pdf-lib to keep server-only dependency out of client bundles.
  const pdfLib = await import('pdf-lib')
  const PDFDocument = pdfLib.PDFDocument
  const StandardFonts = pdfLib.StandardFonts
  const rgb = pdfLib.rgb

  const pdfDoc = await PDFDocument.create()
  let page = pdfDoc.addPage([595, 842]) // A4 in points
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const { width } = page.getSize()
  const margin = 24
  let y = 820

    const drawText = (text: string, options: { size?: number, x?: number, align?: 'left' | 'right', color?: [number,number,number] } = {}) => {
    const size = options.size || 12
    const x = options.x ?? margin
    const color = options.color ? rgb(options.color[0], options.color[1], options.color[2]) : rgb(0.13, 0.13, 0.13)
    if (options.align === 'right') {
      const textWidth = timesRomanFont.widthOfTextAtSize(text, size)
      page.drawText(text, { x: width - margin - textWidth, y, size, font: timesRomanFont, color })
    } else {
      page.drawText(text, { x, y, size, font: timesRomanFont, color })
    }
    y -= size + 6
  }

  // brand color hex to rgb conversion (accept #rgb or #rrggbb). Fallback to default on invalid.
  let hex = String(brandColor || '').replace('#', '').trim()
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    // expand to 6 digits, e.g. 'f0a' -> 'ff00aa'
    hex = hex.split('').map((c: string) => c + c).join('')
  }
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
    hex = '6b3d2e' // default brand
  }
  const r = parseInt(hex.substring(0,2), 16) / 255
  const g = parseInt(hex.substring(2,4), 16) / 255
  const b = parseInt(hex.substring(4,6), 16) / 255

  drawText('Your Brand', { size: 18, color: [r,g,b] })
  drawText(`Invoice: ${order.orderNumber}`, { size: 12 })
  drawText(`Date: ${new Date(order.createdAt).toLocaleString()}`, { size: 12 })
  y -= 6
  drawText(`Total: $${(order.total / 100).toFixed(2)}`, { size: 14, align: 'right', color: [r,g,b] })
  y -= 6

  drawText('Items:', { size: 13 })
  ;(order.items || []).forEach((it: any) => {
    const name = it.productId?.name || 'Item'
    const qty = it.quantity || 1
    const unit = `$${(it.unitPrice / 100).toFixed(2)}`
    const total = `$${(it.totalPrice / 100).toFixed(2)}`
    drawText(name, { size: 12 })
    drawText(`Qty: ${qty}  Unit: ${unit}  Total: ${total}`, { size: 11 })
    y -= 4
    if (y < 100) {
      // add new page
      y = 820
      page = pdfDoc.addPage([595, 842])
    }
  })

  y -= 6
  drawText(`Grand Total: $${(order.total / 100).toFixed(2)}`, { size: 13 })

  y -= 8
  drawText('Payment Options:', { size: 12 })
  methods.forEach((m: any) => {
    drawText(m.name, { size: 12 })
    const details = m.details || {}
    if (Object.keys(details).length) {
      Object.entries(details).forEach(([k, v]) => drawText(`${k}: ${String(v)}`, { size: 11 }))
    } else {
      drawText('No details provided', { size: 11 })
    }
  })

  drawText('Thank you for your purchase.', { size: 11 })

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    await connectToDatabase()

    const { id } = (await params) as { id: string }
    const authUserId = (user as any).userId || (user as any).id

    const order = await Order.findOne({ _id: id, userId: authUserId }).populate("items.productId", "name")
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })

  const methods = await PaymentMethod.find({ enabled: true }).lean()

  // load brand color from settings (admin-configurable)
  const brandSetting: any = await Settings.findOne({ key: 'brandColor' }).lean()
  const brandColor = (brandSetting && brandSetting.value) ? String(brandSetting.value) : '#6b3d2e'

  const html = await buildInvoiceHtml(order, methods, brandColor)

    // If the request comes from a mobile browser, return the HTML invoice so users can use the built-in
    // print/save-to-PDF UI that mobile browsers provide. This avoids spawning headless Chromium on mobile devices.
    const ua = request.headers.get('user-agent') || ''
    if (/Mobi|Android|iPhone|iPad|Mobile/i.test(ua)) {
      return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    }

    // launch headless browser and render to PDF
    try {
  const launchOptions: any = { args: ['--no-sandbox', '--disable-setuid-sandbox'], headless: 'new' }
  if (process.env.PUPPETEER_EXECUTABLE_PATH) launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH
  const browser = await puppeteer.launch(launchOptions)
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'networkidle0' })
  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' } })
  await browser.close()
  return new NextResponse(new Uint8Array(pdfBuffer), { status: 200, headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="invoice-${order.orderNumber}.pdf"` } })
    } catch (puErr) {
    console.error('Puppeteer failed, falling back to pdf-lib generation for invoice PDF:', puErr)
    // If Puppeteer/Chromium is not available, generate a PDF using pdf-lib so the client always receives a valid PDF file.
      try {
  const pdfBuffer = await buildInvoicePdf(order, methods, brandColor)
  return new NextResponse(pdfBuffer as any, { status: 200, headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="invoice-${order.orderNumber}.pdf"` } })
      } catch (pdfErr) {
        console.error('pdf-lib fallback also failed, returning HTML invoice as last resort:', pdfErr)
        return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
      }
    }
  } catch (err) {
    console.error('Failed to generate PDF invoice:', err)
    return NextResponse.json({ error: 'Failed to generate PDF invoice' }, { status: 500 })
  }
}
