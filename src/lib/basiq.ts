// src/lib/basiq.ts
// Basiq v3 API client — handles auth tokens, users, connections, transactions

import axios, { AxiosInstance } from 'axios'

const BASE_URL = process.env.BASIQ_API_URL || 'https://au-api.basiq.io'
const API_KEY  = process.env.BASIQ_API_KEY!

// ─── Token cache (server-side, in-memory for simplicity) ─────────────────────
// In production: store in Redis with TTL = expires_in - 60s
let cachedToken: { token: string; expiresAt: number } | null = null

async function getServerToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token
  }

  // Exchange API key for a server token (scope: SERVER_ACCESS)
  const response = await axios.post(
    `${BASE_URL}/token`,
    'scope=SERVER_ACCESS',
    {
      headers: {
        'Authorization': `Basic ${Buffer.from(API_KEY).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'basiq-version': '3.0',
      },
    }
  )

  const { access_token, expires_in } = response.data
  cachedToken = {
    token: access_token,
    expiresAt: Date.now() + expires_in * 1000,
  }
  return access_token
}

// ─── Axios instance factory ───────────────────────────────────────────────────
async function basiqClient(): Promise<AxiosInstance> {
  const token = await getServerToken()
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'basiq-version': '3.0',
    },
  })
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface BasiqUser {
  id: string
  email: string
}

export interface BasiqConsentUrl {
  data: { step: string; action: string }[]
  links: { self: string; redirect: string }
}

export interface BasiqAccount {
  id: string
  accountNo: string
  name: string
  balance: number
  currency: string
  class: { type: string; product: string }
  institution: string
}

export interface BasiqTransaction {
  id: string
  account: string          // account ID ref
  amount: string           // e.g. "-42.50"
  description: string
  postDate: string         // ISO date
  transactionDate: string
  direction: 'debit' | 'credit'
  status: 'posted' | 'pending'
  merchant?: {
    businessName?: string
    category?: { anzsicCode: string; subDivision: string }
  }
}

// ─── API methods ──────────────────────────────────────────────────────────────

/**
 * Create a Basiq user for a new Coyva account.
 * One Basiq user per Coyva user — store the returned ID in your DB.
 */
export async function createBasiqUser(email: string, mobile?: string): Promise<BasiqUser> {
  const client = await basiqClient()
  const { data } = await client.post('/users', {
    email,
    ...(mobile ? { mobile } : {}),
  })
  return { id: data.id, email: data.email }
}

/**
 * Generate the CDR consent URL.
 * Redirect the user to this URL — they'll authenticate with their bank
 * and grant consent. Basiq redirects back to your redirect_uri when done.
 */
export async function getConsentUrl(
  basiqUserId: string,
  redirectUri: string
): Promise<string> {
  const client = await basiqClient()
  const { data } = await client.post(`/users/${basiqUserId}/auth_link`, {
    mobile: false,              // true if building native mobile
    redirect_uri: redirectUri,
  })
  // The redirect link is the CDR consent screen hosted by Basiq/bank
  return data.links.redirect
}

/**
 * List all accounts for a Basiq user.
 * Call this after consent is granted.
 */
export async function getUserAccounts(basiqUserId: string): Promise<BasiqAccount[]> {
  const client = await basiqClient()
  const { data } = await client.get(`/users/${basiqUserId}/accounts`)
  return data.data ?? []
}

/**
 * Fetch transactions for a user, optionally filtered by date range.
 * Basiq returns up to 500 per page — this handles pagination automatically.
 *
 * CDR note: banks must provide 12 months of history minimum.
 */
export async function getUserTransactions(
  basiqUserId: string,
  options: {
    fromDate?: string   // 'YYYY-MM-DD'
    toDate?: string
    accountId?: string
  } = {}
): Promise<BasiqTransaction[]> {
  const client = await basiqClient()
  const all: BasiqTransaction[] = []

  // Build filter string (Basiq uses filter query params)
  const filters: string[] = []
  if (options.fromDate) filters.push(`transaction.postDate.gte('${options.fromDate}')`)
  if (options.toDate)   filters.push(`transaction.postDate.lte('${options.toDate}')`)
  if (options.accountId) filters.push(`account.id.eq('${options.accountId}')`)

  let url = `/users/${basiqUserId}/transactions`
  const params: Record<string, string> = { limit: '500' }
  if (filters.length) params.filter = filters.join(',')

  // Paginate through all results
  while (url) {
    const { data } = await client.get(url, { params })
    all.push(...(data.data ?? []))
    // Basiq provides a next link for pagination
    url = data.links?.next ?? null
    params.filter = undefined as any // next link already includes params
  }

  return all
}

/**
 * Trigger a manual data refresh for a user.
 * Returns a job ID you can poll for completion.
 */
export async function refreshUserData(basiqUserId: string): Promise<string> {
  const client = await basiqClient()
  const { data } = await client.post(`/users/${basiqUserId}/refresh`)
  return data.id  // job ID
}

/**
 * Check job status (used to know when a bank sync is complete).
 * Poll until steps[*].status === 'success' or 'failed'
 */
export async function getJobStatus(jobId: string) {
  const client = await basiqClient()
  const { data } = await client.get(`/jobs/${jobId}`)
  return data
}
