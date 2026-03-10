import { describe, it, expect } from 'vitest'
import Decimal from 'decimal.js'
import {
  calculateEffectiveTonnage,
  calculateCustomerDebt,
  calculateProducerReceivable,
  calculateTanker,
  type TankerCosts,
} from './calculations'

// ─── Test fixtures ────────────────────────────────────────────────────────────

const BASE: TankerCosts = {
  productWeight: 10,
  billWeight: 9.5,
  tonnageBasis: 'product_weight',
  exchangeRate: 90,

  costProduct: 100,
  costPublicBenefits: 50,
  costFmn60: 30,
  costFmn20: 20,
  costQualityControl: 10,

  costDozbalagh_customer: 200,
  costEscort_customer: 150,
  costBascule_customer: 80,
  costOvernight_customer: 0,
  costBankCommission_customer: 50,
  costRentAfn_customer: 500,
  costMiscAfn_customer: 100,
  costBrokerCommission_customer: 75,
  costExchangerCommission_customer: 25,

  costDozbalagh_producer: 200,
  costEscort_producer: 150,
  costBascule_producer: 80,
  costOvernight_producer: 0,
  costBankCommission_producer: 50,
  costRentAfn_producer: 500,
  costMiscAfn_producer: 100,
  costBrokerCommission_producer: 75,
  costExchangerCommission_producer: 25,

  costLicenseCommission_customer: 5,
  costRentUsd_customer: 10,
  costMiscUsd_customer: 2,

  costLicenseCommission_producer: 5,
  costRentUsd_producer: 10,
  costMiscUsd_producer: 2,

  transportCost: 300,
  commodityPercentDebt: 3,

  ratePerTonAfn: 1000,
  ratePerTonUsd: 12,
}

// ─── calculateEffectiveTonnage ────────────────────────────────────────────────

describe('calculateEffectiveTonnage', () => {
  it('returns productWeight when tonnageBasis is product_weight', () => {
    const result = calculateEffectiveTonnage({ ...BASE, tonnageBasis: 'product_weight' })
    expect(result.toNumber()).toBe(10)
  })

  it('returns billWeight when tonnageBasis is bill_weight', () => {
    const result = calculateEffectiveTonnage({ ...BASE, tonnageBasis: 'bill_weight' })
    expect(result.toNumber()).toBe(9.5)
  })
})

// ─── calculateCustomerDebt — cost_based ──────────────────────────────────────

describe('calculateCustomerDebt — cost_based', () => {
  it('sums shared + customer AFN costs correctly', () => {
    const result = calculateCustomerDebt(BASE, 'cost_based')
    // Shared: 100+50+30+20+10 = 210
    // Customer AFN variable: 200+150+80+0+50+500+100+75+25+300 = 1480
    // Total AFN: 1690
    expect(result.afn.toNumber()).toBe(1690)
  })

  it('sums customer USD costs correctly', () => {
    const result = calculateCustomerDebt(BASE, 'cost_based')
    // 5+10+2 = 17
    expect(result.usd.toNumber()).toBe(17)
  })

  it('captures commodity debt', () => {
    const result = calculateCustomerDebt(BASE, 'cost_based')
    expect(result.commodity.toNumber()).toBe(3)
  })

  it('returns zero AFN fields for missing costs', () => {
    const zeroCosts: TankerCosts = { ...BASE,
      costProduct: 0, costPublicBenefits: 0, costFmn60: 0, costFmn20: 0, costQualityControl: 0,
      costDozbalagh_customer: 0, costEscort_customer: 0, costBascule_customer: 0, costOvernight_customer: 0,
      costBankCommission_customer: 0, costRentAfn_customer: 0, costMiscAfn_customer: 0,
      costBrokerCommission_customer: 0, costExchangerCommission_customer: 0, transportCost: 0,
    }
    const result = calculateCustomerDebt(zeroCosts, 'cost_based')
    expect(result.afn.toNumber()).toBe(0)
  })
})

// ─── calculateCustomerDebt — cost_based_usd ──────────────────────────────────

describe('calculateCustomerDebt — cost_based_usd', () => {
  it('converts AFN total to USD using exchange rate', () => {
    const result = calculateCustomerDebt(BASE, 'cost_based_usd')
    // AFN total (same as cost_based): 1690
    // Divided by exchangeRate 90 = 18.7777...
    // Plus USD variable: 17
    // Total USD: 35.7777...
    const expectedUsd = new Decimal(1690).div(90).plus(17)
    expect(result.usd.toFixed(4)).toBe(expectedUsd.toFixed(4))
  })

  it('sets AFN to zero', () => {
    const result = calculateCustomerDebt(BASE, 'cost_based_usd')
    expect(result.afn.toNumber()).toBe(0)
  })

  it('handles zero exchange rate without dividing by zero', () => {
    const result = calculateCustomerDebt({ ...BASE, exchangeRate: 0 }, 'cost_based_usd')
    // AFN conversion should produce 0, not infinity/error
    expect(result.usd.isFinite()).toBe(true)
    // Only USD variable costs remain: 17
    expect(result.usd.toNumber()).toBe(17)
  })

  it('uses bill_weight as tonnage basis when applicable', () => {
    const costs = { ...BASE, tonnageBasis: 'bill_weight' as const }
    // For cost_based_usd, tonnage doesn't affect cost-based totals
    const result = calculateCustomerDebt(costs, 'cost_based_usd')
    expect(result.afn.toNumber()).toBe(0)
  })
})

