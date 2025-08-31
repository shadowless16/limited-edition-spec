"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { CreditCard, Lock } from "lucide-react"

interface PaymentFormProps {
  orderId: string
  amount: number
  onSuccess: () => void
  onError: (error: string) => void
}

export default function PaymentForm({ orderId, amount, onSuccess, onError }: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvc: "",
    name: "",
  })
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      const response = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ orderId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Payment failed")
      }

      await new Promise((resolve) => setTimeout(resolve, 2000))

      const updateResponse = await fetch(`/api/orders/${orderId}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          paymentIntentId: data.paymentIntentId,
          status: "paid",
        }),
      })

      if (updateResponse.ok) {
        toast({
          title: "Payment successful!",
          description: "Your order has been confirmed.",
        })
        onSuccess()
      } else {
        throw new Error("Failed to confirm payment")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Payment failed"
      toast({
        title: "Payment failed",
        description: errorMessage,
        variant: "destructive",
      })
      onError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const formatCardNumber = (value: string) => {
    return value
      .replace(/\s/g, "")
      .replace(/(.{4})/g, "$1 ")
      .trim()
  }

  const formatExpiry = (value: string) => {
    return value.replace(/\D/g, "").replace(/(\d{2})(\d)/, "$1/$2")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardName">Cardholder Name</Label>
            <Input
              id="cardName"
              value={cardDetails.name}
              onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              value={cardDetails.number}
              onChange={(e) =>
                setCardDetails({
                  ...cardDetails,
                  number: formatCardNumber(e.target.value),
                })
              }
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry Date</Label>
              <Input
                id="expiry"
                value={cardDetails.expiry}
                onChange={(e) =>
                  setCardDetails({
                    ...cardDetails,
                    expiry: formatExpiry(e.target.value),
                  })
                }
                placeholder="MM/YY"
                maxLength={5}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvc">CVC</Label>
              <Input
                id="cvc"
                value={cardDetails.cvc}
                onChange={(e) =>
                  setCardDetails({
                    ...cardDetails,
                    cvc: e.target.value.replace(/\D/g, ""),
                  })
                }
                placeholder="123"
                maxLength={4}
                required
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold">${(amount / 100).toFixed(2)}</span>
            </div>

            <Button type="submit" disabled={isProcessing} className="w-full" size="lg">
              <Lock className="w-4 h-4 mr-2" />
              {isProcessing ? "Processing..." : `Pay $${(amount / 100).toFixed(2)}`}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            Your payment information is secure and encrypted
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
