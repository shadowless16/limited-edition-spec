"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Package, Truck, CheckCircle, Clock } from "lucide-react"

interface Order {
  _id: string
  orderNumber: string
  userId: { email: string; firstName: string; lastName: string; ownerTag?: string }
  items: Array<{
    productId: { name: string; sku: string }
    quantity: number
    unitPrice: number
  }>
  total: number
  status: string
  fulfillmentStatus: string
  trackingNumber?: string
  shippingCarrier?: string
  estimatedDelivery?: string
  fulfillmentNotes?: string
  createdAt: string
}

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/admin/orders", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateFulfillment = async (orderId: string, updates: any) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/fulfillment`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        toast({
          title: "Order updated",
          description: "Fulfillment status updated successfully",
        })
        fetchOrders()
        setSelectedOrder(null)
      } else {
        throw new Error("Update failed")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const getFulfillmentIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "processing":
        return <Package className="h-4 w-4" />
      case "packed":
        return <Package className="h-4 w-4" />
      case "shipped":
        return <Truck className="h-4 w-4" />
      case "delivered":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getFulfillmentColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-gray-500"
      case "processing":
        return "bg-blue-500"
      case "packed":
        return "bg-purple-500"
      case "shipped":
        return "bg-green-500"
      case "delivered":
        return "bg-emerald-600"
      default:
        return "bg-gray-500"
    }
  }

  if (isLoading) {
    return <div className="animate-pulse space-y-4">Loading orders...</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {orders.map((order) => (
          <Card key={order._id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedOrder(order)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{order.orderNumber}</span>
                    <Badge className={getFulfillmentColor(order.fulfillmentStatus)}>
                      {getFulfillmentIcon(order.fulfillmentStatus)}
                      <span className="ml-1 capitalize">{order.fulfillmentStatus}</span>
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {order.userId.firstName} {order.userId.lastName} • {order.userId.email}
                    {order.userId.ownerTag && <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded">Owner: {order.userId.ownerTag}</span>}
                  </p>
                  <p className="text-sm">
                    {order.items.length} item(s) • ${(order.total / 100).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">${(order.total / 100).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Click for details</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Order {selectedOrder.orderNumber}
                <Button variant="ghost" onClick={() => setSelectedOrder(null)}>
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Order Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Customer Details</h3>
                  <p>{selectedOrder.userId.firstName} {selectedOrder.userId.lastName}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.userId.email}</p>
                  {selectedOrder.userId.ownerTag && (
                    <p className="text-sm text-primary font-medium mt-1">Owner Tag: {selectedOrder.userId.ownerTag}</p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Order Info</h3>
                  <p>Status: <Badge>{selectedOrder.status}</Badge></p>
                  <p>Total: ${(selectedOrder.total / 100).toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Created: {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-2">Items</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium">{item.productId.name}</p>
                        <p className="text-sm text-muted-foreground">SKU: {item.productId.sku}</p>
                      </div>
                      <div className="text-right">
                        <p>Qty: {item.quantity}</p>
                        <p>${(item.unitPrice / 100).toFixed(2)} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Fulfillment Form */}
              <div>
                <h3 className="font-semibold mb-2">Fulfillment</h3>
                <FulfillmentForm order={selectedOrder} onUpdate={updateFulfillment} isUpdating={isUpdating} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function FulfillmentForm({
  order,
  onUpdate,
  isUpdating,
}: {
  order: Order
  onUpdate: (orderId: string, updates: any) => void
  isUpdating: boolean
}) {
  const [fulfillmentStatus, setFulfillmentStatus] = useState(order.fulfillmentStatus)
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || "")
  const [shippingCarrier, setShippingCarrier] = useState(order.shippingCarrier || "")
  const [estimatedDelivery, setEstimatedDelivery] = useState(
    order.estimatedDelivery ? new Date(order.estimatedDelivery).toISOString().split("T")[0] : "",
  )
  const [fulfillmentNotes, setFulfillmentNotes] = useState(order.fulfillmentNotes || "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(order._id, {
      fulfillmentStatus,
      trackingNumber: trackingNumber || undefined,
      shippingCarrier: shippingCarrier || undefined,
      estimatedDelivery: estimatedDelivery || undefined,
      fulfillmentNotes: fulfillmentNotes || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Fulfillment Status</Label>
          <Select value={fulfillmentStatus} onValueChange={setFulfillmentStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="packed">Packed</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Shipping Carrier</Label>
          <Select value={shippingCarrier} onValueChange={setShippingCarrier}>
            <SelectTrigger>
              <SelectValue placeholder="Select carrier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ups">UPS</SelectItem>
              <SelectItem value="fedex">FedEx</SelectItem>
              <SelectItem value="usps">USPS</SelectItem>
              <SelectItem value="dhl">DHL</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tracking Number</Label>
          <Input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Enter tracking number"
          />
        </div>

        <div className="space-y-2">
          <Label>Estimated Delivery</Label>
          <Input type="date" value={estimatedDelivery} onChange={(e) => setEstimatedDelivery(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Fulfillment Notes</Label>
        <Textarea
          value={fulfillmentNotes}
          onChange={(e) => setFulfillmentNotes(e.target.value)}
          placeholder="Add any notes about fulfillment..."
          rows={3}
        />
      </div>

      <Button type="submit" disabled={isUpdating} className="w-full">
        {isUpdating ? "Updating..." : "Update Fulfillment"}
      </Button>
    </form>
  )
}
