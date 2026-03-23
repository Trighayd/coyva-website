import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { refreshUserData, getUserTransactions } from '@/lib/basiq'
import { categorise } from '@/lib/categorise'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { connections: { where: { consentActive: true } } } })
  if (!user || !user.connections.length) return NextResponse.json({ error: 'No active bank connection' }, { status: 400 })
  const connection = user.connections[0]
  if (new Date() > connection.consentExpires) {
    await prisma.bankConnection.update({ where: { id: connection.id }, data: { consentActive: false } })
    return NextResponse.json({ error: 'consent_expired', message: 'Please reconnect your bank.' }, { status: 403 })
  }
  try {
    const jobId = await refreshUserData(connection.basiqUserId)
    await new Promise((resolve) => setTimeout(resolve, 10_000))
    const since = new Date(); since.setDate(since.getDate() - 30)
    const fromDate = since.toISOString().split('T')[0]
    const transactions = await getUserTransactions(connection.basiqUserId, { fromDate })
    let newCount = 0
    for (const txn of transactions) {
      const merchantName = txn.merchant?.businessName
      const basiqCat = txn.merchant?.category?.subDivision
      const result = await prisma.transaction.upsert({
        where: { basiqId: txn.id },
        create: { userId: user.id, basiqId: txn.id, accountId: txn.account, amount: parseFloat(txn.amount), description: txn.description, date: new Date(txn.postDate || txn.transactionDate), direction: txn.direction, status: txn.status, merchantName: merchantName ?? null, merchantCategory: basiqCat ?? null, category: categorise(txn.description, merchantName, basiqCat) },
        update: { status: txn.status },
      })
      if (result.createdAt.getTime() === result.updatedAt.getTime()) newCount++
    }
    await prisma.bankConnection.update({ where: { id: connection.id }, data: { lastSyncedAt: new Date() } })
    return NextResponse.json({ success: true, newTransactions: newCount, totalFetched: transactions.length, jobId })
  } catch (err: any) {
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
