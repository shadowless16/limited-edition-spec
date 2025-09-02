"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, X } from "lucide-react"
import ImageUpload from "./ImageUpload"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

interface ProductForEdit {
  _id: string
  name: string
  description?: string
  sku: string
  basePrice: number
  currentPhase: "waitlist" | "originals" | "echo"
  status: "active" | "paused" | "ended"
  variants: Variant[]
  images: string[]
  releasePhases?: any
  paymentOptions?: string[]
}

interface Variant {
  color: string
  material: string
  stock: number
  reserved: number
}

interface CreateProductModalProps {
  onProductCreated?: () => void
  product?: ProductForEdit
  onProductUpdated?: () => void
  children?: React.ReactNode
}

export default function CreateProductModal({ onProductCreated, product, onProductUpdated, children }: CreateProductModalProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    basePrice: "",
    currentPhase: "waitlist" as "waitlist" | "originals" | "echo",
    status: "active" as "active" | "paused" | "ended",
  paymentOptions: [] as string[],
  })
  const [releasePhases, setReleasePhases] = useState({
    waitlistStart: "",
    waitlistEnd: "",
    originalsStart: "",
    originalsEnd: "",
    originalsMaxQuantity: "",
    echoStart: "",
    echoEnd: "",
  })
  const [errors, setErrors] = useState<string[]>([])
  const [variants, setVariants] = useState<Variant[]>([{ color: "", material: "", stock: 0, reserved: 0 }])
  const [images, setImages] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // client-side validation
    const validationErrors: string[] = []

    if (!formData.name) validationErrors.push("Product name is required")
    if (!formData.sku) validationErrors.push("SKU is required")
    if (!formData.basePrice) validationErrors.push("Base price is required")

    // parse dates if provided
    const parseDate = (s: string) => (s ? new Date(s) : null)
    const wStart = parseDate(releasePhases.waitlistStart)
    const wEnd = parseDate(releasePhases.waitlistEnd)
    const oStart = parseDate(releasePhases.originalsStart)
    const oEnd = parseDate(releasePhases.originalsEnd)
    const eStart = parseDate(releasePhases.echoStart)
    const eEnd = parseDate(releasePhases.echoEnd)

    if (wStart && wEnd && wStart >= wEnd) validationErrors.push("Waitlist start must be before waitlist end")
    if (oStart && oEnd && oStart >= oEnd) validationErrors.push("Originals start must be before originals end")
    if (eStart && eEnd && eStart >= eEnd) validationErrors.push("Echo start must be before echo end")

  // ensure maxQ is a number (use NaN when not provided) so TypeScript knows it's numeric
  const maxQ = releasePhases.originalsMaxQuantity ? Number(releasePhases.originalsMaxQuantity) : NaN
  if (releasePhases.originalsMaxQuantity && (!Number.isFinite(maxQ) || maxQ <= 0)) validationErrors.push("Originals max quantity must be a positive number")

    if (validationErrors.length) {
      setErrors(validationErrors)
      setIsLoading(false)
      return
    }

    try {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

      // build releasePhases payload only if any fields provided
      const hasPhaseData = wStart || wEnd || oStart || oEnd || eStart || eEnd || maxQ
      const releasePhasesPayload: any = hasPhaseData
        ? {
            waitlist: wStart || wEnd ? { startDate: releasePhases.waitlistStart || undefined, endDate: releasePhases.waitlistEnd || undefined } : undefined,
            originals:
              oStart || oEnd || maxQ
                ? { startDate: releasePhases.originalsStart || undefined, endDate: releasePhases.originalsEnd || undefined, maxQuantity: maxQ || undefined }
                : undefined,
            echo: eStart || eEnd ? { startDate: releasePhases.echoStart || undefined, endDate: releasePhases.echoEnd || undefined } : undefined,
          }
        : undefined

      const url = product ? `/api/admin/products/${product._id}` : "/api/admin/products"
      const method = product ? "PATCH" : "POST"

      // sanitize images: ensure only non-empty strings are sent
      const sanitizedImages = Array.isArray(images) ? images.filter((i) => typeof i === "string" && i.trim().length > 0) : []

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          ...formData,
          basePrice: Number.parseInt(formData.basePrice) * 100, // Convert to cents
          variants: variants.filter((v) => v.color && v.material),
          images: sanitizedImages,
          releasePhases: releasePhasesPayload,
        }),
      })

      const respJson = await response.json().catch(() => ({}))
      if (response.ok) {
        setOpen(false)
        if (product) onProductUpdated && onProductUpdated()
        else onProductCreated && onProductCreated()
        // Reset form
        setFormData({
          name: "",
          description: "",
          sku: "",
          basePrice: "",
          currentPhase: "waitlist",
          status: "active",
          paymentOptions: [],
        })
        setVariants([{ color: "", material: "", stock: 0, reserved: 0 }])
        setImages([])
        setReleasePhases({ waitlistStart: "", waitlistEnd: "", originalsStart: "", originalsEnd: "", originalsMaxQuantity: "", echoStart: "", echoEnd: "" })
        setErrors([])
      } else {
        // show server validation errors if present
        const serverErrors: string[] = []
        if (respJson?.error) serverErrors.push(String(respJson.error))
        if (respJson?.details) serverErrors.push(JSON.stringify(respJson.details))
        if (!serverErrors.length) serverErrors.push("Failed to create product")
        setErrors(serverErrors)
      }
    } catch (error) {
      console.error("Error creating product:", error)
      setErrors([String(error)])
    } finally {
      setIsLoading(false)
    }
  }

  const addVariant = () => {
    setVariants([...variants, { color: "", material: "", stock: 0, reserved: 0 }])
  }

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index))
  }

  const updateVariant = (index: number, field: keyof Variant, value: string | number) => {
    const updated = [...variants]
    updated[index] = { ...updated[index], [field]: value }
    setVariants(updated)
  }

  // Prefill when editing
  useEffect(() => {
    if (open && product) {
  // debug: surface paymentOptions when editing so we can confirm the field is present
  // (helps troubleshoot 'payment options not visible' reports)
  // eslint-disable-next-line no-console
  console.debug("[CreateProductModal] prefill paymentOptions=", product.paymentOptions)
      setFormData({
        name: product.name || "",
        description: product.description || "",
        sku: product.sku || "",
        basePrice: ((product.basePrice || 0) / 100).toString(),
        currentPhase: product.currentPhase || "waitlist",
        status: product.status || "active",
  paymentOptions: product.paymentOptions || [],
      })
      setVariants(product.variants?.length ? product.variants : [{ color: "", material: "", stock: 0, reserved: 0 }])
      setImages(product.images || [])
      // load release phases into string inputs if present
      const rp = product.releasePhases || {}
      setReleasePhases({
        waitlistStart: rp.waitlist?.startDate ? new Date(rp.waitlist.startDate).toISOString().slice(0, 10) : "",
        waitlistEnd: rp.waitlist?.endDate ? new Date(rp.waitlist.endDate).toISOString().slice(0, 10) : "",
        originalsStart: rp.originals?.startDate ? new Date(rp.originals.startDate).toISOString().slice(0, 10) : "",
        originalsEnd: rp.originals?.endDate ? new Date(rp.originals.endDate).toISOString().slice(0, 10) : "",
        originalsMaxQuantity: rp.originals?.maxQuantity ? String(rp.originals.maxQuantity) : "",
        echoStart: rp.echo?.startDate ? new Date(rp.echo.startDate).toISOString().slice(0, 10) : "",
        echoEnd: rp.echo?.endDate ? new Date(rp.echo.endDate).toISOString().slice(0, 10) : "",
      })
    }
  }, [open, product])

  // Simple DatePicker control using Popover + Calendar
  function DatePicker({ value, onChange }: { value: string; onChange: (d: string) => void }) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Input readOnly value={value} />
        </PopoverTrigger>
        <PopoverContent>
          <Calendar
            mode="single"
            selected={value ? new Date(value) : undefined}
            onSelect={(date: Date | undefined) => {
              if (!date) return
              const iso = date.toISOString().slice(0, 10)
              onChange(iso)
            }}
          />
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? (
          children as React.ReactElement
        ) : (
          <Button>{product ? "Edit Product" : "Create New Product"}</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Create New Product"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="basePrice">Base Price ($)</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    step="0.01"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="currentPhase">Initial Phase</Label>
                  <Select
                    value={formData.currentPhase}
                    onValueChange={(value: "waitlist" | "originals" | "echo") =>
                      setFormData({ ...formData, currentPhase: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="waitlist">Waitlist</SelectItem>
                      <SelectItem value="originals">Originals</SelectItem>
                      <SelectItem value="echo">Echo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "active" | "paused" | "ended") =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="ended">Ended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Payment Options moved into a dedicated card below for visibility */}
              </div>
            </CardContent>
          </Card>

          {/* Payment Options - separate card to make it more visible in the modal */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Options</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">Select which payment methods are accepted for this product. These are shown on the admin list and at checkout.</p>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    data-testid="payment-bank"
                    type="checkbox"
                    checked={formData.paymentOptions.includes("bank_transfer")}
                    onChange={() => {
                      const next = formData.paymentOptions.includes("bank_transfer")
                        ? formData.paymentOptions.filter((p) => p !== "bank_transfer")
                        : [...formData.paymentOptions, "bank_transfer"]
                      setFormData({ ...formData, paymentOptions: next })
                    }}
                  />
                  Bank Transfer
                </label>
                <label className="flex items-center gap-2">
                  <input
                    data-testid="payment-crypto"
                    type="checkbox"
                    checked={formData.paymentOptions.includes("crypto")}
                    onChange={() => {
                      const next = formData.paymentOptions.includes("crypto")
                        ? formData.paymentOptions.filter((p) => p !== "crypto")
                        : [...formData.paymentOptions, "crypto"]
                      setFormData({ ...formData, paymentOptions: next })
                    }}
                  />
                  Crypto
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Product Images</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload images={images} onImagesChange={setImages} maxImages={5} />
            </CardContent>
          </Card>

          {/* Variants */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Product Variants</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Variant
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {variants.map((variant, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Color</Label>
                      <Input
                        value={variant.color}
                        onChange={(e) => updateVariant(index, "color", e.target.value)}
                        placeholder="e.g., Black"
                      />
                    </div>
                    <div>
                      <Label>Material</Label>
                      <Input
                        value={variant.material}
                        onChange={(e) => updateVariant(index, "material", e.target.value)}
                        placeholder="e.g., Leather"
                      />
                    </div>
                    <div>
                      <Label>Stock</Label>
                      <Input
                        type="number"
                        value={variant.stock}
                        onChange={(e) => updateVariant(index, "stock", Number.parseInt(e.target.value) || 0)}
                        min="0"
                      />
                    </div>
                    <div className="flex items-end">
                      {variants.length > 1 && (
                        <Button type="button" variant="outline" size="sm" onClick={() => removeVariant(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Release Phases */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Release Phases</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="waitlistStart">Waitlist Start</Label>
                  <DatePicker value={releasePhases.waitlistStart} onChange={(d) => setReleasePhases({ ...releasePhases, waitlistStart: d })} />
                </div>
                <div>
                  <Label htmlFor="waitlistEnd">Waitlist End</Label>
                  <DatePicker value={releasePhases.waitlistEnd} onChange={(d) => setReleasePhases({ ...releasePhases, waitlistEnd: d })} />
                </div>
                <div>
                  <Label htmlFor="originalsMaxQuantity">Originals Max Quantity</Label>
                  <Input
                    id="originalsMaxQuantity"
                    type="number"
                    value={releasePhases.originalsMaxQuantity}
                    onChange={(e) => setReleasePhases({ ...releasePhases, originalsMaxQuantity: e.target.value })}
                    min={1}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="originalsStart">Originals Start</Label>
                  <DatePicker value={releasePhases.originalsStart} onChange={(d) => setReleasePhases({ ...releasePhases, originalsStart: d })} />
                </div>
                <div>
                  <Label htmlFor="originalsEnd">Originals End</Label>
                  <DatePicker value={releasePhases.originalsEnd} onChange={(d) => setReleasePhases({ ...releasePhases, originalsEnd: d })} />
                </div>
                <div>
                  <Label htmlFor="echoStart">Echo Start</Label>
                  <DatePicker value={releasePhases.echoStart} onChange={(d) => setReleasePhases({ ...releasePhases, echoStart: d })} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="echoEnd">Echo End</Label>
                  <DatePicker value={releasePhases.echoEnd} onChange={(d) => setReleasePhases({ ...releasePhases, echoEnd: d })} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* render validation/server errors inside the modal form */}
          {errors.length > 0 && (
            <div className="mb-4 text-sm text-red-600">
              <ul>
                {errors.map((err, i) => (
                  <li key={i} className="py-1">
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (product ? "Saving..." : "Creating...") : product ? "Save" : "Create Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
