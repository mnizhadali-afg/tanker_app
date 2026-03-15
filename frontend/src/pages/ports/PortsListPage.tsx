import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DataTable, { type Column } from '../../components/shared/DataTable';
import Modal from '../../components/shared/Modal';
import DetailModal from '../../components/shared/DetailModal';
import PortFormPage from './PortFormPage';
import api from '../../lib/axios';

interface Port {
  id: string;
  name: string;
  producer: { name: string };
}

export default function PortsListPage() {
  const { t } = useTranslation();
  const [ports, setPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [detailRow, setDetailRow] = useState<Port | null>(null);
  const [modalId, setModalId] = useState<string | null | 'new'>(null);

  const fetchPorts = () => {
    api.get('/ports').then((r) => setPorts(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchPorts(); }, []);

  const handleDelete = async (port: Port) => {
    if (!confirm(t('app.confirm') + ': ' + port.name + '?')) return;
    setDeleteError('');
    setDetailRow(null);
    try {
      await api.delete(`/ports/${port.id}`);
      setPorts((prev) => prev.filter((p) => p.id !== port.id));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setDeleteError(typeof msg === 'string' ? msg : t('errors.serverError'));
    }
  };

  const q = search.trim().toLowerCase();
  const filtered = ports.filter(
    (p) => !q || p.name.toLowerCase().includes(q) || p.producer.name.toLowerCase().includes(q),
  );

  const columns: Column<Port>[] = [
    { key: 'name', label: t('ports.name') },
    { key: 'producer', label: t('ports.producer'), render: (r) => r.producer.name },
  ];

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-bold text-gray-900'>{t('ports.title')}</h1>
        <button
          onClick={() => setModalId('new')}
          className='bg-success-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer'
        >
          + {t('ports.new')}
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

      <DataTable columns={columns} rows={filtered} loading={loading} emptyMessage={t('app.noItems')} onRowClick={(r) => setDetailRow(r)} totalCount={ports.length} label={t('nav.ports')} />

      {detailRow && (
        <DetailModal
          title={detailRow.name}
          fields={[
            { label: t('ports.name'), value: detailRow.name },
            { label: t('ports.producer'), value: detailRow.producer.name },
          ]}
          onClose={() => setDetailRow(null)}
          actions={
            <>
              <button
                onClick={() => { setDetailRow(null); handleDelete(detailRow); }}
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

      {modalId !== null && (
        <Modal
          title={modalId === 'new' ? t('ports.new') : t('app.edit')}
          onClose={() => setModalId(null)}
        >
          <PortFormPage
            formId={modalId === 'new' ? undefined : modalId}
            onSuccess={() => { setModalId(null); fetchPorts(); }}
            onCancel={() => setModalId(null)}
          />
        </Modal>
      )}
    </div>
  );
}
