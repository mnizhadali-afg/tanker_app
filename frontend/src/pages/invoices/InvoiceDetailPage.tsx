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
  const [memoText, setMemoText] = useState<string>('')
  const [memoEditing, setMemoEditing] = useState(false)
  const [memoSaving, setMemoSaving] = useState(false)
  // Live tanker rows kept in sync with TankerGrid state for print
  const [liveRows, setLiveRows] = useState<TankerRow[]>([])

  useEffect(() => {
    if (!id) return
    api.get(`/invoices/${id}`)
      .then((r) => {
        setInvoice(r.data)
        setMemoText(r.data.contract.notes ?? '')
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

  const handleMemoSave = async () => {
    if (!invoice) return
    setMemoSaving(true)
    try {
      await api.patch(`/contracts/${invoice.contract.id}`, { notes: memoText })
      setInvoice((prev) => prev ? { ...prev, contract: { ...prev.contract, notes: memoText } } : prev)
      setMemoEditing(false)
    } finally {
      setMemoSaving(false)
    }
  }

  const handleMemoCancel = () => {
    setMemoText(invoice.contract.notes ?? '')
    setMemoEditing(false)
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

      {/* Contract memo — inline editable, saves to contract */}
      <div className="border border-dashed border-gray-200 dark:border-slate-600 rounded-lg px-4 py-3 group">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide">
            {t('invoices.contractMemo')}
          </span>
          <span className="text-xs text-gray-300 dark:text-slate-600">·</span>
          <span className="text-xs text-gray-400 dark:text-slate-500">{invoice.contract.code}</span>
          {!memoEditing && (
            <button
              onClick={() => setMemoEditing(true)}
              className="ms-auto opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1 cursor-pointer"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
              </svg>
              {t('app.edit')}
            </button>
          )}
        </div>

        {memoEditing ? (
          <div className="space-y-2">
            <textarea
              autoFocus
              value={memoText}
              onChange={(e) => setMemoText(e.target.value)}
              rows={3}
              className="w-full text-sm text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder={t('invoices.contractMemoPlaceholder')}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleMemoCancel}
                className="text-xs px-3 py-1.5 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
              >
                {t('app.cancel')}
              </button>
              <button
                onClick={handleMemoSave}
                disabled={memoSaving}
                className="text-xs px-3 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 cursor-pointer"
              >
                {memoSaving ? t('app.saving') : t('app.save')}
              </button>
            </div>
          </div>
        ) : (
          <p
            onClick={() => setMemoEditing(true)}
            className={`text-sm leading-relaxed whitespace-pre-wrap cursor-text ${memoText ? 'text-gray-600 dark:text-slate-300' : 'text-gray-300 dark:text-slate-600 italic'}`}
          >
            {memoText || t('invoices.contractMemoPlaceholder')}
          </p>
        )}
      </div>

      {/* TankerGrid */}
      <TankerGrid
        invoiceId={invoice.id}
        invoiceNumber={invoice.invoiceNumber}
        customerName={invoice.customer.name}
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
