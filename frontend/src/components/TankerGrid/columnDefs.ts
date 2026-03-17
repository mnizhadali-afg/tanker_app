export type CellType = 'number' | 'text' | 'date' | 'select' | 'toggle'

export interface ColumnDef {
  key: string
  labelKey: string       // i18n key
  type: CellType
  width?: number         // px
  readOnly?: boolean
  options?: Array<{ value: string; labelKey: string }>
  recalcTrigger?: boolean  // recalculate totals when this changes
  isCalculated?: boolean   // output field, not user-editable
  isProducer?: boolean     // hide from invoice print
  group?: string           // for column grouping UI
}

export const TANKER_COLUMNS: ColumnDef[] = [
  // ── Identity ──────────────────────────────────────────────────────────────
  { key: 'tankerNumber',  labelKey: 'tankers.tankerNumber', type: 'text',   width: 110, group: 'info' },
  { key: 'entryDate',     labelKey: 'tankers.entryDate',    type: 'date',   width: 110, recalcTrigger: false, group: 'info' },
  { key: 'portId',        labelKey: 'tankers.port',         type: 'select', width: 140, group: 'info' },
  { key: 'producerId',    labelKey: 'tankers.producer',     type: 'select', width: 140, group: 'info' },
  { key: 'licenseId',     labelKey: 'tankers.license',      type: 'select', width: 140, group: 'info' },

  // ── Weight & exchange ─────────────────────────────────────────────────────
  { key: 'productWeight', labelKey: 'tankers.productWeight', type: 'number', width: 100, recalcTrigger: true, group: 'weight' },
  { key: 'billWeight',    labelKey: 'tankers.billWeight',    type: 'number', width: 100, recalcTrigger: true, group: 'weight' },
  {
    key: 'tonnageBasis', labelKey: 'tankers.tonnageBasis', type: 'toggle', width: 130, recalcTrigger: true, group: 'weight',
    options: [
      { value: 'product_weight', labelKey: 'tankers.tonnageBasisOptions.product_weight' },
      { value: 'bill_weight',    labelKey: 'tankers.tonnageBasisOptions.bill_weight' },
    ],
  },
  { key: 'exchangeRate', labelKey: 'tankers.exchangeRate', type: 'number', width: 90, recalcTrigger: true, group: 'weight' },

  // ── Shared costs ──────────────────────────────────────────────────────────
  { key: 'costProduct',        labelKey: 'tankers.costs.product',        type: 'number', width: 90,  recalcTrigger: true, group: 'shared' },
  { key: 'costPublicBenefits', labelKey: 'tankers.costs.publicBenefits', type: 'number', width: 100, recalcTrigger: true, group: 'shared' },
  { key: 'costFmn60',          labelKey: 'tankers.costs.fmn60',          type: 'number', width: 80,  recalcTrigger: true, group: 'shared' },
  { key: 'costFmn20',          labelKey: 'tankers.costs.fmn20',          type: 'number', width: 80,  recalcTrigger: true, group: 'shared' },
  { key: 'costQualityControl', labelKey: 'tankers.costs.qualityControl', type: 'number', width: 100, recalcTrigger: true, group: 'shared' },

  // ── AFN costs — customer ──────────────────────────────────────────────────
  { key: 'costDozbalagh_customer',          labelKey: 'tankers.costs.dozbalagh',          type: 'number', width: 90, recalcTrigger: true, group: 'customer-afn' },
  { key: 'costEscort_customer',             labelKey: 'tankers.costs.escort',             type: 'number', width: 80, recalcTrigger: true, group: 'customer-afn' },
  { key: 'costBascule_customer',            labelKey: 'tankers.costs.bascule',            type: 'number', width: 80, recalcTrigger: true, group: 'customer-afn' },
  { key: 'costOvernight_customer',          labelKey: 'tankers.costs.overnight',          type: 'number', width: 80, recalcTrigger: true, group: 'customer-afn' },
  { key: 'costBankCommission_customer',     labelKey: 'tankers.costs.bankCommission',     type: 'number', width: 100, recalcTrigger: true, group: 'customer-afn' },
  { key: 'costRentAfn_customer',            labelKey: 'tankers.costs.rentAfn',            type: 'number', width: 90, recalcTrigger: true, group: 'customer-afn' },
  { key: 'costMiscAfn_customer',            labelKey: 'tankers.costs.miscAfn',            type: 'number', width: 80, recalcTrigger: true, group: 'customer-afn' },
  { key: 'costBrokerCommission_customer',   labelKey: 'tankers.costs.brokerCommission',   type: 'number', width: 110, recalcTrigger: true, group: 'customer-afn' },
  { key: 'costExchangerCommission_customer', labelKey: 'tankers.costs.exchangerCommission', type: 'number', width: 110, recalcTrigger: true, group: 'customer-afn' },
  { key: 'transportCost',                   labelKey: 'tankers.costs.transport',           type: 'number', width: 90, recalcTrigger: true, group: 'customer-afn' },

  // ── AFN costs — producer ──────────────────────────────────────────────────
  { key: 'costDozbalagh_producer',          labelKey: 'tankers.costs.dozbalagh_p',          type: 'number', width: 90, recalcTrigger: true, group: 'producer-afn', isProducer: true },
  { key: 'costEscort_producer',             labelKey: 'tankers.costs.escort_p',             type: 'number', width: 80, recalcTrigger: true, group: 'producer-afn', isProducer: true },
  { key: 'costBascule_producer',            labelKey: 'tankers.costs.bascule_p',            type: 'number', width: 80, recalcTrigger: true, group: 'producer-afn', isProducer: true },
  { key: 'costOvernight_producer',          labelKey: 'tankers.costs.overnight_p',          type: 'number', width: 80, recalcTrigger: true, group: 'producer-afn', isProducer: true },
  { key: 'costBankCommission_producer',     labelKey: 'tankers.costs.bankCommission_p',     type: 'number', width: 100, recalcTrigger: true, group: 'producer-afn', isProducer: true },
  { key: 'costRentAfn_producer',            labelKey: 'tankers.costs.rentAfn_p',            type: 'number', width: 90, recalcTrigger: true, group: 'producer-afn', isProducer: true },
  { key: 'costMiscAfn_producer',            labelKey: 'tankers.costs.miscAfn_p',            type: 'number', width: 80, recalcTrigger: true, group: 'producer-afn', isProducer: true },
  { key: 'costBrokerCommission_producer',   labelKey: 'tankers.costs.brokerCommission_p',   type: 'number', width: 110, recalcTrigger: true, group: 'producer-afn', isProducer: true },
  { key: 'costExchangerCommission_producer', labelKey: 'tankers.costs.exchangerCommission_p', type: 'number', width: 110, recalcTrigger: true, group: 'producer-afn', isProducer: true },

  // ── USD costs — customer ──────────────────────────────────────────────────
  { key: 'costLicenseCommission_customer', labelKey: 'tankers.costs.licenseCommission', type: 'number', width: 110, recalcTrigger: true, group: 'customer-usd' },
  { key: 'costRentUsd_customer',           labelKey: 'tankers.costs.rentUsd',           type: 'number', width: 90,  recalcTrigger: true, group: 'customer-usd' },
  { key: 'costMiscUsd_customer',           labelKey: 'tankers.costs.miscUsd',           type: 'number', width: 80,  recalcTrigger: true, group: 'customer-usd' },

  // ── USD costs — producer ──────────────────────────────────────────────────
  { key: 'costLicenseCommission_producer', labelKey: 'tankers.costs.licenseCommission_p', type: 'number', width: 110, recalcTrigger: true, group: 'producer-usd', isProducer: true },
  { key: 'costRentUsd_producer',           labelKey: 'tankers.costs.rentUsd_p',           type: 'number', width: 90,  recalcTrigger: true, group: 'producer-usd', isProducer: true },
  { key: 'costMiscUsd_producer',           labelKey: 'tankers.costs.miscUsd_p',           type: 'number', width: 80,  recalcTrigger: true, group: 'producer-usd', isProducer: true },

  // ── Customer-only ─────────────────────────────────────────────────────────
  { key: 'commodityPercentDebt', labelKey: 'tankers.costs.commodityPercentDebt', type: 'number', width: 100, recalcTrigger: true, group: 'customer-afn' },

  // ── Per-ton (hidden unless per_ton contract) ──────────────────────────────
  { key: 'ratePerTonAfn', labelKey: 'tankers.ratePerTonAfn', type: 'number', width: 100, recalcTrigger: true, group: 'per-ton' },
  { key: 'ratePerTonUsd', labelKey: 'tankers.ratePerTonUsd', type: 'number', width: 100, recalcTrigger: true, group: 'per-ton' },

  // ── Calculated outputs (read-only) ────────────────────────────────────────
  { key: 'customerDebtAfn',       labelKey: 'tankers.customerDebtAfn',       type: 'number', width: 120, readOnly: true, isCalculated: true, group: 'result' },
  { key: 'customerDebtUsd',       labelKey: 'tankers.customerDebtUsd',       type: 'number', width: 120, readOnly: true, isCalculated: true, group: 'result' },
  { key: 'customerDebtCommodity', labelKey: 'tankers.customerDebtCommodity', type: 'number', width: 120, readOnly: true, isCalculated: true, group: 'result' },
  { key: 'producerReceivableAfn', labelKey: 'tankers.producer_col',          type: 'number', width: 120, readOnly: true, isCalculated: true, isProducer: true, group: 'result' },
  { key: 'producerReceivableUsd', labelKey: 'tankers.producer_col',          type: 'number', width: 120, readOnly: true, isCalculated: true, isProducer: true, group: 'result' },
]

// Columns visible by contract type
export function getVisibleColumns(
  contractType: 'cost_based' | 'cost_based_usd' | 'per_ton',
  showProducer = true,
): ColumnDef[] {
  return TANKER_COLUMNS.filter((col) => {
    if (!showProducer && col.isProducer) return false
    if (contractType === 'per_ton') {
      // Hide cost columns for per_ton contracts
      if (col.group && col.group !== 'per-ton' && !col.isCalculated) return false
    } else {
      // Hide per-ton rate columns for cost-based contracts
      if (col.group === 'per-ton') return false
    }
    return true
  })
}

// Zero-suppression for invoice print: returns set of column keys where ALL rows have value = 0
export function getZeroColumns(rows: Record<string, unknown>[], columns: ColumnDef[]): Set<string> {
  const zeroCols = new Set<string>()
  for (const col of columns) {
    if (col.type !== 'number') continue
    const allZero = rows.every((row) => {
      const val = row[col.key]
      return val === 0 || val === '0' || val === null || val === undefined || val === ''
    })
    if (allZero) zeroCols.add(col.key)
  }
  return zeroCols
}
