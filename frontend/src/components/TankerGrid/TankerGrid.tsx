import { useEffect, useRef, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import TankerRowComponent from './TankerRow'
import { useTankerGrid, type TankerRow } from './useTankerGrid'
import { useKeyboardNav, usePasteHandler } from './useKeyboardNav'
import { getVisibleColumns } from './columnDefs'
import type { SelectOption } from './TankerCell'
import api from '../../lib/axios'
import type { CalculationType } from '@tanker/shared'

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

  const { rows, addRow, updateCell, removeRow, markSaving, markSaved, markError, pasteRows } =
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
      markSaving(row._localId, true)
      try {
        if (row.id) {
          const { data } = await api.patch(`/tankers/${row.id}`, row)
          markSaved(row._localId, data.id)
        } else {
          const { data } = await api.post(`/invoices/${invoiceId}/tankers`, { ...row, invoiceId })
          markSaved(row._localId, data.id)
        }
      } catch {
        markError(row._localId, t('errors.serverError'))
      }
    },
    [invoiceId, markSaving, markSaved, markError, t],
  )

  const scheduleRowSave = useRowDebounce(600)

  // Auto-save dirty rows with per-row debounce
  useEffect(() => {
    rows.forEach((row) => {
      if (row._dirty && !row._saving) {
        scheduleRowSave(row._localId, () => saveRow(row))
      }
    })
  }, [rows, scheduleRowSave, saveRow])

  // When port changes, auto-derive producerId from port's producerId
  const handleCellChange = useCallback(
    (localId: string, key: string, value: unknown) => {
      updateCell(localId, key, value)
      if (key === 'portId') {
        const port = ports.find((p) => p.id === value)
        if (port) updateCell(localId, 'producerId', port.producerId)
      }
    },
    [updateCell, ports],
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
          {rows.some((r) => r._saving) && (
            <span className="text-xs text-gray-400 animate-pulse">{t('app.loading')}</span>
          )}
        </div>
      )}
    </div>
  )
}
