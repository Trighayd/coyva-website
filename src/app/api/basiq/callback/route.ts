// src/app/api/basiq/callback/route.ts
// GET /api/basiq/callback?userId=<basiqUserId>&jobId=<jobId>
//
// Basiq redirects the user here after they've granted CDR consent at their bank.
// We save the connection, then trigger our first transaction sync.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getUserAccounts } from '@/lib/basiq'
import { prisma } from '@/lib/prisma'
import { addMonths } from 'date-fns'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const basiqUserId = searchParams.get('userId')
  const jobId       = searchParams.get('jobId')    // present on some flows

  if (!basiqUserId) {
    return NextResponse.redirect(
      new URL('/connect?error=missing_user', req.url)
    )
  }

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })
    if (!user) return NextResponse.redirect(new URL('/login', req.url))

    // Fetch the accounts now linked via CDR consent
    const accounts = await getUserAccounts(basiqUserId)
    const accountIds = accounts.map((a) => a.id)
    const institutionName = accounts[0]?.institution ?? 'Unknown bank'

    // Upsert the connection record
    // CDR consent duration: we set 12 months (regulatory max per grant)
    await prisma.bankConnection.upsert({
      where:  { basiqUserId },
      create: {
        userId:          user.id,
        basiqUserId,
        basiqJobId:      jobId ?? null,
        institutionName,
        accountIds,
        consentGranted:  new Date(),
        consentExpires:  addMonths(new Date(), 12),
        consentActive:   true,
      },
      update: {
        basiqJobId:      jobId ?? undefined,
        institutionName,
        accountIds,
        consentGranted:  new Date(),
        consentExpires:  addMonths(new Date(), 12),
        consentActive:   true,
      },
    })

    // Kick off an async transaction sync (don't await — let it run in background)
    // In production: use a queue (e.g. BullMQ, AWS SQS) for this
    syncTransactions(user.id, basiqUserId).catch((e) =>
      console.error('[sync background]', e.message)
    )

    // Redirect user to dashboard
    return NextResponse.redirect(
      new URL('/dashboard?connected=true', req.url)
    )
  } catch (err: any) {
    console.error('[basiq/callback]', err?.response?.data ?? err.message)
    return NextResponse.redirect(
      new URL('/connect?error=connection_failed', req.url)
    )
  }
}

// ─── Background sync ─────────────────────────────────────────────────────────
// Imported here to keep the callback lean. In production, move this to a
// dedicated worker / queue handler.

async function syncTransactions(userId: string, basiqUserId: string) {
  const { getUserTransactions } = await import('@/lib/basiq')
  const { categorise }          = await import('@/lib/categorise')

  // Fetch last 3 months to start
  const fromDate = new Date()
  fromDate.setMonth(fromDate.getMonth() - 3)
  const from = fromDate.toISOString().split('T')[0]

  const transactions = await getUserTransactions(basiqUserId, { fromDate: from })

  // Upsert each transaction — deduplicated by basiqId
  for (const txn of transactions) {
    const merchantName = txn.merchant?.businessName
    const basiqCat     = txn.merchant?.category?.subDivision

    await prisma.transaction.upsert({
      where:  { basiqId: txn.id },
      create: {
        userId,
        basiqId:          txn.id,
        accountId:        txn.account,
        amount:           parseFloat(txn.amount),
        description:      txn.description,
        date:             new Date(txn.postDate || txn.transactionDate),
        direction:        txn.direction,
        status:           txn.status,
        merchantName:     merchantName ?? null,
        merchantCategory: basiqCat ?? null,
        category:         categorise(txn.description, merchantName, basiqCat),
      },
      update: {
        status:           txn.status,  // pending → posted
        merchantName:     merchantName ?? undefined,
        merchantCategory: basiqCat ?? undefined,
      },
    })
  }

  await prisma.bankConnection.update({
    where:  { basiqUserId },
    data:   { lastSyncedAt: new Date() },
  })

  console.log(`[sync] Done — ${transactions.length} transactions for user ${userId}`)
}
