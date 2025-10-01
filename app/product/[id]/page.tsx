import { notFound } from "next/navigation"
import { connectToDatabase } from "@/lib/mongodb"
import { Product } from "@/models/Product"
import ProductDetail from "@/components/product/ProductDetail"
import Header from "@/components/layout/Header"

interface ProductPageProps {
  params: Promise<{ id: string }>
}

async function getProduct(id: string) {
  try {
    await connectToDatabase()
    const product = await Product.findById(id).lean()
    return product ? JSON.parse(JSON.stringify(product)) : null
  } catch (error) {
    console.error("Error fetching product:", error)
    return null
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  // `params` may be a promise in Next.js; await it before using properties
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    notFound()
  }

  return (
    <>
      <Header />
      <ProductDetail product={product} />
    </>
  )
}

export async function generateMetadata({ params }: ProductPageProps) {
  // `params` may be a promise in Next.js; await it before using properties
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    return {
      title: "Product Not Found",
    }
  }

  return {
    title: `${product.name} - Limited Edition`,
    description: product.description || `Exclusive ${product.name} - Limited quantities available`,
  }
}
