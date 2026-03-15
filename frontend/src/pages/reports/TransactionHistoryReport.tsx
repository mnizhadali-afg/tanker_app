import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import DataTable, { type Column } from '../../components/shared/DataTable'
import DetailModal from '../../components/shared/DetailModal'
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
  const [search, setSearch] = useState('')
  const [detailRow, setDetailRow] = useState<Transaction | null>(null)

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
  ]

  const q = search.trim().toLowerCase()
  const filtered = rows.filter(
    (r) =>
      !q ||
      (r.customer?.name ?? '').toLowerCase().includes(q) ||
      (r.contract?.code ?? '').toLowerCase().includes(q) ||
      (r.invoice?.invoiceNumber ?? '').toLowerCase().includes(q)
  )

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">{t('reports.transactionHistory')}</h2>

      <div className="flex items-end justify-between gap-4">
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
            <button onClick={() => { setDateFrom(''); setDateTo('') }} className="text-sm text-gray-500 hover:text-gray-700 pb-0.5 cursor-pointer">
              × {t('app.cancel')}
            </button>
          )}
        </div>
        <div className="relative w-72">
          <svg className="absolute inset-s-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`${t('app.search')}…`}
            className="w-full ps-9 pe-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        onRowClick={(r) => setDetailRow(r)}
        totalCount={rows.length}
        label={t('nav.payments')}
      />

      {detailRow && (
        <DetailModal
          title={t(`payments.types.${detailRow.type}`)}
          fields={[
            { label: t('payments.transactionDate'), value: formatDate(detailRow.transactionDate, locale) },
            { label: t('accounts.types.customer'), value: detailRow.customer?.name },
            { label: t('payments.amountAfn'), value: detailRow.amountAfn ? formatNumber(detailRow.amountAfn, locale) + ' ' + t('currency.afn') : undefined },
            { label: t('payments.amountUsd'), value: detailRow.amountUsd ? formatNumber(detailRow.amountUsd, locale) + ' ' + t('currency.usd') : undefined },
            ...(detailRow.contract ? [{ label: t('contracts.code'), value: detailRow.contract.code }] : []),
            ...(detailRow.invoice ? [{ label: t('invoices.invoiceNumber'), value: detailRow.invoice.invoiceNumber }] : []),
            ...(detailRow.notes ? [{ label: t('app.notes'), value: detailRow.notes, wide: true }] : []),
          ]}
          onClose={() => setDetailRow(null)}
        />
      )}
    </div>
  )
}
