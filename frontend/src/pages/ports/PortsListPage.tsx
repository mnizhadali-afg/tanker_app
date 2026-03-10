import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import DataTable, { type Column } from '../../components/shared/DataTable'
import StatusBadge from '../../components/shared/StatusBadge'
import api from '../../lib/axios'

interface Port { id: string; name: string; producer: { name: string }; isActive: boolean }

export default function PortsListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [ports, setPorts] = useState<Port[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/ports').then((r) => setPorts(r.data)).finally(() => setLoading(false))
  }, [])

  const columns: Column<Port>[] = [
    { key: 'name', label: t('ports.name') },
    { key: 'producer', label: t('ports.producer'), render: (r) => r.producer.name },
    {
      key: 'isActive',
      label: t('app.status'),
      render: (r) => <StatusBadge status={r.isActive ? 'active' : 'inactive'} label={t(r.isActive ? 'app.active' : 'app.inactive')} />,
    },
    {
      key: 'actions',
      label: t('app.actions'),
      render: (r) => (
        <button className="text-xs text-primary-600 hover:underline" onClick={(e) => { e.stopPropagation(); navigate(`/ports/${r.id}/edit`) }}>
          {t('app.edit')}
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{t('ports.title')}</h1>
        <button onClick={() => navigate('/ports/new')} className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          + {t('ports.new')}
        </button>
      </div>
      <DataTable columns={columns} rows={ports} loading={loading} />
    </div>
  )
}
