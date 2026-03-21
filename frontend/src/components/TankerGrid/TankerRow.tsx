import React, { memo } from 'react'
import TankerCell from './TankerCell'
import type { ColumnDef } from './columnDefs'
import type { TankerRow as TankerRowData } from './useTankerGrid'
import type { SelectOption } from './TankerCell'

interface Props {
  row: TankerRowData
  rowIndex: number
  columns: ColumnDef[]
  contractDefaults: Partial<TankerRowData>
  readOnly: boolean
  selectOptionsByKey: Record<string, SelectOption[]>
  onCellChange: (localId: string, key: string, value: unknown) => void
  onKeyDown: (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => void
  onCellFocus: (colIndex: number) => void
  onDelete: (localId: string) => void
  onDuplicate: (localId: string) => void
}

const TankerRowComponent = memo(function TankerRowComponent({
  row,
  rowIndex,
  columns,
  contractDefaults,
  readOnly,
  selectOptionsByKey,
  onCellChange,
  onKeyDown,
  onCellFocus,
  onDelete,
  onDuplicate,
}: Props) {
  const rowClass = [
    'flex border-b border-gray-200 dark:border-slate-700',
    row._saving ? 'opacity-60' : '',
    row._error ? 'bg-red-50 dark:bg-red-900/20' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={rowClass} role="row">
      {/* Row number */}
      <div className="w-8 shrink-0 flex items-center justify-center text-xs text-gray-400 dark:text-slate-500 border-e border-gray-200 dark:border-slate-700">
        {rowIndex + 1}
      </div>

      {columns.map((col, colIndex) => {
        const isOverride =
          col.key in (contractDefaults as Record<string, unknown>) &&
          row[col.key] !== (contractDefaults as Record<string, unknown>)[col.key]

        return (
          <div
            key={col.key}
            className="shrink-0 border-e border-gray-200 dark:border-slate-700"
            style={{ width: col.width ?? 90 }}
            role="gridcell"
          >
            <TankerCell
              col={col}
              value={row[col.key]}
              rowIndex={rowIndex}
              colIndex={colIndex}
              isOverride={isOverride}
              readOnly={readOnly || (col.readOnly ?? false)}
              selectOptions={col.type === 'select' ? (selectOptionsByKey[col.key] ?? []) : undefined}
              onChange={(val) => onCellChange(row._localId, col.key, val)}
              onKeyDown={(e) => onKeyDown(e, rowIndex, colIndex)}
              onFocus={() => onCellFocus(colIndex)}
            />
          </div>
        )
      })}

      {/* Row action buttons */}
      {!readOnly && (
        <div className="w-14 shrink-0 flex items-center justify-center gap-0.5">
          {/* Duplicate */}
          <button
            className="w-6 h-6 flex items-center justify-center text-gray-300 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 rounded transition-colors"
            onClick={() => onDuplicate(row._localId)}
            tabIndex={-1}
            title="Duplicate row"
            aria-label="Duplicate row"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          </button>
          {/* Delete */}
          <button
            className="w-6 h-6 flex items-center justify-center text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors"
            onClick={() => onDelete(row._localId)}
            tabIndex={-1}
            title="Delete row"
            aria-label="Delete row"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Save error indicator */}
      {row._error && (
        <span className="absolute inset-e-0 top-0 bottom-0 w-0.5 bg-red-400" title={String(row._error)} />
      )}
    </div>
  )
})

export default TankerRowComponent
