import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { Product } from "@/models/Product"
import { verifyToken } from "@/lib/auth"
import { z } from "zod"

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    // Get all products with aggregated data
    const products = await Product.aggregate([
      {
        $lookup: {
          from: "waitlistentries",
          localField: "_id",
          foreignField: "productId",
          as: "waitlistEntries",
        },
      },
      {
        $addFields: {
          waitlistCount: { $size: "$waitlistEntries" },
          totalSold: 0, // TODO: Calculate from orders
        },
      },
      // add a computed field separately, then exclude the joined array
      {
        $addFields: { currentPhase: "$status" },
      },
      {
        $project: {
          waitlistEntries: 0, // Remove the joined data to keep response clean
        },
      },
    ])

    return NextResponse.json(products)
  } catch (error) {
    console.error("Error fetching admin products:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    await connectToDatabase()

    const body = await request.json()

    const VariantSchema = z.object({
      color: z.string(),
      material: z.string(),
      stock: z.preprocess((v) => Number(v), z.number().int().nonnegative()),
      reserved: z.preprocess((v) => Number(v), z.number().int().nonnegative()).optional(),
      reservedStock: z.preprocess((v) => Number(v), z.number().int().nonnegative()).optional(),
    })

    const ReleasePhaseSchema = z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      isActive: z.boolean().optional(),
      maxQuantity: z.preprocess((v) => Number(v), z.number().int().positive()).optional(),
      windowDays: z.preprocess((v) => Number(v), z.number().int().positive()).optional(),
    })

    const ProductInput = z.object({
      sku: z.string(),
      name: z.string(),
      description: z.string().optional(),
      basePrice: z.preprocess((v) => Number(v), z.number().positive()),
      images: z.array(z.string()).optional(),
      variants: z.array(VariantSchema).optional(),
      status: z.string().optional(),
      currentPhase: z.string().optional(),
  releasePhases: z.object({
        waitlist: ReleasePhaseSchema.optional(),
        originals: ReleasePhaseSchema.optional(),
        echo: ReleasePhaseSchema.optional(),
      }).optional(),
  paymentOptions: z.array(z.string()).optional(),
    })

    const parsed = ProductInput.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid product payload", details: parsed.error.format() }, { status: 400 })
    }

  const { sku, name, basePrice, images = [], variants = [], status, currentPhase, description, releasePhases: inputReleasePhases, paymentOptions = [] } = parsed.data;

    // Normalize variants: client uses `reserved` but schema expects `reservedStock`.
    const normalizedVariants = Array.isArray(variants)
      ? variants.map((v: any) => ({
          color: v.color,
          material: v.material,
          stock: Number(v.stock || 0),
          reservedStock: Number(v.reserved ?? v.reservedStock ?? 0),
        }))
      : []

    // Normalize status to schema enum: draft | waitlist | originals | echo | ended
    const allowedStatuses = ["draft", "waitlist", "originals", "echo", "ended"]
    const finalStatus = (typeof status === "string" && allowedStatuses.includes(status as string))
      ? (status as string)
      : (typeof currentPhase === "string" && allowedStatuses.includes(currentPhase as string))
      ? (currentPhase as string)
      : "draft"

    // Provide sensible default releasePhases so mongoose validation passes.
    const now = new Date()
    const msPerDay = 24 * 60 * 60 * 1000
  const waitlistStart = now;
  const waitlistEnd = new Date(now.getTime() + 7 * msPerDay);
  const originalsStart = new Date(waitlistEnd.getTime());
  const originalsEnd = new Date(now.getTime() + 21 * msPerDay);
  const echoStart = new Date(originalsEnd.getTime());
  const echoEnd = new Date(now.getTime() + 51 * msPerDay);

    const totalStock = normalizedVariants.reduce((s, v) => s + (v.stock || 0), 0)

    const defaultReleasePhases = {
      waitlist: {
        startDate: waitlistStart,
        endDate: waitlistEnd,
        isActive: finalStatus === "waitlist",
      },
      originals: {
        startDate: originalsStart,
        endDate: originalsEnd,
        isActive: finalStatus === "originals",
        maxQuantity: Math.max(totalStock, 1),
      },
      echo: {
        startDate: echoStart,
        endDate: echoEnd,
        isActive: finalStatus === "echo",
        windowDays: 30,
      },
    }

    // If releasePhases were provided in the payload, normalize dates and numeric fields.
    const normalizePhase = (p: any, fallback: any) => {
      if (!p) return fallback
      return {
        startDate: p.startDate ? new Date(p.startDate) : fallback.startDate,
        endDate: p.endDate ? new Date(p.endDate) : fallback.endDate,
        isActive: typeof p.isActive === "boolean" ? p.isActive : fallback.isActive,
        maxQuantity: p.maxQuantity ? Number(p.maxQuantity) : fallback.maxQuantity,
        windowDays: p.windowDays ? Number(p.windowDays) : fallback.windowDays,
      }
    }

    const finalReleasePhases = {
      waitlist: normalizePhase(inputReleasePhases?.waitlist, defaultReleasePhases.waitlist),
      originals: normalizePhase(inputReleasePhases?.originals, defaultReleasePhases.originals),
      echo: normalizePhase(inputReleasePhases?.echo, defaultReleasePhases.echo),
    }

    const product = new Product({
      sku,
      name,
      description: description || "No description provided",
      basePrice,
      images,
      variants: normalizedVariants,
  paymentOptions,
      status: finalStatus,
  releasePhases: finalReleasePhases,
    })

    await product.save()

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}
