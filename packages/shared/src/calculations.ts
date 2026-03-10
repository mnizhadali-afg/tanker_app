import Decimal from 'decimal.js'

// ─── Types ────────────────────────────────────────────────────────────────────

export type CalculationType = 'cost_based' | 'cost_based_usd' | 'per_ton'
export type TonnageBasis = 'product_weight' | 'bill_weight'

export interface TankerCosts {
  // Weight
  productWeight: number | string
  billWeight: number | string
  tonnageBasis: TonnageBasis

  // Exchange rate
  exchangeRate: number | string

  // Shared costs (charged to both customer and producer)
  costProduct: number | string
  costPublicBenefits: number | string
  costFmn60: number | string
  costFmn20: number | string
  costQualityControl: number | string

  // AFN costs — customer
  costDozbalagh_customer: number | string
  costEscort_customer: number | string
  costBascule_customer: number | string
  costOvernight_customer: number | string
  costBankCommission_customer: number | string
  costRentAfn_customer: number | string
  costMiscAfn_customer: number | string
  costBrokerCommission_customer: number | string
  costExchangerCommission_customer: number | string

  // AFN costs — producer
  costDozbalagh_producer: number | string
  costEscort_producer: number | string
  costBascule_producer: number | string
  costOvernight_producer: number | string
  costBankCommission_producer: number | string
  costRentAfn_producer: number | string
  costMiscAfn_producer: number | string
  costBrokerCommission_producer: number | string
  costExchangerCommission_producer: number | string

  // USD costs — customer
  costLicenseCommission_customer: number | string
  costRentUsd_customer: number | string
  costMiscUsd_customer: number | string

  // USD costs — producer
  costLicenseCommission_producer: number | string
  costRentUsd_producer: number | string
  costMiscUsd_producer: number | string

  // Customer-only
  transportCost: number | string
  commodityPercentDebt: number | string

  // Per-ton rates
  ratePerTonAfn: number | string
  ratePerTonUsd: number | string
}

export interface CustomerDebt {
  afn: Decimal
  usd: Decimal
  commodity: Decimal
}

export interface ProducerReceivable {
  afn: Decimal
  usd: Decimal
}

export interface CalculationResult {
  effectiveTonnage: Decimal
  customerDebtAfn: Decimal
  customerDebtUsd: Decimal
  customerDebtCommodity: Decimal
  producerReceivableAfn: Decimal
  producerReceivableUsd: Decimal
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function d(value: number | string | undefined | null): Decimal {
  if (value === undefined || value === null || value === '') return new Decimal(0)
  return new Decimal(value)
}

// ─── Effective Tonnage ────────────────────────────────────────────────────────

export function calculateEffectiveTonnage(costs: Pick<TankerCosts, 'productWeight' | 'billWeight' | 'tonnageBasis'>): Decimal {
  return costs.tonnageBasis === 'bill_weight'
    ? d(costs.billWeight)
    : d(costs.productWeight)
}

// ─── Shared costs (appear in both customer and producer calculations) ─────────

function sharedCostsTotal(costs: TankerCosts): Decimal {
  return d(costs.costProduct)
    .plus(d(costs.costPublicBenefits))
    .plus(d(costs.costFmn60))
    .plus(d(costs.costFmn20))
    .plus(d(costs.costQualityControl))
}

// ─── Customer AFN-denominated variable costs ──────────────────────────────────

function customerAfnVariableCosts(costs: TankerCosts): Decimal {
  return d(costs.costDozbalagh_customer)
    .plus(d(costs.costEscort_customer))
    .plus(d(costs.costBascule_customer))
    .plus(d(costs.costOvernight_customer))
    .plus(d(costs.costBankCommission_customer))
    .plus(d(costs.costRentAfn_customer))
    .plus(d(costs.costMiscAfn_customer))
    .plus(d(costs.costBrokerCommission_customer))
    .plus(d(costs.costExchangerCommission_customer))
    .plus(d(costs.transportCost))
}

function customerUsdVariableCosts(costs: TankerCosts): Decimal {
  return d(costs.costLicenseCommission_customer)
    .plus(d(costs.costRentUsd_customer))
    .plus(d(costs.costMiscUsd_customer))
}

// ─── Producer variable costs ──────────────────────────────────────────────────

function producerAfnVariableCosts(costs: TankerCosts): Decimal {
  return d(costs.costDozbalagh_producer)
    .plus(d(costs.costEscort_producer))
    .plus(d(costs.costBascule_producer))
    .plus(d(costs.costOvernight_producer))
    .plus(d(costs.costBankCommission_producer))
    .plus(d(costs.costRentAfn_producer))
    .plus(d(costs.costMiscAfn_producer))
    .plus(d(costs.costBrokerCommission_producer))
    .plus(d(costs.costExchangerCommission_producer))
}

function producerUsdVariableCosts(costs: TankerCosts): Decimal {
  return d(costs.costLicenseCommission_producer)
    .plus(d(costs.costRentUsd_producer))
    .plus(d(costs.costMiscUsd_producer))
}

// ─── Customer Debt Calculation ────────────────────────────────────────────────

export function calculateCustomerDebt(costs: TankerCosts, type: CalculationType): CustomerDebt {
  if (type === 'per_ton') {
    const tonnage = calculateEffectiveTonnage(costs)
    return {
      afn: tonnage.mul(d(costs.ratePerTonAfn)),
      usd: tonnage.mul(d(costs.ratePerTonUsd)),
      commodity: d(costs.commodityPercentDebt),
    }
  }

  const afnTotal = sharedCostsTotal(costs).plus(customerAfnVariableCosts(costs))
  const usdVariable = customerUsdVariableCosts(costs)

  if (type === 'cost_based') {
    return {
      afn: afnTotal,
      usd: usdVariable,
      commodity: d(costs.commodityPercentDebt),
    }
  }

  // cost_based_usd: convert AFN total to USD then add USD costs
  const exchangeRate = d(costs.exchangeRate)
  const convertedUsd = exchangeRate.gt(0) ? afnTotal.div(exchangeRate) : new Decimal(0)

  return {
    afn: new Decimal(0),
    usd: convertedUsd.plus(usdVariable),
    commodity: d(costs.commodityPercentDebt),
  }
}

// ─── Producer Receivable Calculation ─────────────────────────────────────────
// Always cost-based regardless of the customer's contract type

export function calculateProducerReceivable(costs: TankerCosts): ProducerReceivable {
  return {
    afn: sharedCostsTotal(costs).plus(producerAfnVariableCosts(costs)),
    usd: producerUsdVariableCosts(costs),
  }
}

// ─── Combined Entry Point ─────────────────────────────────────────────────────

export function calculateTanker(costs: TankerCosts, contractType: CalculationType): CalculationResult {
  const effectiveTonnage = calculateEffectiveTonnage(costs)
  const customerDebt = calculateCustomerDebt(costs, contractType)
  const producerReceivable = calculateProducerReceivable(costs)

  return {
    effectiveTonnage,
    customerDebtAfn: customerDebt.afn,
    customerDebtUsd: customerDebt.usd,
    customerDebtCommodity: customerDebt.commodity,
    producerReceivableAfn: producerReceivable.afn,
    producerReceivableUsd: producerReceivable.usd,
  }
}
