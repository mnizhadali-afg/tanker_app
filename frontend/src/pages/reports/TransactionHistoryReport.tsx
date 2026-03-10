import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import DataTable, { type Column } from '../../components/shared/DataTable'
import { formatDate, formatNumber } from '../../utils/formatting'
import api from '../../lib/axios'

interface Transaction {
  id: string
  type: string
  customer?: { name: string }
  contract?: { code: string }
  invoice?: { invoiceNumber: string }
  amountAfn?: number
  amountUsd?: number
  transactionDate: string
  notes?: string
}

export default function TransactionHistoryReport() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language

  const [rows, setRows] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    setLoading(true)
    api.get(`/reports/transactions?${params}`).then((r) => setRows(r.data)).finally(() => setLoading(false))
  }, [dateFrom, dateTo])

  const columns: Column<Transaction>[] = [
    { key: 'type', label: t('payments.type'), render: (r) => t(`payments.types.${r.type}`) },
    { key: 'customer', label: t('accounts.types.customer'), render: (r) => r.customer?.name ?? '—' },
    { key: 'contract', label: t('contracts.code'), render: (r) => r.contract?.code ?? '—' },
    { key: 'invoice', label: t('invoices.invoiceNumber'), render: (r) => r.invoice?.invoiceNumber ?? '—' },
    { key: 'amountAfn', label: t('payments.amountAfn'), render: (r) => r.amountAfn ? formatNumber(r.amountAfn, locale) : '—' },
    { key: 'amountUsd', label: t('payments.amountUsd'), render: (r) => r.amountUsd ? formatNumber(r.amountUsd, locale) : '—' },
    { key: 'transactionDate', label: t('payments.transactionDate'), render: (r) => formatDate(r.transactionDate, locale) },
    { key: 'notes', label: t('app.notes'), render: (r) => r.notes ?? '—' },
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">{t('reports.transactionHistory')}</h2>

      <div className="flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.dateFrom')}</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.dateTo')}</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(''); setDateTo('') }} className="text-sm text-gray-500 hover:text-gray-700 pb-0.5">
            × {t('app.cancel')}
          </button>
        )}
      </div>

      <DataTable columns={columns} rows={rows} loading={loading} />
    </div>
  )
}
