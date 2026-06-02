import { describe, it, expect } from 'vitest'
import { formatCost, formatDate } from './formatters'

describe('formatCost', () => {
  it('returns — for null', () => {
    expect(formatCost(null)).toBe('—')
  })

  it('returns €X for values below 1000', () => {
    expect(formatCost(0)).toBe('€0')
    expect(formatCost(500)).toBe('€500')
    expect(formatCost(999)).toBe('€999')
  })

  it('returns X.YK€ for values >= 1000', () => {
    expect(formatCost(1000)).toBe('1.0K€')
    expect(formatCost(1200)).toBe('1.2K€')
    expect(formatCost(1500)).toBe('1.5K€')
    expect(formatCost(10000)).toBe('10.0K€')
  })
})

describe('formatDate', () => {
  it('returns — for null', () => {
    expect(formatDate(null)).toBe('—')
  })

  it('returns — for empty string', () => {
    expect(formatDate('')).toBe('—')
  })

  it('formats a date string as short month and day', () => {
    const result = formatDate('2026-04-01')
    expect(result).toContain('Apr')
    expect(result).not.toBe('—')
  })

  it('avoids timezone-offset date shifts', () => {
    const result = formatDate('2026-04-01')
    expect(result).not.toContain('Mar')
  })
})
