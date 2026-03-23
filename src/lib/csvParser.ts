// src/lib/csvParser.ts
// Detects Australian bank CSV formats and parses them into a standard format

import { categorise, Category } from './categorise'

export interface ParsedTransaction {
  date: Date
  description: string
  amount: number
  direction: 'debit' | 'credit'
  balance?: number
  category: Category
  rawRow: string
}

export interface ParseResult {
  bank: string
  transactions: ParsedTransaction[]
  errors: string[]
  totalRows: number
}

// ─── Bank format definitions ──────────────────────────────────────────────────

interface BankFormat {
  name: string
  detect: (headers: string[]) => boolean
  parse: (rows: string[][], headers: string[]) => ParsedTransaction[]
}

function parseAusDate(dateStr: string): Date {
  dateStr = dateStr.trim().replace(/"/g, '')

  // DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split('/')
    return new Date(`${y}-${m}-${d}`)
  }

  // DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split('-')
    return new Date(`${y}-${m}-${d}`)
  }

  // DD Mon YYYY or DD-Mon-YY (NAB)
  if (/^\d{2}[\s-][A-Za-z]{3}[\s-]\d{2,4}$/.test(dateStr)) {
    return new Date(dateStr)
  }

  // YYYY-MM-DD (Up Bank, ISO)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr)
  }

  return new Date(dateStr)
}

