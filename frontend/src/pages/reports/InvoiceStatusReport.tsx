import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import DataTable, { type Column } from '../../components/shared/DataTable'
import StatusBadge from '../../components/shared/StatusBadge'
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
  totalPaidAfn: number
  totalPaidUsd: number
}

export default function InvoiceStatusReport() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const locale = i18n.language
  const [rows, setRows] = useState<InvoiceStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/reports/invoice-status').then((r) => setRows(r.data)).finally(() => setLoading(false))
  }, [])

  const columns: Column<InvoiceStatus>[] = [
    { key: 'invoiceNumber', label: t('invoices.invoiceNumber') },
    { key: 'customer', label: t('invoices.customer'), render: (r) => r.customer.name },
    { key: 'issueDate', label: t('invoices.issueDate'), render: (r) => formatDate(r.issueDate, locale) },
    {
      key: 'status',
      label: t('invoices.status'),
      render: (r) => <StatusBadge status={r.status} label={t(`invoices.statuses.${r.status}`)} />,
    },
    { key: 'totalDebtAfn', label: t('reports.totalDebt') + ' (' + t('currency.afn') + ')', render: (r) => formatNumber(r.totalDebtAfn, locale) },
    { key: 'totalDebtUsd', label: t('reports.totalDebt') + ' (' + t('currency.usd') + ')', render: (r) => formatNumber(r.totalDebtUsd, locale) },
    {
      key: 'outstanding',
      label: t('reports.outstanding'),
      render: (r) => (
        <span className={r.totalDebtAfn - r.totalPaidAfn > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
          {formatNumber(r.totalDebtAfn - r.totalPaidAfn, locale)}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">{t('reports.invoiceStatus')}</h2>
      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        onRowClick={(row) => navigate(`/invoices/${row.id}`)}
      />
    </div>
  )
}
