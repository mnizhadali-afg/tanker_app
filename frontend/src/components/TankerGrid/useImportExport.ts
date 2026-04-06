/**
 * Import / Export utilities for the TankerGrid.
 *
 * Export: current rows → CSV or XLSX  (uses column keys as headers for round-trip import)
 * Import: CSV or XLSX → partial TankerRow array  (resolves portName→portId, licenseNumber→licenseId)
 */
import * as XLSX from 'xlsx'
import type { TankerRow } from './useTankerGrid'

// Ordered list of columns written to the export file.
// portName / licenseNumber are human-readable aliases — on import they resolve to IDs.
export const EXPORT_COLUMNS: Array<{ key: string; label: string }> = [
  { key: 'tankerNumber',   label: 'Tanker Number' },
  { key: 'entryDate',      label: 'Entry Date' },
  { key: 'portName',       label: 'Port Name' },
  { key: 'licenseNumber',  label: 'License Number' },
  { key: 'productWeight',  label: 'Product Weight' },
  { key: 'billWeight',     label: 'Bill Weight' },
  { key: 'tonnageBasis',   label: 'Tonnage Basis' },
  { key: 'exchangeRate',   label: 'Exchange Rate' },
  { key: 'costProduct',                    label: 'Cost Product' },
  { key: 'costPublicBenefits',             label: 'Cost Public Benefits' },
  { key: 'costFmn60',                      label: 'Cost FMN-60' },
  { key: 'costFmn20',                      label: 'Cost FMN-20' },
  { key: 'costQualityControl',             label: 'Cost Quality Control' },
  { key: 'costDozbalagh_customer',         label: 'Cost Dozbalagh (Customer)' },
  { key: 'costDozbalagh_producer',         label: 'Cost Dozbalagh (Producer)' },
  { key: 'costEscort_customer',            label: 'Cost Escort (Customer)' },
  { key: 'costEscort_producer',            label: 'Cost Escort (Producer)' },
  { key: 'costBascule_customer',           label: 'Cost Bascule (Customer)' },
  { key: 'costBascule_producer',           label: 'Cost Bascule (Producer)' },
  { key: 'costOvernight_customer',         label: 'Cost Overnight (Customer)' },
  { key: 'costOvernight_producer',         label: 'Cost Overnight (Producer)' },
  { key: 'costBankCommission_customer',    label: 'Cost Bank Commission (Customer)' },
  { key: 'costBankCommission_producer',    label: 'Cost Bank Commission (Producer)' },
  { key: 'costRentAfn_customer',           label: 'Cost Rent AFN (Customer)' },
  { key: 'costRentAfn_producer',           label: 'Cost Rent AFN (Producer)' },
  { key: 'costMiscAfn_customer',           label: 'Cost Misc AFN (Customer)' },
  { key: 'costMiscAfn_producer',           label: 'Cost Misc AFN (Producer)' },
  { key: 'costBrokerCommission_customer',  label: 'Cost Broker Commission (Customer)' },
  { key: 'costBrokerCommission_producer',  label: 'Cost Broker Commission (Producer)' },
  { key: 'costExchangerCommission_customer', label: 'Cost Exchanger Commission (Customer)' },
  { key: 'costExchangerCommission_producer', label: 'Cost Exchanger Commission (Producer)' },
  { key: 'costLicenseCommission_customer', label: 'Cost License Commission (Customer)' },
  { key: 'costLicenseCommission_producer', label: 'Cost License Commission (Producer)' },
  { key: 'costRentUsd_customer',           label: 'Cost Rent USD (Customer)' },
  { key: 'costRentUsd_producer',           label: 'Cost Rent USD (Producer)' },
  { key: 'costMiscUsd_customer',           label: 'Cost Misc USD (Customer)' },
  { key: 'costMiscUsd_producer',           label: 'Cost Misc USD (Producer)' },
  { key: 'transportCost',          label: 'Transport Cost' },
  { key: 'commodityPercentDebt',   label: 'Commodity Percent Debt' },
  { key: 'ratePerTonAfn',          label: 'Rate Per Ton (AFN)' },
  { key: 'ratePerTonUsd',          label: 'Rate Per Ton (USD)' },
  { key: 'customerDebtAfn',        label: 'Customer Debt AFN (calc)' },
  { key: 'customerDebtUsd',        label: 'Customer Debt USD (calc)' },
]

interface Port     { id: string; name: string; producerId: string }
interface License  { id: string; licenseNumber: string }

// ─── Export ─────────────────────────────────────────────────────────────────

