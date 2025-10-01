"use client"

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function OrderConfirmationPage() {
  const params = useParams()
  const orderId = params?.orderId as string | undefined
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<any>(null)
  const [waConfirmed, setWaConfirmed] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!orderId) return
    ;(async () => {
      try {
        const resp = await fetch(`/api/orders/${orderId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
        if (!resp.ok) {
          setOrder(null)
        } else {
          const orderData = await resp.json()
          setOrder(orderData)
          
          // Auto-download PDF invoice
          setTimeout(async () => {
            try {
              const token = localStorage.getItem('token')
              const pdfResp = await fetch(`/api/orders/${orderData._id}/invoice_pdf`, { headers: { Authorization: `Bearer ${token}` } })
              if (pdfResp.ok && pdfResp.headers.get('content-type')?.includes('application/pdf')) {
                const blob = await pdfResp.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `invoice-${orderData.orderNumber}.pdf`
                document.body.appendChild(a)
                a.click()
                a.remove()
                window.URL.revokeObjectURL(url)
              }
            } catch (e) {
              console.log('Auto PDF download failed:', e)
            }
          }, 1000)
        }
      } catch (e) {
        setOrder(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [orderId])

  useEffect(() => {
    ;(async () => {
      try {
        const token = localStorage.getItem('token')
        const resp = await fetch('/api/admin/settings', { headers: { Authorization: `Bearer ${token}` } })
        if (!resp.ok) return
        setSettings(await resp.json())
      } catch (e) {
        // ignore
      }
    })()
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!order) return <div className="min-h-screen flex items-center justify-center">Order not found</div>

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Order Confirmation</h1>
        <Card>
          <CardHeader>
            <CardTitle>Order #{order.orderNumber}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items.map((it: any, i: number) => (
                <div key={i} className="flex justify-between">
                  <div>
                    <div className="font-medium">{it.productId?.name}</div>
                    <div className="text-sm text-muted-foreground">Qty: {it.quantity}</div>
                  </div>
                  <div className="font-medium">₦{(it.totalPrice / 100).toFixed(2)}</div>
                </div>
              ))}

              <div className="border-t pt-4 flex justify-between font-bold">Total <span>₦{(order.total / 100).toFixed(2)}</span></div>

              <div className="pt-4">
                <div className="flex flex-col md:flex-row md:items-center md:gap-4">
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <input id="waConfirm" type="checkbox" checked={waConfirmed} onChange={(e) => setWaConfirmed((e.target as HTMLInputElement).checked)} className="w-4 h-4" />
                        <label htmlFor="waConfirm" className="font-bold text-lg text-yellow-800">IMPORTANT: You must confirm your order via WhatsApp to complete the purchase</label>
                      </div>
                      <p className="text-sm text-yellow-700 ml-6">Check this box to acknowledge that you will send payment confirmation through WhatsApp</p>
                    </div>
                    <Button onClick={() => router.push('/products')}>Continue Shopping</Button>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={async () => {
                      try {
                        const token = localStorage.getItem('token')
                        const resp = await fetch(`/api/orders/${order._id}/invoice_pdf`, { headers: { Authorization: `Bearer ${token}` } })
                        if (!resp.ok) {
                          console.error('Invoice PDF request failed')
                          return
                        }
                        const contentType = resp.headers.get('content-type') || ''
                        if (contentType.includes('application/pdf')) {
                          const blob = await resp.blob()
                          const url = window.URL.createObjectURL(blob)
                          // On mobile many browsers will open PDF blobs in a new tab — use that where possible
                          if (navigator.userAgent.match(/Mobi|Android/i)) {
                            window.open(url, '_blank')
                            // We still revoke after a short delay to allow the browser to load it
                            setTimeout(() => window.URL.revokeObjectURL(url), 10000)
                          } else {
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `invoice-${order.orderNumber}.pdf`
                            document.body.appendChild(a)
                            a.click()
                            a.remove()
                            window.URL.revokeObjectURL(url)
                          }
                        } else if (contentType.includes('text/html')) {
                          // Server returned HTML fallback; open in a new tab for printing on mobile
                          const html = await resp.text()
                          const newWin = window.open('', '_blank')
                          if (newWin) {
                            newWin.document.open()
                            newWin.document.write(html)
                            newWin.document.close()
                          } else {
                            // Fallback: download as .html so user can open externally
                            const blob = new Blob([html], { type: 'text/html' })
                            const url = window.URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `invoice-${order.orderNumber}.html`
                            document.body.appendChild(a)
                            a.click()
                            a.remove()
                            window.URL.revokeObjectURL(url)
                          }
                        } else {
                          console.error('Unexpected content type for invoice:', contentType)
                        }
                      } catch (e) {
                        console.error('Failed to download PDF invoice', e)
                      }
                    }}>Download Invoice (PDF)</Button>

                    {settings?.whatsappNumber && (
                      <Button onClick={() => {
                        if (!waConfirmed) { alert('Please check the confirmation box before contacting WhatsApp.') ; return }
                        const phone = settings.whatsappNumber.replace(/[^0-9+]/g, '')
                        const text = encodeURIComponent(`Hi, I have completed payment for order ${order.orderNumber}. Please confirm.`)
                        const waUrl = `https://wa.me/${phone.replace(/\+/g, '')}?text=${text}`
                        window.open(waUrl, '_blank')
                      }}>Confirm via WhatsApp</Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
