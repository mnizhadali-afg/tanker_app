import { useState, useCallback } from 'react'
import { calculateTanker, type TankerCosts, type CalculationType } from '@tanker/shared'

export interface TankerRow extends Record<string, unknown> {
  id?: string
  _localId: string        // temporary client-side id before server assign
  _dirty?: boolean        // has unsaved changes
  _saving?: boolean       // currently saving to backend
  _error?: string | null  // save error message
  _version?: number       // incremented on each edit, used to detect concurrent edits
}

let localIdCounter = 0
function nextLocalId() {
  return `local-${++localIdCounter}`
}

export function buildEmptyRow(defaults: Partial<TankerRow> = {}): TankerRow {
  return {
    _localId: nextLocalId(),
    _dirty: false,   // not dirty until user actually edits — prevents spurious auto-saves
    _version: 0,
    tankerNumber: '',
    entryDate: new Date().toISOString().split('T')[0],
    portId: '',
    licenseId: '',
    productWeight: 0,
    billWeight: 0,
    tonnageBasis: 'product_weight',
    exchangeRate: 0,
    costProduct: 0,
    costPublicBenefits: 0,
    costFmn60: 0,
    costFmn20: 0,
    costQualityControl: 0,
    costDozbalagh_customer: 0,
    costDozbalagh_producer: 0,
    costEscort_customer: 0,
    costEscort_producer: 0,
    costBascule_customer: 0,
    costBascule_producer: 0,
    costOvernight_customer: 0,
    costOvernight_producer: 0,
    costBankCommission_customer: 0,
    costBankCommission_producer: 0,
    costRentAfn_customer: 0,
    costRentAfn_producer: 0,
    costMiscAfn_customer: 0,
    costMiscAfn_producer: 0,
    costBrokerCommission_customer: 0,
    costBrokerCommission_producer: 0,
    costExchangerCommission_customer: 0,
    costExchangerCommission_producer: 0,
    costLicenseCommission_customer: 0,
    costLicenseCommission_producer: 0,
    costRentUsd_customer: 0,
    costRentUsd_producer: 0,
    costMiscUsd_customer: 0,
    costMiscUsd_producer: 0,
    transportCost: 0,
    commodityPercentDebt: 0,
    ratePerTonAfn: 0,
    ratePerTonUsd: 0,
    customerDebtAfn: 0,
    customerDebtUsd: 0,
    customerDebtCommodity: 0,
    producerReceivableAfn: 0,
    producerReceivableUsd: 0,
    ...defaults,
  }
}

function recalculateRow(row: TankerRow, contractType: CalculationType): TankerRow {
  const costs = row as unknown as TankerCosts
  const result = calculateTanker(costs, contractType)
  return {
    ...row,
    customerDebtAfn: result.customerDebtAfn.toNumber(),
    customerDebtUsd: result.customerDebtUsd.toNumber(),
    customerDebtCommodity: result.customerDebtCommodity.toNumber(),
    producerReceivableAfn: result.producerReceivableAfn.toNumber(),
    producerReceivableUsd: result.producerReceivableUsd.toNumber(),
  }
}

function normalizeDate(val: unknown): string {
  if (!val) return new Date().toISOString().split('T')[0]
  const s = String(val)
  // Backend returns ISO timestamp like '2026-03-12T00:00:00.000Z' — extract date part
  return s.includes('T') ? s.split('T')[0] : s
}

function normalizeInitialRows(rows: TankerRow[]): TankerRow[] {
  return rows.map((r) => {
    const base = r._localId ? r : { ...r, _localId: nextLocalId(), _dirty: false, _version: 0 }
    return { ...base, entryDate: normalizeDate(base.entryDate) }
  })
}

