import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { Settings } from '@/models/Settings'

export async function GET() {
  await connectToDatabase()
  const keys = ['whatsappNumber', 'heroImages']
  const docs = await Settings.find({ key: { $in: keys } }).lean()
  const result: any = {}
  docs.forEach((d: any) => { result[d.key] = d.value })
  return NextResponse.json(result)
}