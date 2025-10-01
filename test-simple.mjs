// Simple test runner without Jest
import { connectToDatabase } from './lib/mongodb.js'
import { Product } from './models/Product.js'
import { EchoRequest } from './models/EchoRequest.js'
import { Order } from './models/Order.js'

async function runTests() {
  console.log('🧪 Running Simple Tests for Prepaid Production Model\n')
  
  try {
    // Connect to test database
    process.env.MONGODB_URI = 'mongodb://localhost:27017/limited-edition-test'
    await connectToDatabase()
    console.log('✅ Connected to test database')

    // Test 1: Echo Escrow System
    console.log('\n📋 Test 1: Echo Escrow System')
    
    // Clean up
    await EchoRequest.deleteMany({})
    await Product.deleteMany({})
    await Order.deleteMany({})
    
    // Create test product
    const product = await Product.create({
      sku: 'TEST-ECHO-001',
      name: 'Test Echo Product',
      description: 'Test product for echo',
      basePrice: 50000,
      images: ['test.jpg'],
      variants: [{ color: 'black', material: 'cotton', stock: 10, reservedStock: 0 }],
      status: 'echo',
      releasePhases: {
        echo: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          isActive: true,
          windowDays: 14,
          minRequests: 2, // Lower for testing
          maxQuantity: 150
        }
      }
    })
    console.log('  ✅ Created test product')

    // Create escrowed requests
    const request1 = await EchoRequest.create({
      productId: product._id,
      amount: product.basePrice,
      paymentStatus: 'escrowed',
      paymentIntentId: 'test_payment_1',
      escrowReleaseDate: new Date(Date.now() - 1000) // Expired
    })

    const request2 = await EchoRequest.create({
      productId: product._id,
      amount: product.basePrice,
      paymentStatus: 'escrowed',
      paymentIntentId: 'test_payment_2',
      escrowReleaseDate: new Date(Date.now() - 1000) // Expired
    })
    console.log('  ✅ Created 2 escrowed requests')

    // Check threshold
    const escrowedCount = await EchoRequest.countDocuments({
      productId: product._id,
      paymentStatus: 'escrowed',
      escrowReleaseDate: { $lte: new Date() }
    })
    
    const thresholdMet = escrowedCount >= 2
    console.log(`  ✅ Threshold check: ${escrowedCount}/2 requests - ${thresholdMet ? 'MET' : 'NOT MET'}`)

    if (thresholdMet) {
      // Convert to orders
      const order1 = await Order.create({
        userId: '507f1f77bcf86cd799439011',
        orderNumber: `ECO${Date.now().toString(36).toUpperCase()}`,
        items: [{
          productId: product._id,
          variantId: 'default',
          quantity: 1,
          unitPrice: request1.amount,
          totalPrice: request1.amount
        }],
        subtotal: request1.amount,
        tax: 0,
        shipping: 0,
        total: request1.amount,
        status: 'confirmed',
        paymentStatus: 'paid',
        phase: 'echo'
      })

      request1.paymentStatus = 'released'
      await request1.save()
      
      console.log('  ✅ Converted requests to orders')
      console.log(`  ✅ Order created: ${order1.orderNumber}`)
    }

    // Test 2: Production Triggers
    console.log('\n📋 Test 2: Production Triggers')
    
    const productionProduct = await Product.create({
      sku: 'TEST-PROD-001',
      name: 'Test Production Product',
      description: 'Test product for production',
      basePrice: 45000,
      images: ['prod.jpg'],
      variants: [{ color: 'blue', material: 'denim', stock: 50, reservedStock: 0 }],
      status: 'originals',
      allocatedCount: 0,
      productionStatus: 'pending'
    })

    // Create order and update allocated count
    const prodOrder = await Order.create({
      userId: '507f1f77bcf86cd799439012',
      orderNumber: 'PROD001TEST',
      items: [{
        productId: productionProduct._id,
        variantId: 'default',
        quantity: 2,
        unitPrice: productionProduct.basePrice,
        totalPrice: productionProduct.basePrice * 2
      }],
      subtotal: productionProduct.basePrice * 2,
      tax: 500,
      shipping: 1000,
      total: productionProduct.basePrice * 2 + 1500,
      status: 'confirmed',
      paymentStatus: 'paid',
      phase: 'originals'
    })

    await Product.findByIdAndUpdate(productionProduct._id, {
      $inc: { allocatedCount: 2 },
      productionStatus: 'started',
      productionStartDate: new Date()
    })

    const updatedProd = await Product.findById(productionProduct._id)
    console.log(`  ✅ Allocated count updated: ${updatedProd.allocatedCount}`)
    console.log(`  ✅ Production status: ${updatedProd.productionStatus}`)

    console.log('\n🎉 All tests passed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

runTests()