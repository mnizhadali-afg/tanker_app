import { useTranslation } from 'react-i18next'

interface Props {
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export default function CancelDialog({ onConfirm, onCancel, loading }: Props) {
  const { t } = useTranslation()
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={() => { if (!loading) onCancel() }}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-orange-100 dark:bg-orange-900/30 text-orange-500 dark:text-orange-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">{t('invoices.cancel')}</h2>
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
        <div className="px-5 pb-4">
          <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{t('invoices.cancelConfirm')}</p>
        </div>
        <div className="px-3 pb-3 flex gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {t('app.no')}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 transition-colors cursor-pointer shadow-sm"
          >
            {t('app.yes')}
          </button>
        </div>
      </div>
    </div>
  )
}
