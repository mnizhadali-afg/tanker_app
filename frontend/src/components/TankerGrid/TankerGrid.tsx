import React, { useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import TankerRowComponent from './TankerRow'
import { useTankerGrid, buildEmptyRow, type TankerRow } from './useTankerGrid'
import { useKeyboardNav, usePasteHandler } from './useKeyboardNav'
import { getVisibleColumns } from './columnDefs'
import api from '../../lib/axios'
import type { CalculationType } from '@tanker/shared'

interface Props {
  invoiceId: string
  contractType: CalculationType
  contractDefaults: Partial<TankerRow>
  initialTankers: TankerRow[]
  readOnly?: boolean
}

// Debounce helper
function useDebounce<T extends (...args: unknown[]) => unknown>(fn: T, ms: number): T {
  const timer = useRef<ReturnType<typeof setTimeout>>()
  return useCallback((...args: unknown[]) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => fn(...args), ms)
  }, [fn, ms]) as T
}

export default function TankerGrid({
  invoiceId,
  contractType,
  contractDefaults,
  initialTankers,
  readOnly = false,
}: Props) {
  const { t } = useTranslation()
  const columns = getVisibleColumns(contractType, true)
  const columnKeys = columns.map((c) => c.key)

  const { rows, addRow, updateCell, removeRow, markSaving, markSaved, markError, pasteRows } =
    useTankerGrid(initialTankers, contractType, contractDefaults)

  // Save a row to backend (debounced)
  const saveRow = useCallback(
    async (row: TankerRow) => {
      if (!row._dirty) return
      markSaving(row._localId, true)
      try {
        if (row.id) {
          // Update existing
          const { data } = await api.patch(`/tankers/${row.id}`, row)
          markSaved(row._localId, data.id)
        } else {
          // Create new
          const { data } = await api.post(`/invoices/${invoiceId}/tankers`, {
            ...row,
            invoiceId,
          })
          markSaved(row._localId, data.id)
        }
      } catch {
        markError(row._localId, t('errors.serverError'))
      }
    },
    [invoiceId, markSaving, markSaved, markError, t],
  )

  const debouncedSave = useDebounce(saveRow as (...args: unknown[]) => unknown, 600)

  // Auto-save dirty rows
  useEffect(() => {
    rows.forEach((row) => {
      if (row._dirty && !row._saving) {
        (debouncedSave as (row: TankerRow) => void)(row)
      }
    })
  }, [rows, debouncedSave])

  const handleAddRow = useCallback(() => {
    addRow()
  }, [addRow])

  const { handleKeyDown } = useKeyboardNav({
    rowCount: rows.length,
    colCount: columns.length,
    onAddRow: readOnly ? undefined : handleAddRow,
  })

  const { handleCellFocus, handlePaste } = usePasteHandler((tsv, colIndex) => {
    pasteRows(tsv, colIndex, columnKeys)
  })

  // Attach paste listener to grid container
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
        await api.delete(`/tankers/${row.id}`).catch(() => {})
      }
      removeRow(localId)
    },
    [rows, removeRow],
  )

  // Compute total footer row
  const totalDebtAfn = rows.reduce((s, r) => s + Number(r.customerDebtAfn ?? 0), 0)
  const totalDebtUsd = rows.reduce((s, r) => s + Number(r.customerDebtUsd ?? 0), 0)

  return (
    <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden">
      {/* ── Scrollable grid ─────────────────────────────────────────────── */}
      <div ref={gridRef} className="overflow-x-auto" role="grid" aria-label={t('tankers.title')}>
        {/* Sticky header */}
        <div className="flex bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
          <div className="w-8 shrink-0 border-e border-gray-200" /> {/* row number col */}
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
              onCellChange={updateCell}
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

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
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
        </div>
      )}
    </div>
  )
}
