import { useTranslation } from 'react-i18next'
import { formatNumber, formatDate } from '../../utils/formatting'
import PrintInvoiceHeader from './PrintInvoiceHeader'
import { TANKER_COLUMNS, getZeroColumns } from '../TankerGrid/columnDefs'

interface Tanker extends Record<string, unknown> {
  id: string
  tankerNumber: string
  entryDate: string
  port?: { name: string }
  exchangeRate: number | string
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

export default function CostBasedUsdTemplate({ invoice }: Props) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language

  const costCols = TANKER_COLUMNS.filter(
    (c) =>
      c.type === 'number' &&
      !c.isProducer &&
      !c.isCalculated &&
      c.group !== 'per-ton' &&
      !['productWeight', 'billWeight', 'commodityPercentDebt'].includes(c.key),
  )

  const zeroCols = getZeroColumns(invoice.tankers as Record<string, unknown>[], costCols)
  const visibleCols = costCols.filter((c) => !zeroCols.has(c.key))

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
            {visibleCols.map((col) => (
              <th key={col.key}>{t(col.labelKey)}</th>
            ))}
            <th>{t('tankers.exchangeRate')}</th>
            <th>{t('tankers.customerDebtUsd')}</th>
          </tr>
        </thead>
        <tbody>
          {invoice.tankers.map((tanker, i) => (
            <tr key={tanker.id || (tanker._localId as string) || i}>
              <td>{i + 1}</td>
              <td>{tanker.tankerNumber}</td>
              <td>{formatDate(tanker.entryDate as string, locale)}</td>
              <td>{(tanker.port as { name: string } | undefined)?.name ?? '—'}</td>
              {visibleCols.map((col) => (
                <td key={col.key}>{formatNumber(tanker[col.key] as number, locale)}</td>
              ))}
              <td>{formatNumber(tanker.exchangeRate as number, locale)}</td>
              <td>{formatNumber(tanker.customerDebtUsd as number, locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="invoice-print-totals">
        <div className="invoice-print-totals-item">
          <label>{t('invoices.totalUsd')}</label>
          <span>{formatNumber(totalUsd, locale)} {t('currency.usd')}</span>
        </div>
      </div>

      <div className="invoice-print-footer">
        <div className="invoice-print-signature"><div className="line">{t('auth.username')}</div></div>
        <div className="invoice-print-signature"><div className="line">{t('accounts.title')}</div></div>
        <div className="invoice-print-signature"><div className="line">{t('invoices.customer')}</div></div>
      </div>
    </div>
  )
}