function cleanAmount(val: string): number {
  return parseFloat(val.replace(/"/g, '').replace(/,/g, '').replace(/\$/g, '').trim()) || 0
}

function headerMatch(headers: string[], ...terms: string[]): boolean {
  const h = headers.map(h => h.toLowerCase().replace(/"/g, '').trim())
  return terms.every(t => h.some(hh => hh.includes(t.toLowerCase())))
}

function colIndex(headers: string[], ...terms: string[]): number {
  const h = headers.map(h => h.toLowerCase().replace(/"/g, '').trim())
  for (const t of terms) {
    const idx = h.findIndex(hh => hh.includes(t.toLowerCase()))
    if (idx !== -1) return idx
  }
  return -1
}

// ─── Bank formats ─────────────────────────────────────────────────────────────

const BANK_FORMATS: BankFormat[] = [
  // CBA — Date, Amount, Description, Balance
  {
    name: 'Commonwealth Bank',
    detect: (h) => headerMatch(h, 'date') && headerMatch(h, 'amount') && headerMatch(h, 'description') && !headerMatch(h, 'credit') && !headerMatch(h, 'debit'),
    parse: (rows, headers) => {
      const di = colIndex(headers, 'date')
      const ai = colIndex(headers, 'amount')
      const desc = colIndex(headers, 'description', 'narrative')
      const bi = colIndex(headers, 'balance')
      return rows.map(row => {
        const amount = cleanAmount(row[ai] ?? '0')
        const direction = amount < 0 ? 'debit' : 'credit'
        const description = row[desc]?.replace(/"/g, '').trim() ?? ''
        return {
          date: parseAusDate(row[di] ?? ''),
          description,
          amount: Math.abs(amount),
          direction,
          balance: bi >= 0 ? cleanAmount(row[bi] ?? '0') : undefined,
          category: categorise(description),
          rawRow: row.join(','),
        }
      })
    },
  },

  // NAB — Date, Amount, Credits, Debits, Description, Balance
  {
    name: 'NAB',
    detect: (h) => headerMatch(h, 'date') && headerMatch(h, 'credits') && headerMatch(h, 'debits'),
    parse: (rows, headers) => {
      const di = colIndex(headers, 'date')
      const ci = colIndex(headers, 'credits')
      const dbi = colIndex(headers, 'debits')
      const desc = colIndex(headers, 'description', 'narrative', 'particulars')
      const bi = colIndex(headers, 'balance')
      return rows.map(row => {
        const credit = cleanAmount(row[ci] ?? '0')
        const debit = cleanAmount(row[dbi] ?? '0')
        const amount = credit > 0 ? credit : debit
        const direction: 'debit' | 'credit' = credit > 0 ? 'credit' : 'debit'
        const description = row[desc]?.replace(/"/g, '').trim() ?? ''
        return {
          date: parseAusDate(row[di] ?? ''),
          description,
          amount: Math.abs(amount),
          direction,
          balance: bi >= 0 ? cleanAmount(row[bi] ?? '0') : undefined,
          category: categorise(description),
          rawRow: row.join(','),
        }
      })
    },
  },

  // ANZ — Date, Amount, Description, Balance
  {
    name: 'ANZ',
    detect: (h) => headerMatch(h, 'date') && headerMatch(h, 'amount') && (headerMatch(h, 'detail') || headerMatch(h, 'particulars')),
    parse: (rows, headers) => {
      const di = colIndex(headers, 'date')
      const ai = colIndex(headers, 'amount')
      const desc = colIndex(headers, 'detail', 'particulars', 'description')
      const bi = colIndex(headers, 'balance')
      return rows.map(row => {
        const amount = cleanAmount(row[ai] ?? '0')
        const direction = amount < 0 ? 'debit' : 'credit'
        const description = row[desc]?.replace(/"/g, '').trim() ?? ''
        return {
          date: parseAusDate(row[di] ?? ''),
          description,
          amount: Math.abs(amount),
          direction,
          balance: bi >= 0 ? cleanAmount(row[bi] ?? '0') : undefined,
          category: categorise(description),
          rawRow: row.join(','),
        }
      })
    },
  },

  // Westpac — Date, Amount, Description, Balance (same as CBA but different header names)
  {
    name: 'Westpac',
    detect: (h) => {
      const joined = h.join(' ').toLowerCase()
      return joined.includes('bsb') || (joined.includes('date') && joined.includes('transaction') && joined.includes('debit'))
    },
    parse: (rows, headers) => {
      const di = colIndex(headers, 'date')
      const debi = colIndex(headers, 'debit')
      const credi = colIndex(headers, 'credit')
      const desc = colIndex(headers, 'transaction', 'description', 'narrative')
      const bi = colIndex(headers, 'balance')
      return rows.map(row => {
        const debit = cleanAmount(row[debi] ?? '0')
        const credit = cleanAmount(row[credi] ?? '0')
        const amount = credit > 0 ? credit : debit
        const direction: 'debit' | 'credit' = credit > 0 ? 'credit' : 'debit'
        const description = row[desc]?.replace(/"/g, '').trim() ?? ''
        return {
          date: parseAusDate(row[di] ?? ''),
          description,
          amount: Math.abs(amount),
          direction,
          balance: bi >= 0 ? cleanAmount(row[bi] ?? '0') : undefined,
          category: categorise(description),
          rawRow: row.join(','),
        }
      })
    },
  },

  // Up Bank — ISO dates, Amount, Description
  {
    name: 'Up Bank',
    detect: (h) => {
      const joined = h.join(' ').toLowerCase()
      return joined.includes('yyyy') || (joined.includes('date') && joined.includes('amount') && joined.includes('category'))
    },
    parse: (rows, headers) => {
      const di = colIndex(headers, 'date', 'time')
      const ai = colIndex(headers, 'amount')
      const desc = colIndex(headers, 'description', 'merchant')
      return rows.map(row => {
        const amount = cleanAmount(row[ai] ?? '0')
        const direction = amount < 0 ? 'debit' : 'credit'
        const description = row[desc]?.replace(/"/g, '').trim() ?? ''
        return {
          date: parseAusDate(row[di] ?? ''),
          description,
          amount: Math.abs(amount),
          direction,
          category: categorise(description),
          rawRow: row.join(','),
        }
      })
    },
  },

  // Generic fallback — try to find date/amount/description columns
  {
    name: 'Generic (Auto-detected)',
    detect: () => true,
    parse: (rows, headers) => {
      const di = colIndex(headers, 'date')
      const ai = colIndex(headers, 'amount')
      const desc = colIndex(headers, 'description', 'narrative', 'detail', 'particulars', 'memo', 'reference')
      if (di < 0 || ai < 0) return []
      return rows.map(row => {
        const amount = cleanAmount(row[ai] ?? '0')
        const direction = amount < 0 ? 'debit' : 'credit'
        const description = desc >= 0 ? (row[desc]?.replace(/"/g, '').trim() ?? '') : ''
        return {
          date: parseAusDate(row[di] ?? ''),
          description,
          amount: Math.abs(amount),
          direction,
          category: categorise(description),
          rawRow: row.join(','),
        }
      })
    },
  },
]

// ─── CSV Parser ───────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

export function parseCSV(csvContent: string): ParseResult {
  const errors: string[] = []
  const lines = csvContent.split('\n').filter(l => l.trim().length > 0)

  if (lines.length < 2) {
    return { bank: 'Unknown', transactions: [], errors: ['CSV file appears to be empty or has no data rows'], totalRows: 0 }
  }

  // Find header row (skip any preamble lines some banks include)
  let headerLineIdx = 0
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const lower = lines[i].toLowerCase()
    if (lower.includes('date') || lower.includes('amount') || lower.includes('description')) {
      headerLineIdx = i
      break
    }
  }

  const headers = parseCSVLine(lines[headerLineIdx])
  const dataLines = lines.slice(headerLineIdx + 1)

  // Detect bank format
  const format = BANK_FORMATS.find(f => f.detect(headers)) ?? BANK_FORMATS[BANK_FORMATS.length - 1]

  // Parse rows
  const rows = dataLines.map(l => parseCSVLine(l))
  const validRows = rows.filter(r => r.length >= 2 && r.some(c => c.trim().length > 0))

  let transactions: ParsedTransaction[] = []
  try {
    transactions = format.parse(validRows, headers)
      .filter(t => !isNaN(t.date.getTime()) && t.amount >= 0)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
  } catch (err: any) {
    errors.push(`Parsing error: ${err.message}`)
  }

  return {
    bank: format.name,
    transactions,
    errors,
    totalRows: validRows.length,
  }
}
