import { useEffect, useRef, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import TankerRowComponent from './TankerRow'
import { useTankerGrid, type TankerRow } from './useTankerGrid'
import { useKeyboardNav, usePasteHandler } from './useKeyboardNav'
import { getVisibleColumns } from './columnDefs'
import type { SelectOption } from './TankerCell'
import api from '../../lib/axios'
import type { CalculationType } from '@tanker/shared'

// Explicit whitelist of every field accepted by CreateTankerDto / UpdateTankerDto.
// Anything NOT in this set is stripped before sending to the backend.
// This is safer than a blacklist — it handles nested objects (port/producer/license),
// internal _* fields, calculated outputs, and unknown otherDefaultCosts keys automatically.
const DTO_FIELDS: Record<string, 'uuid' | 'number' | 'string' | 'date' | 'enum'> = {
  portId:         'uuid',
  producerId:     'uuid',
  licenseId:      'uuid',
  tankerNumber:   'string',
  entryDate:      'date',
  productWeight:  'number',
  billWeight:     'number',
  tonnageBasis:   'enum',
  exchangeRate:   'number',
  costProduct:                    'number',
  costPublicBenefits:             'number',
  costFmn60:                      'number',
  costFmn20:                      'number',
  costQualityControl:             'number',
  costDozbalagh_customer:         'number',
  costDozbalagh_producer:         'number',
  costEscort_customer:            'number',
  costEscort_producer:            'number',
  costBascule_customer:           'number',
  costBascule_producer:           'number',
  costOvernight_customer:         'number',
  costOvernight_producer:         'number',
  costBankCommission_customer:    'number',
  costBankCommission_producer:    'number',
  costRentAfn_customer:           'number',
  costRentAfn_producer:           'number',
  costMiscAfn_customer:           'number',
  costMiscAfn_producer:           'number',
  costBrokerCommission_customer:  'number',
  costBrokerCommission_producer:  'number',
  costExchangerCommission_customer: 'number',
  costExchangerCommission_producer: 'number',
  costLicenseCommission_customer: 'number',
  costLicenseCommission_producer: 'number',
  costRentUsd_customer:           'number',
  costRentUsd_producer:           'number',
  costMiscUsd_customer:           'number',
  costMiscUsd_producer:           'number',
  transportCost:          'number',
  commodityPercentDebt:   'number',
  ratePerTonAfn:          'number',
  ratePerTonUsd:          'number',
}

// Required in CreateTankerDto (no @IsOptional) — must always be present with a valid value
const REQUIRED_NUMBERS = new Set(['productWeight', 'billWeight', 'exchangeRate'])

function toApiPayload(row: TankerRow): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  for (const [k, type] of Object.entries(DTO_FIELDS)) {
    const v = (row as Record<string, unknown>)[k]
    if (type === 'uuid') {
      // Omit UUID fields that are empty/null — @IsUUID() rejects empty strings
      if (v && v !== '') payload[k] = v
    } else if (type === 'number') {
      // Coerce null/undefined to 0 for required fields; skip for optional ones
      if (v === null || v === undefined) {
        if (REQUIRED_NUMBERS.has(k)) payload[k] = 0
        // else omit — @IsOptional() accepts missing field
      } else {
        payload[k] = Number(v)
      }
    } else {
      // string, date, enum — include only if not null/undefined
      if (v !== null && v !== undefined) payload[k] = v
    }
  }
  // Ensure all required numeric fields are always present
  for (const f of REQUIRED_NUMBERS) {
    if (!(f in payload)) payload[f] = 0
  }
  return payload
}

interface Port { id: string; name: string; producerId: string }
interface Producer { id: string; name: string }
interface License { id: string; licenseNumber: string }

interface Props {
  invoiceId: string
  contractType: CalculationType
  contractDefaults: Partial<TankerRow>
  initialTankers: TankerRow[]
  readOnly?: boolean
  onRowsChange?: (rows: TankerRow[]) => void
}

// Column groups for visual separators
const GROUP_LABELS: Record<string, string> = {
  shared: 'tankers.groups.shared',
  'customer-afn': 'tankers.groups.customerAfn',
  'producer-afn': 'tankers.groups.producerAfn',
  'customer-usd': 'tankers.groups.customerUsd',
  'producer-usd': 'tankers.groups.producerUsd',
  'per-ton': 'tankers.groups.perTon',
}

// Per-row debounce timers: rowLocalId → timer handle
function useRowDebounce(ms: number) {
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  return useCallback((localId: string, fn: () => void) => {
    const existing = timers.current.get(localId)
    if (existing) clearTimeout(existing)
    timers.current.set(localId, setTimeout(() => {
      timers.current.delete(localId)
      fn()
    }, ms))
  }, [ms])
}

