import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DataTable, { type Column } from '../../components/shared/DataTable';
import Modal from '../../components/shared/Modal';
import DetailModal from '../../components/shared/DetailModal';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import LicenseFormPage from './LicenseFormPage';
import { formatDate } from '../../utils/formatting';
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
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setDeleteError(typeof msg === 'string' ? msg : t('errors.serverError'));
      setPendingDelete(null);
    } finally { setDeleting(false); }
  };

  const q = search.trim().toLowerCase();
  const filtered = licenses.filter(
    (l) => !q || l.licenseNumber.toLowerCase().includes(q) || l.product.name.toLowerCase().includes(q) || l.producer.name.toLowerCase().includes(q),
  );

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
        <h1 className='text-xl font-bold text-gray-900'>{t('licenses.title')}</h1>
        <button
          onClick={() => setModalId('new')}
          className='bg-success-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer'
        >
          + {t('licenses.new')}
        </button>
      </div>

      {deleteError && (
        <p className='text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2'>
          {deleteError}
        </p>
      )}

      <div className='flex justify-end'>
        <div className='relative w-72'>
          <svg className='absolute inset-s-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
            <path strokeLinecap='round' strokeLinejoin='round' d='M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z' />
          </svg>
          <input type='text' value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`${t('app.search')}…`} className='w-full ps-9 pe-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white' />
        </div>
      </div>

      <DataTable columns={columns} rows={filtered} loading={loading} emptyMessage={t('app.noItems')} onRowClick={(r) => setDetailRow(r)} totalCount={licenses.length} label={t('nav.licenses')} />

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
          itemName={pendingDelete.licenseNumber}
          confirmLabel={t('app.delete')}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setPendingDelete(null)}
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
