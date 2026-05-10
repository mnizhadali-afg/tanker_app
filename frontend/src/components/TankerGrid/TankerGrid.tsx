import { useEffect, useRef, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../shared/Toast'
import TankerRowComponent from './TankerRow'
import { useTankerGrid, type TankerRow } from './useTankerGrid'
import { useKeyboardNav, usePasteHandler } from './useKeyboardNav'
import { getVisibleColumns } from './columnDefs'
import type { SelectOption } from './TankerCell'
import api from '../../lib/axios'
import type { CalculationType } from '@tanker/shared'
import { exportToXlsx, exportToCsv, parseImportFile } from './useImportExport'

// ─── DTO field whitelist ──────────────────────────────────────────────────────
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

const REQUIRED_NUMBERS = new Set(['productWeight', 'billWeight', 'exchangeRate'])

function toApiPayload(row: TankerRow): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  for (const [k, type] of Object.entries(DTO_FIELDS)) {
    const v = (row as Record<string, unknown>)[k]
    if (type === 'uuid') {
      if (v && v !== '') payload[k] = v
    } else if (type === 'number') {
      if (v === null || v === undefined) {
        if (REQUIRED_NUMBERS.has(k)) payload[k] = 0
      } else {
        payload[k] = Number(v)
      }
    } else {
      if (v !== null && v !== undefined) payload[k] = v
    }
  }
  for (const f of REQUIRED_NUMBERS) {
    if (!(f in payload)) payload[f] = 0
  }
  return payload
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface Port     { id: string; name: string; producerId: string }
interface Producer { id: string; name: string }
interface License  { id: string; licenseNumber: string }

interface Props {
  invoiceId: string
  invoiceNumber?: string
  customerName?: string
  contractType: CalculationType
  contractDefaults: Partial<TankerRow>
  initialTankers: TankerRow[]
  readOnly?: boolean
  onRowsChange?: (rows: TankerRow[]) => void
}

type SavePhase = 'idle' | 'saving' | 'saved' | 'error'
interface SaveStatus {
  phase: SavePhase
  done: number
  total: number
  errorMsg?: string
}

const GROUP_LABELS: Record<string, string> = {
  info: 'tankers.groups.info',
  weight: 'tankers.groups.weight',
  shared: 'tankers.groups.shared',
  'customer-afn': 'tankers.groups.customerAfn',
  'producer-afn': 'tankers.groups.producerAfn',
  'customer-usd': 'tankers.groups.customerUsd',
  'producer-usd': 'tankers.groups.producerUsd',
  'per-ton': 'tankers.groups.perTon',
  result: 'tankers.groups.result',
}

const BATCH_CHUNK = 25   // rows per HTTP request
const IDLE_MS     = 4000 // ms of inactivity before auto-save fires

export default function TankerGrid({
  invoiceId,
  invoiceNumber = 'invoice',
  customerName = '',
  contractType,
  contractDefaults,
  initialTankers,
  readOnly = false,
  onRowsChange,
}: Props) {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const columns    = getVisibleColumns(contractType, true)
  const columnKeys = columns.map((c) => c.key)

  const {
    rows, addRow, updateCell, updateCells, removeRow, duplicateRow, pasteRows,
    bulkAddRows, bulkMarkSaving, bulkMarkSaved, bulkMarkError,
  } = useTankerGrid(initialTankers, contractType, contractDefaults)

  // Notify parent when rows change (for print sync)
  useEffect(() => { onRowsChange?.(rows) }, [rows, onRowsChange])

  // ─── Reference data ────────────────────────────────────────────────────────
  const [ports,     setPorts]     = useState<Port[]>([])
  const [producers, setProducers] = useState<Producer[]>([])
  const [licenses,  setLicenses]  = useState<License[]>([])

  useEffect(() => {
    api.get('/ports?isActive=true').then((r) => setPorts(r.data)).catch(() => showToast(t('errors.loadFailed'), 'error'))
    api.get('/accounts?type=producer&isActive=true').then((r) => setProducers(r.data)).catch(() => showToast(t('errors.loadFailed'), 'error'))
    api.get('/licenses?isActive=true').then((r) => setLicenses(r.data)).catch(() => showToast(t('errors.loadFailed'), 'error'))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const selectOptionsByKey: Record<string, SelectOption[]> = {
    portId:     ports.map((p) => ({ value: p.id, label: p.name })),
    producerId: producers.map((p) => ({ value: p.id, label: p.name })),
    licenseId:  licenses.map((l) => ({ value: l.id, label: l.licenseNumber })),
  }

  // ─── Save status ───────────────────────────────────────────────────────────
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ phase: 'idle', done: 0, total: 0 })
  const rowsRef = useRef<TankerRow[]>(rows)
  useEffect(() => { rowsRef.current = rows }, [rows])

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ─── Core batch save ───────────────────────────────────────────────────────
  const runBatchSave = useCallback(async (overrideRows?: TankerRow[]) => {
    const allRows   = overrideRows ?? rowsRef.current
    const dirtyRows = allRows.filter((r) => r._dirty && !r._saving)
    if (dirtyRows.length === 0) return

    // Capture save-versions before any async work
    const capturedVersions = new Map(
      dirtyRows.map((r) => [r._localId, (r._version as number) ?? 0]),
    )

    bulkMarkSaving(new Set(dirtyRows.map((r) => r._localId)))
    setSaveStatus({ phase: 'saving', done: 0, total: dirtyRows.length })

    const chunks    = chunkArray(dirtyRows, BATCH_CHUNK)
    let   doneCount = 0
    const savedItems: Array<{ localId: string; serverId: string; savedVersion: number }> = []

    for (let ci = 0; ci < chunks.length; ci++) {
      const chunk = chunks[ci]
      const items = chunk.map((row) => ({
        ...toApiPayload(row),
        ...(row.id ? { id: row.id } : {}),
      }))

      try {
        const { data } = await api.post(`/invoices/${invoiceId}/tankers/batch-save`, { rows: items })
        ;(data as Array<{ id: string }>).forEach((saved, i) => {
          savedItems.push({
            localId:      chunk[i]._localId,
            serverId:     saved.id,
            savedVersion: capturedVersions.get(chunk[i]._localId) ?? 0,
          })
        })
        doneCount += chunk.length
        setSaveStatus({ phase: 'saving', done: doneCount, total: dirtyRows.length })
      } catch (err: unknown) {
        const statusCode = (err as { response?: { status?: number } })?.response?.status
        console.error('[TankerGrid] Batch save failed, status:', statusCode)
        // Clear _saving on ALL remaining chunks (not just this one) so no row is stuck at opacity-60
        const remainingIds = new Set(chunks.slice(ci).flatMap((c) => c.map((r) => r._localId)))
        bulkMarkError(remainingIds, t('errors.serverError'))
        setSaveStatus({ phase: 'error', done: doneCount, total: dirtyRows.length, errorMsg: t('errors.serverError') })
        return
      }
    }

    bulkMarkSaved(savedItems)
    setSaveStatus({ phase: 'saved', done: doneCount, total: dirtyRows.length })
    setTimeout(() => setSaveStatus((s) => (s.phase === 'saved' ? { phase: 'idle', done: 0, total: 0 } : s)), 3000)
  }, [invoiceId, bulkMarkSaving, bulkMarkSaved, bulkMarkError, t])

  // ─── Idle-based auto-save (resets on every row change) ────────────────────
  useEffect(() => {
    if (readOnly) return
    const hasDirty = rows.some((r) => r._dirty && !r._saving)
    if (!hasDirty) return

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    idleTimerRef.current = setTimeout(() => runBatchSave(), IDLE_MS)
    return () => { if (idleTimerRef.current) clearTimeout(idleTimerRef.current) }
  }, [rows, readOnly, runBatchSave])

  // ─── Cell change handlers ──────────────────────────────────────────────────
  const handleCellChange = useCallback(
    (localId: string, key: string, value: unknown) => {
      if (key === 'portId') {
        const port = ports.find((p) => p.id === value)
        updateCells(localId, {
          portId:    value,
          producerId: port?.producerId ?? '',
          port:      port ? { id: port.id, name: port.name } : undefined,
          producer:  port ? { id: port.producerId, name: producers.find((p) => p.id === port.producerId)?.name ?? '' } : undefined,
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
    colCount:  columns.length,
    onAddRow:  readOnly ? undefined : handleAddRow,
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
      if (row.id) {
        try {
          await api.delete(`/tankers/${row.id}`)
        } catch {
          showToast(t('errors.serverError'), 'error')
          return
        }
      }
      removeRow(localId)
    },
    [rows, removeRow, showToast, t],
  )

  const handleDuplicate = useCallback(
    (localId: string) => { duplicateRow(localId) },
    [duplicateRow],
  )

  // ─── Import ───────────────────────────────────────────────────────────────
  const importRef = useRef<HTMLInputElement>(null)
  const [importStatus, setImportStatus] = useState<string | null>(null)

  const handleImportFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      e.target.value = '' // reset so same file can be re-selected

      setImportStatus(t('app.loading') + '…')
      try {
        const { rows: importedRows, warnings, skipped } = await parseImportFile(file, ports, licenses)
        if (importedRows.length === 0) {
          setImportStatus(`No rows imported. ${warnings[0] ?? ''}`)
          return
        }

        bulkAddRows(importedRows)
        const msg = `${importedRows.length} rows imported${skipped > 0 ? ` (${skipped} empty rows skipped)` : ''}`
        setImportStatus(msg)
        if (warnings.length > 0) console.warn('[Import] parse warnings count:', warnings.length)

        // runBatchSave with no args — rowsRef.current will be up-to-date after React re-renders
        setTimeout(() => runBatchSave(), 400)
        setTimeout(() => setImportStatus(null), 5000)
      } catch {
        setImportStatus(t('errors.importFailed'))
        setTimeout(() => setImportStatus(null), 5000)
      }
    },
    [t, ports, licenses, bulkAddRows, runBatchSave],
  )

  // ─── Export dropdown ──────────────────────────────────────────────────────
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef  = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!exportOpen) return
    const close = (e: MouseEvent) => { if (!exportRef.current?.contains(e.target as Node)) setExportOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [exportOpen])

  // ─── Derived counts ───────────────────────────────────────────────────────
  const totalDebtAfn  = rows.reduce((s, r) => s + Number(r.customerDebtAfn ?? 0), 0)
  const totalDebtUsd  = rows.reduce((s, r) => s + Number(r.customerDebtUsd ?? 0), 0)
  const dirtyCount    = rows.filter((r) => r._dirty && !r._saving).length

  // ─── Group header spans ───────────────────────────────────────────────────
  type GroupSpan = { group: string; labelKey: string; count: number; startIndex: number }
  const groupSpans: GroupSpan[] = []
  columns.forEach((col, i) => {
    const g    = col.group ?? ''
    const last = groupSpans[groupSpans.length - 1]
    if (last && last.group === g) { last.count++ }
    else groupSpans.push({ group: g, labelKey: GROUP_LABELS[g] ?? '', count: 1, startIndex: i })
  })

  const groupColors: Record<string, string> = {
    info: 'bg-gray-50 text-gray-600 border-gray-200',
    weight: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    shared: 'bg-blue-50 text-blue-700 border-blue-200',
    'customer-afn': 'bg-green-50 text-green-700 border-green-200',
    'producer-afn': 'bg-orange-50 text-orange-700 border-orange-200',
    'customer-usd': 'bg-teal-50 text-teal-700 border-teal-200',
    'producer-usd': 'bg-purple-50 text-purple-700 border-purple-200',
    'per-ton': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    result: 'bg-rose-50 text-rose-700 border-rose-200',
  }

  // ─── Scroll navigator ─────────────────────────────────────────────────────
  const NAVIGATOR_THRESHOLD = 10  // show only when there are this many rows
  const jumpToRow = useCallback((index: number) => {
    const container = document.getElementById(`tanker-rows-${invoiceId}`)
    if (!container) return
    const target = container.querySelector(`[data-row-index="${index}"]`)
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [invoiceId])

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">

      {/* Grid table */}
      <div ref={gridRef} className="overflow-x-auto" role="grid" aria-label={t('tankers.title')}>

        {/* Group header row */}
        <div className="flex bg-gray-100 dark:bg-slate-700 border-b border-gray-300 dark:border-slate-600 sticky top-0 z-20">
          <div className="w-8 shrink-0" />
          {groupSpans.map((span, i) => {
            const totalWidth = columns
              .slice(span.startIndex, span.startIndex + span.count)
              .reduce((s, c) => s + (c.width ?? 90), 0)
            const colorClass = groupColors[span.group] ?? 'bg-gray-100 dark:bg-slate-600 text-gray-500 dark:text-slate-400'
            return (
              <div
                key={i}
                className={`shrink-0 text-xs font-semibold text-center border-e border-gray-300 dark:border-slate-600 py-0.5 ${colorClass}`}
                style={{ width: totalWidth }}
              >
                {span.labelKey ? t(span.labelKey) : ''}
              </div>
            )
          })}
          {!readOnly && <div className="w-14 shrink-0" />}
        </div>

        {/* Column header row */}
        <div className="flex bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-5.5 z-10">
          <div className="w-8 shrink-0 border-e border-gray-200 dark:border-slate-700" />
          {columns.map((col) => (
            <div
              key={col.key}
              className="shrink-0 text-xs font-medium text-gray-600 dark:text-slate-400 px-1.5 py-2 border-e border-gray-200 dark:border-slate-700 truncate"
              style={{ width: col.width ?? 90 }}
              title={t(col.labelKey)}
            >
              {t(col.labelKey)}
            </div>
          ))}
          {!readOnly && <div className="w-14 shrink-0" />}
        </div>

        {/* Data rows */}
        <div className="relative" id={`tanker-rows-${invoiceId}`}>
          {rows.map((row, rowIndex) => (
            <div key={row._localId} data-row-index={rowIndex}>
              <TankerRowComponent
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
                onDuplicate={handleDuplicate}
              />
            </div>
          ))}

          {rows.length === 0 && (
            <div className="text-center text-sm text-gray-400 dark:text-slate-500 py-10">
              {readOnly ? '—' : t('app.add') + ' ' + t('tankers.title')}
            </div>
          )}
        </div>

        {/* Totals footer */}
        {rows.length > 0 && (
          <div className="flex bg-gray-50 dark:bg-slate-800 border-t border-gray-300 dark:border-slate-600 font-medium">
            <div className="w-8 shrink-0 border-e border-gray-200 dark:border-slate-700" />
            {columns.map((col) => {
              let display = ''
              if (col.key === 'customerDebtAfn') display = totalDebtAfn.toLocaleString()
              if (col.key === 'customerDebtUsd') display = totalDebtUsd.toLocaleString()
              return (
                <div
                  key={col.key}
                  className="shrink-0 text-xs px-1.5 py-1.5 border-e border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300"
                  style={{ width: col.width ?? 90 }}
                >
                  {display}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Progress bar (visible only while saving) ── */}
      {saveStatus.phase === 'saving' && (
        <div className="w-full bg-gray-100 dark:bg-slate-700">
          <div
            className="h-1 bg-primary-500 transition-all duration-300"
            style={{ width: saveStatus.total > 0 ? `${Math.round((saveStatus.done / saveStatus.total) * 100)}%` : '30%' }}
          />
        </div>
      )}

      {/* ── Import status banner ── */}
      {importStatus && (
        <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 border-t border-blue-200 text-xs text-blue-700 dark:text-blue-300">
          {importStatus}
        </div>
      )}

      {/* ── Toolbar ── */}
      {!readOnly && (
        <div className="px-3 py-2 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center gap-2 flex-wrap">

          {/* Add row */}
          <button
            onClick={handleAddRow}
            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
          >
            + {t('app.add')} {t('tankers.title')}
          </button>

          <span className="text-xs text-gray-300 dark:text-slate-600 select-none">|</span>

          {/* Import button */}
          <div className="relative">
            <button
              onClick={() => importRef.current?.click()}
              className="text-xs px-2.5 py-1 rounded border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {t('grid.import')}
            </button>
            <input
              ref={importRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleImportFile}
            />
          </div>

          {/* Export dropdown */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => rows.length > 0 && setExportOpen((o) => !o)}
              disabled={rows.length === 0}
              className="text-xs px-2.5 py-1 rounded border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export ▾
            </button>
            {exportOpen && (
              <div className="absolute inset-s-0 bottom-full mb-1 w-40 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded shadow-lg z-50 text-xs">
                <button
                  className="w-full text-start px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200"
                  onClick={() => { void exportToXlsx(rows, ports, licenses, customerName || invoiceNumber); setExportOpen(false) }}
                >
                  📊 Excel (.xlsx)
                </button>
                <button
                  className="w-full text-start px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200"
                  onClick={() => { void exportToCsv(rows, ports, licenses, customerName || invoiceNumber); setExportOpen(false) }}
                >
                  📄 CSV (.csv)
                </button>
              </div>
            )}
          </div>

          {/* Row count */}
          <span className="text-xs text-gray-400 dark:text-slate-500">
            {t('tankers.title')}: {rows.length}
          </span>

          {/* ── Save status (right-aligned) ── */}
          <div className="ms-auto flex items-center gap-2">
            {saveStatus.phase === 'saving' && (
              <span className="text-xs text-gray-400 dark:text-slate-500 animate-pulse flex items-center gap-1">
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                {saveStatus.total > 0
                  ? t('grid.savingProgress', { done: saveStatus.done, total: saveStatus.total })
                  : t('grid.saving')}
              </span>
            )}

            {saveStatus.phase === 'saved' && (
              <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {saveStatus.total > 0 ? t('grid.savedCount', { count: saveStatus.total }) : t('grid.saved')}
              </span>
            )}

            {saveStatus.phase === 'error' && (
              <span className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                {t('grid.saveFailed')}
                <button
                  className="underline ms-1"
                  onClick={() => runBatchSave()}
                >
                  {t('grid.retry')}
                </button>
              </span>
            )}

            {saveStatus.phase === 'idle' && dirtyCount > 0 && (
              <span className="text-xs text-amber-500 dark:text-amber-400">
                {t('grid.unsaved', { count: dirtyCount })}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Scroll navigator — floating pill, shown only when rows ≥ threshold ── */}
      {rows.length >= NAVIGATOR_THRESHOLD && (
        <div className="fixed inset-e-4 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-0.5 bg-white/90 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-600 rounded-full shadow-lg py-2 px-1 backdrop-blur-sm select-none"
             style={{ maxHeight: '60vh', overflowY: 'auto' }}
             title="Jump to row">
          {/* Top label */}
          <span className="text-[9px] text-gray-400 dark:text-slate-500 font-medium mb-1 px-1">
            {rows.length}
          </span>

          {/* One dot per row — clicking jumps to it */}
          {rows.map((row, i) => {
            const isError  = Boolean(row._error)
            const isDirty  = Boolean(row._dirty && !row._saving)
            const isSaving = Boolean(row._saving)
            const dotColor = isError  ? 'bg-red-400'
                           : isSaving ? 'bg-blue-300 animate-pulse'
                           : isDirty  ? 'bg-amber-400'
                           : 'bg-gray-300 dark:bg-slate-500'
            return (
              <button
                key={row._localId}
                onClick={() => jumpToRow(i)}
                title={`Row ${i + 1}${isError ? ' — error' : isDirty ? ' — unsaved' : ''}`}
                className={`w-2 h-2 rounded-full transition-all hover:scale-150 hover:bg-primary-500 shrink-0 ${dotColor}`}
              />
            )
          })}

          {/* Bottom arrow — scroll to last row */}
          <button
            onClick={() => jumpToRow(rows.length - 1)}
            className="mt-1 text-gray-300 dark:text-slate-600 hover:text-primary-500 dark:hover:text-primary-400"
            title="Jump to last row"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
