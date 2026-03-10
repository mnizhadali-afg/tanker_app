import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import DataTable, { type Column } from '../../components/shared/DataTable'
import StatusBadge from '../../components/shared/StatusBadge'
import api from '../../lib/axios'

interface Contract {
  id: string
  code: string
  customer: { name: string }
  product: { name: string }
  calculationType: string
  isActive: boolean
}

export default function ContractsListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/contracts').then((r) => setContracts(r.data)).finally(() => setLoading(false))
  }, [])

  const columns: Column<Contract>[] = [
    { key: 'code', label: t('contracts.code') },
    { key: 'customer', label: t('contracts.customer'), render: (r) => r.customer.name },
    { key: 'product', label: t('contracts.product'), render: (r) => r.product.name },
    {
      key: 'calculationType',
      label: t('contracts.calculationType'),
      render: (r) => t(`contracts.calculationTypes.${r.calculationType}`),
    },
    {
      key: 'isActive',
      label: t('app.status'),
      render: (r) => <StatusBadge status={r.isActive ? 'active' : 'inactive'} label={t(r.isActive ? 'app.active' : 'app.inactive')} />,
    },
    {
      key: 'actions',
      label: t('app.actions'),
      render: (r) => (
        <button className="text-xs text-primary-600 hover:underline" onClick={(e) => { e.stopPropagation(); navigate(`/contracts/${r.id}/edit`) }}>
          {t('app.edit')}
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{t('contracts.title')}</h1>
        <button onClick={() => navigate('/contracts/new')} className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          + {t('contracts.new')}
        </button>
      </div>
      <DataTable columns={columns} rows={contracts} loading={loading} />
    </div>
  )
}
