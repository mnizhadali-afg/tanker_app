import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DataTable, { type Column } from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import Modal from '../../components/shared/Modal';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import InvoiceFormPage from './InvoiceFormPage';
import { formatDate, formatNumber, extractApiError } from '../../utils/formatting';
import api from '../../lib/axios';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: { name: string };
  contract: { code: string; calculationType: string };
  status: string;
  issueDate: string;
  notes?: string;
  _count: { tankers: number };
}

// ── Detail Modal ─────────────────────────────────────────────────────────────
function InvoiceDetailModal({
  invoice,
  locale,
  onClose,
  onOpen,
  onFinalize,
  onCancel,
  onDelete,
}: {
  invoice: Invoice;
  locale: string;
  onClose: () => void;
  onOpen: () => void;
  onFinalize: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'fa';
  const isDraft = invoice.status === 'draft';
  const isCanceled = invoice.status === 'canceled';

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header band ── */}
        <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold font-mono text-gray-900 dark:text-slate-100 tracking-wide">
                {invoice.invoiceNumber}
              </h2>
              <StatusBadge status={invoice.status} label={t(`invoices.statuses.${invoice.status}`)} />
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {invoice.customer.name}
              <span className="mx-1.5 text-gray-300 dark:text-slate-600">·</span>
              {invoice.contract.code}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Info grid ── */}
        <div className="px-5 pb-4 grid grid-cols-3 gap-3 text-sm">
          <div className="bg-gray-50 dark:bg-slate-700/60 rounded-xl px-3 py-2.5">
            <p className="text-[10px] font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">
              {t('contracts.calculationType')}
            </p>
            <p className="font-semibold text-gray-800 dark:text-slate-200 text-xs leading-snug">
              {t(`contracts.calculationTypes.${invoice.contract.calculationType}`)}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-slate-700/60 rounded-xl px-3 py-2.5">
            <p className="text-[10px] font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">
              {t('invoices.issueDate')}
            </p>
            <p className="font-semibold text-gray-800 dark:text-slate-200 text-xs">{formatDate(invoice.issueDate, locale)}</p>
          </div>
          <div className="bg-gray-50 dark:bg-slate-700/60 rounded-xl px-3 py-2.5">
            <p className="text-[10px] font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">
              {t('tankers.title')}
            </p>
            <p className="font-semibold text-gray-800 dark:text-slate-200 text-xs">
              {formatNumber(invoice._count.tankers, locale, 0)}
            </p>
          </div>
        </div>

        {invoice.notes && (
          <div className="px-5 pb-3">
            <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg px-3 py-2">
              {invoice.notes}
            </p>
          </div>
        )}

        {/* ── Lifecycle action strip (draft / canceled only) ── */}
        {(isDraft || isCanceled) && (
          <div className="px-5 pb-3">
            <div className="flex items-center gap-1 bg-gray-50 dark:bg-slate-700/50 rounded-xl p-1">
              {isDraft && (
                <button
                  onClick={onFinalize}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-2 rounded-lg text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {t('invoices.finalize')}
                </button>
              )}
              {isDraft && (
                <>
                  <div className="w-px h-5 bg-gray-200 dark:bg-slate-600 shrink-0" />
                  <button
                    onClick={onCancel}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-2 rounded-lg text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors cursor-pointer"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                    {t('invoices.cancel')}
                  </button>
                </>
              )}
              <div className="w-px h-5 bg-gray-200 dark:bg-slate-600 shrink-0" />
              <button
                onClick={onDelete}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-2 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                </svg>
                {t('app.delete')}
              </button>
            </div>
          </div>
        )}

        {/* ── Primary CTA — full-width open button ── */}
        <div className="px-3 pb-3">
          <button
            onClick={onOpen}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              isDraft
                ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200'
            }`}
          >
            {isDraft ? t('app.edit') : t('app.view')}
            {isRtl ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function InvoicesListPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = i18n.language;

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);

  // Modal / dialog state
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);
  const [finalizeTarget, setFinalizeTarget] = useState<Invoice | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Invoice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchInvoices = () => {
    const params = statusFilter ? `?status=${statusFilter}` : '';
    api
      .get(`/invoices${params}`)
      .then((r) => setInvoices(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  // ── Action handlers ─────────────────────────────────────────────────────────
  const handleFinalize = async () => {
    if (!finalizeTarget) return;
    setActionLoading(true);
    try {
      await api.patch(`/invoices/${finalizeTarget.id}/finalize`);
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === finalizeTarget.id ? { ...inv, status: 'final' } : inv,
        ),
      );
      setFinalizeTarget(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setActionLoading(true);
    try {
      await api.patch(`/invoices/${cancelTarget.id}/cancel`);
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === cancelTarget.id ? { ...inv, status: 'canceled' } : inv,
        ),
      );
      setCancelTarget(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError('');
    setActionLoading(true);
    try {
      await api.delete(`/invoices/${deleteTarget.id}`);
      setInvoices((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: unknown) {
      setDeleteError(t(extractApiError(err)));
    } finally {
      setActionLoading(false);
    }
  };

  // ── Table columns ───────────────────────────────────────────────────────────
  const q = search.trim().toLowerCase();
  const filtered = invoices.filter(
    (inv) =>
      !q ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customer.name.toLowerCase().includes(q) ||
      inv.contract.code.toLowerCase().includes(q),
  );

  const columns: Column<Invoice>[] = [
    { key: 'invoiceNumber', label: t('invoices.invoiceNumber') },
    { key: 'customer', label: t('invoices.customer'), render: (r) => r.customer.name },
    { key: 'contract', label: t('invoices.contract'), render: (r) => r.contract.code },
    {
      key: 'calculationType',
      label: t('contracts.calculationType'),
      render: (r) => t(`contracts.calculationTypes.${r.contract.calculationType}`),
    },
    {
      key: 'issueDate',
      label: t('invoices.issueDate'),
      render: (r) => formatDate(r.issueDate, locale),
    },
    {
      key: 'status',
      label: t('invoices.status'),
      render: (r) => (
        <StatusBadge status={r.status} label={t(`invoices.statuses.${r.status}`)} />
      ),
    },
    {
      key: 'tankers',
      label: t('tankers.title'),
      render: (r) => formatNumber(r._count.tankers, locale, 0),
    },
    {
      key: 'actions',
      label: t('app.actions'),
      render: (r) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {r.status === 'draft' && (
            <button
              onClick={() => navigate(`/invoices/${r.id}`)}
              className="text-xs text-primary-600 hover:text-primary-800 font-medium px-2 py-1 rounded hover:bg-primary-50"
            >
              {t('app.edit')}
            </button>
          )}
          {r.status === 'draft' && (
            <button
              onClick={() => setCancelTarget(r)}
              className="text-xs text-orange-600 hover:text-orange-800 font-medium px-2 py-1 rounded hover:bg-orange-50"
            >
              {t('invoices.cancel')}
            </button>
          )}
          <button
            onClick={() => setDeleteTarget(r)}
            className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50"
          >
            {t('app.delete')}
          </button>
        </div>
      ),
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">{t('invoices.title')}</h1>
        <button
          onClick={() => setShowNewModal(true)}
          className="bg-success-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer"
        >
          + {t('invoices.new')}
        </button>
      </div>

      {deleteError && (
        <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2">
          {deleteError}
        </p>
      )}

      {/* Filters */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          {['', 'draft', 'final', 'canceled'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                statusFilter === s
                  ? 'bg-gray-600 text-white border-gray-600'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              {s ? t(`invoices.statuses.${s}`) : t('app.all')}
            </button>
          ))}
        </div>
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

      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        emptyMessage={t('app.noItems')}
        onRowClick={(row) => setDetailInvoice(row)}
        totalCount={invoices.length}
        label={t('nav.invoices')}
      />

      {/* New Invoice Modal */}
      {showNewModal && (
        <Modal title={t('invoices.new')} onClose={() => setShowNewModal(false)}>
          <InvoiceFormPage
            onSuccess={(id) => { setShowNewModal(false); navigate(`/invoices/${id}`); }}
            onCancel={() => setShowNewModal(false)}
          />
        </Modal>
      )}

      {/* Detail Modal */}
      {detailInvoice && (
        <InvoiceDetailModal
          invoice={detailInvoice}
          locale={locale}
          onClose={() => setDetailInvoice(null)}
          onOpen={() => {
            setDetailInvoice(null);
            navigate(`/invoices/${detailInvoice.id}`);
          }}
          onFinalize={() => {
            setFinalizeTarget(detailInvoice);
            setDetailInvoice(null);
          }}
          onCancel={() => {
            setCancelTarget(detailInvoice);
            setDetailInvoice(null);
          }}
          onDelete={() => {
            setDeleteTarget(detailInvoice);
            setDetailInvoice(null);
          }}
        />
      )}

      {/* Finalize confirmation */}
      {finalizeTarget && (
        <ConfirmDialog
          title={t('invoices.finalize')}
          message={t('invoices.finalizeConfirm')}
          itemName={finalizeTarget.invoiceNumber}
          confirmLabel={t('invoices.finalize')}
          variant="success"
          loading={actionLoading}
          onConfirm={handleFinalize}
          onCancel={() => setFinalizeTarget(null)}
        />
      )}

      {/* Cancel confirmation */}
      {cancelTarget && (
        <ConfirmDialog
          title={t('invoices.cancel')}
          message={t('invoices.cancelConfirm')}
          itemName={cancelTarget.invoiceNumber}
          confirmLabel={t('invoices.cancel')}
          variant="warning"
          loading={actionLoading}
          onConfirm={handleCancel}
          onCancel={() => setCancelTarget(null)}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          title={t('app.delete')}
          message={t('invoices.deleteConfirm')}
          itemName={deleteTarget.invoiceNumber}
          confirmLabel={t('app.delete')}
          variant="danger"
          loading={actionLoading}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
