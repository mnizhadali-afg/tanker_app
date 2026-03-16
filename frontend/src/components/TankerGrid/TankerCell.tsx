import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from './columnDefs'

export interface SelectOption {
  value: string
  label: string
}

interface Props {
  col: ColumnDef
  value: unknown
  rowIndex: number
  colIndex: number
  isOverride: boolean
  readOnly: boolean
  selectOptions?: SelectOption[]   // for col.type === 'select'
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
  selectOptions,
  onChange,
  onKeyDown,
  onFocus,
}: Props) {
  const { t } = useTranslation()

  const baseClass = [
    'h-8 w-full border-0 text-xs px-1.5 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary-400',
    readOnly
      ? 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 cursor-not-allowed'
      : isOverride
        ? 'bg-amber-50 dark:bg-amber-900/20 text-gray-900 dark:text-slate-100'
        : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100',
  ].join(' ')

  const dataAttrs = {
    'data-grid-row': rowIndex,
    'data-grid-col': colIndex,
  }

  if (col.type === 'select') {
    if (readOnly) {
      const label = selectOptions?.find((o) => o.value === value)?.label ?? String(value ?? '—')
      return (
        <div
          {...dataAttrs}
          tabIndex={0}
          className={`${baseClass} flex items-center truncate`}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
        >
          {label}
        </div>
      )
    }
    return (
      <select
        {...dataAttrs}
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        className={baseClass}
      >
        <option value="">—</option>
        {(selectOptions ?? []).map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
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
