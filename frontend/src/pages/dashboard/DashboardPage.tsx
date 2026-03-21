import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatNumber, toPersianDigits } from '../../utils/formatting'
import StatusBadge from '../../components/shared/StatusBadge'
import api from '../../lib/axios'

interface InvoiceItem {
  id: string
  invoiceNumber: string
  customer: { name: string }
  status: string
  issueDate: string
}

interface PaymentItem {
  id: string
  type: string
  payer?: { name: string }
  payee?: { name: string }
  amountAfn?: number
  amountUsd?: number
  transactionDate: string
}

interface DashboardData {
  totalBalanceAfn: number
  totalBalanceUsd: number
  totalProducerPayableAfn: number
  totalProducerPayableUsd: number
  invoiceCounts: { draft: number; final: number; canceled: number }
  topCustomers: Array<{ id: string; name: string; balanceAfn: number; balanceUsd: number }>
  topProducers: Array<{ id: string; name: string; balanceAfn: number; balanceUsd: number }>
  recentInvoices: InvoiceItem[]
  draftInvoices: InvoiceItem[]
  recentPayments: PaymentItem[]
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden ${className}`}>
      {children}
    </div>
  )
}

function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
      <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">{title}</span>
      {action}
    </div>
  )
}

function EmptyRow({ label }: { label: string }) {
  return <p className="px-4 py-6 text-xs text-gray-400 dark:text-slate-500 text-center">{label}</p>
}

function ViewAllBtn({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation()
  return (
    <button onClick={onClick} className="text-xs text-primary-600 hover:text-primary-700 cursor-pointer">
      {t('dashboard.viewAll')}
    </button>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const locale = i18n.language
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    api.get('/reports/dashboard').then((r) => setData(r.data)).catch(() => {})
  }, [])

  // Skeleton
  if (!data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse bg-gray-100 dark:bg-slate-700 rounded-xl" />
          ))}
        </div>
        <div className="h-14 animate-pulse bg-gray-100 dark:bg-slate-700 rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-52 animate-pulse bg-gray-100 dark:bg-slate-700 rounded-xl" />
          <div className="h-52 animate-pulse bg-gray-100 dark:bg-slate-700 rounded-xl" />
        </div>
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-3 h-64 animate-pulse bg-gray-100 dark:bg-slate-700 rounded-xl" />
          <div className="h-64 animate-pulse bg-gray-100 dark:bg-slate-700 rounded-xl" />
          <div className="h-64 animate-pulse bg-gray-100 dark:bg-slate-700 rounded-xl" />
        </div>
      </div>
    )
  }

  const maxCustomerAfn = Math.max(...data.topCustomers.map((c) => c.balanceAfn), 1)
  const maxProducerAfn = Math.max(...data.topProducers.map((p) => p.balanceAfn), 1)

  const fmtCount = (n: number) => locale === 'fa' ? toPersianDigits(n) : String(n)

  const QUICK_ACTIONS = [
    {
      label: t('invoices.new'),
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />,
      onClick: () => navigate('/invoices'),
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: t('payments.new'),
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />,
      onClick: () => navigate('/payments'),
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      label: t('contracts.new'),
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />,
      onClick: () => navigate('/contracts'),
      color: 'text-violet-500',
      bg: 'bg-violet-50 dark:bg-violet-900/20',
    },
    {
      label: t('nav.reports'),
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />,
      onClick: () => navigate('/reports'),
      color: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ]

  return (
    <div className="space-y-4">

      {/* ── Row 1: Four stat cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Customer AFN */}
        <Card>
          <div className="p-4 border-s-4 border-rose-400 dark:border-rose-500">
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">{t('accounts.types.customer')} — {t('currency.afn')}</p>
            <p className={`text-2xl font-bold tabular-nums ${data.totalBalanceAfn > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-700 dark:text-slate-300'}`}>
              {formatNumber(data.totalBalanceAfn, locale)}
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{t('reports.customerBalance')}</p>
          </div>
        </Card>

        {/* Customer USD */}
        <Card>
          <div className="p-4 border-s-4 border-rose-300 dark:border-rose-600">
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">{t('accounts.types.customer')} — {t('currency.usd')}</p>
            <p className={`text-2xl font-bold tabular-nums ${data.totalBalanceUsd > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-700 dark:text-slate-300'}`}>
              {formatNumber(data.totalBalanceUsd, locale)}
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{t('reports.customerBalance')}</p>
          </div>
        </Card>

        {/* Producer AFN */}
        <Card>
          <div className="p-4 border-s-4 border-amber-400 dark:border-amber-500">
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">{t('accounts.types.producer')} — {t('currency.afn')}</p>
            <p className={`text-2xl font-bold tabular-nums ${data.totalProducerPayableAfn > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-700 dark:text-slate-300'}`}>
              {formatNumber(data.totalProducerPayableAfn, locale)}
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{t('dashboard.producerPayable')}</p>
          </div>
        </Card>

        {/* Producer USD */}
        <Card>
          <div className="p-4 border-s-4 border-amber-300 dark:border-amber-600">
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">{t('accounts.types.producer')} — {t('currency.usd')}</p>
            <p className={`text-2xl font-bold tabular-nums ${data.totalProducerPayableUsd > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-700 dark:text-slate-300'}`}>
              {formatNumber(data.totalProducerPayableUsd, locale)}
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{t('dashboard.producerPayable')}</p>
          </div>
        </Card>
      </div>

      {/* ── Row 2: Invoice status bar ──────────────────────────────────────── */}
      <Card>
        <div className="px-5 py-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 me-2">{t('nav.invoices')}:</span>

          <button
            onClick={() => navigate('/invoices')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-800/30 transition-colors cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
            <span className="text-xs text-yellow-700 dark:text-yellow-400">{t('invoices.statuses.draft')}</span>
            <span className="text-xs font-bold text-yellow-800 dark:text-yellow-300 tabular-nums">{fmtCount(data.invoiceCounts.draft)}</span>
          </button>

          <button
            onClick={() => navigate('/invoices')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
            <span className="text-xs text-green-700 dark:text-green-400">{t('invoices.statuses.final')}</span>
            <span className="text-xs font-bold text-green-800 dark:text-green-300 tabular-nums">{fmtCount(data.invoiceCounts.final)}</span>
          </button>

          <button
            onClick={() => navigate('/invoices')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-800/30 transition-colors cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
            <span className="text-xs text-red-700 dark:text-red-400">{t('invoices.statuses.canceled')}</span>
            <span className="text-xs font-bold text-red-800 dark:text-red-300 tabular-nums">{fmtCount(data.invoiceCounts.canceled)}</span>
          </button>
        </div>
      </Card>

      {/* ── Row 3: Top customers + Top producers ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title={t('dashboard.topCustomers')} action={<ViewAllBtn onClick={() => navigate('/reports')} />} />
          {data.topCustomers.length === 0
            ? <EmptyRow label={t('dashboard.noData')} />
            : data.topCustomers.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 dark:border-slate-700/50 last:border-0">
                <span className="text-xs text-gray-300 dark:text-slate-600 w-4 shrink-0 font-mono">{fmtCount(i + 1)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 dark:text-slate-300 truncate">{c.name}</p>
                  <div className="mt-1 h-1 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-300 dark:bg-rose-600 rounded-full" style={{ width: (c.balanceAfn / maxCustomerAfn * 100) + '%' }} />
                  </div>
                </div>
                <span className="text-xs font-semibold text-gray-800 dark:text-slate-200 whitespace-nowrap tabular-nums">
                  {formatNumber(c.balanceAfn, locale)}
                </span>
              </div>
            ))
          }
        </Card>

        <Card>
          <CardHeader title={t('dashboard.topProducers')} action={<ViewAllBtn onClick={() => navigate('/reports')} />} />
          {data.topProducers.length === 0
            ? <EmptyRow label={t('dashboard.noData')} />
            : data.topProducers.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 dark:border-slate-700/50 last:border-0">
                <span className="text-xs text-gray-300 dark:text-slate-600 w-4 shrink-0 font-mono">{fmtCount(i + 1)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 dark:text-slate-300 truncate">{p.name}</p>
                  <div className="mt-1 h-1 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-300 dark:bg-amber-600 rounded-full" style={{ width: (p.balanceAfn / maxProducerAfn * 100) + '%' }} />
                  </div>
                </div>
                <span className="text-xs font-semibold text-gray-800 dark:text-slate-200 whitespace-nowrap tabular-nums">
                  {formatNumber(p.balanceAfn, locale)}
                </span>
              </div>
            ))
          }
        </Card>
      </div>

      {/* ── Row 4: Recent invoices | Draft invoices | Quick actions ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Recent invoices — 3 cols */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader title={t('dashboard.recentInvoices')} action={<ViewAllBtn onClick={() => navigate('/invoices')} />} />
            {data.recentInvoices.length === 0
              ? <EmptyRow label={t('dashboard.noData')} />
              : data.recentInvoices.map((inv) => (
                <button
                  key={inv.id}
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 dark:border-slate-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700/50 text-start transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 dark:text-slate-200">{inv.invoiceNumber}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{inv.customer.name}</p>
                  </div>
                  <StatusBadge status={inv.status} label={t(`invoices.statuses.${inv.status}`)} />
                </button>
              ))
            }
          </Card>
        </div>

        {/* Draft invoices — 1 col */}
        <Card className="h-full">
          <CardHeader
            title={`${t('invoices.statuses.draft')} (${fmtCount(data.invoiceCounts.draft)})`}
            action={data.draftInvoices.length > 0 ? <ViewAllBtn onClick={() => navigate('/invoices')} /> : undefined}
          />
          {data.draftInvoices.length === 0
            ? <EmptyRow label={t('dashboard.noData')} />
            : data.draftInvoices.map((inv) => (
              <button
                key={inv.id}
                onClick={() => navigate(`/invoices/${inv.id}`)}
                className="w-full flex flex-col items-start px-4 py-2.5 border-b border-gray-50 dark:border-slate-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <p className="text-xs font-medium text-gray-800 dark:text-slate-200">{inv.invoiceNumber}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 truncate w-full text-start">{inv.customer.name}</p>
              </button>
            ))
          }
        </Card>

        {/* Quick actions — 1 col */}
        <Card className="h-full">
          <CardHeader title={t('dashboard.quickActions')} />
          <div className="p-3 space-y-2">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors text-start cursor-pointer group"
              >
                <span className={`w-8 h-8 rounded-lg ${action.bg} flex items-center justify-center shrink-0`}>
                  <svg className={`w-4 h-4 ${action.color} shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    {action.icon}
                  </svg>
                </span>
                <span className="text-sm text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-slate-100 transition-colors">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Row 5: Recent payments ─────────────────────────────────────────── */}
      {data.recentPayments.length > 0 && (
        <Card>
          <CardHeader title={t('dashboard.recentPayments')} action={<ViewAllBtn onClick={() => navigate('/payments')} />} />
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-gray-50 dark:divide-slate-700 rtl:divide-x-reverse">
            {data.recentPayments.map((pmt) => (
              <div key={pmt.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-500 dark:text-slate-400">{t(`payments.types.${pmt.type}`)}</span>
                  <span className="text-xs font-semibold text-gray-800 dark:text-slate-200 tabular-nums">
                    {pmt.amountAfn ? formatNumber(pmt.amountAfn, locale) : pmt.amountUsd ? formatNumber(pmt.amountUsd, locale) : '—'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-slate-500 truncate mt-0.5">{pmt.payer?.name ?? pmt.payee?.name ?? '—'}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

    </div>
  )
}
