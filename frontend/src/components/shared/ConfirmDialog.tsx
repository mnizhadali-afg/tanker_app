import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  title: string
  message: string
  itemName?: string
  items?: string[]
  confirmLabel: string
  variant?: 'danger' | 'warning' | 'success' | 'primary'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

const variantStyles = {
  danger:  { btn: 'bg-red-600 hover:bg-red-700', iconBg: 'bg-red-100 dark:bg-red-900/30', iconColor: 'text-red-500 dark:text-red-400' },
  warning: { btn: 'bg-orange-500 hover:bg-orange-600', iconBg: 'bg-orange-100 dark:bg-orange-900/30', iconColor: 'text-orange-500 dark:text-orange-400' },
  success: { btn: 'bg-green-600 hover:bg-green-700', iconBg: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600 dark:text-green-400' },
  primary: { btn: 'bg-primary-600 hover:bg-primary-700', iconBg: 'bg-primary-100 dark:bg-primary-900/30', iconColor: 'text-primary-600 dark:text-primary-400' },
}

const variantIcons = {
  danger: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  ),
  warning: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  success: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  primary: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
}

export default function ConfirmDialog({
  title,
  message,
  itemName,
  items,
  confirmLabel,
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useTranslation()
  const styles = variantStyles[variant]

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading) onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCancel, loading])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={() => { if (!loading) onCancel() }}
    >
      <div
        className={`bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full overflow-hidden ${items && items.length > 1 ? 'max-w-md' : 'max-w-sm'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${styles.iconBg} ${styles.iconColor}`}>
              {variantIcons[variant]}
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-slate-100 leading-snug">{title}</h2>
          </div>
          <button
            onClick={() => { if (!loading) onCancel() }}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="px-5 pb-4 space-y-3">
          <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{message}</p>
          {itemName && (
            <div className="bg-gray-50 dark:bg-slate-700/60 rounded-xl px-3 py-2.5">
              <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">
                {title}
              </p>
              <span className="text-sm font-semibold text-gray-800 dark:text-slate-200" dir="auto">{itemName}</span>
            </div>
          )}
          {items && items.length > 0 && (
            <div className="bg-gray-50 dark:bg-slate-700/60 rounded-xl divide-y divide-gray-100 dark:divide-slate-600/60 max-h-44 overflow-y-auto">
              {items.map((name, i) => (
                <div key={i} className="px-3 py-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-slate-300" dir="auto">{name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="px-3 pb-3 flex gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {t('app.cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-colors cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${styles.btn}`}
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                {t('app.processing')}
              </>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
