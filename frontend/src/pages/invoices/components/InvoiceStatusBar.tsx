import React from 'react'
import { useTranslation } from 'react-i18next'
import { formatDate } from '../../../utils/formatting'
import StatusBadge from '../../../components/shared/StatusBadge'

interface Props {
  status: string
  invoiceNumber: string
  issueDate: string
  printNode?: React.ReactNode
  onFinalize?: () => void
  onCancel?: () => void
  onDelete?: () => void
}

export default function InvoiceStatusBar({
  status,
  invoiceNumber,
  issueDate,
  printNode,
  onFinalize,
  onCancel,
  onDelete,
}: Props) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language

  const isDraft = status === 'draft'

  return (
    <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5">
      {/* Meta info */}
      <div className="text-sm font-mono font-semibold text-gray-700 dark:text-slate-300 tracking-wide">
        {invoiceNumber}
      </div>
      <div className="w-px h-4 bg-gray-200 dark:bg-slate-700" />
      <div className="text-sm text-gray-500 dark:text-slate-400">{formatDate(issueDate, locale)}</div>
      <StatusBadge status={status} label={t(`invoices.statuses.${status}`)} />

      <div className="flex-1" />

      {/* Action cluster */}
      <div className="flex items-center gap-1">

        {/* Print — icon-only ghost */}
        {printNode}

        {(isDraft && (onFinalize || onCancel || onDelete)) && (
          <div className="w-px h-5 bg-gray-200 dark:bg-slate-700 mx-1" />
        )}

        {/* Finalize — primary labeled button */}
        {isDraft && onFinalize && (
          <button
            onClick={onFinalize}
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {t('invoices.finalize')}
          </button>
        )}

        {/* Cancel invoice — icon-only outlined danger */}
        {isDraft && onCancel && (
          <button
            onClick={onCancel}
            title={t('invoices.cancel')}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent text-gray-400 dark:text-slate-500 hover:border-orange-200 hover:text-orange-600 hover:bg-orange-50 dark:hover:border-orange-800 dark:hover:text-orange-400 dark:hover:bg-orange-900/20 transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </button>
        )}

        {/* Delete — icon-only danger ghost */}
        {onDelete && (
          <button
            onClick={onDelete}
            title={t('app.delete')}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent text-gray-400 dark:text-slate-500 hover:border-red-200 hover:text-red-600 hover:bg-red-50 dark:hover:border-red-800 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
