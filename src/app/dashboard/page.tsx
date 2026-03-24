'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const CAT: Record<string, { label: string; color: string }> = {
  groceries:     { label: 'Groceries',     color: '#22c55e' },
  transport:     { label: 'Transport',     color: '#3b82f6' },
  dining:        { label: 'Dining',        color: '#f97316' },
  utilities:     { label: 'Utilities',     color: '#eab308' },
  health:        { label: 'Health',        color: '#a855f7' },
  shopping:      { label: 'Shopping',      color: '#ec4899' },
  entertainment: { label: 'Entertainment', color: '#06b6d4' },
  income:        { label: 'Income',        color: '#34d399' },
  transfer:      { label: 'Transfer',      color: '#64748b' },
  other:         { label: 'Other',         color: '#64748b' },
}

const CAT_ICONS: Record<string, React.ReactNode> = {
  groceries: <svg width="13" height="13" fill="none" viewBox="0 0 20 20"><path d="M4 8h12l-1.5 7H5.5L4 8z" stroke="currentColor" strokeWidth="1.3"/><path d="M7 8V6a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.3"/></svg>,
  transport: <svg width="13" height="13" fill="none" viewBox="0 0 20 20"><rect x="2" y="7" width="16" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 7V5a2 2 0 014 0v2M11 7V5a2 2 0 014 0v2" stroke="currentColor" strokeWidth="1.3"/><circle cx="6" cy="16" r="1.5" fill="currentColor"/><circle cx="14" cy="16" r="1.5" fill="currentColor"/></svg>,
  dining: <svg width="13" height="13" fill="none" viewBox="0 0 20 20"><path d="M10 3c-1.5 3-5 4-5 7a5 5 0 0010 0c0-3-3.5-4-5-7z" stroke="currentColor" strokeWidth="1.3"/></svg>,
  utilities: <svg width="13" height="13" fill="none" viewBox="0 0 20 20"><path d="M10 2l1.5 4.5H16l-3.5 2.5 1.5 4.5L10 11l-4 2.5 1.5-4.5L4 6.5h4.5L10 2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>,
  health: <svg width="13" height="13" fill="none" viewBox="0 0 20 20"><path d="M10 17S3 12.5 3 7.5A4 4 0 0110 4a4 4 0 017 3.5C17 12.5 10 17 10 17z" stroke="currentColor" strokeWidth="1.3"/></svg>,
  shopping: <svg width="13" height="13" fill="none" viewBox="0 0 20 20"><path d="M4 8h12l-1 8H5L4 8zM8 8V6a2 2 0 014 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  entertainment: <svg width="13" height="13" fill="none" viewBox="0 0 20 20"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M8 7.5l5 2.5-5 2.5V7.5z" fill="currentColor"/></svg>,
  income: <svg width="13" height="13" fill="none" viewBox="0 0 20 20"><path d="M10 3v14M5 8l5-5 5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  transfer: <svg width="13" height="13" fill="none" viewBox="0 0 20 20"><path d="M3 10h14M3 10l4-4M3 10l4 4M17 10l-4-4M17 10l-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  other: <svg width="13" height="13" fill="none" viewBox="0 0 20 20"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M10 9v5M10 7v1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
}

function fmt(n: number) {
  return '$' + Math.abs(n).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function cleanDesc(desc: string): string {
  return desc
    .replace(/^(POS|EFTPOS|BPAY|OSKO|NPP|DBT|CR|DR|TFR)\s+\d{2}\/\d{2}\s*/i, '')
    .replace(/^(POS|EFTPOS)\s+/i, '')
    .replace(/\s+(AU|QLD|NSW|VIC|WA|SA|TAS|NT|ACT)\s*$/i, '')
    .replace(/\s+/g, ' ').trim()
    .split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(0)
  useEffect(() => {
    const start = ref.current, end = value, duration = 800, startTime = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1)
      const e = 1 - Math.pow(1 - p, 3)
      const cur = start + (end - start) * e
      setDisplay(cur)
      ref.current = cur
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value])
  return <>{fmt(display)}</>
}

