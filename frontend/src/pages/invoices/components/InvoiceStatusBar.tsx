import { useTranslation } from 'react-i18next'
import { formatDate } from '../../../utils/formatting'
import StatusBadge from '../../../components/shared/StatusBadge'

interface Props {
  status: string
  invoiceNumber: string
  issueDate: string
  onFinalize?: () => void
  onCancel?: () => void
  onDelete?: () => void
}

export default function InvoiceStatusBar({
  status,
  invoiceNumber,
  issueDate,
  onFinalize,
  onCancel,
  onDelete,
}: Props) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language

  return (
    <div className="flex flex-wrap items-center gap-4 bg-white border border-gray-200 rounded-lg px-4 py-3">
      <div className="text-sm font-mono text-gray-700">{invoiceNumber}</div>
      <div className="text-sm text-gray-500">{formatDate(issueDate, locale)}</div>
      <StatusBadge status={status} label={t(`invoices.statuses.${status}`)} />

      <div className="flex-1" />

      {status === 'draft' && onFinalize && (
        <button
          onClick={onFinalize}
          className="text-sm px-4 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          {t('invoices.finalize')}
        </button>
      )}
      {status === 'draft' && onCancel && (
        <button
          onClick={onCancel}
          className="text-sm px-4 py-1.5 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
        >
          {t('invoices.cancel')}
        </button>
      )}
      {(status === 'draft' || status === 'canceled') && onDelete && (
        <button
          onClick={onDelete}
          className="text-sm px-4 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          {t('app.delete')}
        </button>
      )}
    </div>
  )
}
