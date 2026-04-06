import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import DataTable, { type Column } from '../../components/shared/DataTable'
import StatusBadge from '../../components/shared/StatusBadge'
import DetailModal from '../../components/shared/DetailModal'
import { formatDate, formatNumber } from '../../utils/formatting'
import api from '../../lib/axios'

interface InvoiceStatus {
  id: string
  invoiceNumber: string
  customer: { name: string }
  status: string
  issueDate: string
  totalDebtAfn: number
  totalDebtUsd: number
  paidAfn: number
  paidUsd: number
}

export default function InvoiceStatusReport() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const locale = i18n.language
  const [rows, setRows] = useState<InvoiceStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [detailRow, setDetailRow] = useState<InvoiceStatus | null>(null)

  useEffect(() => {
    api.get('/reports/invoice-status').then((r) => setRows(r.data)).finally(() => setLoading(false))
  }, [])

  const q = search.trim().toLowerCase()
  const filtered = rows.filter(
    (r) => !q || r.invoiceNumber.toLowerCase().includes(q) || r.customer.name.toLowerCase().includes(q)
  )

  const columns: Column<InvoiceStatus>[] = [
    { key: 'invoiceNumber', label: t('invoices.invoiceNumber') },
    { key: 'customer', label: t('invoices.customer'), render: (r) => r.customer.name },
    { key: 'issueDate', label: t('invoices.issueDate'), render: (r) => formatDate(r.issueDate, locale) },
    {
      key: 'status',
      label: t('invoices.status'),
      render: (r) => <StatusBadge status={r.status} label={t(`invoices.statuses.${r.status}`)} />,
    },
    {
      key: 'totalDebtAfn',
      label: t('reports.totalDebt') + ' (' + t('currency.afn') + ')',
      render: (r) => formatNumber(r.totalDebtAfn, locale),
    },
    {
      key: 'outstandingAfn',
      label: t('reports.outstanding') + ' (' + t('currency.afn') + ')',
      render: (r) => (
        <span className={Number(r.totalDebtAfn) - Number(r.paidAfn) > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
          {formatNumber(Number(r.totalDebtAfn) - Number(r.paidAfn), locale)}
        </span>
      ),
    },
    {
      key: 'totalDebtUsd',
      label: t('reports.totalDebt') + ' (' + t('currency.usd') + ')',
      render: (r) => formatNumber(r.totalDebtUsd, locale),
    },
    {
      key: 'outstandingUsd',
      label: t('reports.outstanding') + ' (' + t('currency.usd') + ')',
      render: (r) => (
        <span className={Number(r.totalDebtUsd) - Number(r.paidUsd) > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
          {formatNumber(Number(r.totalDebtUsd) - Number(r.paidUsd), locale)}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">{t('reports.invoiceStatus')}</h2>
        <div className="relative w-72">
          <svg className="absolute inset-s-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`${t('app.search')}…`}
            className="w-full ps-9 pe-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
      </div>
      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        onRowClick={(row) => setDetailRow(row)}
        totalCount={rows.length}
        label={t('nav.invoices')}
      />

      {detailRow && (
        <DetailModal
          title={detailRow.invoiceNumber}
          subtitle={<StatusBadge status={detailRow.status} label={t(`invoices.statuses.${detailRow.status}`)} />}
          fields={[
            { label: t('invoices.customer'), value: detailRow.customer.name },
            { label: t('invoices.issueDate'), value: formatDate(detailRow.issueDate, locale) },
            { label: t('reports.totalDebt') + ' (' + t('currency.afn') + ')', value: formatNumber(detailRow.totalDebtAfn, locale) },
            { label: t('reports.totalPaid') + ' (' + t('currency.afn') + ')', value: formatNumber(detailRow.paidAfn, locale) },
            { label: t('reports.outstanding') + ' (' + t('currency.afn') + ')', value: formatNumber(Number(detailRow.totalDebtAfn) - Number(detailRow.paidAfn), locale) },
            { label: t('reports.totalDebt') + ' (' + t('currency.usd') + ')', value: formatNumber(detailRow.totalDebtUsd, locale) },
            { label: t('reports.totalPaid') + ' (' + t('currency.usd') + ')', value: formatNumber(detailRow.paidUsd, locale) },
            { label: t('reports.outstanding') + ' (' + t('currency.usd') + ')', value: formatNumber(Number(detailRow.totalDebtUsd) - Number(detailRow.paidUsd), locale) },
          ]}
          onClose={() => setDetailRow(null)}
          onEdit={() => { setDetailRow(null); navigate(`/invoices/${detailRow.id}`); }}
        />
      )}
    </div>
  )
}