const NavIcon = ({ d }: { d: string }) => (
  <svg width="14" height="14" fill="none" viewBox="0 0 20 20">
    <path d={d} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

function BudgetEditor({ cat, budget, month, year, onSave }: { cat: string; budget: number; month: number; year: number; onSave: (cat: string, val: number) => void }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(String(budget))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus()
  }, [editing])

  const save = async () => {
    const num = parseFloat(val)
    if (isNaN(num) || num < 0) { setEditing(false); setVal(String(budget)); return }
    setEditing(false)
    onSave(cat, num)
    await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: cat, limitAud: num, month, year }),
    })
  }

  if (editing) {
    return (
      <span style={{ display:'inline-flex', alignItems:'center', gap:3 }}>
        <span style={{ opacity:0.4, fontSize:10 }}>$</span>
        <input
          ref={inputRef}
          value={val}
          onChange={e => setVal(e.target.value)}
          onBlur={save}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setEditing(false); setVal(String(budget)) } }}
          style={{ width:60, background:'rgba(200,255,0,0.07)', border:'1px solid rgba(200,255,0,0.25)', borderRadius:4, padding:'1px 5px', color:'rgba(200,255,0,0.8)', fontSize:11, fontFamily:"'Geist Mono',monospace", outline:'none' }}
        />
      </span>
    )
  }

  return (
    <span
      onClick={() => { setEditing(true); setVal(String(budget)) }}
      title="Click to edit budget"
      style={{ cursor:'pointer', fontFamily:"'Geist Mono',monospace", fontSize:11, color:'rgba(255,255,255,0.25)', borderBottom:'1px dashed rgba(255,255,255,0.1)', transition:'color 0.12s' }}
      onMouseEnter={e => (e.currentTarget.style.color = 'rgba(200,255,0,0.5)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
    >
      {fmt(budget)}
    </span>
  )
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [budgets, setBudgets] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [tab, setTab] = useState<'overview' | 'transactions'>('overview')
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<string>('all')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (status === 'unauthenticated') router.push('/login') }, [status])
  useEffect(() => { if (status === 'authenticated') fetchData() }, [status, month, year])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/transactions?month=${month}&year=${year}`)
      const json = await res.json()
      setData(json)
      if (json.budgets) setBudgets(json.budgets)
    } catch {}
    setLoading(false)
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncMsg('')
    try {
      const res = await fetch('/api/transactions/sync', { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        setSyncMsg(`Synced — ${json.newTransactions} new transactions`)
        await fetchData()
      } else {
        setSyncMsg(json.error ?? 'Sync failed')
      }
    } catch {
      setSyncMsg('Sync failed')
    }
    setSyncing(false)
    setTimeout(() => setSyncMsg(''), 4000)
  }

  const changeMonth = (dir: number) => {
    let m = month + dir, y = year
    if (m > 12) { m = 1; y++ }
    if (m < 1) { m = 12; y-- }
    setMonth(m); setYear(y)
  }

  if (!mounted || status === 'loading') return (
    <div style={{ minHeight:'100vh', background:'#080809', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:24, height:24, border:'1.5px solid rgba(255,255,255,0.06)', borderTop:'1.5px solid rgba(200,255,0,0.5)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
    </div>
  )

  const income = data?.summary?.income ?? 0
  const expenses = data?.summary?.expenses ?? 0
  const remaining = data?.summary?.remaining ?? 0
  const savingsRate = income > 0 ? Math.max(0, Math.round((income - expenses) / income * 100)) : 0
  const transactions: any[] = data?.transactions ?? []
  const byCategory = data?.byCategory ?? {}
  const expenseCats = Object.entries(byCategory).filter(([c]) => c !== 'income' && c !== 'transfer').sort(([,a],[,b]) => (b as number) - (a as number)) as [string, number][]

  const filteredTxns = transactions.filter(t => {
    const matchSearch = !search || cleanDesc(t.description).toLowerCase().includes(search.toLowerCase())
    const matchCat = catFilter === 'all' || t.category === catFilter
    return matchSearch && matchCat
  })

  const firstName = session?.user?.name ? (session.user.name as string).split(' ')[0] : 'there'

  const sidebarItems = [
    { label:'Overview', icon:'M3 3h6v6H3zM11 3h6v6h-6zM3 11h6v6H3zM11 11h6v6h-6z', tab:'overview' as const },
    { label:'Transactions', icon:'M3 5h14M3 10h14M3 15h9', tab:'transactions' as const },
  ]

  // Unique categories in this month's transactions for filter
  const txnCats = Array.from(new Set(transactions.map((t: any) => t.category)))

  return (
    <>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Syne:wght@600;700;800&family=Geist:wght@200;300;400;500;600&family=Geist+Mono:wght@200;300;400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{background:#080809;font-family:'Geist',sans-serif;color:#fff}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .sbi{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:7px;cursor:pointer;transition:all 0.12s;margin-bottom:1px;border:none;background:none;width:100%;text-align:left;font-family:'Geist',sans-serif}
        .sbi:hover{background:rgba(255,255,255,0.04)}
        .sbi.on{background:rgba(200,255,0,0.07)}
        .sbi-lbl{font-size:12px;color:rgba(255,255,255,0.3)}
        .sbi.on .sbi-lbl{color:rgba(255,255,255,0.8)}
        .tbtn{display:flex;align-items:center;gap:5px;padding:6px 12px;border-radius:7px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.03);font-size:11px;color:rgba(255,255,255,0.32);cursor:pointer;font-family:'Geist',sans-serif;transition:all 0.12s}
        .tbtn:hover{border-color:rgba(255,255,255,0.14);color:rgba(255,255,255,0.55)}
        .tbtn-p{background:rgba(200,255,0,0.08);border-color:rgba(200,255,0,0.18);color:rgba(200,255,0,0.75)}
        .tbtn-p:hover{background:rgba(200,255,0,0.14)}
        .tbtn-sync{background:rgba(255,255,255,0.03);border-color:rgba(255,255,255,0.07);color:rgba(255,255,255,0.4)}
        .tbtn-sync:hover{border-color:rgba(255,255,255,0.15);color:rgba(255,255,255,0.65)}
        .tbtn-sync:disabled{opacity:0.4;cursor:not-allowed}
        .sc{border-radius:13px;padding:18px 20px;position:relative;overflow:hidden}
        .sc-hero{background:rgba(200,255,0,0.04);border:1px solid rgba(200,255,0,0.1)}
        .sc-std{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05)}
        .pn{background:rgba(255,255,255,0.018);border:1px solid rgba(255,255,255,0.05);border-radius:14px;padding:18px 20px}
        .sp-row{display:flex;align-items:center;gap:11px;padding:9px 10px;border-radius:9px;cursor:default;transition:background 0.1s}
        .sp-row:hover{background:rgba(255,255,255,0.025)}
        .tx-row{display:flex;align-items:center;gap:11px;padding:9px 10px;border-radius:9px;cursor:pointer;transition:background 0.1s}
        .tx-row:hover{background:rgba(255,255,255,0.025)}
        .mnav-btn{background:none;border:none;color:rgba(255,255,255,0.3);cursor:pointer;padding:5px 8px;font-size:13px;line-height:1;transition:color 0.12s}
        .mnav-btn:hover{color:rgba(255,255,255,0.7)}
        .search-inp{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:7px;padding:5px 11px;color:rgba(255,255,255,0.6);font-size:12px;outline:none;font-family:'Geist',sans-serif;width:160px;transition:border-color 0.15s}
        .search-inp:focus{border-color:rgba(200,255,0,0.25)}
        .search-inp::placeholder{color:rgba(255,255,255,0.18)}
        .cat-sel{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:7px;padding:5px 10px;color:rgba(255,255,255,0.5);font-size:11px;outline:none;font-family:'Geist',sans-serif;cursor:pointer;transition:border-color 0.15s}
        .cat-sel:focus{border-color:rgba(200,255,0,0.25)}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.07);border-radius:99px}
      `}} />

      <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', minHeight:'100vh' }}>

        {/* ── SIDEBAR ── */}
        <aside style={{ background:'#080809', borderRight:'1px solid rgba(255,255,255,0.05)', padding:0, display:'flex', flexDirection:'column', position:'sticky', top:0, height:'100vh' }}>

          {/* Logo */}
          <div style={{ padding:'18px 16px', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ display:'flex', alignItems:'center' }}>
              <div style={{ width:24, height:24, border:'1px solid rgba(148,163,184,0.13)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', marginRight:8, flexShrink:0 }}>
                <svg width="11" height="11" fill="none" viewBox="0 0 48 48">
                  <path d="M31 14H20C16.686 14 14 16.686 14 20V28C14 31.314 16.686 34 20 34H31" stroke="rgba(200,255,0,0.85)" strokeWidth="2.8" strokeLinecap="square"/>
                  <path d="M31 19H22C20.343 19 19 20.343 19 22V26C19 27.657 20.343 29 22 29H31" stroke="rgba(200,255,0,0.35)" strokeWidth="2.2" strokeLinecap="square"/>
                  <rect x="31" y="22.5" width="3" height="3" fill="#c8ff00" opacity="0.9"/>
                </svg>
              </div>
              <span style={{ fontFamily:"'Instrument Serif',serif", fontSize:15, fontStyle:'italic', color:'rgba(148,163,184,0.9)', lineHeight:1 }}>C</span>
              <span style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, color:'#fff', letterSpacing:'-0.6px', lineHeight:1 }}>oyva</span>
              <span style={{ fontSize:17, fontWeight:200, color:'#c8ff00', marginLeft:1, position:'relative', top:1 }}>.</span>
            </div>
          </div>

          {/* Nav items */}
          <div style={{ padding:'14px 10px', flex:1 }}>
            <div style={{ fontSize:8, letterSpacing:'2px', textTransform:'uppercase', color:'rgba(255,255,255,0.14)', padding:'0 8px', marginBottom:6, fontFamily:"'Geist Mono',monospace" }}>Main</div>

            {sidebarItems.map(item => (
              <button key={item.label} className={`sbi${tab === item.tab ? ' on' : ''}`} onClick={() => setTab(item.tab)}>
                <div style={{ width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center', color: tab === item.tab ? 'rgba(200,255,0,0.7)' : 'rgba(255,255,255,0.25)', flexShrink:0 }}>
                  <NavIcon d={item.icon} />
                </div>
                <span className="sbi-lbl">{item.label}</span>
              </button>
            ))}

            <div style={{ height:'1px', background:'rgba(255,255,255,0.05)', margin:'12px 8px' }} />
            <div style={{ fontSize:8, letterSpacing:'2px', textTransform:'uppercase', color:'rgba(255,255,255,0.14)', padding:'0 8px', marginBottom:6, fontFamily:"'Geist Mono',monospace" }}>Accounts</div>

            <button className="sbi" onClick={() => router.push('/upload')}>
              <div style={{ width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.25)', flexShrink:0 }}>
                <NavIcon d="M10 3v14M5 8l5-5 5 5" />
              </div>
              <span className="sbi-lbl">Import CSV</span>
            </button>

            <button className="sbi" onClick={() => router.push('/connect')}>
              <div style={{ width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.25)', flexShrink:0 }}>
                <NavIcon d="M3 6h14M3 10h14M3 14h8" />
              </div>
              <span className="sbi-lbl">Connect bank</span>
            </button>
          </div>

          {/* User */}
          <div style={{ padding:'10px', borderTop:'1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, background:'rgba(255,255,255,0.03)', cursor:'pointer' }} onClick={() => signOut({ callbackUrl:'/login' })}>
              <div style={{ width:26, height:26, borderRadius:7, background:'rgba(200,255,0,0.1)', border:'1px solid rgba(200,255,0,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, color:'#c8ff00', flexShrink:0, fontFamily:"'Syne',sans-serif" }}>
                {firstName[0]?.toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{firstName}</div>
                <div style={{ fontSize:9, color:'rgba(255,255,255,0.2)' }}>Sign out</div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main style={{ background:'#080809', display:'flex', flexDirection:'column', minHeight:'100vh', overflow:'hidden' }}>

          {/* Top bar */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'15px 28px', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, letterSpacing:'-0.4px', color:'rgba(255,255,255,0.85)' }}>
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {firstName}
              </div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.2)', marginTop:1, fontWeight:300 }}>{MONTHS[month-1]} {year} · your finances at a glance</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              {/* Sync feedback */}
              {syncMsg && (
                <span style={{ fontSize:10, color: syncMsg.includes('failed') ? 'rgba(248,113,113,0.7)' : 'rgba(200,255,0,0.6)', fontFamily:"'Geist Mono',monospace" }}>
                  {syncMsg}
                </span>
              )}
              {/* Month nav */}
              <div style={{ display:'flex', alignItems:'center', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:7, overflow:'hidden' }}>
                <button className="mnav-btn" onClick={() => changeMonth(-1)}>‹</button>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.45)', padding:'5px 12px', fontFamily:"'Geist Mono',monospace", minWidth:72, textAlign:'center' }}>
                  {MONTHS[month-1].slice(0,3)} {year}
                </span>
                <button className="mnav-btn" onClick={() => changeMonth(1)}>›</button>
              </div>
              <button className="tbtn tbtn-sync" disabled={syncing} onClick={handleSync}>
                <svg width="11" height="11" fill="none" viewBox="0 0 20 20" style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }}>
                  <path d="M17 10A7 7 0 1110 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M17 3v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {syncing ? 'Syncing…' : 'Sync'}
              </button>
              <button className="tbtn" onClick={() => router.push('/upload')}>
                <svg width="11" height="11" fill="none" viewBox="0 0 20 20"><path d="M10 3v14M5 8l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                Import CSV
              </button>
              <button className="tbtn tbtn-p" onClick={() => router.push('/connect')}>
                <svg width="11" height="11" fill="none" viewBox="0 0 20 20"><path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                Connect bank
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding:'22px 28px', flex:1, overflowY:'auto' }}>

            {loading ? (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
                {[...Array(4)].map((_,i) => (
                  <div key={i} style={{ height:90, borderRadius:13, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)', animation:'shimmer 1.5s ease infinite', backgroundSize:'200% 100%' }} />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:16, padding:'72px 40px', textAlign:'center', animation:'fadeUp 0.5s ease both' }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:700, color:'rgba(255,255,255,0.7)', letterSpacing:'-0.8px', marginBottom:8 }}>No data for this month</div>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.25)', marginBottom:28, lineHeight:1.7, fontWeight:300 }}>Import a CSV from your bank or connect your account to get started.</p>
                <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                  <button className="tbtn tbtn-p" style={{ padding:'9px 18px', fontSize:12 }} onClick={() => router.push('/upload')}>Import CSV →</button>
                  <button className="tbtn" style={{ padding:'9px 18px', fontSize:12 }} onClick={() => router.push('/connect')}>Connect bank</button>
                </div>
              </div>
            ) : (
              <>
                {/* STAT CARDS */}
                <div style={{ display:'grid', gridTemplateColumns:'1.1fr 1fr 1fr 1fr', gap:10, marginBottom:16 }}>
                  {[
                    { label:'Remaining budget', val:<AnimatedNumber value={remaining} />, sub:`of ${fmt(income)} total`, hero:true, trend: remaining >= 0 ? '↑' : '↓', trendColor: remaining >= 0 ? 'rgba(52,211,153,0.6)' : 'rgba(248,113,113,0.6)' },
                    { label:'Income', val:<AnimatedNumber value={income} />, sub:'This month', hero:false, trend:'', trendColor:'' },
                    { label:'Spent', val:<AnimatedNumber value={expenses} />, sub:`${transactions.length} transactions`, hero:false, trend:'', trendColor:'' },
                    { label:'Savings rate', val:<>{savingsRate}%</>, sub:`${fmt(income - expenses)} saved`, hero:false, trend:'', trendColor:'' },
                  ].map((s, i) => (
                    <div key={i} className={`sc ${s.hero ? 'sc-hero' : 'sc-std'}`} style={{ animation:`fadeUp 0.5s ${i*0.06}s ease both`, opacity:0 }}>
                      <div style={{ fontSize:8, letterSpacing:'1.5px', textTransform:'uppercase', color: s.hero ? 'rgba(200,255,0,0.35)' : 'rgba(255,255,255,0.2)', marginBottom:10, fontFamily:"'Geist Mono',monospace" }}>{s.label}</div>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize: s.hero ? 28 : 22, fontWeight:700, letterSpacing:'-1.5px', lineHeight:1, color: s.hero ? 'rgba(200,255,0,0.9)' : 'rgba(255,255,255,0.75)' }}>{s.val}</div>
                      <div style={{ fontSize:9, color:'rgba(255,255,255,0.18)', marginTop:5, fontWeight:300 }}>{s.sub}</div>
                    </div>
                  ))}
                </div>

                {tab === 'overview' && (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:12 }}>

                    {/* LEFT: Spending breakdown */}
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      <div className="pn" style={{ animation:'fadeUp 0.5s 0.2s ease both', opacity:0 }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:600, letterSpacing:'-0.3px', color:'rgba(255,255,255,0.7)' }}>Spending breakdown</div>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <span style={{ fontSize:9, color:'rgba(255,255,255,0.18)', fontFamily:"'Geist Mono',monospace" }}>click budget to edit</span>
                            <button style={{ fontSize:10, color:'rgba(255,255,255,0.18)', cursor:'pointer', background:'none', border:'none', fontFamily:'Geist,sans-serif' }} onClick={() => setTab('transactions')}>All transactions →</button>
                          </div>
                        </div>
                        {expenseCats.length === 0 ? (
                          <div style={{ fontSize:12, color:'rgba(255,255,255,0.2)', textAlign:'center', padding:'32px 0' }}>No expenses this month</div>
                        ) : (
                          <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
                            {expenseCats.map(([cat, amt], i) => {
                              const meta = CAT[cat] ?? CAT.other
                              const icon = CAT_ICONS[cat] ?? CAT_ICONS.other
                              const budget = budgets[cat] ?? 0
                              const over = budget > 0 && (amt as number) > budget
                              const pct = budget > 0 ? Math.min((amt as number) / budget * 100, 100) : 50
                              return (
                                <div key={cat} className="sp-row" style={{ animation:`fadeUp 0.3s ${i*0.05}s ease both`, opacity:0 }}>
                                  <div style={{ width:30, height:30, borderRadius:8, background:`${meta.color}12`, border:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color: over ? '#f87171' : meta.color }}>
                                    {icon}
                                  </div>
                                  <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                                      <span style={{ fontSize:12, color: over ? 'rgba(248,113,113,0.7)' : 'rgba(255,255,255,0.5)', fontWeight:300 }}>{meta.label}</span>
                                      <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                                        <span style={{ fontFamily:"'Geist Mono',monospace", fontSize:11, color: over ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.35)' }}>
                                          {fmt(amt as number)}
                                        </span>
                                        {budget > 0 && (
                                          <>
                                            <span style={{ opacity:0.3, fontSize:10 }}>/</span>
                                            <BudgetEditor cat={cat} budget={budget} month={month} year={year} onSave={(c, v) => setBudgets(prev => ({ ...prev, [c]: v }))} />
                                          </>
                                        )}
                                      </span>
                                    </div>
                                    <div style={{ height:'1.5px', background:'rgba(255,255,255,0.04)', borderRadius:99 }}>
                                      <div style={{ height:'100%', width:`${pct}%`, background: over ? '#f87171' : meta.color, borderRadius:99, opacity:0.65, transition:'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RIGHT: Recent transactions */}
                    <div className="pn" style={{ padding:'16px', animation:'fadeUp 0.5s 0.25s ease both', opacity:0, overflow:'hidden' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 4px', marginBottom:12 }}>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:600, letterSpacing:'-0.3px', color:'rgba(255,255,255,0.7)' }}>Transactions</div>
                        <button style={{ fontSize:10, color:'rgba(255,255,255,0.18)', cursor:'pointer', background:'none', border:'none', fontFamily:'Geist,sans-serif' }} onClick={() => setTab('transactions')}>All →</button>
                      </div>
                      {(() => {
                        const grouped: Record<string, any[]> = {}
                        transactions.slice(0, 12).forEach((t: any) => {
                          const d = new Date(t.date)
                          const today = new Date()
                          const yesterday = new Date(); yesterday.setDate(today.getDate()-1)
                          let key = d.toLocaleDateString('en-AU', { day:'numeric', month:'short' })
                          if (d.toDateString() === today.toDateString()) key = 'Today'
                          else if (d.toDateString() === yesterday.toDateString()) key = 'Yesterday'
                          if (!grouped[key]) grouped[key] = []
                          grouped[key].push(t)
                        })
                        return Object.entries(grouped).map(([day, txns], gi) => (
                          <div key={day}>
                            <div style={{ fontSize:8, letterSpacing:'1.5px', textTransform:'uppercase', color:'rgba(255,255,255,0.14)', padding:'9px 10px 4px', fontFamily:"'Geist Mono',monospace" }}>{day}</div>
                            {txns.map((txn: any, i: number) => {
                              const meta = CAT[txn.category] ?? CAT.other
                              const icon = CAT_ICONS[txn.category] ?? CAT_ICONS.other
                              const isCredit = txn.direction === 'credit'
                              return (
                                <div key={txn.id} className="tx-row" style={{ animation:`fadeUp 0.3s ${(gi*3+i)*0.03}s ease both`, opacity:0 }}>
                                  <div style={{ width:30, height:30, borderRadius:8, background:`${meta.color}10`, border:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color: isCredit ? 'rgba(52,211,153,0.6)' : meta.color }}>
                                    {icon}
                                  </div>
                                  <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.65)', fontWeight:300, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{cleanDesc(txn.description)}</div>
                                    <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:2 }}>
                                      <span style={{ fontSize:8, padding:'2px 6px', borderRadius:3, background:`${meta.color}12`, color:`${meta.color}99`, fontFamily:"'Geist Mono',monospace", letterSpacing:'0.3px' }}>{meta.label}</span>
                                      <span style={{ fontSize:9, color:'rgba(255,255,255,0.14)', fontFamily:"'Geist Mono',monospace" }}>{new Date(txn.date).toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit' })}</span>
                                    </div>
                                  </div>
                                  <div style={{ fontFamily:"'Geist Mono',monospace", fontSize:12, fontWeight:300, flexShrink:0, color: isCredit ? 'rgba(200,255,0,0.7)' : 'rgba(255,255,255,0.3)' }}>
                                    {isCredit ? '+' : '−'}{fmt(txn.amount)}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ))
                      })()}
                    </div>
                  </div>
                )}

                {tab === 'transactions' && (
                  <div className="pn" style={{ padding:'18px', animation:'fadeUp 0.4s ease both', opacity:0 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:600, letterSpacing:'-0.3px', color:'rgba(255,255,255,0.7)' }}>{filteredTxns.length} transactions</div>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <select
                          className="cat-sel"
                          value={catFilter}
                          onChange={e => setCatFilter(e.target.value)}
                        >
                          <option value="all">All categories</option>
                          {txnCats.map(c => (
                            <option key={c} value={c}>{CAT[c]?.label ?? c}</option>
                          ))}
                        </select>
                        <input className="search-inp" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." />
                      </div>
                    </div>
                    {filteredTxns.length === 0 ? (
                      <div style={{ fontSize:12, color:'rgba(255,255,255,0.2)', textAlign:'center', padding:'40px 0' }}>No transactions match your filter</div>
                    ) : (
                      (() => {
                        const grouped: Record<string, any[]> = {}
                        filteredTxns.forEach((t: any) => {
                          const d = new Date(t.date)
                          const today = new Date()
                          const yesterday = new Date(); yesterday.setDate(today.getDate()-1)
                          let key = d.toLocaleDateString('en-AU', { weekday:'short', day:'numeric', month:'short' })
                          if (d.toDateString() === today.toDateString()) key = 'Today'
                          else if (d.toDateString() === yesterday.toDateString()) key = 'Yesterday'
                          if (!grouped[key]) grouped[key] = []
                          grouped[key].push(t)
                        })
                        return Object.entries(grouped).map(([day, txns], gi) => (
                          <div key={day}>
                            <div style={{ fontSize:8, letterSpacing:'1.5px', textTransform:'uppercase', color:'rgba(255,255,255,0.14)', padding:'10px 10px 4px', fontFamily:"'Geist Mono',monospace" }}>{day}</div>
                            {txns.map((txn: any, i: number) => {
                              const meta = CAT[txn.category] ?? CAT.other
                              const icon = CAT_ICONS[txn.category] ?? CAT_ICONS.other
                              const isCredit = txn.direction === 'credit'
                              return (
                                <div key={txn.id} className="tx-row" style={{ borderBottom: i < txns.length-1 ? '1px solid rgba(255,255,255,0.03)' : 'none', animation:`fadeUp 0.3s ${Math.min(i,12)*0.02}s ease both`, opacity:0 }}>
                                  <div style={{ width:32, height:32, borderRadius:9, background:`${meta.color}10`, border:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color: isCredit ? 'rgba(52,211,153,0.6)' : meta.color }}>
                                    {icon}
                                  </div>
                                  <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ fontSize:13, color:'rgba(255,255,255,0.65)', fontWeight:300 }}>{cleanDesc(txn.description)}</div>
                                    <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
                                      <span style={{ fontSize:8, padding:'2px 6px', borderRadius:3, background:`${meta.color}10`, color:`${meta.color}90`, fontFamily:"'Geist Mono',monospace" }}>{meta.label}</span>
                                      <span style={{ fontSize:9, color:'rgba(255,255,255,0.14)', fontFamily:"'Geist Mono',monospace" }}>{new Date(txn.date).toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit' })}</span>
                                    </div>
                                  </div>
                                  <div style={{ fontFamily:"'Geist Mono',monospace", fontSize:13, fontWeight:300, color: isCredit ? 'rgba(200,255,0,0.7)' : 'rgba(255,255,255,0.3)', flexShrink:0 }}>
                                    {isCredit ? '+' : '−'}{fmt(txn.amount)}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ))
                      })()
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </>
  )
}
