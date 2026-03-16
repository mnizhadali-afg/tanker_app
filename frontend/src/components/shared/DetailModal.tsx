import { useEffect } from 'react'

export interface DetailField {
  label: string
  value: React.ReactNode
  wide?: boolean
}

interface Props {
  title: string
  subtitle?: React.ReactNode
  fields: DetailField[]
  actions?: React.ReactNode
  onClose: () => void
}

export default function DetailModal({ title, subtitle, fields, actions, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900 dark:text-slate-100 truncate">{title}</h2>
            {subtitle && <div className="mt-1.5">{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            className="ms-3 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-xl leading-none cursor-pointer shrink-0"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {fields.map((f, i) => (
              <div key={i} className={f.wide ? 'col-span-2' : ''}>
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-0.5">{f.label}</p>
                <div className="text-sm font-medium text-gray-800 dark:text-slate-200 break-words">
                  {f.value !== undefined && f.value !== null && f.value !== '' ? f.value : <span className="text-gray-400 dark:text-slate-600 font-normal">—</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        {actions && (
          <div className="px-5 py-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-end gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
