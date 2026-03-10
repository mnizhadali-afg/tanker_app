import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from './columnDefs'

interface Props {
  col: ColumnDef
  value: unknown
  rowIndex: number
  colIndex: number
  isOverride: boolean       // differs from contract default
  readOnly: boolean
  onChange: (value: unknown) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  onFocus: () => void
}

const TankerCell = memo(function TankerCell({
  col,
  value,
  rowIndex,
  colIndex,
  isOverride,
  readOnly,
  onChange,
  onKeyDown,
  onFocus,
}: Props) {
  const { t } = useTranslation()

  const baseClass = [
    'h-8 w-full border-0 text-xs px-1.5 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary-400',
    readOnly
      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
      : isOverride
        ? 'bg-amber-50'
        : 'bg-white',
  ].join(' ')

  const dataAttrs = {
    'data-grid-row': rowIndex,
    'data-grid-col': colIndex,
  }

  if (col.type === 'select') {
    // Dropdowns are handled by parent via a select overlay — render as readonly display for now
    return (
      <div
        {...dataAttrs}
        tabIndex={0}
        className={`${baseClass} flex items-center truncate`}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
      >
        {String(value ?? '')}
      </div>
    )
  }

  if (col.type === 'toggle') {
    const opts = col.options ?? []
    return (
      <select
        {...dataAttrs}
        value={String(value ?? opts[0]?.value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        className={baseClass}
        disabled={readOnly}
      >
        {opts.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {t(opt.labelKey)}
          </option>
        ))}
      </select>
    )
  }

  if (col.type === 'date') {
    return (
      <input
        {...dataAttrs}
        type="date"
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        readOnly={readOnly}
        className={baseClass}
      />
    )
  }

  if (col.type === 'number') {
    return (
      <input
        {...dataAttrs}
        type="number"
        value={value === 0 ? '0' : String(value ?? '')}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        readOnly={readOnly}
        className={baseClass}
        step="any"
        min="0"
      />
    )
  }

  // text
  return (
    <input
      {...dataAttrs}
      type="text"
      value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      readOnly={readOnly}
      className={baseClass}
    />
  )
})

export default TankerCell
