import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { createBasiqUser, getConsentUrl } from '@/lib/basiq'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { connections: { where: { consentActive: true } } } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    let basiqUserId: string
    const existingConnection = user.connections[0]
    if (existingConnection) { basiqUserId = existingConnection.basiqUserId }
    else { const basiqUser = await createBasiqUser(user.email); basiqUserId = basiqUser.id }
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/basiq/callback`
    const consentUrl = await getConsentUrl(basiqUserId, redirectUri)
    return NextResponse.json({ consentUrl, basiqUserId })
  } catch (err: any) {
    console.error('[basiq/connect]', err?.response?.data ?? err.message)
    return NextResponse.json({ error: 'Failed to initiate bank connection' }, { status: 500 })
  }
}
