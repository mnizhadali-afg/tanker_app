import { useTranslation } from 'react-i18next'
import { formatDate } from '../../utils/formatting'

interface Props {
  invoiceNumber: string
  customerName: string
  contractCode: string
  issueDate: string
  status: string
}

export default function PrintInvoiceHeader({
  invoiceNumber,
  customerName,
  contractCode,
  issueDate,
  status,
}: Props) {
  const { t, i18n } = useTranslation()

  return (
    <div className="invoice-print-header">
      <div>
        <h1>{t('app.title')}</h1>
        <p style={{ margin: 0, fontSize: 12, color: '#374151' }}>
          {t('invoices.title')} — {invoiceNumber}
        </p>
      </div>
      <div className="invoice-print-meta" style={{ gridTemplateColumns: 'repeat(4, auto)', marginBottom: 0 }}>
        <div className="invoice-print-meta-item">
          <label>{t('invoices.invoiceNumber')}</label>
          <span>{invoiceNumber}</span>
        </div>
        <div className="invoice-print-meta-item">
          <label>{t('invoices.customer')}</label>
          <span>{customerName}</span>
        </div>
        <div className="invoice-print-meta-item">
          <label>{t('invoices.contract')}</label>
          <span>{contractCode}</span>
        </div>
        <div className="invoice-print-meta-item">
          <label>{t('invoices.issueDate')}</label>
          <span>{formatDate(issueDate, i18n.language)}</span>
        </div>
        <div className="invoice-print-meta-item">
          <label>{t('invoices.status')}</label>
          <span>{t(`invoices.statuses.${status}`)}</span>
        </div>
      </div>
    </div>
  )
}
