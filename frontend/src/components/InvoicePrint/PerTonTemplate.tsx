import { useTranslation } from 'react-i18next'
import { formatNumber, formatDate } from '../../utils/formatting'
import PrintInvoiceHeader from './PrintInvoiceHeader'

interface Tanker {
  id: string
  tankerNumber: string
  entryDate: string
  port?: { name: string }
  tonnageBasis: string
  productWeight: number | string
  billWeight: number | string
  ratePerTonAfn: number | string
  ratePerTonUsd: number | string
  customerDebtAfn: number | string
  customerDebtUsd: number | string
}

interface Props {
  invoice: {
    invoiceNumber: string
    customer: { name: string }
    contract: { code: string }
    issueDate: string
    status: string
    tankers: Tanker[]
  }
}

export default function PerTonTemplate({ invoice }: Props) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language

  const totalAfn = invoice.tankers.reduce((s, r) => s + Number(r.customerDebtAfn ?? 0), 0)
  const totalUsd = invoice.tankers.reduce((s, r) => s + Number(r.customerDebtUsd ?? 0), 0)

  return (
    <div className="invoice-print-root">
      <PrintInvoiceHeader
        invoiceNumber={invoice.invoiceNumber}
        customerName={invoice.customer.name}
        contractCode={invoice.contract.code}
        issueDate={invoice.issueDate}
        status={invoice.status}
      />

      <table className="invoice-print-table">
        <thead>
          <tr>
            <th>#</th>
            <th>{t('tankers.tankerNumber')}</th>
            <th>{t('tankers.entryDate')}</th>
            <th>{t('tankers.port')}</th>
            <th>{t('tankers.tonnageBasis')}</th>
            <th>{t('tankers.productWeight')}</th>
            <th>{t('tankers.billWeight')}</th>
            <th>{t('tankers.ratePerTonAfn')}</th>
            <th>{t('tankers.ratePerTonUsd')}</th>
            <th>{t('tankers.customerDebtAfn')}</th>
            <th>{t('tankers.customerDebtUsd')}</th>
          </tr>
        </thead>
        <tbody>
          {invoice.tankers.map((tanker, i) => {
            const effectiveTonnage =
              tanker.tonnageBasis === 'bill_weight' ? tanker.billWeight : tanker.productWeight
            return (
              <tr key={tanker.id}>
                <td>{i + 1}</td>
                <td>{tanker.tankerNumber}</td>
                <td>{formatDate(tanker.entryDate, locale)}</td>
                <td>{tanker.port?.name ?? '—'}</td>
                <td>{t(`tankers.tonnageBasisOptions.${tanker.tonnageBasis}`)}</td>
                <td>{formatNumber(effectiveTonnage, locale)}</td>
                <td>{formatNumber(tanker.billWeight, locale)}</td>
                <td>{formatNumber(tanker.ratePerTonAfn, locale)}</td>
                <td>{formatNumber(tanker.ratePerTonUsd, locale)}</td>
                <td>{formatNumber(tanker.customerDebtAfn, locale)}</td>
                <td>{formatNumber(tanker.customerDebtUsd, locale)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="invoice-print-totals">
        <div className="invoice-print-totals-item">
          <label>{t('invoices.totalAfn')}</label>
          <span>{formatNumber(totalAfn, locale)} {t('currency.afn')}</span>
        </div>
        <div className="invoice-print-totals-item">
          <label>{t('invoices.totalUsd')}</label>
          <span>{formatNumber(totalUsd, locale)} {t('currency.usd')}</span>
        </div>
      </div>

      <div className="invoice-print-footer">
        <div className="invoice-print-signature">
          <div className="line">{t('auth.username')}</div>
        </div>
        <div className="invoice-print-signature">
          <div className="line">{t('accounts.title')}</div>
        </div>
        <div className="invoice-print-signature">
          <div className="line">{t('invoices.customer')}</div>
        </div>
      </div>
    </div>
  )
}
