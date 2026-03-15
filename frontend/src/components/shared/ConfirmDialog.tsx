import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  title: string
  message: string
  itemName?: string
  confirmLabel: string
  variant?: 'danger' | 'warning' | 'success' | 'primary'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

const variantStyles = {
  danger:  { icon: '🗑', btn: 'bg-red-600 hover:bg-red-700', iconBg: 'bg-red-100', iconColor: 'text-red-600' },
  warning: { icon: '⚠', btn: 'bg-orange-500 hover:bg-orange-600', iconBg: 'bg-orange-100', iconColor: 'text-orange-500' },
  success: { icon: '✓', btn: 'bg-green-600 hover:bg-green-700', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
  primary: { icon: '?', btn: 'bg-primary-600 hover:bg-primary-700', iconBg: 'bg-primary-100', iconColor: 'text-primary-600' },
}

export default function ConfirmDialog({
  title,
  message,
  itemName,
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => { if (!loading) onCancel() }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-base ${styles.iconBg} ${styles.iconColor}`}>
            {styles.icon}
          </div>
          <h2 className="flex-1 text-base font-bold text-gray-900">{title}</h2>
          <button
            onClick={() => { if (!loading) onCancel() }}
            className="text-gray-400 hover:text-gray-600 w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-xl leading-none cursor-pointer shrink-0"
            aria-label="close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-3">
          <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
          {itemName && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <span className="text-sm font-semibold text-gray-800" dir="auto">{itemName}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
          >
            {t('app.cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50 cursor-pointer ${styles.btn}`}
          >
            {loading ? t('app.loading') : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
