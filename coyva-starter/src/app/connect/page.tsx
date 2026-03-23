'use client'
// src/app/connect/page.tsx
// The "Connect your bank" screen. Calls our API to get the CDR consent URL,
// then redirects the user to their bank's consent screen.

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

const BANKS = [
  { name: 'Commonwealth Bank', logo: '🟡', id: 'AU00000' },
  { name: 'NAB',               logo: '🔴', id: 'AU00001' },
  { name: 'ANZ',               logo: '🔵', id: 'AU00002' },
  { name: 'Westpac',           logo: '🔴', id: 'AU00003' },
  { name: 'Macquarie',         logo: '⚫', id: 'AU00004' },
  { name: 'Up Bank',           logo: '🟣', id: 'AU00005' },
  { name: 'ING',               logo: '🟠', id: 'AU00006' },
  { name: 'Bendigo Bank',      logo: '🟡', id: 'AU00007' },
]

export default function ConnectPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  async function handleConnect() {
    if (!selected) return
    setLoading(true)
    try {
      const res  = await fetch('/api/basiq/connect', { method: 'POST' })
      const data = await res.json()

      if (data.consentUrl) {
        // Redirect to bank's CDR consent screen
        window.location.href = data.consentUrl
      } else {
        alert('Failed to initiate connection. Please try again.')
        setLoading(false)
      }
    } catch {
      alert('Something went wrong.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f4', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '48px 24px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#4a7c59', marginBottom: 8 }}>
            Coyva<span style={{ color: '#c9972b' }}>.</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Connect your bank</h1>
          <p style={{ color: '#666', lineHeight: 1.6, fontSize: 15 }}>
            Coyva uses Australia's Consumer Data Right (CDR) to securely read your transactions.
            Your bank credentials are never shared with us.
          </p>
        </div>

        {/* CDR trust badge */}
        <div style={{
          background: '#e8f0eb', border: '1px solid #c2d9c9',
          borderRadius: 12, padding: '14px 18px',
          display: 'flex', gap: 12, alignItems: 'flex-start',
          marginBottom: 32,
        }}>
          <span style={{ fontSize: 20 }}>🔒</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#2d5c3d', marginBottom: 2 }}>
              Secured by Australian CDR
            </div>
            <div style={{ fontSize: 13, color: '#4a7c59', lineHeight: 1.5 }}>
              Accredited by the ACCC. Read-only access. You can revoke consent anytime through your bank.
            </div>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div style={{
            background: '#fde8e8', border: '1px solid #f5c6c6',
            borderRadius: 10, padding: '12px 16px', marginBottom: 24,
            color: '#c0392b', fontSize: 14,
          }}>
            {error === 'consent_expired'
              ? 'Your consent has expired. Please reconnect your bank.'
              : 'Connection failed. Please try again.'}
          </div>
        )}

        {/* Bank selector */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#888', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 12 }}>
            Select your bank
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {BANKS.map((bank) => (
              <button
                key={bank.id}
                onClick={() => setSelected(bank.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 14px',
                  border: selected === bank.id ? '2px solid #4a7c59' : '1.5px solid #ddd',
                  borderRadius: 10,
                  background: selected === bank.id ? '#e8f0eb' : '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 14,
                  fontWeight: selected === bank.id ? 600 : 400,
                  color: selected === bank.id ? '#2d5c3d' : '#333',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 20 }}>{bank.logo}</span>
                {bank.name}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: '#999', marginTop: 10 }}>
            Don't see your bank? More institutions are added regularly via the CDR register.
          </p>
        </div>

        {/* Connect button */}
        <button
          onClick={handleConnect}
          disabled={!selected || loading}
          style={{
            width: '100%',
            padding: '15px',
            background: selected ? '#4a7c59' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 600,
            cursor: selected ? 'pointer' : 'not-allowed',
            transition: 'background 0.15s',
          }}
        >
          {loading ? 'Redirecting to your bank…' : 'Connect securely →'}
        </button>

        {/* Fine print */}
        <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center', marginTop: 20, lineHeight: 1.6 }}>
          By connecting, you consent to Coyva accessing your transaction data for budgeting purposes.
          Consent is valid for 12 months and can be revoked at any time.
          Read our <a href="/privacy" style={{ color: '#4a7c59' }}>Privacy Policy</a>.
        </p>
      </div>
    </div>
  )
}
