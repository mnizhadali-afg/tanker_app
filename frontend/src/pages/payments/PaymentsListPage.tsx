import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import DataTable, { type Column } from '../../components/shared/DataTable'
import { formatDate, formatNumber } from '../../utils/formatting'
import api from '../../lib/axios'

interface Payment {
  id: string
  type: string
  linkedLevel: string
  payer?: { name: string }
  payee?: { name: string }
  contract?: { code: string }
  invoice?: { invoiceNumber: string }
  amountAfn?: number
  amountUsd?: number
  transactionDate: string
  notes?: string
}

export default function PaymentsListPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const locale = i18n.language
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/payments').then((r) => setPayments(r.data)).finally(() => setLoading(false))
  }, [])

  const columns: Column<Payment>[] = [
    { key: 'type', label: t('payments.type'), render: (r) => t(`payments.types.${r.type}`) },
    { key: 'linkedLevel', label: t('payments.level'), render: (r) => t(`payments.levels.${r.linkedLevel}`) },
    { key: 'payer', label: t('payments.payer'), render: (r) => r.payer?.name ?? '—' },
    { key: 'payee', label: t('payments.payee'), render: (r) => r.payee?.name ?? '—' },
    { key: 'contract', label: t('contracts.code'), render: (r) => r.contract?.code ?? '—' },
    { key: 'invoice', label: t('invoices.invoiceNumber'), render: (r) => r.invoice?.invoiceNumber ?? '—' },
    { key: 'amountAfn', label: t('payments.amountAfn'), render: (r) => r.amountAfn ? formatNumber(r.amountAfn, locale) : '—' },
    { key: 'amountUsd', label: t('payments.amountUsd'), render: (r) => r.amountUsd ? formatNumber(r.amountUsd, locale) : '—' },
    { key: 'transactionDate', label: t('payments.transactionDate'), render: (r) => formatDate(r.transactionDate, locale) },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{t('payments.title')}</h1>
        <button onClick={() => navigate('/payments/new')} className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          + {t('payments.new')}
        </button>
      </div>
      <DataTable columns={columns} rows={payments} loading={loading} />
    </div>
  )
}
