import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import DataTable, { type Column } from '../../components/shared/DataTable'
import AccountDrawer from '../accounts/AccountDrawer'
import { formatNumber } from '../../utils/formatting'
import api from '../../lib/axios'

interface ProducerBalance {
  id: string
  producer: { id: string; name: string }
  totalReceivableAfn: number
  totalReceivableUsd: number
  paidAfn: number
  paidUsd: number
  balanceAfn: number
  balanceUsd: number
}

export default function ProducerBalanceReport() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const [rows, setRows] = useState<ProducerBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedProducerId, setSelectedProducerId] = useState<string | null>(null)

  useEffect(() => {
    api
      .get('/reports/producer-balances')
      .then((r) =>
        setRows(
          r.data.map((item: Omit<ProducerBalance, 'id'>) => ({ ...item, id: item.producer.id })),
        ),
      )
      .finally(() => setLoading(false))
  }, [])

  const q = search.trim().toLowerCase()
  const filtered = rows.filter((r) => !q || r.producer.name.toLowerCase().includes(q))

  const columns: Column<ProducerBalance>[] = [
    { key: 'producer', label: t('accounts.name'), render: (r) => r.producer.name },
    {
      key: 'totalReceivableAfn',
      label: t('reports.totalReceivable') + ' (' + t('currency.afn') + ')',
      render: (r) => formatNumber(r.totalReceivableAfn, locale),
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
        <span className={Number(r.balanceAfn) > 0 ? 'text-amber-600 font-bold' : 'text-green-600'}>
          {formatNumber(r.balanceAfn, locale)}
        </span>
      ),
    },
    {
      key: 'totalReceivableUsd',
      label: t('reports.totalReceivable') + ' (' + t('currency.usd') + ')',
      render: (r) => formatNumber(r.totalReceivableUsd, locale),
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
        <span className={Number(r.balanceUsd) > 0 ? 'text-amber-600 font-bold' : 'text-green-600'}>
          {formatNumber(r.balanceUsd, locale)}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">
          {t('reports.producerBalance')}
        </h2>
        <div className="relative w-72">
          <svg
            className="absolute inset-s-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
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

      <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
        <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z" />
        </svg>
        <span>{t('reports.producerBalanceNote')}</span>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        onRowClick={(r) => setSelectedProducerId(r.producer.id)}
        totalCount={rows.length}
        label={t('accounts.types.producer')}
      />

      <AccountDrawer accountId={selectedProducerId} onClose={() => setSelectedProducerId(null)} />
    </div>
  )
}
