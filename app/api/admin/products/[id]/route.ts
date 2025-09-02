import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { Product } from "@/models/Product"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()
  // `params` may be a Promise in Next.js App Router; await before using
  const { id } = await params as { id: string }
  const product = await Product.findByIdAndDelete(id)

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()
    const data = await request.json()
  // `params` may be a Promise in Next.js App Router; await before using
  const { id } = await params as { id: string }
  const product = await Product.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()
    const data = await request.json()
      // `params` may be a Promise in Next.js App Router; await before using
    const { id } = (await params) as { id: string }

    // Normalize incoming fields similar to the POST handler so partial updates behave as expected.
    const {
      sku,
      name,
      description,
      basePrice,
      images,
      variants,
      status,
      currentPhase,
  releasePhases: inputReleasePhases,
  paymentOptions,
    } = data || {}

    const parsedBasePrice = typeof basePrice === "string" ? Number.parseInt(basePrice) : basePrice

    // sanitize images array
    const sanitizedImages = Array.isArray(images) ? images.filter((i: any) => typeof i === "string" && i.trim().length > 0) : undefined

    // normalize variants if provided
    const normalizedVariants = Array.isArray(variants)
      ? variants.map((v: any) => ({
          color: v.color,
          material: v.material,
          stock: Number(v.stock || 0),
          reservedStock: Number(v.reserved ?? v.reservedStock ?? 0),
        }))
      : undefined

    // resolve final status (support `currentPhase` UI field)
    const allowedStatuses = ["draft", "waitlist", "originals", "echo", "ended"]
    const finalStatus = (typeof status === "string" && allowedStatuses.includes(status))
      ? status
      : (typeof currentPhase === "string" && allowedStatuses.includes(currentPhase))
      ? currentPhase
      : undefined

    // normalize release phases if provided
    const normalizePhase = (p: any) => {
      if (!p) return undefined
      return {
        startDate: p.startDate ? new Date(p.startDate) : undefined,
        endDate: p.endDate ? new Date(p.endDate) : undefined,
        isActive: typeof p.isActive === "boolean" ? p.isActive : undefined,
        maxQuantity: p.maxQuantity ? Number(p.maxQuantity) : undefined,
        windowDays: p.windowDays ? Number(p.windowDays) : undefined,
      }
    }

    const finalReleasePhases = inputReleasePhases
      ? {
          waitlist: normalizePhase(inputReleasePhases.waitlist),
          originals: normalizePhase(inputReleasePhases.originals),
          echo: normalizePhase(inputReleasePhases.echo),
        }
      : undefined

  const updatePayload: any = {}
    if (sku !== undefined) updatePayload.sku = sku
    if (name !== undefined) updatePayload.name = name
    if (description !== undefined) updatePayload.description = description
    if (parsedBasePrice !== undefined && !Number.isNaN(Number(parsedBasePrice))) updatePayload.basePrice = Number(parsedBasePrice)
    if (sanitizedImages !== undefined) updatePayload.images = sanitizedImages
    if (normalizedVariants !== undefined) updatePayload.variants = normalizedVariants
  if (Array.isArray(paymentOptions)) updatePayload.paymentOptions = paymentOptions
    if (finalStatus !== undefined) updatePayload.status = finalStatus
    if (finalReleasePhases !== undefined) updatePayload.releasePhases = finalReleasePhases

  // DEBUG: log incoming data and computed payload
  console.log("[admin][PATCH] product id=", id)
  console.log("[admin][PATCH] incoming data=", JSON.stringify(data))
  console.log("[admin][PATCH] updatePayload=", JSON.stringify(updatePayload))

    // Perform a partial update using $set. runValidators ensures schema validation for updated fields.
    const product = await Product.findByIdAndUpdate(id, { $set: updatePayload }, { new: true, runValidators: true })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error patching product:", error)
    return NextResponse.json({ error: "Failed to patch product" }, { status: 500 })
  }
}
