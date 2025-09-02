"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import PaymentForm from "@/components/payment/PaymentForm"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Package, Truck } from "lucide-react"

export default function CheckoutPage() {
  const [order, setOrder] = useState<any>(null)
  const [shippingAddress, setShippingAddress] = useState({
    firstName: "",
    lastName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  })
  const [step, setStep] = useState<"shipping" | "payment">("shipping")
  const [isLoading, setIsLoading] = useState(true)
  const [globalPaymentMethods, setGlobalPaymentMethods] = useState<any[]>([])
  const router = useRouter()
  const { toast } = useToast()

  // get the dynamic route param from the client hook
  const params = useParams()
  const orderId = params?.orderId as string | undefined

  useEffect(() => {
    fetchOrder()
  }, [orderId])

  const fetchOrder = async () => {
    try {
  const response = await fetch(`/api/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const orderData = await response.json()
        setOrder(orderData)
      } else {
        toast({
          title: "Error",
          description: "Order not found",
          variant: "destructive",
        })
        router.push("/dashboard")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load order",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // public payment method details used for showing instructions on the payment step
    ;(async () => {
      try {
        const resp = await fetch('/api/payment-methods')
        if (!resp.ok) return
        const data = await resp.json()
        setGlobalPaymentMethods(data)
      } catch (e) {
        // ignore
      }
    })()
  }, [])

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
  const response = await fetch(`/api/orders/${orderId}/shipping`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ shippingAddress }),
      })

      if (response.ok) {
        setStep("payment")
      } else {
        toast({
          title: "Error",
          description: "Failed to save shipping address",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save shipping address",
        variant: "destructive",
      })
    }
  }

  const handlePaymentSuccess = () => {
  router.push(`/order-confirmation/${orderId}`)
  }

  const handlePaymentError = (error: string) => {
    console.error("Payment error:", error)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Loading checkout...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Order not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Checkout</h1>
          <p className="text-muted-foreground">Order #{order.orderNumber}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between">
                    <div>
                      <p className="font-medium">{item.productId.name}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">${(item.totalPrice / 100).toFixed(2)}</p>
                  </div>
                ))}
                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${(order.total / 100).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Checkout Form */}
          <div className="lg:col-span-2">
            {step === "shipping" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleShippingSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={shippingAddress.firstName}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, firstName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={shippingAddress.lastName}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, lastName: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="addressLine1">Address Line 1</Label>
                      <Input
                        id="addressLine1"
                        value={shippingAddress.addressLine1}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine1: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                      <Input
                        id="addressLine2"
                        value={shippingAddress.addressLine2}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine2: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={shippingAddress.city}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={shippingAddress.state}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        value={shippingAddress.postalCode}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" size="lg">
                      Continue to Payment
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {step === "payment" && orderId && (
              <PaymentForm
                orderId={orderId}
                amount={order.total}
                // available options are the keys of enabled global payment methods
                availableOptions={(globalPaymentMethods || []).map((m: any) => m.key)}
                methodDetails={globalPaymentMethods}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
