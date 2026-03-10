import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import DataTable, { type Column } from '../../components/shared/DataTable'
import { formatNumber } from '../../utils/formatting'
import api from '../../lib/axios'

interface CustomerBalance {
  customer: { id: string; name: string }
  balanceAfn: number
  balanceUsd: number
  balanceCommodity: number
}

export default function CustomerBalanceReport() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const locale = i18n.language
  const [rows, setRows] = useState<CustomerBalance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/reports/customer-balances').then((r) => setRows(r.data)).finally(() => setLoading(false))
  }, [])

  const columns: Column<CustomerBalance>[] = [
    { key: 'customer', label: t('accounts.name'), render: (r) => r.customer.name },
    {
      key: 'balanceAfn',
      label: t('reports.balanceAfn'),
      render: (r) => (
        <span className={r.balanceAfn > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
          {formatNumber(r.balanceAfn, locale)}
        </span>
      ),
    },
    {
      key: 'balanceUsd',
      label: t('reports.balanceUsd'),
      render: (r) => (
        <span className={r.balanceUsd > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
          {formatNumber(r.balanceUsd, locale)}
        </span>
      ),
    },
    {
      key: 'balanceCommodity',
      label: t('reports.balanceCommodity'),
      render: (r) => formatNumber(r.balanceCommodity, locale),
    },
    {
      key: 'actions',
      label: t('app.actions'),
      render: (r) => (
        <button
          className="text-xs text-primary-600 hover:underline"
          onClick={(e) => { e.stopPropagation(); navigate(`/payments/new?customerId=${r.customer.id}`) }}
        >
          {t('payments.new')}
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">{t('reports.customerBalance')}</h2>
      <DataTable columns={columns} rows={rows} loading={loading} />
    </div>
  )
}
