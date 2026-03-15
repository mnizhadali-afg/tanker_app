import { useTranslation } from 'react-i18next'
import ConfirmDialog from '../../../components/shared/ConfirmDialog'

interface Props {
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export default function DeleteDialog({ onConfirm, onCancel, loading }: Props) {
  const { t } = useTranslation()
  return (
    <ConfirmDialog
      title={t('app.delete')}
      message={t('invoices.deleteConfirm')}
      confirmLabel={t('app.delete')}
      variant="danger"
      loading={loading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}
