import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DataTable, { type Column } from '../../components/shared/DataTable';
import Modal from '../../components/shared/Modal';
import DetailModal from '../../components/shared/DetailModal';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import ContractFormPage from './ContractFormPage';
import api from '../../lib/axios';

interface Contract {
  id: string;
  code: string;
  customer: { name: string };
  product: { name: string };
  calculationType: string;
}

export default function ContractsListPage() {
  const { t } = useTranslation();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [detailRow, setDetailRow] = useState<Contract | null>(null);
  const [invoiceCount, setInvoiceCount] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Contract | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [modalId, setModalId] = useState<string | null | 'new'>(null);

  const fetchContracts = () => {
    api.get('/contracts').then((r) => setContracts(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchContracts(); }, []);

  useEffect(() => {
    if (!detailRow) { setInvoiceCount(null); return; }
    setInvoiceCount(null);
    api.get(`/contracts/${detailRow.id}`).then((r) => {
      setInvoiceCount(r.data._count?.invoices ?? 0);
    });
  }, [detailRow?.id]);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/contracts/${pendingDelete.id}`);
      setContracts((prev) => prev.filter((c) => c.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setDeleteError(status === 409 ? t('contracts.deleteBlockedByInvoices') : t('errors.serverError'));
      setPendingDelete(null);
    } finally { setDeleting(false); }
  };

  const q = search.trim().toLowerCase();
  const filtered = contracts.filter(
    (c) => !q || c.code.toLowerCase().includes(q) || c.customer.name.toLowerCase().includes(q) || c.product.name.toLowerCase().includes(q),
  );

  const columns: Column<Contract>[] = [
    { key: 'code', label: t('contracts.code') },
    { key: 'customer', label: t('contracts.customer'), render: (r) => r.customer.name },
    { key: 'product', label: t('contracts.product'), render: (r) => r.product.name },
    { key: 'calculationType', label: t('contracts.calculationType'), render: (r) => t(`contracts.calculationTypes.${r.calculationType}`) },
  ];

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-bold text-gray-900 dark:text-slate-100'>{t('contracts.title')}</h1>
        <button
          onClick={() => setModalId('new')}
          className='bg-success-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer'
        >
          + {t('contracts.new')}
        </button>
      </div>

      {deleteError && (
        <p className='text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2'>
          {deleteError}
        </p>
      )}

      <div className='flex justify-end'>
        <div className='relative w-72'>
          <svg className='absolute inset-s-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
            <path strokeLinecap='round' strokeLinejoin='round' d='M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z' />
          </svg>
          <input type='text' value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`${t('app.search')}…`} className='w-full ps-9 pe-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-slate-100' />
        </div>
      </div>

      <DataTable columns={columns} rows={filtered} loading={loading} emptyMessage={t('app.noItems')} onRowClick={(r) => setDetailRow(r)} totalCount={contracts.length} label={t('nav.contracts')} />

      {detailRow && (
        <DetailModal
          title={detailRow.code}
          fields={[
            { label: t('contracts.code'), value: detailRow.code },
            { label: t('contracts.calculationType'), value: t(`contracts.calculationTypes.${detailRow.calculationType}`) },
            { label: t('contracts.customer'), value: detailRow.customer.name },
            { label: t('contracts.product'), value: detailRow.product.name },
            {
              label: t('contracts.linkedInvoices'),
              value: invoiceCount === null
                ? <span className="text-gray-400 text-xs">{t('app.loading')}</span>
                : <span className={invoiceCount > 0 ? 'text-amber-600 font-semibold' : 'text-gray-800'}>{invoiceCount}</span>,
            },
          ]}
          onClose={() => setDetailRow(null)}
          onEdit={() => { setDetailRow(null); setModalId(detailRow.id); }}
          onDelete={() => { setDetailRow(null); setPendingDelete(detailRow); }}
          deleteDisabled={invoiceCount === null || invoiceCount > 0}
          deleteDisabledReason={invoiceCount !== null && invoiceCount > 0 ? t('contracts.deleteBlockedByInvoices') : undefined}
          lifecycleNote={invoiceCount !== null && invoiceCount > 0 ? <>{t('contracts.deleteBlockedByInvoices')}</> : undefined}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={t('app.delete')}
          message={t('app.deleteConfirmMsg')}
          itemName={pendingDelete.code}
          confirmLabel={t('app.delete')}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      {modalId !== null && (
        <Modal
          title={modalId === 'new' ? t('contracts.new') : t('app.edit')}
          onClose={() => setModalId(null)}
          size="lg"
        >
          <ContractFormPage
            formId={modalId === 'new' ? undefined : modalId}
            onSuccess={() => { setModalId(null); fetchContracts(); }}
            onCancel={() => setModalId(null)}
          />
        </Modal>
      )}
    </div>
  );
}
