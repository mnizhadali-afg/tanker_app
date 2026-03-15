import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DataTable, { type Column } from '../../components/shared/DataTable';
import Modal from '../../components/shared/Modal';
import DetailModal from '../../components/shared/DetailModal';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import PaymentFormPage from './PaymentFormPage';
import { formatDate, formatNumber } from '../../utils/formatting';
import api from '../../lib/axios';

interface Payment {
  id: string;
  type: string;
  linkedLevel: string;
  payerAccountId?: string;
  payeeAccountId?: string;
  monetaryAccountId?: string;
  customerId?: string;
  contractId?: string;
  invoiceId?: string;
  amountAfn?: number;
  amountUsd?: number;
  exchangeRate?: number;
  transactionDate: string;
  notes?: string;
  payer?: { name: string };
  payee?: { name: string };
  monetaryAccount?: { name: string };
  contract?: { code: string };
  invoice?: { invoiceNumber: string };
}

export default function PaymentsListPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [detailRow, setDetailRow] = useState<Payment | null>(null);
  const [modalId, setModalId] = useState<string | null | 'new'>(null);
  const [pendingDelete, setPendingDelete] = useState<Payment | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPayments = () => {
    api.get('/payments').then((r) => setPayments(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchPayments(); }, []);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/payments/monetary/${pendingDelete.id}`);
      setPayments((prev) => prev.filter((p) => p.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setDeleteError(typeof msg === 'string' ? msg : t('errors.serverError'));
      setPendingDelete(null);
    } finally { setDeleting(false); }
  };

  const q = search.trim().toLowerCase();
  const filtered = payments.filter((p) => {
    const matchesType = !typeFilter || p.type === typeFilter;
    const matchesSearch =
      !q ||
      (p.payer?.name ?? '').toLowerCase().includes(q) ||
      (p.payee?.name ?? '').toLowerCase().includes(q) ||
      (p.contract?.code ?? '').toLowerCase().includes(q) ||
      (p.invoice?.invoiceNumber ?? '').toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  const columns: Column<Payment>[] = [
    { key: 'type', label: t('payments.type'), render: (r) => t(`payments.types.${r.type}`) },
    { key: 'linkedLevel', label: t('payments.level'), render: (r) => t(`payments.levels.${r.linkedLevel}`) },
    { key: 'payer', label: t('payments.payer'), render: (r) => r.payer?.name ?? '—' },
    { key: 'payee', label: t('payments.payee'), render: (r) => r.payee?.name ?? '—' },
    { key: 'amountAfn', label: t('payments.amountAfn'), render: (r) => (r.amountAfn ? formatNumber(r.amountAfn, locale) : '—') },
    { key: 'amountUsd', label: t('payments.amountUsd'), render: (r) => (r.amountUsd ? formatNumber(r.amountUsd, locale) : '—') },
    { key: 'transactionDate', label: t('payments.transactionDate'), render: (r) => formatDate(r.transactionDate, locale) },
  ];

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-bold text-gray-900'>{t('payments.title')}</h1>
        <button
          onClick={() => setModalId('new')}
          className='bg-success-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer'
        >
          + {t('payments.new')}
        </button>
      </div>

      {deleteError && (
        <p className='text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2'>
          {deleteError}
        </p>
      )}

      <div className='flex items-center justify-between gap-3'>
        <div className='flex gap-2 flex-wrap'>
          {(['', 'payment_in', 'payment_out', 'exchange'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                typeFilter === type
                  ? 'bg-gray-600 text-white border-gray-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {type ? t(`payments.types.${type}`) : t('app.all')}
            </button>
          ))}
        </div>
        <div className='relative w-72'>
          <svg className='absolute inset-s-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
            <path strokeLinecap='round' strokeLinejoin='round' d='M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z' />
          </svg>
          <input type='text' value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`${t('app.search')}…`} className='w-full ps-9 pe-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white' />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        emptyMessage={t('app.noItems')}
        onRowClick={(r) => setDetailRow(r)}
        totalCount={payments.length}
        label={t('nav.payments')}
      />

      {detailRow && (
        <DetailModal
          title={t(`payments.types.${detailRow.type}`)}
          subtitle={
            <span className='text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full'>
              {t(`payments.levels.${detailRow.linkedLevel}`)}
            </span>
          }
          fields={[
            { label: t('payments.payer'), value: detailRow.payer?.name },
            { label: t('payments.payee'), value: detailRow.payee?.name },
            { label: t('payments.transactionDate'), value: formatDate(detailRow.transactionDate, locale) },
            { label: t('payments.amountAfn'), value: detailRow.amountAfn ? formatNumber(detailRow.amountAfn, locale) + ' ' + t('currency.afn') : undefined },
            { label: t('payments.amountUsd'), value: detailRow.amountUsd ? formatNumber(detailRow.amountUsd, locale) + ' ' + t('currency.usd') : undefined },
            ...(detailRow.monetaryAccount ? [{ label: t('payments.monetaryAccount'), value: detailRow.monetaryAccount.name }] : []),
            ...(detailRow.contract ? [{ label: t('contracts.code'), value: detailRow.contract.code }] : []),
            ...(detailRow.invoice ? [{ label: t('invoices.invoiceNumber'), value: detailRow.invoice.invoiceNumber }] : []),
            ...(detailRow.notes ? [{ label: t('app.notes'), value: detailRow.notes, wide: true }] : []),
          ]}
          onClose={() => setDetailRow(null)}
          actions={
            <>
              <button
                onClick={() => { setDetailRow(null); setPendingDelete(detailRow); }}
                className='px-4 py-2 text-sm border border-red-200 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer'
              >
                {t('app.delete')}
              </button>
              <button
                onClick={() => { setDetailRow(null); setModalId(detailRow.id); }}
                className='px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg cursor-pointer'
              >
                {t('app.edit')}
              </button>
            </>
          }
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={t('app.delete')}
          message={t('app.deleteConfirmMsg')}
          itemName={`${t(`payments.types.${pendingDelete.type}`)} — ${formatDate(pendingDelete.transactionDate, locale)}`}
          confirmLabel={t('app.delete')}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      {modalId !== null && (
        <Modal
          title={modalId === 'new' ? t('payments.new') : t('app.edit')}
          onClose={() => setModalId(null)}
        >
          <PaymentFormPage
            formId={modalId === 'new' ? undefined : modalId}
            initialData={modalId !== 'new' ? payments.find((p) => p.id === modalId) : undefined}
            onSuccess={() => { setModalId(null); fetchPayments(); }}
            onCancel={() => setModalId(null)}
          />
        </Modal>
      )}
    </div>
  );
}
