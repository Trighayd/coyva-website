// src/app/api/auth/register/route.ts

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Hash the password before storing — NEVER store plain text
    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: { email, name: name ?? null, passwordHash },
    })

    return NextResponse.json({ success: true, userId: user.id }, { status: 201 })
  } catch (err: any) {
    console.error('[register]', err.message)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
