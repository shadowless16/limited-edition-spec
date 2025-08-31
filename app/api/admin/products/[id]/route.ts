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
  const { id } = await params as { id: string }

  // Perform a partial update using $set. runValidators ensures schema validation for updated fields.
  const product = await Product.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error patching product:", error)
    return NextResponse.json({ error: "Failed to patch product" }, { status: 500 })
  }
}
