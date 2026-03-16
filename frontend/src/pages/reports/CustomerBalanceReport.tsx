import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import DataTable, { type Column } from '../../components/shared/DataTable'
import AccountDrawer from '../accounts/AccountDrawer'
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
  const [search, setSearch] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)

  useEffect(() => {
    api.get('/reports/customer-balances')
      .then((r) => setRows(r.data.map((item: Omit<CustomerBalance, 'id'>) => ({ ...item, id: item.customer.id }))))
      .finally(() => setLoading(false))
  }, [])

  const q = search.trim().toLowerCase()
  const filtered = rows.filter((r) => !q || r.customer.name.toLowerCase().includes(q))

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
          className="text-xs text-primary-600 hover:underline cursor-pointer"
          onClick={(e) => { e.stopPropagation(); navigate(`/payments/new?customerId=${r.customer.id}`) }}
        >
          {t('payments.new')}
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">{t('reports.customerBalance')}</h2>
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
        onRowClick={(r) => setSelectedCustomerId(r.customer.id)}
        totalCount={rows.length}
        label={t('accounts.types.customer')}
      />
      <AccountDrawer accountId={selectedCustomerId} onClose={() => setSelectedCustomerId(null)} />
    </div>
  )
}
