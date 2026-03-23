// src/app/api/transactions/upload/route.ts
// POST /api/transactions/upload
// Accepts a CSV file, parses it, categorises transactions, saves to DB

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { parseCSV } from '@/lib/csvParser'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Parse multipart form data
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Only CSV files are supported' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
    }

    const csvContent = await file.text()
    const { bank, transactions, errors, totalRows } = parseCSV(csvContent)

    if (transactions.length === 0) {
      return NextResponse.json({
        error: 'No valid transactions found in CSV',
        details: errors,
      }, { status: 422 })
    }

    // Upsert transactions — use a hash of date+amount+description as dedup key
    let imported = 0
    let skipped = 0

    for (const txn of transactions) {
      const dedupeId = `csv_${user.id}_${txn.date.toISOString().split('T')[0]}_${txn.amount}_${txn.description.slice(0, 30).replace(/\s/g, '')}`

      const existing = await prisma.transaction.findUnique({
        where: { basiqId: dedupeId },
      })

      if (existing) {
        skipped++
        continue
      }

      await prisma.transaction.create({
        data: {
          userId:          user.id,
          basiqId:         dedupeId,
          accountId:       `csv_${bank.replace(/\s/g, '_').toLowerCase()}`,
          amount:          txn.amount,
          description:     txn.description,
          date:            txn.date,
          direction:       txn.direction,
          status:          'posted',
          merchantName:    null,
          merchantCategory: null,
          category:        txn.category,
        },
      })
      imported++
    }

    return NextResponse.json({
      success: true,
      bank,
      totalRows,
      parsed: transactions.length,
      imported,
      skipped,
      errors,
    })
  } catch (err: any) {
    console.error('[upload]', err.message)
    return NextResponse.json({ error: 'Upload failed', detail: err.message }, { status: 500 })
  }
}
