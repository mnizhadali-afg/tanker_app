import { useTranslation } from 'react-i18next'

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
}

export default function DataTable<T extends { id: string }>({
  columns,
  rows,
  onRowClick,
  loading,
  emptyMessage,
}: Props<T>) {
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
        {t('app.loading')}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={`px-4 py-3 text-start font-medium text-gray-600 ${col.className ?? ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-gray-400"
              >
                {emptyMessage ?? '—'}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className={`px-4 py-2.5 ${col.className ?? ''}`}>
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[String(col.key)] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
