import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getUserAccounts } from '@/lib/basiq'
import { prisma } from '@/lib/prisma'
import { addMonths } from 'date-fns'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const basiqUserId = searchParams.get('userId')
  const jobId = searchParams.get('jobId')
  if (!basiqUserId) return NextResponse.redirect(new URL('/connect?error=missing_user', req.url))
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.redirect(new URL('/login', req.url))
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.redirect(new URL('/login', req.url))
    const accounts = await getUserAccounts(basiqUserId)
    const accountIds = accounts.map((a) => a.id)
    const institutionName = accounts[0]?.institution ?? 'Unknown bank'
    await prisma.bankConnection.upsert({
      where: { basiqUserId },
      create: { userId: user.id, basiqUserId, basiqJobId: jobId ?? null, institutionName, accountIds, consentGranted: new Date(), consentExpires: addMonths(new Date(), 12), consentActive: true },
      update: { basiqJobId: jobId ?? undefined, institutionName, accountIds, consentGranted: new Date(), consentExpires: addMonths(new Date(), 12), consentActive: true },
    })
    syncTransactions(user.id, basiqUserId).catch((e) => console.error('[sync background]', e.message))
    return NextResponse.redirect(new URL('/dashboard?connected=true', req.url))
  } catch (err: any) {
    console.error('[basiq/callback]', err?.response?.data ?? err.message)
    return NextResponse.redirect(new URL('/connect?error=connection_failed', req.url))
  }
}

async function syncTransactions(userId: string, basiqUserId: string) {
  const { getUserTransactions } = await import('@/lib/basiq')
  const { categorise } = await import('@/lib/categorise')
  const fromDate = new Date()
  fromDate.setMonth(fromDate.getMonth() - 3)
  const from = fromDate.toISOString().split('T')[0]
  const transactions = await getUserTransactions(basiqUserId, { fromDate: from })
  for (const txn of transactions) {
    const merchantName = txn.merchant?.businessName
    const basiqCat = txn.merchant?.category?.subDivision
    await prisma.transaction.upsert({
      where: { basiqId: txn.id },
      create: { userId, basiqId: txn.id, accountId: txn.account, amount: parseFloat(txn.amount), description: txn.description, date: new Date(txn.postDate || txn.transactionDate), direction: txn.direction, status: txn.status, merchantName: merchantName ?? null, merchantCategory: basiqCat ?? null, category: categorise(txn.description, merchantName, basiqCat) },
      update: { status: txn.status, merchantName: merchantName ?? undefined, merchantCategory: basiqCat ?? undefined },
    })
  }
  await prisma.bankConnection.update({ where: { basiqUserId }, data: { lastSyncedAt: new Date() } })
}
