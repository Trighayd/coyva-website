'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ConnectPage() {
  const router = useRouter()
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')

  const connect = async () => {
    setConnecting(true); setError('')
    try {
      const res = await fetch('/api/basiq/connect', { method: 'POST' })
      const data = await res.json()
      if (data.consentUrl) { window.location.href = data.consentUrl }
      else { setError(data.error ?? 'Connection failed'); setConnecting(false) }
    } catch { setError('Something went wrong. Please try again.'); setConnecting(false) }
  }

  return (
    <>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Syne:wght@700;800&family=Geist:wght@200;300;400;500;600&family=Geist+Mono:wght@200;300;400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{background:#080809;font-family:'Geist',sans-serif;color:#fff}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .back-btn{font-size:11px;color:rgba(255,255,255,0.3);background:none;border:none;cursor:pointer;font-family:'Geist',sans-serif;display:flex;align-items:center;gap:6px;transition:color 0.15s}
        .back-btn:hover{color:rgba(255,255,255,0.65)}
        .badge{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:18px 14px;text-align:center;transition:border-color 0.2s}
        .badge:hover{border-color:rgba(255,255,255,0.1)}
        .cbtn{width:100%;padding:13px;background:#c8ff00;color:#080809;border:none;border-radius:10px;font-size:13px;font-weight:500;cursor:pointer;font-family:'Geist',sans-serif;transition:opacity 0.15s;margin-bottom:10px}
        .cbtn:hover:not(:disabled){opacity:0.85}
        .cbtn:disabled{opacity:0.5;cursor:not-allowed}
        .cbtn-ghost{width:100%;padding:12px;background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.4);border:1px solid rgba(255,255,255,0.08);border-radius:10px;font-size:13px;cursor:pointer;font-family:'Geist',sans-serif;transition:all 0.15s}
        .cbtn-ghost:hover{border-color:rgba(255,255,255,0.16);color:rgba(255,255,255,0.65)}
      `}} />

      <div style={{ minHeight:'100vh', background:'#080809' }}>

        {/* Nav */}
        <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 36px', borderBottom:'1px solid rgba(255,255,255,0.05)', background:'#080809' }}>
          <div style={{ display:'flex', alignItems:'center' }}>
            <div style={{ width:22, height:22, border:'1px solid rgba(148,163,184,0.12)', borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center', marginRight:7 }}>
              <svg width="10" height="10" fill="none" viewBox="0 0 48 48">
                <path d="M31 14H20C16.686 14 14 16.686 14 20V28C14 31.314 16.686 34 20 34H31" stroke="rgba(200,255,0,0.85)" strokeWidth="2.8" strokeLinecap="square"/>
                <path d="M31 19H22C20.343 19 19 20.343 19 22V26C19 27.657 20.343 29 22 29H31" stroke="rgba(200,255,0,0.35)" strokeWidth="2.2" strokeLinecap="square"/>
                <rect x="31" y="22.5" width="3" height="3" fill="#c8ff00" opacity="0.9"/>
              </svg>
            </div>
            <span style={{ fontFamily:"'Instrument Serif',serif", fontSize:15, fontStyle:'italic', color:'rgba(148,163,184,0.9)', lineHeight:1 }}>C</span>
            <span style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, color:'#fff', letterSpacing:'-0.6px', lineHeight:1 }}>oyva</span>
            <span style={{ fontSize:17, fontWeight:200, color:'#c8ff00', marginLeft:1, position:'relative', top:1 }}>.</span>
          </div>
          <button className="back-btn" onClick={() => router.push('/dashboard')}>
            <svg width="12" height="12" fill="none" viewBox="0 0 20 20"><path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Back to dashboard
          </button>
        </nav>

        <div style={{ maxWidth:480, margin:'0 auto', padding:'52px 24px', animation:'fadeUp 0.5s ease both' }}>

          {/* Header */}
          <div style={{ marginBottom:36 }}>
            <div style={{ fontFamily:"'Geist Mono',monospace", fontSize:8, letterSpacing:'2px', textTransform:'uppercase', color:'rgba(200,255,0,0.3)', marginBottom:10 }}>/ Connect</div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, letterSpacing:'-1px', color:'#fff', marginBottom:10 }}>
              Link your <em style={{ fontFamily:"'Instrument Serif',serif", fontStyle:'italic', fontWeight:400, color:'rgba(148,163,184,0.5)', fontSize:'1.1em', letterSpacing:'-1px' }}>bank.</em>
            </h1>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.25)', lineHeight:1.7, fontWeight:300 }}>
              Securely link your bank account via Australia's Consumer Data Right framework. Your credentials are never shared with Coyva.
            </p>
          </div>

          {/* Trust badges */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:28 }}>
            {[
              { icon:<svg width="16" height="16" fill="none" viewBox="0 0 20 20"><rect x="4" y="9" width="12" height="9" rx="1.5" stroke="rgba(200,255,0,0.6)" strokeWidth="1.3"/><path d="M7 9V6a3 3 0 016 0v3" stroke="rgba(200,255,0,0.6)" strokeWidth="1.3"/></svg>, title:'Read only', desc:'We can never move your money' },
              { icon:<svg width="16" height="16" fill="none" viewBox="0 0 20 20"><path d="M10 2l7 3v5c0 4-3 7-7 8C7 17 4 14 3 10V5l7-3z" stroke="rgba(200,255,0,0.6)" strokeWidth="1.3"/></svg>, title:'CDR regulated', desc:'Government backed framework' },
              { icon:<svg width="16" height="16" fill="none" viewBox="0 0 20 20"><path d="M10 3v14M3 10l7-7 7 7" stroke="rgba(200,255,0,0.6)" strokeWidth="1.3" strokeLinecap="round"/></svg>, title:'Instant sync', desc:'Transactions update automatically' },
            ].map(b => (
              <div key={b.title} className="badge">
                <div style={{ display:'flex', justifyContent:'center', marginBottom:8 }}>{b.icon}</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.7)', marginBottom:3, letterSpacing:'-0.2px' }}>{b.title}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.22)', lineHeight:1.4, fontWeight:300 }}>{b.desc}</div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height:1, background:'rgba(255,255,255,0.05)', marginBottom:24 }} />

          {/* Supported banks */}
          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:8, letterSpacing:'2px', textTransform:'uppercase', color:'rgba(255,255,255,0.14)', fontFamily:"'Geist Mono',monospace", marginBottom:12 }}>Supported banks</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
              {[{ic:'N',bg:'#d32f2f',fg:'#fff',nm:'NAB'},{ic:'C',bg:'#ffcc00',fg:'#000',nm:'CommBank'},{ic:'A',bg:'#007dba',fg:'#fff',nm:'ANZ'},{ic:'W',bg:'#d5002b',fg:'#fff',nm:'Westpac'},{ic:'B',bg:'#ee3524',fg:'#fff',nm:'Bankwest'},{ic:'S',bg:'#00a651',fg:'#fff',nm:'St.George'}].map((b,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', borderRadius:6, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width:16, height:16, borderRadius:3, background:b.bg, color:b.fg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700, fontFamily:"'Syne',sans-serif", flexShrink:0 }}>{b.ic}</div>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>{b.nm}</span>
                </div>
              ))}
              <div style={{ display:'flex', alignItems:'center', padding:'5px 10px', borderRadius:6, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)', fontWeight:300 }}>+ 64 more</span>
              </div>
            </div>
          </div>

          {error && (
            <div style={{ background:'rgba(248,113,113,0.07)', border:'1px solid rgba(248,113,113,0.18)', borderRadius:9, padding:'10px 14px', color:'#f87171', fontSize:12, marginBottom:16, fontWeight:300 }}>
              {error}
            </div>
          )}

          <button className="cbtn" onClick={connect} disabled={connecting}>
            {connecting ? 'Connecting...' : 'Connect with Open Banking →'}
          </button>

          <button className="cbtn-ghost" onClick={() => router.push('/upload')}>
            Upload a CSV instead
          </button>

          <p style={{ textAlign:'center', fontSize:10, color:'rgba(255,255,255,0.14)', marginTop:20, lineHeight:1.7, fontWeight:300 }}>
            Powered by Basiq · Australian CDR accredited<br/>Your data is encrypted and never sold
          </p>
        </div>
      </div>
    </>
  )
}
