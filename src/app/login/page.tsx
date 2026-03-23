'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await signIn('credentials', { email: form.email, password: form.password, redirect: false })
    if (result?.ok) { router.push('/dashboard') } else { setError('Incorrect email or password'); setLoading(false) }
  }

  return (
    <>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Syne:wght@700;800&family=Geist:wght@200;300;400;500;600&family=Geist+Mono:wght@200;300;400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{background:#080809;font-family:'Geist',sans-serif}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .inp{width:100%;padding:10px 14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;font-size:13px;outline:none;color:#fff;font-family:'Geist',sans-serif;font-weight:300;transition:border-color 0.15s;margin-bottom:14px}
        .inp:focus{border-color:rgba(200,255,0,0.4)!important}
        .inp::placeholder{color:rgba(255,255,255,0.18)}
        .sbtn{width:100%;padding:11px;background:#c8ff00;color:#080809;border:none;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;font-family:'Geist',sans-serif;transition:opacity 0.15s;margin-top:4px}
        .sbtn:hover{opacity:0.88}
        .sbtn:disabled{opacity:0.5;cursor:not-allowed}
      `}} />
      <div style={{ minHeight:'100vh', background:'#080809', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
        <div style={{ width:'100%', maxWidth:360, animation:'fadeUp 0.5s ease both' }}>

          {/* Logo */}
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', gap:0, marginBottom:20 }}>
              <div style={{ width:30, height:30, border:'1px solid rgba(148,163,184,0.15)', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', marginRight:8 }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 48 48">
                  <path d="M31 14H20C16.686 14 14 16.686 14 20V28C14 31.314 16.686 34 20 34H31" stroke="rgba(200,255,0,0.85)" strokeWidth="2.8" strokeLinecap="square"/>
                  <path d="M31 19H22C20.343 19 19 20.343 19 22V26C19 27.657 20.343 29 22 29H31" stroke="rgba(200,255,0,0.35)" strokeWidth="2.2" strokeLinecap="square"/>
                  <rect x="31" y="22.5" width="3" height="3" fill="#c8ff00" opacity="0.9"/>
                </svg>
              </div>
              <span style={{ fontFamily:"'Instrument Serif',serif", fontSize:20, fontStyle:'italic', color:'rgba(148,163,184,0.9)', lineHeight:1 }}>C</span>
              <span style={{ fontFamily:"'Syne',sans-serif", fontSize:19, fontWeight:700, color:'#fff', letterSpacing:'-0.7px', lineHeight:1 }}>oyva</span>
              <span style={{ fontSize:23, fontWeight:200, color:'#c8ff00', marginLeft:1, position:'relative', top:1 }}>.</span>
            </div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:700, color:'#fff', letterSpacing:'-0.8px', marginBottom:5 }}>Welcome back</h1>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.25)', fontWeight:300 }}>Sign in to your account</p>
          </div>

          {/* Form card */}
          <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:26 }}>
            <form onSubmit={handleSubmit}>
              <label style={{ display:'block', fontSize:9, fontWeight:400, color:'rgba(255,255,255,0.25)', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:7, fontFamily:"'Geist Mono',monospace" }}>Email</label>
              <input className="inp" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required placeholder="you@email.com" />

              <label style={{ display:'block', fontSize:9, fontWeight:400, color:'rgba(255,255,255,0.25)', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:7, fontFamily:"'Geist Mono',monospace" }}>Password</label>
              <input className="inp" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required placeholder="••••••••" />

              {error && (
                <div style={{ background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:7, padding:'9px 12px', color:'#f87171', fontSize:12, marginBottom:14, fontWeight:300 }}>
                  {error}
                </div>
              )}

              <button className="sbtn" type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in →'}
              </button>
            </form>
          </div>

          <p style={{ textAlign:'center', fontSize:12, color:'rgba(255,255,255,0.2)', marginTop:18, fontWeight:300 }}>
            Don't have an account?{' '}
            <a href="/register" style={{ color:'#c8ff00', fontWeight:500, textDecoration:'none', opacity:0.85 }}>Create one free</a>
          </p>
        </div>
      </div>
    </>
  )
}
