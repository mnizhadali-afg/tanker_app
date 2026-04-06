import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DataTable, { type Column } from '../../components/shared/DataTable';
import Modal from '../../components/shared/Modal';
import DetailModal from '../../components/shared/DetailModal';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import LicenseFormPage from './LicenseFormPage';
import { formatDate , extractApiError } from '../../utils/formatting';
import api from '../../lib/axios';

interface License {
  id: string;
  licenseNumber: string;
  product: { name: string };
  producer: { name: string };
  validFrom: string;
  validTo: string;
}

export default function LicensesListPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [detailRow, setDetailRow] = useState<License | null>(null);
  const [pendingDelete, setPendingDelete] = useState<License | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [modalId, setModalId] = useState<string | null | 'new'>(null);

  // Multi-select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchLicenses = () => {
    api.get('/licenses').then((r) => setLicenses(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchLicenses(); }, []);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/licenses/${pendingDelete.id}`);
      setLicenses((prev) => prev.filter((l) => l.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err: unknown) {
      setDeleteError(t(extractApiError(err)));
      setPendingDelete(null);
    } finally { setDeleting(false); }
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    setDeleteError('');
    try {
      await Promise.all([...selectedIds].map((id) => api.delete(`/licenses/${id}`)));
      setLicenses((prev) => prev.filter((l) => !selectedIds.has(l.id)));
      setSelectedIds(new Set());
      setShowBulkDelete(false);
    } catch (err: unknown) {
      setDeleteError(t(extractApiError(err)));
      setShowBulkDelete(false);
    } finally { setBulkDeleting(false); }
  };

  const q = search.trim().toLowerCase();
  const filtered = licenses.filter(
    (l) => !q || l.licenseNumber.toLowerCase().includes(q) || l.product.name.toLowerCase().includes(q) || l.producer.name.toLowerCase().includes(q),
  );

  const selectedNames = licenses.filter((l) => selectedIds.has(l.id)).map((l) => l.licenseNumber);

  const columns: Column<License>[] = [
    { key: 'licenseNumber', label: t('licenses.licenseNumber') },
    { key: 'product', label: t('licenses.product'), render: (r) => r.product.name },
    { key: 'producer', label: t('licenses.producer'), render: (r) => r.producer.name },
    { key: 'validFrom', label: t('licenses.validFrom'), render: (r) => formatDate(r.validFrom, locale) },
    { key: 'validTo', label: t('licenses.validTo'), render: (r) => formatDate(r.validTo, locale) },
  ];

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-bold text-gray-900 dark:text-slate-100'>{t('licenses.title')}</h1>
        <button
          onClick={() => setModalId('new')}
          className='bg-success-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer'
        >
          + {t('licenses.new')}
        </button>
      </div>

      {deleteError && (
        <p className='text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2'>
          {deleteError}
        </p>
      )}

      <div className='flex items-center justify-between gap-3'>
        {selectedIds.size > 0 ? (
          <div className='flex items-center gap-2'>
            <span className='inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 px-3 py-1.5 rounded-full'>
              <svg className='w-3.5 h-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2.5}>
                <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
              </svg>
              {selectedIds.size}
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className='text-sm text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 cursor-pointer transition-colors'
            >
              × {t('app.clearSelection')}
            </button>
          </div>
        ) : <div />}
        <div className='flex items-center gap-2'>
          {selectedIds.size > 0 && (
            <button
              onClick={() => setShowBulkDelete(true)}
              className='flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 hover:bg-red-50 px-3 py-1.5 rounded-lg cursor-pointer font-medium transition-colors'
            >
              <svg className='w-3.5 h-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                <path strokeLinecap='round' strokeLinejoin='round' d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
              </svg>
              {t('app.delete')}
            </button>
          )}
          <div className='relative w-72'>
            <svg className='absolute inset-s-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
              <path strokeLinecap='round' strokeLinejoin='round' d='M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z' />
            </svg>
            <input type='text' value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`${t('app.search')}…`} className='w-full ps-9 pe-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-slate-100' />
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        emptyMessage={t('app.noItems')}
        onRowClick={(r) => { setSelectedIds(new Set()); setDetailRow(r); }}
        totalCount={licenses.length}
        label={t('nav.licenses')}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      {detailRow && (
        <DetailModal
          title={detailRow.licenseNumber}
          fields={[
            { label: t('licenses.licenseNumber'), value: detailRow.licenseNumber },
            { label: t('licenses.product'), value: detailRow.product.name },
            { label: t('licenses.producer'), value: detailRow.producer.name },
            { label: t('licenses.validFrom'), value: formatDate(detailRow.validFrom, locale) },
            { label: t('licenses.validTo'), value: formatDate(detailRow.validTo, locale) },
          ]}
          onClose={() => setDetailRow(null)}
          onEdit={() => { setDetailRow(null); setModalId(detailRow.id); }}
          onDelete={() => { setDetailRow(null); setPendingDelete(detailRow); }}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={t('app.delete')}
          message={t('app.deleteConfirmMsg')}
          itemName={pendingDelete.licenseNumber}
          confirmLabel={t('app.delete')}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      {showBulkDelete && (
        <ConfirmDialog
          title={t('app.deleteSelected')}
          message={t('app.bulkDeleteConfirmMsg')}
          items={selectedNames}
          confirmLabel={t('app.delete')}
          loading={bulkDeleting}
          onConfirm={handleBulkDelete}
          onCancel={() => setShowBulkDelete(false)}
        />
      )}

      {modalId !== null && (
        <Modal
          title={modalId === 'new' ? t('licenses.new') : t('app.edit')}
          onClose={() => setModalId(null)}
        >
          <LicenseFormPage
            formId={modalId === 'new' ? undefined : modalId}
            onSuccess={() => { setModalId(null); fetchLicenses(); }}
            onCancel={() => setModalId(null)}
          />
        </Modal>
      )}
    </div>
  );
}
