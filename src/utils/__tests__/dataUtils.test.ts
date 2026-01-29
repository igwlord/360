import { describe, it, expect } from 'vitest'
import { 
  parseCurrency, 
  formatCurrency, 
  isCampaignInPeriod,
  generateUniqueId 
} from '../dataUtils'

describe('dataUtils', () => {
  describe('parseCurrency', () => {
    it('should parse number values', () => {
      expect(parseCurrency(1000)).toBe(1000)
      expect(parseCurrency(0)).toBe(0)
    })

    it('should parse currency strings', () => {
      expect(parseCurrency('$4.500.000')).toBe(4500000)
      expect(parseCurrency('$1,000')).toBe(1000)
    })

    it('should handle null and undefined', () => {
      expect(parseCurrency(null)).toBe(0)
      expect(parseCurrency(undefined)).toBe(0)
    })
  })

  describe('formatCurrency', () => {
    it('should format numbers as currency', () => {
      const formatted = formatCurrency(4500000)
      expect(formatted).toContain('4.500.000')
      expect(formatted).toContain('$')
    })

    it('should handle zero', () => {
      const formatted = formatCurrency(0)
      expect(formatted).toContain('0')
    })
  })

  describe('isCampaignInPeriod', () => {
    it('should match campaigns by year and month', () => {
      expect(isCampaignInPeriod('08 Ene - 11 Ene', 2026, 'Ene')).toBe(true)
      expect(isCampaignInPeriod('Feb 2026', 2026, 'Feb')).toBe(true)
    })

    it('should return false for non-matching periods', () => {
      expect(isCampaignInPeriod('08 Ene - 11 Ene', 2025, 'Ene')).toBe(false)
      expect(isCampaignInPeriod('Feb 2026', 2026, 'Mar')).toBe(false)
    })

    it('should handle "All" filters', () => {
      expect(isCampaignInPeriod('08 Ene - 11 Ene', 'All', 'All')).toBe(true)
      expect(isCampaignInPeriod('Feb 2026', 2026, 'All')).toBe(true)
    })
  })

  describe('generateUniqueId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateUniqueId('test')
      const id2 = generateUniqueId('test')
      
      expect(id1).toContain('test-')
      expect(id2).toContain('test-')
      expect(id1).not.toBe(id2)
    })

    it('should use default prefix when not provided', () => {
      const id = generateUniqueId()
      expect(id).toContain('id-')
    })
  })
})
