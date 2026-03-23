'use client'
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const BANKS = [
  { name: 'Commonwealth Bank', hint: 'NetBank → Accounts → Export transactions' },
  { name: 'NAB', hint: 'Internet Banking → Accounts → Download transactions' },
  { name: 'ANZ', hint: 'ANZ Internet Banking → Accounts → Download CSV' },
  { name: 'Westpac', hint: 'Westpac Live → Account History → Export' },
  { name: 'Up Bank', hint: 'Up app → Insights → Export CSV' },
  { name: 'Macquarie', hint: 'Macquarie Online → Transaction History → Export' },
  { name: 'ING', hint: 'ING Online Banking → Accounts → Download' },
  { name: 'Bendigo Bank', hint: 'e-banking → Accounts → Export transactions' },
]

export default function UploadPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.csv')) { setError('Please upload a CSV file.'); return }
    setFile(f); setError(''); setResult(null)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const upload = async () => {
    if (!file) return
    setUploading(true); setError(''); setResult(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/transactions/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Upload failed'); setUploading(false); return }
      setResult(data)
    } catch { setError('Something went wrong. Please try again.') }
    setUploading(false)
  }

  return (
    <>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Syne:wght@700;800&family=Geist:wght@200;300;400;500;600&family=Geist+Mono:wght@200;300;400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{background:#080809;font-family:'Geist',sans-serif;color:#fff}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .back-btn{font-size:11px;color:rgba(255,255,255,0.3);background:none;border:none;cursor:pointer;font-family:'Geist',sans-serif;display:flex;align-items:center;gap:6px;transition:color 0.15s;padding:0}
        .back-btn:hover{color:rgba(255,255,255,0.65)}
        .drop-zone{border:1px dashed rgba(255,255,255,0.12);border-radius:14px;padding:44px 32px;text-align:center;cursor:pointer;transition:all 0.2s;margin-bottom:14px}
        .drop-zone:hover{border-color:rgba(200,255,0,0.25);background:rgba(200,255,0,0.02)}
        .ubtn{width:100%;padding:12px;background:#c8ff00;color:#080809;border:none;border-radius:10px;font-size:13px;font-weight:500;cursor:pointer;font-family:'Geist',sans-serif;transition:opacity 0.15s;margin-bottom:22px}
        .ubtn:hover:not(:disabled){opacity:0.85}
        .ubtn:disabled{background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.2);cursor:not-allowed}
        .bank-card{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:13px 15px}
        .dbtn{width:100%;padding:11px;background:#c8ff00;color:#080809;border:none;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;font-family:'Geist',sans-serif;transition:opacity 0.15s}
        .dbtn:hover{opacity:0.85}
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

        <div style={{ maxWidth:580, margin:'0 auto', padding:'44px 24px', animation:'fadeUp 0.5s ease both' }}>

          <div style={{ marginBottom:32 }}>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, letterSpacing:'-1px', color:'#fff', marginBottom:8 }}>Import bank statement</h1>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.25)', lineHeight:1.7, fontWeight:300 }}>Download a CSV from your bank and upload it here. We'll automatically detect your bank and categorise everything.</p>
          </div>

          {/* Drop zone */}
          <div
            className="drop-zone"
            onClick={() => fileRef.current?.click()}
            onDrop={onDrop}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            style={{
              borderColor: dragging ? 'rgba(200,255,0,0.4)' : file ? 'rgba(200,255,0,0.2)' : undefined,
              background: dragging ? 'rgba(200,255,0,0.03)' : file ? 'rgba(200,255,0,0.02)' : undefined,
            }}
          >
            <div style={{ marginBottom:12 }}>
              {file ? (
                <div style={{ width:40, height:40, borderRadius:10, background:'rgba(200,255,0,0.08)', border:'1px solid rgba(200,255,0,0.15)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto' }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 20 20"><path d="M10 3v14M5 8l5-5 5 5" stroke="rgba(200,255,0,0.7)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
              ) : (
                <div style={{ width:40, height:40, borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto' }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 20 20"><path d="M4 13V15a2 2 0 002 2h8a2 2 0 002-2v-2M10 3v10M7 6l3-3 3 3" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
              )}
            </div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, color: file ? 'rgba(200,255,0,0.8)' : 'rgba(255,255,255,0.7)', marginBottom:4, letterSpacing:'-0.3px' }}>
              {file ? file.name : 'Drop your CSV here'}
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.2)', fontWeight:300 }}>
              {file ? `${(file.size / 1024).toFixed(1)} KB · Click to change` : 'or click to browse · CSV only · Max 5MB'}
            </div>
            <input ref={fileRef} type="file" accept=".csv" style={{ display:'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>

          {error && (
            <div style={{ background:'rgba(248,113,113,0.07)', border:'1px solid rgba(248,113,113,0.18)', borderRadius:9, padding:'10px 14px', color:'#f87171', fontSize:12, marginBottom:14, fontWeight:300 }}>
              {error}
            </div>
          )}

          <button className="ubtn" onClick={upload} disabled={!file || uploading}>
            {uploading ? 'Analysing your transactions...' : file ? 'Import transactions →' : 'Select a CSV file first'}
          </button>

          {/* Result */}
          {result && (
            <div style={{ background:'rgba(200,255,0,0.03)', border:'1px solid rgba(200,255,0,0.12)', borderRadius:14, padding:22, marginBottom:22, animation:'fadeUp 0.4s ease both' }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, color:'#fff', letterSpacing:'-0.5px', marginBottom:4 }}>Import complete</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.25)', marginBottom:18, fontWeight:300 }}>
                Detected: <span style={{ color:'rgba(200,255,0,0.7)', fontWeight:500 }}>{result.bank}</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:18 }}>
                {[
                  { label:'Imported', val:result.imported, color:'rgba(52,211,153,0.8)' },
                  { label:'Duplicates', val:result.skipped, color:'rgba(255,255,255,0.3)' },
                  { label:'Total found', val:result.parsed, color:'rgba(255,255,255,0.5)' },
                ].map(s => (
                  <div key={s.label} style={{ background:'rgba(255,255,255,0.03)', borderRadius:9, padding:'13px', textAlign:'center' }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:700, letterSpacing:'-1px', color:s.color }}>{s.val}</div>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,0.2)', marginTop:3, textTransform:'uppercase', letterSpacing:'1px' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <button className="dbtn" onClick={() => router.push('/dashboard')}>View in dashboard →</button>
            </div>
          )}

          {/* Bank instructions */}
          {!result && (
            <>
              <div style={{ fontSize:8, letterSpacing:'2px', textTransform:'uppercase', color:'rgba(255,255,255,0.14)', marginBottom:12, fontFamily:"'Geist Mono',monospace" }}>How to export from your bank</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {BANKS.map(b => (
                  <div key={b.name} className="bank-card">
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.65)', marginBottom:3, letterSpacing:'-0.3px' }}>{b.name}</div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.22)', lineHeight:1.6, fontWeight:300 }}>{b.hint}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
