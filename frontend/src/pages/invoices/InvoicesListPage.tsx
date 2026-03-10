import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import DataTable, { type Column } from '../../components/shared/DataTable'
import StatusBadge from '../../components/shared/StatusBadge'
import { formatDate, formatNumber } from '../../utils/formatting'
import api from '../../lib/axios'

interface Invoice {
  id: string
  invoiceNumber: string
  customer: { name: string }
  contract: { code: string; calculationType: string }
  status: string
  issueDate: string
  _count: { tankers: number }
}

export default function InvoicesListPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const locale = i18n.language

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  const fetchInvoices = () => {
    const params = statusFilter ? `?status=${statusFilter}` : ''
    api.get(`/invoices${params}`)
      .then((r) => setInvoices(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchInvoices() }, [statusFilter])

  const handleNew = async () => {
    // Navigate to new invoice form — the form will call POST /invoices
    navigate('/invoices/new')
  }

  const columns: Column<Invoice>[] = [
    { key: 'invoiceNumber', label: t('invoices.invoiceNumber') },
    { key: 'customer', label: t('invoices.customer'), render: (r) => r.customer.name },
    { key: 'contract', label: t('invoices.contract'), render: (r) => r.contract.code },
    {
      key: 'calculationType',
      label: t('contracts.calculationType'),
      render: (r) => t(`contracts.calculationTypes.${r.contract.calculationType}`),
    },
    {
      key: 'issueDate',
      label: t('invoices.issueDate'),
      render: (r) => formatDate(r.issueDate, locale),
    },
    {
      key: 'status',
      label: t('invoices.status'),
      render: (r) => (
        <StatusBadge status={r.status} label={t(`invoices.statuses.${r.status}`)} />
      ),
    },
    {
      key: 'tankers',
      label: t('tankers.title'),
      render: (r) => formatNumber(r._count.tankers, locale, 0),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{t('invoices.title')}</h1>
        <button
          onClick={handleNew}
          className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          + {t('invoices.new')}
        </button>
      </div>

      <div className="flex gap-3">
        {['', 'draft', 'final', 'canceled'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
              statusFilter === s
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {s ? t(`invoices.statuses.${s}`) : t('app.all')}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={invoices}
        loading={loading}
        onRowClick={(row) => navigate(`/invoices/${row.id}`)}
      />
    </div>
  )
}
