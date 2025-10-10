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
      return `<tr><td class="item-name">${name}</td><td class="qty">${qty}</td><td class="unit">₦${unit}</td><td class="total">₦${total}</td></tr>`
    })
    .join("")

  const methodsHtml = (methods || []).map((m) => {
    const details = m.details || {}
    const detailRows = Object.keys(details).length
      ? Object.entries(details)
          .map(([k, v]) => `<tr><td class="detail-key">${k}</td><td class="detail-value">${String(v)}</td></tr>`)
          .join("")
      : `<tr><td colspan="2" class="no-details">No payment details available</td></tr>`
    return `
      <div class="payment-method">
        <h4 class="method-title">${m.name}</h4>
        <table class="payment-table">
          ${detailRows}
        </table>
      </div>`
  }).join("")

  const subtotal = (order.subtotal / 100).toFixed(2)
  const tax = (order.tax / 100).toFixed(2)
  const shipping = (order.shipping / 100).toFixed(2)
  const total = (order.total / 100).toFixed(2)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${order.orderNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      min-height: 100vh;
      padding: 40px 20px;
      color: #2d3748;
      line-height: 1.6;
    }
    
    .invoice-container {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      overflow: hidden;
      position: relative;
    }
    
    .invoice-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: linear-gradient(90deg, ${brandColor}, #e53e3e, #dd6b20, #d69e2e);
    }
    
    .header {
      background: linear-gradient(135deg, ${brandColor} 0%, ${brandColor}e6 100%);
      color: white;
      padding: 50px 60px;
      position: relative;
      overflow: hidden;
    }
    
    .header::after {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 300px;
      height: 300px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      transform: rotate(45deg);
    }
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      position: relative;
      z-index: 2;
    }
    
    .company-info h1 {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }
    
    .company-tagline {
      font-size: 14px;
      opacity: 0.9;
      font-weight: 300;
    }
    
    .owner-tag {
      font-size: 12px;
      opacity: 0.8;
      font-weight: 500;
      margin-top: 5px;
      background: rgba(255, 255, 255, 0.2);
      padding: 4px 8px;
      border-radius: 4px;
      display: inline-block;
    }
    
    .invoice-meta {
      text-align: right;
    }
    
    .invoice-number {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .invoice-date {
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 20px;
    }
    
    .total-badge {
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      padding: 20px 25px;
      border-radius: 15px;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    
    .total-label {
      font-size: 12px;
      font-weight: 500;
      opacity: 0.8;
      margin-bottom: 5px;
      letter-spacing: 1px;
    }
    
    .total-amount {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    
    .content {
      padding: 60px;
    }
    
    .section {
      margin-bottom: 50px;
    }
    
    .section-title {
      font-size: 20px;
      font-weight: 600;
      color: ${brandColor};
      margin-bottom: 25px;
      position: relative;
      padding-bottom: 10px;
    }
    
    .section-title::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 60px;
      height: 3px;
      background: linear-gradient(90deg, ${brandColor}, ${brandColor}80);
      border-radius: 2px;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    .items-table thead {
      background: linear-gradient(135deg, ${brandColor}15, ${brandColor}08);
    }
    
    .items-table th {
      padding: 20px 24px;
      text-align: left;
      font-weight: 600;
      font-size: 14px;
      color: ${brandColor};
      letter-spacing: 0.5px;
      text-transform: uppercase;
      border-bottom: 2px solid ${brandColor}20;
    }
    
    .items-table th.qty,
    .items-table th.unit,
    .items-table th.total {
      text-align: right;
    }
    
    .items-table tbody tr {
      border-bottom: 1px solid #e2e8f0;
      transition: background-color 0.2s ease;
    }
    
    .items-table tbody tr:hover {
      background-color: #f8fafc;
    }
    
    .items-table td {
      padding: 20px 24px;
      font-size: 15px;
    }
    
    .item-name {
      font-weight: 500;
      color: #2d3748;
    }
    
    .qty {
      text-align: right;
      font-weight: 600;
      color: #4a5568;
    }
    
    .unit,
    .total {
      text-align: right;
      font-weight: 500;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
    }
    
    .summary-row {
      background: ${brandColor}08;
      font-weight: 600;
    }
    
    .summary-row td {
      border-top: 1px solid ${brandColor}20;
    }
    
    .total-row {
      background: linear-gradient(135deg, ${brandColor}, ${brandColor}e6);
      color: white;
      font-weight: 700;
      font-size: 16px;
    }
    
    .total-row td {
      border: none;
      padding: 24px;
    }
    
    .payment-methods {
      display: grid;
      gap: 25px;
    }
    
    .payment-method {
      background: linear-gradient(135deg, #f8fafc, #edf2f7);
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 30px;
      position: relative;
      overflow: hidden;
    }
    
    .payment-method::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background: ${brandColor};
    }
    
    .method-title {
      font-size: 18px;
      font-weight: 600;
      color: ${brandColor};
      margin-bottom: 20px;
      display: flex;
      align-items: center;
    }
    
    .method-title::before {
      content: '💳';
      margin-right: 10px;
      font-size: 20px;
    }
    
    .payment-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .payment-table td {
      padding: 12px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .payment-table tr:last-child td {
      border-bottom: none;
    }
    
    .detail-key {
      font-weight: 600;
      color: #4a5568;
      width: 40%;
      text-transform: capitalize;
    }
    
    .detail-value {
      color: #2d3748;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      font-size: 14px;
    }
    
    .no-details {
      text-align: center;
      color: #a0aec0;
      font-style: italic;
    }
    
    .footer {
      background: linear-gradient(135deg, #f8fafc, #edf2f7);
      padding: 40px 60px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer-content {
      max-width: 600px;
      margin: 0 auto;
    }
    
    .thank-you {
      font-size: 18px;
      font-weight: 600;
      color: ${brandColor};
      margin-bottom: 10px;
    }
    
    .footer-text {
      color: #718096;
      font-size: 14px;
      line-height: 1.6;
    }
    
    .contact-info {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #a0aec0;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .invoice-container {
        box-shadow: none;
        border-radius: 0;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <header class="header">
      <div class="header-content">
        <div class="company-info">
          <h1>Àníkẹ́ Bákàrè</h1>
          <div class="company-tagline">Exclusive Fashion & Luxury Goods</div>
          ${order.userId?.ownerTag ? `<div class="owner-tag">Owner: ${order.userId.ownerTag}</div>` : ''}
        </div>
        <div class="invoice-meta">
          <div class="invoice-number">Invoice #${order.orderNumber}</div>
          <div class="invoice-date">${new Date(order.createdAt).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</div>
          <div class="total-badge">
            <div class="total-label">TOTAL AMOUNT</div>
            <div class="total-amount">₦${total}</div>
          </div>
        </div>
      </div>
    </header>

    <main class="content">
      <section class="section">
        <h2 class="section-title">Order Items</h2>
        <table class="items-table">
          <thead>
            <tr>
              <th>Item Description</th>
              <th class="qty">Qty</th>
              <th class="unit">Unit Price</th>
              <th class="total">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
            <tr class="summary-row">
              <td colspan="3">Subtotal</td>
              <td class="total">₦${subtotal}</td>
            </tr>
            <tr class="summary-row">
              <td colspan="3">Tax</td>
              <td class="total">₦${tax}</td>
            </tr>
            <tr class="summary-row">
              <td colspan="3">Shipping & Handling</td>
              <td class="total">₦${shipping}</td>
            </tr>
            <tr class="total-row">
              <td colspan="3">TOTAL AMOUNT</td>
              <td class="total">₦${total}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="section">
        <h2 class="section-title">Payment Information</h2>
        <div class="payment-methods">
          ${methodsHtml}
        </div>
      </section>
    </main>

    <footer class="footer">
      <div class="footer-content">
        <div class="thank-you">Thank you for your purchase!</div>
        <div class="footer-text">
          We appreciate your business and trust in our exclusive limited edition products. 
          Your order will be processed with the utmost care and attention to detail.
        </div>
        <div class="contact-info">
          For questions or support, please contact us at support@limitededitionspec.com
        </div>
      </div>
    </footer>
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
  let page = pdfDoc.addPage([595, 842])
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const { width, height } = page.getSize()
  const margin = 40
  let currentY = height - 60

  const sanitizeText = (text: string): string => {
    return text.replace(/[^\x00-\x7F]/g, '')
  }

  const drawText = (text: string, x: number, y: number, options: { size?: number, font?: any, color?: [number,number,number] } = {}) => {
    const size = options.size || 12
    const font = options.font || helvetica
    const color = options.color ? rgb(options.color[0], options.color[1], options.color[2]) : rgb(0.2, 0.2, 0.2)
    const safeText = sanitizeText(text)
    page.drawText(safeText, { x, y, size, font, color })
  }

  const drawRightText = (text: string, rightX: number, y: number, options: { size?: number, font?: any, color?: [number,number,number] } = {}) => {
    const size = options.size || 12
    const font = options.font || helvetica
    const safeText = sanitizeText(text)
    const textWidth = font.widthOfTextAtSize(safeText, size)
    drawText(safeText, rightX - textWidth, y, options)
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

  // Header background
  page.drawRectangle({ x: 0, y: height - 120, width: width, height: 120, color: rgb(r, g, b) })
  
  // Company info (left)
  drawText('LIMITED EDITION SPEC', margin, height - 50, { size: 24, font: helveticaBold, color: [1,1,1] })
  drawText('Exclusive Fashion & Luxury Goods', margin, height - 75, { size: 11, color: [0.9,0.9,0.9] })
  if (order.userId?.ownerTag) {
    drawText(`Owner: ${order.userId.ownerTag}`, margin, height - 95, { size: 10, color: [0.8,0.8,0.8] })
  }
  
  // Invoice details (right)
  drawRightText(`Invoice #${order.orderNumber}`, width - margin, height - 50, { size: 16, font: helveticaBold, color: [1,1,1] })
  drawRightText(`${new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, width - margin, height - 70, { size: 11, color: [0.9,0.9,0.9] })
  
  // Total badge
  const badgeWidth = 160
  const badgeX = width - margin - badgeWidth
  page.drawRectangle({ x: badgeX, y: height - 110, width: badgeWidth, height: 35, color: rgb(1, 1, 1), opacity: 0.2 })
  drawText('TOTAL AMOUNT', badgeX + 10, height - 85, { size: 9, color: [0.9,0.9,0.9] })
  drawRightText(`NGN${(order.total / 100).toFixed(2)}`, width - margin - 10, height - 100, { size: 20, font: helveticaBold, color: [1,1,1] })

  // Content area
  currentY = height - 160
  drawText('ORDER ITEMS', margin, currentY, { size: 18, font: helveticaBold, color: [r,g,b] })
  page.drawLine({ start: { x: margin, y: currentY - 5 }, end: { x: margin + 100, y: currentY - 5 }, thickness: 3, color: rgb(r, g, b) })
  currentY -= 35
  
  // Table setup
  const tableWidth = width - 2 * margin
  const colX = [margin + 5, margin + 300, margin + 380, margin + 450]
  
  // Table header
  page.drawRectangle({ x: margin, y: currentY - 5, width: tableWidth, height: 25, color: rgb(r, g, b), opacity: 0.1 })
  drawText('Item Description', colX[0], currentY + 5, { size: 11, font: helveticaBold, color: [r,g,b] })
  drawRightText('Qty', colX[1] + 50, currentY + 5, { size: 11, font: helveticaBold, color: [r,g,b] })
  drawRightText('Unit Price', colX[2] + 70, currentY + 5, { size: 11, font: helveticaBold, color: [r,g,b] })
  drawRightText('Total', colX[3] + 90, currentY + 5, { size: 11, font: helveticaBold, color: [r,g,b] })
  currentY -= 30
  
  // Items
  ;(order.items || []).forEach((it: any, index: number) => {
    if (currentY < 100) {
      page = pdfDoc.addPage([595, 842])
      currentY = height - 60
    }
    
    if (index % 2 === 0) {
      page.drawRectangle({ x: margin, y: currentY - 5, width: tableWidth, height: 20, color: rgb(0.98, 0.98, 0.98) })
    }
    
    const name = it.productId?.name || 'Item'
    const qty = it.quantity || 1
    const unit = (it.unitPrice / 100).toFixed(2)
    const total = (it.totalPrice / 100).toFixed(2)
    
    drawText(name, colX[0], currentY + 2, { size: 12, font: helveticaBold })
    drawRightText(qty.toString(), colX[1] + 50, currentY + 2, { size: 12 })
    drawRightText(`NGN${unit}`, colX[2] + 70, currentY + 2, { size: 12 })
    drawRightText(`NGN${total}`, colX[3] + 90, currentY + 2, { size: 12 })
    currentY -= 25
  })
  
  // Summary section
  currentY -= 10
  page.drawLine({ start: { x: margin, y: currentY }, end: { x: width - margin, y: currentY }, thickness: 1, color: rgb(0.8, 0.8, 0.8) })
  currentY -= 20
  
  const subtotal = (order.subtotal / 100).toFixed(2)
  const tax = (order.tax / 100).toFixed(2)
  const shipping = (order.shipping / 100).toFixed(2)
  const total = (order.total / 100).toFixed(2)
  
  const summaryX = width - 200
  drawText('Subtotal:', summaryX, currentY, { size: 12 })
  drawRightText(`NGN${subtotal}`, width - margin, currentY, { size: 12 })
  currentY -= 20
  
  drawText('Tax:', summaryX, currentY, { size: 12 })
  drawRightText(`NGN${tax}`, width - margin, currentY, { size: 12 })
  currentY -= 20
  
  drawText('Shipping & Handling:', summaryX, currentY, { size: 12 })
  drawRightText(`NGN${shipping}`, width - margin, currentY, { size: 12 })
  currentY -= 25
  
  // Total row
  page.drawRectangle({ x: summaryX - 10, y: currentY - 5, width: 210, height: 25, color: rgb(r, g, b) })
  drawText('TOTAL AMOUNT:', summaryX, currentY + 5, { size: 13, font: helveticaBold, color: [1,1,1] })
  drawRightText(`NGN${total}`, width - margin, currentY + 5, { size: 15, font: helveticaBold, color: [1,1,1] })
  currentY -= 50

  // Payment Information
  if (currentY < 200) {
    page = pdfDoc.addPage([595, 842])
    currentY = height - 60
  }
  
  drawText('PAYMENT INFORMATION', margin, currentY, { size: 18, font: helveticaBold, color: [r,g,b] })
  page.drawLine({ start: { x: margin, y: currentY - 5 }, end: { x: margin + 150, y: currentY - 5 }, thickness: 3, color: rgb(r, g, b) })
  currentY -= 30
  
  methods.forEach((m: any) => {
    page.drawRectangle({ x: margin, y: currentY + 15, width: tableWidth, height: 3, color: rgb(r, g, b) })
    drawText(`${m.name}`, margin, currentY, { size: 14, font: helveticaBold, color: [r,g,b] })
    currentY -= 25
    
    const details = m.details || {}
    if (Object.keys(details).length) {
      Object.entries(details).forEach(([k, v]) => {
        drawText(`${k}:`, margin + 20, currentY, { size: 11, font: helveticaBold })
        drawText(String(v), margin + 150, currentY, { size: 11 })
        currentY -= 18
      })
    } else {
      drawText('No payment details available', margin + 20, currentY, { size: 11, color: [0.6, 0.6, 0.6] })
      currentY -= 18
    }
    currentY -= 10
  })
  
  // Footer
  currentY -= 20
  page.drawLine({ start: { x: margin, y: currentY }, end: { x: width - margin, y: currentY }, thickness: 1, color: rgb(0.9, 0.9, 0.9) })
  currentY -= 25
  
  const centerX = width / 2
  const thankYouText = 'Thank you for your purchase!'
  const thankYouWidth = helveticaBold.widthOfTextAtSize(thankYouText, 14)
  drawText(thankYouText, centerX - thankYouWidth / 2, currentY, { size: 14, font: helveticaBold, color: [r,g,b] })
  currentY -= 20
  
  const supportText = 'We appreciate your business and trust in our exclusive limited edition products.'
  const supportWidth = helvetica.widthOfTextAtSize(supportText, 11)
  drawText(supportText, centerX - supportWidth / 2, currentY, { size: 11, color: [0.5, 0.5, 0.5] })
  currentY -= 20
  
  const contactText = 'For questions or support, please contact us at support@limitededitionspec.com'
  const contactWidth = helvetica.widthOfTextAtSize(contactText, 9)
  drawText(contactText, centerX - contactWidth / 2, currentY, { size: 9, color: [0.6, 0.6, 0.6] })

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    await connectToDatabase()

    const { id } = (await params) as { id: string }
    const authUserId = (user as any).userId || (user as any).id

    const order = await Order.findOne({ _id: id, userId: authUserId })
      .populate("items.productId", "name")
      .populate("userId", "firstName lastName email ownerTag")
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })

  const methods = await PaymentMethod.find({ enabled: true }).lean()

  // load brand color from settings (admin-configurable)
  const brandSetting: any = await Settings.findOne({ key: 'brandColor' }).lean()
  const brandColor = (brandSetting && brandSetting.value) ? String(brandSetting.value) : '#6b3d2e'

  const html = await buildInvoiceHtml(order, methods, brandColor)

    // Generate PDF using Puppeteer only
    const launchOptions: any = { 
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-web-security'], 
      headless: 'new',
      timeout: 60000
    }
    
    // Use system Chrome in production, fallback to bundled Chromium
    if (process.env.NODE_ENV === 'production') {
      // Try common Chrome/Chromium paths
      const chromePaths = [
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium'
      ]
      
      for (const path of chromePaths) {
        try {
          const fs = require('fs')
          if (fs.existsSync(path)) {
            launchOptions.executablePath = path
            break
          }
        } catch (e) {
          // Continue to next path
        }
      }
    } else if (process.platform === 'win32') {
      launchOptions.executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    }
    
    // Use pdf-lib directly for Vercel free tier compatibility
    try {
      const pdfBuffer = await buildInvoicePdf(order, methods, brandColor)
      return new NextResponse(pdfBuffer, { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/pdf', 
          'Content-Disposition': `attachment; filename="invoice-${order.orderNumber}.pdf"` 
        } 
      })
    } catch (pdfError) {
      console.log('PDF generation failed, returning HTML:', (pdfError as Error).message)
      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `inline; filename="invoice-${order.orderNumber}.html"`
        }
      })
    }
  } catch (err) {
    console.error('Failed to generate PDF invoice:', err)
    return NextResponse.json({ error: 'Failed to generate PDF invoice' }, { status: 500 })
  }
}
