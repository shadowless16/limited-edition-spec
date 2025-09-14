import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { PaymentMethod } from '@/models/PaymentMethod'
import { verifyToken } from '@/lib/auth'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    
    const user = await verifyToken(token)
    if (!user || (user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    await connectToDatabase()
    const data = await request.json()
    
    const method = await PaymentMethod.findByIdAndUpdate(
      params.id,
      { $set: data },
      { new: true }
    )
    
    if (!method) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
    }
    
    return NextResponse.json(method)
  } catch (error) {
    console.error('Error updating payment method:', error)
    return NextResponse.json({ error: 'Failed to update payment method' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    
    const user = await verifyToken(token)
    if (!user || (user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    await connectToDatabase()
    
    const method = await PaymentMethod.findByIdAndDelete(params.id)
    
    if (!method) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting payment method:', error)
    return NextResponse.json({ error: 'Failed to delete payment method' }, { status: 500 })
  }
}