export default function TankerGrid({
  invoiceId,
  contractType,
  contractDefaults,
  initialTankers,
  readOnly = false,
  onRowsChange,
}: Props) {
  const { t } = useTranslation()
  const columns = getVisibleColumns(contractType, true)
  const columnKeys = columns.map((c) => c.key)

  const { rows, addRow, updateCell, updateCells, removeRow, markSaving, markSaved, markError, pasteRows } =
    useTankerGrid(initialTankers, contractType, contractDefaults)

  // Notify parent when rows change (for print sync)
  useEffect(() => {
    onRowsChange?.(rows)
  }, [rows, onRowsChange])

  // Load ports, producers, licenses for select dropdowns
  const [ports, setPorts] = useState<Port[]>([])
  const [producers, setProducers] = useState<Producer[]>([])
  const [licenses, setLicenses] = useState<License[]>([])

  useEffect(() => {
    api.get('/ports?isActive=true').then((r) => setPorts(r.data)).catch(() => {})
    api.get('/accounts?type=producer&isActive=true').then((r) => setProducers(r.data)).catch(() => {})
    api.get('/licenses?isActive=true').then((r) => setLicenses(r.data)).catch(() => {})
  }, [])

  const selectOptionsByKey: Record<string, SelectOption[]> = {
    portId: ports.map((p) => ({ value: p.id, label: p.name })),
    producerId: producers.map((p) => ({ value: p.id, label: p.name })),
    licenseId: licenses.map((l) => ({ value: l.id, label: l.licenseNumber })),
  }

  // Save a single row to backend
  const saveRow = useCallback(
    async (row: TankerRow) => {
      if (!row._dirty) return
      const savedVersion = (row._version as number) ?? 0
      markSaving(row._localId, true)
      try {
        const payload = toApiPayload(row)
        if (row.id) {
          const { data } = await api.patch(`/tankers/${row.id}`, payload)
          markSaved(row._localId, data.id, savedVersion)
        } else {
          const { data } = await api.post(`/invoices/${invoiceId}/tankers`, { ...payload, invoiceId })
          markSaved(row._localId, data.id, savedVersion)
        }
      } catch (err: unknown) {
        const errData = (err as { response?: { data?: unknown } })?.response?.data
        console.error('[TankerGrid] Save failed — server response:', errData)
        markError(row._localId, t('errors.serverError'))
      }
    },
    [invoiceId, markSaving, markSaved, markError, t],
  )

  const scheduleRowSave = useRowDebounce(800)

  // Auto-save dirty rows with per-row debounce.
  // Rules:
  //   - Skip rows with _error (prevents infinite retry loop on 500; user must edit again to retry)
  //   - Skip rows missing portId — it's a non-nullable FK in the DB; saving without it always 500s
  useEffect(() => {
    rows.forEach((row) => {
      const portId = (row as Record<string, unknown>).portId
      const readyToSave = row._dirty && !row._saving && !row._error && portId && portId !== ''
      if (readyToSave) {
        scheduleRowSave(row._localId, () => saveRow(row))
      }
    })
  }, [rows, scheduleRowSave, saveRow])


  // When port changes, auto-derive producerId and store the full port object in one batch update.
  // The port object (port.name) is needed by print templates; it is stripped from API payloads.
  const handleCellChange = useCallback(
    (localId: string, key: string, value: unknown) => {
      if (key === 'portId') {
        const port = ports.find((p) => p.id === value)
        updateCells(localId, {
          portId: value,
          producerId: port?.producerId ?? '',
          // Store resolved objects so print templates can access port.name / producer.name
          port: port ? { id: port.id, name: port.name } : undefined,
          producer: port ? { id: port.producerId, name: producers.find(p => p.id === port.producerId)?.name ?? '' } : undefined,
        })
      } else {
        updateCell(localId, key, value)
      }
    },
    [updateCell, updateCells, ports, producers],
  )

  const handleAddRow = useCallback(() => { addRow() }, [addRow])

  const { handleKeyDown } = useKeyboardNav({
    rowCount: rows.length,
    colCount: columns.length,
    onAddRow: readOnly ? undefined : handleAddRow,
  })

  const { handleCellFocus, handlePaste } = usePasteHandler((tsv, colIndex) => {
    pasteRows(tsv, colIndex, columnKeys)
  })

  const gridRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = gridRef.current
    if (!el || readOnly) return
    el.addEventListener('paste', handlePaste)
    return () => el.removeEventListener('paste', handlePaste)
  }, [handlePaste, readOnly])

  const handleDelete = useCallback(
    async (localId: string) => {
      const row = rows.find((r) => r._localId === localId)
      if (!row) return
      if (row.id) await api.delete(`/tankers/${row.id}`).catch(() => {})
      removeRow(localId)
    },
    [rows, removeRow],
  )

  const totalDebtAfn = rows.reduce((s, r) => s + Number(r.customerDebtAfn ?? 0), 0)
  const totalDebtUsd = rows.reduce((s, r) => s + Number(r.customerDebtUsd ?? 0), 0)

  const savingCount = rows.filter((r) => r._saving).length
  const dirtyCount = rows.filter((r) => r._dirty && !r._saving).length

  // Build group spans for the header
  type GroupSpan = { group: string; labelKey: string; count: number; startIndex: number }
  const groupSpans: GroupSpan[] = []
  columns.forEach((col, i) => {
    const g = col.group ?? ''
    const last = groupSpans[groupSpans.length - 1]
    if (last && last.group === g) {
      last.count++
    } else {
      groupSpans.push({ group: g, labelKey: GROUP_LABELS[g] ?? '', count: 1, startIndex: i })
    }
  })

  return (
    <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden">
      <div ref={gridRef} className="overflow-x-auto" role="grid" aria-label={t('tankers.title')}>

        {/* Group header row */}
        <div className="flex bg-gray-100 border-b border-gray-300 sticky top-0 z-20">
          <div className="w-8 shrink-0" />
          {groupSpans.map((span, i) => {
            const totalWidth = columns
              .slice(span.startIndex, span.startIndex + span.count)
              .reduce((s, c) => s + (c.width ?? 90), 0)
            const groupColors: Record<string, string> = {
              shared: 'bg-blue-50 text-blue-700 border-blue-200',
              'customer-afn': 'bg-green-50 text-green-700 border-green-200',
              'producer-afn': 'bg-orange-50 text-orange-700 border-orange-200',
              'customer-usd': 'bg-teal-50 text-teal-700 border-teal-200',
              'producer-usd': 'bg-purple-50 text-purple-700 border-purple-200',
              'per-ton': 'bg-yellow-50 text-yellow-700 border-yellow-200',
            }
            const colorClass = groupColors[span.group] ?? 'bg-gray-100 text-gray-500'
            return (
              <div
                key={i}
                className={`shrink-0 text-xs font-semibold text-center border-e border-gray-300 py-0.5 ${colorClass}`}
                style={{ width: totalWidth }}
              >
                {span.labelKey ? t(span.labelKey) : ''}
              </div>
            )
          })}
          {!readOnly && <div className="w-7 shrink-0" />}
        </div>

        {/* Column header row */}
        <div className="flex bg-gray-50 border-b border-gray-200 sticky top-5.5 z-10">
          <div className="w-8 shrink-0 border-e border-gray-200" />
          {columns.map((col) => (
            <div
              key={col.key}
              className="shrink-0 text-xs font-medium text-gray-600 px-1.5 py-2 border-e border-gray-200 truncate"
              style={{ width: col.width ?? 90 }}
              title={t(col.labelKey)}
            >
              {t(col.labelKey)}
            </div>
          ))}
          {!readOnly && <div className="w-7 shrink-0" />}
        </div>

        {/* Rows */}
        <div className="relative">
          {rows.map((row, rowIndex) => (
            <TankerRowComponent
              key={row._localId}
              row={row}
              rowIndex={rowIndex}
              columns={columns}
              contractDefaults={contractDefaults}
              readOnly={readOnly}
              selectOptionsByKey={selectOptionsByKey}
              onCellChange={handleCellChange}
              onKeyDown={handleKeyDown}
              onCellFocus={handleCellFocus}
              onDelete={handleDelete}
            />
          ))}

          {rows.length === 0 && (
            <div className="text-center text-sm text-gray-400 py-10">
              {readOnly ? '—' : t('app.add') + ' ' + t('tankers.title')}
            </div>
          )}
        </div>

        {/* Totals footer */}
        {rows.length > 0 && (
          <div className="flex bg-gray-50 border-t border-gray-300 font-medium">
            <div className="w-8 shrink-0 border-e border-gray-200" />
            {columns.map((col) => {
              let display = ''
              if (col.key === 'customerDebtAfn') display = totalDebtAfn.toLocaleString()
              if (col.key === 'customerDebtUsd') display = totalDebtUsd.toLocaleString()
              return (
                <div
                  key={col.key}
                  className="shrink-0 text-xs px-1.5 py-1.5 border-e border-gray-200 text-gray-700"
                  style={{ width: col.width ?? 90 }}
                >
                  {display}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Toolbar */}
      {!readOnly && (
        <div className="px-3 py-2 border-t border-gray-200 bg-white flex items-center gap-3">
          <button
            onClick={handleAddRow}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            + {t('app.add')} {t('tankers.title')}
          </button>

          <span className="text-xs text-gray-400">
            {t('tankers.title')}: {rows.length}
          </span>

              {/* Right-side auto-save status — one indicator at a time */}
          <div className="ms-auto flex items-center">
            {savingCount > 0 && (
              <span className="text-xs text-gray-400 animate-pulse">{t('app.saving')}</span>
            )}
            {savingCount === 0 && dirtyCount === 0 && rows.length > 0 && (
              <span className="text-xs text-green-600">✓ {t('app.saved')}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
