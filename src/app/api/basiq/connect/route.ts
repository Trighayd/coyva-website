// src/app/api/basiq/connect/route.ts
// POST /api/basiq/connect
// Creates a Basiq user (if needed) and returns the CDR consent redirect URL.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { createBasiqUser, getConsentUrl } from '@/lib/basiq'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { connections: { where: { consentActive: true } } },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if we already have a Basiq user for this account
    let basiqUserId: string
    const existingConnection = user.connections[0]

    if (existingConnection) {
      basiqUserId = existingConnection.basiqUserId
    } else {
      // First time: create a Basiq user
      const basiqUser = await createBasiqUser(user.email)
      basiqUserId = basiqUser.id
    }

    // Generate CDR consent URL
    // The redirect URI is your callback route — Basiq sends the user back here
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/basiq/callback`
    const consentUrl  = await getConsentUrl(basiqUserId, redirectUri)

    // Store basiqUserId in session/cookie so we can retrieve it in the callback
    // For simplicity, we embed it in the redirect URL response
    return NextResponse.json({
      consentUrl,
      basiqUserId,
    })
  } catch (err: any) {
    console.error('[basiq/connect]', err?.response?.data ?? err.message)
    return NextResponse.json(
      { error: 'Failed to initiate bank connection' },
      { status: 500 }
    )
  }
}