// ─── calculateCustomerDebt — per_ton ─────────────────────────────────────────

describe('calculateCustomerDebt — per_ton', () => {
  it('calculates AFN as tonnage × ratePerTonAfn (product_weight basis)', () => {
    const result = calculateCustomerDebt(BASE, 'per_ton')
    // 10 × 1000 = 10000
    expect(result.afn.toNumber()).toBe(10000)
  })

  it('calculates USD as tonnage × ratePerTonUsd', () => {
    const result = calculateCustomerDebt(BASE, 'per_ton')
    // 10 × 12 = 120
    expect(result.usd.toNumber()).toBe(120)
  })

  it('uses bill_weight when tonnageBasis is bill_weight', () => {
    const result = calculateCustomerDebt({ ...BASE, tonnageBasis: 'bill_weight' }, 'per_ton')
    // 9.5 × 1000 = 9500
    expect(result.afn.toNumber()).toBe(9500)
    // 9.5 × 12 = 114
    expect(result.usd.toNumber()).toBe(114)
  })

  it('returns zero when rates are zero', () => {
    const result = calculateCustomerDebt({ ...BASE, ratePerTonAfn: 0, ratePerTonUsd: 0 }, 'per_ton')
    expect(result.afn.toNumber()).toBe(0)
    expect(result.usd.toNumber()).toBe(0)
  })
})

// ─── calculateProducerReceivable ──────────────────────────────────────────────

describe('calculateProducerReceivable', () => {
  it('is always cost-based regardless of contract type — sums shared + producer costs', () => {
    const result = calculateProducerReceivable(BASE)
    // Shared: 210
    // Producer AFN variable: 200+150+80+0+50+500+100+75+25 = 1180
    // Total AFN: 1390
    expect(result.afn.toNumber()).toBe(1390)
  })

  it('sums producer USD costs', () => {
    const result = calculateProducerReceivable(BASE)
    // 5+10+2 = 17
    expect(result.usd.toNumber()).toBe(17)
  })

  it('does NOT include transportCost in producer receivable', () => {
    const withTransport = { ...BASE, transportCost: 99999 }
    const withoutTransport = { ...BASE, transportCost: 0 }
    const r1 = calculateProducerReceivable(withTransport)
    const r2 = calculateProducerReceivable(withoutTransport)
    expect(r1.afn.toNumber()).toBe(r2.afn.toNumber())
  })

  it('does NOT include commodityPercentDebt in producer receivable', () => {
    const result = calculateProducerReceivable({ ...BASE, commodityPercentDebt: 999 })
    // Should be the same as without — commodity is customer-only
    expect(result.afn.toNumber()).toBe(1390)
  })
})

// ─── calculateTanker (combined) ───────────────────────────────────────────────

describe('calculateTanker', () => {
  it('returns all fields in a single result object', () => {
    const result = calculateTanker(BASE, 'cost_based')
    expect(result).toHaveProperty('effectiveTonnage')
    expect(result).toHaveProperty('customerDebtAfn')
    expect(result).toHaveProperty('customerDebtUsd')
    expect(result).toHaveProperty('customerDebtCommodity')
    expect(result).toHaveProperty('producerReceivableAfn')
    expect(result).toHaveProperty('producerReceivableUsd')
  })

  it('effectiveTonnage respects tonnageBasis', () => {
    const r1 = calculateTanker(BASE, 'cost_based')
    const r2 = calculateTanker({ ...BASE, tonnageBasis: 'bill_weight' }, 'cost_based')
    expect(r1.effectiveTonnage.toNumber()).toBe(10)
    expect(r2.effectiveTonnage.toNumber()).toBe(9.5)
  })

  it('per_ton contract — producer receivable is still cost-based', () => {
    const result = calculateTanker(BASE, 'per_ton')
    // Producer receivable should be 1390 (cost-based), not tonnage-based
    expect(result.producerReceivableAfn.toNumber()).toBe(1390)
  })

  it('cost_based_usd contract — producer receivable is still cost-based in AFN', () => {
    const result = calculateTanker(BASE, 'cost_based_usd')
    // Customer gets zero AFN, but producer still gets cost-based AFN
    expect(result.customerDebtAfn.toNumber()).toBe(0)
    expect(result.producerReceivableAfn.toNumber()).toBe(1390)
  })

  it('handles string number inputs (from Prisma Decimal)', () => {
    const stringCosts: TankerCosts = {
      ...BASE,
      productWeight: '10',
      billWeight: '9.5',
      exchangeRate: '90',
      costProduct: '100',
      ratePerTonAfn: '1000',
      ratePerTonUsd: '12',
    }
    const result = calculateTanker(stringCosts, 'per_ton')
    expect(result.customerDebtAfn.toNumber()).toBe(10000)
  })
})
