'use client'
// src/app/dashboard/page.tsx

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const CATEGORY_META: Record<string, { label: string; icon: string; color: string; budget: number }> = {
  groceries:     { label: 'Groceries',     icon: '🛒', color: '#b4f04a', budget: 600 },
  transport:     { label: 'Transport',     icon: '🚗', color: '#4d9fff', budget: 200 },
  dining:        { label: 'Dining',        icon: '🍜', color: '#ff5555', budget: 250 },
  utilities:     { label: 'Utilities',     icon: '💡', color: '#ffc84a', budget: 180 },
  health:        { label: 'Health',        icon: '💊', color: '#c084fc', budget: 100 },
  shopping:      { label: 'Shopping',      icon: '👜', color: '#f472b6', budget: 200 },
  entertainment: { label: 'Entertainment', icon: '🎬', color: '#4affa0', budget: 150 },
  income:        { label: 'Income',        icon: '💰', color: '#4affa0', budget: 0 },
  transfer:      { label: 'Transfer',      icon: '↔',  color: '#888',    budget: 0 },
  other:         { label: 'Other',         icon: '📦', color: '#666',    budget: 100 },
}

function fmt(n: number) {
  return '$' + Math.abs(n).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions'>('overview')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status])

  useEffect(() => {
    if (status === 'authenticated') fetchData()
  }, [status, month, year])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/transactions?month=${month}&year=${year}`)
      const json = await res.json()
      setData(json)
    } catch {}
    setLoading(false)
  }

  const changeMonth = (dir: number) => {
    let m = month + dir
    let y = year
    if (m > 12) { m = 1; y++ }
    if (m < 1) { m = 12; y-- }
    setMonth(m); setYear(y)
  }

  const syncBank = async () => {
    setSyncing(true)
    await fetch('/api/transactions/sync', { method: 'POST' })
    await fetchData()
    setSyncing(false)
  }

  if (status === 'loading' || loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: '#b4f04a' }}>Loading...</div>
      </div>
    )
  }

  const income = data?.summary?.income ?? 0
  const expenses = data?.summary?.expenses ?? 0
  const remaining = data?.summary?.remaining ?? 0
  const transactions = data?.transactions ?? []
  const byCategory = data?.byCategory ?? {}

  const expenseCategories = Object.entries(byCategory)
    .filter(([cat]) => cat !== 'income' && cat !== 'transfer')
    .sort(([,a], [,b]) => (b as number) - (a as number)) as [string, number][]

  const s: Record<string, React.CSSProperties> = {
    page: { minHeight: '100vh', background: '#0a0a0a', fontFamily: "'Inter', sans-serif", color: '#f0f0ee' },
    nav: { background: '#111', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    navLogo: { fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: '#f0f0ee' },
    navLogoSpan: { color: '#b4f04a' },
    navActions: { display: 'flex', alignItems: 'center', gap: 12 },
    navBtn: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 16px', color: '#f0f0ee', fontSize: 13, cursor: 'pointer', fontFamily: "'Inter', sans-serif" },
    header: { background: 'linear-gradient(135deg,#1a2a1a,#111)', padding: '32px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
    headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', maxWidth: 1200, margin: '0 auto', marginBottom: 24 },
    monthPicker: { display: 'flex', alignItems: 'center', gap: 12 },
    monthBtn: { background: 'rgba(255,255,255,0.08)', border: 'none', color: '#f0f0ee', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 16 },
    monthLabel: { fontSize: 14, color: 'rgba(255,255,255,0.6)', fontFamily: "'JetBrains Mono', monospace" },
    balLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 6 },
    balAmount: { fontFamily: "'Syne', sans-serif", fontSize: 48, fontWeight: 800, letterSpacing: '-2px', color: remaining >= 0 ? '#f0f0ee' : '#ff5555' },
    balSub: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, maxWidth: 1200, margin: '0 auto' },
    statCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '16px 20px' },
    statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const, letterSpacing: '0.8px', marginBottom: 6 },
    statVal: { fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 500 },
    body: { maxWidth: 1200, margin: '0 auto', padding: '32px' },
    tabs: { display: 'flex', gap: 4, marginBottom: 32, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4, width: 'fit-content' },
    tab: (active: boolean): React.CSSProperties => ({ padding: '8px 20px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: "'Inter', sans-serif", background: active ? '#b4f04a' : 'transparent', color: active ? '#0a0a0a' : '#666', transition: 'all 0.15s' }),
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
    card: { background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24 },
    cardTitle: { fontSize: 11, fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.3)', marginBottom: 20 },
    catRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 },
    catIcon: { width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 as const },
    catInfo: { flex: 1 },
    catName: { fontSize: 13, color: '#f0f0ee', marginBottom: 4 },
    barTrack: { height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' },
    catAmt: { fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'rgba(255,255,255,0.5)', flexShrink: 0 as const },
    txnRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' },
    txnIcon: { width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 as const },
    txnInfo: { flex: 1, minWidth: 0 },
    txnName: { fontSize: 14, color: '#f0f0ee', marginBottom: 2 },
    txnMeta: { fontSize: 11, color: '#555' },
    txnAmt: { fontFamily: "'JetBrains Mono', monospace", fontSize: 14, flexShrink: 0 as const },
    emptyState: { textAlign: 'center' as const, padding: '60px 20px', color: '#555' },
    emptyTitle: { fontSize: 20, fontWeight: 600, marginBottom: 12, fontFamily: "'Syne', sans-serif", color: '#888' },
    emptyBtn: { display: 'inline-block', marginTop: 20, padding: '12px 28px', background: '#b4f04a', color: '#0a0a0a', borderRadius: 10, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, textDecoration: 'none', cursor: 'pointer', border: 'none' },
    uploadBtn: { display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(180,240,74,0.1)', border: '1px solid rgba(180,240,74,0.2)', borderRadius: 8, padding: '8px 16px', color: '#b4f04a', fontSize: 13, cursor: 'pointer', fontFamily: "'Inter', sans-serif', fontWeight: 500" },
  }

  return (
    <div style={s.page}>
      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.navLogo}>Coyva<span style={s.navLogoSpan}>.</span></div>
        <div style={s.navActions}>
          <button style={s.uploadBtn} onClick={() => router.push('/upload')}>
            📄 Import CSV
          </button>
          <button style={s.navBtn} onClick={syncBank} disabled={syncing}>
            {syncing ? 'Syncing...' : '🔄 Sync bank'}
          </button>
          <button style={s.navBtn} onClick={() => router.push('/connect')}>
            🏦 Connect bank
          </button>
          <button style={{ ...s.navBtn, color: '#666' }} onClick={() => signOut({ callbackUrl: '/login' })}>
            Sign out
          </button>
        </div>
      </nav>

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerTop}>
          <div>
            <div style={s.balLabel}>Remaining budget</div>
            <div style={s.balAmount}>{fmt(remaining)}</div>
            <div style={s.balSub}>{MONTHS[month - 1]} {year}</div>
          </div>
          <div style={s.monthPicker}>
            <button style={s.monthBtn} onClick={() => changeMonth(-1)}>‹</button>
            <span style={s.monthLabel}>{MONTHS[month - 1]} {year}</span>
            <button style={s.monthBtn} onClick={() => changeMonth(1)}>›</button>
          </div>
        </div>
        <div style={s.statsRow}>
          <div style={s.statCard}>
            <div style={s.statLabel}>Income</div>
            <div style={{ ...s.statVal, color: '#b4f04a' }}>+{fmt(income)}</div>
          </div>
          <div style={s.statCard}>
            <div style={s.statLabel}>Expenses</div>
            <div style={{ ...s.statVal, color: '#ff5555' }}>−{fmt(expenses)}</div>
          </div>
          <div style={s.statCard}>
            <div style={s.statLabel}>Transactions</div>
            <div style={{ ...s.statVal, color: '#f0f0ee' }}>{transactions.length}</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={s.body}>
        {transactions.length === 0 ? (
          <div style={s.emptyState}>
            <div style={s.emptyTitle}>No transactions yet</div>
            <div style={{ fontSize: 14, lineHeight: 1.7 }}>
              Import a CSV from your bank or connect your bank account to get started.
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
              <button style={s.emptyBtn} onClick={() => router.push('/upload')}>
                📄 Import CSV →
              </button>
              <button style={{ ...s.emptyBtn, background: 'rgba(255,255,255,0.06)', color: '#f0f0ee' }} onClick={() => router.push('/connect')}>
                🏦 Connect bank
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={s.tabs}>
              <button style={s.tab(activeTab === 'overview')} onClick={() => setActiveTab('overview')}>Overview</button>
              <button style={s.tab(activeTab === 'transactions')} onClick={() => setActiveTab('transactions')}>Transactions</button>
            </div>

            {activeTab === 'overview' && (
              <div style={s.grid}>
                {/* Spending by category */}
                <div style={s.card}>
                  <div style={s.cardTitle}>Spending by category</div>
                  {expenseCategories.length === 0 ? (
                    <div style={{ color: '#555', fontSize: 14 }}>No expenses this month</div>
                  ) : expenseCategories.map(([cat, amt]) => {
                    const meta = CATEGORY_META[cat] ?? CATEGORY_META.other
                    const budget = meta.budget
                    const pct = budget > 0 ? Math.min(100, (amt / budget) * 100) : 50
                    const over = budget > 0 && amt > budget
                    return (
                      <div key={cat} style={s.catRow}>
                        <div style={{ ...s.catIcon, background: `${meta.color}18` }}>{meta.icon}</div>
                        <div style={s.catInfo}>
                          <div style={{ ...s.catName, color: over ? '#ff5555' : '#f0f0ee' }}>
                            {meta.label}{over ? ' ⚠️' : ''}
                          </div>
                          <div style={s.barTrack}>
                            <div style={{ height: '100%', borderRadius: 99, width: `${pct}%`, background: over ? '#ff5555' : meta.color, transition: 'width 0.6s ease' }} />
                          </div>
                        </div>
                        <div style={s.catAmt}>{fmt(amt as number)}</div>
                      </div>
                    )
                  })}
                </div>

                {/* Recent transactions */}
                <div style={s.card}>
                  <div style={s.cardTitle}>Recent transactions</div>
                  {transactions.slice(0, 8).map((txn: any) => {
                    const meta = CATEGORY_META[txn.category] ?? CATEGORY_META.other
                    const d = new Date(txn.date)
                    return (
                      <div key={txn.id} style={s.txnRow}>
                        <div style={{ ...s.txnIcon, background: `${meta.color}18` }}>{meta.icon}</div>
                        <div style={s.txnInfo}>
                          <div style={s.txnName}>{txn.merchantName ?? txn.description}</div>
                          <div style={s.txnMeta}>{meta.label} · {d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</div>
                        </div>
                        <div style={{ ...s.txnAmt, color: txn.direction === 'credit' ? '#b4f04a' : '#ff5555' }}>
                          {txn.direction === 'credit' ? '+' : '−'}{fmt(txn.amount)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div style={s.card}>
                <div style={s.cardTitle}>All transactions — {MONTHS[month - 1]} {year}</div>
                {transactions.map((txn: any) => {
                  const meta = CATEGORY_META[txn.category] ?? CATEGORY_META.other
                  const d = new Date(txn.date)
                  return (
                    <div key={txn.id} style={s.txnRow}>
                      <div style={{ ...s.txnIcon, background: `${meta.color}18` }}>{meta.icon}</div>
                      <div style={s.txnInfo}>
                        <div style={s.txnName}>{txn.merchantName ?? txn.description}</div>
                        <div style={s.txnMeta}>
                          {meta.label} · {d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      <div style={{ ...s.txnAmt, color: txn.direction === 'credit' ? '#b4f04a' : '#ff5555' }}>
                        {txn.direction === 'credit' ? '+' : '−'}{fmt(txn.amount)}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
