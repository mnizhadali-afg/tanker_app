import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import DataTable, { type Column } from '../../components/shared/DataTable'
import StatusBadge from '../../components/shared/StatusBadge'
import { formatDate } from '../../utils/formatting'
import api from '../../lib/axios'

interface License {
  id: string
  licenseNumber: string
  product: { name: string }
  producer: { name: string }
  validFrom: string
  validTo: string
  isActive: boolean
}

export default function LicensesListPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const locale = i18n.language
  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/licenses').then((r) => setLicenses(r.data)).finally(() => setLoading(false))
  }, [])

  const columns: Column<License>[] = [
    { key: 'licenseNumber', label: t('licenses.licenseNumber') },
    { key: 'product', label: t('licenses.product'), render: (r) => r.product.name },
    { key: 'producer', label: t('licenses.producer'), render: (r) => r.producer.name },
    { key: 'validFrom', label: t('licenses.validFrom'), render: (r) => formatDate(r.validFrom, locale) },
    { key: 'validTo', label: t('licenses.validTo'), render: (r) => formatDate(r.validTo, locale) },
    {
      key: 'isActive',
      label: t('app.status'),
      render: (r) => <StatusBadge status={r.isActive ? 'active' : 'inactive'} label={t(r.isActive ? 'app.active' : 'app.inactive')} />,
    },
    {
      key: 'actions',
      label: t('app.actions'),
      render: (r) => (
        <button className="text-xs text-primary-600 hover:underline" onClick={(e) => { e.stopPropagation(); navigate(`/licenses/${r.id}/edit`) }}>
          {t('app.edit')}
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{t('licenses.title')}</h1>
        <button onClick={() => navigate('/licenses/new')} className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          + {t('licenses.new')}
        </button>
      </div>
      <DataTable columns={columns} rows={licenses} loading={loading} />
    </div>
  )
}
