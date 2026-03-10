import React, { memo } from 'react'
import TankerCell from './TankerCell'
import type { ColumnDef } from './columnDefs'
import type { TankerRow as TankerRowData } from './useTankerGrid'

interface Props {
  row: TankerRowData
  rowIndex: number
  columns: ColumnDef[]
  contractDefaults: Partial<TankerRowData>
  readOnly: boolean
  onCellChange: (localId: string, key: string, value: unknown) => void
  onKeyDown: (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => void
  onCellFocus: (colIndex: number) => void
  onDelete: (localId: string) => void
}

const TankerRowComponent = memo(function TankerRowComponent({
  row,
  rowIndex,
  columns,
  contractDefaults,
  readOnly,
  onCellChange,
  onKeyDown,
  onCellFocus,
  onDelete,
}: Props) {
  const rowClass = [
    'flex border-b border-gray-200',
    row._saving ? 'opacity-60' : '',
    row._error ? 'bg-danger-50' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={rowClass} role="row">
      {/* Row number */}
      <div className="w-8 shrink-0 flex items-center justify-center text-xs text-gray-400 border-e border-gray-200">
        {rowIndex + 1}
      </div>

      {columns.map((col, colIndex) => {
        const isOverride =
          col.key in (contractDefaults as Record<string, unknown>) &&
          row[col.key] !== (contractDefaults as Record<string, unknown>)[col.key]

        return (
          <div
            key={col.key}
            className="shrink-0 border-e border-gray-200"
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
              onChange={(val) => onCellChange(row._localId, col.key, val)}
              onKeyDown={(e) => onKeyDown(e, rowIndex, colIndex)}
              onFocus={() => onCellFocus(colIndex)}
            />
          </div>
        )
      })}

      {/* Delete button */}
      {!readOnly && (
        <button
          className="w-7 shrink-0 text-danger-400 hover:text-danger-600 text-sm flex items-center justify-center"
          onClick={() => onDelete(row._localId)}
          tabIndex={-1}
          aria-label="Delete row"
        >
          ×
        </button>
      )}

      {/* Save indicator */}
      {row._saving && (
        <span className="absolute start-0 top-0 bottom-0 w-0.5 bg-primary-400 animate-pulse" />
      )}
    </div>
  )
})

export default TankerRowComponent
