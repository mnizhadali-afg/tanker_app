import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../lib/axios'
import TankerGrid from '../../components/TankerGrid/TankerGrid'
import InvoicePrintWrapper from '../../components/InvoicePrint/InvoicePrintWrapper'
import InvoiceStatusBar from './components/InvoiceStatusBar'
import FinalizeDialog from './components/FinalizeDialog'
import CancelDialog from './components/CancelDialog'
import DeleteDialog from './components/DeleteDialog'
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
    notes?: string
  }
  tankers: TankerRow[]
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const isRtl = i18n.language === 'fa'

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showFinalize, setShowFinalize] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [noteCollapsed, setNoteCollapsed] = useState(false)
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

  const handleDelete = async () => {
    if (!invoice) return
    setActionLoading(true)
    try {
      await api.delete(`/invoices/${invoice.id}`)
      navigate('/invoices')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500 dark:text-slate-400">{t('app.loading')}</div>
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
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/invoices')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 transition-colors"
        >
          {isRtl ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          )}
          {t('app.back')}
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100 flex-1">
          {invoice.customer.name} — {invoice.contract.code}
        </h1>
      </div>

      {/* Status bar — with print embedded as icon button */}
      <InvoiceStatusBar
        status={invoice.status}
        invoiceNumber={invoice.invoiceNumber}
        issueDate={invoice.issueDate}
        printNode={
          <InvoicePrintWrapper
            invoice={invoiceForPrint as Parameters<typeof InvoicePrintWrapper>[0]['invoice']}
            renderTrigger={(onPrint) => (
              <button
                onClick={onPrint}
                title={t('app.print')}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent text-gray-400 dark:text-slate-500 hover:border-gray-200 hover:text-gray-600 hover:bg-gray-50 dark:hover:border-slate-600 dark:hover:text-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
              </button>
            )}
          />
        }
        onFinalize={invoice.status === 'draft' ? () => setShowFinalize(true) : undefined}
        onCancel={invoice.status === 'draft' ? () => setShowCancel(true) : undefined}
        onDelete={invoice.status !== 'final' ? () => setShowDelete(true) : undefined}
      />

      {/* Contract memo — sticky note style, shown only when contract has notes */}
      {invoice.contract.notes && (
        <div className="relative rounded-lg overflow-hidden shadow-sm"
             style={{ background: 'linear-gradient(135deg, #fefce8 85%, #fde68a 85%)' }}>

          {/* Fold corner visual */}
          <div className="absolute top-0 inset-e-0 w-6 h-6 pointer-events-none"
               style={{ background: 'linear-gradient(225deg, #fbbf24 50%, transparent 50%)' }} />

          {/* Pin icon */}
          <div className="absolute top-2 inset-e-8 text-amber-500 select-none text-base leading-none">📌</div>

          {/* Content */}
          <div className="px-4 pt-3 pb-3">
            {/* Header row */}
            <button
              onClick={() => setNoteCollapsed((c) => !c)}
              className="flex items-center gap-2 w-full text-start group mb-1"
            >
              <svg className="w-3.5 h-3.5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs font-bold text-amber-800 uppercase tracking-widest">
                Contract Memo
              </span>
              <span className="text-xs text-amber-500 ms-1 font-normal normal-case tracking-normal">
                — {invoice.contract.code}
              </span>
              <svg
                className={`w-3.5 h-3.5 text-amber-500 ms-auto transition-transform duration-200 ${noteCollapsed ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Animated body */}
            {!noteCollapsed && (
              <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap italic ms-5 border-t border-amber-200 pt-2 mt-1">
                {invoice.contract.notes}
              </p>
            )}
          </div>
        </div>
      )}

      {/* TankerGrid */}
      <TankerGrid
        invoiceId={invoice.id}
        invoiceNumber={invoice.invoiceNumber}
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
      {showDelete && (
        <DeleteDialog
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          loading={actionLoading}
        />
      )}
    </div>
  )
}
