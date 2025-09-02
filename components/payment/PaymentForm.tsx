"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"

interface PaymentFormProps {
  orderId: string
  amount: number
  availableOptions: string[] // e.g. ["bank_transfer","crypto"]
  methodDetails?: Array<{ key: string; name: string; details?: Record<string, any> }>
  onSuccess: () => void
  onError: (error: string) => void
}

export default function PaymentForm({ orderId, amount, availableOptions, methodDetails = [], onSuccess, onError }: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  // guard: ensure availableOptions is an array and has at least one entry
  const safeOptions = Array.isArray(availableOptions) && availableOptions.length ? availableOptions : ["bank_transfer"]
  const [method, setMethod] = useState<string>(safeOptions[0])
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    try {
      const resp = await fetch(`/api/orders/${orderId}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ method }),
      })

      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || "Payment failed")

      // server should return an invoice HTML or URL
      if (data.invoiceHtml) {
        // open in new tab as downloadable invoice
        const win = window.open()
        if (win) {
          win.document.write(data.invoiceHtml)
          win.document.close()
        }
      }

      toast({ title: "Payment recorded", description: "Invoice is available for download." })
      onSuccess()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Payment failed"
      toast({ title: "Payment failed", description: msg, variant: "destructive" })
      onError(String(msg))
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Options</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <RadioGroup value={method} onValueChange={(v) => setMethod(v)}>
            {safeOptions.includes("bank_transfer") && (
              <label className="flex items-center gap-2">
                <input type="radio" name="payment" value="bank_transfer" checked={method === "bank_transfer"} onChange={() => setMethod("bank_transfer")} />
                Bank Transfer
              </label>
            )}
            {safeOptions.includes("crypto") && (
              <label className="flex items-center gap-2">
                <input type="radio" name="payment" value="crypto" checked={method === "crypto"} onChange={() => setMethod("crypto")} />
                Crypto
              </label>
            )}
          </RadioGroup>

          {safeOptions.length === 0 && (
            <div className="text-sm text-muted-foreground">No payment options configured for this order.</div>
          )}

          {/* show details for selected method if available */}
          {methodDetails && methodDetails.length > 0 && (
            (() => {
              const md = methodDetails.find((m) => m.key === method)
              if (!md) return null
              const d = md.details || {}
              return (
                <div className="mt-4 p-3 border rounded bg-muted/5 text-sm">
                  <div className="font-medium mb-2">{md.name} details</div>
                  {Object.keys(d).length === 0 ? (
                    <div className="text-muted-foreground">No instructions provided.</div>
                  ) : (
                    <ul className="list-disc pl-5 space-y-1">
                      {Object.entries(d).map(([k, v]) => (
                        <li key={k}>
                          <strong className="capitalize">{k.replace(/_/g, " ")}:</strong> {String(v)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })()
          )}

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold">${(amount / 100).toFixed(2)}</span>
            </div>

            <Button type="submit" disabled={isProcessing} className="w-full" size="lg">
              {isProcessing ? "Processing..." : `Confirm ${method.replace("_", " ")}`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
