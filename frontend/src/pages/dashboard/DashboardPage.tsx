import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatDate, formatNumber } from '../../utils/formatting'
import StatusBadge from '../../components/shared/StatusBadge'
import api from '../../lib/axios'

interface DashboardData {
  totalBalanceAfn: number
  totalBalanceUsd: number
  recentInvoices: Array<{
    id: string
    invoiceNumber: string
    customer: { name: string }
    status: string
    issueDate: string
  }>
  recentPayments: Array<{
    id: string
    type: string
    customer?: { name: string }
    amountAfn?: number
    amountUsd?: number
    transactionDate: string
  }>
}

export default function DashboardPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const locale = i18n.language
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    api.get('/reports/dashboard').then((r) => setData(r.data)).catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">{t('nav.dashboard')}</h1>

      {/* Balance summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500 mb-1">{t('reports.balanceAfn')}</p>
          <p className={`text-2xl font-bold ${data && data.totalBalanceAfn > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {data ? formatNumber(data.totalBalanceAfn, locale) : '—'} <span className="text-sm font-normal text-gray-500">{t('currency.afn')}</span>
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500 mb-1">{t('reports.balanceUsd')}</p>
          <p className={`text-2xl font-bold ${data && data.totalBalanceUsd > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {data ? formatNumber(data.totalBalanceUsd, locale) : '—'} <span className="text-sm font-normal text-gray-500">{t('currency.usd')}</span>
          </p>
        </div>
      </div>

      {/* Recent invoices */}
      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">{t('invoices.title')}</h2>
          <button onClick={() => navigate('/invoices')} className="text-sm text-primary-600 hover:underline">
            {t('app.filter')} →
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {data?.recentInvoices.length === 0 && (
            <p className="px-5 py-4 text-sm text-gray-400 text-center">—</p>
          )}
          {data?.recentInvoices.map((inv) => (
            <button
              key={inv.id}
              onClick={() => navigate(`/invoices/${inv.id}`)}
              className="w-full flex items-center gap-4 px-5 py-3 hover:bg-gray-50 text-start transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{inv.invoiceNumber}</p>
                <p className="text-xs text-gray-500">{inv.customer.name}</p>
              </div>
              <div className="text-xs text-gray-400">{formatDate(inv.issueDate, locale)}</div>
              <StatusBadge status={inv.status} label={t(`invoices.statuses.${inv.status}`)} />
            </button>
          ))}
        </div>
      </div>

      {/* Recent payments */}
      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">{t('payments.title')}</h2>
          <button onClick={() => navigate('/payments')} className="text-sm text-primary-600 hover:underline">
            {t('app.filter')} →
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {data?.recentPayments.length === 0 && (
            <p className="px-5 py-4 text-sm text-gray-400 text-center">—</p>
          )}
          {data?.recentPayments.map((pmt) => (
            <div key={pmt.id} className="flex items-center gap-4 px-5 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{t(`payments.types.${pmt.type}`)}</p>
                <p className="text-xs text-gray-500">{pmt.customer?.name ?? '—'}</p>
              </div>
              <div className="text-sm text-gray-700">
                {pmt.amountAfn ? formatNumber(pmt.amountAfn, locale) + ' ' + t('currency.afn') : ''}
                {pmt.amountUsd ? formatNumber(pmt.amountUsd, locale) + ' ' + t('currency.usd') : ''}
              </div>
              <div className="text-xs text-gray-400">{formatDate(pmt.transactionDate, locale)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
