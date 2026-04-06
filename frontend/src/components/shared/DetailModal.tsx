import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export interface DetailField {
  label: string
  value: React.ReactNode
  wide?: boolean
}

interface Props {
  title: string
  subtitle?: React.ReactNode
  fields: DetailField[]
  // Structured actions (preferred)
  onEdit?: () => void
  onDelete?: () => void
  deleteDisabled?: boolean
  deleteDisabledReason?: string
  // Warning/info content shown inside the lifecycle strip (e.g. constraint messages)
  lifecycleNote?: React.ReactNode
  // Legacy free-form actions footer (overrides structured layout when provided)
  actions?: React.ReactNode
  onClose: () => void
}

export default function DetailModal({
  title,
  subtitle,
  fields,
  onEdit,
  onDelete,
  deleteDisabled,
  deleteDisabledReason,
  lifecycleNote,
  actions,
  onClose,
}: Props) {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.language === 'fa'

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const hasStructuredActions = !actions && (onEdit || onDelete)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            <h2 className="text-base font-bold text-gray-900 dark:text-slate-100 truncate">{title}</h2>
            {subtitle && <div>{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Field tiles ── */}
        <div className="px-5 pb-4">
          <div className="grid grid-cols-2 gap-2">
            {fields.map((f, i) => (
              <div
                key={i}
                className={`bg-gray-50 dark:bg-slate-700/60 rounded-xl px-3 py-2.5 ${f.wide ? 'col-span-2' : ''}`}
              >
                <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">
                  {f.label}
                </p>
                <div className="text-sm font-medium text-gray-800 dark:text-slate-200 break-words leading-snug">
                  {f.value !== undefined && f.value !== null && f.value !== ''
                    ? f.value
                    : <span className="text-gray-300 dark:text-slate-600 font-normal">—</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Structured footer ── */}
        {hasStructuredActions && (
          <>
            {/* Lifecycle note (constraint warning) */}
            {lifecycleNote && (
              <div className="px-5 pb-2">
                <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-3 py-2">
                  {lifecycleNote}
                </div>
              </div>
            )}

            {/* Buttons — side by side */}
            <div className="px-3 pb-3 flex gap-2">
              {onDelete && (
                <button
                  onClick={onDelete}
                  disabled={deleteDisabled}
                  title={deleteDisabled ? deleteDisabledReason : undefined}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-100 dark:disabled:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                  </svg>
                  {t('app.delete')}
                </button>
              )}
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white transition-colors cursor-pointer shadow-sm"
                >
                  {t('app.edit')}
                  {isRtl ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </>
        )}

        {/* ── Legacy free-form footer ── */}
        {actions && (
          <div className="px-5 py-4 border-t border-gray-100 dark:border-slate-700 flex items-center justify-end gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
