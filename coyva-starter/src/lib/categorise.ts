// src/lib/categorise.ts
// Simple rule-based categoriser — good enough for an MVP.
// Replace with an ML model or Basiq's enriched merchant data later.

export type Category =
  | 'groceries'
  | 'transport'
  | 'dining'
  | 'utilities'
  | 'health'
  | 'shopping'
  | 'entertainment'
  | 'income'
  | 'transfer'
  | 'other'

interface Rule {
  category: Category
  keywords: RegExp
}

const RULES: Rule[] = [
  {
    category: 'groceries',
    keywords: /woolworths|coles|aldi|iga|harris farm|costco|foodworks|fresh earth|fruit|supermarket/i,
  },
  {
    category: 'transport',
    keywords: /opal|myki|go card|peterpan|uber|didi|ola|taxi|bp |caltex|shell |7-eleven|ampol|petrol|parking|linkt|translink|nsw trains|metro trains/i,
  },
  {
    category: 'dining',
    keywords: /mcdonald|hungry jack|kfc|guzman|domino|pizza|cafe|restaurant|bar |pub |coffee|nandos|grill|sushi|thai|chinese|indian|kebab|bakery|subway|oporto/i,
  },
  {
    category: 'utilities',
    keywords: /agl|origin energy|energyaustralia|synergy|ausgrid|jemena|telstra|optus|vodafone|tpg|aussie broadband|iinet|superloop|water|sewerage|council rates/i,
  },
  {
    category: 'health',
    keywords: /chemist|priceline|pharmacy|medicare|medibank|bupa|hcf|nib |bulk bill|pathology|radiology|dental|doctor|gp |health|hospital|optical|specsavers/i,
  },
  {
    category: 'shopping',
    keywords: /amazon|kmart|target|big w|myer|david jones|jb hi-fi|harvey norman|bunnings|officeworks|rebel sport|cotton on|uniqlo|zara|h&m|asos/i,
  },
  {
    category: 'entertainment',
    keywords: /netflix|spotify|disney|stan |binge|youtube|prime video|hbo|cinema|event cinema|village|hoyts|steam|playstation|xbox|apple music|itunes/i,
  },
  {
    category: 'income',
    keywords: /salary|payroll|employer|ato refund|centrelink|pay run|wages|dividend|interest earned/i,
  },
  {
    category: 'transfer',
    keywords: /transfer|osko|pay anyone|bpay|direct debit|direct credit|payid/i,
  },
]

/**
 * Categorise a transaction by its description and optional merchant name.
 * Basiq's enriched merchant data (merchant.category) is used when available
 * as it's more accurate than keyword matching.
 */
export function categorise(
  description: string,
  merchantName?: string,
  basiqCategory?: string
): Category {
  // 1. Use Basiq's ANZSIC enrichment if available
  if (basiqCategory) {
    const bc = basiqCategory.toLowerCase()
    if (bc.includes('grocery') || bc.includes('food retail'))     return 'groceries'
    if (bc.includes('restaurant') || bc.includes('takeaway'))     return 'dining'
    if (bc.includes('transport') || bc.includes('fuel'))          return 'transport'
    if (bc.includes('electricity') || bc.includes('telecommun'))  return 'utilities'
    if (bc.includes('health') || bc.includes('pharmacy'))         return 'health'
    if (bc.includes('retail') || bc.includes('department'))       return 'shopping'
    if (bc.includes('entertain') || bc.includes('recreation'))    return 'entertainment'
  }

  // 2. Fall back to keyword matching on description + merchant name
  const text = [description, merchantName].filter(Boolean).join(' ')
  for (const rule of RULES) {
    if (rule.keywords.test(text)) return rule.category
  }

  return 'other'
}

export const CATEGORY_META: Record<Category, { label: string; icon: string; color: string; defaultBudget: number }> = {
  groceries:     { label: 'Groceries',     icon: '🛒', color: '#4a7c59', defaultBudget: 600  },
  transport:     { label: 'Transport',     icon: '🚗', color: '#3a8fb5', defaultBudget: 200  },
  dining:        { label: 'Dining',        icon: '🍜', color: '#c4622d', defaultBudget: 250  },
  utilities:     { label: 'Utilities',     icon: '💡', color: '#c9972b', defaultBudget: 180  },
  health:        { label: 'Health',        icon: '💊', color: '#8b5cf6', defaultBudget: 100  },
  shopping:      { label: 'Shopping',      icon: '👜', color: '#e879a0', defaultBudget: 200  },
  entertainment: { label: 'Entertainment', icon: '🎬', color: '#059669', defaultBudget: 150  },
  income:        { label: 'Income',        icon: '💰', color: '#16a34a', defaultBudget: 0    },
  transfer:      { label: 'Transfer',      icon: '↔️', color: '#888',    defaultBudget: 0    },
  other:         { label: 'Other',         icon: '📦', color: '#888',    defaultBudget: 100  },
}
