// src/app/api/transactions/route.ts
// GET /api/transactions?month=3&year=2026

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const now   = new Date()
  const month = parseInt(searchParams.get('month') ?? String(now.getMonth() + 1))
  const year  = parseInt(searchParams.get('year')  ?? String(now.getFullYear()))

  const from = new Date(year, month - 1, 1)
  const to   = new Date(year, month, 1)  // exclusive upper bound

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      date:   { gte: from, lt: to },
      status: 'posted',
    },
    orderBy: { date: 'desc' },
  })

  // Compute summary stats
  const income   = transactions.filter(t => t.direction === 'credit').reduce((s, t) => s + Math.abs(t.amount), 0)
  const expenses = transactions.filter(t => t.direction === 'debit').reduce((s, t) => s + Math.abs(t.amount), 0)

  // Category breakdown
  const byCategory: Record<string, number> = {}
  for (const txn of transactions) {
    if (txn.direction === 'debit') {
      byCategory[txn.category] = (byCategory[txn.category] ?? 0) + Math.abs(txn.amount)
    }
  }

  return NextResponse.json({
    transactions,
    summary: { income, expenses, remaining: income - expenses },
    byCategory,
    month,
    year,
  })
}
