import dotenv from 'dotenv'

// Load environment variables from .env.local so MONGODB_URI is available
dotenv.config({ path: '.env.local' })

// Delay importing modules that read process.env until after dotenv.config runs.
// We'll dynamically import `connectToDatabase` and `PaymentMethod` inside the
// seeding function to ensure MONGODB_URI is defined when those modules evaluate.

async function seedPaymentMethods() {
  try {
  const { connectToDatabase } = await import('../lib/mongodb')
  const { PaymentMethod } = await import('../models/PaymentMethod')

  await connectToDatabase()

  // Check if payment methods already exist
  const existingMethods = await PaymentMethod.find()
    if (existingMethods.length > 0) {
      console.log('Payment methods already exist, skipping seed')
      return
    }

    // Create default payment methods
    const defaultMethods = [
      {
        key: 'bank_transfer',
        name: 'Bank Transfer',
        enabled: true,
        details: {
          bank_name: 'Your Bank Name',
          account_number: 'XXXX-XXXX-XXXX',
          routing_number: 'XXXXXXXXX',
          account_holder: 'Your Business Name',
          instructions: 'Please include your order number in the transfer reference'
        }
      },
      {
        key: 'crypto',
        name: 'Cryptocurrency',
        enabled: true,
        details: {
          bitcoin_address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          ethereum_address: '0x742d35Cc6634C0532925a3b8D0C9e3e0C8b0e9e0',
          instructions: 'Send payment to the appropriate address and email us the transaction ID'
        }
      }
    ]

    for (const method of defaultMethods) {
      await PaymentMethod.create(method)
      console.log(`Created payment method: ${method.name}`)
    }

    console.log('Payment methods seeded successfully!')
  } catch (error) {
    console.error('Error seeding payment methods:', error)
  }
}

// Run if called directly
if (require.main === module) {
  seedPaymentMethods().then(() => process.exit(0))
}

export default seedPaymentMethods