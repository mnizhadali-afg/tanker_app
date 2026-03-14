import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import DataTable, { type Column } from '../../components/shared/DataTable'
import { formatNumber } from '../../utils/formatting'
import api from '../../lib/axios'

interface CustomerBalance {
  id: string
  customer: { id: string; name: string }
  totalDebtAfn: number
  totalDebtUsd: number
  paidAfn: number
  paidUsd: number
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
    api.get('/reports/customer-balances')
      .then((r) => setRows(r.data.map((item: Omit<CustomerBalance, 'id'>) => ({ ...item, id: item.customer.id }))))
      .finally(() => setLoading(false))
  }, [])

  const columns: Column<CustomerBalance>[] = [
    { key: 'customer', label: t('accounts.name'), render: (r) => r.customer.name },
    {
      key: 'totalDebtAfn',
      label: t('reports.totalDebt') + ' (' + t('currency.afn') + ')',
      render: (r) => formatNumber(r.totalDebtAfn, locale),
    },
    {
      key: 'paidAfn',
      label: t('reports.totalPaid') + ' (' + t('currency.afn') + ')',
      render: (r) => formatNumber(r.paidAfn, locale),
    },
    {
      key: 'balanceAfn',
      label: t('reports.balanceAfn'),
      render: (r) => (
        <span className={Number(r.balanceAfn) > 0 ? 'text-red-600 font-bold' : 'text-green-600'}>
          {formatNumber(r.balanceAfn, locale)}
        </span>
      ),
    },
    {
      key: 'totalDebtUsd',
      label: t('reports.totalDebt') + ' (' + t('currency.usd') + ')',
      render: (r) => formatNumber(r.totalDebtUsd, locale),
    },
    {
      key: 'paidUsd',
      label: t('reports.totalPaid') + ' (' + t('currency.usd') + ')',
      render: (r) => formatNumber(r.paidUsd, locale),
    },
    {
      key: 'balanceUsd',
      label: t('reports.balanceUsd'),
      render: (r) => (
        <span className={Number(r.balanceUsd) > 0 ? 'text-red-600 font-bold' : 'text-green-600'}>
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
