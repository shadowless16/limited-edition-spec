import { connectToDatabase } from '../lib/mongodb'
import { PaymentMethod } from '../models/PaymentMethod'

async function run() {
  await connectToDatabase()
  const existing = await PaymentMethod.findOne({ key: 'bank_transfer' })
  if (!existing) {
    await PaymentMethod.create({ key: 'bank_transfer', name: 'Bank Transfer', enabled: true, details: { account_name: 'Limited Edition LLC', account_number: '123456789', bank_name: 'Example Bank' } })
  }
  const existing2 = await PaymentMethod.findOne({ key: 'crypto' })
  if (!existing2) {
    await PaymentMethod.create({ key: 'crypto', name: 'Crypto (BTC)', enabled: true, details: { address: '1ExampleBitcoinAddressxxx', network: 'BTC' } })
  }
  console.log('seeded payment methods')
  process.exit(0)
}

run().catch((e) => { console.error(e); process.exit(1) })
