import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function makeUserAdmin() {
  try {
    const { connectToDatabase } = await import('../lib/mongodb')
    const { User } = await import('../models/User')

    await connectToDatabase()

    const email = process.argv[2]
    if (!email) {
      console.log('Usage: npx tsx scripts/make-admin.ts <email>')
      process.exit(1)
    }

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { isAdmin: true },
      { new: true }
    )

    if (!user) {
      console.log(`User with email ${email} not found`)
      process.exit(1)
    }

    console.log(`✅ User ${email} is now an admin`)
  } catch (error) {
    console.error('Error making user admin:', error)
    process.exit(1)
  }
}

makeUserAdmin().then(() => process.exit(0))