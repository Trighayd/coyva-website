'use client'
// src/app/register/page.tsx

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm]     = useState({ name: '', email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // 1. Create the account
    const res  = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Registration failed')
      setLoading(false)
      return
    }

    // 2. Immediately sign in with the new credentials
    const result = await signIn('credentials', {
      email:    form.email,
      password: form.password,
      redirect: false,
    })

    if (result?.ok) {
      router.push('/connect')   // send them to connect their bank
    } else {
      setError('Account created but sign-in failed — please go to /login')
      setLoading(false)
    }
  }

  const field = (label: string, key: keyof typeof form, type = 'text') => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#666', letterSpacing: '0.7px', textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        required={key !== 'name'}
        style={{ width: '100%', padding: '11px 14px', border: '1px solid #ddd', borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
      />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 30, fontWeight: 700, color: '#4a7c59' }}>Coyva<span style={{ color: '#c9972b' }}>.</span></div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: '8px 0 4px' }}>Create your account</h1>
          <p style={{ color: '#888', fontSize: 14 }}>Free to use · No credit card required</p>
        </div>

        <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 16, padding: 28, border: '0.5px solid #e5e5e5' }}>
          {field('Name (optional)', 'name')}
          {field('Email address', 'email', 'email')}
          {field('Password', 'password', 'password')}

          {error && (
            <div style={{ background: '#fde8e8', border: '1px solid #f5c6c6', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 14, color: '#c0392b' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: 14, background: loading ? '#aaa' : '#4a7c59', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Creating account…' : 'Create account →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 14, color: '#888', marginTop: 20 }}>
          Already have an account?{' '}
          <a href="/login" style={{ color: '#4a7c59', fontWeight: 500 }}>Sign in</a>
        </p>
      </div>
    </div>
  )
}
