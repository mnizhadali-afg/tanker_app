import { useState, useEffect, useRef } from 'react'
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

function FilterDropdown({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selected = options.find((o) => o.value === value)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
      >
        <span>{t('app.filter')}</span>
        {value !== 'all' && (
          <span className="bg-primary-100 text-primary-700 text-xs px-1.5 py-0.5 rounded-full">
            {selected?.label}
          </span>
        )}
        <svg
          className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-20 inset-e-0 mt-1 w-36 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg py-1">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full text-start px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${
                value === opt.value ? 'text-primary-600 font-medium' : 'text-gray-700 dark:text-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const locale = i18n.language
  const [data, setData] = useState<DashboardData | null>(null)
  const [invoiceFilter, setInvoiceFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')

  useEffect(() => {
    api.get('/reports/dashboard').then((r) => setData(r.data)).catch(() => {})
  }, [])

  const invoiceOptions = [
    { value: 'all', label: t('app.all') },
    { value: 'draft', label: t('invoices.statuses.draft') },
    { value: 'final', label: t('invoices.statuses.final') },
    { value: 'canceled', label: t('invoices.statuses.canceled') },
  ]

  const paymentOptions = [
    { value: 'all', label: t('app.all') },
    { value: 'payment_in', label: t('payments.types.payment_in') },
    { value: 'payment_out', label: t('payments.types.payment_out') },
    { value: 'exchange', label: t('payments.types.exchange') },
  ]

  const filteredInvoices = data?.recentInvoices.filter(
    (inv) => invoiceFilter === 'all' || inv.status === invoiceFilter
  ) ?? []

  const filteredPayments = data?.recentPayments.filter(
    (pmt) => paymentFilter === 'all' || pmt.type === paymentFilter
  ) ?? []

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">{t('nav.dashboard')}</h1>

      {/* Balance summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5">
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">{t('reports.balanceAfn')}</p>
          <p className={`text-2xl font-bold ${data && data.totalBalanceAfn > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {data ? formatNumber(data.totalBalanceAfn, locale) : '—'} <span className="text-sm font-normal text-gray-500 dark:text-slate-400">{t('currency.afn')}</span>
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5">
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">{t('reports.balanceUsd')}</p>
          <p className={`text-2xl font-bold ${data && data.totalBalanceUsd > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {data ? formatNumber(data.totalBalanceUsd, locale) : '—'} <span className="text-sm font-normal text-gray-500 dark:text-slate-400">{t('currency.usd')}</span>
          </p>
        </div>
      </div>

      {/* Recent invoices */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-slate-700">
          <h2 className="font-semibold text-gray-800 dark:text-slate-200">{t('invoices.title')}</h2>
          <FilterDropdown options={invoiceOptions} value={invoiceFilter} onChange={setInvoiceFilter} />
        </div>
        <div className="divide-y divide-gray-50 dark:divide-slate-700">
          {filteredInvoices.length === 0 && (
            <p className="px-5 py-4 text-sm text-gray-400 dark:text-slate-500 text-center">—</p>
          )}
          {filteredInvoices.map((inv) => (
            <button
              key={inv.id}
              onClick={() => navigate(`/invoices/${inv.id}`)}
              className="w-full flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 text-start transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">{inv.invoiceNumber}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">{inv.customer.name}</p>
              </div>
              <div className="text-xs text-gray-400 dark:text-slate-500">{formatDate(inv.issueDate, locale)}</div>
              <StatusBadge status={inv.status} label={t(`invoices.statuses.${inv.status}`)} />
            </button>
          ))}
        </div>
      </div>

      {/* Recent payments */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-slate-700">
          <h2 className="font-semibold text-gray-800 dark:text-slate-200">{t('payments.title')}</h2>
          <FilterDropdown options={paymentOptions} value={paymentFilter} onChange={setPaymentFilter} />
        </div>
        <div className="divide-y divide-gray-50 dark:divide-slate-700">
          {filteredPayments.length === 0 && (
            <p className="px-5 py-4 text-sm text-gray-400 dark:text-slate-500 text-center">—</p>
          )}
          {filteredPayments.map((pmt) => (
            <div key={pmt.id} className="flex items-center gap-4 px-5 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{t(`payments.types.${pmt.type}`)}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">{pmt.customer?.name ?? '—'}</p>
              </div>
              <div className="text-sm text-gray-700 dark:text-slate-300">
                {pmt.amountAfn ? formatNumber(pmt.amountAfn, locale) + ' ' + t('currency.afn') : ''}
                {pmt.amountUsd ? formatNumber(pmt.amountUsd, locale) + ' ' + t('currency.usd') : ''}
              </div>
              <div className="text-xs text-gray-400 dark:text-slate-500">{formatDate(pmt.transactionDate, locale)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
