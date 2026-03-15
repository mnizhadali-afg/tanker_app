import { useTranslation } from 'react-i18next'

interface Props {
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export default function DeleteDialog({ onConfirm, onCancel, loading }: Props) {
  const { t } = useTranslation()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-bold text-gray-900 mb-2">{t('app.delete')}</h2>
        <p className="text-sm text-gray-600 mb-6">{t('invoices.deleteConfirm')}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {t('app.no')}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {t('app.yes')}
          </button>
        </div>
      </div>
    </div>
  )
}