function rowToExportValues(row: TankerRow, ports: Port[], licenses: License[]): (string | number)[] {
  return EXPORT_COLUMNS.map(({ key }) => {
    if (key === 'portName') {
      const portId = row.portId as string | undefined
      return ports.find((p) => p.id === portId)?.name ?? ''
    }
    if (key === 'licenseNumber') {
      const licId = row.licenseId as string | undefined
      return licenses.find((l) => l.id === licId)?.licenseNumber ?? ''
    }
    const v = (row as Record<string, unknown>)[key]
    if (v === null || v === undefined) return ''
    return v as string | number
  })
}

export function exportToXlsx(
  rows: TankerRow[],
  ports: Port[],
  licenses: License[],
  invoiceNumber: string,
) {
  const headers = EXPORT_COLUMNS.map((c) => c.label)
  const dataRows = rows.map((r) => rowToExportValues(r, ports, licenses))
  const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows])

  // Column widths
  ws['!cols'] = EXPORT_COLUMNS.map((c) => ({ wch: Math.max(c.label.length + 2, 14) }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Tankers')
  XLSX.writeFile(wb, `tankers-${invoiceNumber}.xlsx`)
}

export function exportToCsv(
  rows: TankerRow[],
  ports: Port[],
  licenses: License[],
  invoiceNumber: string,
) {
  const escape = (v: string | number) => {
    const s = String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }
  const headers = EXPORT_COLUMNS.map((c) => escape(c.label)).join(',')
  const dataRows = rows
    .map((r) => rowToExportValues(r, ports, licenses).map(escape).join(','))
    .join('\n')
  const csv = headers + '\n' + dataRows

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tankers-${invoiceNumber}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Import ─────────────────────────────────────────────────────────────────

export interface ImportResult {
  rows: Array<Partial<TankerRow>>
  warnings: string[]
  skipped: number
}

/**
 * Parse a CSV or XLSX file and return partial TankerRow objects.
 * Port name is resolved to portId+producerId; license number to licenseId.
 */
export async function parseImportFile(
  file: File,
  ports: Port[],
  licenses: License[],
): Promise<ImportResult> {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '', raw: false })

  if (raw.length === 0) return { rows: [], warnings: ['File is empty or has no data rows.'], skipped: 0 }

  // Build a header→key map from label matching
  const labelToKey = new Map<string, string>()
  for (const col of EXPORT_COLUMNS) {
    labelToKey.set(col.label.toLowerCase(), col.key)
    labelToKey.set(col.key.toLowerCase(), col.key) // also accept raw key names
  }

  // Resolve first row's keys
  const sampleKeys = Object.keys(raw[0] ?? {})
  const columnMap: Map<string, string> = new Map() // header → our key
  for (const header of sampleKeys) {
    const mapped = labelToKey.get(header.toLowerCase().trim())
    if (mapped) columnMap.set(header, mapped)
  }

  const warnings: string[] = []
  let skipped = 0
  const rows: Array<Partial<TankerRow>> = []

  for (let i = 0; i < raw.length; i++) {
    const sourceRow = raw[i]
    const partial: Partial<TankerRow> = {}

    for (const [header, key] of columnMap.entries()) {
      const rawVal = sourceRow[header]
      if (rawVal === '' || rawVal === null || rawVal === undefined) continue

      if (key === 'portName') {
        const name = String(rawVal).trim()
        const port = ports.find((p) => p.name.toLowerCase() === name.toLowerCase())
        if (port) {
          partial.portId = port.id
          partial.producerId = port.producerId
          // store resolved port object for print templates
          ;(partial as Record<string, unknown>).port = { id: port.id, name: port.name }
          ;(partial as Record<string, unknown>).producer = { id: port.producerId }
        } else if (name) {
          warnings.push(`Row ${i + 2}: Port "${name}" not found — skipped port assignment`)
        }
      } else if (key === 'licenseNumber') {
        const num = String(rawVal).trim()
        const lic = licenses.find((l) => l.licenseNumber.toLowerCase() === num.toLowerCase())
        if (lic) {
          partial.licenseId = lic.id
        } else if (num) {
          warnings.push(`Row ${i + 2}: License "${num}" not found — skipped`)
        }
      } else if (key === 'entryDate') {
        // SheetJS may return a Date object or string
        const dateStr = rawVal instanceof Date
          ? rawVal.toISOString().split('T')[0]
          : String(rawVal).includes('T')
            ? String(rawVal).split('T')[0]
            : String(rawVal)
        partial.entryDate = dateStr
      } else if (key === 'tankerNumber' || key === 'tonnageBasis') {
        partial[key] = String(rawVal).trim()
      } else {
        // numeric field
        const num = Number(rawVal)
        if (!isNaN(num)) {
          partial[key as keyof TankerRow] = num as never
        }
      }
    }

    // Skip completely empty rows
    const hasData = Object.keys(partial).some((k) => partial[k as keyof TankerRow] !== undefined)
    if (!hasData) {
      skipped++
      continue
    }

    rows.push(partial)
  }

  return { rows, warnings, skipped }
}