export function useTankerGrid(
  initialRows: TankerRow[],
  contractType: CalculationType,
  contractDefaults: Partial<TankerRow>,
) {
  const [rows, setRows] = useState<TankerRow[]>(() => normalizeInitialRows(initialRows))

  const addRow = useCallback(() => {
    const newRow = buildEmptyRow(contractDefaults)
    const calculated = recalculateRow(newRow, contractType)
    setRows((prev) => [...prev, calculated])
    return calculated._localId
  }, [contractType, contractDefaults])

  const updateCell = useCallback(
    (localId: string, key: string, value: unknown) => {
      setRows((prev) =>
        prev.map((row) => {
          if (row._localId !== localId) return row
          const updated = {
            ...row,
            [key]: value,
            _dirty: true,
            _error: null,  // clear any previous save error so auto-save can retry
            _version: ((row._version as number) ?? 0) + 1,
          }
          // Recalculate if this is a trigger field
          return recalculateRow(updated, contractType)
        }),
      )
    },
    [contractType],
  )

  const removeRow = useCallback((localId: string) => {
    setRows((prev) => prev.filter((r) => r._localId !== localId))
  }, [])

  const markSaving = useCallback((localId: string, saving: boolean) => {
    setRows((prev) =>
      prev.map((r) => (r._localId === localId ? { ...r, _saving: saving } : r)),
    )
  }, [])

  /**
   * Mark a row as saved. Only clears _dirty if no new edits came in after the save started
   * (detected by comparing the version that was sent vs the current version).
   */
  const markSaved = useCallback((localId: string, serverId: string, savedVersion: number) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r._localId !== localId) return r
        const currentVersion = (r._version as number) ?? 0
        // If _version changed since we started saving, the user made new edits — keep _dirty
        const stillDirty = currentVersion !== savedVersion
        return { ...r, id: serverId, _saving: false, _error: null, _dirty: stillDirty }
      }),
    )
  }, [])

  const markError = useCallback((localId: string, error: string) => {
    setRows((prev) =>
      prev.map((r) => (r._localId === localId ? { ...r, _saving: false, _error: error } : r)),
    )
  }, [])

  /**
   * Parse a TSV clipboard payload and insert rows starting from the
   * focused column index.
   */
  const pasteRows = useCallback(
    (tsv: string, focusedColumnIndex: number, columnKeys: string[]) => {
      const lines = tsv.trim().split('\n')
      const newRows: TankerRow[] = lines.map((line) => {
        const values = line.split('\t')
        const row = buildEmptyRow(contractDefaults)
        values.forEach((val, i) => {
          const colKey = columnKeys[focusedColumnIndex + i]
          if (colKey) row[colKey] = isNaN(Number(val)) ? val.trim() : Number(val)
        })
        // Pasted rows are dirty immediately since they have real data
        row._dirty = true
        row._version = 1
        return recalculateRow(row, contractType)
      })
      setRows((prev) => [...prev, ...newRows])
      return newRows.map((r) => r._localId)
    },
    [contractType, contractDefaults],
  )

  /**
   * Update multiple cells on a row in a single state update (avoids multiple re-renders/debounces).
   */
  const updateCells = useCallback(
    (localId: string, updates: Record<string, unknown>) => {
      setRows((prev) =>
        prev.map((row) => {
          if (row._localId !== localId) return row
          const updated = {
            ...row,
            ...updates,
            _dirty: true,
            _error: null,
            _version: ((row._version as number) ?? 0) + 1,
          }
          return recalculateRow(updated, contractType)
        }),
      )
    },
    [contractType],
  )

  const duplicateRow = useCallback((localId: string) => {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r._localId === localId)
      if (idx === -1) return prev
      const source = prev[idx]
      const copy: TankerRow = {
        ...source,
        id: undefined,          // new row — no server ID yet
        _localId: nextLocalId(),
        _dirty: true,
        _saving: false,
        _error: null,
        _version: 0,
      }
      const next = [...prev]
      next.splice(idx + 1, 0, copy)
      return next
    })
  }, [])

  return { rows, addRow, updateCell, updateCells, removeRow, duplicateRow, markSaving, markSaved, markError, pasteRows }
}
