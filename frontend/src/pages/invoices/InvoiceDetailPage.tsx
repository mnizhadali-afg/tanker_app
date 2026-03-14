import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../lib/axios'
import TankerGrid from '../../components/TankerGrid/TankerGrid'
import InvoicePrintWrapper from '../../components/InvoicePrint/InvoicePrintWrapper'
import InvoiceStatusBar from './components/InvoiceStatusBar'
import FinalizeDialog from './components/FinalizeDialog'
import CancelDialog from './components/CancelDialog'
import type { TankerRow } from '../../components/TankerGrid/useTankerGrid'
import type { CalculationType } from '@tanker/shared'

interface InvoiceDetail {
  id: string
  invoiceNumber: string
  status: string
  issueDate: string
  notes?: string
  customer: { id: string; name: string }
  contract: {
    id: string
    code: string
    calculationType: string
    defaultRatePerTonAfn?: number
    defaultRatePerTonUsd?: number
    defaultExchangeRate?: number
    otherDefaultCosts?: Record<string, number>
  }
  tankers: TankerRow[]
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showFinalize, setShowFinalize] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  // Live tanker rows kept in sync with TankerGrid state for print
  const [liveRows, setLiveRows] = useState<TankerRow[]>([])

  useEffect(() => {
    if (!id) return
    api.get(`/invoices/${id}`)
      .then((r) => {
        setInvoice(r.data)
        setLiveRows(r.data.tankers ?? [])
      })
      .catch(() => setError(t('errors.notFound')))
      .finally(() => setLoading(false))
  }, [id, t])

  const handleRowsChange = useCallback((rows: TankerRow[]) => {
    setLiveRows(rows)
  }, [])

  const handleFinalize = async () => {
    if (!invoice) return
    setActionLoading(true)
    try {
      const { data } = await api.patch(`/invoices/${invoice.id}/finalize`)
      setInvoice((prev) => prev ? { ...prev, status: data.status } : prev)
      setShowFinalize(false)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!invoice) return
    setActionLoading(true)
    try {
      const { data } = await api.patch(`/invoices/${invoice.id}/cancel`)
      setInvoice((prev) => prev ? { ...prev, status: data.status } : prev)
      setShowCancel(false)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">{t('app.loading')}</div>
  }

  if (error || !invoice) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">{error || t('errors.notFound')}</p>
        <button onClick={() => navigate('/invoices')} className="mt-4 text-sm text-primary-600 hover:underline">
          {t('app.back')}
        </button>
      </div>
    )
  }

  const contractType = invoice.contract.calculationType as CalculationType
  const contractDefaults: Partial<TankerRow> = {
    contractId: invoice.contract.id,
    ratePerTonAfn: invoice.contract.defaultRatePerTonAfn,
    ratePerTonUsd: invoice.contract.defaultRatePerTonUsd,
    exchangeRate: invoice.contract.defaultExchangeRate,
    ...(invoice.contract.otherDefaultCosts ?? {}),
  }

  // Build the invoice object for print, using live rows so print reflects current state
  const invoiceForPrint = { ...invoice, tankers: liveRows }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/invoices')} className="text-sm text-gray-500 hover:text-gray-700">
          ← {t('app.back')}
        </button>
        <h1 className="text-xl font-bold text-gray-900 flex-1">
          {invoice.customer.name} — {invoice.contract.code}
        </h1>
        <InvoicePrintWrapper invoice={invoiceForPrint as Parameters<typeof InvoicePrintWrapper>[0]['invoice']} />
      </div>

      {/* Status bar */}
      <InvoiceStatusBar
        status={invoice.status}
        invoiceNumber={invoice.invoiceNumber}
        issueDate={invoice.issueDate}
        onFinalize={invoice.status === 'draft' ? () => setShowFinalize(true) : undefined}
        onCancel={invoice.status === 'draft' ? () => setShowCancel(true) : undefined}
      />

      {/* Notes */}
      {invoice.notes && (
        <p className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
          {invoice.notes}
        </p>
      )}

      {/* TankerGrid */}
      <TankerGrid
        invoiceId={invoice.id}
        contractType={contractType}
        contractDefaults={contractDefaults}
        initialTankers={invoice.tankers}
        readOnly={invoice.status !== 'draft'}
        onRowsChange={handleRowsChange}
      />

      {/* Dialogs */}
      {showFinalize && (
        <FinalizeDialog
          onConfirm={handleFinalize}
          onCancel={() => setShowFinalize(false)}
          loading={actionLoading}
        />
      )}
      {showCancel && (
        <CancelDialog
          onConfirm={handleCancel}
          onCancel={() => setShowCancel(false)}
          loading={actionLoading}
        />
      )}
    </div>
  )
}
