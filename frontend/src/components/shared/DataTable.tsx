import { useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { formatNumber } from '../../utils/formatting'

export interface Column<T> {
  key: keyof T | string
  label: string
  render?: (row: T) => React.ReactNode
  className?: string
}

interface Props<T extends { id: string }> {
  columns: Column<T>[]
  rows: T[]
  onRowClick?: (row: T) => void
  loading?: boolean
  emptyMessage?: string
  totalCount?: number
  label?: string
  selectable?: boolean
  selectedIds?: Set<string>
  onSelectionChange?: (ids: Set<string>) => void
}

export default function DataTable<T extends { id: string }>({
  columns,
  rows,
  onRowClick,
  loading,
  emptyMessage,
  totalCount,
  label,
  selectable,
  selectedIds,
  onSelectionChange,
}: Props<T>) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const headerCheckboxRef = useRef<HTMLInputElement>(null)

  const someSelected = selectable && selectedIds && rows.some((r) => selectedIds.has(r.id))
  const allSelected = selectable && selectedIds && rows.length > 0 && rows.every((r) => selectedIds.has(r.id))

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = Boolean(someSelected && !allSelected)
    }
  }, [someSelected, allSelected])

  const handleSelectAll = () => {
    if (!onSelectionChange || !selectedIds) return
    if (allSelected) {
      const next = new Set(selectedIds)
      rows.forEach((r) => next.delete(r.id))
      onSelectionChange(next)
    } else {
      const next = new Set(selectedIds)
      rows.forEach((r) => next.add(r.id))
      onSelectionChange(next)
    }
  }

  const handleToggle = (id: string) => {
    if (!onSelectionChange || !selectedIds) return
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onSelectionChange(next)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 dark:text-slate-500 text-sm">
        {t('app.loading')}
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
            <tr>
              {selectable && (
                <th className="ps-4 pe-2 py-3 w-8">
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    checked={Boolean(allSelected)}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 dark:border-slate-600 text-primary-600 cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`px-4 py-3 text-start font-medium text-gray-600 dark:text-slate-400 ${col.className ?? ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-10 text-center text-gray-400 dark:text-slate-500"
                >
                  {emptyMessage ?? '—'}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const isSelected = Boolean(selectable && selectedIds?.has(row.id))
                return (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick?.(row)}
                    className={[
                      'hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors',
                      onRowClick ? 'cursor-pointer' : '',
                      isSelected ? 'bg-primary-50 hover:bg-primary-50 dark:bg-primary-900/20 dark:hover:bg-primary-900/20' : '',
                    ].join(' ')}
                  >
                    {selectable && (
                      <td className="ps-4 pe-2 py-2.5 w-8">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggle(row.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-gray-300 dark:border-slate-600 text-primary-600 cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={String(col.key)} className={`px-4 py-2.5 ${col.className ?? ''}`}>
                        {col.render
                          ? col.render(row)
                          : String((row as Record<string, unknown>)[String(col.key)] ?? '—')}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      {label !== undefined && (
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-2 px-1 text-end">
          {rows.length < (totalCount ?? rows.length)
            ? `${t('app.showing')} ${formatNumber(rows.length, locale, 0)} ${t('app.of')} ${formatNumber(totalCount!, locale, 0)} ${label}`
            : `${formatNumber(rows.length, locale, 0)} ${label}`}
        </p>
      )}
    </>
  )
}
