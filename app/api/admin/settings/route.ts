import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { Settings } from '@/models/Settings'
import { verifyToken } from '@/lib/auth'

export async function GET(request: Request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  const user = await verifyToken(token)
  if (!user || (user as any).role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  await connectToDatabase()
  const keys = ['whatsappNumber', 'brandColor', 'heroImages']
  const docs = await Settings.find({ key: { $in: keys } }).lean()
  const result: any = {}
  docs.forEach((d: any) => { result[d.key] = d.value })
  return NextResponse.json(result)
}

export async function PATCH(request: Request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  const user = await verifyToken(token)
  if (!user || (user as any).role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = await request.json()
  await connectToDatabase()
  const upserts: any = {}
  if (body.whatsappNumber !== undefined) upserts.whatsappNumber = body.whatsappNumber
  if (body.brandColor !== undefined) upserts.brandColor = body.brandColor
  if (body.heroImages !== undefined) upserts.heroImages = body.heroImages

  const entries = Object.entries(upserts)
  for (const [key, value] of entries) {
    await Settings.findOneAndUpdate({ key }, { value }, { upsert: true })
  }

  return NextResponse.json({ ok: true })
}
