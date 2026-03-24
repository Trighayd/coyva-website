import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

const DEFAULT_BUDGETS: Record<string, number> = {
  groceries: 600,
  transport: 200,
  dining: 250,
  utilities: 180,
  health: 100,
  shopping: 200,
  entertainment: 150,
  income: 0,
  transfer: 0,
  other: 100,
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const now = new Date()
  const month = parseInt(searchParams.get('month') ?? String(now.getMonth() + 1))
  const year = parseInt(searchParams.get('year') ?? String(now.getFullYear()))

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const saved = await prisma.budget.findMany({ where: { userId: user.id, month, year } })

  // Merge saved budgets with defaults
  const budgets: Record<string, number> = { ...DEFAULT_BUDGETS }
  for (const b of saved) {
    budgets[b.category] = b.limitAud
  }

  return NextResponse.json({ budgets, month, year })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const { category, limitAud, month, year } = body

  if (!category || limitAud === undefined || !month || !year) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const budget = await prisma.budget.upsert({
    where: { userId_category_month_year: { userId: user.id, category, month, year } },
    update: { limitAud },
    create: { userId: user.id, category, limitAud, month, year },
  })

  return NextResponse.json({ budget })
}
