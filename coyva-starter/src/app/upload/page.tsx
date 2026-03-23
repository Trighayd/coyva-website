'use client'
// src/app/upload/page.tsx
// CSV upload page — drag and drop bank statement

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const SUPPORTED_BANKS = [
  { name: 'Commonwealth Bank', hint: 'NetBank → Accounts → Export transactions as CSV' },
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
    if (!f.name.endsWith('.csv')) {
      setError('Please upload a CSV file. Most banks let you export as CSV from their internet banking.')
      return
    }
    setFile(f)
    setError('')
    setResult(null)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)

  const upload = async () => {
    if (!file) return
    setUploading(true)
    setError('')
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/transactions/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Upload failed')
        setUploading(false)
        return
      }

      setResult(data)
      setUploading(false)
    } catch {
      setError('Something went wrong. Please try again.')
      setUploading(false)
    }
  }

  const s: Record<string, React.CSSProperties> = {
    page: { minHeight: '100vh', background: '#0a0a0a', fontFamily: "'Inter', sans-serif", color: '#f0f0ee', padding: '80px 24px 60px' },
    inner: { maxWidth: 720, margin: '0 auto' },
    back: { display: 'inline-flex', alignItems: 'center', gap: 8, color: '#666', fontSize: 14, textDecoration: 'none', marginBottom: 40, cursor: 'pointer', background: 'none', border: 'none' },
    logo: { fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: '#f0f0ee', marginBottom: 8 },
    logoSpan: { color: '#b4f04a' },
    h1: { fontSize: 32, fontWeight: 700, letterSpacing: '-1px', marginBottom: 8, fontFamily: "'Syne', sans-serif" },
    sub: { fontSize: 16, color: '#666', marginBottom: 48, lineHeight: 1.6 },
    dropzone: {
      border: `2px dashed ${dragging ? '#b4f04a' : file ? 'rgba(180,240,74,0.4)' : 'rgba(255,255,255,0.1)'}`,
      borderRadius: 20,
      padding: '60px 40px',
      textAlign: 'center',
      background: dragging ? 'rgba(180,240,74,0.04)' : file ? 'rgba(180,240,74,0.02)' : 'rgba(255,255,255,0.02)',
      cursor: 'pointer',
      transition: 'all 0.2s',
      marginBottom: 24,
    },
    dropIcon: { fontSize: 48, marginBottom: 16 },
    dropTitle: { fontSize: 18, fontWeight: 600, marginBottom: 8, color: file ? '#b4f04a' : '#f0f0ee' },
    dropSub: { fontSize: 14, color: '#666' },
    fileInfo: { background: 'rgba(180,240,74,0.08)', border: '1px solid rgba(180,240,74,0.2)', borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    fileName: { fontSize: 14, color: '#b4f04a', fontFamily: "'JetBrains Mono', monospace" },
    fileSize: { fontSize: 12, color: '#666' },
    btn: {
      width: '100%', padding: '16px', background: file && !uploading ? '#b4f04a' : '#222',
      color: file && !uploading ? '#0a0a0a' : '#444', border: 'none', borderRadius: 14,
      fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, cursor: file ? 'pointer' : 'not-allowed',
      transition: 'all 0.2s', marginBottom: 16,
    },
    error: { background: 'rgba(255,85,85,0.08)', border: '1px solid rgba(255,85,85,0.2)', borderRadius: 12, padding: '14px 20px', color: '#ff8888', fontSize: 14, marginBottom: 20 },
    result: { background: 'rgba(180,240,74,0.06)', border: '1px solid rgba(180,240,74,0.2)', borderRadius: 16, padding: 24, marginBottom: 24 },
    resultTitle: { fontSize: 18, fontWeight: 700, color: '#b4f04a', marginBottom: 16, fontFamily: "'Syne', sans-serif" },
    statGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 },
    stat: { background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px', textAlign: 'center' as const },
    statNum: { fontSize: 28, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: '#f0f0ee' },
    statLabel: { fontSize: 11, color: '#666', marginTop: 2, textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
    dashBtn: { display: 'block', width: '100%', padding: '14px', background: '#b4f04a', color: '#0a0a0a', border: 'none', borderRadius: 12, fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, cursor: 'pointer', textAlign: 'center' as const, textDecoration: 'none' },
    banksTitle: { fontSize: 13, fontWeight: 500, color: '#444', letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 16, marginTop: 48 },
    bankGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
    bankCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 14px' },
    bankName: { fontSize: 13, fontWeight: 500, color: '#f0f0ee', marginBottom: 4 },
    bankHint: { fontSize: 11, color: '#555', lineHeight: 1.5 },
  }

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <button style={s.back} onClick={() => router.push('/dashboard')}>← Back to dashboard</button>

        <div style={s.logo}>Coyva<span style={s.logoSpan}>.</span></div>
        <h1 style={s.h1}>Import your bank statement</h1>
        <p style={s.sub}>
          Download a CSV from your bank's internet banking and upload it here.
          Coyva will automatically detect your bank and categorise everything.
        </p>

        {/* Drop zone */}
        <div
          style={s.dropzone}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => fileRef.current?.click()}
        >
          <div style={s.dropIcon}>{file ? '✅' : '📄'}</div>
          <div style={s.dropTitle}>
            {file ? file.name : 'Drop your CSV here'}
          </div>
          <div style={s.dropSub}>
            {file ? `${(file.size / 1024).toFixed(1)} KB · Click to change` : 'or click to browse · CSV files only · Max 5MB'}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>

        {/* Error */}
        {error && <div style={s.error}>⚠️ {error}</div>}

        {/* Upload button */}
        <button style={s.btn} onClick={upload} disabled={!file || uploading}>
          {uploading ? 'Analysing your transactions...' : file ? 'Import transactions →' : 'Select a CSV file first'}
        </button>

        {/* Result */}
        {result && (
          <div style={s.result}>
            <div style={s.resultTitle}>✅ Import complete!</div>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
              Detected: <span style={{ color: '#b4f04a', fontWeight: 500 }}>{result.bank}</span>
            </div>
            <div style={s.statGrid}>
              <div style={s.stat}>
                <div style={s.statNum}>{result.imported}</div>
                <div style={s.statLabel}>Imported</div>
              </div>
              <div style={s.stat}>
                <div style={s.statNum}>{result.skipped}</div>
                <div style={s.statLabel}>Duplicates skipped</div>
              </div>
              <div style={s.stat}>
                <div style={s.statNum}>{result.parsed}</div>
                <div style={s.statLabel}>Total found</div>
              </div>
            </div>
            <a href="/dashboard" style={s.dashBtn}>View in dashboard →</a>
          </div>
        )}

        {/* Supported banks */}
        {!result && (
          <>
            <div style={s.banksTitle}>How to export from your bank</div>
            <div style={s.bankGrid}>
              {SUPPORTED_BANKS.map(bank => (
                <div key={bank.name} style={s.bankCard}>
                  <div style={s.bankName}>{bank.name}</div>
                  <div style={s.bankHint}>{bank.hint}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
