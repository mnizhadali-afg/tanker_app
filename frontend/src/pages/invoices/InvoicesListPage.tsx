import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DataTable, { type Column } from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import Modal from '../../components/shared/Modal';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import InvoiceFormPage from './InvoiceFormPage';
import { formatDate, formatNumber } from '../../utils/formatting';
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
  onEdit,
  onView,
  onPrint,
  onFinalize,
  onCancel,
  onDelete,
}: {
  invoice: Invoice;
  locale: string;
  onClose: () => void;
  onEdit: () => void;
  onView: () => void;
  onPrint: () => void;
  onFinalize: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-gray-900">{invoice.invoiceNumber}</h2>
            <StatusBadge status={invoice.status} label={t(`invoices.statuses.${invoice.status}`)} />
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-3xl leading-none mt-0.5 cursor-pointer w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">{t('invoices.customer')}</p>
            <p className="font-medium text-gray-900">{invoice.customer.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">{t('invoices.contract')}</p>
            <p className="font-medium text-gray-900">{invoice.contract.code}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">{t('contracts.calculationType')}</p>
            <p className="font-medium text-gray-900">
              {t(`contracts.calculationTypes.${invoice.contract.calculationType}`)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">{t('invoices.issueDate')}</p>
            <p className="font-medium text-gray-900">{formatDate(invoice.issueDate, locale)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">{t('tankers.title')}</p>
            <p className="font-medium text-gray-900">
              {formatNumber(invoice._count.tankers, locale, 0)}
            </p>
          </div>
        </div>

        {invoice.notes && (
          <p className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
            {invoice.notes}
          </p>
        )}

        {/* Action buttons — left: navigation, right: state-changing */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
          {/* Left zone: Edit / View / Print */}
          <div className="flex items-center gap-2">
            {invoice.status === 'draft' && (
              <button
                onClick={onEdit}
                className="text-sm px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer"
              >
                {t('app.edit')}
              </button>
            )}
            <button
              onClick={onView}
              className="text-sm px-3 py-1.5 border border-gray-400 text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              {t('app.view')}
            </button>
            {invoice.status === 'final' && (
              <button
                onClick={onPrint}
                className="text-sm px-3 py-1.5 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center gap-1.5 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6v-8z" />
                </svg>
                {t('app.print')}
              </button>
            )}
          </div>

          {/* Right zone: Finalize | Cancel | Delete */}
          {invoice.status !== 'final' && (
            <div className="flex items-center divide-x divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
              {invoice.status === 'draft' && (
                <>
                  <button
                    onClick={onFinalize}
                    className="text-sm px-3 py-1.5 text-green-600 hover:bg-green-50 cursor-pointer"
                  >
                    {t('invoices.finalize')}
                  </button>
                  <button
                    onClick={onCancel}
                    className="text-sm px-3 py-1.5 text-orange-500 hover:bg-orange-50 cursor-pointer"
                  >
                    {t('invoices.cancel')}
                  </button>
                </>
              )}
              <button
                onClick={onDelete}
                className="text-sm px-3 py-1.5 text-red-600 hover:bg-red-50 cursor-pointer"
              >
                {t('app.delete')}
              </button>
            </div>
          )}
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
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setDeleteError(typeof msg === 'string' ? msg : t('errors.serverError'));
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
        <h1 className="text-xl font-bold text-gray-900">{t('invoices.title')}</h1>
        <button
          onClick={() => setShowNewModal(true)}
          className="bg-success-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer"
        >
          + {t('invoices.new')}
        </button>
      </div>

      {deleteError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
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
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
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
            className="w-full ps-9 pe-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
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
          onEdit={() => {
            setDetailInvoice(null);
            navigate(`/invoices/${detailInvoice.id}`);
          }}
          onView={() => {
            setDetailInvoice(null);
            navigate(`/invoices/${detailInvoice.id}`);
          }}
          onPrint={() => {
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
