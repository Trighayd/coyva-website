'use client'
// src/app/login/page.tsx

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
    const result = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    })
    if (result?.ok) {
      router.push('/dashboard')
    } else {
      setError('Incorrect email or password')
      setLoading(false)
    }
  }

  const s: Record<string, React.CSSProperties> = {
    page: { minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif", padding: '20px' },
    box: { width: '100%', maxWidth: 400 },
    logo: { fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: '#f0f0ee', textAlign: 'center', marginBottom: 8 },
    logoSpan: { color: '#b4f04a' },
    title: { fontSize: 22, fontWeight: 600, color: '#f0f0ee', textAlign: 'center', marginBottom: 6, fontFamily: "'Syne', sans-serif" },
    sub: { fontSize: 14, color: '#555', textAlign: 'center', marginBottom: 36 },
    form: { background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 28 },
    label: { display: 'block', fontSize: 11, fontWeight: 500, color: '#555', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8 },
    input: { width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#f0f0ee', fontFamily: "'Inter', sans-serif", fontSize: 15, outline: 'none', boxSizing: 'border-box', marginBottom: 16 },
    btn: { width: '100%', padding: 14, background: '#b4f04a', color: '#0a0a0a', border: 'none', borderRadius: 10, fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 4 },
    error: { background: 'rgba(255,85,85,0.08)', border: '1px solid rgba(255,85,85,0.2)', borderRadius: 8, padding: '10px 14px', color: '#ff8888', fontSize: 13, marginBottom: 16 },
    link: { textAlign: 'center', fontSize: 13, color: '#555', marginTop: 20 },
    linkA: { color: '#b4f04a', textDecoration: 'none', fontWeight: 500 },
  }

  return (
    <div style={s.page}>
      <div style={s.box}>
        <div style={s.logo}>Coyva<span style={s.logoSpan}>.</span></div>
        <div style={s.title}>Welcome back</div>
        <div style={s.sub}>Sign in to your account</div>
        <form style={s.form} onSubmit={handleSubmit}>
          <label style={s.label}>Email</label>
          <input style={s.input} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required placeholder="you@email.com" />
          <label style={s.label}>Password</label>
          <input style={s.input} type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required placeholder="••••••••" />
          {error && <div style={s.error}>{error}</div>}
          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in →'}
          </button>
        </form>
        <div style={s.link}>
          Don't have an account?{' '}
          <a href="/register" style={s.linkA}>Create one free</a>
        </div>
      </div>
    </div>
  )
}
